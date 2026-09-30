/**
 * Egg Hen Market - User Portal Runtime Engine
 * Handles user state, live countdown timers, hen buying, egg selling,
 * dynamic market buyer rate selection, referral links, and modals.
 */

class UserDashboardController {
  constructor() {
    this.countdownTimer = null;
    this.remainingSeconds = 45;
    this.selectedPackage = null;
    this.selectedBuyer = null;
    this.init();
  }

  init() {
    this.renderAll();
    this.startCountdownTimer();
    this.bindEvents();

    // Listen to data store updates
    window.addEventListener('ehm_event', (e) => {
      this.renderAll();
    });
  }

  renderAll() {
    const user = window.EHMStore.getCurrentUser();
    if (!user || user.role === 'admin') {
      // If admin opened user.html, default to demo user for preview
      const demoUser = window.EHMStore.getUserByUsername('demo');
      this.user = demoUser;
    } else {
      this.user = user;
    }

    this.renderHeader();
    this.renderMainBalance();
    this.renderHenPackages();
    this.renderMarketBuyers();
    this.renderUserStats();
    this.renderReferralSection();
    this.renderTransactionsTable();
    this.renderNotificationsList();
  }

  renderHeader() {
    const user = this.user;
    const nameEl = document.getElementById('user-header-name');
    const phoneEl = document.getElementById('user-header-phone');
    const refByEl = document.getElementById('user-header-refby');

    if (nameEl) nameEl.textContent = user.name || user.username;
    if (phoneEl) phoneEl.textContent = user.phone || '0327272727';
    if (refByEl) refByEl.textContent = user.referredBy || 'N/A';
  }

  renderMainBalance() {
    const user = this.user;
    const eggCountEl = document.getElementById('main-available-eggs');
    const cashValueEl = document.getElementById('main-egg-cash-value');
    const walletBalanceEl = document.getElementById('main-wallet-balance');
    const totalBoughtHensEl = document.getElementById('stat-total-bought-hens');
    const totalBoughtAmountEl = document.getElementById('stat-total-bought-amount');
    const totalSalesEggsEl = document.getElementById('stat-total-sales-eggs');
    const totalSalesAmountEl = document.getElementById('stat-total-sales-amount');

    const availableEggs = Number(user.availableEggs || 0);
    const avgEggRate = 45; // Rs. 45 average market rate
    const estimatedValue = Math.round(availableEggs * avgEggRate);

    if (eggCountEl) eggCountEl.textContent = availableEggs.toFixed(2);
    if (cashValueEl) cashValueEl.textContent = `≈ Rs. ${estimatedValue.toLocaleString()} Value`;
    if (walletBalanceEl) walletBalanceEl.textContent = `Rs. ${(user.balance || 0).toLocaleString()}`;

    if (totalBoughtHensEl) totalBoughtHensEl.textContent = `${user.purchasedHens || 0} HENS`;
    if (totalBoughtAmountEl) totalBoughtAmountEl.textContent = `Rs.${(user.totalPurchasesAmount || 0).toLocaleString()}`;

    if (totalSalesEggsEl) totalSalesEggsEl.textContent = `${user.totalEggsSold || 0} EGGS`;
    if (totalSalesAmountEl) totalSalesAmountEl.textContent = `Rs.${(user.totalSalesAmount || 0).toLocaleString()}`;
  }

  renderHenPackages() {
    const container = document.getElementById('hen-packages-container');
    if (!container) return;

    const packages = window.EHMStore.getHenPackages().filter((p) => p.status === 'active');
    
    container.innerHTML = packages
      .map(
        (pkg) => `
      <div class="package-item-card">
        <div>
          <span class="pkg-flock-badge">${pkg.tag || 'Flock Plan'}</span>
          <div class="pkg-hens-count">${pkg.hens} Hen${pkg.hens > 1 ? 's' : ''}</div>
          <div class="pkg-price-tag">Rs. ${pkg.price.toLocaleString()}</div>
          <div class="pkg-yield-info">
            <i class="fa-solid fa-egg" style="color:#D4AF37;"></i> ${pkg.dailyYield} Eggs / Day
          </div>
        </div>
        <button class="btn-gold" style="width:100%; padding:0.5rem; font-size:0.8rem; margin-top:0.5rem;" onclick="window.EHMUser.openBuyModal('${pkg.id}')">
          <i class="fa-solid fa-cart-shopping"></i> Buy Now
        </button>
      </div>
    `
      )
      .join('');
  }

