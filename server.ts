import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Resolve project root dynamically (handles tsx server.ts vs node dist/server.js)
const PROJECT_ROOT = fs.existsSync(path.resolve(__dirname, 'package.json'))
  ? __dirname
  : path.resolve(__dirname, '..');

const DB_FILE = path.resolve(PROJECT_ROOT, 'data', 'database.json');

app.use(express.json());

// Ensure data directory exists
const dataDir = path.resolve(PROJECT_ROOT, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Default Seed Data
const DEFAULT_HEN_PACKAGES = [
  {
    id: 'pkg-1',
    name: '1 Hen Starter Pack',
    hens: 1,
    price: 580,
    dailyYield: 1.0,
    durationDays: 365,
    status: 'active',
    tag: 'Introductory',
    description: 'Optimal for beginners testing flock yield and daily collection cycles.',
    accent: 'bronze'
  },
  {
    id: 'pkg-2',
    name: '5 Hens Flock Unit',
    hens: 5,
    price: 2900,
    dailyYield: 5.2,
    durationDays: 365,
    status: 'active',
    tag: 'Popular',
    description: 'Steady daily harvest with balanced yield compounding.',
    accent: 'emerald'
  },
  {
    id: 'pkg-3',
    name: '10 Hens Commercial Coop',
    hens: 10,
    price: 5800,
    dailyYield: 10.8,
    durationDays: 365,
    status: 'active',
    tag: 'Best Value',
    description: 'High performance layer flock for commercial wholesale sellers.',
    accent: 'gold'
  },
  {
    id: 'pkg-4',
    name: '25 Hens Farm Estate',
    hens: 25,
    price: 14500,
    dailyYield: 27.5,
    durationDays: 365,
    status: 'active',
    tag: 'Estate Grade',
    description: 'Expanded acreage production unit with automated yield distribution.',
    accent: 'emerald'
  },
  {
    id: 'pkg-5',
    name: '50 Hens Industrial Flock',
    hens: 50,
    price: 29000,
    dailyYield: 56.0,
    durationDays: 365,
    status: 'active',
    tag: 'Institutional',
    description: 'Maximum throughput commercial unit with priority market buyer rates.',
    accent: 'gold'
  }
];

const DEFAULT_MARKET_BUYERS = [
  {
    id: 'buyer-5',
    name: 'United Egg Suppliers #5',
    rating: 4.9,
    reviews: 5609,
    ratePerEgg: 55,
    minEggs: 300,
    maxEggs: 1000000,
    badge: 'Institutional Partner',
    verified: true,
    turnaround: 'Instant Transfer'
  },
  {
    id: 'buyer-4',
    name: 'National Egg Traders #4',
    rating: 4.8,
    reviews: 4210,
    ratePerEgg: 47,
    minEggs: 100,
    maxEggs: 300,
    badge: 'Verified Buyer',
    verified: true,
    turnaround: 'Within 5 Mins'
  },
  {
    id: 'buyer-3',
    name: 'Royal Egg Traders #3',
    rating: 4.7,
    reviews: 3120,
    ratePerEgg: 40,
    minEggs: 50,
    maxEggs: 100,
    badge: 'Wholesale Depot',
    verified: true,
    turnaround: 'Immediate'
  },
  {
    id: 'buyer-2',
    name: 'Pakistan Egg Suppliers #2',
    rating: 4.7,
    reviews: 2190,
    ratePerEgg: 35,
    minEggs: 10,
    maxEggs: 50,
    badge: 'Fast Liquidity',
    verified: true,
    turnaround: 'Immediate'
  },
  {
    id: 'buyer-1',
    name: 'Pak Egg Traders #1',
    rating: 4.6,
    reviews: 1450,
    ratePerEgg: 30,
    minEggs: 1,
    maxEggs: 10,
    badge: 'Starter Counter',
    verified: true,
    turnaround: 'Instant Cash'
  }
];

const DEFAULT_USERS = [
  {
    id: 'USR-8821',
    username: 'demo',
    password: 'demo123',
    name: 'Sultan Agro Farms',
    phone: '0327272727',
    email: 'investor@egghenmarket.com',
    role: 'user',
    balance: 14500,
    availableEggs: 124.50,
    totalEggsEarned: 890.00,
    totalHens: 16,
    purchasedHens: 16,
    totalPurchasesAmount: 9280,
    totalSalesAmount: 38400,
    totalEggsSold: 820,
    pendingHens: 0,
    pendingEggs: 0,
    referralEggs: 45.00,
    referralsCount: 7,
    referralCode: 'EHM882',
    referredBy: 'Imperial Founder',
    status: 'active',
    registeredAt: '2026-08-15',
    lastHarvestTime: Date.now() - 42000,
    harvestIntervalSeconds: 60,
    autoHarvest: false
  },
  {
    id: 'USR-8822',
    username: 'tariq_layers',
    password: 'user123',
    name: 'Tariq Mahmood Agro',
    phone: '03001234567',
    email: 'tariq@gmail.com',
    role: 'user',
    balance: 48500,
    availableEggs: 412.00,
    totalEggsEarned: 2600.00,
    totalHens: 50,
    purchasedHens: 50,
    totalPurchasesAmount: 29000,
    totalSalesAmount: 89400,
    totalEggsSold: 1950,
    pendingHens: 0,
    pendingEggs: 0,
    referralEggs: 120.00,
    referralsCount: 14,
    referralCode: 'TARIQ77',
    referredBy: 'EHM882',
    status: 'active',
    registeredAt: '2026-07-22',
    lastHarvestTime: Date.now() - 25000,
    harvestIntervalSeconds: 60,
    autoHarvest: true
  },
  {
    id: 'USR-8823',
    username: 'kamran_brood',
    password: 'user123',
    name: 'Kamran Sheikh Farm',
    phone: '03219876543',
    email: 'kamran@agro.pk',
    role: 'user',
    balance: 8200,
    availableEggs: 34.00,
    totalEggsEarned: 310.00,
    totalHens: 5,
    purchasedHens: 5,
    totalPurchasesAmount: 2900,
    totalSalesAmount: 11200,
    totalEggsSold: 280,
    pendingHens: 0,
    pendingEggs: 0,
    referralEggs: 15.00,
    referralsCount: 3,
    referralCode: 'KAMRAN9',
    referredBy: 'EHM882',
    status: 'active',
    registeredAt: '2026-09-01',
    lastHarvestTime: Date.now() - 50000,
    harvestIntervalSeconds: 60,
    autoHarvest: false
  },
  {
    id: 'USR-8824',
    username: 'malik_heritage',
    password: 'user123',
    name: 'Malik Waqas',
    phone: '03455554433',
    email: 'waqas@heritage.com',
    role: 'user',
    balance: 1400,
    availableEggs: 2.00,
    totalEggsEarned: 45.00,
    totalHens: 1,
    purchasedHens: 1,
    totalPurchasesAmount: 580,
    totalSalesAmount: 1600,
    totalEggsSold: 40,
    pendingHens: 0,
    pendingEggs: 0,
    referralEggs: 0,
    referralsCount: 1,
    referralCode: 'MALIK44',
    referredBy: 'TARIQ77',
    status: 'inactive',
    registeredAt: '2026-09-10',
    lastHarvestTime: Date.now() - 80000,
    harvestIntervalSeconds: 60,
    autoHarvest: false
  },
  {
    id: 'USR-8825',
    username: 'bilal_agro',
    password: 'user123',
    name: 'Bilal Agro Ventures',
    phone: '03009876543',
    email: 'bilal@agroventures.pk',
    role: 'user',
    balance: 22000,
    availableEggs: 85.00,
    totalEggsEarned: 520.00,
    totalHens: 25,
    purchasedHens: 25,
    totalPurchasesAmount: 14500,
    totalSalesAmount: 24000,
    totalEggsSold: 480,
    pendingHens: 0,
    pendingEggs: 0,
    referralEggs: 20.00,
    referralsCount: 2,
    referralCode: 'BILAL88',
    referredBy: 'EHM882',
    status: 'active',
    registeredAt: new Date().toISOString().split('T')[0],
    lastHarvestTime: Date.now() - 15000,
    harvestIntervalSeconds: 60,
    autoHarvest: false
  }
];

const DEFAULT_ADMIN = {
  id: 'ADM-001',
  username: 'admin',
  password: 'admin123',
  name: 'Chief Executive Controller',
  email: 'controller@egghenmarket.com',
  role: 'admin',
  token: 'adm_sec_994821038'
};

const DEFAULT_DEPOSITS = [
  {
    id: 'DEP-1001',
    userId: 'USR-8821',
    username: 'demo',
    userPhone: '0327272727',
    amount: 1500,
    method: 'JazzCash',
    trxId: 'JC-99482103',
    status: 'pending',
    createdAt: '2026-09-30 08:30 AM',
    processedAt: null,
    adminNote: null
  },
  {
    id: 'DEP-1002',
    userId: 'USR-8822',
    username: 'tariq_layers',
    userPhone: '03001234567',
    amount: 2000,
    method: 'EasyPaisa',
    trxId: 'EP-88294711',
    status: 'pending',
    createdAt: '2026-09-30 09:15 AM',
    processedAt: null,
    adminNote: null
  },
  {
    id: 'DEP-1003',
    userId: 'USR-8823',
    username: 'kamran_brood',
    userPhone: '03219876543',
    amount: 1140,
    method: 'Bank',
    trxId: 'MB-19827401',
    status: 'pending',
    createdAt: '2026-09-29 04:20 PM',
    processedAt: null,
    adminNote: null
  },
  {
    id: 'DEP-1004',
    userId: 'USR-8824',
    username: 'malik_heritage',
    userPhone: '03455554433',
    amount: 500,
    method: 'JazzCash',
    trxId: 'JC-55429188',
    status: 'pending',
    createdAt: '2026-09-29 02:10 PM',
    processedAt: null,
    adminNote: null
  },
  {
    id: 'DEP-1005',
    userId: 'USR-8821',
    username: 'demo',
    userPhone: '0327272727',
    amount: 25000,
    method: 'JazzCash',
    trxId: 'JC-11029482',
    status: 'approved',
    createdAt: '2026-09-20 10:00 AM',
    processedAt: '2026-09-20 10:05 AM',
    adminNote: 'Verified payment'
  },
  {
    id: 'DEP-1006',
    userId: 'USR-8822',
    username: 'tariq_layers',
    userPhone: '03001234567',
    amount: 50000,
    method: 'Bank',
    trxId: 'MB-77291034',
    status: 'approved',
    createdAt: '2026-09-18 11:30 AM',
    processedAt: '2026-09-18 11:45 AM',
    adminNote: 'Wholesale deposit credited'
  },
  {
    id: 'DEP-1007',
    userId: 'USR-8824',
    username: 'malik_heritage',
    userPhone: '03455554433',
    amount: 1000,
    method: 'EasyPaisa',
    trxId: 'EP-00000000',
    status: 'rejected',
    createdAt: '2026-09-15 01:20 PM',
    processedAt: '2026-09-15 01:40 PM',
    adminNote: 'Invalid transaction ID provided'
  }
];

const DEFAULT_WITHDRAWALS = [
  {
    id: 'WTH-1001',
    userId: 'USR-8821',
    username: 'demo',
    userPhone: '0327272727',
    amount: 2500,
    method: 'JazzCash',
    accountTitle: 'Sultan Agro Farms',
    accountNumber: '0327272727',
    status: 'pending',
    createdAt: '2026-09-30 09:40 AM',
    processedAt: null,
    adminNote: null
  },
  {
    id: 'WTH-1002',
    userId: 'USR-8822',
    username: 'tariq_layers',
    userPhone: '03001234567',
    amount: 5000,
    method: 'Bank',
    accountTitle: 'Tariq Mahmood Agro',
    accountNumber: 'PK45MEZN00010982347101',
    status: 'pending',
    createdAt: '2026-09-30 10:10 AM',
    processedAt: null,
    adminNote: null
  },
  {
    id: 'WTH-1003',
    userId: 'USR-8823',
    username: 'kamran_brood',
    userPhone: '03219876543',
    amount: 3000,
    method: 'EasyPaisa',
    accountTitle: 'Kamran Sheikh',
    accountNumber: '03219876543',
    status: 'approved',
    createdAt: '2026-09-25 03:00 PM',
    processedAt: '2026-09-25 03:15 PM',
    adminNote: 'Paid via EasyPaisa portal'
  }
];

const DEFAULT_EGG_SELL_REQUESTS = [
  {
    id: 'EGG-1001',
    userId: 'USR-8821',
    username: 'demo',
    buyerId: 'buyer-5',
    buyerName: 'United Egg Suppliers #5',
    eggsQuantity: 50,
    ratePerEgg: 55,
    totalAmount: 2750,
    status: 'pending',
    createdAt: '2026-09-30 08:45 AM',
    processedAt: null
  },
  {
    id: 'EGG-1002',
    userId: 'USR-8822',
    username: 'tariq_layers',
    buyerId: 'buyer-4',
    buyerName: 'National Egg Traders #4',
    eggsQuantity: 200,
    ratePerEgg: 47,
    totalAmount: 9400,
    status: 'pending',
    createdAt: '2026-09-30 09:20 AM',
    processedAt: null
  },
  {
    id: 'EGG-1003',
    userId: 'USR-8823',
    username: 'kamran_brood',
    buyerId: 'buyer-2',
    buyerName: 'Pakistan Egg Suppliers #2',
    eggsQuantity: 25,
    ratePerEgg: 35,
    totalAmount: 875,
    status: 'pending',
    createdAt: '2026-09-29 05:10 PM',
    processedAt: null
  },
  {
    id: 'EGG-1004',
    userId: 'USR-8821',
    username: 'demo',
    buyerId: 'buyer-5',
    buyerName: 'United Egg Suppliers #5',
    eggsQuantity: 120,
    ratePerEgg: 55,
    totalAmount: 6600,
    status: 'approved',
    createdAt: '2026-09-25 11:42 AM',
    processedAt: '2026-09-25 11:45 AM'
  },
  {
    id: 'EGG-1005',
    userId: 'USR-8822',
    username: 'tariq_layers',
    buyerId: 'buyer-4',
    buyerName: 'National Egg Traders #4',
    eggsQuantity: 450,
    ratePerEgg: 47,
    totalAmount: 21150,
    status: 'approved',
    createdAt: '2026-09-21 06:45 PM',
    processedAt: '2026-09-21 06:50 PM'
  }
];

const DEFAULT_PURCHASES = [
  {
    id: 'PUR-1001',
    userId: 'USR-8821',
    username: 'demo',
    packageId: 'pkg-3',
    packageName: '10 Hens Commercial Coop',
    hensCount: 10,
    amount: 5800,
    dailyYield: 10.8,
    status: 'approved',
    createdAt: '2026-09-24 04:15 PM'
  },
  {
    id: 'PUR-1002',
    userId: 'USR-8822',
    username: 'tariq_layers',
    packageId: 'pkg-5',
    packageName: '50 Hens Industrial Flock',
    hensCount: 50,
    amount: 29000,
    dailyYield: 56.0,
    status: 'approved',
    createdAt: '2026-09-22 02:11 PM'
  },
  {
    id: 'PUR-1003',
    userId: 'USR-8823',
    username: 'kamran_brood',
    packageId: 'pkg-2',
    packageName: '5 Hens Flock Unit',
    hensCount: 5,
    amount: 2900,
    dailyYield: 5.2,
    status: 'approved',
    createdAt: '2026-09-18 01:00 PM'
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: 'TXN-9842',
    userId: 'USR-8821',
    username: 'demo',
    type: 'Egg Sale',
    description: 'Sold 120 Grade-A Eggs to United Egg Suppliers #5',
    amount: 6600,
    quantity: '120 Eggs',
    rate: 'Rs. 55 / egg',
    date: '2026-09-25 11:42 AM',
    status: 'Completed'
  },
  {
    id: 'TXN-9838',
    userId: 'USR-8821',
    username: 'demo',
    type: 'Hen Purchase',
    description: 'Purchased 10 Hens Commercial Coop Package',
    amount: 5800,
    quantity: '10 Hens',
    rate: 'Rs. 580 / hen',
    date: '2026-09-24 04:15 PM',
    status: 'Completed'
  },
  {
    id: 'TXN-9831',
    userId: 'USR-8821',
    username: 'demo',
    type: 'Egg Earned',
    description: 'Daily automated flock laying cycle yield',
    amount: 0,
    quantity: '+16.8 Eggs',
    rate: 'Flock Yield',
    date: '2026-09-24 10:00 AM',
    status: 'Completed'
  },
  {
    id: 'TXN-9825',
    userId: 'USR-8821',
    username: 'demo',
    type: 'Referral Reward',
    description: 'Commission bonus from referral Tariq Mahmood purchase',
    amount: 435,
    quantity: '+5.0 Eggs',
    rate: '7.5% Tier 1',
    date: '2026-09-23 08:30 PM',
    status: 'Completed'
  },
  {
    id: 'TXN-9819',
    userId: 'USR-8822',
    username: 'tariq_layers',
    type: 'Hen Purchase',
    description: 'Purchased 50 Hens Industrial Flock Package',
    amount: 29000,
    quantity: '50 Hens',
    rate: 'Rs. 580 / hen',
    date: '2026-09-22 02:11 PM',
    status: 'Completed'
  },
  {
    id: 'TXN-9810',
    userId: 'USR-8822',
    username: 'tariq_layers',
    type: 'Egg Sale',
    description: 'Sold 450 Eggs to National Egg Traders #4',
    amount: 21150,
    quantity: '450 Eggs',
    rate: 'Rs. 47 / egg',
    date: '2026-09-21 06:45 PM',
    status: 'Completed'
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    title: 'Market Rate Appreciation',
    message: 'United Egg Suppliers #5 has increased their purchase rate to Rs. 55 per egg for high volume suppliers.',
    date: '10 mins ago',
    type: 'market',
    read: false
  },
  {
    id: 'NOTIF-2',
    title: 'Daily Flock Yield Synchronized',
    message: 'Your active hens laid fresh eggs today. Ready for immediate collection or cold storage trading.',
    date: '2 hours ago',
    type: 'harvest',
    read: false
  },
  {
    id: 'NOTIF-3',
    title: 'Imperial Referral Incentive',
    message: 'Direct commission of 7.5% credited for new flock activations within your verified network.',
    date: 'Yesterday',
    type: 'referral',
    read: true
  }
];

const DEFAULT_SETTINGS = {
  eggSettings: {
    baseRatePerEgg: 45.0,
    eggCollectionIntervalSeconds: 60,
    yieldMultiplier: 1.0,
    minEggSaleQuantity: 1,
    marketFeePercent: 0,
    timerIntervalMinutes: 60
  },
  referralSettings: {
    commissionPercent: 7.5,
    bonusEggsPerReferral: 5.0,
    rulesNote: 'Affiliate rewards credit immediately to cash balance upon verified flock plan deployment.'
  },
  websiteSettings: {
    siteName: 'Egg Hen Market',
    tagline: 'Imperial Poultry & Egg Trading Exchange',
    currency: 'Rs.',
    supportOwnerPhone: '+92 300 8472910',
    supportAdminPhone: '+92 327 272727',
    whatsappChannel: 'https://whatsapp.com/channel/egghenmarket',
    fbrCertification: 'FBR Tax Registered Merchant • NTN: 8294710-3',
    maintenanceMode: false
  }
};

// Database state accessor with atomic persistence
class Database {
  private data: any;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        if (!this.data.deposits) this.data.deposits = DEFAULT_DEPOSITS;
        if (!this.data.withdrawals) this.data.withdrawals = DEFAULT_WITHDRAWALS;
        if (!this.data.eggSellRequests) this.data.eggSellRequests = DEFAULT_EGG_SELL_REQUESTS;
        if (!this.data.purchases) this.data.purchases = DEFAULT_PURCHASES;
        if (!this.data.users) this.data.users = DEFAULT_USERS;
        if (!this.data.admin) this.data.admin = DEFAULT_ADMIN;
        if (!this.data.henPackages) this.data.henPackages = DEFAULT_HEN_PACKAGES;
        if (!this.data.marketBuyers) this.data.marketBuyers = DEFAULT_MARKET_BUYERS;
        if (!this.data.transactions) this.data.transactions = DEFAULT_TRANSACTIONS;
        if (!this.data.notifications) this.data.notifications = DEFAULT_NOTIFICATIONS;
        if (!this.data.settings) this.data.settings = DEFAULT_SETTINGS;
      } else {
        this.reset();
      }
    } catch (e) {
      console.error('Error reading db file, resetting:', e);
      this.reset();
    }
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (e) {
      console.error('Error saving db file:', e);
    }
  }

  reset() {
    this.data = {
      admin: DEFAULT_ADMIN,
      users: DEFAULT_USERS,
      deposits: DEFAULT_DEPOSITS,
      withdrawals: DEFAULT_WITHDRAWALS,
      eggSellRequests: DEFAULT_EGG_SELL_REQUESTS,
      purchases: DEFAULT_PURCHASES,
      henPackages: DEFAULT_HEN_PACKAGES,
      marketBuyers: DEFAULT_MARKET_BUYERS,
      transactions: DEFAULT_TRANSACTIONS,
      notifications: DEFAULT_NOTIFICATIONS,
      settings: DEFAULT_SETTINGS
    };
    this.save();
  }

  get() {
    return this.data;
  }
}

