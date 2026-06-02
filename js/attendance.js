/* ============================================================
   SiSeminar — attendance.js
   QR Code Attendance & Check-in Page Module
   ============================================================ */

const AttendancePage = (() => {
  let selectedEventId = '';
  let qrScannerInstance = null;

  // ============ A. Admin View ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    const events = Store.getEvents();
    if (!selectedEventId && events.length > 0) {
      selectedEventId = events[0].id;
    }

    const event = selectedEventId ? Store.getEventById(selectedEventId) : null;
    const registrations = selectedEventId ? Store.getRegistrations(selectedEventId) : [];
    const attendance = selectedEventId ? Store.getAttendance(selectedEventId) : [];

    // Calculate stats
    const totalRegistered = registrations.length;
    const totalPresent = attendance.length;
    const percentage = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;

    const eventOptions = events.map(e =>
      `<option value="${e.id}" ${e.id === selectedEventId ? 'selected' : ''}>${escapeHtml(e.title)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8 wrap gap-4">
          <div>
            <h1 class="page-title">Presensi & Check-in</h1>
            <div class="breadcrumbs">
              <span>Dashboard</span>
              <span class="separator">/</span>
              <span class="active">Presensi</span>
            </div>
          </div>
          <select class="form-select" id="attendanceEventSelect" style="width: 280px;">
            <option value="">Pilih Event...</option>
            ${eventOptions}
          </select>
        </div>

        ${!selectedEventId ? `
          <div class="empty-state">
            <span class="material-symbols-outlined" style="font-size: 56px;">qr_code_scanner</span>
            <h3>Pilih Event</h3>
            <p>Silakan pilih salah satu event untuk mengelola presensi.</p>
          </div>
        ` : `
          <!-- Stats Cards -->
          <div class="attendance-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); margin-bottom: var(--space-6);">
            <div class="attendance-stat card">
              <div class="attendance-stat-value text-primary">${totalRegistered}</div>
              <div class="attendance-stat-label">Total Terdaftar</div>
            </div>
            <div class="attendance-stat card">
              <div class="attendance-stat-value text-teal">${totalPresent}</div>
              <div class="attendance-stat-label">Sudah Hadir</div>
            </div>
            <div class="attendance-stat card">
              <div class="attendance-stat-value text-purple">${percentage}%</div>
              <div class="attendance-stat-label">Tingkat Kehadiran</div>
            </div>
          </div>

          <!-- Main content split -->
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: var(--space-6); align-items: start;" class="attendance-grid">
            
            <!-- LEFT: QR Code Generator -->
            <div class="card" style="padding: var(--space-6); text-align: center;">
              <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 600; color: var(--primary); margin-bottom: var(--space-4);">
                QR Code Presensi
              </h3>
              
              <div style="display: flex; justify-content: center; margin-bottom: var(--space-5);">
                <div id="qrcode" class="qr-code-wrapper" style="padding: var(--space-3); background: white; border: 1px solid var(--border-subtle); border-radius: var(--radius-md);"></div>
              </div>

              <!-- Kode Presensi Manual -->
              <div style="background: var(--surface-container-low); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: var(--space-5);">
                <span style="font-size: 11px; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Kode Join Presensi Manual</span>
                <span style="font-size: 22px; font-weight: 800; color: var(--teal-accent); letter-spacing: 2px; font-family: monospace;">${escapeHtml(event.joinCode)}</span>
              </div>

              <div class="flex flex-col gap-2">
                <button class="btn btn-primary" id="btnCopyCheckinLink" style="justify-content: center;">
                  <span class="material-symbols-outlined" style="font-size: 18px;">content_copy</span>
                  Salin Link Check-in
                </button>
                <button class="btn btn-secondary" id="btnPrintQR" style="justify-content: center;">
                  <span class="material-symbols-outlined" style="font-size: 18px;">print</span>
                  Cetak QR Code
                </button>
              </div>
            </div>

            <!-- RIGHT: Attendance Registry -->
            <div class="card" style="padding: var(--space-6);">
              <div class="flex items-center justify-between mb-4">
                <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 600; color: var(--primary);">
                  Daftar Kehadiran Peserta
                </h3>
                <button class="btn btn-secondary btn-sm" id="btnManualCheckin">
                  <span class="material-symbols-outlined" style="font-size: 16px;">check_circle</span>
                  Check-in Manual
                </button>
              </div>

              <div class="table-container" style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                  <thead>
                    <tr style="background: var(--surface-container-low); border-bottom: 1px solid var(--border-subtle);">
                      <th style="padding: 10px; font-size: 12px; font-weight: 600; color: var(--outline);">Nama</th>
                      <th style="padding: 10px; font-size: 12px; font-weight: 600; color: var(--outline);">WhatsApp</th>
                      <th style="padding: 10px; font-size: 12px; font-weight: 600; color: var(--outline);">Metode</th>
                      <th style="padding: 10px; font-size: 12px; font-weight: 600; color: var(--outline);">Waktu Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${attendance.length === 0 ? `
                      <tr>
                        <td colspan="4" style="padding: var(--space-8); text-align: center; color: var(--outline);">
                          Belum ada peserta yang melakukan check-in.
                        </td>
                      </tr>
                    ` : attendance.map((att, idx) => `
                      <tr style="border-bottom: 1px solid var(--border-subtle); background: ${idx % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)'};">
                        <td style="padding: 10px; font-size: 13.5px; font-weight: 600; color: var(--on-surface);">${escapeHtml(att.userName)}</td>
                        <td style="padding: 10px; font-family: monospace; font-size: 13px;">${Store.formatPhone(att.userPhone)}</td>
                        <td style="padding: 10px;">
                          <span class="chip ${att.method === 'manual' ? 'chip-warning' : 'chip-success'}" style="font-size: 10px; padding: 1px 6px;">
                            ${att.method === 'manual' ? 'MANUAL' : 'QR SCAN'}
                          </span>
                        </td>
                        <td style="padding: 10px; font-size: 13px; color: var(--outline);">${App.formatTime(att.checkedInAt)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        `}
      </div>
    `;

    if (selectedEventId && event) {
      // Setup QR Code
      const token = Store.getEventQRToken(selectedEventId);
      const url = `${window.location.origin}${window.location.pathname}#checkin?event=${selectedEventId}&token=${token}`;
      
      const qrEl = document.getElementById('qrcode');
      if (qrEl) {
        qrEl.innerHTML = '';
        new QRCode(qrEl, {
          text: url,
          width: 200,
          height: 200,
          colorDark: "#00236f",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }

      bindAdminEvents(url, registrations, attendance);
    }
  }

  // ============ Admin Event Bindings ============
  function bindAdminEvents(url, registrations, attendance) {
    // Event Selector
    const select = document.getElementById('attendanceEventSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        selectedEventId = e.target.value;
        render();
      });
    }

    // Copy check-in link
    const copyBtn = document.getElementById('btnCopyCheckinLink');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(url);
        App.showToast('Link Check-in berhasil disalin ke clipboard!', 'success');
      });
    }

    // Print QR Code
    const printBtn = document.getElementById('btnPrintQR');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Manual Checkin Modal
    const manualBtn = document.getElementById('btnManualCheckin');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => {
        // Find registered participants who have NOT checked in yet
        const checkedInUserIds = attendance.map(a => a.userId);
        const nonCheckedInList = registrations.filter(r => !checkedInUserIds.includes(r.userId));

        if (nonCheckedInList.length === 0) {
          App.showToast('Semua peserta terdaftar sudah melakukan check-in!', 'info');
          return;
        }

        const options = nonCheckedInList.map(r =>
          `<option value="${r.userId}" data-name="${escapeHtml(r.name)}" data-phone="${escapeHtml(r.phone)}">${escapeHtml(r.name)} (${Store.formatPhone(r.phone)})</option>`
        ).join('');

        const body = `
          <div class="form-group">
            <label class="form-label">Pilih Peserta Terdaftar <span class="required">*</span></label>
            <select class="form-select" id="manualCheckinSelect">
              ${options}
            </select>
          </div>
        `;

        const footer = `
          <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
          <button class="btn btn-primary" id="btnSubmitManualCheckin">
            <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
            Check-in Peserta
          </button>
        `;

        App.showModal('Check-in Manual', body, footer);

        setTimeout(() => {
          const submitBtn = document.getElementById('btnSubmitManualCheckin');
          if (submitBtn) {
            submitBtn.addEventListener('click', () => {
              const sel = document.getElementById('manualCheckinSelect');
              const userId = sel.value;
              const option = sel.options[sel.selectedIndex];
              const userName = option.dataset.name;
              const userPhone = option.dataset.phone;

              Store.addAttendance({
                eventId: selectedEventId,
                userId,
                userName,
                userPhone,
                method: 'manual',
                qrToken: ''
              });

              App.showToast(`Check-in manual untuk ${userName} berhasil!`, 'success');
              App.closeModal();
              render();
            });
          }
        }, 100);
      });
    }
  }

  // ============ B. Public Check-in View ============
  function renderCheckin(eventId, token) {
    const container = App.getPageContent();
    if (!container) return;

    if (!eventId || !token) {
      container.innerHTML = `
        <div class="empty-state animate-fade-in" style="min-height: 60vh;">
          <span class="material-symbols-outlined" style="font-size: 56px;">qr_code_scanner</span>
          <h3>Link Check-in Tidak Valid</h3>
          <p>Silakan scan QR Code check-in resmi di lokasi acara seminar.</p>
        </div>
      `;
      return;
    }

    const event = Store.getEventById(eventId);
    if (!event) {
      container.innerHTML = `
        <div class="empty-state animate-fade-in" style="min-height: 60vh;">
          <span class="material-symbols-outlined" style="font-size: 56px;">event_busy</span>
          <h3>Event Tidak Ditemukan</h3>
          <p>Event yang bersangkutan sudah tidak aktif atau tidak ditemukan.</p>
        </div>
      `;
      return;
    }

    const correctToken = Store.getEventQRToken(eventId);
    if (token !== correctToken) {
      container.innerHTML = `
        <div class="empty-state animate-fade-in" style="min-height: 60vh;">
          <span class="material-symbols-outlined" style="font-size: 56px;">security</span>
          <h3>QR Code Kadaluwarsa / Tidak Valid</h3>
          <p>Silakan minta QR Code check-in yang baru dari panitia.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="participant-container animate-fade-in" style="max-width: 500px; margin: var(--space-12) auto; padding: 0 var(--space-4);">
        <div class="card" style="padding: var(--space-8); box-shadow: var(--shadow-lg); border-top: 6px solid var(--primary);">
          <div style="text-align: center; margin-bottom: var(--space-6);">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: var(--surface-container-low); color: var(--primary); margin-bottom: var(--space-3);">
              <span class="material-symbols-outlined" style="font-size: 32px;">qr_code_2</span>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--primary);">
              Presensi Mandiri Peserta
            </h2>
            <p style="font-size: 13px; color: var(--outline); margin-top: 2px;">
              ${escapeHtml(event.title)}
            </p>
          </div>

          <form id="publicCheckinForm" class="flex flex-col gap-4">
            <div class="form-group">
              <label class="form-label" for="ckPhone">Masukkan Nomor WhatsApp <span class="required">*</span></label>
              <div class="phone-input-wrapper">
                <span class="phone-prefix">+62</span>
                <input type="tel" id="ckPhone" placeholder="8xxxxxxxxxx" required style="height: 42px;">
              </div>
              <p style="font-size: 11px; color: var(--outline); margin-top: 4px;">
                * Gunakan nomor WhatsApp yang Anda gunakan saat mendaftar seminar ini.
              </p>
            </div>

            <button type="submit" class="btn btn-primary btn-lg mt-2" style="justify-content: center; width: 100%;" id="btnSubmitCheckin">
              Lakukan Check-in Kehadiran
              <span class="material-symbols-outlined" style="font-size: 20px;">qr_code_scanner</span>
            </button>
          </form>
        </div>
      </div>
    `;

    bindCheckinEvents(eventId, token);
  }

  // ============ Public Check-in Form Submission ============
  function bindCheckinEvents(eventId, token) {
    const form = document.getElementById('publicCheckinForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneVal = document.getElementById('ckPhone').value.trim();
      if (!phoneVal) return;

      const normalized = Store.normalizePhone(phoneVal);
      const regs = Store.getRegistrations(eventId);

      // Verify participant exists
      const participant = regs.find(r => Store.normalizePhone(r.phone) === normalized);

      if (!participant) {
        App.showToast('Nomor WhatsApp tidak terdaftar di seminar ini! Silakan mendaftar terlebih dahulu.', 'error');
        return;
      }

      // Play success audio
      playCheckinBeep();

      const btnSubmit = document.getElementById('btnSubmitCheckin');
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Memproses Kehadiran...';
      }

      setTimeout(() => {
        // Record attendance
        const res = Store.addAttendance({
          eventId,
          userId: participant.userId,
          userName: participant.name,
          userPhone: participant.phone,
          method: 'qr',
          qrToken: token
        });

        if (!res.success) {
          App.showToast(res.error || 'Anda sudah melakukan check-in!', 'info');
          // Still show checked in screen
        }

        renderCheckinSuccess(participant.name, eventId);
      }, 1000);
    });
  }

  // ============ Check-in Success Animation Screen ============
  function renderCheckinSuccess(name, eventId) {
    const container = App.getPageContent();
    if (!container) return;

    container.innerHTML = `
      <div class="participant-container animate-fade-in" style="max-width: 500px; margin: var(--space-12) auto; padding: 0 var(--space-4);">
        <div class="card" style="padding: var(--space-8); text-align: center; box-shadow: var(--shadow-lg); border-top: 6px solid var(--teal-accent);">
          <div class="checkin-success-icon active" style="width: 80px; height: 80px; background: var(--teal-accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-5); box-shadow: 0 0 20px rgba(13,148,136,0.3);">
            <span class="material-symbols-outlined" style="font-size: 48px;">done</span>
          </div>

          <h2 style="font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--primary); margin-bottom: var(--space-2);">
            Check-in Berhasil!
          </h2>
          <p style="color: var(--on-surface-variant); font-size: 15px; line-height: 1.6; margin-bottom: var(--space-6);">
            Terima kasih <strong>${escapeHtml(name)}</strong>.<br>Kehadiran Anda telah dicatat oleh sistem presensi.
          </p>

          <p style="font-size: 12px; color: var(--outline); background: var(--surface-container-low); padding: 8px 16px; border-radius: var(--radius-full); display: inline-block;">
            Waktu: ${App.formatDateTime(new Date())}
          </p>

          <div style="margin-top: var(--space-8);">
            <a href="#login" class="btn btn-secondary" style="justify-content: center; width: 100%;">
              <span class="material-symbols-outlined">login</span>
              Masuk Portal Seminar Anda
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ============ C. Peserta Check-in View ============
  function renderPesertaCheckin() {
    const container = App.getPageContent();
    if (!container) return;

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 600px; margin: 0 auto;">
        <!-- Page Header -->
        <div class="mb-6">
          <h1 class="page-title">Pindai QR Presensi</h1>
          <p style="color: var(--outline); font-size: 13.5px; margin-top: 2px;">
            Gunakan kamera Anda untuk memindai QR Code presensi di lokasi seminar.
          </p>
        </div>

        <div class="card" style="padding: var(--space-6); text-align: center;">
          
          <!-- Scanner Camera Box -->
          <div id="scannerWrapper" style="background: #000; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-4); max-width: 400px; margin-left: auto; margin-right: auto; aspect-ratio: 1; position: relative;">
            <div id="reader" style="width: 100%; height: 100%; border: none;"></div>
            <div id="scannerPlaceholder" style="position: absolute; top:0; left:0; width:100%; height:100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: rgba(255,255,255,0.7); z-index: 10;">
              <span class="material-symbols-outlined" style="font-size: 56px; animation: pulse 2s infinite;">qr_code_scanner</span>
              <p style="font-size: 13px; margin-top: var(--space-2);">Kamera belum diaktifkan</p>
            </div>
          </div>

          <div class="flex justify-center gap-3">
            <button class="btn btn-primary" id="btnStartScanner">
              <span class="material-symbols-outlined">videocam</span>
              Aktifkan Kamera
            </button>
            <button class="btn btn-secondary" id="btnStopScanner" disabled>
              <span class="material-symbols-outlined">videocam_off</span>
              Matikan
            </button>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); margin-top: var(--space-6); padding-top: var(--space-5);">
            <p style="font-size: 13px; color: var(--outline); font-weight: 500; margin-bottom: var(--space-3);">
              Atau masukkan kode join presensi manual:
            </p>
            <div class="flex gap-2 justify-center">
              <input type="text" class="form-input" id="manualJoinCodeInput" placeholder="Contoh: SEM24A" style="width: 160px; height: 38px; text-align: center; text-transform: uppercase; font-weight: 600; font-size: 15px;">
              <button class="btn btn-primary" id="btnSubmitManualCode" style="height: 38px;">Check-in</button>
            </div>
          </div>

        </div>
      </div>
    `;

    bindPesertaEvents();
  }

  // ============ Peserta Event Bindings ============
  function bindPesertaEvents() {
    const startBtn = document.getElementById('btnStartScanner');
    const stopBtn = document.getElementById('btnStopScanner');
    const manualBtn = document.getElementById('btnSubmitManualCode');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const placeholder = document.getElementById('scannerPlaceholder');
        if (placeholder) placeholder.style.display = 'none';

        startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        // Initialize HTML5 QR Scanner
        qrScannerInstance = new Html5Qrcode("reader");
        qrScannerInstance.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // QR Code Scanned successfully!
            handleQRScanned(decodedText);
          },
          () => {
            // Scan fail/searching
          }
        ).catch(() => {
          App.showToast('Gagal mengakses kamera. Mohon berikan izin kamera!', 'error');
          startBtn.disabled = false;
          if (stopBtn) stopBtn.disabled = true;
          if (placeholder) placeholder.style.display = 'flex';
        });
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        stopScanner();
      });
    }

    if (manualBtn) {
      manualBtn.addEventListener('click', () => {
        const codeVal = document.getElementById('manualJoinCodeInput').value.trim().toUpperCase();
        if (!codeVal) return;

        // Check if join code matches any active event
        const events = Store.getEvents();
        const event = events.find(e => e.joinCode === codeVal);

        if (!event) {
          App.showToast('Kode Join Presensi tidak ditemukan!', 'error');
          return;
        }

        const user = Store.getCurrentUser();
        playCheckinBeep();

        const res = Store.addAttendance({
          eventId: event.id,
          userId: user.id,
          userName: user.name,
          userPhone: user.phone,
          method: 'manual',
          qrToken: ''
        });

        if (res.success) {
          App.showToast('Presensi berhasil via kode join!', 'success');
        } else {
          App.showToast(res.error || 'Anda sudah terdaftar hadir!', 'info');
        }

        // Show successful checkin view in content
        renderCheckinSuccess(user.name, event.id);
      });
    }
  }

  // ============ Stop QR Camera ============
  function stopScanner() {
    if (qrScannerInstance) {
      qrScannerInstance.stop().then(() => {
        qrScannerInstance = null;
        const startBtn = document.getElementById('btnStartScanner');
        const stopBtn = document.getElementById('btnStopScanner');
        const placeholder = document.getElementById('scannerPlaceholder');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (placeholder) placeholder.style.display = 'flex';
      }).catch(() => {});
    }
  }

  // ============ QR Scanner Result Handler ============
  function handleQRScanned(text) {
    stopScanner();

    // Parse URL e.g. #checkin?event=xxx&token=yyy
    try {
      const hash = text.split('#')[1];
      if (!hash || !hash.startsWith('checkin?')) {
        throw new Error();
      }

      const queryStr = hash.split('?')[1];
      const params = {};
      queryStr.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[k] = v;
      });

      const eventId = params.event;
      const token = params.token;

      if (!eventId || !token) throw new Error();

      const event = Store.getEventById(eventId);
      const correctToken = Store.getEventQRToken(eventId);

      if (!event || token !== correctToken) {
        App.showToast('Kode QR presensi tidak valid atau kadaluwarsa!', 'error');
        return;
      }

      const user = Store.getCurrentUser();
      playCheckinBeep();

      const res = Store.addAttendance({
        eventId,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        method: 'qr',
        qrToken: token
      });

      if (res.success) {
        App.showToast('Presensi via Scan QR Berhasil!', 'success');
      } else {
        App.showToast(res.error || 'Anda sudah terdaftar hadir!', 'info');
      }

      renderCheckinSuccess(user.name, eventId);

    } catch (e) {
      App.showToast('Format QR Code tidak valid!', 'error');
      // Re-enable start
      const startBtn = document.getElementById('btnStartScanner');
      if (startBtn) startBtn.click();
    }
  }

  // ============ Check-in Beep Feedback ============
  function playCheckinBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 Beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {}
  }

  // ============ Utilities ============
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    render,
    renderCheckin,
    renderPesertaCheckin
  };
})();