  renderMarketBuyers() {
    const container = document.getElementById('market-buyers-container');
    if (!container) return;

    const buyers = window.EHMStore.getMarketBuyers();
    container.innerHTML = buyers
      .map((b, idx) => `
      <div class="buyer-row" onclick="window.EHMUser.openSellModal('${b.id}')" style="cursor:pointer;">
        <div class="buyer-identity">
          <div class="buyer-rank-badge">${idx + 1}</div>
          <div>
            <div class="buyer-name">
              ${b.name}
              ${b.verified ? '<i class="fa-solid fa-certificate" style="color:#10B981; font-size:0.75rem; margin-left:4px;" title="Verified Trader"></i>' : ''}
            </div>
            <div class="buyer-meta">
              <span style="color:#F59E0B;"><i class="fa-solid fa-star"></i> ${b.rating}</span>
              <span>·</span>
              <span>${b.reviews.toLocaleString()} trades</span>
              <span>·</span>
              <span style="color:#10B981;">${b.turnaround}</span>
            </div>
          </div>
        </div>
        <div class="buyer-rate-box">
          <div class="buyer-rate">Rs. ${b.ratePerEgg} <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:400;">/ egg</span></div>
          <div class="buyer-limit">Cap: ${b.minEggs} - ${b.maxEggs > 9999 ? 'No Limit' : b.maxEggs + ' Eggs'}</div>
        </div>
      </div>
    `).join('');
  }

  renderUserStats() {
    const user = this.user;

    const statHens = document.getElementById('stat-overview-hens');
    const statSoldEggs = document.getElementById('stat-overview-sold');
    const statEarnedEggs = document.getElementById('stat-overview-earned');
    const statRefEggs = document.getElementById('stat-overview-ref-eggs');
    const statPendingBuy = document.getElementById('stat-overview-pending-buy');
    const statPendingSell = document.getElementById('stat-overview-pending-sell');

    if (statHens) statHens.textContent = `${user.totalHens || 0} Hens`;
    if (statSoldEggs) statSoldEggs.textContent = `${user.totalEggsSold || 0} Eggs`;
    if (statEarnedEggs) statEarnedEggs.textContent = `${Number(user.totalEggsEarned || 0).toFixed(2)} Eggs`;
    if (statRefEggs) statRefEggs.textContent = `${Number(user.referralEggs || 0).toFixed(2)} Eggs`;
    if (statPendingBuy) statPendingBuy.textContent = `${user.pendingHens || 0} Hens (Rs. 0.00)`;
    if (statPendingSell) statPendingSell.textContent = `${user.pendingEggs || 0} Eggs (Rs. 0.00)`;
  }

  renderReferralSection() {
    const user = this.user;
    const refCode = user.referralCode || 'EHM882';
    const refUrl = `https://egghenmarket.com?refcode=${refCode}`;

    const input = document.getElementById('referral-link-input');
    const countEl = document.getElementById('referral-count-label');
    const eggsEl = document.getElementById('referral-eggs-label');

    if (input) input.value = refUrl;
    if (countEl) countEl.textContent = `${user.referralsCount || 0} members joined using your link`;
    if (eggsEl) eggsEl.textContent = `+${Number(user.referralEggs || 0).toFixed(1)} Referral Eggs Earned`;
  }

