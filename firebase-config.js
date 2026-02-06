// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVWDmz4Cc9KLvBwf7iLsQiL_9HdjFw4Zk",
    authDomain: "watchfree-d9e16.firebaseapp.com",
    projectId: "watchfree-d9e16",
    storageBucket: "watchfree-d9e16.firebasestorage.app",
    messagingSenderId: "4487476314",
    appId: "1:4487476314:web:6dfa4e14a8660705b15463",
    measurementId: "G-0GY2JYKLHJ"
};

// Initialize Firebase
let auth = null;
let db = null;
let storage = null;

function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        storage = firebase.storage();
        
        // Enable offline persistence
        db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                console.warn("Firestore persistence failed:", err.code);
            });
            
        console.log("Firebase initialized successfully");
        return true;
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        return false;
    }
}

// Common Firebase Functions
const FirebaseService = {
    // Auth Functions
    async signUp(email, password, userData) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update display name
            await user.updateProfile({
                displayName: userData.displayName
            });
            
            // Create user document
            await this.createUserDocument(user.uid, userData);
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Firestore Functions
    async createUserDocument(uid, userData) {
        try {
            const collection = userData.userType === 'developer' ? 'developers' : 'hosts';
            
            const userDoc = {
                uid: uid,
                email: userData.email,
                displayName: userData.displayName,
                userType: userData.userType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                onboardingComplete: false,
                isDemo: false
            };
            
            // Add type-specific data
            if (userData.userType === 'developer') {
                Object.assign(userDoc, {
                    role: '',
                    skills: [],
                    portfolio: '',
                    bio: '',
                    hourlyRate: 0,
                    totalEarnings: 0,
                    pendingEarnings: 0,
                    activeProjects: 0,
                    completedProjects: 0,
                    avgRating: 0,
                    badges: ['New Member'],
                    rating: 0,
                    earnings: 0,
                    projectsCompleted: 0,
                    strikes: 0
                });
            } else {
                Object.assign(userDoc, {
                    companyName: userData.companyName || '',
                    industry: userData.industry || '',
                    subscription: 'basic',
                    projects: [],
                    brandAssets: {}
                });
            }
            
            await db.collection(collection).doc(uid).set(userDoc);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getUserData(uid, userType) {
        try {
            const collection = userType === 'developer' ? 'developers' : 'hosts';
            const doc = await db.collection(collection).doc(uid).get();
            
            if (doc.exists) {
                return { success: true, data: doc.data() };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async updateUserData(uid, userType, data) {
        try {
            const collection = userType === 'developer' ? 'developers' : 'hosts';
            await db.collection(collection).doc(uid).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Project Functions
    async createProject(projectData) {
        try {
            const docRef = await db.collection('projects').add({
                ...projectData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getProjectsByHost(hostId) {
        try {
            const snapshot = await db.collection('projects')
                .where('hostId', '==', hostId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, projects: projects };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getOpenProjects() {
        try {
            const snapshot = await db.collection('projects')
                .where('status', '==', 'open')
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, projects: projects };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async updateProject(projectId, data) {
        try {
            await db.collection('projects').doc(projectId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Developer Functions
    async getAvailableDevelopers() {
        try {
            const snapshot = await db.collection('developers')
                .where('onboardingComplete', '==', true)
                .limit(20)
                .get();
            
            const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, developers: developers };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Storage Functions
    async uploadBrandAsset(file, uid) {
        try {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(`brand-assets/${uid}/${Date.now()}_${file.name}`);
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            return { success: true, url: downloadURL };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Chat Functions
    async sendMessage(projectId, messageData) {
        try {
            await db.collection('projects').doc(projectId).collection('messages').add({
                ...messageData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getMessages(projectId) {
        try {
            const snapshot = await db.collection('projects').doc(projectId)
                .collection('messages')
                .orderBy('timestamp', 'asc')
                .limit(50)
                .get();
            
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return { success: true, messages: messages };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    // Demo Mode Functions
    setupDemoMode() {
        console.log("Setting up demo mode");
        // Mock auth object for demo
        auth = {
            currentUser: { uid: 'demo_user', email: 'demo@codenprofit.com', displayName: 'Demo User' },
            onAuthStateChanged: (callback) => {
                callback({ uid: 'demo_user', email: 'demo@codenprofit.com', displayName: 'Demo User' });
                return () => {};
            },
            signOut: () => Promise.resolve()
        };
        
        // Mock db object for demo
        db = {
            collection: () => ({
                doc: () => ({
                    get: () => Promise.resolve({ exists: false }),
                    set: () => Promise.resolve(),
                    update: () => Promise.resolve(),
                    collection: () => ({
                        add: () => Promise.resolve(),
                        get: () => Promise.resolve({ docs: [] })
                    })
                }),
                where: () => ({ orderBy: () => ({ get: () => Promise.resolve({ docs: [] }) }) }),
                add: () => Promise.resolve({ id: 'demo_id' })
            })
        };
        
        return true;
    }
};

// Check if running locally (no Firebase)
function isLocalEnvironment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
}
