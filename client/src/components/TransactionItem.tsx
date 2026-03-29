import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Transaction } from '@shared/schema';
import { MerchantCategory } from '@shared/types';
import { useAppContext } from '@/context/AppContext';
import TransactionDetailsModal from './TransactionDetailsModal';

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, index }) => {
  const { currentUser, merchants } = useAppContext();
  const [showDetails, setShowDetails] = useState(false);
  
  // Determine if this was a payment or receipt based on sender/receiver
  const isPayment = transaction.sender_id === currentUser?.id;
  
  // Get merchant info if available
  const merchantId = isPayment ? transaction.receiver_id : transaction.sender_id;
  const merchant = merchants.find(m => m.user_id === merchantId);
  
  // Format amount
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(Number(transaction.amount));
  
  // Format date
  const formattedDate = transaction.timestamp 
    ? new Date(transaction.timestamp.toString()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '--';
  
  // Format time
  const formattedTime = transaction.timestamp
    ? new Date(transaction.timestamp.toString()).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : '--';
  
  // Determine transaction icon and colors
  const getTransactionIcon = () => {
    if (isPayment) return 'ri-arrow-up-line';
    return 'ri-arrow-down-line';
  };
  
  const getIconBgColor = () => {
    if (isPayment) return 'bg-primary-100';
    return 'bg-amber-100';
  };
  
  const getIconColor = () => {
    if (isPayment) return 'text-primary';
    return 'text-amber-600';
  };
  
  // Determine status styling and icon
  const getStatusColor = () => {
    if (transaction.status === 'completed') return 'text-green-600';
    if (transaction.status === 'pending') return 'text-amber-600';
    return 'text-red-600';
  };
  
  const getStatusIcon = () => {
    if (transaction.status === 'completed') return 'ri-checkbox-circle-fill';
    if (transaction.status === 'pending') return 'ri-time-line';
    return 'ri-close-circle-fill';
  };
  
  // State to store user data for direct transfers
  const [receiverName, setReceiverName] = React.useState<string | null>(null);
  
  // Fetch user data if no merchant is found (direct transfer)
  React.useEffect(() => {
    const fetchUserData = async () => {
      if (!merchant && transaction) {
        const userId = isPayment ? transaction.receiver_id : transaction.sender_id;
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            setReceiverName(userData.name);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    
    fetchUserData();
  }, [merchant, transaction, isPayment]);
  
  const getTransactionTitle = () => {
    const targetId = isPayment ? transaction.receiver_id : transaction.sender_id;
    
    // If we have a merchant, use that name
    if (merchant) {
      if (isPayment) {
        return `Paid to ${merchant.name}`;
      } else {
        return `Received from ${merchant.name}`;
      }
    }
    
    // If we have a receiver name from our API call, use that
    if (receiverName) {
      if (isPayment) {
        return `Transferred to ${receiverName}`;
      } else {
        return `Received from ${receiverName}`;
      }
    }
    
    // Fallback
    if (isPayment) {
      return `Transferred to User #${targetId}`;
    } else {
      return `Received from User #${targetId}`;
    }
  };

  return (
    <>
      <motion.div 
        className="transaction-item bg-white rounded-xl p-4 flex items-center mb-3 card-shadow cursor-pointer"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDetails(true)}
      >
        <div className={`h-10 w-10 rounded-full ${getIconBgColor()} flex items-center justify-center mr-3`}>
          <i className={`${getTransactionIcon()} text-lg ${getIconColor()}`}></i>
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{getTransactionTitle()}</h4>
          <p className="text-xs text-gray-500 flex items-center">
            {formattedDate} • {formattedTime}
            {transaction.is_offline && (
              <>
                <span className="mx-1">•</span>
                {'method' in transaction && transaction.method === 'BLUETOOTH' ? (
                  <span className="flex items-center text-emergency-600">
                    <i className="ri-bluetooth-line mr-1 text-xs"></i>
                    BT
                  </span>
                ) : (
                  <span className="flex items-center text-amber-600">
                    <i className="ri-wifi-off-line mr-1 text-xs"></i>
                    Offline
                  </span>
                )}
              </>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">{formattedAmount}</p>
          <p className={`text-xs ${getStatusColor()} flex items-center justify-end`}>
            <i className={`${getStatusIcon()} mr-1`}></i> 
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </p>
        </div>
      </motion.div>

      {showDetails && (
        <TransactionDetailsModal
          transaction={transaction}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default TransactionItem;
