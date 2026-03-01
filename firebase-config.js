// Firebase Configuration for codenprofit
const firebaseConfig = {
  apiKey: "AIzaSyBUrhsiZFUC2RDwZamM1u322kbix0lM58M",
  authDomain: "codenprofit.firebaseapp.com",
  projectId: "codenprofit",
  storageBucket: "codenprofit.firebasestorage.app",
  messagingSenderId: "332503412631",
  appId: "1:332503412631:web:bbb5c5755253152d639ed2",
  measurementId: "G-7307V077K6"
};

// Initialize Firebase
let app, auth, db, storage;
let isFirebaseInitialized = false;

// Check if Firebase SDK is loaded
if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.apps[0];
    }
    
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Enable offline persistence
    db.enablePersistence({ synchronizeTabs: true })
      .catch(err => console.warn('Firestore persistence error:', err));
    
    isFirebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    isFirebaseInitialized = false;
  }
} else {
  console.error('❌ Firebase SDK not loaded');
  isFirebaseInitialized = false;
}

// Firebase Service Object
const FirebaseService = {
  isInitialized: () => isFirebaseInitialized,
  getAuth: () => auth,
  getDb: () => db,
  
  // Auth Methods
  signUp: async (email, password, userData) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await user.updateProfile({ displayName: userData.displayName });
      
      // Save to Firestore
      await db.collection(userData.userType + 's').doc(user.uid).set({
        ...userData,
        uid: user.uid,
        email: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  signIn: async (email, password) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  signOut: async () => {
    try {
      if (auth) await auth.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get User Type
  getUserType: async (userId) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      // Check both collections
      const devDoc = await db.collection('developers').doc(userId).get();
      if (devDoc.exists) {
        return { success: true, type: 'developer', data: devDoc.data() };
      }
      
      const hostDoc = await db.collection('hosts').doc(userId).get();
      if (hostDoc.exists) {
        return { success: true, type: 'host', data: hostDoc.data() };
      }
      
      return { success: false, error: 'User type not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

window.FirebaseService = FirebaseService;
window.firebaseInitialized = isFirebaseInitialized;
