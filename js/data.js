/**
 * Egg Hen Market - Centralized Full-Stack Connected Store Engine
 * Connects User Portal and Admin Panel with real shared Express backend database (/api/*),
 * ensures real-time polling synchronization, handles financial validations,
 * and maintains atomic cross-portal reactivity.
 */

const STORAGE_KEY = 'EHM_STORE_DATA_v3';
const AUTH_KEY = 'EHM_AUTH_SESSION_v3';

class EggHenStore {
  constructor() {
    this.data = {
      users: [],
      admin: null,
      deposits: [],
      withdrawals: [],
      eggSellRequests: [],
      purchases: [],
      henPackages: [],
      marketBuyers: [],
      transactions: [],
      notifications: [],
      eggSettings: {},
      referralSettings: {},
      websiteSettings: {},
      stats: {
        totalUsers: 0,
        todayUsers: 0,
        activeInvestments: 0,
        totalInvestments: 0,
        todayCommission: 0,
        totalCommission: 0,
        todayDeposits: 0,
        pendingDepositAmount: 0,
        totalDeposited: 0,
        pendingDepositsCount: 0,
        rejectedDepositsCount: 0,
        depositedCharge: 0,
        todayEggsSold: 0,
        todayEggsAmount: 0,
        pendingEggsQuantity: 0,
        pendingEggsAmount: 0,
        totalEggsQuantity: 0,
        totalEggsAmount: 0,
        pendingEggRequests: 0,
        rejectedEggRequests: 0,
        todayBuyPlan: 0,
        totalInterest: 0,
        closedInvestment: 0,
        pendingWithdrawalAmount: 0,
        pendingWithdrawalsCount: 0,
        totalWithdrawn: 0
      }
    };

    this.isSyncing = false;
    this.initStore();
    this.startLiveSync();
  }

  // Initial load from localStorage cache and server
  async initStore() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        this.data = { ...this.data, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn('Cache parse error:', e);
    }

