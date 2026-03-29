import React from 'react';
import { motion } from 'framer-motion';
import { Merchant } from '@shared/schema';
import { MerchantCategory, ConnectionStatus } from '@shared/types';
import { useAppContext } from '@/context/AppContext';

interface MerchantItemProps {
  merchant: Merchant;
  distance?: number;
  isInRange?: boolean;
  index: number;
  showConnectButton?: boolean;
  onConnect?: () => void;
}

const MerchantItem: React.FC<MerchantItemProps> = ({ 
  merchant, 
  distance = 5, 
  isInRange = true, 
  index, 
  showConnectButton = true,
  onConnect 
}) => {
  const { essentialServices, connectionStatus, isEmergencyMode } = useAppContext();
  
  // Get category details
  const categoryInfo = essentialServices.find(s => s.category === merchant.category) || essentialServices[0];
  
  // Get icon class based on category
  const getIconClass = () => {
    return categoryInfo.icon;
  };
  
  // Get background color class
  const getBgColorClass = () => {
    return categoryInfo.colorClass.split(' ')[0];
  };
  
  // Get text color class
  const getTextColorClass = () => {
    return categoryInfo.colorClass.split(' ')[1];
  };
  
  // Format category name
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleConnect = () => {
    if (onConnect && isInRange) {
      onConnect();
    }
  };

  return (
    <motion.div 
      className={`bg-white rounded-lg p-4 border border-gray-200 flex items-center ${!isInRange ? 'opacity-50' : ''}`}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <div className={`h-10 w-10 rounded-full ${getBgColorClass()} flex items-center justify-center mr-3`}>
        <i className={`${getIconClass()} text-lg ${getTextColorClass()}`}></i>
      </div>
      <div className="flex-1 text-left">
        <h4 className="font-medium">{merchant.name}</h4>
        <p className="text-xs text-gray-500">
          {formatCategory(merchant.category)} 
          {distance !== undefined && ` • ${isInRange ? `${distance}m away` : 'Out of range'}`}
        </p>
      </div>
      {showConnectButton && (
        <button 
          className={`${
            isInRange 
              ? 'bg-primary text-white' 
              : 'bg-gray-200 text-gray-500'
          } text-sm px-3 py-1 rounded-lg flex items-center`}
          onClick={handleConnect}
          disabled={!isInRange}
        >
          {isInRange ? (
            connectionStatus === 'online' ? (
              <>
                <i className="ri-bank-line mr-1"></i>
                <span>Pay via UPI</span>
              </>
            ) : (
              <>
                <i className="ri-bluetooth-line mr-1"></i>
                <span>Pay via BT</span>
              </>
            )
          ) : (
            'Too Far'
          )}
        </button>
      )}
    </motion.div>
  );
};

export default MerchantItem;
