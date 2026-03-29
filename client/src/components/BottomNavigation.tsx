import React from 'react';
import { useLocation, Link } from 'wouter';
import { motion } from 'framer-motion';

const BottomNavigation: React.FC = () => {
  const [location] = useLocation();

  const navItems = [
    { path: '/', icon: 'ri-home-5-line', label: 'Home' },
    { path: '/qr-scan', icon: 'ri-qr-scan-line', label: 'Scan' },
    { path: '/transactions', icon: 'ri-history-line', label: 'History' },
    { path: '/profile', icon: 'ri-user-3-line', label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 max-w-md mx-auto z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <motion.div 
              className={`flex flex-col items-center justify-center py-1 px-3 ${
                location === item.path ? 'text-primary' : 'text-gray-500'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <i className={`${item.icon} text-xl`}></i>
              <span className="text-xs mt-1">{item.label}</span>
              {location === item.path && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-0 h-0.5 w-10 bg-primary rounded-t-full"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
