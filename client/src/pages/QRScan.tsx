import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';

const QRScan: React.FC = () => {
  const [, navigate] = useLocation();
  const { merchants, selectMerchant } = useAppContext();
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Start scanning immediately when component mounts
    setScanning(true);
    
    // Simulate scanning
    let scanTimer: NodeJS.Timeout;
    let scanInterval: NodeJS.Timeout;
    
    if (scanning) {
      // Simulate continuous scanning
      scanInterval = setInterval(() => {
        // Check for QR code (simulated)
        const foundQR = Math.random() > 0.9; // 10% chance of finding QR per check
        
        if (foundQR) {
          // Randomly pick a merchant
          const randomIndex = Math.floor(Math.random() * merchants.length);
          const randomMerchant = merchants[randomIndex];
          
          if (randomMerchant) {
            selectMerchant(randomMerchant);
            navigate(`/payment-amount/${randomMerchant.id}`);
          }
        }
      }, 1000); // Check every second
    }
    
    return () => {
      clearInterval(scanInterval);
      clearTimeout(scanTimer);
    };
  }, [scanning, merchants, navigate, selectMerchant]);

  const selectFromGallery = () => {
    // Show gallery access message first
    window.alert('In a real app, this would open your photo gallery to select a QR code image. Currently simulating selection from gallery.');
    
    // Simulate selecting from gallery
    const randomIndex = Math.floor(Math.random() * merchants.length);
    const randomMerchant = merchants[randomIndex];
    
    if (randomMerchant) {
      selectMerchant(randomMerchant);
      navigate(`/payment-amount/${randomMerchant.id}`);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    navigate('/');
  };

  const toggleFlash = () => {
    // Show a message for first time use
    if (!flashOn) {
      window.alert('In a real app, this would turn on your device flashlight to help scan in low light. The flashlight status is currently simulated.');
    }
    setFlashOn(!flashOn);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-gray-900/95 z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 flex items-center justify-between text-white">
        <button 
          onClick={stopScanning}
          className="h-10 w-10 flex items-center justify-center rounded-full"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Scan QR Code</h2>
        <div className="h-10 w-10"></div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-8">
          <div className="h-64 w-64 border-2 border-white/30 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 border-2 border-primary rounded-lg"></div>
              <div className="absolute top-0 left-0 h-12 w-12 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 h-12 w-12 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 h-12 w-12 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 h-12 w-12 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
              <motion.div 
                className="absolute w-full bg-primary"
                style={{ height: 2 }}
                animate={{ 
                  top: scanning ? ['30%', '70%', '30%'] : '50%'
                }}
                transition={{ 
                  duration: 3, 
                  ease: "easeInOut", 
                  repeat: scanning ? Infinity : 0,
                  repeatType: "reverse" 
                }}
              />
            </div>
          </div>
        </div>
        <p className="text-white/80 text-center mb-4">Position the QR code within the frame to scan</p>
        <div className="bg-blue-500/20 rounded-lg p-3 mb-4 max-w-xs mx-auto">
          <p className="text-white/90 text-sm text-center">
            This is a simulated scanner that will randomly detect a merchant after a few seconds. In a real app, this would use your device's camera.
          </p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={selectFromGallery}
            className="bg-white/10 text-white py-2 px-4 rounded-lg flex items-center hover:bg-white/20"
          >
            <i className="ri-image-line mr-2"></i>
            Gallery
          </button>
          <button 
            className={`${flashOn ? 'bg-white/20' : 'bg-white/10'} text-white py-2 px-4 rounded-lg flex items-center`}
            onClick={toggleFlash}
          >
            <i className="ri-flashlight-line mr-2"></i>
            {flashOn ? 'Flash On' : 'Flash Off'}
          </button>
        </div>
        
        <motion.div
          className="mt-8 text-center"
        >
          <p className="text-white/80 mb-2">
            {scanning ? 'Scanning in progress...' : 'Scan paused'}
          </p>
          <motion.button
            className={`${scanning ? 'bg-red-500' : 'bg-primary'} text-white py-3 px-8 rounded-lg font-medium`}
            onClick={() => setScanning(!scanning)}
            whileTap={{ scale: 0.95 }}
          >
            {scanning ? 'Stop Scanning' : 'Resume Scan'}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QRScan;
