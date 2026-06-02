/* ============================================================
   SiSeminar — registration.js
   Participant Registration Public Page Module
   ============================================================ */

const RegistrationPage = (() => {
  let selectedEvent = null;
  let formFields = [];

  // ============ Main Render ============
  function render(eventId) {
    const container = App.getPageContent();
    if (!container) return;

    if (!eventId) {
      container.innerHTML = `
        <div class="empty-state animate-fade-in" style="min-height: 60vh;">
          <span class="material-symbols-outlined" style="font-size: 56px;">link_off</span>
          <h3>Link Registrasi Tidak Valid</h3>
          <p>Silakan gunakan tautan registrasi event resmi dari panitia SiSeminar.</p>
          <a href="#login" class="btn btn-primary mt-4">Kembali Ke Login</a>
        </div>
      `;
      return;
    }

    selectedEvent = Store.getEventById(eventId);
    if (!selectedEvent) {
      container.innerHTML = `
        <div class="empty-state animate-fade-in" style="min-height: 60vh;">
          <span class="material-symbols-outlined" style="font-size: 56px;">event_busy</span>
          <h3>Event Tidak Ditemukan</h3>
          <p>Event yang Anda cari tidak ada atau sudah dihapus.</p>
          <a href="#login" class="btn btn-primary mt-4">Kembali Ke Login</a>
        </div>
      `;
      return;
    }

    formFields = Store.getFormFields(eventId);

    // Ensure Nama Lengkap and Nomor WhatsApp fields always exist to prevent broken registration flow
    const hasPhone = formFields.some(f => f.fieldType === 'text' && /whatsapp|(?:\b|_)wa(?:\b|_)|telepon|telp|telpon|phone|hp|kontak/i.test(f.label));
    const hasName = formFields.some(f => f.fieldType === 'text' && /nama|name/i.test(f.label));

    if (!hasPhone) {
      formFields.unshift({
        id: 'default_whatsapp',
        eventId: eventId,
        label: 'Nomor WhatsApp',
        fieldType: 'text',
        isRequired: true,
        placeholder: '8xxxxxxxxxx',
        orderIndex: -1
      });
    }

    if (!hasName) {
      formFields.unshift({
        id: 'default_name',
        eventId: eventId,
        label: 'Nama Lengkap',
        fieldType: 'text',
        isRequired: true,
        placeholder: 'Masukkan nama lengkap Anda',
        orderIndex: -2
      });
    }

    const formattedDate = App.formatDate(selectedEvent.date);

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="material-symbols-outlined" style="font-size: 16px;">calendar_month</span>
              ${formattedDate}
            </div>
            <h1 class="hero-title">${escapeHtml(selectedEvent.title)}</h1>
            <p class="hero-subtitle mb-4">
              <span class="material-symbols-outlined text-teal" style="font-size: 18px; vertical-align: middle; margin-right: 4px;">location_on</span>
              ${escapeHtml(selectedEvent.location || 'Online')}
            </p>
            <p class="hero-subtitle">${escapeHtml(selectedEvent.description || 'Pendaftaran Seminar Resmi')}</p>
          </div>
        </section>

        <!-- Registration Container -->
        <div class="participant-container" style="max-width: 700px; margin: 0 auto; padding: 0 var(--space-4) var(--space-12);">
          <div class="registration-card animate-scale-in">
            <div class="registration-card-title">
              <h2 style="font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--primary);">
                Form Registrasi Peserta
              </h2>
            </div>
            
            <form id="registrationForm" class="flex flex-col gap-5 mt-6">
              <div class="grid grid-cols-2 gap-4" style="grid-template-columns: 1fr 1fr;" id="formFieldsGrid">
                ${formFields.map(field => renderField(field)).join('')}
              </div>

              <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-5); display: flex; flex-direction: column; gap: 4px;">
                <p style="font-size: 12px; color: var(--outline);">* Kolom bertanda bintang merah wajib diisi.</p>
                <p style="font-size: 12px; color: var(--outline);">* Nomor WhatsApp Anda akan otomatis digunakan sebagai akun login portal seminar.</p>
              </div>

              <button type="submit" class="btn btn-primary btn-lg mt-4" style="justify-content: center; width: 100%;" id="btnSubmitRegistration">
                Selesaikan Pendaftaran
                <span class="material-symbols-outlined" style="font-size: 20px;">arrow_forward</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  // ============ Render Dynamic Input Fields ============
  function renderField(field) {
    const isRequired = field.isRequired;
    const requiredAsterisk = isRequired ? '<span class="required" style="color:var(--destructive-red);">*</span>' : '';
    const requiredAttr = isRequired ? 'required' : '';
    
    let isFullWidth = field.fieldType === 'checkbox';
    let colSpan = isFullWidth ? 'grid-column: span 2;' : '';

    let inputHtml = '';
    if (field.fieldType === 'text') {
      const isPhone = /whatsapp|(?:\b|_)wa(?:\b|_)|telepon|telp|telpon|phone|hp|kontak/i.test(field.label);
      
      if (isPhone) {
        inputHtml = `
          <div class="phone-input-wrapper">
            <span class="phone-prefix">+62</span>
            <input type="tel" class="form-input-phone" 
                   data-id="${field.id}" 
                   data-label="${escapeHtml(field.label)}" 
                   placeholder="8xxxxxxxxxx" 
                   ${requiredAttr} 
                   style="height: 42px;">
          </div>
        `;
      } else {
        inputHtml = `
          <input type="text" class="form-input dynamic-input" 
                 data-id="${field.id}" 
                 data-label="${escapeHtml(field.label)}" 
                 placeholder="${escapeHtml(field.placeholder || 'Masukkan ' + field.label)}" 
                 ${requiredAttr}>
        `;
      }
    } else if (field.fieldType === 'number') {
      inputHtml = `
        <input type="number" class="form-input dynamic-input" 
               data-id="${field.id}" 
               data-label="${escapeHtml(field.label)}" 
               placeholder="${escapeHtml(field.placeholder || 'Masukkan angka...')}" 
               ${requiredAttr}>
      `;
    } else if (field.fieldType === 'dropdown') {
      inputHtml = `
        <select class="form-select dynamic-input" 
                data-id="${field.id}" 
                data-label="${escapeHtml(field.label)}" 
                ${requiredAttr}>
          <option value="">${escapeHtml(field.placeholder || 'Pilih salah satu...')}</option>
          ${field.options.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
        </select>
      `;
    } else if (field.fieldType === 'checkbox') {
      inputHtml = `
        <div class="consent-box" style="padding: var(--space-4); background: var(--surface-container-low); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-top: 4px;">
          <label class="checkbox-wrapper" style="align-items: flex-start;">
            <input type="checkbox" class="dynamic-input-checkbox" 
                   data-id="${field.id}" 
                   data-label="${escapeHtml(field.label)}" 
                   ${requiredAttr} 
                   style="width: 22px; height: 22px; accent-color: var(--teal-accent);">
            <span class="checkbox-label" style="font-size: 13px; line-height: 1.5; color: var(--on-surface-variant);">
              ${escapeHtml(field.placeholder || 'Saya memberikan izin persetujuan data.')} ${requiredAsterisk}
            </span>
          </label>
        </div>
      `;
    }

    return `
      <div class="form-group animate-slide-up" style="${colSpan}">
        <label class="form-label">${escapeHtml(field.label)} ${requiredAsterisk}</label>
        ${inputHtml}
        <div class="form-error" id="err-${field.id}" style="display: none;">Kolom ini wajib diisi!</div>
      </div>
    `;
  }

  // ============ Form Event Bindings ============
  function bindEvents() {
    const form = document.getElementById('registrationForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit();
    });
  }

  // ============ Handle Registration Submit ============
  function handleFormSubmit() {
    let isValid = true;
    const responses = [];
    let participantName = '';
    let participantPhone = '';

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');

    // Gather and validate responses
    formFields.forEach(field => {
      const fieldId = field.id;
      const isRequired = field.isRequired;
      let val = '';
      let errEl = document.getElementById(`err-${fieldId}`);

      const isPhone = /whatsapp|(?:\b|_)wa(?:\b|_)|telepon|telp|telpon|phone|hp|kontak/i.test(field.label);

      if (field.fieldType === 'checkbox') {
        const chk = document.querySelector(`.dynamic-input-checkbox[data-id="${fieldId}"]`);
        if (chk) {
          val = chk.checked ? 'Setuju' : '';
          if (isRequired && !chk.checked) {
            isValid = false;
            if (errEl) {
              errEl.textContent = 'Anda harus menyetujui persyaratan ini!';
              errEl.style.display = 'block';
            }
          }
        }
      } else if (isPhone) {
        const phInput = document.querySelector(`.form-input-phone[data-id="${fieldId}"]`);
        if (phInput) {
          val = phInput.value.trim();
          if (isRequired && !val) {
            isValid = false;
            if (errEl) errEl.style.display = 'block';
          } else if (val) {
            // Normalize phone
            const normalized = Store.normalizePhone(val);
            if (normalized.length < 9) {
              isValid = false;
              if (errEl) {
                errEl.textContent = 'Format nomor WhatsApp tidak valid!';
                errEl.style.display = 'block';
              }
            } else {
              val = normalized;
              participantPhone = normalized;
            }
          }
        }
      } else {
        const input = document.querySelector(`.dynamic-input[data-id="${fieldId}"]`);
        if (input) {
          val = input.value.trim();
          if (isRequired && !val) {
            isValid = false;
            if (errEl) errEl.style.display = 'block';
          }
          
          if (/nama|name/i.test(field.label) || !participantName) {
            if (!participantName) participantName = val;
          }
        }
      }

      responses.push({
        label: field.label,
        value: val
      });
    });

    if (!isValid) {
      App.showToast('Mohon periksa kembali form pendaftaran Anda!', 'error');
      return;
    }

    // Safety check for critical fields
    if (!participantName) {
      participantName = responses[0]?.value || 'Peserta';
    }
    if (!participantPhone) {
      // Find any response that might look like a phone number
      const phoneRes = responses.find(r => /whatsapp|(?:\b|_)wa(?:\b|_)|telepon|telp|telpon|phone|hp|kontak/i.test(r.label));
      if (phoneRes) {
        participantPhone = Store.normalizePhone(phoneRes.value);
      } else {
        App.showToast('Kolom Nomor WhatsApp wajib ada dan diisi!', 'error');
        return;
      }
    }

    // 3-Phase Animation: Processing... -> Success! -> Show Account Info & Auto-login
    const btnSubmit = document.getElementById('btnSubmitRegistration');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `
        <span class="spinner" style="border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; width: 18px; height: 18px; display: inline-block; animation: spin 1s linear infinite; margin-right: 8px;"></span>
        Memproses Pendaftaran...
      `;
    }

    setTimeout(() => {
      // 1. Create Peserta User Account
      const userRes = Store.addUser({
        name: participantName,
        phone: participantPhone,
        password: '123456',
        role: 'peserta'
      });

      // Account might already exist, get user id
      let userId = '';
      if (userRes.success) {
        userId = userRes.user.id;
      } else {
        const existingUser = Store.getUserByPhone(participantPhone);
        if (existingUser) {
          userId = existingUser.id;
        } else {
          App.showToast('Gagal membuat akun peserta.', 'error');
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `Selesaikan Pendaftaran <span class="material-symbols-outlined" style="font-size:20px;">arrow_forward</span>`;
          }
          return;
        }
      }

      // 2. Add Event Registration
      const regRes = Store.addRegistration({
        eventId: selectedEvent.id,
        userId: userId,
        name: participantName,
        phone: participantPhone,
        responses: responses
      });

      if (!regRes.success) {
        App.showToast(regRes.error || 'Anda sudah terdaftar untuk event ini!', 'error');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `Selesaikan Pendaftaran <span class="material-symbols-outlined" style="font-size:20px;">arrow_forward</span>`;
        }
        return;
      }

      // 3. Render Success View
      renderSuccessScreen(participantName, participantPhone);

    }, 1500);
  }

  // ============ Render Beautiful Success Screen ============
  function renderSuccessScreen(name, phone) {
    const container = App.getPageContent();
    if (!container) return;

    // Auto-login registered participant
    Store.login(phone, '123456');

    container.innerHTML = `
      <div class="participant-container animate-fade-in" style="max-width: 600px; margin: var(--space-12) auto; padding: 0 var(--space-4);">
        <div class="card" style="padding: var(--space-10); text-align: center; box-shadow: var(--shadow-lg); border-top: 6px solid var(--teal-accent);">
          <div class="checkin-success-icon" style="background: var(--teal-accent); color: white; width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-6); box-shadow: 0 0 20px rgba(13,148,136,0.3);">
            <span class="material-symbols-outlined" style="font-size: 40px;">check_circle</span>
          </div>

          <h2 style="font-family: var(--font-heading); font-size: 26px; font-weight: 700; color: var(--primary); margin-bottom: var(--space-2);">
            Pendaftaran Berhasil!
          </h2>
          <p style="color: var(--on-surface-variant); font-size: 15px; margin-bottom: var(--space-8);">
            Selamat <strong>${escapeHtml(name)}</strong>, Anda resmi terdaftar sebagai peserta seminar:<br>
            <span style="font-weight: 600; color: var(--on-surface);">${escapeHtml(selectedEvent.title)}</span>
          </p>

          <!-- Account Details Box -->
          <div style="background: var(--surface-container-low); padding: var(--space-5); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); text-align: left; margin-bottom: var(--space-8);" class="animate-scale-in">
            <h4 style="font-family: var(--font-heading); font-size: 14px; font-weight: 600; color: var(--primary); margin-bottom: var(--space-3); border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span class="material-symbols-outlined" style="font-size: 18px;">vpn_key</span>
              AKUN PORTAL SEMINAR ANDA
            </h4>
            <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: 13px;">
              <div><strong>Username / WhatsApp:</strong> <span style="font-family: monospace; font-size: 14px; color: var(--primary); font-weight: 600;">+62 ${escapeHtml(phone.substring(2))}</span></div>
              <div><strong>Password Default:</strong> <span style="font-family: monospace; font-size: 14px; color: var(--primary); font-weight: 600;">123456</span></div>
              <p style="color: var(--outline); font-size: 11px; margin-top: 4px; line-height: 1.4;">
                * Gunakan nomor WhatsApp dan password di atas untuk masuk kembali ke portal kapan saja. Anda telah otomatis tergabung ke grup chat WhatsApp koordinasi seminar.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-3">
            <a href="#chat" class="btn btn-primary btn-lg" style="justify-content: center; width: 100%;">
              <span class="material-symbols-outlined" style="font-size: 20px;">forum</span>
              Masuk ke Chat Grup WhatsApp
            </a>
            <p style="font-size: 12px; color: var(--outline); margin-top: 8px;">
              Menghubungkan Anda ke chat room dalam 3 detik...
            </p>
          </div>
        </div>
      </div>
    `;

    // Audio-visual feedback
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {}

    // Auto-redirect to chat after 4 seconds
    setTimeout(() => {
      window.location.hash = '#chat';
      // Force layout update
      window.location.reload();
    }, 4000);
  }

  // ============ Utilities ============
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    render
  };
})();
