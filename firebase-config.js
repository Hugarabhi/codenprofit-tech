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
    
    // Enable offline persistence for better offline experience
    db.enablePersistence({ synchronizeTabs: true })
      .then(() => console.log('Firestore persistence enabled'))
      .catch(err => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence enabled in one tab only');
        } else if (err.code === 'unimplemented') {
          console.warn('Browser doesn\'t support persistence');
        }
      });
    
    isFirebaseInitialized = true;
    console.log('✅ Firebase initialized successfully for codenprofit');
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
  // Initialize
  initializeFirebase: () => isFirebaseInitialized,
  
  // Getters
  getAuth: () => auth,
  getDb: () => db,
  getStorage: () => storage,
  isInitialized: () => isFirebaseInitialized,
  
  // Auth Methods
  signUp: async (email, password, userData) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!auth) throw new Error('Auth not available');
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await user.updateProfile({ displayName: userData.displayName });
      
      // Save user data to Firestore
      await db.collection(userData.userType + 's').doc(user.uid).set({
        ...userData,
        uid: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, user };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  },
  
  signIn: async (email, password) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!auth) throw new Error('Auth not available');
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: error.message };
    }
  },
  
  signOut: async () => {
    try {
      if (auth) await auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // User Data Methods
  getUserData: async (userId, userType) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      const doc = await db.collection(userType + 's').doc(userId).get();
      if (doc.exists) {
        return { success: true, data: { id: doc.id, ...doc.data() } };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('Get user data error:', error);
      return { success: false, error: error.message };
    }
  },
  
  updateUserData: async (userId, userType, data) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      await db.collection(userType + 's').doc(userId).set({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      console.error('Update user data error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Projects Methods
  createProject: async (projectData) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      const dataToSave = {
        ...projectData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection('projects').add(dataToSave);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Create project error:', error);
      return { success: false, error: error.message };
    }
  },
  
  getProjectsByHost: async (hostId) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      const snapshot = await db.collection('projects')
        .where('hostId', '==', hostId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, projects };
    } catch (error) {
      console.error('Get projects error:', error);
      return { success: false, error: error.message };
    }
  },
  
  getAvailableProjects: async () => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      const snapshot = await db.collection('projects')
        .where('status', '==', 'open')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, projects };
    } catch (error) {
      console.error('Get available projects error:', error);
      return { success: false, error: error.message };
    }
  },
  
  updateProject: async (projectId, data) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      await db.collection('projects').doc(projectId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update project error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Developers Methods
  getDevelopers: async (filter = 'all') => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!db) throw new Error('Firestore not available');
      
      let query = db.collection('developers').where('onboardingComplete', '==', true);
      
      if (filter !== 'all') {
        query = query.where('skills', 'array-contains', filter);
      }
      
      const snapshot = await query.limit(20).get();
      const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return { success: true, developers };
    } catch (error) {
      console.error('Get developers error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // File Upload
  uploadFile: async (file, path) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      if (!storage) throw new Error('Storage not available');
      
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      
      return { success: true, url };
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: error.message };
    }
  }
};

// Make FirebaseService available globally
window.FirebaseService = FirebaseService;
window.firebaseInitialized = isFirebaseInitialized;

// Log status
console.log('Firebase initialized:', isFirebaseInitialized);
