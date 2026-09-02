// ============================================================================
// YouBuddy — PWA Installation Service (Android Native + iOS Step-by-Step)
// ============================================================================

import { ICONS, renderIcon } from '../icons.js';

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      this.isInstalled = true;
    }

    // Capture Android/Chrome install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log('[PWA] beforeinstallprompt captured.');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      console.log('[PWA] App successfully installed!');
    });
  }

  isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    );
  }

  async promptInstall() {
    if (this.isInstalled) {
      alert("YouBuddy is already installed on your device!");
      return;
    }

    if (this.deferredPrompt) {
      // Android / Chrome native prompt
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      this.deferredPrompt = null;
    } else if (this.isIOS()) {
      // Show iOS step-by-step instruction modal
      this.showIOSInstallModal();
    } else {
      // Generic fallback modal for Desktop Chrome/Edge or other browsers
      this.showGenericInstallModal();
    }
  }

  showIOSInstallModal() {
    const modalId = 'ios-install-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">Install YouBuddy on iOS</h3>
            <button class="icon-btn close-modal-btn" aria-label="Close">${renderIcon('close')}</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.95rem;">
              Install YouBuddy directly to your iPhone or iPad home screen for the full fullscreen native experience:
            </p>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-light); color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">1</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.95rem;">Tap the Share button</div>
                  <div style="color: var(--text-muted); font-size: 0.85rem;">Look for the ${renderIcon('iosShare', '', '16')} icon at the bottom of Safari.</div>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-light); color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">2</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.95rem;">Scroll down and select "Add to Home Screen"</div>
                  <div style="color: var(--text-muted); font-size: 0.85rem;">Tap on the square with a plus icon in the share sheet.</div>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-light); color: var(--accent-color); display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">3</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.95rem;">Tap "Add" in top-right</div>
                  <div style="color: var(--text-muted); font-size: 0.85rem;">YouBuddy will appear as an app icon on your home screen!</div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary btn-block close-modal-btn">Got It</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => modal.classList.remove('open'));
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    setTimeout(() => modal.classList.add('open'), 10);
  }

  showGenericInstallModal() {
    alert("To install YouBuddy:\n\n• On Chrome/Edge (Desktop): Click the install icon in the browser address bar.\n• On Android Chrome: Tap the three dots menu (⋮) and select 'Install app'.");
  }
}

export const pwaService = new PWAService();
