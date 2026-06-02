/* ============================================================
   SiSeminar — app.js
   Main Application Controller & SPA Router
   ============================================================ */

const App = (() => {
  let currentRoute = '';
  let sidebarOpen = false;

  const adminRoutes = {
    'events': { label: 'Manajemen Event', icon: 'event', render: () => EventsPage.render() },
    'form-builder': { label: 'Pembuat Form', icon: 'dynamic_form', render: () => FormBuilderPage.render() },
    'participants': { label: 'Data Peserta', icon: 'group', render: () => ParticipantsPage.render() },
    'chat': { label: 'Chat Grup', icon: 'forum', render: () => ChatPage.render() },
    'attendance': { label: 'Presensi', icon: 'qr_code_scanner', render: () => AttendancePage.render() },
    'feedback-results': { label: 'Hasil Feedback', icon: 'reviews', render: () => QuestionnairePage.renderResults(App.getRouteParams().params.event) },
    'sponsors-history': { label: 'Sponsor & Riwayat', icon: 'stars', render: () => SponsorsHistoryPage.render() },
  };

  const publicRoutes = ['login', 'register', 'checkin'];

  async function init() {
    Store.initDemoData();
    
    // Check and restore InsForge Auth Session
    if (window.insforge) {
      try {
        const { data } = await window.insforge.auth.getCurrentUser();
        if (data && data.user) {
          const profile = data.user.profile || {};
          const sessionUser = {
            id: data.user.id,
            email: data.user.email,
            name: profile.name || data.user.email.split('@')[0],
            phone: profile.phone || '',
            role: data.user.email.includes('admin') || data.user.id === '33c4138c-89f1-4922-a2e9-740e53d07407' || data.user.email === '6287881527804@siseminar.com' || data.user.id === 'admin_001' ? 'admin' : 'peserta'
          };
          localStorage.setItem('siseminar_current_user', JSON.stringify(sessionUser));
          
          // Save Google User if they are new
          const users = JSON.parse(localStorage.getItem('siseminar_users') || '[]');
          if (!users.find(u => u.id === sessionUser.id)) {
            await Store.addUser({
              id: sessionUser.id,
              name: sessionUser.name,
              phone: sessionUser.phone || 'google_' + sessionUser.id.substring(0, 8),
              password: 'google_oauth_user',
              role: sessionUser.role,
              email: sessionUser.email
            });
          }
        }
      } catch (err) {
        console.error("InsForge session restoration failed:", err);
      }
    }

    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function getRouteParams() {
    const hash = window.location.hash.substring(1);
    const [route, queryStr] = hash.split('?');
    const params = {};
    if (queryStr) {
      queryStr.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { route, params };
  }

  function handleRoute() {
    const { route, params } = getRouteParams();
    const user = Store.getCurrentUser();

    // Public routes (no auth needed)
    if (route === 'login' || !route) {
      if (user) {
        navigate(user.role === 'admin' ? 'events' : 'chat');
        return;
      }
      renderLoginPage();
      return;
    }

    if (route === 'register') {
      renderPublicPage(() => RegistrationPage.render(params.event));
      return;
    }

    if (route === 'checkin') {
      renderPublicPage(() => AttendancePage.renderCheckin(params.event, params.token));
      return;
    }

    // Auth required routes
    if (!user) {
      navigate('login');
      return;
    }

    // Peserta routes
    if (user.role === 'peserta') {
      if (route === 'chat') {
        renderPesertaLayout(() => ChatPage.render());
      } else if (route === 'checkin-peserta') {
        renderPesertaLayout(() => AttendancePage.renderPesertaCheckin());
      } else if (route === 'list-seminar') {
        renderPesertaLayout(() => ListSeminarPage.render());
      } else if (route === 'feedback') {
        renderPesertaLayout(() => QuestionnairePage.renderForm(params.event));
      } else if (route === 'sponsors-history') {
        renderPesertaLayout(() => SponsorsHistoryPage.render());
      } else {
        navigate('chat');
      }
      return;
    }

    // Admin routes
    if (adminRoutes[route]) {
      currentRoute = route;
      renderAdminLayout(route, params);
    } else if (route === 'questionnaire-builder') {
      currentRoute = route;
      renderAdminLayoutCustom(() => QuestionnairePage.renderBuilder(params.event));
    } else {
      navigate('events');
    }
  }

  function navigate(route) {
    window.location.hash = '#' + route;
  }

  function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.className = '';
    AuthPage.render(app);
  }

  function renderAdminLayout(route, params) {
    const app = document.getElementById('app');
    app.className = 'app-layout';
    
    app.innerHTML = `
      ${renderSidebar(route)}
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <div class="main-content">
        ${renderTopbar()}
        <div class="page-content" id="pageContent"></div>
        ${renderFooter()}
      </div>
    `;

    // Sidebar events
    setupSidebarEvents();

    // Render page content
    const content = document.getElementById('pageContent');
    if (adminRoutes[route]) {
      adminRoutes[route].render();
    }
  }

  function renderAdminLayoutCustom(renderFn) {
    const app = document.getElementById('app');
    app.className = 'app-layout';
    
    app.innerHTML = `
      ${renderSidebar('')}
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <div class="main-content">
        ${renderTopbar()}
        <div class="page-content" id="pageContent"></div>
        ${renderFooter()}
      </div>
    `;

    // Sidebar events
    setupSidebarEvents();

    // Render page content
    renderFn();
  }

  function renderPesertaLayout(renderFn) {
    const app = document.getElementById('app');
    app.className = 'app-layout';
    const user = Store.getCurrentUser();

    app.innerHTML = `
      ${renderPesertaSidebar()}
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
      <div class="main-content">
        ${renderTopbar()}
        <div class="page-content" id="pageContent"></div>
        ${renderFooter()}
      </div>
    `;

    setupSidebarEvents();
    renderFn();
  }

  function renderPublicPage(renderFn) {
    const app = document.getElementById('app');
    app.className = '';
    app.innerHTML = `
      <div class="participant-layout">
        <nav class="participant-topbar">
          <h1>SiSeminar</h1>
          <button class="topbar-icon-btn" title="Bantuan">
            <span class="material-symbols-outlined">help</span>
          </button>
        </nav>
        <div id="pageContent"></div>
        ${renderFooter()}
      </div>
    `;
    renderFn();
  }

  function renderSidebar(activeRoute) {
    const user = Store.getCurrentUser();
    const initials = user ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'AD';

    const navItems = Object.entries(adminRoutes).map(([route, config]) => `
      <button class="sidebar-nav-item ${activeRoute === route ? 'active' : ''}" onclick="App.navigate('${route}')">
        <span class="material-symbols-outlined">${config.icon}</span>
        ${config.label}
      </button>
    `).join('');

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <h1>SiSeminar</h1>
          <p>Portal Admin</p>
        </div>
        <nav class="sidebar-nav">
          ${navItems}
        </nav>
        <div class="sidebar-user">
          <div class="sidebar-avatar">${initials}</div>
          <div class="sidebar-user-info">
            <h4>${user?.name || 'Admin'}</h4>
            <p>Administrator</p>
          </div>
          <button class="topbar-icon-btn" onclick="App.handleLogout()" title="Keluar" style="margin-left:auto;">
            <span class="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>
    `;
  }

  function renderPesertaSidebar() {
    const user = Store.getCurrentUser();
    const initials = user ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'PS';
    const { route: activeRoute } = getRouteParams();

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <h1>SiSeminar</h1>
          <p>Portal Peserta</p>
        </div>
        <nav class="sidebar-nav">
          <button class="sidebar-nav-item ${activeRoute === 'chat' ? 'active' : ''}" onclick="App.navigate('chat')">
            <span class="material-symbols-outlined">forum</span>
            Chat Grup
          </button>
          <button class="sidebar-nav-item ${activeRoute === 'list-seminar' ? 'active' : ''}" onclick="App.navigate('list-seminar')">
            <span class="material-symbols-outlined">event_note</span>
            List Seminar
          </button>
          <button class="sidebar-nav-item ${activeRoute === 'checkin-peserta' ? 'active' : ''}" onclick="App.navigate('checkin-peserta')">
            <span class="material-symbols-outlined">qr_code_scanner</span>
            Check-in
          </button>
          <button class="sidebar-nav-item ${activeRoute === 'sponsors-history' ? 'active' : ''}" onclick="App.navigate('sponsors-history')">
            <span class="material-symbols-outlined">history</span>
            Riwayat
          </button>
        </nav>
        <div class="sidebar-user">
          <div class="sidebar-avatar" style="background: var(--secondary);">${initials}</div>
          <div class="sidebar-user-info">
            <h4>${user?.name || 'Peserta'}</h4>
            <p>Peserta</p>
          </div>
          <button class="topbar-icon-btn" onclick="App.handleLogout()" title="Keluar" style="margin-left:auto;">
            <span class="material-symbols-outlined">logout</span>
          </button>
        </div>
      </aside>
    `;
  }

  function renderTopbar() {
    const user = Store.getCurrentUser();
    const initials = user ? user.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : '';

    return `
      <header class="topbar">
        <div class="flex items-center gap-3">
          <button class="mobile-menu-btn topbar-icon-btn" id="mobileMenuBtn" style="display:none;">
            <span class="material-symbols-outlined">menu</span>
          </button>
          <div class="topbar-search">
            <span class="material-symbols-outlined">search</span>
            <input type="text" placeholder="Cari..." id="globalSearch">
          </div>
        </div>
        <div class="topbar-actions">
          <button class="topbar-icon-btn" title="Notifikasi">
            <span class="material-symbols-outlined">notifications</span>
          </button>
          <button class="topbar-icon-btn" title="Bantuan">
            <span class="material-symbols-outlined">help</span>
          </button>
          <div class="topbar-profile" title="${user?.name || ''}">${initials}</div>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="footer">
        <div>
          <strong>SiSeminar</strong> &copy; ${new Date().getFullYear()} Sistem Informasi Seminar. Hak cipta dilindungi.
        </div>
        <div class="footer-links">
          <a href="#">Kebijakan Privasi</a>
          <a href="#">Syarat & Ketentuan</a>
          <a href="#">Hubungi Kami</a>
        </div>
      </footer>
    `;
  }

  function setupSidebarEvents() {
    // Mobile menu
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (window.innerWidth <= 1024 && menuBtn) {
      menuBtn.style.display = 'flex';
    }

    window.addEventListener('resize', () => {
      if (menuBtn) {
        menuBtn.style.display = window.innerWidth <= 1024 ? 'flex' : 'none';
      }
      if (window.innerWidth > 1024 && sidebar) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
      }
    });

    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        sidebar?.classList.toggle('open');
        overlay?.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  }

  // ============ Toast Notifications ============
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============ Modal Helpers ============
  function showModal(title, bodyHTML, footerHTML = '') {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modalOverlay';
    overlay.innerHTML = `
      <div class="modal animate-scale-in">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="topbar-icon-btn" onclick="App.closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    
    requestAnimationFrame(() => overlay.classList.add('active'));
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    }
  }

  // ============ Logout ============
  function handleLogout() {
    Store.logout();
    navigate('login');
    showToast('Berhasil keluar', 'success');
  }

  // ============ Utility ============
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function getPageContent() {
    return document.getElementById('pageContent');
  }

  return {
    init,
    navigate,
    handleLogout,
    showToast,
    showModal,
    closeModal,
    formatDate,
    formatDateTime,
    formatTime,
    getPageContent,
    getRouteParams,
    renderFooter
  };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