  renderTransactionsTable() {
    const container = document.getElementById('user-recent-tx-table');
    const fullContainer = document.getElementById('user-full-tx-table');

    const allUserTxs = window.EHMStore.getTransactions({ userId: this.user.id });
    const txs = allUserTxs.slice(0, 5);

    const renderRow = (tx) => `
      <tr>
        <td class="tabular-nums" style="font-size:0.8rem; color:var(--text-gold); font-weight:600;">${tx.id}</td>
        <td>
          <span class="badge-status ${tx.type === 'Egg Sale' ? 'active' : tx.type === 'Hen Purchase' ? 'pending' : 'active'}">
            ${tx.type}
          </span>
        </td>
        <td style="font-size:0.82rem;">${tx.description}</td>
        <td class="tabular-nums" style="font-weight:700; color: ${tx.amount > 0 && tx.type === 'Egg Sale' ? '#10B981' : tx.type === 'Hen Purchase' ? '#F59E0B' : '#FFF'};">
          ${tx.amount > 0 ? (tx.type === 'Hen Purchase' ? '- ' : '+ ') + window.EHMApp.formatCurrency(tx.amount) : tx.quantity}
        </td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${tx.date}</td>
      </tr>
    `;

    if (container) {
      if (txs.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">
              No transactions yet. Buy your first hen flock to start generating yields!
            </td>
          </tr>
        `;
      } else {
        container.innerHTML = txs.map(renderRow).join('');
      }
    }

    if (fullContainer) {
      if (allUserTxs.length === 0) {
        fullContainer.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">
              No transaction history recorded.
            </td>
          </tr>
        `;
      } else {
        fullContainer.innerHTML = allUserTxs.map(renderRow).join('');
      }
    }
  }

  renderNotificationsList() {
    const container = document.getElementById('notifications-drawer-list');
    const badge = document.getElementById('notification-badge-count');
    if (!container) return;

    const notifs = window.EHMStore.data.notifications || [];
    if (badge) {
      badge.textContent = notifs.length;
      badge.style.display = notifs.length > 0 ? 'inline-flex' : 'none';
    }

    container.innerHTML = notifs.map(n => `
      <div style="padding:0.85rem; border-bottom:1px solid var(--border-subtle); background:rgba(255,255,255,0.01);">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <strong style="color:var(--gold-light); font-size:0.88rem;">${n.title}</strong>
          <span style="font-size:0.72rem; color:var(--text-muted);">${n.date}</span>
        </div>
        <div style="font-size:0.8rem; color:var(--text-secondary);">${n.message}</div>
      </div>
    `).join('');
  }