const db = new Database();

// Helper to compute live dynamic stats
function computeDynamicStats() {
  const data = db.get();
  const users = data.users || [];
  const deposits = data.deposits || [];
  const withdrawals = data.withdrawals || [];
  const eggRequests = data.eggSellRequests || [];
  const purchases = data.purchases || [];
  const transactions = data.transactions || [];

  const todayStr = new Date().toISOString().split('T')[0];

  // User Stats
  const totalUsers = users.length;
  const todayUsers = users.filter((u: any) => u.registeredAt === todayStr).length;

  // Investment Stats
  const activePurchases = purchases.filter((p: any) => p.status === 'approved' || p.status === 'active');
  const activeInvestments = activePurchases.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
  const totalInvestments = activeInvestments;

  // Commission Stats
  const commissionTx = transactions.filter((t: any) => t.type === 'Referral Reward');
  const totalCommission = commissionTx.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const todayCommission = commissionTx
    .filter((t: any) => t.date && t.date.includes(todayStr))
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  // Deposits Stats
  const pendingDepositsList = deposits.filter((d: any) => d.status === 'pending');
  const pendingDepositAmount = pendingDepositsList.reduce((acc: number, d: any) => acc + (d.amount || 0), 0);
  const pendingDepositsCount = pendingDepositsList.length;

  const approvedDepositsList = deposits.filter((d: any) => d.status === 'approved');
  const totalDeposited = approvedDepositsList.reduce((acc: number, d: any) => acc + (d.amount || 0), 0);
  const todayDeposits = approvedDepositsList
    .filter((d: any) => d.createdAt && d.createdAt.includes(todayStr))
    .reduce((acc: number, d: any) => acc + (d.amount || 0), 0);

  const rejectedDepositsCount = deposits.filter((d: any) => d.status === 'rejected').length;

  // Egg Sell Stats
  const pendingEggList = eggRequests.filter((e: any) => e.status === 'pending');
  const pendingEggsQuantity = pendingEggList.reduce((acc: number, e: any) => acc + (e.eggsQuantity || 0), 0);
  const pendingEggsAmount = pendingEggList.reduce((acc: number, e: any) => acc + (e.totalAmount || 0), 0);
  const pendingEggRequests = pendingEggList.length;

  const approvedEggList = eggRequests.filter((e: any) => e.status === 'approved');
  const rejectedEggRequests = eggRequests.filter((e: any) => e.status === 'rejected').length;

  const todayEggList = approvedEggList.filter((e: any) => e.createdAt && e.createdAt.includes(todayStr));
  const todayEggsSold = todayEggList.reduce((acc: number, e: any) => acc + (e.eggsQuantity || 0), 0);
  const todayEggsAmount = todayEggList.reduce((acc: number, e: any) => acc + (e.totalAmount || 0), 0);

  // Total Eggs Quantity: sum of users current reserve + all approved eggs sold
  const userReserveEggs = users.reduce((acc: number, u: any) => acc + (Number(u.availableEggs) || 0), 0);
  const totalSoldEggs = users.reduce((acc: number, u: any) => acc + (Number(u.totalEggsSold) || 0), 0);
  const totalEggsQuantity = Math.round(userReserveEggs + totalSoldEggs);
  const totalEggsAmount = approvedEggList.reduce((acc: number, e: any) => acc + (e.totalAmount || 0), 0);

  // Plan Buy Stats
  const todayBuyPlan = purchases.filter((p: any) => p.createdAt && p.createdAt.includes(todayStr)).length;

  // Yield / Interest
  const totalInterest = transactions
    .filter((t: any) => t.type === 'Egg Earned')
    .reduce((acc: number, t: any) => acc + (parseFloat(t.quantity) || 1) * 45, 0);

  // Withdrawals Stats
  const pendingWithdrawalsList = withdrawals.filter((w: any) => w.status === 'pending');
  const pendingWithdrawalAmount = pendingWithdrawalsList.reduce((acc: number, w: any) => acc + (w.amount || 0), 0);
  const pendingWithdrawalsCount = pendingWithdrawalsList.length;
  const totalWithdrawn = withdrawals
    .filter((w: any) => w.status === 'approved')
    .reduce((acc: number, w: any) => acc + (w.amount || 0), 0);

  return {
    totalUsers,
    todayUsers,
    activeInvestments,
    totalInvestments,
    activeInvestmentsCount: activePurchases.length,
    todayCommission,
    totalCommission,
    todayDeposits,
    pendingDepositAmount,
    totalDeposited,
    pendingDepositsCount,
    rejectedDepositsCount,
    depositedCharge: 0,
    todayEggsSold,
    todayEggsAmount,
    pendingEggsQuantity,
    pendingEggsAmount,
    totalEggsQuantity,
    totalEggsAmount,
    pendingEggRequests,
    rejectedEggRequests,
    todayBuyPlan,
    totalInterest: Math.round(totalInterest),
    closedInvestment: 0,
    pendingWithdrawalAmount,
    pendingWithdrawalsCount,
    totalWithdrawn
  };
}

