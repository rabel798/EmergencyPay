import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

interface StablecoinRate {
  symbol: string;
  name: string;
  logo: string;
  balanceKey: string;
}

const STABLECOINS: StablecoinRate[] = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
    balanceKey: 'usdc_balance'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    balanceKey: 'usdt_balance'
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    balanceKey: 'dai_balance'
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1aBaEA1f7C830bD89Acc67eC4af3c3D4BDE1ff46/logo.png',
    balanceKey: 'eurc_balance'
  }
];

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK'];

const StablecoinConverter: React.FC = () => {
  const { currentUser } = useAppContext();
  const [fromStablecoin, setFromStablecoin] = useState<StablecoinRate>(STABLECOINS[0]);
  const [toStablecoin, setToStablecoin] = useState<StablecoinRate>(STABLECOINS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [rates, setRates] = useState<any>({});
  const [balances, setBalances] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('/api/stablecoin/rates');
        const data = await response.json();
        setRates(data);
      } catch (err) {
        console.error('Error fetching rates:', err);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await fetch(`/api/stablecoin/balance/${currentUser.id}`);
        const data = await response.json();
        setBalances(data);
      } catch (err) {
        console.error('Error fetching balances:', err);
      }
    };

    fetchBalances();
  }, [currentUser?.id]);

  // Calculate conversion rate
  useEffect(() => {
    if (rates[fromStablecoin.symbol.toLowerCase()] && rates[toStablecoin.symbol.toLowerCase()]) {
      const fromRate = rates[fromStablecoin.symbol.toLowerCase()][selectedCurrency.toLowerCase()] || 1;
      const toRate = rates[toStablecoin.symbol.toLowerCase()][selectedCurrency.toLowerCase()] || 1;
      const rate = toRate / fromRate;
      setExchangeRate(rate);

      if (fromAmount) {
        setToAmount((parseFloat(fromAmount) * rate).toFixed(8));
      }
    }
  }, [fromStablecoin, toStablecoin, selectedCurrency, rates, fromAmount]);

  const handleConvert = async () => {
    if (!currentUser?.id) {
      setError('User not logged in');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (balances[fromStablecoin.balanceKey] < parseFloat(fromAmount)) {
      setError(`Insufficient ${fromStablecoin.symbol} balance`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/stablecoin/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          from_currency: fromStablecoin.symbol,
          to_currency: toStablecoin.symbol,
          from_amount: parseFloat(fromAmount),
          exchange_rate: exchangeRate
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`✅ Converted ${fromAmount} ${fromStablecoin.symbol} to ${toAmount} ${toStablecoin.symbol}`);
        setFromAmount('');
        setToAmount('');

        // Refresh balances
        const balanceResponse = await fetch(`/api/stablecoin/balance/${currentUser.id}`);
        const updatedBalances = await balanceResponse.json();
        setBalances(updatedBalances);

        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Conversion failed');
      }
    } catch (err: any) {
      setError(err.message || 'Conversion error');
    } finally {
      setLoading(false);
    }
  };

  const swapStablecoins = () => {
    setFromStablecoin(toStablecoin);
    setToStablecoin(fromStablecoin);
    setFromAmount('');
    setToAmount('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Stablecoin Converter</h1>
      <p className="text-gray-600 mb-6">Zero fees • Real-time rates • Instant conversions</p>

      {/* Currency Selector */}
      <div className="mb-6 flex gap-2">
        <label className="text-sm font-semibold text-gray-700">Base Currency:</label>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {CURRENCIES.map(curr => (
            <option key={curr} value={curr}>{curr}</option>
          ))}
        </select>
      </div>

      {/* From Stablecoin */}
      <div className="bg-white p-6 rounded-xl mb-4 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-semibold text-gray-700">From</label>
          <span className="text-xs text-gray-500">
            Balance: {(balances[fromStablecoin.balanceKey] || 0).toFixed(2)} {fromStablecoin.symbol}
          </span>
        </div>

        {/* Stablecoin Selection */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {STABLECOINS.map((coin) => (
            <motion.button
              key={coin.symbol}
              onClick={() => setFromStablecoin(coin)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                fromStablecoin.symbol === coin.symbol
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <img src={coin.logo} alt={coin.symbol} className="w-6 h-6 rounded-full" onError={(e) => {
                (e.target as any).style.display = 'none';
              }} />
              <span className="text-xs font-semibold">{coin.symbol}</span>
            </motion.button>
          ))}
        </div>

        {/* Amount Input */}
        <input
          type="number"
          value={fromAmount}
          onChange={(e) => setFromAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-2xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
        />
      </div>

      {/* Swap Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 180 }}
        whileTap={{ scale: 0.9 }}
        onClick={swapStablecoins}
        className="w-full mb-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
      >
        ⇅ Swap
      </motion.button>

      {/* To Stablecoin */}
      <div className="bg-white p-6 rounded-xl mb-4 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <label className="text-sm font-semibold text-gray-700">To</label>
          <span className="text-xs text-gray-500">
            Balance: {(balances[toStablecoin.balanceKey] || 0).toFixed(2)} {toStablecoin.symbol}
          </span>
        </div>

        {/* Stablecoin Selection */}
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
          {STABLECOINS.map((coin) => (
            <motion.button
              key={coin.symbol}
              onClick={() => setToStablecoin(coin)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                toStablecoin.symbol === coin.symbol
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <img src={coin.logo} alt={coin.symbol} className="w-6 h-6 rounded-full" onError={(e) => {
                (e.target as any).style.display = 'none';
              }} />
              <span className="text-xs font-semibold">{coin.symbol}</span>
            </motion.button>
          ))}
        </div>

        {/* Amount Display */}
        <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-2xl font-bold text-gray-800 bg-gray-50">
          {toAmount || '0.00'}
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-900">
          💱 1 {fromStablecoin.symbol} = {exchangeRate.toFixed(8)} {toStablecoin.symbol}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4"
        >
          {error}
        </motion.div>
      )}

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4"
        >
          {success}
        </motion.div>
      )}

      {/* Convert Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConvert}
        disabled={loading || !fromAmount}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-lg transition-all shadow-lg"
      >
        {loading ? '⏳ Converting...' : `Convert ${fromStablecoin.symbol} to ${toStablecoin.symbol}`}
      </motion.button>

      {/* Info Box */}
      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          ✨ <strong>Zero Fees:</strong> All conversions are fee-free. Exchange rates update every 30 seconds from CoinGecko.
        </p>
      </div>
    </motion.div>
  );
};

export default StablecoinConverter;
