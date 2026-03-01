// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVWDmz4Cc9KLvBwf7iLsQiL_9HdjFw4Zk",
    authDomain: "watchfree-d9e16.firebaseapp.com",
    projectId: "watchfree-d16",
    storageBucket: "watchfree-d9e16.firebasestorage.app",
    messagingSenderId: "4487476314",
    appId: "1:4487476314:web:6dfa4e14a8660705b15463",
    measurementId: "G-0GY2JYKLHJ"
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
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    isFirebaseInitialized = false;
}

// Firebase Service
const FirebaseService = {
    // Initialize
    initializeFirebase: () => isFirebaseInitialized,
    
    // Getters
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
            
            // Save user data to Firestore
            await db.collection(userData.userType + 's').doc(user.uid).set({
                ...userData,
                uid: user.uid,
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
    
    // User Data Methods
    getUserData: async (userId, userType) => {
        try {
            if (!isFirebaseInitialized) throw new Error('Firebase not initialized');
            
            const doc = await db.collection(userType + 's').doc(userId).get();
            if (doc.exists) {
                return { success: true, data: doc.data() };
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
                updatedAt: new Date().toISOString()
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
            
            projectData.createdAt = new Date().toISOString();
            projectData.updatedAt = new Date().toISOString();
            
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
                updatedAt: new Date().toISOString()
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

// Make FirebaseService available globally
window.FirebaseService = FirebaseService;
window.firebaseInitialized = isFirebaseInitialized;