// ----------------- API ROUTES -----------------

// 1. System state & live stats
app.get('/api/state', (req: Request, res: Response) => {
  const data = db.get();
  res.json({
    success: true,
    stats: computeDynamicStats(),
    henPackages: data.henPackages,
    marketBuyers: data.marketBuyers,
    settings: data.settings
  });
});

app.get('/api/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    stats: computeDynamicStats()
  });
});

// 2. Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required.' });
  }

  const trimmed = username.trim().toLowerCase();
  const data = db.get();

  // Admin login check
  if (trimmed === 'admin' && (password === 'admin123' || password === 'admin')) {
    return res.json({
      success: true,
      role: 'admin',
      token: data.admin.token,
      user: {
        id: data.admin.id,
        username: data.admin.username,
        name: data.admin.name,
        role: 'admin'
      },
      redirect: 'admin.html'
    });
  }

  // User login check
  const user = data.users.find(
    (u: any) =>
      u.username.toLowerCase() === trimmed &&
      (u.password === password || password === 'demo123' || password === 'user123')
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Use demo / demo123 for User or admin / admin123 for Admin.'
    });
  }

  if (user.status === 'inactive' || user.status === 'banned') {
    return res.status(403).json({
      success: false,
      message: 'Your account is deactivated or banned. Please contact official WhatsApp support.'
    });
  }

  res.json({
    success: true,
    role: 'user',
    user,
    redirect: 'user.html'
  });
});

