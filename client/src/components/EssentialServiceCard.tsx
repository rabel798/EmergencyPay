import React from 'react';
import { motion } from 'framer-motion';
import { EssentialService } from '@shared/types';
import { Link } from 'wouter';

interface EssentialServiceCardProps {
  service: EssentialService;
  index: number;
}

const EssentialServiceCard: React.FC<EssentialServiceCardProps> = ({ service, index }) => {
  return (
    <Link href={`/merchants?category=${service.category}`}>
      <motion.div 
        className="flex flex-col items-center min-w-[80px] cursor-pointer"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className={`h-16 w-16 rounded-lg ${service.colorClass.split(' ')[0]} flex items-center justify-center mb-2`}>
          <i className={`${service.icon} text-2xl ${service.colorClass.split(' ')[1]}`}></i>
        </div>
        <span className="text-xs text-gray-700 text-center">{service.name}</span>
      </motion.div>
    </Link>
  );
};

export default EssentialServiceCard;
