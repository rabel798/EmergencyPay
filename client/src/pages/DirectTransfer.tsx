import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useParams } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const DirectTransfer: React.FC = () => {
  const { phone } = useParams();
  const [, navigate] = useLocation();
  const { currentUser, refreshTransactions, connectionStatus, isEmergencyMode } = useAppContext();

  const [phoneNumber, setPhoneNumber] = useState(phone || '');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGoBack = () => {
    navigate('/');
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal points
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [receiverUser, setReceiverUser] = useState<any>(null);
  const [parsedAmountToSend, setParsedAmountToSend] = useState<number>(0);

  const handleInitiateTransfer = async () => {
    if (isProcessing) return;

    // Validate phone number
    if (phoneNumber.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    // Check if user has sufficient balance
    if (currentUser && parseFloat(currentUser.balance) < parsedAmount) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough balance to make this transfer',
        variant: 'destructive',
      });
      return;
    }

    // Get user details for confirmation
    try {
      const checkUserResponse = await apiRequest('GET', `/api/users/phone/${phoneNumber}`);

      if (!checkUserResponse.ok) {
        throw new Error('User with this phone number does not exist');
      }

      const user = await checkUserResponse.json();
      setReceiverUser(user);
      setParsedAmountToSend(parsedAmount);

      // Show confirmation dialog
      setShowConfirmation(true);
    } catch (error) {
      toast({
        title: 'User Not Found',
        description: error instanceof Error ? error.message : 'Could not find user with this phone number',
        variant: 'destructive',
      });
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleTransfer = async () => {
    if (isProcessing || !receiverUser) return;

    setIsProcessing(true);
    setShowConfirmation(false);

    try {
      // Check if UPI is offline and emergency mode is not active
      if (connectionStatus === 'offline' && !isEmergencyMode) {
        toast({
          title: 'UPI Services Down',
          description: 'UPI services are currently unavailable. Please activate Emergency Mode to make payments.',
          variant: 'destructive',
        });
        throw new Error('UPI services are down. Please use Emergency Mode.');
      }

      // If in offline mode, must use emergency payment API
      // In emergency mode, we now allow choice of payment method
      if (connectionStatus === 'offline') {
        // Check emergency balance
        if (currentUser && parseFloat(currentUser.emergency_balance) < parsedAmountToSend) {
          toast({
            title: 'Insufficient Emergency Balance',
            description: 'Your emergency balance is too low for this transaction.',
            variant: 'destructive',
          });
          throw new Error('Insufficient emergency balance');
        }

        // Process emergency payment
        const response = await apiRequest('POST', '/api/banking/emergency-payment', {
          senderId: currentUser?.id,
          receiverId: receiverUser.id,
          amount: parsedAmountToSend.toString(),
          method: 'BLUETOOTH' // Using Bluetooth as the method for all emergency transfers
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to process emergency transfer');
        }

        const result = await response.json();

        toast({
          title: 'Emergency Transfer Successful',
          description: `₹${parsedAmountToSend.toFixed(2)} sent to ${receiverUser.name} in emergency mode`,
        });

        // Refresh transactions
        refreshTransactions();

        // Navigate to success page
        if (result.transactionId) {
          navigate(`/payment-success/${result.transactionId}`);
        } else {
          navigate('/');
        }
      } else {
        // Regular online transfer
        const response = await apiRequest('POST', '/api/banking/transfer', {
          senderId: currentUser?.id,
          receiverId: receiverUser.id,
          amount: parsedAmountToSend.toString()
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to process transfer');
        }

        const result = await response.json();

        toast({
          title: 'Transfer Successful',
          description: `₹${parsedAmountToSend.toFixed(2)} sent to ${receiverUser.name}`,
        });

        // Refresh transactions
        refreshTransactions();

        // Navigate to success page
        if (result.transactionId) {
          navigate(`/payment-success/${result.transactionId}`);
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      toast({
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'An error occurred during transfer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // No longer redirect away from direct transfers in emergency mode
  // Allow users to transfer to any phone number, regardless of connection status
  // The backend API will handle the appropriate method (UPI for online, BLUETOOTH for emergency)

  // Check if we're coming from Bluetooth page
  const path = window.location.pathname;
  const isFromBluetooth = path.includes('/direct-transfer/') && path.length > 16; // has a phone number

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
        <h2 className="text-lg font-medium">Send Money</h2>
        <div className="flex items-center">
          {/* Network status indicator */}
          <div className={`mr-2 rounded-full w-2 h-2 ${
            connectionStatus === 'online' 
              ? 'bg-green-500' 
              : connectionStatus === 'offline' 
                ? 'bg-red-500' 
                : 'bg-amber-500'
          }`}></div>
          <span className="text-xs font-medium">
            {connectionStatus === 'online' 
              ? 'Online' 
              : connectionStatus === 'offline' 
                ? 'Offline' 
                : 'Emergency'
            }
          </span>
        </div>
      </div>

      {(
        /* Normal Mode - Show regular transfer form */
        <div className="flex-1 overflow-auto scrollbar-hide">
          <div className="p-4 text-center">
            <motion.div 
              className="mb-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
                <i className="ri-user-3-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-semibold mt-2">Send Money to Phone Number</h3>
              <p className="text-gray-500 text-sm">Transfer funds directly to any registered user</p>
            </motion.div>

            <motion.div 
              className="my-8 space-y-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div>
                <p className="text-gray-500 mb-2 text-left">Phone Number</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">+91</span>
                  <input 
                    type="text" 
                    value={phoneNumber} 
                    onChange={handlePhoneNumberChange}
                    placeholder="9876543210"
                    className="w-full bg-gray-50 p-4 pl-16 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    disabled={isProcessing}
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <p className="text-gray-500 mb-2 text-left">Amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                  <input 
                    type="text" 
                    value={amount} 
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className="w-full bg-gray-50 p-4 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </motion.div>

            {currentUser && (
              <motion.div 
                className="bg-gray-50 rounded-lg p-4 mb-8 text-left"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Your Balance</span>
                  <span className="text-gray-800 font-medium">₹{parseFloat(currentUser.balance).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer Method</span>
                  <span className={`font-medium ${connectionStatus !== 'online' ? 'text-amber-600' : 'text-gray-800'}`}>
                    {connectionStatus === 'online' ? 'UPI' : 'Bluetooth (Emergency)'}
                  </span>
                </div>
                {isEmergencyMode && (
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Emergency Balance</span>
                    <span className="text-amber-600 font-medium">
                      ₹{currentUser && parseFloat(currentUser.emergency_balance).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div 
              className="space-y-2 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <button 
                onClick={handleInitiateTransfer}
                className="w-full bg-primary text-white font-medium py-3 rounded-lg disabled:opacity-70"
                disabled={isProcessing || !phoneNumber || !amount || phoneNumber.length < 10}
              >
                {isProcessing ? 'Processing...' : 'Send Money'}
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
      )}
      {/* Confirmation Dialog */}
      {showConfirmation && receiverUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <motion.div 
            className="bg-white rounded-xl p-6 m-4 max-w-sm w-full"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <h3 className="text-lg font-semibold mb-4">Confirm Transfer</h3>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 text-sm">You are about to send</p>
                <p className="text-2xl font-bold text-gray-800">₹{parsedAmountToSend.toFixed(2)}</p>
                <p className="text-gray-600 text-sm">to</p>
                <div className="my-2 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                    <i className="ri-user-3-line text-lg text-primary"></i>
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{receiverUser.name}</p>
                    <p className="text-xs text-gray-500">+91 {receiverUser.phone}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Please confirm that you want to transfer this amount 
                {connectionStatus === 'online' ? (
                  <span> using UPI</span>
                ) : (
                  <span className="font-semibold text-amber-600"> using Bluetooth (Emergency)</span>
                )}.
                {isEmergencyMode && (
                  <span className="block mt-1 text-amber-600">
                    This amount will be deducted from your emergency balance.
                  </span>
                )}
                This transaction cannot be reversed once completed.
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
                onClick={handleTransfer}
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

export default DirectTransfer;