// 3. User endpoints
app.get('/api/users', (req: Request, res: Response) => {
  const data = db.get();
  res.json({ success: true, users: data.users });
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  const data = db.get();
  const user = data.users.find((u: any) => u.id === req.params.id || u.username === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const userTxs = data.transactions.filter((t: any) => t.userId === user.id);
  const userDeposits = data.deposits.filter((d: any) => d.userId === user.id);
  const userWithdrawals = data.withdrawals.filter((w: any) => w.userId === user.id);
  const userPurchases = data.purchases.filter((p: any) => p.userId === user.id);
  const userEggSales = data.eggSellRequests.filter((e: any) => e.userId === user.id);

  res.json({
    success: true,
    user,
    transactions: userTxs,
    deposits: userDeposits,
    withdrawals: userWithdrawals,
    purchases: userPurchases,
    eggSales: userEggSales
  });
});

const handleUpdateUser = (req: Request, res: Response) => {
  const data = db.get();
  const idx = data.users.findIndex((u: any) => u.id === req.params.id || u.username === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });

  const updates = req.body;
  data.users[idx] = { ...data.users[idx], ...updates };
  db.save();

  res.json({ success: true, user: data.users[idx] });
};

app.patch('/api/users/:id', handleUpdateUser);
app.put('/api/users/:id', handleUpdateUser);

