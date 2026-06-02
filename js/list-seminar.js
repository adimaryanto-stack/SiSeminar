/* ============================================================
   SiSeminar — list-seminar.js
   Participant Seminar Listing & Exploration Module
   ============================================================ */

const ListSeminarPage = (() => {
  let activeTab = 'my-seminars'; // 'my-seminars' or 'available-seminars'

  // ============ Main Render ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    const currentUser = Store.getCurrentUser();
    if (!currentUser) {
      App.navigate('login');
      return;
    }

    // Fetch data
    const allEvents = Store.getEvents().filter(e => e.status === 'active');
    const allRegistrations = Store.getAllRegistrations();
    
    // Filter seminars
    const myRegistrations = allRegistrations.filter(r => r.userId === currentUser.id);
    const myEvents = allEvents.filter(e => myRegistrations.some(r => r.eventId === e.id));
    const availableEvents = allEvents.filter(e => !myRegistrations.some(r => r.eventId === e.id));

    // Calculate stats
    const totalMySeminars = myEvents.length;
    let totalAttended = 0;
    myEvents.forEach(e => {
      const attendance = Store.getAttendance(e.id);
      const isAttended = attendance.some(a => a.userId === currentUser.id);
      if (isAttended) totalAttended++;
    });
    const totalAvailable = availableEvents.length;

    container.innerHTML = `
      <div class="animate-fade-in" style="padding-bottom: var(--space-8);">
        <!-- Page Header -->
        <div class="page-header" style="margin-bottom: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4);">
          <div>
            <h1 class="page-title" style="font-family: var(--font-heading); font-size: 24px; font-weight: 700; color: var(--primary); margin: 0;">
              Direktori Seminar Anda
            </h1>
            <p class="page-subtitle" style="font-size: 14px; color: var(--outline); margin-top: var(--space-1);">
              Lihat jadwal seminar yang diikuti dan temukan program seminar menarik lainnya.
            </p>
          </div>

          <!-- Stats Cards Section -->
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4); margin-top: 4px;">
            <div class="card flex items-center gap-4" style="padding: var(--space-4); background: var(--surface-container-low); border-left: 4px solid var(--teal-accent);">
              <div style="background: rgba(13,148,136,0.1); color: var(--teal-accent); width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 22px;">event_available</span>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: 700; color: var(--primary); line-height: 1.2;">${totalMySeminars}</div>
                <div style="font-size: 11px; color: var(--outline); font-weight: 500;">Seminar Saya</div>
              </div>
            </div>

            <div class="card flex items-center gap-4" style="padding: var(--space-4); background: var(--surface-container-low); border-left: 4px solid var(--primary);">
              <div style="background: rgba(4,47,46,0.1); color: var(--primary); width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 22px;">assignment_turned_in</span>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: 700; color: var(--primary); line-height: 1.2;">${totalAttended}</div>
                <div style="font-size: 11px; color: var(--outline); font-weight: 500;">Sesi Hadir</div>
              </div>
            </div>

            <div class="card flex items-center gap-4" style="padding: var(--space-4); background: var(--surface-container-low); border-left: 4px solid var(--secondary);">
              <div style="background: rgba(13,148,136,0.1); color: var(--primary); width: 42px; height: 42px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined" style="font-size: 22px;">explore</span>
              </div>
              <div>
                <div style="font-size: 20px; font-weight: 700; color: var(--primary); line-height: 1.2;">${totalAvailable}</div>
                <div style="font-size: 11px; color: var(--outline); font-weight: 500;">Seminar Baru</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Navigation Tabs -->
        <div class="tabs-container" style="border-bottom: 1px solid var(--border-subtle); display: flex; gap: var(--space-6); margin-bottom: var(--space-6); padding-left: 4px;">
          <button class="tab-link ${activeTab === 'my-seminars' ? 'active' : ''}" 
                  id="tabMySeminars" 
                  style="background: none; border: none; font-family: var(--font-heading); font-size: 15px; font-weight: 600; padding: var(--space-2) 0 var(--space-3); color: ${activeTab === 'my-seminars' ? 'var(--teal-accent)' : 'var(--outline)'}; border-bottom: 2px solid ${activeTab === 'my-seminars' ? 'var(--teal-accent)' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
            Seminar Saya (${totalMySeminars})
          </button>
          <button class="tab-link ${activeTab === 'available-seminars' ? 'active' : ''}" 
                  id="tabAvailableSeminars" 
                  style="background: none; border: none; font-family: var(--font-heading); font-size: 15px; font-weight: 600; padding: var(--space-2) 0 var(--space-3); color: ${activeTab === 'available-seminars' ? 'var(--teal-accent)' : 'var(--outline)'}; border-bottom: 2px solid ${activeTab === 'available-seminars' ? 'var(--teal-accent)' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
            Jelajahi Seminar (${totalAvailable})
          </button>
        </div>

        <!-- Seminars Content List -->
        <div id="seminarsListContainer">
          ${activeTab === 'my-seminars' ? renderMySeminars(myEvents, currentUser) : renderAvailableSeminars(availableEvents)}
        </div>
      </div>
    `;

    bindEvents();
  }

  // ============ Render My Seminars Tab ============
  function renderMySeminars(events, currentUser) {
    if (events.length === 0) {
      return `
        <div class="empty-state animate-fade-in" style="min-height: 40vh; background: var(--surface-container-lowest); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle); padding: var(--space-10);">
          <span class="material-symbols-outlined" style="font-size: 48px; color: var(--outline);">event_busy</span>
          <h3>Belum Ada Seminar Terdaftar</h3>
          <p>Anda belum terdaftar di seminar manapun saat ini. Temukan seminar menarik di tab "Jelajahi Seminar"!</p>
          <button class="btn btn-primary mt-4" id="btnExploreQuick">
            <span class="material-symbols-outlined">explore</span>
            Jelajahi Seminar
          </button>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-2 gap-6" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
        ${events.map(event => {
          const formattedDate = App.formatDate(event.date);
          const attendance = Store.getAttendance(event.id);
          const isAttended = attendance.some(a => a.userId === currentUser.id);

          // Render Badge Status
          const statusBadge = isAttended 
            ? `<span class="badge badge-success flex items-center gap-1" style="font-size: 11px; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); padding: 2px 8px; border-radius: 20px;">
                <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span> Hadir
               </span>`
            : `<span class="badge badge-info flex items-center gap-1" style="font-size: 11px; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); padding: 2px 8px; border-radius: 20px;">
                <span class="material-symbols-outlined" style="font-size: 14px;">how_to_reg</span> Terdaftar
               </span>`;

          return `
            <div class="card flex flex-col justify-between animate-scale-in" style="padding: var(--space-5); background: var(--surface-container-low); border: 1px solid var(--border-subtle); transition: transform 0.2s, box-shadow 0.2s;">
              <div>
                <div class="flex justify-between items-start gap-4 mb-3">
                  ${statusBadge}
                  <span style="font-family: monospace; font-size: 11px; color: var(--outline); background: var(--surface-container-lowest); padding: 2px 6px; border-radius: var(--radius-sm);">
                    ID: ${event.joinCode || event.id}
                  </span>
                </div>
                
                <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--primary); margin: 0 0 10px; line-height: 1.4;">
                  ${escapeHtml(event.title)}
                </h3>

                <p style="font-size: 13px; color: var(--on-surface-variant); line-height: 1.5; margin-bottom: var(--space-4); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${escapeHtml(event.description || 'Tidak ada deskripsi seminar.')}
                </p>
                
                <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3);">
                  <div class="flex items-center gap-2" style="font-size: 12px; color: var(--outline);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">calendar_month</span>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="flex items-center gap-2" style="font-size: 12px; color: var(--outline);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">location_on</span>
                    <span class="text-truncate" style="max-width: 250px;">${escapeHtml(event.location || 'Online')}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2" style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); width: 100%;">
                <button class="btn btn-outline" onclick="App.navigate('chat')" style="flex: 1; font-size: 12px; height: 36px; padding: 0 8px; justify-content: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 16px;">forum</span>
                  Grup Chat
                </button>
                <button class="btn btn-primary" onclick="App.navigate('checkin-peserta')" style="flex: 1; font-size: 12px; height: 36px; padding: 0 8px; justify-content: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 16px;">qr_code_scanner</span>
                  Check-in QR
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============ Render Available Seminars Tab ============
  function renderAvailableSeminars(events) {
    if (events.length === 0) {
      return `
        <div class="empty-state animate-fade-in" style="min-height: 40vh; background: var(--surface-container-lowest); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle); padding: var(--space-10);">
          <span class="material-symbols-outlined" style="font-size: 48px; color: var(--outline);">explore_off</span>
          <h3>Belum Ada Seminar Baru</h3>
          <p>Saat ini belum ada seminar aktif baru yang tersedia untuk didaftarkan. Tetap pantau halaman ini!</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-2 gap-6" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
        ${events.map(event => {
          const formattedDate = App.formatDate(event.date);

          return `
            <div class="card flex flex-col justify-between animate-scale-in" style="padding: var(--space-5); background: var(--surface-container-low); border: 1px solid var(--border-subtle); transition: transform 0.2s, box-shadow 0.2s;">
              <div>
                <div class="flex justify-between items-start gap-4 mb-3">
                  <span class="badge flex items-center gap-1" style="font-size: 11px; background: rgba(13,148,136,0.1); color: var(--teal-accent); border: 1px solid rgba(13,148,136,0.2); padding: 2px 8px; border-radius: 20px;">
                    <span class="material-symbols-outlined" style="font-size: 14px;">event</span> Seminar Aktif
                  </span>
                  <span style="font-family: monospace; font-size: 11px; color: var(--outline); background: var(--surface-container-lowest); padding: 2px 6px; border-radius: var(--radius-sm);">
                    ID: ${event.joinCode || event.id}
                  </span>
                </div>
                
                <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--primary); margin: 0 0 10px; line-height: 1.4;">
                  ${escapeHtml(event.title)}
                </h3>

                <p style="font-size: 13px; color: var(--on-surface-variant); line-height: 1.5; margin-bottom: var(--space-4); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                  ${escapeHtml(event.description || 'Tidak ada deskripsi seminar.')}
                </p>
                
                <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); border-top: 1px solid var(--border-subtle); padding-top: var(--space-3);">
                  <div class="flex items-center gap-2" style="font-size: 12px; color: var(--outline);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">calendar_month</span>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="flex items-center gap-2" style="font-size: 12px; color: var(--outline);">
                    <span class="material-symbols-outlined" style="font-size: 16px;">location_on</span>
                    <span class="text-truncate" style="max-width: 250px;">${escapeHtml(event.location || 'Online')}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); width: 100%;">
                <button class="btn btn-primary" onclick="App.navigate('register?event=${event.id}')" style="width: 100%; font-size: 13px; height: 38px; justify-content: center; gap: 6px;">
                  <span class="material-symbols-outlined" style="font-size: 18px;">assignment_ind</span>
                  Daftar Seminar
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============ Event Listeners & Binding ============
  function bindEvents() {
    const tabMySeminars = document.getElementById('tabMySeminars');
    const tabAvailableSeminars = document.getElementById('tabAvailableSeminars');
    const btnExploreQuick = document.getElementById('btnExploreQuick');

    if (tabMySeminars) {
      tabMySeminars.addEventListener('click', () => {
        activeTab = 'my-seminars';
        render();
      });
    }

    if (tabAvailableSeminars) {
      tabAvailableSeminars.addEventListener('click', () => {
        activeTab = 'available-seminars';
        render();
      });
    }

    if (btnExploreQuick) {
      btnExploreQuick.addEventListener('click', () => {
        activeTab = 'available-seminars';
        render();
      });
    }
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
