import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import MerchantItem from '@/components/MerchantItem';
import { toast } from '@/hooks/use-toast';
import { scanForNearbyUsers, NearbyUser } from '@/lib/bluetooth';
import { generateTransactionCode } from '@/lib/utils';

const BluetoothPayment: React.FC = () => {
  const [, navigate] = useLocation();
  const { 
    isEmergencyMode,
    startDeviceDiscovery,
    stopDeviceDiscovery,
    isScanning,
    discoveredDevices,
    selectMerchant,
    connectionStatus,
    currentUser
  } = useAppContext();

  // Track connection and payment state
  const [connecting, setConnecting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Track nearby users and search functionality
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'merchants' | 'users'>('merchants');

  useEffect(() => {
    // Start scanning when component mounts
    startDeviceDiscovery();

    // Notify user about emergency mode
    if (isEmergencyMode && connectionStatus === 'emergency') {
      toast({
        title: 'Emergency Mode Active',
        description: 'You can make offline payments via Bluetooth',
        variant: 'default',
      });
    }

    // Stop scanning when component unmounts
    return () => stopDeviceDiscovery();
  }, [startDeviceDiscovery, stopDeviceDiscovery, isEmergencyMode, connectionStatus]);

  // Effect to scan for nearby users
  useEffect(() => {
    const loadNearbyUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const users = await scanForNearbyUsers();
        setNearbyUsers(users);
      } catch (error) {
        console.error('Error scanning for nearby users:', error);
        toast({
          title: 'Scan Error',
          description: 'Could not scan for nearby users',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadNearbyUsers();
  }, []);

  const handleGoBack = () => {
    navigate('/');
  };

  // Function to perform payment directly via banking API
  const performBluetoothPayment = async (merchantId: number, amount: number) => {
    if (!currentUser) return null;

    setPaymentProcessing(true);

    try {
      const response = await fetch('/api/banking/emergency-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: merchantId,
          amount: amount.toString(),
          method: 'BLUETOOTH'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Payment Successful',
          description: `Paid ₹${amount} via Bluetooth in emergency mode`,
          variant: 'default',
        });
        return result;
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message || 'Failed to process payment',
          variant: 'destructive',
        });
        return null;
      }
    } catch (error) {
      console.error('Bluetooth payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleConnect = async (merchant: typeof discoveredDevices[0]) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to make payments',
        variant: 'destructive',
      });
      return;
    }

    // If we're online, we can proceed directly without emergency mode
    if (connectionStatus === 'online') {
      // Online payment - proceed directly
    } 
    // If we're in emergency mode, check if user has sufficient emergency balance
    else if (connectionStatus === 'emergency' || connectionStatus === 'offline') {
      // Check if emergency mode is active
      if (!isEmergencyMode) {
        toast({
          title: 'Emergency Mode Required',
          description: 'Enable emergency mode in your profile to make offline payments',
          variant: 'destructive',
        });
        return;
      }

      // Check if user has sufficient emergency balance
      if (parseFloat(currentUser.emergency_balance) <= 0) {
        toast({
          title: 'Insufficient Emergency Balance',
          description: 'Please add funds to your emergency balance to make offline payments',
          variant: 'destructive',
        });
        return;
      }
    }

    setConnecting(true);

    try {
      toast({
        title: 'Connecting',
        description: `Connecting to ${merchant.name}...`,
      });

      // Continue with navigation to payment amount
      selectMerchant(merchant);
      navigate(`/payment-amount/${merchant.id}`);
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to merchant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  // Add a new function to handle sending payment to user
  const handleSendToUser = async (user: NearbyUser) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to make payments',
        variant: 'destructive',
      });
      return;
    }

    // If we're online, we can proceed directly without emergency mode
    if (connectionStatus === 'online') {
      // Online payment - proceed directly
    } 
    // If we're in emergency mode, check if user has sufficient emergency balance
    else if (connectionStatus === 'emergency' || connectionStatus === 'offline') {
      // Check if emergency mode is active
      if (!isEmergencyMode) {
        toast({
          title: 'Emergency Mode Required',
          description: 'Enable emergency mode in your profile to make offline payments',
          variant: 'destructive',
        });
        return;
      }

      // Check if user has sufficient emergency balance
      if (parseFloat(currentUser.emergency_balance) <= 0) {
        toast({
          title: 'Insufficient Emergency Balance',
          description: 'Please add funds to your emergency balance to make offline payments',
          variant: 'destructive',
        });
        return;
      }
    }

    setConnecting(true);

    try {
      toast({
        title: 'Connecting',
        description: `Connecting to ${user.name}...`,
      });

      // Navigate to direct transfer with phone number
      navigate(`/direct-transfer/${user.phone}`);
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Unable to connect to user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  // Filter merchants and users based on search query
  const filteredMerchants = discoveredDevices.filter(merchant => 
    searchQuery === '' || 
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = nearbyUsers.filter(user => 
    searchQuery === '' || 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  return (
    <motion.div 
      className="fixed inset-0 bg-white z-40 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <button 
          onClick={handleGoBack}
          className="h-10 w-10 flex items-center justify-center rounded-full"
        >
          <i className="ri-arrow-left-line text-xl"></i>
        </button>
        <h2 className="text-lg font-medium">Bluetooth Pay</h2>
        <div className="h-10 w-10"></div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <div className="px-4 py-6 border-b border-gray-200">
          {/* Emergency Balance Card */}
          {currentUser && (
            <div className="bg-primary-50 rounded-lg p-4 flex justify-between items-center mb-3">
              <div>
                <h3 className="font-medium text-primary-800">Emergency Balance</h3>
                <p className="text-2xl font-semibold text-primary-700">
                  ₹{parseFloat(currentUser.emergency_balance).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                <i className="ri-wallet-3-line text-primary text-xl"></i>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-4">
            <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, or category"
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-3 text-gray-400"
              >
                <i className="ri-close-line"></i>
              </button>
            )}
          </div>

          {(connecting || paymentProcessing) && (
            <div className="bg-blue-50 rounded-lg p-4 flex items-center mb-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <p className="text-blue-700">
                {connecting ? 'Connecting to merchant...' : 'Processing payment...'}
              </p>
            </div>
          )}
        </div>

        <div className="p-4">
          <motion.div 
            className="relative ble-scan-animation"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto">
              <i className="ri-bluetooth-line text-4xl text-primary"></i>
            </div>
          </motion.div>
          <h3 className="text-lg font-medium mt-6 mb-2 text-center">
            {isScanning || isLoadingUsers ? 'Scanning for devices...' : 'Nearby Devices'}
          </h3>
          <p className="text-gray-600 mb-4 text-center">Keep your device close for better detection</p>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('merchants')}
              className={`flex-1 py-3 px-4 text-center ${activeTab === 'merchants' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
            >
              Merchants
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 px-4 text-center ${activeTab === 'users' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
            >
              Users
            </button>
          </div>

          {/* Merchant Tab Content */}
          {activeTab === 'merchants' && (
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-500 mb-3">AVAILABLE MERCHANTS</h4>

              {/* Merchant List */}
              <div className="space-y-3">
                {filteredMerchants.length > 0 ? (
                  filteredMerchants.map((merchant, index) => (
                    <MerchantItem 
                      key={merchant.id} 
                      merchant={merchant}
                      distance={Math.floor(Math.random() * 10) + 1} // Random distance 1-10m
                      isInRange={true}
                      index={index}
                      showConnectButton={true}
                      onConnect={() => handleConnect(merchant)}
                    />
                  ))
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      {isScanning ? 'Searching for nearby merchants...' : 
                      searchQuery ? `No merchants found matching "${searchQuery}"` : 
                      'No merchants found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab Content */}
          {activeTab === 'users' && (
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-500 mb-3">NEARBY USERS</h4>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <div 
                      key={user.id} 
                      className="bg-white rounded-xl p-4 flex items-center justify-between card-shadow"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <i className="ri-user-line text-blue-600"></i>
                        </div>
                        <div className="text-left">
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-xs text-gray-500">{user.distance}m</div>
                        <button 
                          className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm flex items-center"
                          onClick={() => handleSendToUser(user)}
                        >
                          <i className="ri-send-plane-line mr-1"></i>
                          Send
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      {isLoadingUsers ? 'Searching for nearby users...' : 
                      searchQuery ? `No users found matching "${searchQuery}"` : 
                      'No users found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <motion.button 
            onClick={handleGoBack}
            className="bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg mx-auto block"
            whileTap={{ scale: 0.95 }}
          >
            Cancel Scan
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default BluetoothPayment;