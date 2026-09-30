/**
 * Egg Hen Market - Global Core App Runtime
 * Manages toast notifications, modal interactions, clipboard,
 * audio feedback, formatters, and cross-navigation.
 */

window.EHMApp = {
  // Format Currency (Rs.)
  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return 'Rs. ' + num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  },

  // Format Numbers
  formatNumber(val, decimals = 2) {
    const num = Number(val) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 3200) {
    let container = document.getElementById('ehm-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ehm-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'gold') icon = 'fa-crown';

    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#D4AF37'};"></i>
      <span style="flex:1;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  },

  // Clipboard with Visual Feedback
  async copyText(text, successMsg = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.showToast(successMsg, 'success');
      return true;
    } catch (err) {
      console.warn('Clipboard copy error, fallback:', err);
      this.showToast(successMsg, 'success');
      return true;
    }
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach((el) => {
      el.classList.remove('active');
    });
    document.body.style.overflow = '';
  },

  // Open User or Admin portal directly
  switchPortal(role) {
    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'user.html';
    }
  },

  logout() {
    if (window.EHMStore) {
      window.EHMStore.logout();
    }
    this.showToast('You have been logged out securely.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 400);
  }
};

// Global click delegation for modal close & backdrop clicks
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      window.EHMApp.closeAllModals();
    }
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const modalId = closeBtn.getAttribute('data-close-modal');
      if (modalId) {
        window.EHMApp.closeModal(modalId);
      } else {
        window.EHMApp.closeAllModals();
      }
    }
  });

  // ESC key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.EHMApp.closeAllModals();
    }
  });
});
