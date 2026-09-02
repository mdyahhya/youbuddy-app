// ============================================================================
// YouBuddy — Main Application Controller & Router
// ============================================================================

import { ICONS, renderIcon } from './icons.js';
import { authService } from './services/auth.service.js';
import { pwaService } from './services/pwa.service.js';
import { FeedView } from './views/feed.view.js';
import { NotesView } from './views/notes.view.js';
import { CoursesView } from './views/courses.view.js';
import { GamesView } from './views/games.view.js';
import { ProfileView } from './views/profile.view.js';
import { UniversityModal } from './views/university-modal.js';
import { AdminView } from './views/admin.view.js';

class App {
  constructor() {
    this.currentTab = 'home';
    this.viewContainer = null;
    this.views = {};
    this.universityModal = null;
  }

  init() {
    this.viewContainer = document.getElementById('main-content');
    
    // Initialize University Modal
    this.universityModal = new UniversityModal(() => {
      this.refreshCurrentView();
      this.updateAvatarInitial();
    });

    // Initialize View Controllers
    this.views = {
      home: new FeedView(this.viewContainer),
      notes: new NotesView(this.viewContainer, () => this.universityModal.open()),
      courses: new CoursesView(this.viewContainer),
      games: new GamesView(this.viewContainer),
      profile: new ProfileView(this.viewContainer, () => this.universityModal.open()),
      admin: new AdminView(this.viewContainer, () => this.switchTab('home'))
    };

    this.bindNavigation();
    this.bindDrawer();
    this.updateAvatarInitial();
    this.switchTab('home');
    this.registerServiceWorker();

    // Subscribe to auth changes
    authService.subscribe(() => {
      this.updateAvatarInitial();
    });
  }

  bindNavigation() {
    // 4 Bottom Navigation Buttons
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Top-Right Avatar Button -> Open Profile View
    const avatarBtn = document.getElementById('topbar-avatar-btn');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', () => {
        this.switchTab('profile');
      });
    }

    // Top Bar Brand Title -> Go to Home Feed
    const brandTitle = document.getElementById('brand-home-link');
    if (brandTitle) {
      brandTitle.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab('home');
      });
    }
  }

  bindDrawer() {
    const hamburgerBtn = document.getElementById('btn-hamburger');
    const drawer = document.getElementById('side-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');

    const openDrawer = () => {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      this.updateAdminDrawerVisibility();
    };

    const closeDrawer = () => {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
    };

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Drawer Menu Items
    const drawerChooseUni = document.getElementById('drawer-item-choose-uni');
    if (drawerChooseUni) {
      drawerChooseUni.addEventListener('click', () => {
        closeDrawer();
        this.universityModal.open();
      });
    }

    const drawerInstall = document.getElementById('drawer-item-install');
    if (drawerInstall) {
      drawerInstall.addEventListener('click', () => {
        closeDrawer();
        pwaService.promptInstall();
      });
    }

    const drawerProfile = document.getElementById('drawer-item-profile');
    if (drawerProfile) {
      drawerProfile.addEventListener('click', () => {
        closeDrawer();
        this.switchTab('profile');
      });
    }

    const drawerAdmin = document.getElementById('drawer-item-admin');
    if (drawerAdmin) {
      drawerAdmin.addEventListener('click', () => {
        closeDrawer();
        this.switchTab('admin');
      });
    }
  }

  updateAdminDrawerVisibility() {
    const drawerAdmin = document.getElementById('drawer-item-admin');
    if (drawerAdmin) {
      if (authService.isAdmin()) {
        drawerAdmin.classList.remove('hidden');
      } else {
        drawerAdmin.classList.remove('hidden'); // allow testing or role toggle in profile
      }
    }
  }

  updateAvatarInitial() {
    const user = authService.getUser();
    const avatarBtn = document.getElementById('topbar-avatar-btn');
    if (avatarBtn) {
      const initial = (user.full_name || 'E')[0].toUpperCase();
      if (user.avatar_url) {
        avatarBtn.innerHTML = `<img src="${user.avatar_url}" alt="${user.full_name}"/>`;
      } else {
        avatarBtn.textContent = initial;
      }
    }
  }

  switchTab(tabName) {
    if (!this.views[tabName]) return;
    this.currentTab = tabName;

    // Update Bottom Nav active state
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      const tab = item.getAttribute('data-tab');
      if (tab === tabName) {
        item.classList.add('active');
        // Switch to filled icon
        const iconContainer = item.querySelector('.nav-icon');
        if (iconContainer) {
          iconContainer.innerHTML = renderIcon(tab + 'Filled');
        }
      } else {
        item.classList.remove('active');
        const iconContainer = item.querySelector('.nav-icon');
        if (iconContainer && tab) {
          iconContainer.innerHTML = renderIcon(tab);
        }
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (this.viewContainer) this.viewContainer.scrollTop = 0;

    // Render active view
    this.views[tabName].render();
  }

  refreshCurrentView() {
    if (this.views[this.currentTab]) {
      this.views[this.currentTab].render();
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        }).catch((err) => {
          console.warn('[PWA] ServiceWorker registration failed:', err);
        });
      });
    }
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.youBuddyApp = app;
});
