import { Merchant } from '@shared/schema';

// This file simulates Bluetooth Low Energy operations for the demo
// In a real application, we would use proper BLE APIs

// Simulate Bluetooth device discovery
export async function simulateBluetoothDeviceDiscovery(
  merchants: Merchant[]
): Promise<Merchant[]> {
  return new Promise((resolve) => {
    // Simulate a delay for scanning
    setTimeout(() => {
      // Get a random subset of merchants
      const shuffled = [...merchants].sort(() => 0.5 - Math.random());
      const selectedMerchants = shuffled.slice(0, Math.min(3, merchants.length));
      
      resolve(selectedMerchants);
    }, 2000);
  });
}

// Simulate scanning for nearby users (phone numbers)
export interface NearbyUser {
  id: number;
  name: string;
  phone: string;
  distance: number;
  isInRange: boolean;
}

export async function scanForNearbyUsers(): Promise<NearbyUser[]> {
  return new Promise((resolve) => {
    // Simulate a delay for scanning
    setTimeout(() => {
      // Hardcoded sample nearby users for demo
      const nearbyUsers: NearbyUser[] = [
        {
          id: 7,
          name: "Sandeep Singh",
          phone: "7986797151",
          distance: 5, // 5 meters away
          isInRange: true
        },
        {
          id: 3,
          name: "Anjali Sharma",
          phone: "8765432109",
          distance: 8, // 8 meters away
          isInRange: true
        },
        {
          id: 4,
          name: "Rajesh Kumar",
          phone: "7654321098",
          distance: 12, // 12 meters away
          isInRange: false
        }
      ];
      
      resolve(nearbyUsers);
    }, 1500);
  });
}

// Simulate connecting to a merchant's device
export async function simulateBluetoothConnect(
  merchantId: number
): Promise<boolean> {
  return new Promise((resolve) => {
    // Simulate connection delay and success (90% success rate)
    setTimeout(() => {
      const success = Math.random() < 0.9;
      resolve(success);
    }, 1500);
  });
}

// Simulate sending a transaction via Bluetooth with encryption
export async function simulateBluetoothSendTransaction(
  transactionData: any
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // In a real implementation:
      // 1. Generate a one-time session key for this transaction
      const sessionKey = crypto.getRandomValues(new Uint8Array(16));
      
      // 2. Encrypt the transaction data with the session key
      // Here we're simulating this encryption
      const encryptedData = {
        ...transactionData,
        encryptionTimestamp: Date.now(),
        oneTimeToken: Array.from(sessionKey).map(byte => byte.toString(16)).join(''),
        securityLevel: "high"
      };
      
      // 3. Apply short-range validation
      // Real implementation would:
      // - Verify signal strength is consistent with close proximity
      // - Implement time-window limitations (10 seconds to complete)
      // - Use hardware address validation
      
      console.log("Sending encrypted Bluetooth transaction:", {
        encrypted: true,
        securityLevel: "high",
        distanceLimited: true,
        timeWindowed: true
      });
      
      // Simulate sending delay and success (95% success rate)
      setTimeout(() => {
        const success = Math.random() < 0.95;
        resolve(success);
      }, 2000);
    } catch (error) {
      console.error("Error sending Bluetooth transaction:", error);
      resolve(false);
    }
  });
}

// Simulate disconnecting from a Bluetooth device
export async function simulateBluetoothDisconnect(): Promise<void> {
  return new Promise((resolve) => {
    // Simulate disconnection delay
    setTimeout(() => {
      resolve();
    }, 500);
  });
}

// Get mock distances for devices in meters
export function getMockDistances(deviceCount: number): number[] {
  const distances: number[] = [];
  
  for (let i = 0; i < deviceCount; i++) {
    // Generate random distances between 1m and 15m
    distances.push(Math.floor(Math.random() * 15) + 1);
  }
  
  return distances;
}

// Check if a device is in range (max 10m for Bluetooth Low Energy)
export function isDeviceInRange(distance: number): boolean {
  return distance <= 10;
}
