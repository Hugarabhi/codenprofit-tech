// firebase-config.js
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
  console.log('Firebase initialized successfully for codenprofit');
} catch (error) {
  console.error('Firebase initialization error:', error);
  isFirebaseInitialized = false;
}

// Firebase Service (same as before)
const FirebaseService = {
  initializeFirebase: () => isFirebaseInitialized,
  getAuth: () => auth,
  getDb: () => db,
  getStorage: () => storage,
  
  // Auth Methods
  signUp: async (email, password, userData) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      await user.updateProfile({ displayName: userData.displayName });
      
      await db.collection(userData.userType + 's').doc(user.uid).set({
        ...userData,
        uid: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
  
  // User Data Methods
  getUserData: async (userId, userType) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const doc = await db.collection(userType + 's').doc(userId).get();
      if (doc.exists) {
        return { success: true, data: { id: doc.id, ...doc.data() } };
      }
      return { success: false, error: 'User not found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  updateUserData: async (userId, userType, data) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      await db.collection(userType + 's').doc(userId).set({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Projects Methods
  createProject: async (projectData) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      projectData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      projectData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      
      const docRef = await db.collection('projects').add(projectData);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getProjectsByHost: async (hostId) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const snapshot = await db.collection('projects')
        .where('hostId', '==', hostId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getAvailableProjects: async () => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const snapshot = await db.collection('projects')
        .where('status', '==', 'open')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, projects };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  updateProject: async (projectId, data) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      await db.collection('projects').doc(projectId).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Developers Methods
  getDevelopers: async (filter = 'all') => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      let query = db.collection('developers').where('onboardingComplete', '==', true);
      
      if (filter !== 'all') {
        query = query.where('skills', 'array-contains', filter);
      }
      
      const snapshot = await query.limit(20).get();
      const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return { success: true, developers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // File Upload
  uploadFile: async (file, path) => {
    try {
      if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
      
      const storageRef = storage.ref();
      const fileRef = storageRef.child(`${path}/${Date.now()}_${file.name}`);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      
      return { success: true, url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

window.FirebaseService = FirebaseService;
window.firebaseInitialized = isFirebaseInitialized;
