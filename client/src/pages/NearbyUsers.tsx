import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import StatusBar from '@/components/StatusBar';
import NearbyUserItem from '@/components/NearbyUserItem';
import { scanForNearbyUsers, NearbyUser } from '@/lib/bluetooth';
import { useToast } from '@/hooks/use-toast';

const NearbyUsers: React.FC = () => {
  const { connectionStatus } = useAppContext();
  const [isScanning, setIsScanning] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const { toast } = useToast();

  const startScan = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    try {
      const users = await scanForNearbyUsers();
      setNearbyUsers(users);
      
      if (users.length === 0) {
        toast({
          title: "No users found",
          description: "No users were detected nearby. Try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error scanning for nearby users:", error);
      toast({
        title: "Scan Failed",
        description: "Failed to scan for nearby users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-scan on component mount
  useEffect(() => {
    startScan();
  }, []);

  return (
    <motion.div 
      className="flex-1 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatusBar />
      
      <div className="flex-1 overflow-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Nearby Users</h1>
          
          <button 
            className={`p-2 rounded-full ${isScanning ? 'bg-gray-200' : 'bg-primary text-white'}`}
            onClick={startScan}
            disabled={isScanning}
          >
            <i className={`ri-refresh-line ${isScanning ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
        
        {connectionStatus !== 'online' && (
          <div className="bg-emergency-50 border border-emergency-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-emergency-800">
              <i className="ri-information-line mr-1"></i>
              You are in {connectionStatus === 'emergency' ? 'Emergency' : 'Offline'} Mode. Only nearby users can receive payments.
            </p>
          </div>
        )}
        
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Scanning for nearby users...</p>
          </div>
        ) : nearbyUsers.length > 0 ? (
          <div>
            {nearbyUsers.map((user, index) => (
              <NearbyUserItem 
                key={user.id} 
                user={user} 
                index={index} 
              />
            ))}
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Only users within 10 meters can receive offline payments
            </p>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <i className="ri-user-search-line text-4xl text-gray-400 mb-2"></i>
            <p className="text-gray-500">No users found nearby</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm"
              onClick={startScan}
            >
              Scan Again
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NearbyUsers;