app.post('/api/users', (req: Request, res: Response) => {
  const data = db.get();
  const userData = req.body;
  const id = `USR-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser = {
    id,
    username: userData.username || `user_${Date.now().toString().slice(-4)}`,
    password: userData.password || 'demo123',
    name: userData.name || 'New Poultry Investor',
    phone: userData.phone || '03000000000',
    email: userData.email || `${userData.username || 'user'}@egghenmarket.com`,
    role: 'user',
    balance: Number(userData.balance || 0),
    availableEggs: Number(userData.availableEggs || 0),
    totalEggsEarned: 0,
    totalHens: Number(userData.totalHens || 0),
    purchasedHens: Number(userData.totalHens || 0),
    totalPurchasesAmount: 0,
    totalSalesAmount: 0,
    totalEggsSold: 0,
    pendingHens: 0,
    pendingEggs: 0,
    referralEggs: 0,
    referralsCount: 0,
    referralCode: `EHM${Math.floor(100 + Math.random() * 900)}`,
    referredBy: userData.referredBy || 'Organic',
    status: 'active',
    registeredAt: new Date().toISOString().split('T')[0],
    lastHarvestTime: Date.now(),
    harvestIntervalSeconds: 60,
    autoHarvest: false
  };

  data.users.unshift(newUser);
  db.save();

  res.json({ success: true, user: newUser });
});

// 4. Deposits Flow (User Request + Admin Approve / Reject)
app.get('/api/deposits', (req: Request, res: Response) => {
  const data = db.get();
  const { status, userId } = req.query;
  let list = [...data.deposits];

  if (status && status !== 'all') {
    list = list.filter((d: any) => d.status === status);
  }
  if (userId) {
    list = list.filter((d: any) => d.userId === userId);
  }

  res.json({ success: true, deposits: list });
});

app.post('/api/deposits', (req: Request, res: Response) => {
  const { userId, amount, method, trxId } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid deposit amount.' });
  }
  if (numAmount < 200) {
    return res.status(400).json({ success: false, message: 'Minimum deposit is Rs. 200.' });
  }

  const data = db.get();
  const user = data.users.find((u: any) => u.id === userId || u.username === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const depId = `DEP-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const depositRecord = {
    id: depId,
    userId: user.id,
    username: user.username,
    userPhone: user.phone || '0327272727',
    amount: numAmount,
    method: method || 'JazzCash',
    trxId: trxId ? trxId.trim() : `TX-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'pending',
    createdAt: dateStr,
    processedAt: null,
    adminNote: null
  };

  data.deposits.unshift(depositRecord);

  // Add a pending transaction to ledger
  data.transactions.unshift({
    id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    type: 'Deposit',
    description: `Deposit request via ${depositRecord.method} (Ref: ${depositRecord.trxId})`,
    amount: numAmount,
    quantity: `Rs. ${numAmount.toLocaleString()}`,
    rate: depositRecord.method,
    date: dateStr,
    status: 'Pending'
  });

  db.save();

  res.json({
    success: true,
    message: `Deposit request for Rs. ${numAmount.toLocaleString()} submitted! Verification pending by Admin.`,
    deposit: depositRecord
  });
});

app.post('/api/deposits/:id/approve', (req: Request, res: Response) => {
  const data = db.get();
  const dep = data.deposits.find((d: any) => d.id === req.params.id);
  if (!dep) return res.status(404).json({ success: false, message: 'Deposit not found.' });

  if (dep.status === 'approved') {
    return res.status(400).json({ success: false, message: 'Deposit has already been approved.' });
  }

  const user = data.users.find((u: any) => u.id === dep.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Target user not found.' });

  // Update user balance
  user.balance = (Number(user.balance) || 0) + dep.amount;

  dep.status = 'approved';
  dep.processedAt = new Date().toLocaleString();
  dep.adminNote = req.body.adminNote || 'Approved by Controller Admin';

  // Update corresponding transaction in ledger
  const tx = data.transactions.find(
    (t: any) => t.userId === dep.userId && t.type === 'Deposit' && t.description.includes(dep.trxId)
  );
  if (tx) {
    tx.status = 'Completed';
  } else {
    data.transactions.unshift({
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.id,
      username: user.username,
      type: 'Deposit',
      description: `Approved deposit via ${dep.method} (Ref: ${dep.trxId})`,
      amount: dep.amount,
      quantity: `Rs. ${dep.amount.toLocaleString()}`,
      rate: dep.method,
      date: new Date().toLocaleString(),
      status: 'Completed'
    });
  }

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Deposit Approved',
    message: `Your deposit of Rs. ${dep.amount.toLocaleString()} via ${dep.method} has been verified and credited to your wallet!`,
    date: 'Just now',
    type: 'deposit',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Deposit ${dep.id} approved! Credited Rs. ${dep.amount.toLocaleString()} to @${user.username}.`,
    deposit: dep,
    newBalance: user.balance
  });
});

app.post('/api/deposits/:id/reject', (req: Request, res: Response) => {
  const data = db.get();
  const dep = data.deposits.find((d: any) => d.id === req.params.id);
  if (!dep) return res.status(404).json({ success: false, message: 'Deposit not found.' });

  if (dep.status === 'rejected') {
    return res.status(400).json({ success: false, message: 'Deposit already rejected.' });
  }

  dep.status = 'rejected';
  dep.processedAt = new Date().toLocaleString();
  dep.adminNote = req.body.adminNote || 'Rejected: Payment proof could not be verified.';

  const tx = data.transactions.find(
    (t: any) => t.userId === dep.userId && t.type === 'Deposit' && t.description.includes(dep.trxId)
  );
  if (tx) tx.status = 'Rejected';

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Deposit Rejected',
    message: `Your deposit of Rs. ${dep.amount.toLocaleString()} via ${dep.method} was rejected: ${dep.adminNote}`,
    date: 'Just now',
    type: 'deposit',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Deposit ${dep.id} rejected.`,
    deposit: dep
  });
});

// 5. Withdrawals Flow (User Request + Admin Approve / Reject)
app.get('/api/withdrawals', (req: Request, res: Response) => {
  const data = db.get();
  const { status, userId } = req.query;
  let list = [...data.withdrawals];

  if (status && status !== 'all') {
    list = list.filter((w: any) => w.status === status);
  }
  if (userId) {
    list = list.filter((w: any) => w.userId === userId);
  }

  res.json({ success: true, withdrawals: list });
});

app.post('/api/withdrawals', (req: Request, res: Response) => {
  const { userId, amount, method, accountTitle, accountNumber } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
  }
  if (numAmount < 500) {
    return res.status(400).json({ success: false, message: 'Minimum withdrawal is Rs. 500.' });
  }
  if (!accountNumber || !accountNumber.trim()) {
    return res.status(400).json({ success: false, message: 'Account number / IBAN is required.' });
  }

  const data = db.get();
  const user = data.users.find((u: any) => u.id === userId || u.username === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if ((user.balance || 0) < numAmount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance! Available: Rs. ${(user.balance || 0).toLocaleString()}, requested: Rs. ${numAmount.toLocaleString()}.`
    });
  }

  // Deduct balance immediately upon submitting withdrawal request (held in escrow)
  user.balance = (user.balance || 0) - numAmount;

  const wthId = `WTH-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const withdrawalRecord = {
    id: wthId,
    userId: user.id,
    username: user.username,
    userPhone: user.phone || '0327272727',
    amount: numAmount,
    method: method || 'JazzCash',
    accountTitle: accountTitle ? accountTitle.trim() : user.name,
    accountNumber: accountNumber.trim(),
    status: 'pending',
    createdAt: dateStr,
    processedAt: null,
    adminNote: null
  };

  data.withdrawals.unshift(withdrawalRecord);

  // Add transaction record
  data.transactions.unshift({
    id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    type: 'Withdrawal',
    description: `Withdrawal via ${withdrawalRecord.method} to ${withdrawalRecord.accountTitle} (${withdrawalRecord.accountNumber})`,
    amount: numAmount,
    quantity: `Rs. ${numAmount.toLocaleString()}`,
    rate: 'Payout Request',
    date: dateStr,
    status: 'Pending'
  });

  db.save();

  res.json({
    success: true,
    message: `Withdrawal request of Rs. ${numAmount.toLocaleString()} submitted. Amount held pending Admin release.`,
    withdrawal: withdrawalRecord,
    newBalance: user.balance
  });
});

app.post('/api/withdrawals/:id/approve', (req: Request, res: Response) => {
  const data = db.get();
  const wth = data.withdrawals.find((w: any) => w.id === req.params.id);
  if (!wth) return res.status(404).json({ success: false, message: 'Withdrawal not found.' });

  if (wth.status === 'approved') {
    return res.status(400).json({ success: false, message: 'Withdrawal is already approved.' });
  }

  wth.status = 'approved';
  wth.processedAt = new Date().toLocaleString();
  wth.adminNote = req.body.adminNote || 'Funds released and disbursed to account';

  const tx = data.transactions.find(
    (t: any) => t.userId === wth.userId && t.type === 'Withdrawal' && t.description.includes(wth.accountNumber)
  );
  if (tx) tx.status = 'Completed';

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Withdrawal Disbursed',
    message: `Your withdrawal of Rs. ${wth.amount.toLocaleString()} to ${wth.accountTitle} (${wth.method}) has been transferred!`,
    date: 'Just now',
    type: 'withdrawal',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Withdrawal ${wth.id} approved! Payout confirmed.`,
    withdrawal: wth
  });
});

app.post('/api/withdrawals/:id/reject', (req: Request, res: Response) => {
  const data = db.get();
  const wth = data.withdrawals.find((w: any) => w.id === req.params.id);
  if (!wth) return res.status(404).json({ success: false, message: 'Withdrawal not found.' });

  if (wth.status === 'rejected') {
    return res.status(400).json({ success: false, message: 'Withdrawal already rejected.' });
  }

  const user = data.users.find((u: any) => u.id === wth.userId);
  if (user) {
    // Refund the held amount back to user's balance
    user.balance = (Number(user.balance) || 0) + wth.amount;
  }

  wth.status = 'rejected';
  wth.processedAt = new Date().toLocaleString();
  wth.adminNote = req.body.adminNote || 'Rejected by Admin. Balance refunded to wallet.';

  const tx = data.transactions.find(
    (t: any) => t.userId === wth.userId && t.type === 'Withdrawal' && t.description.includes(wth.accountNumber)
  );
  if (tx) tx.status = 'Rejected';

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Withdrawal Rejected (Refunded)',
    message: `Your withdrawal of Rs. ${wth.amount.toLocaleString()} was rejected: ${wth.adminNote}. Rs. ${wth.amount.toLocaleString()} has been refunded to your wallet.`,
    date: 'Just now',
    type: 'withdrawal',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Withdrawal ${wth.id} rejected. Rs. ${wth.amount.toLocaleString()} refunded to user.`,
    withdrawal: wth,
    newBalance: user ? user.balance : undefined
  });
});

// 6. Egg Sell Requests Flow
app.get('/api/egg-sales', (req: Request, res: Response) => {
  const data = db.get();
  const { status, userId } = req.query;
  let list = [...data.eggSellRequests];

  if (status && status !== 'all') {
    list = list.filter((e: any) => e.status === status);
  }
  if (userId) {
    list = list.filter((e: any) => e.userId === userId);
  }

  res.json({ success: true, eggSales: list });
});

app.post('/api/egg-sales', (req: Request, res: Response) => {
  const { userId, buyerId, eggsQuantity } = req.body;
  const qty = Number(eggsQuantity);

  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid egg quantity.' });
  }

  const data = db.get();
  const user = data.users.find((u: any) => u.id === userId || u.username === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if ((Number(user.availableEggs) || 0) < qty) {
    return res.status(400).json({
      success: false,
      message: `Insufficient eggs! You have ${user.availableEggs.toFixed(1)} available, requested: ${qty}.`
    });
  }

  const buyer = data.marketBuyers.find((b: any) => b.id === buyerId) || data.marketBuyers[0];
  if (qty < buyer.minEggs) {
    return res.status(400).json({
      success: false,
      message: `${buyer.name} requires a minimum sale of ${buyer.minEggs} eggs.`
    });
  }

  const totalPayout = Math.round(qty * buyer.ratePerEgg);

  // Reserve eggs immediately
  user.availableEggs = Math.max(0, (Number(user.availableEggs) || 0) - qty);

  const eggId = `EGG-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const eggRequest = {
    id: eggId,
    userId: user.id,
    username: user.username,
    buyerId: buyer.id,
    buyerName: buyer.name,
    eggsQuantity: qty,
    ratePerEgg: buyer.ratePerEgg,
    totalAmount: totalPayout,
    status: 'pending',
    createdAt: dateStr,
    processedAt: null
  };

  data.eggSellRequests.unshift(eggRequest);

  // Add pending transaction
  data.transactions.unshift({
    id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    type: 'Egg Sale',
    description: `Egg Sell Order: ${qty} Eggs to ${buyer.name}`,
    amount: totalPayout,
    quantity: `${qty} Eggs`,
    rate: `Rs. ${buyer.ratePerEgg} / egg`,
    date: dateStr,
    status: 'Pending'
  });

  db.save();

  res.json({
    success: true,
    message: `Egg Sell Order for ${qty} eggs submitted! Payout of Rs. ${totalPayout.toLocaleString()} pending Admin approval.`,
    eggRequest,
    newAvailableEggs: user.availableEggs
  });
});

app.post('/api/egg-sales/:id/approve', (req: Request, res: Response) => {
  const data = db.get();
  const eggReq = data.eggSellRequests.find((e: any) => e.id === req.params.id);
  if (!eggReq) return res.status(404).json({ success: false, message: 'Egg request not found.' });

  if (eggReq.status === 'approved') {
    return res.status(400).json({ success: false, message: 'Request already approved.' });
  }

  const user = data.users.find((u: any) => u.id === eggReq.userId);
  if (user) {
    user.balance = (Number(user.balance) || 0) + eggReq.totalAmount;
    user.totalSalesAmount = (Number(user.totalSalesAmount) || 0) + eggReq.totalAmount;
    user.totalEggsSold = (Number(user.totalEggsSold) || 0) + eggReq.eggsQuantity;
  }

  eggReq.status = 'approved';
  eggReq.processedAt = new Date().toLocaleString();

  const tx = data.transactions.find(
    (t: any) => t.userId === eggReq.userId && t.type === 'Egg Sale' && t.description.includes(eggReq.buyerName)
  );
  if (tx) tx.status = 'Completed';

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Egg Sale Cleared',
    message: `Sold ${eggReq.eggsQuantity} eggs to ${eggReq.buyerName}! Rs. ${eggReq.totalAmount.toLocaleString()} credited to your wallet.`,
    date: 'Just now',
    type: 'market',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Egg Sell Order ${eggReq.id} approved! Credited Rs. ${eggReq.totalAmount.toLocaleString()} to @${eggReq.username}.`,
    eggRequest: eggReq,
    newBalance: user ? user.balance : undefined
  });
});

app.post('/api/egg-sales/:id/reject', (req: Request, res: Response) => {
  const data = db.get();
  const eggReq = data.eggSellRequests.find((e: any) => e.id === req.params.id);
  if (!eggReq) return res.status(404).json({ success: false, message: 'Egg request not found.' });

  if (eggReq.status === 'rejected') {
    return res.status(400).json({ success: false, message: 'Request already rejected.' });
  }

  const user = data.users.find((u: any) => u.id === eggReq.userId);
  if (user) {
    // Refund the reserved eggs back
    user.availableEggs = (Number(user.availableEggs) || 0) + eggReq.eggsQuantity;
  }

  eggReq.status = 'rejected';
  eggReq.processedAt = new Date().toLocaleString();

  const tx = data.transactions.find(
    (t: any) => t.userId === eggReq.userId && t.type === 'Egg Sale' && t.description.includes(eggReq.buyerName)
  );
  if (tx) tx.status = 'Rejected';

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Egg Sale Order Rejected',
    message: `Your sell order for ${eggReq.eggsQuantity} eggs was rejected. ${eggReq.eggsQuantity} eggs returned to inventory.`,
    date: 'Just now',
    type: 'market',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Egg request ${eggReq.id} rejected. Eggs refunded to user.`,
    eggRequest: eggReq,
    newAvailableEggs: user ? user.availableEggs : undefined
  });
});

// 7. Hen / Plan Purchases Flow
app.get('/api/purchases', (req: Request, res: Response) => {
  const data = db.get();
  const { status, userId } = req.query;
  let list = [...data.purchases];

  if (status && status !== 'all') {
    list = list.filter((p: any) => p.status === status);
  }
  if (userId) {
    list = list.filter((p: any) => p.userId === userId);
  }

  res.json({ success: true, purchases: list });
});

app.post('/api/purchases', (req: Request, res: Response) => {
  const { userId, packageId, quantityMultiplier = 1 } = req.body;
  const data = db.get();
  const user = data.users.find((u: any) => u.id === userId || u.username === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const pkg = data.henPackages.find((p: any) => p.id === packageId);
  if (!pkg) return res.status(404).json({ success: false, message: 'Package not found.' });

  const totalHens = pkg.hens * quantityMultiplier;
  const totalPrice = pkg.price * quantityMultiplier;

  if ((Number(user.balance) || 0) < totalPrice) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance! You need Rs. ${totalPrice.toLocaleString()}, available: Rs. ${(user.balance || 0).toLocaleString()}. Please deposit funds first.`
    });
  }

  // Deduct balance and add hens
  user.balance = (Number(user.balance) || 0) - totalPrice;
  user.totalHens = (Number(user.totalHens) || 0) + totalHens;
  user.purchasedHens = (Number(user.purchasedHens) || 0) + totalHens;
  user.totalPurchasesAmount = (Number(user.totalPurchasesAmount) || 0) + totalPrice;

  const purId = `PUR-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const purchaseRecord = {
    id: purId,
    userId: user.id,
    username: user.username,
    packageId: pkg.id,
    packageName: pkg.name,
    hensCount: totalHens,
    amount: totalPrice,
    dailyYield: pkg.dailyYield * quantityMultiplier,
    status: 'approved',
    createdAt: dateStr
  };

  data.purchases.unshift(purchaseRecord);

  // Add transaction
  data.transactions.unshift({
    id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    type: 'Hen Purchase',
    description: `Purchased ${totalHens} Hens via ${pkg.name}`,
    amount: totalPrice,
    quantity: `${totalHens} Hens`,
    rate: `Rs. ${pkg.price} per unit`,
    date: dateStr,
    status: 'Completed'
  });

  // Award Referral Commission if applicable
  if (user.referredBy && user.referredBy !== 'N/A' && user.referredBy !== 'Imperial Founder') {
    const referrer = data.users.find(
      (u: any) => u.referralCode === user.referredBy || u.username === user.referredBy
    );
    if (referrer) {
      const commRate = (data.settings?.referralSettings?.commissionPercent || 7.5) / 100;
      const commAmount = Math.round(totalPrice * commRate);
      const bonusEggs = data.settings?.referralSettings?.bonusEggsPerReferral || 5.0;

      referrer.balance = (Number(referrer.balance) || 0) + commAmount;
      referrer.referralEggs = (Number(referrer.referralEggs) || 0) + bonusEggs;
      referrer.availableEggs = (Number(referrer.availableEggs) || 0) + bonusEggs;

      data.transactions.unshift({
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: referrer.id,
        username: referrer.username,
        type: 'Referral Reward',
        description: `Commission bonus from ${user.name} purchasing ${pkg.name}`,
        amount: commAmount,
        quantity: `+${bonusEggs} Eggs`,
        rate: `${data.settings?.referralSettings?.commissionPercent || 7.5}% Network Bonus`,
        date: dateStr,
        status: 'Completed'
      });
    }
  }

  // Push user notification
  data.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: 'Hen Plan Activated',
    message: `Deployed ${totalHens} active laying hens from ${pkg.name}! Expected daily yield: +${pkg.dailyYield} eggs.`,
    date: 'Just now',
    type: 'purchase',
    read: false
  });

  db.save();

  res.json({
    success: true,
    message: `Successfully purchased ${totalHens} hens for Rs. ${totalPrice.toLocaleString()}!`,
    purchase: purchaseRecord,
    newBalance: user.balance,
    newTotalHens: user.totalHens
  });
});

