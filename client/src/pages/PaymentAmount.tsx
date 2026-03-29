import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

const PaymentAmount: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { 
    merchants, 
    connectionStatus, 
    isEmergencyMode, 
    selectedMerchant,
    selectMerchant,
    initiatePayment
  } = useAppContext();

  const [amount, setAmount] = useState('450.00');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parsedAmountToPay, setParsedAmountToPay] = useState<number>(0);

  useEffect(() => {
    // If there's no selected merchant but we have an ID, find the merchant
    if ((!selectedMerchant || selectedMerchant.id !== parseInt(id || '0')) && id) {
      const merchant = merchants.find(m => m.id === parseInt(id));
      if (merchant) {
        // Select this merchant in context
        console.log("Found merchant, selecting:", merchant);
        selectMerchant(merchant);
      } else {
        console.log("Merchant not found, redirecting");
        navigate('/');
      }
    }
  }, [selectedMerchant, id, merchants, navigate, selectMerchant]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const handleInitiatePayment = () => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setParsedAmountToPay(parsedAmount);
    setShowConfirmation(true);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleConfirmPayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setShowConfirmation(false);

    try {
      // Attempt to initiate payment
      const transaction = await initiatePayment(parsedAmountToPay);

      // Check if we got a transaction back or if socket received a transaction update
      if (transaction && transaction.id) {
        console.log("Payment successful, transaction:", transaction);
        // Navigate to success page with transaction ID
        navigate(`/payment-success/${transaction.id}`);
        // Clear selected merchant after successful payment
        selectMerchant(null);
      } else {
        // We didn't get a transaction object from the API call
        // But the backend might still have processed it successfully
        // So we'll check if there are any recent transactions for this merchant

        // Wait a bit to allow any Socket.IO updates to complete
        setTimeout(async () => {
          // Check if payment was actually successful despite the error
          navigate('/transactions');
          toast({
            title: "Transaction Status Unclear",
            description: "Please check your transaction history",
            duration: 5000,
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "An error occurred during payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!selectedMerchant) {
    return null; // Or a loading spinner
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-white z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={handleGoBack}
          className="h-10 w-10 flex items-center justify-center rounded-full"
          disabled={isProcessing}
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Make Payment</h2>
        <div className="h-10 w-10"></div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="p-4 text-center">
          <motion.div 
            className="mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
              <i className="ri-store-2-line text-2xl text-primary"></i>
            </div>
            <h3 className="text-xl font-semibold mt-2">{selectedMerchant.name}</h3>
            <p className="text-gray-500 text-sm">{selectedMerchant.category.charAt(0).toUpperCase() + selectedMerchant.category.slice(1)} Store</p>
          </motion.div>

          <motion.div 
            className="my-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <p className="text-gray-500 mb-2">Enter Amount</p>
            <div className="flex items-center justify-center text-4xl font-bold">
              <span className="text-gray-400 mr-1">₹</span>
              <input 
                type="text" 
                value={amount} 
                onChange={handleAmountChange}
                className="w-40 text-center outline-none bg-transparent"
                disabled={isProcessing}
              />
            </div>
          </motion.div>

          <motion.div 
            className="bg-gray-50 rounded-lg p-4 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Mode</span>
              {connectionStatus === 'online' ? (
                <span className="text-green-600 font-medium flex items-center">
                  <i className="ri-bank-line mr-1"></i> UPI (Online)
                </span>
              ) : (
                <span className="text-gray-800 font-medium flex items-center">
                  <i className="ri-bluetooth-line mr-1"></i> Bluetooth (Offline)
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              {connectionStatus === 'online' ? (
                <span className="text-green-600 font-medium">Real-time Processing</span>
              ) : (
                <span className="text-amber-600 font-medium">Will sync when online</span>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="space-y-2 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <button 
              onClick={handleInitiatePayment}
              className="w-full bg-primary text-white font-medium py-3 rounded-lg disabled:opacity-70"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
            <button 
              onClick={handleGoBack}
              className="w-full bg-gray-200 text-gray-800 font-medium py-3 rounded-lg"
              disabled={isProcessing}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      </div>
      {/* Confirmation Dialog */}
      {showConfirmation && selectedMerchant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <motion.div 
            className="bg-white rounded-xl p-6 m-4 max-w-sm w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Payment</h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 text-sm">You are about to pay</p>
                <p className="text-2xl font-bold text-gray-800">₹{parsedAmountToPay.toFixed(2)}</p>
                <p className="text-gray-600 text-sm">to</p>
                <div className="my-2 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <i className="ri-store-2-line text-lg text-primary"></i>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{selectedMerchant.name}</p>
                    <p className="text-xs text-gray-500">{selectedMerchant.category}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Please confirm that you want to make this payment.
                {connectionStatus === 'online' ? (
                  <span> This transaction will be processed online via UPI in real-time.</span>
                ) : (
                  <span className="text-amber-600 font-medium"> This transaction will be processed in offline mode and synced when connectivity is restored.</span>
                )}
              </p>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={handleCancelConfirmation}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPayment}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg disabled:opacity-70"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentAmount;