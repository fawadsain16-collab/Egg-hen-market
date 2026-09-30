# Hostinger Deployment Guide via GitHub

This project is a Full-Stack application powered by Express and Vite with multi-page frontend routing (`index.html`, `user.html`, `admin.html`, `login.html`) and persistent database storage (`data/database.json`).

---

## 🚀 Overview of Build & Run Commands

- **Build**: `npm run build` (Builds client HTML/CSS/JS assets + compiles `server.ts` to `dist/server.js`)
- **Production Start**: `npm start` (Runs `node dist/server.js`)
- **Development**: `npm run dev` (Runs `tsx server.ts` with live Vite middleware)

---

## 🛠️ Step 1: Push Project to GitHub

If you haven't pushed this project to GitHub yet:

1. Open your terminal in the project folder:
   ```bash
   git init
   git add .
   git commit -m "Complete Egg Hen Market Full-Stack Application"
   ```

2. Create a new repository on GitHub (e.g. `egg-hen-market`).

3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/egg-hen-market.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Step 2: Deploy on Hostinger

Hostinger supports two primary ways to run Node.js applications:

### Option A: Hostinger Node.js Application Manager (hPanel)

If your Hostinger plan has the **Node.js** feature in hPanel:

1. Log in to **Hostinger hPanel**.
2. Navigate to **Websites** -> Select your website -> **Node.js**.
3. Under **Create Application**:
   - **Node.js Version**: Select **20.x** or **18.x**
   - **Application Mode**: **Production**
   - **Application Root**: `/` (or `public_html/` depending on your domain directory)
   - **Application Startup File**: `dist/server.js`
4. Connect Git or Clone your GitHub Repository:
   - Go to **Git** in hPanel.
   - Enter your GitHub Repository URL (`https://github.com/YOUR_USERNAME/egg-hen-market.git`).
   - Branch: `main`
   - Click **Create / Pull**.
5. Install Dependencies and Build:
   - In the Node.js console or via SSH terminal:
     ```bash
     npm install
     npm run build
     ```
6. Click **Restart Application** or start the Node.js app.

---

### Option B: Hostinger VPS (Ubuntu / Debian) using PM2 & Nginx (Most Popular & Powerful)

If you are using a Hostinger VPS:

1. Connect to your VPS via SSH:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. Install Node.js (v20) and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs git nginx
   npm install -g pm2
   ```

3. Clone your GitHub repository:
   ```bash
   cd /var/www
   git clone https://github.com/YOUR_USERNAME/egg-hen-market.git
   cd egg-hen-market
   ```

4. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

5. Start with PM2:
   ```bash
   pm2 start dist/server.js --name "egg-hen-market" --env PORT=3000
   pm2 save
   pm2 startup
   ```

6. Configure Nginx Reverse Proxy (Forward port 80/443 to port 3000):
   Create `/etc/nginx/sites-available/egg-hen-market`:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Enable and restart Nginx:
   ```bash
   ln -s /etc/nginx/sites-available/egg-hen-market /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

7. Enable SSL certificate (Free HTTPS with Certbot):
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🔄 Automatic Deployments on Git Push (Optional)

You can set up a GitHub Webhook in Hostinger or use a GitHub Actions workflow:
Whenever you push to the `main` branch on GitHub:
1. `git pull origin main`
2. `npm install`
3. `npm run build`
4. `pm2 restart egg-hen-market` (or restart Node.js in hPanel)

---

## 🔐 Credentials & Default Admin Access

- **Admin Login URL**: `https://yourdomain.com/admin.html` (or `https://yourdomain.com/login.html`)
  - Username: `admin`
  - Password: `admin123`
- **Demo User Login URL**: `https://yourdomain.com/login.html`
  - Username: `demo`
  - Password: `demo123`
- **Data Persistence**: All records (users, balances, deposits, withdrawals, hen plans, and logs) are automatically persisted in `data/database.json`.
