import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';

const EmergencyToggle: React.FC = () => {
  const { toggleEmergencyMode, isEmergencyMode } = useAppContext();
  const [showOverlay, setShowOverlay] = useState(false);

  const handleToggleClick = () => {
    if (!isEmergencyMode) {
      setShowOverlay(true);
    } else {
      toggleEmergencyMode();
    }
  };

  const handleConfirm = () => {
    setShowOverlay(false);
    toggleEmergencyMode();
  };

  const handleCancel = () => {
    setShowOverlay(false);
  };

  return (
    <>
      {/* Static button with no animations */}
      <button 
        onClick={handleToggleClick}
        className={`relative flex items-center justify-center h-8 w-8 rounded-full transition-colors duration-300 ${
          isEmergencyMode 
            ? 'bg-red-600 text-white shadow-lg shadow-red-300' 
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        <i className="ri-alarm-warning-line text-lg"></i>
        {isEmergencyMode && (
          <div className="absolute -inset-1 rounded-full bg-red-400/30" />
        )}
      </button>

      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCancel}
            className="fixed inset-0 backdrop-blur-md bg-black/50 z-50 flex flex-col justify-center items-center px-6"
          >
            <motion.div 
              className="bg-[#3F3FE9] text-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full relative"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 500,
                delay: 0.1 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-xl z-10"
              >
                <i className="ri-close-line"></i>
              </button>

              <div className="p-6 text-center pt-12">
                <motion.div 
                  className="mb-6 inline-block"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <i className="ri-alarm-warning-fill text-7xl text-white/90"></i>
                </motion.div>

                <h2 className="text-2xl font-bold mb-3">Activate Emergency Mode?</h2>

                <motion.div 
                  className="bg-white/10 backdrop-blur-sm py-4 px-5 rounded-xl mb-8 text-white/90"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p>This mode enables <span className="font-semibold">offline payments</span> when UPI services are down. Transactions will be synced when network is restored.</p>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    onClick={handleCancel}
                    className="bg-white/10 hover:bg-white/20 py-4 rounded-xl font-medium transition-colors"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>

                  <motion.button 
                    onClick={handleConfirm}
                    className="bg-white text-[#3F3FE9] py-4 rounded-xl font-bold transition-colors"
                    whileHover={{ scale: 1.03, backgroundColor: "#f0f0ff" }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Activate
                  </motion.button>
                </div>
              </div>

              <motion.div 
                className="h-1 bg-white/30"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 10 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyToggle;