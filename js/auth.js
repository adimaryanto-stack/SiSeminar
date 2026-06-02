/* ============================================================
   SiSeminar — auth.js
   Halaman Login & Register with InsForge Auth & Google OAuth
   ============================================================ */

const AuthPage = (() => {
  let isLoginMode = true;

  function render(container) {
    container.innerHTML = `
      <div class="login-page">
        <div class="login-card animate-scale-in">
          <div class="login-brand">
            <h1>SiSeminar</h1>
            <p>Sistem Informasi Manajemen Seminar</p>
          </div>

          <div class="login-tabs">
            <button class="login-tab ${isLoginMode ? 'active' : ''}" id="tabLogin" onclick="AuthPage.switchTab(true)">Masuk</button>
            <button class="login-tab ${!isLoginMode ? 'active' : ''}" id="tabRegister" onclick="AuthPage.switchTab(false)">Daftar</button>
          </div>

          <div id="authFormContainer">
            ${isLoginMode ? renderLoginForm() : renderRegisterForm()}
          </div>

          <div class="login-divider">atau</div>

          <button class="btn btn-secondary w-full" id="googleBtn" onclick="AuthPage.handleGoogleLogin(event)" style="border: 1px solid var(--border-subtle); background: white; color: var(--on-surface); justify-content: center; display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-4);">
            <svg style="width:18px;height:18px;" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.94 5.94 0 0 1 8 12.571a5.94 5.94 0 0 1 5.99-5.943c1.554 0 2.973.585 4.053 1.542l3.18-3.18C19.263 3.123 16.786 2 13.99 2 8.473 2 4 6.473 4 12c0 5.528 4.473 10 9.99 10 5.753 0 10.01-4.043 10.01-10 0-.663-.075-1.306-.217-1.929h-11.544Z"/></svg>
            Masuk dengan Google
          </button>

          <div class="text-center">
            <p class="text-body-sm text-muted">
              ${isLoginMode 
                ? 'Belum punya akun? <a href="#" onclick="AuthPage.switchTab(false); return false;" style="color: var(--teal-accent); font-weight: 600;">Daftar sekarang</a>'
                : 'Sudah punya akun? <a href="#" onclick="AuthPage.switchTab(true); return false;" style="color: var(--teal-accent); font-weight: 600;">Masuk</a>'
              }
            </p>
          </div>

          <div style="margin-top: var(--space-5); padding-top: var(--space-4); border-top: 1px solid var(--border-subtle);">
            <p class="text-label-sm text-muted text-center mb-2">Akun Demo</p>
            <div style="display:flex; gap: var(--space-2);">
              <button class="btn btn-ghost btn-sm w-full" onclick="AuthPage.fillDemo('admin')" style="border: 1px solid var(--border-subtle);">
                <span class="material-symbols-outlined" style="font-size:16px;">admin_panel_settings</span>
                Admin
              </button>
              <button class="btn btn-ghost btn-sm w-full" onclick="AuthPage.fillDemo('peserta')" style="border: 1px solid var(--border-subtle);">
                <span class="material-symbols-outlined" style="font-size:16px;">person</span>
                Peserta
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderLoginForm() {
    return `
      <form id="loginForm" onsubmit="AuthPage.handleLogin(event)">
        <div class="form-group">
          <label class="form-label">Email atau Nomor WhatsApp</label>
          <div class="phone-input-wrapper">
            <span class="phone-prefix">+62</span>
            <input type="text" id="loginPhone" placeholder="8xx-xxxx-xxxx / email@domain.com" required>
          </div>
          <p class="form-hint">Masukkan nomor (tanpa angka 0) atau alamat email Anda</p>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="loginPassword" placeholder="Masukkan password" required autocomplete="current-password">
        </div>
        <div id="loginError" class="form-error mb-4" style="display:none;"></div>
        <button type="submit" class="btn btn-primary btn-lg w-full" id="loginBtn">
          <span class="material-symbols-outlined">login</span>
          Masuk
        </button>
      </form>
    `;
  }

  function renderRegisterForm() {
    return `
      <form id="registerForm" onsubmit="AuthPage.handleRegister(event)">
        <div class="form-group">
          <label class="form-label">Nama Lengkap <span class="required">*</span></label>
          <input type="text" class="form-input" id="regName" placeholder="Masukkan nama lengkap" required>
        </div>
        <div class="form-group">
          <label class="form-label">Alamat Email <span class="required">*</span></label>
          <input type="email" class="form-input" id="regEmail" placeholder="email@example.com" required>
        </div>
        <div class="form-group">
          <label class="form-label">Nomor WhatsApp <span class="required">*</span></label>
          <div class="phone-input-wrapper">
            <span class="phone-prefix">+62</span>
            <input type="tel" id="regPhone" placeholder="8xx-xxxx-xxxx" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Password <span class="required">*</span></label>
          <input type="password" class="form-input" id="regPassword" placeholder="Minimal 6 karakter" required minlength="6">
        </div>
        <div class="form-group">
          <label class="form-label">Konfirmasi Password <span class="required">*</span></label>
          <input type="password" class="form-input" id="regPasswordConfirm" placeholder="Ulangi password" required minlength="6">
        </div>
        <div id="registerError" class="form-error mb-4" style="display:none;"></div>
        <button type="submit" class="btn btn-primary btn-lg w-full" id="registerBtn">
          <span class="material-symbols-outlined">person_add</span>
          Daftar
        </button>
      </form>
    `;
  }

  function switchTab(loginMode) {
    isLoginMode = loginMode;
    const container = document.getElementById('authFormContainer');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    
    if (tabLogin && tabRegister) {
      tabLogin.classList.toggle('active', loginMode);
      tabRegister.classList.toggle('active', !loginMode);
    }

    if (container) {
      container.innerHTML = loginMode ? renderLoginForm() : renderRegisterForm();
    }

    const app = document.getElementById('app');
    if (app) {
      render(app);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const loginInput = document.getElementById('loginPhone').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    let phone = loginInput;
    if (!loginInput.includes('@')) {
      if (!phone.startsWith('62') && !phone.startsWith('+62') && !phone.startsWith('08') && !phone.startsWith('0')) {
        phone = '62' + phone;
      }
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Memproses...';

    const result = await Store.login(phone, password);
    
    if (result.success) {
      App.showToast(`Selamat datang, ${result.user.name}!`, 'success');
      App.navigate(result.user.role === 'admin' ? 'events' : 'chat');
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">login</span> Masuk';
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phoneInput = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');

    let phone = phoneInput;
    if (!phone.startsWith('62') && !phone.startsWith('+62') && !phone.startsWith('08') && !phone.startsWith('0')) {
      phone = '62' + phone;
    }

    if (password !== passwordConfirm) {
      errorEl.textContent = 'Password dan konfirmasi password tidak cocok';
      errorEl.style.display = 'block';
      return;
    }

    if (password.length < 6) {
      errorEl.textContent = 'Password minimal 6 karakter';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Memproses...';

    const result = await Store.addUser({ name, email, phone, password, role: 'peserta' });
    
    if (result.success) {
      const loginResult = await Store.login(email, password);
      if (loginResult.success) {
        App.showToast(`Akun berhasil dibuat! Selamat datang, ${name}`, 'success');
        App.navigate('chat');
      }
    } else {
      errorEl.textContent = result.error;
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined">person_add</span> Daftar';
    }
  }

  async function handleGoogleLogin(e) {
    e.preventDefault();
    if (!window.insforge) return;
    const btn = document.getElementById('googleBtn');
    btn.disabled = true;
    btn.innerHTML = 'Menghubungkan ke Google...';
    
    const { error } = await window.insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: window.location.origin + '/'
    });
    
    if (error) {
      App.showToast('Gagal masuk dengan Google: ' + error.message, 'error');
      btn.disabled = false;
      btn.innerHTML = 'Masuk dengan Google';
    }
  }

  function fillDemo(role) {
    if (role === 'admin') {
      isLoginMode = true;
      const app = document.getElementById('app');
      render(app);
      setTimeout(() => {
        const phoneInput = document.getElementById('loginPhone');
        const passInput = document.getElementById('loginPassword');
        if (phoneInput) phoneInput.value = '87881527804';
        if (passInput) passInput.value = 'admin123';
      }, 50);
    } else {
      isLoginMode = true;
      const app = document.getElementById('app');
      render(app);
      setTimeout(() => {
        const phoneInput = document.getElementById('loginPhone');
        const passInput = document.getElementById('loginPassword');
        if (phoneInput) phoneInput.value = '8123456789';
        if (passInput) passInput.value = '123456';
      }, 50);
    }
  }

  return {
    render,
    switchTab,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    fillDemo
  };
})();
