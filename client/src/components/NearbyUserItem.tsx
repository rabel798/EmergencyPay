import React from 'react';
import { motion } from 'framer-motion';
import { NearbyUser } from '@/lib/bluetooth';
import { Link } from 'wouter';

interface NearbyUserItemProps {
  user: NearbyUser;
  index: number;
}

const NearbyUserItem: React.FC<NearbyUserItemProps> = ({ user, index }) => {
  return (
    <motion.div
      className={`relative flex items-center p-3 rounded-lg mb-3 border ${
        user.isInRange 
          ? 'border-green-100 bg-green-50' 
          : 'border-gray-100 bg-gray-50 opacity-60'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
        <i className="ri-user-line text-blue-600"></i>
      </div>
      
      <div className="flex-grow">
        <div className="flex items-center">
          <h4 className="font-medium">{user.name}</h4>
          {user.isInRange && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              In Range
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{user.phone}</p>
        <p className="text-xs text-gray-400">Distance: {user.distance}m</p>
      </div>
      
      {user.isInRange && (
        <Link to={`/direct-transfer?receiver=${user.phone}`}>
          <button className="ml-2 p-2 bg-primary text-white rounded-full">
            <i className="ri-send-plane-fill"></i>
          </button>
        </Link>
      )}
    </motion.div>
  );
};

export default NearbyUserItem;