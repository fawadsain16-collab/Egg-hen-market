/**
 * Egg Hen Market - User Portal Runtime Engine
 * Handles user state, live countdown timers, hen buying, egg selling,
 * dynamic market buyer rate selection, referral links, and modals.
 */

class UserDashboardController {
  constructor() {
    window.EHMUser = this;
    this.countdownTimer = null;
    this.remainingSeconds = 45;
    this.selectedPackage = null;
    this.selectedBuyer = null;
    this.selectedDepositMethod = 'JazzCash';
    this.user = this.getFallbackUser();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  getFallbackUser() {
    return {
      id: 'USR-8821',
      username: 'demo',
      name: 'Sultan Agro Farms',
      phone: '0327272727',
      email: 'investor@egghenmarket.com',
      balance: 14500,
      availableEggs: 124.5,
      totalEggsEarned: 890,
      totalHens: 16,
      purchasedHens: 16,
      totalPurchasesAmount: 9280,
      totalSalesAmount: 38400,
      totalEggsSold: 820,
      referralEggs: 45,
      referralsCount: 7,
      referralCode: 'EHM882',
      referredBy: 'Imperial Founder'
    };
  }

  init() {
    this.updateUserState();
    this.renderAll();
    this.startCountdownTimer();
    this.bindEvents();

    // Listen to data store updates
    window.addEventListener('ehm_event', (e) => {
      this.updateUserState();
      this.renderAll();
    });
  }

  updateUserState() {
    if (window.EHMStore && typeof window.EHMStore.getCurrentUser === 'function') {
      const u = window.EHMStore.getCurrentUser();
      if (u && u.role !== 'admin') {
        this.user = u;
      } else if (u && u.role === 'admin') {
        const demoUser = window.EHMStore.getUserByUsername('demo');
        this.user = demoUser || this.user;
      }
    }
  }

  renderAll() {
    this.updateUserState();
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
    const user = this.user || this.getFallbackUser();
    const nameEl = document.getElementById('user-header-name');
    const phoneEl = document.getElementById('user-header-phone');
    const refByEl = document.getElementById('user-header-refby');

    if (nameEl) nameEl.textContent = user.name || user.username || '0327272727';
    if (phoneEl) phoneEl.textContent = user.phone || user.username || '0327272727';
    if (refByEl) refByEl.textContent = user.referredBy || 'Imperial Founder';
  }

  renderMainBalance() {
    const user = this.user || this.getFallbackUser();
    const eggCountEl = document.getElementById('main-available-eggs');
    const cashValueEl = document.getElementById('main-egg-cash-value');
    const walletBalanceEl = document.getElementById('main-wallet-balance');
    const totalBoughtHensEl = document.getElementById('stat-total-bought-hens');
    const totalBoughtAmountEl = document.getElementById('stat-total-bought-amount');
    const totalSalesEggsEl = document.getElementById('stat-total-sales-eggs');
    const totalSalesAmountEl = document.getElementById('stat-total-sales-amount');

    const availableEggs = Number(user.availableEggs || 0);
    const avgEggRate = 45;
    const estimatedValue = Math.round(availableEggs * avgEggRate);

    if (eggCountEl) eggCountEl.textContent = availableEggs.toFixed(2);
    if (cashValueEl) cashValueEl.textContent = `≈ Rs. ${estimatedValue.toLocaleString()} Value`;
    if (walletBalanceEl) walletBalanceEl.textContent = `Rs. ${(Number(user.balance) || 0).toLocaleString()}`;

    if (totalBoughtHensEl) totalBoughtHensEl.textContent = `${user.purchasedHens || user.totalHens || 0} HENS`;
    if (totalBoughtAmountEl) totalBoughtAmountEl.textContent = `Rs.${(user.totalPurchasesAmount || 0).toLocaleString()}`;

    if (totalSalesEggsEl) totalSalesEggsEl.textContent = `${user.totalEggsSold || 0} EGGS`;
    if (totalSalesAmountEl) totalSalesAmountEl.textContent = `Rs.${(user.totalSalesAmount || 0).toLocaleString()}`;
  }

  renderHenPackages() {
    const container = document.getElementById('hen-packages-container');
    if (!container) return;

    const packages = (window.EHMStore && window.EHMStore.getHenPackages)
      ? window.EHMStore.getHenPackages().filter((p) => p.status === 'active')
      : [];

    if (packages.length === 0) {
      container.innerHTML = '<div style="padding:1rem; color:var(--text-muted);">No packages currently active.</div>';
      return;
    }

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

    const buyers = (window.EHMStore && window.EHMStore.getMarketBuyers)
      ? window.EHMStore.getMarketBuyers()
      : [];

    container.innerHTML = buyers
      .map((b, idx) => `
      <div class="buyer-row" onclick="window.EHMUser.openSellModal('${b.id}')" style="cursor:pointer;" title="Click to trade eggs">
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
    const user = this.user || this.getFallbackUser();

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
    const user = this.user || this.getFallbackUser();
    const refCode = user.referralCode || 'EHM882';
    const refUrl = `https://egghenmarket.com?refcode=${refCode}`;

    const input = document.getElementById('referral-link-input');
    const countEl = document.getElementById('referral-count-label');
    const eggsEl = document.getElementById('referral-eggs-label');

    if (input) input.value = refUrl;
    if (countEl) countEl.innerHTML = `<i class="fa-solid fa-user-plus"></i> ${user.referralsCount || 0} members joined using this link`;
    if (eggsEl) eggsEl.textContent = `+${Number(user.referralEggs || 0).toFixed(1)} Referral Eggs`;
  }

  renderTransactionsTable() {
    const container = document.getElementById('user-recent-tx-table');
    const fullContainer = document.getElementById('user-full-tx-table');

    if (!window.EHMStore || !window.EHMStore.getTransactions) return;

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
        <td class="tabular-nums font-semibold" style="color: ${tx.amount > 0 && tx.type === 'Egg Sale' ? '#10B981' : tx.type === 'Hen Purchase' ? '#F59E0B' : '#FFF'};">
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

    const notifs = (window.EHMStore && window.EHMStore.data) ? (window.EHMStore.data.notifications || []) : [];
    if (badge) {
      badge.textContent = notifs.length;
      badge.style.display = notifs.length > 0 ? 'inline-flex' : 'none';
    }

    if (notifs.length === 0) {
      container.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--text-muted);">No new notifications.</div>';
      return;
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
    if (!window.EHMStore || !window.EHMStore.harvestDailyEggs) return;
    const res = await window.EHMStore.harvestDailyEggs();
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
      this.remainingSeconds = 60;
      this.renderAll();
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
  }

  // Buy Hen Package Flow
  openBuyModal(pkgId) {
    if (!window.EHMStore) return;
    const pkg = window.EHMStore.getHenPackageById(pkgId);
    if (!pkg) return;

    // Direct to 5-step manual payment flow as requested
    this.openManualPaymentModal(pkg.hens, pkg.name, pkg.id);
  }

  // ----------------- MANUAL PAYMENT & HEN BUYING (5-STEP FLOW) -----------------
  openManualPaymentModal(hensCount = 10, pkgName = null, pkgId = null) {
    this.manualProofImage = null;
    this.manualPackageId = pkgId;
    this.manualPackageName = pkgName;

    const qtyInput = document.getElementById('manual-hens-qty');
    if (qtyInput) qtyInput.value = hensCount || 10;

    const trxInput = document.getElementById('manual-trx-id');
    if (trxInput) trxInput.value = '';

    const previewWrap = document.getElementById('manual-upload-preview-wrap');
    const placeholder = document.getElementById('manual-upload-placeholder');
    if (previewWrap) previewWrap.style.display = 'none';
    if (placeholder) placeholder.style.display = 'block';

    const fileInput = document.getElementById('manual-proof-file');
    if (fileInput) fileInput.value = '';

    this.renderManualGateways();
    this.calcManualPayment();
    window.EHMApp.openModal('modal-manual-payment');
  }

  setManualHens(qty) {
    const input = document.getElementById('manual-hens-qty');
    if (input) {
      input.value = Math.max(1, qty);
      this.calcManualPayment();
    }
  }

  adjustManualHens(delta) {
    const input = document.getElementById('manual-hens-qty');
    if (input) {
      const current = parseInt(input.value) || 10;
      input.value = Math.max(1, current + delta);
      this.calcManualPayment();
    }
  }

  calcManualPayment() {
    const input = document.getElementById('manual-hens-qty');
    const qty = Math.max(1, parseInt(input ? input.value : 10) || 10);
    const unitPrice = 580;
    const totalAmount = qty * unitPrice;
    const dailyEggs = (qty * 1.05).toFixed(1);

    const totalEl = document.getElementById('manual-payment-total');
    if (totalEl) totalEl.textContent = `Rs. ${totalAmount.toLocaleString()}`;

    const yieldEl = document.getElementById('manual-payment-yield');
    if (yieldEl) yieldEl.textContent = `+${dailyEggs} Eggs / Day`;
  }

  renderManualGateways() {
    const container = document.getElementById('manual-gateways-container');
    if (!container) return;

    const gateways = (window.EHMStore && window.EHMStore.getPaymentMethods)
      ? window.EHMStore.getPaymentMethods(true)
      : [];

    if (!this.selectedManualGatewayId && gateways.length > 0) {
      this.selectedManualGatewayId = gateways[0].id;
    }

    container.innerHTML = gateways.map((g) => `
      <div class="payment-method-card ${g.id === this.selectedManualGatewayId ? 'active' : ''}" onclick="window.EHMUser.selectManualGateway('${g.id}')">
        <span class="payment-method-icon" style="color:${g.color || 'var(--gold-primary)'};">
          <i class="fa-solid ${g.icon || 'fa-wallet'}"></i>
        </span>
        <strong style="font-size:0.82rem; color:#FFF; display:block;">${g.name}</strong>
        <span style="font-size:0.68rem; color:var(--text-muted);">${g.accountTitle || 'Official'}</span>
      </div>
    `).join('');

    this.updateManualSelectedAccountInfo();
  }

  selectManualGateway(id) {
    this.selectedManualGatewayId = id;
    this.renderManualGateways();
  }

  updateManualSelectedAccountInfo() {
    const gateways = (window.EHMStore && window.EHMStore.getPaymentMethods)
      ? window.EHMStore.getPaymentMethods(false)
      : [];
    const g = gateways.find((item) => item.id === this.selectedManualGatewayId) || gateways[0];
    if (!g) return;

    const titleEl = document.getElementById('manual-acc-title');
    const numEl = document.getElementById('manual-acc-number');
    const instEl = document.getElementById('manual-acc-instructions');

    if (titleEl) titleEl.textContent = g.accountTitle || 'Egg Hen Market Official';
    if (numEl) numEl.textContent = g.accountNumber || '0327272727';
    if (instEl) instEl.textContent = g.instructions || 'Send exact payment via App and upload receipt screenshot.';
  }

  handleManualProofUpload(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      window.EHMApp.showToast('Please select a valid image screenshot (JPG, PNG).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.manualProofImage = e.target.result;
      const previewImg = document.getElementById('manual-upload-preview-img');
      const previewWrap = document.getElementById('manual-upload-preview-wrap');
      const placeholder = document.getElementById('manual-upload-placeholder');
      if (previewImg) previewImg.src = this.manualProofImage;
      if (previewWrap) previewWrap.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      window.EHMApp.showToast('Screenshot attached successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }

  async submitManualPaymentOrder() {
    const qtyInput = document.getElementById('manual-hens-qty');
    const hensCount = Math.max(1, parseInt(qtyInput ? qtyInput.value : 10) || 10);
    const totalAmount = hensCount * 580;

    const trxInput = document.getElementById('manual-trx-id');
    const trxId = trxInput ? trxInput.value.trim() : '';

    if (!trxId) {
      window.EHMApp.showToast('براہ کرم ٹرانزیکشن آئی ڈی (Trx ID) درج کریں!', 'error');
      if (trxInput) trxInput.focus();
      return;
    }

    const gateways = (window.EHMStore && window.EHMStore.getPaymentMethods)
      ? window.EHMStore.getPaymentMethods(false)
      : [];
    const g = gateways.find((item) => item.id === this.selectedManualGatewayId) || gateways[0];
    const methodName = g ? g.name : 'EasyPaisa';

    const pkgName = this.manualPackageName || `${hensCount} Hens Commercial Flock`;
    const res = await window.EHMStore.buyHensManual(
      hensCount,
      totalAmount,
      methodName,
      trxId,
      this.manualProofImage,
      pkgName,
      this.manualPackageId
    );

    if (res && res.success) {
      window.EHMApp.closeModal('modal-manual-payment');
      window.EHMApp.showToast(res.message || 'Payment request submitted! Admin will verify and activate your hens.', 'success');
      this.renderAll();
    } else {
      window.EHMApp.showToast((res && res.message) || 'Error submitting order', 'error');
    }
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
    if (!this.selectedPackage || !window.EHMStore) return;
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
    if (!window.EHMStore) return;
    const buyers = window.EHMStore.getMarketBuyers();
    if (!buyers || buyers.length === 0) return;

    const buyer = buyerId ? (buyers.find(b => b.id === buyerId) || buyers[0]) : buyers[0];
    this.selectedBuyer = buyer;

    const selectEl = document.getElementById('sell-modal-buyer-select');
    if (selectEl) {
      selectEl.innerHTML = buyers.map(b => `
        <option value="${b.id}" ${b.id === buyer.id ? 'selected' : ''}>
          ${b.name} (Rs. ${b.ratePerEgg}/egg - Min: ${b.minEggs})
        </option>
      `).join('');
    }

    const availEggsEl = document.getElementById('sell-modal-available-eggs');
    const rateEl = document.getElementById('sell-modal-rate');
    const qtyInput = document.getElementById('sell-modal-quantity');

    if (availEggsEl) availEggsEl.textContent = Number(this.user.availableEggs || 0).toFixed(2);
    if (rateEl) rateEl.textContent = `Rs. ${buyer.ratePerEgg} / egg`;

    if (qtyInput) {
      const avail = Math.floor(Number(this.user.availableEggs) || 0);
      qtyInput.value = Math.max(buyer.minEggs || 1, Math.min(avail, buyer.minEggs || 10));
    }

    this.updateSellTotal();
    window.EHMApp.openModal('modal-sell-eggs');
  }

  updateSellTotal() {
    const selectEl = document.getElementById('sell-modal-buyer-select');
    if (!window.EHMStore) return;
    const buyers = window.EHMStore.getMarketBuyers();
    if (!buyers || buyers.length === 0) return;

    const buyerId = selectEl ? selectEl.value : buyers[0].id;
    this.selectedBuyer = buyers.find(b => b.id === buyerId) || buyers[0];

    const rateEl = document.getElementById('sell-modal-rate');
    if (rateEl) rateEl.textContent = `Rs. ${this.selectedBuyer.ratePerEgg} / egg`;

    const qtyInput = document.getElementById('sell-modal-quantity');
    const qty = Number(qtyInput ? qtyInput.value : 0) || 0;
    const totalCash = Math.round(qty * this.selectedBuyer.ratePerEgg);

    const totalEl = document.getElementById('sell-modal-cash-calc');
    if (totalEl) totalEl.textContent = `Rs. ${totalCash.toLocaleString()}`;
  }

  async confirmSellEggs() {
    if (!this.selectedBuyer || !window.EHMStore) return;
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

  // Profile Save
  saveProfile() {
    const nameInput = document.getElementById('profile-name');
    const phoneInput = document.getElementById('profile-phone');
    const emailInput = document.getElementById('profile-email');

    const updates = {
      name: nameInput ? nameInput.value.trim() : this.user.name,
      phone: phoneInput ? phoneInput.value.trim() : this.user.phone,
      email: emailInput ? emailInput.value.trim() : this.user.email
    };

    if (window.EHMStore && window.EHMStore.updateCurrentUser) {
      window.EHMStore.updateCurrentUser(updates);
    }
    window.EHMApp.showToast('Profile updated successfully!', 'success');
    window.EHMApp.closeModal('modal-profile');
    this.renderAll();
  }

  // Quick Balance Top Up for Demo
  topUpDemoBalance(amount = 10000) {
    if (window.EHMStore && window.EHMStore.addDemoFunds) {
      window.EHMStore.addDemoFunds(amount);
    }
    window.EHMApp.showToast(`Deposited Rs. ${amount.toLocaleString()} into your wallet!`, 'success');
    window.EHMApp.closeModal('modal-topup');
    this.renderAll();
  }

  // Deposit Flow
  openDepositModal(method = 'JazzCash') {
    this.selectedDepositMethod = method || 'JazzCash';
    const amountInput = document.getElementById('deposit-input-amount');
    if (amountInput) amountInput.value = '5000';
    const trxInput = document.getElementById('deposit-input-trx');
    if (trxInput) trxInput.value = '';

    this.selectDepositMethod(this.selectedDepositMethod);
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
    if (!window.EHMStore) return;
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
    this.updateUserState();
    const user = this.user || this.getFallbackUser();
    const balanceEl = document.getElementById('withdraw-modal-available-balance');
    if (balanceEl) balanceEl.textContent = `Rs. ${(user.balance || 0).toLocaleString()}`;

    const titleInput = document.getElementById('withdraw-input-title');
    if (titleInput) titleInput.value = user.name || 'Sultan Agro Farms';

    const numInput = document.getElementById('withdraw-input-number');
    if (numInput) numInput.value = user.phone || '0327272727';

    const amountInput = document.getElementById('withdraw-input-amount');
    if (amountInput) amountInput.value = Math.min(5000, Math.max(500, user.balance || 0));

    this.updateWithdrawSummary();
    window.EHMApp.openModal('modal-withdrawal');
  }

  setWithdrawMax() {
    const user = this.user || this.getFallbackUser();
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

    if (!window.EHMStore) return;
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
    // Buttons by ID
    const depBtn = document.getElementById('btn-deposit-action');
    if (depBtn) depBtn.onclick = () => this.openDepositModal();

    const wthBtn = document.getElementById('btn-withdraw-action');
    if (wthBtn) wthBtn.onclick = () => this.openWithdrawModal();

    const harvestBtn = document.getElementById('harvest-trigger-btn');
    if (harvestBtn) harvestBtn.onclick = () => this.collectDailyEggs();

    // Center egg bubble on bottom nav
    const centerBubble = document.querySelector('.nav-center-bubble');
    if (centerBubble) {
      centerBubble.onclick = () => {
        if (this.remainingSeconds <= 0) {
          this.collectDailyEggs();
        } else {
          const card = document.querySelector('.main-balance-card');
          if (card) card.scrollIntoView({ behavior: 'smooth' });
          window.EHMApp.showToast(`Laying in progress: ${this.remainingSeconds}s remaining to harvest!`, 'gold');
        }
      };
    }

    // Modal calculation inputs
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
      copyBtn.onclick = () => {
        const input = document.getElementById('referral-link-input');
        if (input) {
          window.EHMApp.copyText(input.value, 'Referral link copied to clipboard!');
        }
      };
    }

    // Share button
    const shareBtn = document.getElementById('btn-share-ref-link');
    if (shareBtn) {
      shareBtn.onclick = () => {
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
      };
    }
  }
}

// Immediate instantiation to ensure all window.EHMUser calls work without timing delays
window.EHMUser = new UserDashboardController();
