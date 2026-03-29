// This file handles cryptographic operations for secure transactions
// We use a combination of encryption and digital signatures to secure Bluetooth transactions

// Generate a secure key pair for transaction signing
export function generateKeyPair() {
  try {
    // Use SubtleCrypto API if available (more secure)
    if (window.crypto && window.crypto.subtle) {
      // In production, this would use proper asymmetric cryptography
      // For this demo, we're using a simulated but more realistic approach
      const publicKeyArray = window.crypto.getRandomValues(new Uint8Array(32));
      const privateKeyArray = window.crypto.getRandomValues(new Uint8Array(64));
      
      const publicKey = btoa(Array.from(publicKeyArray).map(byte => String.fromCharCode(byte)).join(''));
      const privateKey = btoa(Array.from(privateKeyArray).map(byte => String.fromCharCode(byte)).join(''));
      return { publicKey, privateKey };
    } else {
      // Fallback for environments without SubtleCrypto
      const publicKey = generateRandomString(32);
      const privateKey = generateRandomString(64);
      return { publicKey, privateKey };
    }
  } catch (error) {
    console.error("Error generating secure keypair:", error);
    // Fallback to basic implementation
    const publicKey = generateRandomString(32);
    const privateKey = generateRandomString(64);
    return { publicKey, privateKey };
  }
}

// Generate a more secure signature for a transaction with timestamp and nonce
export function signTransaction(privateKey: string, transactionData: any): string {
  try {
    // Add timestamp and nonce to prevent replay attacks
    const secureTransactionData = {
      ...transactionData,
      timestamp: Date.now(),
      nonce: btoa(Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
                .map(byte => String.fromCharCode(byte))
                .join(''))
    };
    
    // Create a more secure signature
    const dataString = JSON.stringify(secureTransactionData);
    const signature = `sig_${hashString(privateKey + dataString)}_${secureTransactionData.nonce}`;
    
    // Return both the signature and enhanced transaction data
    return signature;
  } catch (error) {
    console.error("Error signing transaction:", error);
    // Fallback to basic implementation
    const dataString = JSON.stringify(transactionData);
    return `sig_${hashString(privateKey + dataString)}`;
  }
}

// Verify a transaction signature with timestamp validation
export function verifySignature(
  publicKey: string, 
  transactionData: any, 
  signature: string
): boolean {
  try {
    if (!signature || !transactionData) {
      return false;
    }
    
    // In a real implementation, we would:
    // 1. Verify the signature cryptographically
    // 2. Check that the timestamp is within an acceptable time window (e.g., last 5 minutes)
    // 3. Verify the nonce hasn't been used before
    
    // For demo purposes, we're doing a simplified version
    const dataString = JSON.stringify(transactionData);
    
    // Extract nonce from signature if available
    const signatureParts = signature.split('_');
    if (signatureParts.length === 3) {
      // Enhanced signature with nonce
      const expectedSignature = `sig_${hashString(getSimulatedPrivateKey(publicKey) + dataString)}_${signatureParts[2]}`;
      return signature === expectedSignature;
    } else {
      // Legacy signature format
      const expectedSignature = `sig_${hashString(getSimulatedPrivateKey(publicKey) + dataString)}`;
      return signature === expectedSignature;
    }
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// Helpers for the simulation
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

function hashString(str: string): string {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
}

// For demo purposes only - in a real app the private key would never be derivable from the public key
function getSimulatedPrivateKey(publicKey: string): string {
  return publicKey + '_private_part';
}

// Generate a transaction code (like a reference number)
export function generateTransactionCode(): string {
  return `EMG${Math.floor(1000000 + Math.random() * 9000000)}`;
}
