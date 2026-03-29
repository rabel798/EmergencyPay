import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import TransactionItem from '@/components/TransactionItem';
import StatusBar from '@/components/StatusBar';

const TransactionHistory: React.FC = () => {
  const { transactions, refreshTransactions, reconcileTransactions, connectionStatus } = useAppContext();
  
  useEffect(() => {
    // Refresh transactions when component mounts
    refreshTransactions();
  }, [refreshTransactions]);
  
  // Sort transactions by date, most recent first
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );
  
  // Get pending transactions
  const pendingTransactions = sortedTransactions.filter(t => t.status === 'pending');
  
  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      
      <div className="flex-1 overflow-auto scrollbar-hide pb-20">
        <div className="px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Transaction History</h1>
          <button 
            className={`${connectionStatus === 'online' ? 'bg-primary' : 'bg-gray-300'} text-white px-3 py-1 rounded-md text-sm`}
            onClick={reconcileTransactions}
            disabled={connectionStatus !== 'online'}
          >
            Sync Now
          </button>
        </div>
        
        {pendingTransactions.length > 0 && (
          <div className="px-4 mb-6">
            <h3 className="text-lg font-medium mb-3">Pending Transactions</h3>
            {pendingTransactions.map((transaction, index) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction}
                index={index}
              />
            ))}
          </div>
        )}
        
        <div className="px-4 pb-24">
          <h3 className="text-lg font-medium mb-3">All Transactions</h3>
          
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((transaction, index) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction}
                index={index}
              />
            ))
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionHistory;
