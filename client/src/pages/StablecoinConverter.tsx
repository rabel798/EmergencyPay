import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

interface Stablecoin {
  symbol: string;
  name: string;
  icon: string;
  color: string;
}

const stablecoins: Stablecoin[] = [
  { symbol: 'USDC', name: 'USD Coin', icon: '₮', color: '#2775CA' },
  { symbol: 'USDT', name: 'Tether', icon: '⊙', color: '#26A17B' },
  { symbol: 'DAI', name: 'Dai', icon: '◆', color: '#F5AF37' },
  { symbol: 'EURC', name: 'Euro Coin', icon: '€', color: '#0052CC' },
  { symbol: 'PYUSD', name: 'PayPal USD', icon: 'P', color: '#003087' },
  { symbol: 'USDP', name: 'Pax Dollar', icon: 'U', color: '#0070BA' },
];

interface ExchangeRate {
  [key: string]: { [key: string]: number };
}

const StablecoinConverter: React.FC = () => {
  const { currentUser } = useAppContext();
  const [rates, setRates] = useState<ExchangeRate>({});
  const [balances, setBalances] = useState<any>(null);
  const [fromCoin, setFromCoin] = useState('USDC');
  const [toCoin, setToCoin] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const currencies = ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];

  // Fetch rates and balances
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ratesRes = await fetch('/api/stablecoin/rates');
        const ratesData = await ratesRes.json();
        setRates(ratesData);

        if (currentUser?.id) {
          const balanceRes = await fetch(`/api/stablecoin/balance/${currentUser.id}`);
          const balanceData = await balanceRes.json();
          setBalances(balanceData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Calculate conversion
  useEffect(() => {
    if (!amount || !rates[fromCoin]?.[selectedCurrency]) return;

    const fromRate = rates[fromCoin]?.[selectedCurrency] || 1;
    const toRate = rates[toCoin]?.[selectedCurrency] || 1;
    const converted = (parseFloat(amount) * (fromRate / toRate)).toFixed(8);
    setConvertedAmount(converted);
  }, [amount, fromCoin, toCoin, rates, selectedCurrency]);

  const handleConvert = async () => {
    if (!amount || !convertedAmount) return;

    try {
      setConverting(true);
      const fromRate = rates[fromCoin]?.[selectedCurrency] || 1;
      const toRate = rates[toCoin]?.[selectedCurrency] || 1;
      const exchangeRate = fromRate / toRate;

      const response = await fetch('/api/stablecoin/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id,
          from_currency: fromCoin,
          to_currency: toCoin,
          from_amount: parseFloat(amount),
          exchange_rate: exchangeRate
        })
      });

      if (response.ok) {
        setAmount('');
        setConvertedAmount('');
        
        // Refresh balances
        const balanceRes = await fetch(`/api/stablecoin/balance/${currentUser?.id}`);
        const balanceData = await balanceRes.json();
        setBalances(balanceData);
      }
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setConverting(false);
    }
  };

  const getStablecoinLogo = (symbol: string) => {
    const coin = stablecoins.find(c => c.symbol === symbol);
    return coin?.icon || symbol[0];
  };

  const getStablecoinColor = (symbol: string) => {
    const coin = stablecoins.find(c => c.symbol === symbol);
    return coin?.color || '#666';
  };

  const getBalance = (symbol: string) => {
    if (!balances) return 0;
    const balanceKey = `${symbol.toLowerCase()}_balance`;
    return balances[balanceKey] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <i className="ri-loader-4-line text-3xl text-primary"></i>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 flex flex-col bg-gray-50 pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Stablecoin Converter</h1>
        <p className="text-gray-600 text-sm mt-1">Zero fees • Real-time rates</p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-6">
        {/* Currency Selector */}
        <motion.div
          className="mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-gray-700 mb-3">Base Currency</label>
          <div className="grid grid-cols-4 gap-2">
            {currencies.map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                  selectedCurrency === curr
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </motion.div>

        {/* From Coin Card */}
        <motion.div
          className="bg-white rounded-xl p-4 mb-4 border border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">You Send</label>
            <span className="text-xs text-gray-500">
              Balance: {getBalance(fromCoin).toFixed(2)} {fromCoin}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <select
              value={fromCoin}
              onChange={(e) => setFromCoin(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 font-medium"
            >
              {stablecoins.map((coin) => (
                <option key={coin.symbol} value={coin.symbol}>
                  {coin.symbol} - {coin.name}
                </option>
              ))}
            </select>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md"
              style={{ backgroundColor: getStablecoinColor(fromCoin) }}
            >
              {getStablecoinLogo(fromCoin)}
            </div>
          </div>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg font-medium"
          />
        </motion.div>

        {/* Exchange Rate Info */}
        {amount && convertedAmount && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-gray-700">
                Exchange Rate: 1 {fromCoin} = {(parseFloat(convertedAmount) / parseFloat(amount)).toFixed(6)} {toCoin}
              </span>
              <i className="ri-refresh-line text-primary cursor-pointer"></i>
            </div>
          </motion.div>
        )}

        {/* Swap Button */}
        <motion.div className="flex justify-center mb-4" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <button
            onClick={() => {
              setFromCoin(toCoin);
              setToCoin(fromCoin);
              setAmount('');
              setConvertedAmount('');
            }}
            className="bg-primary text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <i className="ri-arrow-up-down-line text-xl"></i>
          </button>
        </motion.div>

        {/* To Coin Card */}
        <motion.div
          className="bg-white rounded-xl p-4 mb-6 border border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">You Receive</label>
            <span className="text-xs text-gray-500">
              Balance: {getBalance(toCoin).toFixed(2)} {toCoin}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <select
              value={toCoin}
              onChange={(e) => setToCoin(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 font-medium"
            >
              {stablecoins.map((coin) => (
                <option key={coin.symbol} value={coin.symbol}>
                  {coin.symbol} - {coin.name}
                </option>
              ))}
            </select>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md"
              style={{ backgroundColor: getStablecoinColor(toCoin) }}
            >
              {getStablecoinLogo(toCoin)}
            </div>
          </div>

          <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg font-medium text-gray-900">
            {convertedAmount || '0.00'} {toCoin}
          </div>
        </motion.div>

        {/* Stablecoin Holdings */}
        <motion.div
          className="bg-white rounded-xl p-4 mb-6 border border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-medium text-gray-900 mb-4">Your Holdings</h3>
          <div className="space-y-2">
            {stablecoins.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: coin.color }}
                  >
                    {getStablecoinLogo(coin.symbol)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{coin.symbol}</p>
                    <p className="text-xs text-gray-500">{coin.name}</p>
                  </div>
                </div>
                <p className="font-medium text-gray-900">{getBalance(coin.symbol).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Convert Button */}
      <motion.div
        className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-white border-t border-gray-200"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={handleConvert}
          disabled={!amount || !convertedAmount || converting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-4 rounded-lg font-medium transition-all ${
            amount && convertedAmount && !converting
              ? 'bg-primary text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {converting ? (
            <span className="flex items-center justify-center gap-2">
              <i className="ri-loader-4-line animate-spin"></i>
              Converting...
            </span>
          ) : (
            `Convert ${fromCoin} to ${toCoin}`
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default StablecoinConverter;
