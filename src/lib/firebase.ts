// lib/firebase.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getAnalytics, isSupported as isAnalyticsSupported, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from "firebase/firestore";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
  type Messaging
} from 'firebase/messaging';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC8fm6JfwUqtr_YBpg01hxo6JKAQQ8kgPc",
  authDomain: "mbad-c532e.firebaseapp.com",
  projectId: "mbad-c532e",
  storageBucket: "mbad-c532e.firebasestorage.app",
  messagingSenderId: "634830609207",
  appId: "1:634830609207:web:d23ecb61175f8ee56fd8b2",
  measurementId: "G-EHLS0LGKEM"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
console.log("Firebase App initialized");

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
console.log("Auth, Firestore, and Storage initialized");

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized");
    } else {
      console.log("Firebase Analytics not supported on this browser.");
    }
  }).catch(err => {
    console.error("Error checking Analytics support or initializing Analytics:", err);
  });
} else {
  console.log("Not in a browser environment, Firebase Analytics not initialized.");
}

let messagingSingleton: Messaging | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

const getInitializedMessaging = (): Promise<Messaging | null> => {
    if (messagingSingleton) {
        console.log("Firebase.ts: Returning existing messaging instance");
        return Promise.resolve(messagingSingleton);
    }
    if (messagingPromise) {
        console.log("Firebase.ts: Returning existing messaging promise");
        return messagingPromise;
    }

    console.log("Firebase.ts: Creating new messaging promise");
    messagingPromise = new Promise(async (resolve) => {
        if (typeof window !== 'undefined') {
            try {
                console.log("Firebase.ts: Checking if messaging is supported...");
                const supported = await isMessagingSupported();
                console.log("Firebase.ts: Messaging supported:", supported);
                
                if (supported) {
                    console.log("Firebase.ts: Messaging is supported. Initializing...");
                    messagingSingleton = getMessaging(app);
                    console.log("Firebase.ts: Messaging SDK initialized successfully");
                    resolve(messagingSingleton);
                } else {
                    console.log("Firebase.ts: Firebase Messaging is not supported by isMessagingSupported().");
                    messagingSingleton = null; // Ensure it's null if not supported
                    resolve(null);
                }
            } catch (err) {
                console.error('Firebase.ts: Failed to initialize Firebase Messaging SDK:', err);
                messagingSingleton = null; // Ensure it's null on error
                resolve(null);
            }
        } else {
            console.log("Firebase.ts: Not in a browser environment, Firebase Messaging not initialized.");
            messagingSingleton = null; // Ensure it's null
            resolve(null);
        }
    });
    return messagingPromise;
};


export const requestForToken = async (): Promise<string | null> => {
  console.log("🔔 Firebase.ts: requestForToken called");
  
  const messaging = await getInitializedMessaging();
  if (!messaging) {
    console.warn('❌ Firebase.ts: requestForToken - Firebase Messaging instance is not available.');
    return null;
  }

  console.log("✅ Firebase.ts: Messaging instance available, proceeding with token request");

  const vapidKeyFromServer = "BKm-UFW7sk0sV3T_B1zwflA9LIsX2HaUwLQMgzG_7QrEC6pah0MN5ki8sWqDm4PLnfXtFoS7RNBHhMSyzSpOq_4";
  console.log("🔔 Firebase.ts: Attempting to get FCM token with VAPID key:", vapidKeyFromServer.substring(0, 20) + "...");

  try {
    console.log("🔔 Firebase.ts: Calling getToken...");
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKeyFromServer
    });

    if (currentToken) {
      console.log('✅ Firebase.ts: FCM Token obtained successfully!');
      console.log('🔔 Firebase.ts: Token preview:', currentToken.substring(0, 20) + '...');
      return currentToken;
    } else {
      console.warn('⚠️ Firebase.ts: No token received. Possible reasons:');
      console.warn('   - Notification permission not granted');
      console.warn('   - VAPID key incorrect');
      console.warn('   - Firebase project configuration issue');
      return null;
    }
  } catch (err) {
    console.error('❌ Firebase.ts: Error getting FCM token:', err);
    if (err instanceof Error) {
      console.error('❌ Firebase.ts: Error message:', err.message);
      if (err.message.includes('InvalidAccessError') || err.message.includes("applicationServerKey is not valid") || err.message.includes("token-subscribe-failed")) {
          console.error('❗️ Firebase.ts: VAPID key or Google Cloud project configuration issue detected');
          console.error('❗️ Firebase.ts: VAPID key being used:', vapidKeyFromServer.substring(0, 20) + "...");
      }
    }
    return null;
  }
};

export const setupOnMessageListener = async (callback: (payload: any) => void): Promise<(() => void) | null> => {
  console.log("🔔 Firebase.ts: setupOnMessageListener called");
  
  const messaging = await getInitializedMessaging();
  if (!messaging) {
    console.warn('❌ Firebase.ts: setupOnMessageListener - Firebase Messaging instance is not available.');
    return null;
  }
  
  console.log("✅ Firebase.ts: Setting up onMessage listener");
  
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📩 Firebase.ts: Foreground message received:', payload);
      callback(payload);
    });
    console.log("✅ Firebase.ts: onMessage listener set up successfully");
    return unsubscribe;
  } catch (error) {
     console.error("❌ Firebase.ts: Error setting up onMessage listener:", error);
     return null;
  }
};

export { app, auth, db, analytics, storage };
// Removed direct export of 'messagingInstance as messaging'
// AppInit.tsx will use the async setupOnMessageListener and requestForToken.