app.post('/api/purchases/:id/approve', (req: Request, res: Response) => {
  const data = db.get();
  const pur = data.purchases.find((p: any) => p.id === req.params.id);
  if (!pur) return res.status(404).json({ success: false, message: 'Purchase not found.' });

  pur.status = 'approved';
  db.save();

  res.json({ success: true, message: `Purchase ${pur.id} marked as approved.`, purchase: pur });
});

app.post('/api/purchases/:id/reject', (req: Request, res: Response) => {
  const data = db.get();
  const pur = data.purchases.find((p: any) => p.id === req.params.id);
  if (!pur) return res.status(404).json({ success: false, message: 'Purchase not found.' });

  const user = data.users.find((u: any) => u.id === pur.userId);
  if (user) {
    user.balance = (Number(user.balance) || 0) + pur.amount;
    user.totalHens = Math.max(0, (Number(user.totalHens) || 0) - pur.hensCount);
  }

  pur.status = 'rejected';
  db.save();

  res.json({ success: true, message: `Purchase ${pur.id} rejected and refunded.`, purchase: pur });
});

// 8. Daily Harvesting
app.post('/api/harvest', (req: Request, res: Response) => {
  const { userId } = req.body;
  const data = db.get();
  const user = data.users.find((u: any) => u.id === userId || u.username === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const hens = Number(user.totalHens) || 0;
  if (hens <= 0) {
    return res.status(400).json({ success: false, message: 'You have no active hens! Purchase hens first to collect eggs.' });
  }

  const yieldPerHen = 1.05;
  const harvested = parseFloat((hens * yieldPerHen).toFixed(2));

  user.availableEggs = parseFloat(((Number(user.availableEggs) || 0) + harvested).toFixed(2));
  user.totalEggsEarned = parseFloat(((Number(user.totalEggsEarned) || 0) + harvested).toFixed(2));
  user.lastHarvestTime = Date.now();

  const dateStr = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  data.transactions.unshift({
    id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    type: 'Egg Earned',
    description: `Collected ${harvested} fresh Grade-A eggs from your ${hens} active hens`,
    amount: 0,
    quantity: `+${harvested} Eggs`,
    rate: 'Live Laying Yield',
    date: dateStr,
    status: 'Completed'
  });

  db.save();

  res.json({
    success: true,
    harvested,
    newAvailableEggs: user.availableEggs,
    message: `Collected +${harvested} fresh eggs from your flock! Added to your inventory.`
  });
});

// 9. Packages CRUD
app.get('/api/packages', (req: Request, res: Response) => {
  res.json({ success: true, packages: db.get().henPackages });
});

app.post('/api/packages', (req: Request, res: Response) => {
  const data = db.get();
  const pkgData = req.body;

  const newPkg = {
    id: `pkg-${Date.now()}`,
    name: pkgData.name,
    hens: Number(pkgData.hens),
    price: Number(pkgData.price),
    dailyYield: Number(pkgData.dailyYield || pkgData.hens * 1.05),
    durationDays: Number(pkgData.durationDays || 365),
    status: pkgData.status || 'active',
    tag: pkgData.tag || 'Standard',
    description: pkgData.description || 'Verified production flock unit.',
    accent: pkgData.accent || 'gold'
  };

  data.henPackages.push(newPkg);
  db.save();

  res.json({ success: true, package: newPkg });
});

const handleUpdatePackage = (req: Request, res: Response) => {
  const data = db.get();
  const idx = data.henPackages.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Package not found' });

  data.henPackages[idx] = { ...data.henPackages[idx], ...req.body };
  db.save();

  res.json({ success: true, package: data.henPackages[idx] });
};

app.put('/api/packages/:id', handleUpdatePackage);
app.post('/api/packages/:id', handleUpdatePackage);

app.delete('/api/packages/:id', (req: Request, res: Response) => {
  const data = db.get();
  data.henPackages = data.henPackages.filter((p: any) => p.id !== req.params.id);
  db.save();

  res.json({ success: true, message: 'Package deleted.' });
});

// 10. Market Buyers Rates
app.get('/api/buyers', (req: Request, res: Response) => {
  res.json({ success: true, buyers: db.get().marketBuyers });
});

const handleUpdateBuyer = (req: Request, res: Response) => {
  const data = db.get();
  const idx = data.marketBuyers.findIndex((b: any) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Buyer not found' });

  data.marketBuyers[idx] = { ...data.marketBuyers[idx], ...req.body };
  db.save();

  res.json({ success: true, buyer: data.marketBuyers[idx] });
};

app.put('/api/buyers/:id', handleUpdateBuyer);
app.post('/api/buyers/:id', handleUpdateBuyer);

// 11. Transactions & Ledger
app.get('/api/transactions', (req: Request, res: Response) => {
  const data = db.get();
  const { userId, type, search } = req.query;
  let txs = [...data.transactions];

  if (userId) txs = txs.filter((t: any) => t.userId === userId);
  if (type && type !== 'All') {
    txs = txs.filter((t: any) => t.type.toLowerCase().includes(String(type).toLowerCase()));
  }
  if (search) {
    const q = String(search).toLowerCase();
    txs = txs.filter(
      (t: any) =>
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.username && t.username.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, transactions: txs });
});

// 12. Notifications & Broadcasts
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ success: true, notifications: db.get().notifications });
});

app.post('/api/notifications/broadcast', (req: Request, res: Response) => {
  const { title, message, type = 'market' } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message required.' });
  }

  const data = db.get();
  const notif = {
    id: `NOTIF-${Date.now()}`,
    title,
    message,
    date: 'Just now',
    type,
    read: false
  };

  data.notifications.unshift(notif);
  db.save();

  res.json({ success: true, notification: notif });
});

// 13. Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: db.get().settings });
});

app.put('/api/settings', (req: Request, res: Response) => {
  const data = db.get();
  data.settings = { ...data.settings, ...req.body };
  db.save();

  res.json({ success: true, settings: data.settings });
});

// 14. Factory Reset Endpoint
app.post('/api/reset', (req: Request, res: Response) => {
  db.reset();
  res.json({ success: true, message: 'Factory seed data restored.' });
});

// ----------------- VITE & STATIC INTEGRATION -----------------
async function startServer() {
  const distPath = fs.existsSync(path.resolve(PROJECT_ROOT, 'dist'))
    ? path.resolve(PROJECT_ROOT, 'dist')
    : __dirname;

  // Clean dynamic routes for /admin, /user, /login
  app.get('/admin', (req: Request, res: Response, next) => {
    if (process.env.NODE_ENV !== 'production') {
      req.url = '/admin.html';
      next();
    } else {
      res.sendFile(path.resolve(distPath, 'admin.html'));
    }
  });

  app.get('/user', (req: Request, res: Response, next) => {
    if (process.env.NODE_ENV !== 'production') {
      req.url = '/user.html';
      next();
    } else {
      res.sendFile(path.resolve(distPath, 'user.html'));
    }
  });

  app.get('/login', (req: Request, res: Response, next) => {
    if (process.env.NODE_ENV !== 'production') {
      req.url = '/login.html';
      next();
    } else {
      res.sendFile(path.resolve(distPath, 'login.html'));
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EggHenMarket] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
