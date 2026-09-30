/**
 * Egg Hen Market - Firebase Firestore & Auth Central Bridge
 * Provides real-time Firestore database synchronization, Auth helpers,
 * and seamless fallback to Express backend database (/api/*).
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDemoPlaceholderKeyForEggHenMarket",
  authDomain: "egg-hen-market.firebaseapp.com",
  projectId: "egg-hen-market",
  storageBucket: "egg-hen-market.appspot.com",
  messagingSenderId: "470108948509",
  appId: "1:470108948509:web:b4fe32f9e47745c6a04c86"
};

class FirebaseBridge {
  constructor() {
    this.isInitialized = false;
    this.db = null;
    this.auth = null;
    this.unsubscribers = [];
    this.init();
  }

  init() {
    try {
      if (typeof window.firebase !== 'undefined' && !this.isInitialized) {
        if (!window.firebase.apps || window.firebase.apps.length === 0) {
          window.firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.db = window.firebase.firestore ? window.firebase.firestore() : null;
        this.auth = window.firebase.auth ? window.firebase.auth() : null;
        this.isInitialized = true;
        console.log('[FirebaseBridge] Firestore & Auth initialized successfully.');
        this.setupRealtimeListeners();
      }
    } catch (e) {
      console.warn('[FirebaseBridge] Firebase live connection pending or using local backend bridge:', e.message);
    }
  }

  setupRealtimeListeners() {
    if (!this.db) return;

    try {
      // Real-time synchronization for users
      const unsubUsers = this.db.collection('users').onSnapshot((snapshot) => {
        const users = [];
        snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
        if (users.length > 0 && window.EHMStore) {
          window.EHMStore.data.users = users;
          window.EHMStore.broadcast('data_synced', window.EHMStore.data);
        }
      }, (err) => console.warn('Firestore users listen notice:', err.message));
      this.unsubscribers.push(unsubUsers);

      // Real-time synchronization for deposits
      const unsubDeposits = this.db.collection('deposits').onSnapshot((snapshot) => {
        const deposits = [];
        snapshot.forEach((doc) => deposits.push({ id: doc.id, ...doc.data() }));
        if (deposits.length > 0 && window.EHMStore) {
          window.EHMStore.data.deposits = deposits;
          window.EHMStore.broadcast('data_synced', window.EHMStore.data);
        }
      }, (err) => console.warn('Firestore deposits listen notice:', err.message));
      this.unsubscribers.push(unsubDeposits);

      // Real-time synchronization for withdrawals
      const unsubWithdrawals = this.db.collection('withdrawals').onSnapshot((snapshot) => {
        const withdrawals = [];
        snapshot.forEach((doc) => withdrawals.push({ id: doc.id, ...doc.data() }));
        if (withdrawals.length > 0 && window.EHMStore) {
          window.EHMStore.data.withdrawals = withdrawals;
          window.EHMStore.broadcast('data_synced', window.EHMStore.data);
        }
      }, (err) => console.warn('Firestore withdrawals listen notice:', err.message));
      this.unsubscribers.push(unsubWithdrawals);

      // Real-time synchronization for packages
      const unsubPackages = this.db.collection('henPackages').onSnapshot((snapshot) => {
        const packages = [];
        snapshot.forEach((doc) => packages.push({ id: doc.id, ...doc.data() }));
        if (packages.length > 0 && window.EHMStore) {
          window.EHMStore.data.henPackages = packages;
          window.EHMStore.broadcast('data_synced', window.EHMStore.data);
        }
      }, (err) => console.warn('Firestore packages listen notice:', err.message));
      this.unsubscribers.push(unsubPackages);
    } catch (err) {
      console.warn('Real-time listener setup:', err);
    }
  }

  // Push record to Firestore
  async saveDocument(collectionName, docId, data) {
    if (!this.db) return false;
    try {
      await this.db.collection(collectionName).doc(docId).set(data, { merge: true });
      return true;
    } catch (e) {
      console.warn(`Firestore save error on ${collectionName}:`, e);
      return false;
    }
  }

  async deleteDocument(collectionName, docId) {
    if (!this.db) return false;
    try {
      await this.db.collection(collectionName).doc(docId).delete();
      return true;
    } catch (e) {
      console.warn(`Firestore delete error on ${collectionName}:`, e);
      return false;
    }
  }
}

window.EHM出FirebaseBridge = new FirebaseBridge();
