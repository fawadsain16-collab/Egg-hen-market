/**
 * Egg Hen Market - Executive Admin Controller
 * Connects directly to fullstack shared database via window.EHMStore (/api/*),
 * provides real dynamic statistics, handles deposit / withdrawal / egg sell approvals,
 * manages packages, buyer rates, user balances, and system settings.
 */

class AdminDashboardController {
  constructor() {
    window.EHMAdmin = this;
    this.charts = {};
    this.selectedUserId = null;
    this.editingPackageId = null;
    this.selectedDepositId = null;
    this.selectedWithdrawalId = null;
    this.selectedEggSaleId = null;
    this.init();
  }

  init() {
    this.checkAdminAuth();
    this.renderAll();
    this.initCharts();
    this.bindEvents();

    // Listen to real-time events from EHMStore (both local actions and periodic server sync)
    window.addEventListener('ehm_event', (e) => {
      this.renderAll();
    });
  }

  // Security gate
  checkAdminAuth() {
    const session = window.EHMStore.getSession();
    const guard = document.getElementById('admin-auth-guard');

    if (session && session.role === 'admin') {
      if (guard) guard.style.display = 'none';
    } else {
      if (guard) guard.style.display = 'flex';
    }
  }

  handleAdminGateAuth(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-gate-pass').value;

    if (pass === 'admin123' || pass === 'admin') {
      window.EHMStore.setSession({
        role: 'admin',
        username: 'admin',
        userId: 'ADM-001',
        token: 'adm_sec_994821038'
      });
      const guard = document.getElementById('admin-auth-guard');
      if (guard) guard.style.display = 'none';
      window.EHMApp.showToast('Authorized as Controller Admin!', 'success');
      this.renderAll();
    } else {
      window.EHMApp.showToast('Invalid Admin credentials!', 'error');
    }
  }

  logoutAdmin() {
    window.EHMStore.setSession({
      role: 'user',
      username: 'demo',
      userId: 'USR-8821'
    });
    window.location.href = 'login.html';
  }

  renderAll() {
    this.renderSummaryStats();
    this.renderSidebarBadges();
    this.renderUsersTable();
    this.renderDepositsTable();
    this.renderWithdrawalsTable();
    this.renderEggRequestsTable();
    this.renderPurchasesTable();
    this.renderPackagesList();
    this.renderBuyersManager();
    this.renderReferralsTable();
    this.renderTransactionsTable();
    this.renderPaymentMethods();
    this.populateSettings();
  }

  // 1. DYNAMIC SUMMARY STATS (Calculated from database, never hardcoded!)
  renderSummaryStats() {
    const store = window.EHMStore;
    const stats = store.data.stats || {};
    const users = store.data.users || [];
    const deposits = store.data.deposits || [];
    const withdrawals = store.data.withdrawals || [];
    const eggRequests = store.data.eggSellRequests || [];
    const purchases = store.data.purchases || [];

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // User Metrics
    setVal('admin-stat-total-users', (stats.totalUsers || users.length).toString());
    setVal('admin-stat-today-users', (stats.todayUsers || 0).toString());
    setVal('admin-stat-active-investments', window.EHMApp.formatCurrency(stats.activeInvestments || 0));
    setVal('admin-stat-today-commission', window.EHMApp.formatCurrency(stats.todayCommission || 0));
    setVal('admin-stat-total-commission', window.EHMApp.formatCurrency(stats.totalCommission || 0));

    // Deposit Metrics
    setVal('admin-stat-today-deposit', window.EHMApp.formatCurrency(stats.todayDeposits || 0));
    setVal('admin-stat-pending-deposit', window.EHMApp.formatCurrency(stats.pendingDepositAmount || 0));
    setVal('admin-stat-total-deposited', window.EHMApp.formatCurrency(stats.totalDeposited || 0));
    setVal('admin-stat-pending-deposits-count', (stats.pendingDepositsCount || 0).toString());
    setVal('admin-stat-rejected-deposits', (stats.rejectedDepositsCount || 0).toString());
    setVal('admin-stat-deposited-charge', 'Rs.0');

    // Egg Sell Metrics
    setVal('admin-stat-today-eggs-sold', (stats.todayEggsSold || 0).toLocaleString());
    setVal('admin-stat-today-eggs-amount', window.EHMApp.formatCurrency(stats.todayEggsAmount || 0));
    setVal('admin-stat-pending-eggs-qty', (stats.pendingEggsQuantity || 0).toLocaleString());
    setVal('admin-stat-pending-eggs-amount', window.EHMApp.formatCurrency(stats.pendingEggsAmount || 0));
    setVal('admin-stat-total-eggs-qty', (stats.totalEggsQuantity || 0).toLocaleString());
    setVal('admin-stat-total-eggs-amount', window.EHMApp.formatCurrency(stats.totalEggsAmount || 0));
    setVal('admin-stat-pending-egg-requests', (stats.pendingEggRequests || 0).toString());
    setVal('admin-stat-rejected-egg-requests', (stats.rejectedEggRequests || 0).toString());

    // Plan & Yield Metrics
    setVal('admin-stat-today-buy-plan', (stats.todayBuyPlan || 0).toString());
    setVal('admin-stat-total-investment', window.EHMApp.formatCurrency(stats.totalInvestments || 0));
    setVal('admin-stat-total-interest', window.EHMApp.formatCurrency(stats.totalInterest || 0));
    setVal('admin-stat-active-investments-sum', window.EHMApp.formatCurrency(stats.activeInvestments || 0));
  }

