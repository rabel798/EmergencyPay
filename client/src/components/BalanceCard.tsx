import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

const BalanceCard: React.FC = () => {
  const { currentUser } = useAppContext();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('₹', '₹ ');
  };

  // Calculate available balance
  const availableBalance = currentUser ? Number(currentUser.balance) : 0;
  const emergencyBalance = currentUser ? Number(currentUser.emergency_balance) : 0;

  return (
    <motion.div 
      className="bg-primary rounded-xl p-4 text-white relative overflow-hidden card-shadow"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute top-0 right-0 opacity-10">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 9H2M22 13H2M18 18H6C3.79086 18 2 16.2091 2 14V8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V14C22 16.2091 20.2091 18 18 18Z" stroke="white" strokeWidth="2"/>
        </svg>
      </div>
      <p className="text-white/80 text-sm">Available Balance</p>
      <h2 className="text-2xl font-bold mt-1">{formatCurrency(availableBalance)}</h2>
      <div className="flex justify-between mt-4">
        <div>
          <p className="text-white/80 text-xs">Emergency Balance</p>
          <p className="font-medium">{formatCurrency(emergencyBalance)}</p>
        </div>
        <button className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg transition-colors">
          Add Money
        </button>
      </div>
    </motion.div>
  );
};

export default BalanceCard;
