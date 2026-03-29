import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Transaction } from '@shared/schema';

const PaymentSuccess: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { transactions, merchants, currentUser, refreshTransactions } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [merchant, setMerchant] = useState<any | null>(null);
  const [receiverName, setReceiverName] = useState<string>('');
  
  useEffect(() => {
    // Refresh transactions to make sure we have the latest data
    refreshTransactions();
    
    // If we have an invalid ID, navigate back to home
    if (!id || id === 'undefined') {
      console.error('Invalid transaction ID:', id);
      navigate('/');
      return;
    }
    
    // Function to fetch transaction data
    const fetchTransactionData = async () => {
      try {
        // Find the transaction in our local state
        const foundTransaction = transactions.find(t => t.id === parseInt(id));
        
        if (foundTransaction) {
          console.log('Found transaction:', foundTransaction);
          setTransaction(foundTransaction);
          
          // Get merchant info if this is a merchant payment
          const foundMerchant = merchants.find(m => m.user_id === foundTransaction.receiver_id);
          if (foundMerchant) {
            setMerchant(foundMerchant);
            setReceiverName(foundMerchant.name);
          } else {
            // This might be a direct transfer to a user
            // Try to fetch user info by receiver_id
            try {
              const response = await fetch(`/api/users/${foundTransaction.receiver_id}`);
              if (response.ok) {
                const userData = await response.json();
                setReceiverName(userData.name || `User #${foundTransaction.receiver_id}`);
              } else {
                setReceiverName(`User #${foundTransaction.receiver_id}`);
              }
            } catch (error) {
              console.error('Error fetching receiver info:', error);
              setReceiverName(`User #${foundTransaction.receiver_id}`);
            }
          }
          
          setLoading(false);
        } else {
          // If we can't find the transaction, try fetching it directly
          try {
            const response = await fetch(`/api/transactions/single/${id}`);
            if (response.ok) {
              const txnData = await response.json();
              setTransaction(txnData);
              
              // Try to get receiver info
              const receiverResponse = await fetch(`/api/users/${txnData.receiver_id}`);
              if (receiverResponse.ok) {
                const receiverData = await receiverResponse.json();
                setReceiverName(receiverData.name || `User #${txnData.receiver_id}`);
              } else {
                setReceiverName(`User #${txnData.receiver_id}`);
              }
              
              setLoading(false);
            } else {
              console.error('Could not find transaction with ID:', id);
              navigate('/');
            }
          } catch (error) {
            console.error('Error fetching transaction:', error);
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error in transaction processing:', error);
        setLoading(false);
      }
    };
    
    // Set a timeout to ensure we have the latest transactions
    const timeoutId = setTimeout(() => {
      fetchTransactionData();
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [id, transactions, merchants, refreshTransactions, navigate]);
  
  const handleBackToHome = () => {
    navigate('/');
  };
  
  const handleViewTransaction = () => {
    navigate('/transactions');
  };

  const handleShareReceipt = async () => {
    if (!transaction) return;
    
    // Create receipt text
    const receiptText = `
Payment Receipt - EmergencyPay
--------------------------
Amount: ${formatCurrency(Number(transaction.amount))}
To: ${receiverName || (merchant ? merchant.name : `Recipient #${transaction.receiver_id}`)}
${merchant?.category ? `Category: ${merchant.category.charAt(0).toUpperCase() + merchant.category.slice(1)}` : ''}
Date: ${transaction.timestamp ? formatDate(transaction.timestamp.toString()) : 'Just now'}
Time: ${transaction.timestamp ? formatTime(transaction.timestamp.toString()) : 'Just now'}
Method: ${transaction.is_offline ? (transaction.method === 'BLUETOOTH' ? 'Bluetooth Payment' : 'QR Code (Offline)') : 'UPI Payment'}
Transaction ID: ${transaction.transaction_code || `TXN${transaction.id}`}
Status: ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
--------------------------
This receipt was generated by EmergencyPay.
    `.trim();

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EmergencyPay Receipt',
          text: receiptText,
        });
      } catch (error) {
        // User likely canceled the share operation
        console.error('Error sharing receipt:', error);
        // Fallback to clipboard
        await copyToClipboard(receiptText);
      }
    } else {
      // Fallback for browsers without Web Share API
      await copyToClipboard(receiptText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Receipt copied to clipboard');
    } catch (error) {
      console.error('Failed to copy receipt to clipboard:', error);
      alert('Could not copy receipt to clipboard. Please try again.');
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Determine transaction type (merchant payment or direct transfer)
  const isDirectTransfer = () => {
    if (!transaction) return false;
    // If we have a merchant, it's a merchant payment
    if (merchant) return false;
    // Otherwise it's likely a direct transfer
    return true;
  };
  
  if (loading || !transaction) {
    return (
      <div className="min-h-screen bg-white z-40 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  // Determine transaction title and subtitle
  const getTransactionTitle = () => {
    return isDirectTransfer() ? "Transfer Successful!" : "Payment Successful!";
  };
  
  const getTransactionSubtitle = () => {
    if (transaction.is_offline) {
      return "Your transaction has been stored locally";
    } else {
      return "Your transaction has been processed successfully";
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-white z-40 flex flex-col overflow-auto pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 flex flex-col items-center p-4 text-center pt-12 pb-16">
        <motion.div 
          className="mb-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <i className="ri-checkbox-circle-fill text-4xl text-green-600"></i>
          </div>
          <h3 className="text-2xl font-bold">{getTransactionTitle()}</h3>
          <p className="text-gray-600 mt-2">{getTransactionSubtitle()}</p>
        </motion.div>
        
        <motion.div 
          className="w-full max-w-sm bg-gray-50 rounded-lg p-4 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Amount</span>
            <span className="text-gray-800 font-medium">{formatCurrency(Number(transaction.amount))}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">{isDirectTransfer() ? "Transferred to" : "Paid to"}</span>
            <span className="text-gray-800 font-medium">{receiverName || (merchant ? merchant.name : `User #${transaction.receiver_id}`)}</span>
          </div>
          {merchant && merchant.category && (
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Category</span>
              <span className="text-gray-800 font-medium capitalize">{merchant.category}</span>
            </div>
          )}
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Date & Time</span>
            <span className="text-gray-800 font-medium">
              {transaction.timestamp ? 
                `${formatDate(transaction.timestamp.toString())} • ${formatTime(transaction.timestamp.toString())}` : 
                'Just now'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Type</span>
            <span className="text-gray-800 font-medium">
              {transaction.is_offline ? (
                <span className="text-emergency-600 font-semibold flex items-center">
                  {'method' in transaction && transaction.method === 'BLUETOOTH' ? (
                    <>
                      <i className="ri-bluetooth-line mr-1"></i> Bluetooth Payment
                    </>
                  ) : (
                    <>
                      <i className="ri-qr-code-line mr-1"></i> QR Code (Offline)
                    </>
                  )}
                </span>
              ) : (
                <span className="text-green-600 font-semibold flex items-center">
                  <i className="ri-bank-line mr-1"></i> UPI Payment
                </span>
              )}
            </span>
          </div>
        </motion.div>
        
        {transaction.is_offline && (
          <motion.div 
            className="bg-amber-50 rounded-lg p-4 mb-8 text-left w-full max-w-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <div className="flex">
              <i className="ri-information-line text-amber-500 mt-0.5 mr-3 text-lg flex-shrink-0"></i>
              <div>
                <h3 className="font-medium text-amber-700">Offline Transaction</h3>
                <p className="text-sm text-amber-700/80">
                  {'method' in transaction && transaction.method === 'BLUETOOTH' 
                    ? 'This Bluetooth payment will be synced with your bank when network connectivity is restored.'
                    : 'This offline payment will be synced with your bank when network connectivity is restored.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        <motion.div 
          className="space-y-3 w-full max-w-sm mb-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <button 
            onClick={handleShareReceipt}
            className="w-full bg-white border border-green-500 text-green-500 font-medium py-3 rounded-lg flex items-center justify-center"
          >
            <i className="ri-share-line mr-2"></i> Share Receipt
          </button>
          <button 
            onClick={handleViewTransaction}
            className="w-full bg-white border border-primary text-primary font-medium py-3 rounded-lg"
          >
            View Transaction
          </button>
          <button 
            onClick={handleBackToHome}
            className="w-full bg-primary text-white font-medium py-3 rounded-lg"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PaymentSuccess;