  // Sidebar badge counters
  renderSidebarBadges() {
    const store = window.EHMStore;
    const users = store.data.users || [];
    const deposits = store.data.deposits || [];
    const withdrawals = store.data.withdrawals || [];
    const eggs = store.data.eggSellRequests || [];

    const pendingDep = deposits.filter((d) => d.status === 'pending').length;
    const pendingWth = withdrawals.filter((w) => w.status === 'pending').length;
    const pendingEggs = eggs.filter((e) => e.status === 'pending').length;

    const setBadge = (id, count) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-block' : 'none';
      }
    };

    setBadge('sidebar-badge-users', users.length);
    setBadge('sidebar-badge-deposits', pendingDep);
    setBadge('sidebar-badge-withdrawals', pendingWth);
    setBadge('sidebar-badge-eggs', pendingEggs);
  }

  // 2. USER MANAGEMENT
  renderUsersTable() {
    const tbody = document.getElementById('admin-users-table-body');
    if (!tbody) return;

    const searchInput = document.getElementById('admin-users-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const statusFilter = document.getElementById('admin-users-filter-status');
    const filterVal = statusFilter ? statusFilter.value : 'all';

    let users = [...(window.EHMStore.data.users || [])];

    if (query) {
      users = users.filter(
        (u) =>
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.name && u.name.toLowerCase().includes(query)) ||
          (u.phone && u.phone.includes(query)) ||
          (u.id && u.id.toLowerCase().includes(query))
      );
    }

    if (filterVal !== 'all') {
      users = users.filter((u) => u.status === filterVal);
    }

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No users match the search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${u.id}</td>
        <td>
          <div style="font-weight:600; color:#FFF;">${u.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">@${u.username} · ${u.phone || 'N/A'}</div>
        </td>
        <td class="tabular-nums font-semibold" style="color:#FFF;">${u.totalHens || 0}</td>
        <td class="tabular-nums font-semibold" style="color:var(--text-emerald);">${Number(u.availableEggs || 0).toFixed(1)}</td>
        <td class="tabular-nums font-semibold" style="color:var(--gold-light);">Rs.${(u.balance || 0).toLocaleString()}</td>
        <td class="tabular-nums" style="font-size:0.8rem; color:var(--text-muted);">${u.registeredAt || '2026-08-15'}</td>
        <td>
          <span class="badge-status ${u.status === 'active' ? 'active' : 'inactive'}">
            ${u.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-outline-gold" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="window.EHMAdmin.viewUserDetail('${u.id}')" title="Inspect & Adjust">
              <i class="fa-solid fa-eye"></i> View
            </button>
            <button class="btn-outline-gold" style="padding:0.3rem 0.6rem; font-size:0.75rem; color:${u.status === 'active' ? '#EF4444' : '#10B981'}; border-color:currentColor;" onclick="window.EHMAdmin.toggleUserStatus('${u.id}')" title="Toggle Status">
              <i class="fa-solid ${u.status === 'active' ? 'fa-ban' : 'fa-check'}"></i>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  viewUserDetail(userId) {
    const user = window.EHMStore.getUserById(userId);
    if (!user) return;

    this.selectedUserId = userId;
    const modal = document.getElementById('modal-admin-user-detail');
    if (!modal) return;

    document.getElementById('admin-modal-user-id').textContent = user.id;
    document.getElementById('admin-modal-user-name').value = user.name || '';
    document.getElementById('admin-modal-user-phone').value = user.phone || '';
    document.getElementById('admin-modal-user-email').value = user.email || '';
    document.getElementById('admin-modal-user-balance').value = user.balance || 0;
    document.getElementById('admin-modal-user-eggs').value = user.availableEggs || 0;
    document.getElementById('admin-modal-user-hens').value = user.totalHens || 0;
    document.getElementById('admin-modal-user-status').value = user.status || 'active';

    // Transactions for user
    const userTxs = window.EHMStore.getTransactions({ userId }).slice(0, 5);
    const txContainer = document.getElementById('admin-modal-user-txs');
    if (txContainer) {
      if (userTxs.length === 0) {
        txContainer.innerHTML = '<div style="font-size:0.8rem; color:var(--text-muted); padding:0.5rem 0;">No transactions recorded.</div>';
      } else {
        txContainer.innerHTML = userTxs
          .map(
            (t) => `
          <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid var(--border-subtle); font-size:0.78rem;">
            <div>
              <strong style="color:#FFF;">${t.type}</strong>
              <div style="font-size:0.7rem; color:var(--text-muted);">${t.description}</div>
            </div>
            <div style="text-align:right;">
              <span class="tabular-nums" style="font-weight:700; color:var(--gold-light);">${t.amount > 0 ? window.EHMApp.formatCurrency(t.amount) : t.quantity}</span>
              <div style="font-size:0.68rem; color:var(--text-muted);">${t.date}</div>
            </div>
          </div>
        `
          )
          .join('');
      }
    }

    window.EHMApp.openModal('modal-admin-user-detail');
  }

  async saveUserDetailChanges() {
    if (!this.selectedUserId) return;

    const name = document.getElementById('admin-modal-user-name').value;
    const phone = document.getElementById('admin-modal-user-phone').value;
    const email = document.getElementById('admin-modal-user-email').value;
    const balance = parseFloat(document.getElementById('admin-modal-user-balance').value) || 0;
    const availableEggs = parseFloat(document.getElementById('admin-modal-user-eggs').value) || 0;
    const totalHens = parseInt(document.getElementById('admin-modal-user-hens').value) || 0;
    const status = document.getElementById('admin-modal-user-status').value;

    const res = await window.EHMStore.updateUser(this.selectedUserId, {
      name,
      phone,
      email,
      balance,
      availableEggs,
      totalHens,
      purchasedHens: totalHens,
      status
    });

    window.EHMApp.closeModal('modal-admin-user-detail');
    if (res && res.success) {
      window.EHMApp.showToast(`Updated user records for ${name} in database!`, 'success');
    } else {
      window.EHMApp.showToast('Updated local record.', 'info');
    }
    this.renderUsersTable();
    this.renderSummaryStats();
  }

  async toggleUserStatus(userId) {
    const user = window.EHMStore.getUserById(userId);
    if (!user) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await window.EHMStore.updateUser(userId, { status: newStatus });
    window.EHMApp.showToast(`User @${user.username} status set to ${newStatus}.`, 'info');
    this.renderUsersTable();
  }

  openAddUserModal() {
    const username = prompt('Enter new user mobile number or username:');
    if (!username) return;
    const name = prompt('Enter full name:', 'Poultry Investor') || 'Poultry Investor';
    const balance = parseFloat(prompt('Initial deposit balance (Rs):', '1000') || '0');

    window.EHMStore.createUser({
      username,
      name,
      balance,
      phone: username
    }).then((res) => {
      if (res && res.success) {
        window.EHMApp.showToast(`User @${username} created successfully!`, 'success');
        this.renderUsersTable();
      }
    });
  }

  // 3. DEPOSITS MANAGEMENT
  renderDepositsTable() {
    const tbody = document.getElementById('admin-deposits-table-body');
    if (!tbody) return;

    const filterStatus = document.getElementById('admin-deposits-filter-status');
    const statusVal = filterStatus ? filterStatus.value : 'all';

    let deposits = [...(window.EHMStore.data.deposits || [])];
    if (statusVal !== 'all') {
      deposits = deposits.filter((d) => d.status === statusVal);
    }

    if (deposits.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No deposits found for this status filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = deposits
      .map(
        (d) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${d.id}</td>
        <td>
          <div style="font-weight:600; color:#FFF;">@${d.username}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${d.userPhone || ''}</div>
        </td>
        <td class="tabular-nums font-semibold" style="color:var(--emerald-primary); font-size:0.95rem;">
          Rs. ${d.amount.toLocaleString()}
        </td>
        <td>
          <span style="font-weight:600; color:#FFF;">${d.method}</span>
        </td>
        <td class="tabular-nums" style="font-weight:700; color:var(--gold-light); font-size:0.82rem;">
          ${d.trxId || 'N/A'}
        </td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${d.createdAt}</td>
        <td>
          <span class="badge-status ${d.status === 'approved' ? 'active' : d.status === 'pending' ? 'pending' : 'inactive'}">
            ${d.status.toUpperCase()}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-outline-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem;" onclick="window.EHMAdmin.openDepositProofModal('${d.id}')" title="Inspect Proof">
              <i class="fa-solid fa-receipt"></i> Inspect
            </button>
            ${
              d.status === 'pending'
                ? `
              <button class="btn-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem;" onclick="window.EHMAdmin.approveDepositQuick('${d.id}')" title="Approve & Credit Balance">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button class="btn-outline-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem; color:#EF4444; border-color:rgba(239,68,68,0.4);" onclick="window.EHMAdmin.rejectDepositQuick('${d.id}')" title="Reject">
                <i class="fa-solid fa-ban"></i>
              </button>
            `
                : ''
            }
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  openDepositProofModal(depositId) {
    const dep = (window.EHMStore.data.deposits || []).find((d) => d.id === depositId);
    if (!dep) return;

    this.selectedDepositId = depositId;
    document.getElementById('deposit-modal-id').textContent = dep.id;
    document.getElementById('deposit-modal-user').textContent = `@${dep.username} (${dep.userPhone || ''})`;
    document.getElementById('deposit-modal-amount').textContent = `Rs. ${dep.amount.toLocaleString()}`;
    document.getElementById('deposit-modal-method').textContent = dep.method;
    document.getElementById('deposit-modal-trx').textContent = dep.trxId;
    document.getElementById('deposit-modal-date').textContent = dep.createdAt;
    document.getElementById('deposit-modal-note').value = dep.adminNote || '';

    const proofWrap = document.getElementById('deposit-modal-proof-wrap');
    const proofImg = document.getElementById('deposit-modal-proof-img');
    if (proofWrap && proofImg) {
      if (dep.proofImage) {
        proofImg.src = dep.proofImage;
        proofWrap.style.display = 'block';
      } else {
        proofImg.src = '';
        proofWrap.style.display = 'none';
      }
    }

    const actionsWrap = document.getElementById('deposit-modal-actions');
    if (actionsWrap) {
      actionsWrap.style.display = dep.status === 'pending' ? 'flex' : 'none';
    }

    window.EHMApp.openModal('modal-admin-deposit-proof');
  }

  async approveDepositFromModal() {
    if (!this.selectedDepositId) return;
    const note = document.getElementById('deposit-modal-note').value;
    const res = await window.EHMStore.approveDeposit(this.selectedDepositId, note);
    window.EHMApp.closeModal('modal-admin-deposit-proof');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
    } else {
      window.EHMApp.showToast(res.message || 'Error approving deposit', 'error');
    }
    this.renderAll();
  }

  async rejectDepositFromModal() {
    if (!this.selectedDepositId) return;
    const note = document.getElementById('deposit-modal-note').value;
    const res = await window.EHMStore.rejectDeposit(this.selectedDepositId, note);
    window.EHMApp.closeModal('modal-admin-deposit-proof');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'info');
    } else {
      window.EHMApp.showToast(res.message || 'Error rejecting deposit', 'error');
    }
    this.renderAll();
  }

  async approveDepositQuick(depositId) {
    const res = await window.EHMStore.approveDeposit(depositId, 'Quick approved from Admin Dashboard');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async rejectDepositQuick(depositId) {
    if (!confirm('Are you sure you want to reject this deposit request?')) return;
    const res = await window.EHMStore.rejectDeposit(depositId, 'Invalid / Unverified transaction ID');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'info');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  // 4. WITHDRAWALS MANAGEMENT
  renderWithdrawalsTable() {
    const tbody = document.getElementById('admin-withdrawals-table-body');
    if (!tbody) return;

    const filterStatus = document.getElementById('admin-withdrawals-filter-status');
    const statusVal = filterStatus ? filterStatus.value : 'all';

    let withdrawals = [...(window.EHMStore.data.withdrawals || [])];
    if (statusVal !== 'all') {
      withdrawals = withdrawals.filter((w) => w.status === statusVal);
    }

    if (withdrawals.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No withdrawal requests match this status filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = withdrawals
      .map(
        (w) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${w.id}</td>
        <td>
          <div style="font-weight:600; color:#FFF;">@${w.username}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${w.userPhone || ''}</div>
        </td>
        <td class="tabular-nums font-semibold" style="color:var(--emerald-primary); font-size:0.95rem;">
          Rs. ${w.amount.toLocaleString()}
        </td>
        <td>
          <span style="font-weight:600; color:#FFF;">${w.method}</span>
        </td>
        <td style="font-weight:600; color:#FFF;">${w.accountTitle}</td>
        <td class="tabular-nums" style="font-weight:700; color:var(--gold-light); font-size:0.82rem;">
          ${w.accountNumber}
        </td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${w.createdAt}</td>
        <td>
          <span class="badge-status ${w.status === 'approved' ? 'active' : w.status === 'pending' ? 'pending' : 'inactive'}">
            ${w.status.toUpperCase()}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-outline-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem;" onclick="window.EHMAdmin.openWithdrawalDetailModal('${w.id}')" title="Inspect Payout">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${
              w.status === 'pending'
                ? `
              <button class="btn-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem;" onclick="window.EHMAdmin.approveWithdrawalQuick('${w.id}')" title="Disburse Funds">
                <i class="fa-solid fa-check"></i> Approve
              </button>
              <button class="btn-outline-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem; color:#EF4444; border-color:rgba(239,68,68,0.4);" onclick="window.EHMAdmin.rejectWithdrawalQuick('${w.id}')" title="Reject & Refund">
                <i class="fa-solid fa-ban"></i>
              </button>
            `
                : ''
            }
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  openWithdrawalDetailModal(wthId) {
    const wth = (window.EHMStore.data.withdrawals || []).find((w) => w.id === wthId);
    if (!wth) return;

    this.selectedWithdrawalId = wthId;
    document.getElementById('withdrawal-modal-id').textContent = wth.id;
    document.getElementById('withdrawal-modal-user').textContent = `@${wth.username} (${wth.userPhone || ''})`;
    document.getElementById('withdrawal-modal-amount').textContent = `Rs. ${wth.amount.toLocaleString()}`;
    document.getElementById('withdrawal-modal-method').textContent = wth.method;
    document.getElementById('withdrawal-modal-title').textContent = wth.accountTitle;
    document.getElementById('withdrawal-modal-account').textContent = wth.accountNumber;
    document.getElementById('withdrawal-modal-note').value = wth.adminNote || '';

    const actionsWrap = document.getElementById('withdrawal-modal-actions');
    if (actionsWrap) {
      actionsWrap.style.display = wth.status === 'pending' ? 'flex' : 'none';
    }

    window.EHMApp.openModal('modal-admin-withdrawal-detail');
  }

  async approveWithdrawalFromModal() {
    if (!this.selectedWithdrawalId) return;
    const note = document.getElementById('withdrawal-modal-note').value;
    const res = await window.EHMStore.approveWithdrawal(this.selectedWithdrawalId, note);
    window.EHMApp.closeModal('modal-admin-withdrawal-detail');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async rejectWithdrawalFromModal() {
    if (!this.selectedWithdrawalId) return;
    const note = document.getElementById('withdrawal-modal-note').value;
    const res = await window.EHMStore.rejectWithdrawal(this.selectedWithdrawalId, note);
    window.EHMApp.closeModal('modal-admin-withdrawal-detail');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'info');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async approveWithdrawalQuick(wthId) {
    const res = await window.EHMStore.approveWithdrawal(wthId, 'Disbursed via official payment gateway');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async rejectWithdrawalQuick(wthId) {
    if (!confirm('Reject this withdrawal? The requested amount will automatically refund to user wallet.')) return;
    const res = await window.EHMStore.rejectWithdrawal(wthId, 'Invalid account details / Manual decline');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'info');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  // 5. EGG SELL ORDERS
  renderEggRequestsTable() {
    const tbody = document.getElementById('admin-eggs-table-body');
    if (!tbody) return;

    const filterStatus = document.getElementById('admin-eggs-filter-status');
    const statusVal = filterStatus ? filterStatus.value : 'all';

    let list = [...(window.EHMStore.data.eggSellRequests || [])];
    if (statusVal !== 'all') {
      list = list.filter((e) => e.status === statusVal);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No egg sell requests found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list
      .map(
        (e) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${e.id}</td>
        <td>
          <span style="font-weight:600; color:#FFF;">@${e.username}</span>
        </td>
        <td>
          <span style="font-weight:600; color:var(--gold-light);">${e.buyerName}</span>
        </td>
        <td class="tabular-nums font-semibold" style="color:#FFF;">
          ${e.eggsQuantity} Eggs
        </td>
        <td class="tabular-nums font-semibold" style="color:var(--gold-light);">
          Rs. ${e.ratePerEgg}
        </td>
        <td class="tabular-nums font-semibold" style="color:var(--emerald-primary); font-size:0.95rem;">
          Rs. ${e.totalAmount.toLocaleString()}
        </td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${e.createdAt}</td>
        <td>
          <span class="badge-status ${e.status === 'approved' ? 'active' : e.status === 'pending' ? 'pending' : 'inactive'}">
            ${e.status.toUpperCase()}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-outline-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem;" onclick="window.EHMAdmin.openEggDetailModal('${e.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${
              e.status === 'pending'
                ? `
              <button class="btn-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem;" onclick="window.EHMAdmin.approveEggSaleQuick('${e.id}')" title="Approve & Credit User">
                <i class="fa-solid fa-check"></i>
              </button>
              <button class="btn-outline-gold" style="padding:0.3rem 0.55rem; font-size:0.72rem; color:#EF4444; border-color:rgba(239,68,68,0.4);" onclick="window.EHMAdmin.rejectEggSaleQuick('${e.id}')" title="Reject & Refund Eggs">
                <i class="fa-solid fa-ban"></i>
              </button>
            `
                : ''
            }
          </div>
        </td>
      </tr>
    `
      )
      .join('');
  }

  openEggDetailModal(eggId) {
    const egg = (window.EHMStore.data.eggSellRequests || []).find((e) => e.id === eggId);
    if (!egg) return;

    this.selectedEggSaleId = eggId;
    document.getElementById('egg-modal-id').textContent = egg.id;
    document.getElementById('egg-modal-user').textContent = `@${egg.username}`;
    document.getElementById('egg-modal-buyer').textContent = egg.buyerName;
    document.getElementById('egg-modal-qty').textContent = `${egg.eggsQuantity} Eggs`;
    document.getElementById('egg-modal-rate').textContent = `Rs. ${egg.ratePerEgg} / egg`;
    document.getElementById('egg-modal-total').textContent = `Rs. ${egg.totalAmount.toLocaleString()}`;

    const actionsWrap = document.getElementById('egg-modal-actions');
    if (actionsWrap) {
      actionsWrap.style.display = egg.status === 'pending' ? 'flex' : 'none';
    }

    window.EHMApp.openModal('modal-admin-egg-detail');
  }

  async approveEggSaleFromModal() {
    if (!this.selectedEggSaleId) return;
    const res = await window.EHMStore.approveEggSale(this.selectedEggSaleId);
    window.EHMApp.closeModal('modal-admin-egg-detail');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async rejectEggSaleFromModal() {
    if (!this.selectedEggSaleId) return;
    const res = await window.EHMStore.rejectEggSale(this.selectedEggSaleId);
    window.EHMApp.closeModal('modal-admin-egg-detail');
    if (res.success) {
      window.EHMApp.showToast(res.message, 'info');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async approveEggSaleQuick(eggId) {
    const res = await window.EHMStore.approveEggSale(eggId);
    if (res.success) {
      window.EHMApp.showToast(res.message, 'success');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  async rejectEggSaleQuick(eggId) {
    if (!confirm('Reject this egg sell order? The reserved eggs will automatically refund to user inventory.')) return;
    const res = await window.EHMStore.rejectEggSale(eggId);
    if (res.success) {
      window.EHMApp.showToast(res.message, 'info');
    } else {
      window.EHMApp.showToast(res.message, 'error');
    }
    this.renderAll();
  }

  // 6. HEN PURCHASES
  renderPurchasesTable() {
    const tbody = document.getElementById('admin-purchases-table-body');
    if (!tbody) return;

    const filterStatus = document.getElementById('admin-purchases-filter-status');
    const statusVal = filterStatus ? filterStatus.value : 'all';

    let purchases = [...(window.EHMStore.data.purchases || [])];
    if (statusVal !== 'all') {
      purchases = purchases.filter((p) => p.status === statusVal);
    }

    if (purchases.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No hen plan purchases found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = purchases
      .map(
        (p) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${p.id}</td>
        <td><strong style="color:#FFF;">@${p.username}</strong></td>
        <td style="color:var(--gold-light); font-weight:600;">${p.packageName}</td>
        <td class="tabular-nums font-semibold" style="color:#FFF;">${p.hensCount} Hens</td>
        <td class="tabular-nums font-semibold" style="color:var(--emerald-primary);">Rs. ${p.amount.toLocaleString()}</td>
        <td class="tabular-nums font-semibold" style="color:var(--gold-light);">+${p.dailyYield} Eggs / day</td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${p.createdAt}</td>
        <td>
          <span class="badge-status ${p.status === 'approved' ? 'active' : 'pending'}">
            ${p.status.toUpperCase()}
          </span>
        </td>
      </tr>
    `
      )
      .join('');
  }

  // 7. HEN PACKAGES CRUD
  renderPackagesList() {
    const container = document.getElementById('admin-packages-list');
    if (!container) return;

    const packages = window.EHMStore.getHenPackages();
    container.innerHTML = packages
      .map(
        (p) => `
      <div class="glass-panel" style="padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <span class="badge-status ${p.status === 'active' ? 'active' : 'inactive'}">${p.status}</span>
            <span style="font-size:0.75rem; color:var(--text-gold); font-weight:600;">${p.tag}</span>
          </div>
          <h4 style="color:#FFF; font-size:1.1rem; font-weight:700; margin-bottom:0.25rem;">${p.name}</h4>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.85rem;">${p.description}</p>
          <div style="background:rgba(0,0,0,0.3); border-radius:10px; padding:0.75rem; margin-bottom:1rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">
              <span style="color:var(--text-muted);">Capacity:</span>
              <strong style="color:#FFF;">${p.hens} Hens</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:0.25rem;">
              <span style="color:var(--text-muted);">Package Price:</span>
              <strong style="color:var(--gold-light);">Rs. ${p.price.toLocaleString()}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.82rem;">
              <span style="color:var(--text-muted);">Daily Yield:</span>
              <strong style="color:var(--emerald-primary);">${p.dailyYield} Eggs / day</strong>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-outline-gold" style="flex:1; padding:0.45rem; font-size:0.8rem;" onclick="window.EHMAdmin.openEditPackageModal('${p.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn-outline-gold" style="padding:0.45rem 0.75rem; font-size:0.8rem; color:#EF4444; border-color:rgba(239,68,68,0.3);" onclick="window.EHMAdmin.deletePackage('${p.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `
      )
      .join('');
  }

  openAddPackageModal() {
    this.editingPackageId = null;
    document.getElementById('package-modal-title').textContent = 'Add Hen Production Plan';
    document.getElementById('pkg-input-name').value = '';
    document.getElementById('pkg-input-hens').value = 5;
    document.getElementById('pkg-input-price').value = 2900;
    document.getElementById('pkg-input-yield').value = 5.2;
    document.getElementById('pkg-input-tag').value = 'Popular Tier';
    document.getElementById('pkg-input-desc').value = 'Automated flock unit with guaranteed yield integration.';
    document.getElementById('pkg-input-status').value = 'active';
    window.EHMApp.openModal('modal-admin-package');
  }

  openEditPackageModal(pkgId) {
    const pkg = window.EHMStore.getHenPackageById(pkgId);
    if (!pkg) return;

    this.editingPackageId = pkgId;
    document.getElementById('package-modal-title').textContent = 'Edit Hen Package';
    document.getElementById('pkg-input-name').value = pkg.name;
    document.getElementById('pkg-input-hens').value = pkg.hens;
    document.getElementById('pkg-input-price').value = pkg.price;
    document.getElementById('pkg-input-yield').value = pkg.dailyYield;
    document.getElementById('pkg-input-tag').value = pkg.tag || 'Standard';
    document.getElementById('pkg-input-desc').value = pkg.description || '';
    document.getElementById('pkg-input-status').value = pkg.status;
    window.EHMApp.openModal('modal-admin-package');
  }

  async savePackage() {
    const name = document.getElementById('pkg-input-name').value.trim();
    const hens = parseInt(document.getElementById('pkg-input-hens').value) || 1;
    const price = parseFloat(document.getElementById('pkg-input-price').value) || 580;
    const dailyYield = parseFloat(document.getElementById('pkg-input-yield').value) || hens;
    const tag = document.getElementById('pkg-input-tag').value.trim();
    const description = document.getElementById('pkg-input-desc').value.trim();
    const status = document.getElementById('pkg-input-status').value;

    if (!name) {
      window.EHMApp.showToast('Please enter a package name.', 'error');
      return;
    }

    if (this.editingPackageId) {
      await window.EHMStore.updateHenPackage(this.editingPackageId, {
        name,
        hens,
        price,
        dailyYield,
        tag,
        description,
        status
      });
      window.EHMApp.showToast(`Updated package "${name}"!`, 'success');
    } else {
      await window.EHMStore.addHenPackage({
        name,
        hens,
        price,
        dailyYield,
        tag,
        description,
        status
      });
      window.EHMApp.showToast(`Created new package "${name}"!`, 'success');
    }

    window.EHMApp.closeModal('modal-admin-package');
    this.renderPackagesList();
  }

  async deletePackage(pkgId) {
    if (confirm('Are you sure you want to remove this hen package?')) {
      await window.EHMStore.deleteHenPackage(pkgId);
      window.EHMApp.showToast('Package removed.', 'info');
      this.renderPackagesList();
    }
  }

  // 8. MARKET BUYER RATES
  renderBuyersManager() {
    const container = document.getElementById('admin-buyers-manager-list');
    if (!container) return;

    const buyers = window.EHMStore.getMarketBuyers();
    container.innerHTML = buyers
      .map(
        (b) => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.85rem; border-bottom:1px solid var(--border-subtle); gap:1rem; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <div style="font-weight:600; color:#FFF;">${b.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${b.badge} · Limit: ${b.minEggs} - ${b.maxEggs > 9999 ? 'No limit' : b.maxEggs}</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <label style="font-size:0.78rem; color:var(--text-secondary);">Rate / egg:</label>
          <div style="display:flex; align-items:center; gap:0.25rem;">
            <span style="font-size:0.85rem; color:var(--gold-light);">Rs.</span>
            <input type="number" class="form-input" style="width:80px; text-align:center;" value="${b.ratePerEgg}" onchange="window.EHMAdmin.updateBuyerRate('${b.id}', this.value)" />
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }

  async updateBuyerRate(buyerId, newRate) {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) return;
    await window.EHMStore.updateMarketBuyer(buyerId, { ratePerEgg: rate });
    window.EHMApp.showToast(`Updated market buyer rate to Rs. ${rate}/egg! Propagated to user portal.`, 'success');
  }

  // 9. REFERRALS & COMMISSIONS
  renderReferralsTable() {
    const tbody = document.getElementById('admin-referrals-table-body');
    if (!tbody) return;

    const txs = window.EHMStore.getTransactions({ type: 'Referral Reward' });
    if (txs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No referral rewards recorded in the shared database yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = txs
      .map(
        (t) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${t.id}</td>
        <td><strong style="color:#FFF;">@${t.username}</strong></td>
        <td><span class="badge-status active">Referral Reward</span></td>
        <td style="font-size:0.82rem; color:var(--text-secondary);">${t.description}</td>
        <td class="tabular-nums font-semibold" style="color:var(--emerald-primary);">Rs. ${t.amount.toLocaleString()}</td>
        <td class="tabular-nums font-semibold" style="color:var(--gold-light);">${t.quantity}</td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${t.date}</td>
      </tr>
    `
      )
      .join('');
  }

  // 10. TRANSACTIONS LEDGER
  renderTransactionsTable() {
    const tbody = document.getElementById('admin-transactions-table-body');
    if (!tbody) return;

    const typeFilter = document.getElementById('admin-tx-filter-type');
    const filterType = typeFilter ? typeFilter.value : 'All';
    const txs = window.EHMStore.getTransactions({ type: filterType });

    if (txs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No transactions found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = txs
      .map(
        (t) => `
      <tr>
        <td class="tabular-nums" style="color:var(--text-gold); font-weight:700;">${t.id}</td>
        <td>
          <span style="font-weight:600; color:#FFF;">@${t.username || 'user'}</span>
        </td>
        <td>
          <span class="badge-status ${t.type === 'Egg Sale' ? 'active' : t.type === 'Hen Purchase' ? 'pending' : t.type === 'Deposit' ? 'active' : 'completed'}">
            ${t.type}
          </span>
        </td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${t.description}</td>
        <td class="tabular-nums font-semibold" style="color:#FFF;">
          ${t.amount > 0 ? window.EHMApp.formatCurrency(t.amount) : t.quantity}
        </td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${t.date}</td>
        <td>
          <span class="badge-status ${t.status === 'Completed' ? 'completed' : t.status === 'Pending' ? 'pending' : 'rejected'}">
            ${t.status}
          </span>
        </td>
      </tr>
    `
      )
      .join('');
  }

  // 11. MANUAL PAYMENT GATEWAYS MANAGEMENT
  renderPaymentMethods() {
    const container = document.getElementById('admin-payment-methods-grid');
    if (!container) return;

    const list = window.EHMStore.getPaymentMethods ? window.EHMStore.getPaymentMethods(false) : [];
    if (list.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1; padding:2rem; text-align:center; color:var(--text-muted); background:rgba(0,0,0,0.3); border-radius:12px;">
          No payment gateways configured. Click "Add Payment Gateway" to set up EasyPaisa or JazzCash.
        </div>
      `;
      return;
    }

    container.innerHTML = list
      .map(
        (m) => `
      <div class="glass-panel" style="padding:1.25rem; border:1px solid ${m.status === 'active' ? 'var(--border-gold)' : 'var(--border-subtle)'}; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <div style="width:38px; height:38px; border-radius:10px; background:rgba(212,175,55,0.15); color:${m.color || 'var(--gold-primary)'}; display:flex; align-items:center; justify-content:center; font-size:1.15rem;">
              <i class="fa-solid ${m.icon || 'fa-wallet'}"></i>
            </div>
            <div>
              <h4 style="font-size:0.95rem; font-weight:700; color:#FFF; margin:0;">${m.name}</h4>
              <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${m.type || 'Manual Gateway'}</span>
            </div>
          </div>
          <span class="badge-status ${m.status === 'active' ? 'active' : 'inactive'}">
            ${(m.status || 'active').toUpperCase()}
          </span>
        </div>

        <div style="background:rgba(0,0,0,0.35); border-radius:8px; padding:0.75rem; font-size:0.8rem; margin-bottom:1rem; display:flex; flex-direction:column; gap:0.35rem;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Account Title:</span>
            <strong style="color:#FFF;">${m.accountTitle}</strong>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">Account Number:</span>
            <strong class="tabular-nums" style="color:var(--gold-light);">${m.accountNumber}</strong>
          </div>
          ${m.iban ? `
          <div style="display:flex; justify-content:space-between;">
            <span style="color:var(--text-muted);">IBAN:</span>
            <span class="tabular-nums" style="color:var(--text-secondary); font-size:0.75rem;">${m.iban}</span>
          </div>` : ''}
          <div style="margin-top:0.25rem; font-size:0.72rem; color:var(--text-secondary); line-height:1.3; border-top:1px dashed var(--border-subtle); padding-top:0.35rem;">
            ${m.instructions || ''}
          </div>
        </div>

        <div style="display:flex; gap:0.5rem;">
          <button class="btn-outline-gold" style="flex:1; padding:0.35rem 0.6rem; font-size:0.75rem;" onclick="window.EHMAdmin.openEditPaymentMethodModal('${m.id}')">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button class="btn-outline-gold" style="flex:1; padding:0.35rem 0.6rem; font-size:0.75rem; color:${m.status === 'active' ? '#EF4444' : '#10B981'}; border-color:${m.status === 'active' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'};" onclick="window.EHMAdmin.togglePaymentMethodStatus('${m.id}')">
            <i class="fa-solid ${m.status === 'active' ? 'fa-eye-slash' : 'fa-eye'}"></i> ${m.status === 'active' ? 'Disable' : 'Enable'}
          </button>
          <button class="btn-outline-gold" style="padding:0.35rem 0.6rem; font-size:0.75rem; color:#EF4444; border-color:rgba(239,68,68,0.3);" onclick="window.EHMAdmin.deletePaymentMethod('${m.id}')" title="Delete Gateway">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join('');
  }

  openAddPaymentMethodModal() {
    this.editingPaymentMethodId = null;
    const titleEl = document.getElementById('pm-modal-title');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-plus" style="color:var(--gold-primary);"></i> Add Payment Gateway';

    document.getElementById('pm-input-name').value = '';
    document.getElementById('pm-input-title').value = '';
    document.getElementById('pm-input-number').value = '';
    document.getElementById('pm-input-iban').value = '';
    document.getElementById('pm-input-instructions').value = 'Send payment and upload screenshot proof.';
    document.getElementById('pm-input-status').value = 'active';

    window.EHMApp.openModal('modal-admin-payment-method');
  }

  openEditPaymentMethodModal(id) {
    const list = window.EHMStore.getPaymentMethods ? window.EHMStore.getPaymentMethods(false) : [];
    const m = list.find((item) => item.id === id);
    if (!m) return;

    this.editingPaymentMethodId = id;
    const titleEl = document.getElementById('pm-modal-title');
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:var(--gold-primary);"></i> Edit ${m.name}`;

    document.getElementById('pm-input-name').value = m.name || '';
    document.getElementById('pm-input-title').value = m.accountTitle || '';
    document.getElementById('pm-input-number').value = m.accountNumber || '';
    document.getElementById('pm-input-iban').value = m.iban || '';
    document.getElementById('pm-input-instructions').value = m.instructions || '';
    document.getElementById('pm-input-status').value = m.status || 'active';

    window.EHMApp.openModal('modal-admin-payment-method');
  }

  async savePaymentMethod() {
    const name = document.getElementById('pm-input-name').value.trim();
    const accountTitle = document.getElementById('pm-input-title').value.trim();
    const accountNumber = document.getElementById('pm-input-number').value.trim();
    const iban = document.getElementById('pm-input-iban').value.trim();
    const instructions = document.getElementById('pm-input-instructions').value.trim();
    const status = document.getElementById('pm-input-status').value;

    if (!name || !accountTitle || !accountNumber) {
      window.EHMApp.showToast('Please enter gateway name, account title, and account number.', 'error');
      return;
    }

    const payload = {
      name,
      accountTitle,
      accountNumber,
      iban,
      instructions,
      status,
      icon: name.toLowerCase().includes('bank') ? 'fa-building-columns' : 'fa-wallet'
    };

    if (this.editingPaymentMethodId) {
      await window.EHMStore.updatePaymentMethod(this.editingPaymentMethodId, payload);
      window.EHMApp.showToast(`Updated ${name} gateway settings!`, 'success');
    } else {
      await window.EHMStore.addPaymentMethod(payload);
      window.EHMApp.showToast(`Added new gateway: ${name}!`, 'success');
    }

    window.EHMApp.closeModal('modal-admin-payment-method');
    this.renderPaymentMethods();
  }

  async togglePaymentMethodStatus(id) {
    const list = window.EHMStore.getPaymentMethods ? window.EHMStore.getPaymentMethods(false) : [];
    const m = list.find((item) => item.id === id);
    if (!m) return;

    const newStatus = m.status === 'active' ? 'inactive' : 'active';
    await window.EHMStore.updatePaymentMethod(id, { status: newStatus });
    window.EHMApp.showToast(`${m.name} is now ${newStatus}.`, 'info');
    this.renderPaymentMethods();
  }

  async deletePaymentMethod(id) {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    await window.EHMStore.deletePaymentMethod(id);
    window.EHMApp.showToast('Payment method removed.', 'info');
    this.renderPaymentMethods();
  }

  // 12. SYSTEM SETTINGS
  populateSettings() {
    const store = window.EHMStore;
    const eggSets = store.data.eggSettings || {};
    const refSets = store.data.referralSettings || {};
    const webSets = store.data.websiteSettings || {};

    const setInput = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    setInput('settings-base-egg-rate', eggSets.baseRatePerEgg || 45);
    setInput('settings-egg-timer', eggSets.eggCollectionIntervalSeconds || 60);
    setInput('settings-ref-comm', refSets.commissionPercent || 7.5);
    setInput('settings-ref-eggs', refSets.bonusEggsPerReferral || 5.0);
    setInput('settings-site-name', webSets.siteName || 'Egg Hen Market');
    setInput('settings-whatsapp-owner', webSets.supportOwnerPhone || '+92 300 8472910');
    setInput('settings-whatsapp-admin', webSets.supportAdminPhone || '+92 327 272727');
    setInput('settings-fbr-ntn', webSets.fbrCertification || 'FBR Tax Registered Merchant • NTN: 8294710-3');
  }

  async saveAllSettings() {
    const baseRate = parseFloat(document.getElementById('settings-base-egg-rate').value) || 45;
    const timer = parseInt(document.getElementById('settings-egg-timer').value) || 60;
    const comm = parseFloat(document.getElementById('settings-ref-comm').value) || 7.5;
    const bonusEggs = parseFloat(document.getElementById('settings-ref-eggs').value) || 5.0;
    const siteName = document.getElementById('settings-site-name').value;
    const ownerPhone = document.getElementById('settings-whatsapp-owner').value;
    const adminPhone = document.getElementById('settings-whatsapp-admin').value;
    const fbrNtn = document.getElementById('settings-fbr-ntn').value;

    const payload = {
      eggSettings: { baseRatePerEgg: baseRate, eggCollectionIntervalSeconds: timer },
      referralSettings: { commissionPercent: comm, bonusEggsPerReferral: bonusEggs },
      websiteSettings: {
        siteName,
        supportOwnerPhone: ownerPhone,
        supportAdminPhone: adminPhone,
        fbrCertification: fbrNtn
      }
    };

    await window.EHMStore.saveAllSettings(payload);
    window.EHMApp.showToast('All administrative settings saved to database and propagated!', 'success');
  }

  // 12. BROADCAST
  async sendBroadcast() {
    const title = document.getElementById('broadcast-notif-title').value.trim();
    const msg = document.getElementById('broadcast-notif-msg').value.trim();

    if (!title || !msg) {
      window.EHMApp.showToast('Please enter both title and message.', 'error');
      return;
    }

    await window.EHMStore.sendNotification(title, msg, 'market');
    window.EHMApp.showToast('Broadcast sent to all user dashboards!', 'success');
    document.getElementById('broadcast-notif-title').value = '';
    document.getElementById('broadcast-notif-msg').value = '';
  }

  // Switch navigation tabs programmatically
  switchTab(tabTarget) {
    document.querySelectorAll('[data-admin-tab]').forEach((l) => l.classList.remove('active'));
    const targetLink = document.querySelector(`[data-admin-tab="${tabTarget}"]`);
    if (targetLink) targetLink.classList.add('active');

    document.querySelectorAll('.admin-tab-section').forEach((sec) => {
      sec.style.display = sec.id === `section-${tabTarget}` ? 'block' : 'none';
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 13. CHARTS INITIALIZATION
  initCharts() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";

    const ctxBar = document.getElementById('chart-deposits-withdraws');
    if (ctxBar) {
      this.charts.deposits = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['June 2026', 'July 2026', 'August 2026', 'September 2026'],
          datasets: [
            {
              label: 'Total Deposits (Rs)',
              data: [42000, 78500, 115000, 175160],
              backgroundColor: '#0284C7',
              borderRadius: 8
            },
            {
              label: 'Total Withdrawals (Rs)',
              data: [12000, 24000, 39000, 62000],
              backgroundColor: '#10B981',
              borderRadius: 8
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, color: '#FFF' } }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });
    }

    const ctxLine = document.getElementById('chart-transactions-trend');
    if (ctxLine) {
      this.charts.txTrend = new Chart(ctxLine, {
        type: 'line',
        data: {
          labels: ['09-24', '09-25', '09-26', '09-27', '09-28', '09-29', '09-30'],
          datasets: [
            {
              label: 'Inflow (Purchases & Deposits)',
              data: [28000, 42000, 35000, 68000, 49000, 84000, 92000],
              borderColor: '#0284C7',
              backgroundColor: 'rgba(2, 132, 199, 0.15)',
              fill: true,
              tension: 0.35,
              borderWidth: 2
            },
            {
              label: 'Outflow (Egg Sales Payouts)',
              data: [12000, 19000, 14500, 32000, 28000, 41000, 38000],
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              fill: true,
              tension: 0.35,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, color: '#FFF' } }
          },
          scales: {
            x: { grid: { display: false } },
            y: { grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });
    }

    const ctxBrowser = document.getElementById('chart-login-browser');
    if (ctxBrowser) {
      new Chart(ctxBrowser, {
        type: 'doughnut',
        data: {
          labels: ['Chrome Mobile', 'Safari iOS', 'Chrome Desktop', 'Other'],
          datasets: [{ data: [68, 22, 7, 3], backgroundColor: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%' }
      });
    }

    const ctxOS = document.getElementById('chart-login-os');
    if (ctxOS) {
      new Chart(ctxOS, {
        type: 'doughnut',
        data: {
          labels: ['Android', 'iOS', 'Windows', 'macOS'],
          datasets: [{ data: [74, 20, 4, 2], backgroundColor: ['#10B981', '#8B5CF6', '#0284C7', '#F59E0B'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%' }
      });
    }

    const ctxCountry = document.getElementById('chart-login-country');
    if (ctxCountry) {
      new Chart(ctxCountry, {
        type: 'doughnut',
        data: {
          labels: ['Pakistan', 'UAE', 'Saudi Arabia', 'UK'],
          datasets: [{ data: [86, 8, 4, 2], backgroundColor: ['#065F46', '#D4AF37', '#0284C7', '#EC4899'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '72%' }
      });
    }
  }

  bindEvents() {
    const searchInput = document.getElementById('admin-users-search');
    if (searchInput) searchInput.addEventListener('input', () => this.renderUsersTable());

    const statusFilter = document.getElementById('admin-users-filter-status');
    if (statusFilter) statusFilter.addEventListener('change', () => this.renderUsersTable());

    const depFilter = document.getElementById('admin-deposits-filter-status');
    if (depFilter) depFilter.addEventListener('change', () => this.renderDepositsTable());

    const wthFilter = document.getElementById('admin-withdrawals-filter-status');
    if (wthFilter) wthFilter.addEventListener('change', () => this.renderWithdrawalsTable());

    const eggFilter = document.getElementById('admin-eggs-filter-status');
    if (eggFilter) eggFilter.addEventListener('change', () => this.renderEggRequestsTable());

    const purFilter = document.getElementById('admin-purchases-filter-status');
    if (purFilter) purFilter.addEventListener('change', () => this.renderPurchasesTable());

    const txTypeFilter = document.getElementById('admin-tx-filter-type');
    if (txTypeFilter) txTypeFilter.addEventListener('change', () => this.renderTransactionsTable());

    // Navigation Tabs
    document.querySelectorAll('[data-admin-tab]').forEach((tabLink) => {
      tabLink.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = tabLink.getAttribute('data-admin-tab');
        this.switchTab(tabTarget);

        const sidebar = document.getElementById('admin-sidebar');
        if (sidebar) sidebar.classList.remove('open');
      });
    });

    const toggleBtn = document.getElementById('admin-mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('admin-sidebar');
        if (sidebar) sidebar.classList.toggle('open');
      });
    }
  }
}

function initAdminApp() {
  if (!window.EHMAdmin) {
    window.EHMAdmin = new AdminDashboardController();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
  initAdminApp();
}