    await this.syncWithServer();
  }

  // Save in local cache and notify listeners
  saveCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }

  broadcast(type, payload) {
    const event = new CustomEvent('ehm_event', { detail: { type, payload } });
    window.dispatchEvent(event);
  }

  // Fetch full state from backend
  async syncWithServer() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const [stateRes, usersRes, txRes, depRes, wthRes, eggRes, purRes] = await Promise.all([
        fetch('/api/state').then((r) => r.json()).catch(() => null),
        fetch('/api/users').then((r) => r.json()).catch(() => null),
        fetch('/api/transactions').then((r) => r.json()).catch(() => null),
        fetch('/api/deposits').then((r) => r.json()).catch(() => null),
        fetch('/api/withdrawals').then((r) => r.json()).catch(() => null),
        fetch('/api/egg-sales').then((r) => r.json()).catch(() => null),
        fetch('/api/purchases').then((r) => r.json()).catch(() => null)
      ]);

      let changed = false;

      if (stateRes && stateRes.success) {
        this.data.stats = stateRes.stats;
        this.data.henPackages = stateRes.henPackages || this.data.henPackages;
        this.data.marketBuyers = stateRes.marketBuyers || this.data.marketBuyers;
        if (stateRes.settings) {
          this.data.eggSettings = stateRes.settings.eggSettings || {};
          this.data.referralSettings = stateRes.settings.referralSettings || {};
          this.data.websiteSettings = stateRes.settings.websiteSettings || {};
        }
        changed = true;
      }

      if (usersRes && usersRes.success) {
        this.data.users = usersRes.users;
        changed = true;
      }

      if (txRes && txRes.success) {
        this.data.transactions = txRes.transactions;
        changed = true;
      }

      if (depRes && depRes.success) {
        this.data.deposits = depRes.deposits;
        changed = true;
      }

      if (wthRes && wthRes.success) {
        this.data.withdrawals = wthRes.withdrawals;
        changed = true;
      }

      if (eggRes && eggRes.success) {
        this.data.eggSellRequests = eggRes.eggSales;
        changed = true;
      }

      if (purRes && purRes.success) {
        this.data.purchases = purRes.purchases;
        changed = true;
      }

      if (changed) {
        this.saveCache();
        this.broadcast('data_synced', this.data);
      }
    } catch (err) {
      console.warn('Server sync error:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  // Periodic polling for live multi-user sync
  startLiveSync() {
    setInterval(() => {
      this.syncWithServer();
    }, 2500);
  }

  // Session & Authentication
  getSession() {
    try {
      const session = localStorage.getItem(AUTH_KEY);
      if (session) {
        return JSON.parse(session);
      }
    } catch (e) {
      console.error(e);
    }

    const defaultSession = {
      role: 'user',
      username: 'demo',
      userId: 'USR-8821'
    };
    this.setSession(defaultSession);
    return defaultSession;
  }

  setSession(session) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    this.broadcast('session_changed', session);
  }

  async login(username, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        const session = {
          role: data.role,
          username: data.user.username,
          userId: data.user.id,
          token: data.token || null
        };
        this.setSession(session);
        await this.syncWithServer();
        return data;
      }
      return data;
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Server communication error during login.' };
    }
  }

  logout() {
    localStorage.removeItem(AUTH_KEY);
    this.broadcast('logged_out', null);
    window.location.href = 'login.html';
  }

  // User queries
  getCurrentUser() {
    const session = this.getSession();
    if (session.role === 'admin') {
      return {
        id: 'ADM-001',
        username: 'admin',
        name: 'Chief Executive Controller',
        role: 'admin',
        isSuperAdmin: true
      };
    }
    const user = this.data.users.find(
      (u) => u.id === session.userId || u.username.toLowerCase() === session.username.toLowerCase()
    );
    return user || this.data.users[0] || {
      id: 'USR-8821',
      username: 'demo',
      name: 'Sultan Agro Farms',
      phone: '0327272727',
      balance: 14500,
      availableEggs: 124.5,
      totalHens: 16
    };
  }

  getUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByUsername(username) {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  async updateUser(userId, updates) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (json.success) {
        const idx = this.data.users.findIndex((u) => u.id === userId);
        if (idx !== -1) this.data.users[idx] = json.user;
        this.saveCache();
        this.broadcast('data_changed', this.data);
      }
      return json;
    } catch (err) {
      console.error('Update user error:', err);
      return { success: false, message: 'Network error updating user.' };
    }
  }

  async createUser(userData) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const json = await res.json();
      if (json.success) {
        this.data.users.unshift(json.user);
        this.saveCache();
        this.broadcast('data_changed', this.data);
      }
      return json;
    } catch (err) {
      console.error('Create user error:', err);
      return { success: false, message: 'Network error creating user.' };
    }
  }

  // Hen Packages
  getHenPackages() {
    return this.data.henPackages || [];
  }

  getHenPackageById(id) {
    return this.data.henPackages.find((p) => p.id === id);
  }

  async addHenPackage(pkgData) {
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkgData)
      });
      const json = await res.json();
      if (json.success) {
        this.data.henPackages.push(json.package);
        this.saveCache();
        this.broadcast('data_changed', this.data);
      }
      return json;
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  }

  async updateHenPackage(id, updates) {
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (json.success) {
        const idx = this.data.henPackages.findIndex((p) => p.id === id);
        if (idx !== -1) this.data.henPackages[idx] = json.package;
        this.saveCache();
        this.broadcast('data_changed', this.data);
      }
      return json;
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  }

  async deleteHenPackage(id) {
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        this.data.henPackages = this.data.henPackages.filter((p) => p.id !== id);
        this.saveCache();
        this.broadcast('data_changed', this.data);
      }
      return json;
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  }

  // Market Buyers
  getMarketBuyers() {
    return this.data.marketBuyers || [];
  }

  async updateMarketBuyer(id, updates) {
    try {
      const res = await fetch(`/api/buyers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (json.success) {
        const idx = this.data.marketBuyers.findIndex((b) => b.id === id);
        if (idx !== -1) this.data.marketBuyers[idx] = json.buyer;
        this.saveCache();
        this.broadcast('data_changed', this.data);
      }
      return json;
    } catch (e) {
      console.error(e);
      return { success: false };
    }
  }

  // Transactions Ledger
  getTransactions(filter = {}) {
    let txs = [...(this.data.transactions || [])];
    if (filter.userId) {
      txs = txs.filter((t) => t.userId === filter.userId);
    }
    if (filter.type && filter.type !== 'All') {
      txs = txs.filter((t) => t.type.toLowerCase().includes(filter.type.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.username && t.username.toLowerCase().includes(q))
      );
    }
    return txs;
  }

  // User Action: Deposit Request
  async depositFunds(amount, method = 'JazzCash', trxId = '') {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return { success: false, message: 'Invalid session' };

    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: Number(amount),
          method,
          trxId
        })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Deposit error:', err);
      return { success: false, message: 'Network error submitting deposit.' };
    }
  }

  // User Action: Withdrawal Request
  async withdrawFunds(amount, method = 'JazzCash', accountTitle = '', accountNumber = '') {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return { success: false, message: 'Invalid session' };

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amount: Number(amount),
          method,
          accountTitle,
          accountNumber
        })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Withdrawal error:', err);
      return { success: false, message: 'Network error submitting withdrawal.' };
    }
  }

  // User Action: Sell Eggs Request
  async sellEggs(buyerId, eggQuantity) {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return { success: false, message: 'Invalid session' };

    try {
      const res = await fetch('/api/egg-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          buyerId,
          eggsQuantity: Number(eggQuantity)
        })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Sell eggs error:', err);
      return { success: false, message: 'Network error submitting egg sale.' };
    }
  }

  // User Action: Buy Hens Plan
  async buyHenPackage(packageId, quantityMultiplier = 1) {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return { success: false, message: 'Invalid session' };

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          packageId,
          quantityMultiplier: Number(quantityMultiplier) || 1
        })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Buy hens error:', err);
      return { success: false, message: 'Network error purchasing hen plan.' };
    }
  }

  // User Action: Daily Harvest
  async harvestDailyEggs() {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return { success: false, message: 'Invalid session' };

    try {
      const res = await fetch('/api/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Harvest error:', err);
      return { success: false, message: 'Network error harvesting eggs.' };
    }
  }

  // ADMIN ACTIONS: Deposits Approval & Rejection
  async approveDeposit(depositId, adminNote = '') {
    try {
      const res = await fetch(`/api/deposits/${depositId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Approve deposit error:', err);
      return { success: false, message: 'Network error approving deposit.' };
    }
  }

  async rejectDeposit(depositId, adminNote = '') {
    try {
      const res = await fetch(`/api/deposits/${depositId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Reject deposit error:', err);
      return { success: false, message: 'Network error rejecting deposit.' };
    }
  }

  // ADMIN ACTIONS: Withdrawals Approval & Rejection
  async approveWithdrawal(withdrawalId, adminNote = '') {
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Approve withdrawal error:', err);
      return { success: false, message: 'Network error approving withdrawal.' };
    }
  }

  async rejectWithdrawal(withdrawalId, adminNote = '') {
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Reject withdrawal error:', err);
      return { success: false, message: 'Network error rejecting withdrawal.' };
    }
  }

  // ADMIN ACTIONS: Egg Sell Requests Approval & Rejection
  async approveEggSale(eggId) {
    try {
      const res = await fetch(`/api/egg-sales/${eggId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Approve egg sale error:', err);
      return { success: false, message: 'Network error approving egg sale.' };
    }
  }

  async rejectEggSale(eggId) {
    try {
      const res = await fetch(`/api/egg-sales/${eggId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Reject egg sale error:', err);
      return { success: false, message: 'Network error rejecting egg sale.' };
    }
  }

  // ADMIN ACTIONS: Purchases Approval & Rejection
  async approvePurchase(purchaseId) {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Approve purchase error:', err);
      return { success: false, message: 'Network error approving purchase.' };
    }
  }

  async rejectPurchase(purchaseId) {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error('Reject purchase error:', err);
      return { success: false, message: 'Network error rejecting purchase.' };
    }
  }

  // Notifications
  async sendNotification(title, message, type = 'market') {
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type })
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  }

  // Settings
  async saveAllSettings(settingsPayload) {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload)
      });
      const json = await res.json();
      await this.syncWithServer();
      return json;
    } catch (err) {
      console.error(err);
      return { success: false };
    }
  }

  // Factory Reset
  async resetToDefaults() {
    try {
      await fetch('/api/reset', { method: 'POST' });
      localStorage.removeItem(STORAGE_KEY);
      await this.syncWithServer();
      this.broadcast('data_reset', this.data);
    } catch (e) {
      console.error(e);
    }
  }
}

// Global Singleton
window.EHMStore = new EggHenStore();
