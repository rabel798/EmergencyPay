// Firebase configuration and setup
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration
// Note: These values should be provided by the user
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase conditionally
let firebaseApp: any;
let auth: any;
let googleProvider: any;

try {
  // Only initialize if the required environment variables are available
  if (
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  ) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    googleProvider = new GoogleAuthProvider();
    
    // Add scopes if needed
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase configuration missing. Authentication features will be unavailable.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { firebaseApp, auth, googleProvider };