  // Live Egg Collection Countdown Timer
  startCountdownTimer() {
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    const updateTimerDisplay = () => {
      const minutes = Math.floor(this.remainingSeconds / 60);
      const seconds = this.remainingSeconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      const timerEl = document.getElementById('harvest-countdown-text');
      const actionBtn = document.getElementById('harvest-trigger-btn');
      const ringCircle = document.getElementById('harvest-timer-circle');

      if (this.remainingSeconds > 0) {
        if (timerEl) timerEl.textContent = formatted;
        if (actionBtn) {
          actionBtn.disabled = true;
          actionBtn.className = 'btn-outline-gold';
          actionBtn.innerHTML = `<i class="fa-solid fa-hourglass-half"></i> Laying in Progress...`;
        }
        if (ringCircle) {
          ringCircle.style.borderColor = '#10B981';
          ringCircle.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.2)';
        }
        this.remainingSeconds--;
      } else {
        if (timerEl) timerEl.textContent = '00:00';
        if (actionBtn) {
          actionBtn.disabled = false;
          actionBtn.className = 'btn-emerald';
          actionBtn.innerHTML = `<i class="fa-solid fa-egg"></i> Collect Daily Eggs Now!`;
        }
        if (ringCircle) {
          ringCircle.style.borderColor = '#D4AF37';
          ringCircle.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.6)';
        }
      }
    };

    updateTimerDisplay();
    this.countdownTimer = setInterval(updateTimerDisplay, 1000);
  }

  async collectDailyEggs() {
    const res = await window.EHMStore.harvestDailyEggs();
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
      this.remainingSeconds = 60; // reset for continuous live demo!
      this.renderAll();
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
  }

  // Buy Hen Package Flow
  openBuyModal(pkgId) {
    const pkg = window.EHMStore.getHenPackageById(pkgId);
    if (!pkg) return;

    this.selectedPackage = pkg;
    const modal = document.getElementById('modal-buy-hen');
    if (!modal) return;

    document.getElementById('buy-modal-title').textContent = pkg.name;
    document.getElementById('buy-modal-hens').textContent = `${pkg.hens} Heritage Layers`;
    document.getElementById('buy-modal-yield').textContent = `${pkg.dailyYield} Eggs / Day expected`;
    document.getElementById('buy-modal-price').textContent = `Rs. ${pkg.price.toLocaleString()}`;
    document.getElementById('buy-modal-balance').textContent = `Rs. ${(this.user.balance || 0).toLocaleString()}`;
    
    const qtyInput = document.getElementById('buy-modal-quantity');
    if (qtyInput) qtyInput.value = 1;

    this.updateBuyTotal();
    window.EHMApp.openModal('modal-buy-hen');
  }

  updateBuyTotal() {
    if (!this.selectedPackage) return;
    const qtyInput = document.getElementById('buy-modal-quantity');
    const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1) || 1);
    const total = this.selectedPackage.price * qty;

    const totalEl = document.getElementById('buy-modal-total-calc');
    if (totalEl) totalEl.textContent = `Rs. ${total.toLocaleString()}`;
  }

  async confirmHenPurchase() {
    if (!this.selectedPackage) return;
    const qtyInput = document.getElementById('buy-modal-quantity');
    const qty = Math.max(1, parseInt(qtyInput ? qtyInput.value : 1) || 1);

    const res = await window.EHMStore.buyHenPackage(this.selectedPackage.id, qty);
    if (res.success) {
      window.EHMApp.closeModal('modal-buy-hen');
      window.EHMApp.showToast(res.message, 'success');
      this.renderAll();
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
  }

  // Sell Eggs Flow
  openSellModal(buyerId = null) {
    const buyers = window.EHMStore.getMarketBuyers();
    const buyer = buyerId ? buyers.find(b => b.id === buyerId) : buyers[0];
    this.selectedBuyer = buyer;

    const modal = document.getElementById('modal-sell-eggs');
    if (!modal) return;

    const selectEl = document.getElementById('sell-modal-buyer-select');
    if (selectEl) {
      selectEl.innerHTML = buyers.map(b => `
        <option value="${b.id}" ${b.id === buyer.id ? 'selected' : ''}>
          ${b.name} (Rs. ${b.ratePerEgg}/egg - Min: ${b.minEggs})
        </option>
      `).join('');
    }

    document.getElementById('sell-modal-available-eggs').textContent = Number(this.user.availableEggs || 0).toFixed(2);
    document.getElementById('sell-modal-rate').textContent = `Rs. ${buyer.ratePerEgg} / egg`;

    const qtyInput = document.getElementById('sell-modal-quantity');
    if (qtyInput) {
      qtyInput.value = Math.min(Math.floor(this.user.availableEggs || 0), buyer.minEggs || 10);
      if (qtyInput.value < buyer.minEggs) qtyInput.value = buyer.minEggs;
    }

    this.updateSellTotal();
    window.EHMApp.openModal('modal-sell-eggs');
  }

  updateSellTotal() {
    const selectEl = document.getElementById('sell-modal-buyer-select');
    const buyers = window.EHMStore.getMarketBuyers();
    const buyerId = selectEl ? selectEl.value : buyers[0].id;
    this.selectedBuyer = buyers.find(b => b.id === buyerId) || buyers[0];

    document.getElementById('sell-modal-rate').textContent = `Rs. ${this.selectedBuyer.ratePerEgg} / egg`;

    const qtyInput = document.getElementById('sell-modal-quantity');
    const qty = Number(qtyInput ? qtyInput.value : 0) || 0;
    const totalCash = Math.round(qty * this.selectedBuyer.ratePerEgg);

    const totalEl = document.getElementById('sell-modal-cash-calc');
    if (totalEl) totalEl.textContent = `Rs. ${totalCash.toLocaleString()}`;
  }

  async confirmSellEggs() {
    if (!this.selectedBuyer) return;
    const qtyInput = document.getElementById('sell-modal-quantity');
    const qty = Number(qtyInput ? qtyInput.value : 0);

    const res = await window.EHMStore.sellEggs(this.selectedBuyer.id, qty);
    if (res.success) {
      window.EHMApp.closeModal('modal-sell-eggs');
      window.EHMApp.showToast(res.message, 'success');
      this.renderAll();
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
  }

  saveProfile() {
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const emailInput = document.getElementById('profile-email');

    const updates = {
      name: nameInput ? nameInput.value.trim() : this.user.name,
      phone: phoneInput ? phoneInput.value.trim() : this.user.phone,
      email: emailInput ? emailInput.value.trim() : this.user.email
    };

    window.EHMStore.updateCurrentUser(updates);
    window.EHMApp.showToast('Profile updated successfully!', 'success');
    window.EHMApp.closeModal('modal-profile');
    this.renderAll();
  }

  // Quick Balance Top Up for Demo
  topUpDemoBalance(amount = 10000) {
    window.EHMStore.addDemoFunds(amount);
    window.EHMApp.showToast(`Deposited Rs. ${amount.toLocaleString()} into your wallet!`, 'success');
    window.EHMApp.closeModal('modal-topup');
    this.renderAll();
  }

  // Deposit Flow
  openDepositModal() {
    this.selectedDepositMethod = 'JazzCash';
    const amountInput = document.getElementById('deposit-input-amount');
    if (amountInput) amountInput.value = '5000';
    const trxInput = document.getElementById('deposit-input-trx');
    if (trxInput) trxInput.value = '';

    this.selectDepositMethod('JazzCash');
    window.EHMApp.openModal('modal-deposit');
  }

  selectDepositMethod(method) {
    this.selectedDepositMethod = method;
    document.querySelectorAll('.payment-method-card').forEach((el) => {
      if (el.dataset.method === method) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    const infoTitleEl = document.getElementById('deposit-acc-title');
    const infoNumEl = document.getElementById('deposit-acc-number');
    const infoBankEl = document.getElementById('deposit-acc-bank');

    if (method === 'JazzCash') {
      if (infoBankEl) infoBankEl.textContent = 'JazzCash Digital Wallet';
      if (infoTitleEl) infoTitleEl.textContent = 'Egg Hen Market Official Treasury';
      if (infoNumEl) infoNumEl.textContent = '0300-8472910';
    } else if (method === 'EasyPaisa') {
      if (infoBankEl) infoBankEl.textContent = 'EasyPaisa Mobile Account';
      if (infoTitleEl) infoTitleEl.textContent = 'Imperial Agro Poultry Ltd';
      if (infoNumEl) infoNumEl.textContent = '0327-2727270';
    } else if (method === 'Bank') {
      if (infoBankEl) infoBankEl.textContent = 'Meezan Bank Ltd (Islamic Banking)';
      if (infoTitleEl) infoTitleEl.textContent = 'Egg Hen Market Agro (Pvt) Ltd';
      if (infoNumEl) infoNumEl.textContent = 'PK45MEZN00010982347101';
    }
  }

  setDepositAmount(val) {
    const input = document.getElementById('deposit-input-amount');
    if (input) input.value = val;
  }

  async submitDeposit() {
    const amountInput = document.getElementById('deposit-input-amount');
    const amount = Number(amountInput ? amountInput.value : 0);
    const trxInput = document.getElementById('deposit-input-trx');
    const trxId = trxInput ? trxInput.value.trim() : '';

    if (!amount || amount <= 0) {
      window.EHMApp.showToast('Please enter a valid deposit amount.', 'error');
      return;
    }

    const method = this.selectedDepositMethod || 'JazzCash';
    const res = await window.EHMStore.depositFunds(amount, method, trxId);
    if (res.success) {
      window.EHMApp.closeModal('modal-deposit');
      window.EHMApp.showToast(res.message, 'success');
      this.renderAll();
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
  }

  // Withdrawal Flow
  openWithdrawModal() {
    const user = this.user || window.EHMStore.getCurrentUser();
    const balanceEl = document.getElementById('withdraw-modal-available-balance');
    if (balanceEl) balanceEl.textContent = `Rs. ${(user.balance || 0).toLocaleString()}`;

    const titleInput = document.getElementById('withdraw-input-title');
    if (titleInput) titleInput.value = user.name || 'Sultan Agro Farms';

    const numInput = document.getElementById('withdraw-input-number');
    if (numInput) numInput.value = user.phone || '0327272727';

    const amountInput = document.getElementById('withdraw-input-amount');
    if (amountInput) amountInput.value = Math.min(5000, user.balance || 0);

    this.updateWithdrawSummary();
    window.EHMApp.openModal('modal-withdrawal');
  }

  setWithdrawMax() {
    const user = this.user || window.EHMStore.getCurrentUser();
    const amountInput = document.getElementById('withdraw-input-amount');
    if (amountInput) amountInput.value = user.balance || 0;
    this.updateWithdrawSummary();
  }

  updateWithdrawSummary() {
    const amountInput = document.getElementById('withdraw-input-amount');
    const amount = Number(amountInput ? amountInput.value : 0) || 0;
    const reqEl = document.getElementById('withdraw-summary-requested');
    const netEl = document.getElementById('withdraw-summary-net');

    if (reqEl) reqEl.textContent = `Rs. ${amount.toLocaleString()}`;
    if (netEl) netEl.textContent = `Rs. ${amount.toLocaleString()}`;
  }

  async submitWithdrawal() {
    const methodSelect = document.getElementById('withdraw-select-method');
    const method = methodSelect ? methodSelect.value : 'JazzCash';

    const titleInput = document.getElementById('withdraw-input-title');
    const title = titleInput ? titleInput.value.trim() : '';

    const numInput = document.getElementById('withdraw-input-number');
    const accNum = numInput ? numInput.value.trim() : '';

    const amountInput = document.getElementById('withdraw-input-amount');
    const amount = Number(amountInput ? amountInput.value : 0);

    if (!accNum) {
      window.EHMApp.showToast('Please enter your receiving account number / IBAN.', 'error');
      return;
    }

    const res = await window.EHMStore.withdrawFunds(amount, method, title, accNum);
    if (res.success) {
      window.EHMApp.closeModal('modal-withdrawal');
      window.EHMApp.showToast(res.message, 'success');
      this.renderAll();
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
  }

  // Bind UI Events
  bindEvents() {
    // Quantity change listeners
    const buyQty = document.getElementById('buy-modal-quantity');
    if (buyQty) buyQty.addEventListener('input', () => this.updateBuyTotal());

    const sellQty = document.getElementById('sell-modal-quantity');
    if (sellQty) sellQty.addEventListener('input', () => this.updateSellTotal());

    const sellBuyerSelect = document.getElementById('sell-modal-buyer-select');
    if (sellBuyerSelect) sellBuyerSelect.addEventListener('change', () => this.updateSellTotal());

    const withdrawAmountInput = document.getElementById('withdraw-input-amount');
    if (withdrawAmountInput) withdrawAmountInput.addEventListener('input', () => this.updateWithdrawSummary());

    // Copy Referral link
    const copyBtn = document.getElementById('btn-copy-ref-link');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const input = document.getElementById('referral-link-input');
        if (input) {
          window.EHMApp.copyText(input.value, 'Referral link copied to clipboard!');
        }
      });
    }

    // Share button
    const shareBtn = document.getElementById('btn-share-ref-link');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const input = document.getElementById('referral-link-input');
        if (navigator.share && input) {
          navigator.share({
            title: 'Join Egg Hen Market',
            text: 'Invest in real heritage hen coops and earn daily egg revenues!',
            url: input.value
          }).catch(() => {});
        } else if (input) {
          window.EHMApp.copyText(input.value, 'Share link copied to clipboard!');
        }
      });
    }
  }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
  window.EHMUser = new UserDashboardController();
});
