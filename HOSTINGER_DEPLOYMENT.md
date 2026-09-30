# Egg Hen Market - Hostinger & GitHub Deployment Guide

This guide explains how to deploy the full-stack **Egg Hen Market** application to **Hostinger** (via **Hostinger Cloud / VPS** or **Hostinger Node.js Web Hosting**) using **GitHub**.

---

## 🚀 Overview of Architecture

- **Backend:** Express.js REST API (`server.ts` compiled to `dist/server.js`)
- **Frontend:** Responsive User Portal (`index.html` / `user.html`) and Executive Admin Panel (`admin.html`)
- **Database:** Real-time persistent JSON database store (`data/database.json`) + Firebase Firestore & Auth bridge (`js/firebase-bridge.js`)
- **Production Build:** `npm run build` bundles client assets and compiles the server into `dist/`.

---

## Method 1: Hostinger Node.js Hosting (Cloud Startup / Business)

Hostinger's hPanel provides built-in Node.js application management.

### Step 1: Push Code to GitHub
1. Create a repository on GitHub (e.g. `egg-hen-market`).
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Egg Hen Market"
   git branch -M main
   git remote add origin https://github.com/<your-username>/egg-hen-market.git
   git push -u origin main
   ```

### Step 2: Configure Node.js in Hostinger hPanel
1. Log in to **Hostinger hPanel**.
2. Go to **Websites** → Select your domain → Search for **Node.js**.
3. Click **Create Application** (or Enable Node.js):
   - **Node.js Version:** `20.x` or `18.x`
   - **Application Mode:** `Production`
   - **Application Root:** `/home/<username>/domains/<yourdomain>/public_html` (or project root)
   - **Application Startup File:** `dist/server.js`
4. Connect GitHub Deployment:
   - In hPanel, go to **Advanced** → **Git**.
   - Paste your GitHub repository URL: `https://github.com/<your-username>/egg-hen-market.git`.
   - Branch: `main`.
   - Deploy directory: your public_html or project folder.
   - Click **Create & Deploy**.

### Step 3: Run Build Script
In Hostinger's Terminal or SSH console:
```bash
cd domains/<yourdomain>/public_html
npm install
npm run build
npm start
```

---

## Method 2: Hostinger VPS (Ubuntu / Debian with Nginx & PM2) — Recommended for High Performance

If you are using a Hostinger VPS with Ubuntu 22.04 or 24.04:

### Step 1: Install Node.js, PM2 & Git on VPS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs git nginx
sudo npm install -g pm2
```

### Step 2: Clone Your GitHub Repository
```bash
sudo mkdir -p /var/www/egghenmarket
sudo chown -R $USER:$USER /var/www/egghenmarket
cd /var/www/egghenmarket
git clone https://github.com/<your-username>/egg-hen-market.git .
```

### Step 3: Install & Build
```bash
npm install
npm run build
```

### Step 4: Run with PM2 Process Manager
```bash
pm2 start dist/server.js --name "egghenmarket"
pm2 save
pm2 startup
```

### Step 5: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/egghenmarket`:
```nginx
server {
    listen 80;
    server_name egghenmarket.com www.egghenmarket.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/egghenmarket /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Install free SSL certificate:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d egghenmarket.com -d www.egghenmarket.com
```

---

## 🔐 Credentials & Default Logins

| Role | Username | Password | Redirect / Direct URL |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | `/admin` or `admin.html` |
| **User** | `0327272727` or `demo` | `demo123` | `/user` or `user.html` |

---

## 🔄 Automatic Deployment with GitHub Actions (Optional)

Whenever you push commits to GitHub, you can set up a GitHub Action workflow to automatically update Hostinger VPS:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Hostinger

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.HOSTINGER_HOST }}
          username: ${{ secrets.HOSTINGER_USERNAME }}
          key: ${{ secrets.HOSTINGER_SSH_KEY }}
          script: |
            cd /var/www/egghenmarket
            git pull origin main
            npm install
            npm run build
            pm2 restart egghenmarket
```
