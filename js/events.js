/* ============================================================
   SiSeminar — events.js
   Event Management Page Module (Admin Panel)
   ============================================================ */

const EventsPage = (() => {
  let currentFilter = 'all'; // all, active, draft
  let currentSort = 'newest'; // newest, oldest
  let displayCount = 6;

  // ============ Main Render ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    const events = getFilteredAndSortedEvents();
    const stats = calculateStats();

    container.innerHTML = `
      <div class="animate-fade-in" style="padding-bottom: var(--space-10);">
        <!-- Page Header -->
        <div class="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <nav class="flex items-center gap-2 text-[12px] font-medium text-outline mb-1">
              <span>Management</span>
              <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-primary font-bold">Events</span>
            </nav>
            <h2 class="font-bold text-3xl font-heading text-on-surface" style="margin: 0;">Manajemen Event</h2>
            <p class="text-on-surface-variant text-[14px] mt-1" style="margin: 0;">Kelola, pantau, dan organisasikan semua event seminar & webinar Anda.</p>
          </div>
          <button class="bg-teal-accent hover:bg-secondary text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 border-0 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95" id="btnCreateEvent">
            <span class="material-symbols-outlined">add</span>
            Create New Event
          </button>
        </div>

        <!-- Dashboard Stats Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between" style="transition: transform 0.2s, box-shadow 0.2s;">
            <div class="flex items-center justify-between mb-4">
              <span class="text-on-surface-variant font-semibold text-[12px] uppercase tracking-wider">Seminar & Webinar Aktif</span>
              <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <span class="material-symbols-outlined" style="font-size: 20px;">calendar_today</span>
              </div>
            </div>
            <div class="text-3xl font-bold font-heading text-on-surface">${stats.activeEvents}</div>
            <div class="mt-2 text-outline text-[12px]">Dari total ${stats.totalEvents} event terdaftar</div>
          </div>

          <div class="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between" style="transition: transform 0.2s, box-shadow 0.2s;">
            <div class="flex items-center justify-between mb-4">
              <span class="text-on-surface-variant font-semibold text-[12px] uppercase tracking-wider">Total Peserta Terdaftar</span>
              <div class="w-8 h-8 bg-secondary/15 rounded-lg flex items-center justify-center text-secondary">
                <span class="material-symbols-outlined" style="font-size: 20px;">groups</span>
              </div>
            </div>
            <div class="text-3xl font-bold font-heading text-on-surface">${stats.totalParticipants.toLocaleString()}</div>
            <div class="mt-2 text-success-green text-[12px] font-semibold flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">trending_up</span>
              Aktif berpartisipasi
            </div>
          </div>

          <div class="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between" style="transition: transform 0.2s, box-shadow 0.2s;">
            <div class="flex items-center justify-between mb-4">
              <span class="text-on-surface-variant font-semibold text-[12px] uppercase tracking-wider">Avg. Engagement</span>
              <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <span class="material-symbols-outlined" style="font-size: 20px;">bar_chart</span>
              </div>
            </div>
            <div class="text-3xl font-bold font-heading text-on-surface">${stats.avgAttendance}%</div>
            <div class="mt-2 text-outline text-[12px]">Tingkat kehadiran presensi</div>
          </div>

          <div class="bg-surface-container-lowest p-6 rounded-xl border border-border-subtle flex flex-col justify-between" style="transition: transform 0.2s, box-shadow 0.2s;">
            <div class="flex items-center justify-between mb-4">
              <span class="text-on-surface-variant font-semibold text-[12px] uppercase tracking-wider">Event Mendatang</span>
              <div class="w-8 h-8 bg-success-green/10 rounded-lg flex items-center justify-center text-success-green">
                <span class="material-symbols-outlined" style="font-size: 20px;">event_upcoming</span>
              </div>
            </div>
            <div class="text-3xl font-bold font-heading text-on-surface">${stats.upcomingEvents}</div>
            <div class="mt-2 text-outline text-[12px]">Menunggu pelaksanaan</div>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <button class="bg-primary text-white text-[13px] font-semibold px-4 py-2 rounded-lg flex items-center gap-2 border-0 cursor-default">
              <span class="material-symbols-outlined text-[18px]">filter_list</span>
              Filters Status:
            </button>
            <div class="flex gap-2">
              <button class="px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-colors ${currentFilter === 'all' ? 'bg-teal-accent border-teal-accent text-white font-bold' : 'bg-surface-container-low border-border-subtle text-on-surface hover:bg-surface-container-high'}" data-filter="all">Semua</button>
              <button class="px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-colors ${currentFilter === 'active' ? 'bg-teal-accent border-teal-accent text-white font-bold' : 'bg-surface-container-low border-border-subtle text-on-surface hover:bg-surface-container-high'}" data-filter="active">Aktif</button>
              <button class="px-4 py-2 rounded-lg text-[13px] font-semibold cursor-pointer border transition-colors ${currentFilter === 'draft' ? 'bg-teal-accent border-teal-accent text-white font-bold' : 'bg-surface-container-low border-border-subtle text-on-surface hover:bg-surface-container-high'}" data-filter="draft">Draft</button>
            </div>
          </div>
          <div class="flex items-center gap-2 text-[13px] font-semibold text-on-surface-variant">
            <span>Sort by:</span>
            <select class="bg-transparent border-0 font-bold py-0 pr-8 text-primary cursor-pointer focus:ring-0" id="sortEvents" style="outline: none;">
              <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Terbaru Dibuat</option>
              <option value="oldest" ${currentSort === 'oldest' ? 'selected' : ''}>Terlama Dibuat</option>
              <option value="dateAsc" ${currentSort === 'dateAsc' ? 'selected' : ''}>Tanggal Terdekat</option>
            </select>
          </div>
        </div>

        <!-- Event Cards Bento Grid -->
        ${events.length === 0 ? `
          <div class="empty-state card" style="padding: var(--space-12);">
            <span class="material-symbols-outlined" style="font-size: 48px; color: var(--outline);">event_busy</span>
            <h3>Tidak Ada Event Ditemukan</h3>
            <p>Silakan buat event baru untuk memulai pengisian.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" id="eventsGrid">
            ${events.slice(0, displayCount).map((event, idx) => renderEventCard(event, idx)).join('')}
          </div>

          ${events.length > displayCount ? `
            <div class="mt-12 flex flex-col items-center gap-4">
              <button class="px-8 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95 cursor-pointer bg-transparent" id="btnLoadMore">
                Load More Events
              </button>
              <p class="text-on-surface-variant text-[12px] font-medium">Menampilkan ${Math.min(displayCount, events.length)} dari ${events.length} event terdaftar</p>
            </div>
          ` : ''}
        `}
      </div>
    `;

    bindEvents();
  }

  // ============ Render Single Event Card ============
  function renderEventCard(event, idx) {
    const statusBadges = {
      active: '<span class="bg-success-green/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight">Active</span>',
      draft: '<span class="bg-primary/95 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight">Draft</span>',
      full: '<span class="bg-destructive-red/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight">Full</span>'
    };

    // Cyclic vibrant gradient cover images (simulating professional summits)
    const covers = [
      'https://lh3.googleusercontent.com/aida/AP1WRLsOMq_Wi_-xWShXDqbahGXkGuUb7Bzsza_CftXHUGaLtuvXgvLYZlt1Do6QasHdWwASTi1pZWmgjttuPe-iELXbO6lrSFld3pVmGbAcgrEuiKwch1sp9He-s5As3O2NSJVb8EFZjAMaC5CM2cPHD0b3ElftPNxCjfChbCaezWUs8vhrF952pFykcx0naHyO2HSfboV-DPq3Uk_wL0-ZYQ__xkr5e9mJkxIPeWI2OeBtE5VQAYQclxMF_nI',
      'https://lh3.googleusercontent.com/aida/AP1WRLvrxEyfzQTGuAiTCAkEBIL93P_ijDfmUQbSucvyQkbG0IyCQTNx71Fs8RBDNSk3ppwI8zP7DFDvTDPx-tvytb84kaasOMjEDosfPTl3TYz4lWXSB8VsAa32rxXbKuFSO9qDhudcvIYC1CRSjrPtZND5AfEdFuM7lHR2CNO7Vc-snJFyZadX4ji11BkeyQQVEMzyL-LSOnATSz0-RpzF8qE6erbxVZm2ADKVJee0oWrjSffUzmTf4WEn8tE',
      'https://lh3.googleusercontent.com/aida/AP1WRLsYNkkTtO_sZe2jGu2ls_l0jY4xaeEfQeEUGbyglsA4DeCgGahzTX4V3MkTBBD-NcrV5vVPtd1iO-LckFQ7z_rXLyySI238wxTukr-azqQITHZAlfE0L5hyIS05IZrdCuszf-Tscts13h8bGjQnp0UCkI-TNkVBF_etJ7SIFEBJ7EB9qbLTVS3V2po31xcJHNuPBP6-usbFTuw124yyHfrgpLmfuWvfHdrwbQmzOndLiGjaYVI23Rk_mG8'
    ];
    const coverUrl = event.coverImage || covers[idx % covers.length];

    const formattedDate = App.formatDate(event.date);
    const categoryLabel = event.category === 'Webinar' ? 'WEBINAR' : 'SEMINAR';
    const categoryColorClass = event.category === 'Webinar' ? 'text-teal-accent' : 'text-primary';

    return `
      <article class="group bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden hover:border-teal-accent transition-all hover:shadow-xl hover:-translate-y-1 animate-scale-in" style="animation-delay: ${idx * 0.05}s;">
        <!-- Card Cover Banner -->
        <div class="aspect-video relative overflow-hidden" style="height: 180px;">
          <img alt="${escapeHtml(event.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="${coverUrl}" />
          <div class="absolute top-4 left-4">
            ${statusBadges[event.status] || statusBadges.draft}
          </div>
          <div class="absolute bottom-4 right-4">
            <span class="bg-white/90 backdrop-blur-md text-primary font-bold px-3 py-1 rounded-lg text-[12px] shadow-sm flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">groups</span>
              ${event.participantCount || 0} Registered
            </span>
          </div>
          <div class="absolute bottom-4 left-4 bg-black/40 text-white font-bold px-2 py-0.5 rounded text-[11px] backdrop-filter blur-[2px] flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px]">key</span>
            Code: ${event.joinCode}
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-6">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-1.5 text-[12px] font-semibold text-outline">
              <span class="material-symbols-outlined text-[16px]">calendar_today</span>
              <span>${formattedDate}</span>
            </div>
            <span class="text-[11px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-surface-container-low ${categoryColorClass}">
              ${categoryLabel}
            </span>
          </div>

          <h3 class="font-bold font-heading text-lg text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2 h-[56px] leading-tight" title="${escapeHtml(event.title)}">
            ${escapeHtml(event.title)}
          </h3>

          <div class="flex items-center gap-1 text-[13px] text-on-surface-variant mb-6 line-clamp-1">
            <span class="material-symbols-outlined text-[16px] text-teal-accent">location_on</span>
            <span>${escapeHtml(event.location || 'Online')}</span>
          </div>

          <!-- Card Actions (Premium Layout) -->
          <div class="flex items-center justify-between pt-4 border-t border-border-subtle">
            <div class="flex gap-1.5">
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-primary hover:text-white hover:border-primary transition-all cursor-pointer btn-edit-event" data-id="${event.id}" title="Ubah Detail Event">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-secondary hover:text-white hover:border-secondary transition-all cursor-pointer btn-view-participants" data-id="${event.id}" title="Data Peserta & Spreadsheet">
                <span class="material-symbols-outlined text-[18px]">diversity_3</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-teal-accent hover:text-white hover:border-teal-accent transition-all cursor-pointer btn-builder" data-id="${event.id}" title="Desain Form Registrasi">
                <span class="material-symbols-outlined text-[18px]">dynamic_form</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all cursor-pointer btn-broadcast-event" data-id="${event.id}" data-title="${escapeHtml(event.title)}" title="Kirim Broadcast Announcement">
                <span class="material-symbols-outlined text-[18px]">campaign</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all cursor-pointer btn-q-builder" data-id="${event.id}" title="Ubah Kuesioner Evaluasi">
                <span class="material-symbols-outlined text-[18px]">settings_suggest</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all cursor-pointer btn-q-results" data-id="${event.id}" title="Visualisasi Hasil Feedback">
                <span class="material-symbols-outlined text-[18px]">insights</span>
              </button>
              <button class="w-8 h-8 flex items-center justify-center border border-border-subtle rounded-lg text-outline bg-transparent hover:bg-destructive-red hover:text-white hover:border-destructive-red transition-all cursor-pointer btn-delete-event" data-id="${event.id}" data-title="${escapeHtml(event.title)}" title="Hapus Event secara Permanen">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
            
            <a href="#register?event=${event.id}" target="_blank" class="text-primary font-bold text-[12px] flex items-center gap-0.5 hover:underline" style="text-decoration: none;">
              Register <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  // ============ Event Bindings ============
  function bindEvents() {
    // Filter chips
    document.querySelectorAll('button[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        render();
      });
    });

    // Sort selector
    const sortSel = document.getElementById('sortEvents');
    if (sortSel) {
      sortSel.addEventListener('change', (e) => {
        currentSort = e.target.value;
        render();
      });
    }

    // Create Event Button
    const createBtn = document.getElementById('btnCreateEvent');
    if (createBtn) {
      createBtn.addEventListener('click', () => openCreateEventModal());
    }

    // Load More Button
    const loadMoreBtn = document.getElementById('btnLoadMore');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        displayCount += 6;
        render();
      });
    }

    // Card Actions
    document.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openCreateEventModal(btn.dataset.id);
      });
    });

    document.querySelectorAll('.btn-view-participants').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Set query filter in participants and redirect
        window.location.hash = `#participants?event=${btn.dataset.id}`;
      });
    });

    document.querySelectorAll('.btn-builder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#form-builder?event=${btn.dataset.id}`;
      });
    });

    // Broadcast Button
    document.querySelectorAll('.btn-broadcast-event').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openBroadcastModal(btn.dataset.id, btn.dataset.title);
      });
    });

    // Questionnaire Builder Button
    document.querySelectorAll('.btn-q-builder').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#questionnaire-builder?event=${btn.dataset.id}`;
      });
    });

    // Questionnaire Results Button
    document.querySelectorAll('.btn-q-results').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.hash = `#feedback-results?event=${btn.dataset.id}`;
      });
    });

    // Delete Event Button
    document.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const title = btn.dataset.title;
        if (confirm(`Apakah Anda yakin ingin menghapus event "${title}" secara permanen?\n\nTindakan ini juga akan menghapus seluruh formulir kustom, grup chat, riwayat pesan, daftar hadir, dan pendaftaran untuk event ini!`)) {
          await Store.deleteEvent(id);
          App.showToast('Event berhasil dihapus!', 'success');
          render();
        }
      });
    });
  }

  // ============ Filter & Sort Logic ============
  function getFilteredAndSortedEvents() {
    let list = Store.getEvents();

    // 1. Filter
    if (currentFilter === 'active') {
      list = list.filter(e => e.status === 'active');
    } else if (currentFilter === 'draft') {
      list = list.filter(e => e.status === 'draft');
    }

    // 2. Sort
    list.sort((a, b) => {
      if (currentSort === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (currentSort === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (currentSort === 'dateAsc') {
        return new Date(a.date) - new Date(b.date);
      }
      return 0;
    });

    return list;
  }

  // ============ Stats Computation ============
  function calculateStats() {
    const allEvents = Store.getEvents();
    const active = allEvents.filter(e => e.status === 'active');
    const today = new Date().toISOString().split('T')[0];
    const upcoming = allEvents.filter(e => e.date >= today);

    // Sum participants
    const totalParts = allEvents.reduce((sum, e) => sum + (e.participantCount || 0), 0);

    // Attendance stats
    const allRegs = Store.getAllRegistrations();
    let totalPresent = 0;
    allEvents.forEach(e => {
      const attendance = Store.getAttendance(e.id);
      totalPresent += attendance.length;
    });

    let avgAttendance = 0;
    if (allRegs.length > 0) {
      avgAttendance = Math.round((totalPresent / allRegs.length) * 100);
    }

    return {
      totalEvents: allEvents.length,
      activeEvents: active.length,
      totalParticipants: totalParts,
      avgAttendance: avgAttendance,
      upcomingEvents: upcoming.length
    };
  }

  // ============ Modals ============
  function openCreateEventModal(eventId = null) {
    const isEdit = !!eventId;
    let event = null;
    if (isEdit) {
      event = Store.getEventById(eventId);
      if (!event) return;
    }

    const today = new Date().toISOString().split('T')[0];

    const body = `
      <form id="eventForm" class="flex flex-col gap-4">
        <div class="form-group">
          <label class="form-label" for="evTitle">Judul Seminar / Event <span class="required">*</span></label>
          <input type="text" class="form-input" id="evTitle" value="${event ? escapeHtml(event.title) : ''}" placeholder="Masukkan judul seminar..." required>
        </div>

        <div class="form-group">
          <label class="form-label" for="evDescription">Deskripsi Seminar</label>
          <textarea class="form-input" id="evDescription" rows="3" placeholder="Masukkan deskripsi atau detail acara...">${event ? escapeHtml(event.description) : ''}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="evDate">Tanggal Acara <span class="required">*</span></label>
            <input type="date" class="form-input" id="evDate" value="${event ? event.date : today}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="evCategory">Kategori Event</label>
            <select class="form-select" id="evCategory">
              <option value="Seminar" ${event && event.category === 'Seminar' ? 'selected' : ''}>Seminar</option>
              <option value="Webinar" ${event && event.category === 'Webinar' ? 'selected' : ''}>Webinar</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="evLocation">Tempat / Lokasi <span class="required">*</span></label>
            <input type="text" class="form-input" id="evLocation" value="${event ? escapeHtml(event.location) : ''}" placeholder="Contoh: Gedung Aula JCC, Lantai 2 / Online (Zoom)" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="evStatus">Status Event</label>
            <select class="form-select" id="evStatus">
              <option value="active" ${event && event.status === 'active' ? 'selected' : ''}>Aktif</option>
              <option value="draft" ${event && event.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="full" ${event && event.status === 'full' ? 'selected' : ''}>Penuh</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="evSponsors">Daftar Sponsor (Pisahkan dengan koma)</label>
          <input type="text" class="form-input" id="evSponsors" value="${event && event.sponsors ? escapeHtml(event.sponsors.join(', ')) : 'Anakku.id, InsForge'}" placeholder="Contoh: Anakku.id, InsForge, Google DeepMind">
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSaveEvent">
        <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
        ${isEdit ? 'Simpan Perubahan' : 'Buat Event'}
      </button>
    `;

    App.showModal(isEdit ? 'Ubah Informasi Event' : 'Buat Event Baru', body, footer);

    // Bind save logic
    setTimeout(() => {
      const saveBtn = document.getElementById('btnSaveEvent');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const title = document.getElementById('evTitle').value.trim();
          const description = document.getElementById('evDescription').value.trim();
          const date = document.getElementById('evDate').value;
          const category = document.getElementById('evCategory').value;
          const status = document.getElementById('evStatus').value;
          const location = document.getElementById('evLocation').value.trim();
          const sponsorsVal = document.getElementById('evSponsors').value.trim();
          const sponsors = sponsorsVal ? sponsorsVal.split(',').map(s => s.trim()).filter(Boolean) : [];

          if (!title || !date || !location) {
            App.showToast('Mohon lengkapi semua kolom wajib!', 'error');
            return;
          }

          const eventData = { title, description, date, status, location, category, sponsors };

          (async () => {
            if (isEdit) {
              await Store.updateEvent(eventId, eventData);
              App.showToast('Event berhasil diperbarui!', 'success');
            } else {
              // Store.addEvent now automatically creates general chat group and default form fields inside the data store layer
              await Store.addEvent(eventData);
              App.showToast('Event baru berhasil dibuat!', 'success');
            }

            App.closeModal();
            render();
          })();
        });
      }
    }, 100);
  }

  // ============ Broadcast Modal ============
  function openBroadcastModal(eventId, eventTitle) {
    const groups = Store.getChatGroups(eventId);
    if (groups.length === 0) {
      App.showToast('Belum ada grup chat untuk event ini', 'error');
      return;
    }

    const groupOptions = groups.map(g =>
      `<option value="${g.id}">${escapeHtml(g.name)}</option>`
    ).join('');

    const body = `
      <div class="form-group mb-4">
        <label class="form-label">Kirim Ke Grup Chat</label>
        <select class="form-select" id="broadcastGroupSelect">
          ${groupOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Pesan Broadcast <span class="required">*</span></label>
        <textarea class="form-input" id="broadcastMsgText" rows="4" placeholder="Tulis pengumuman penting untuk peserta event..."></textarea>
      </div>
      <p style="font-size: 12px; color: var(--outline); margin-top: 8px;">
        📢 Pesan akan dikirimkan sebagai tipe Pengumuman (Announce) di dalam grup chat.
      </p>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSendGroupBroadcast">
        <span class="material-symbols-outlined" style="font-size: 18px;">campaign</span>
        Kirim Broadcast
      </button>
    `;

    App.showModal('Kirim Pengumuman Event', body, footer);

    setTimeout(() => {
      const sendBtn = document.getElementById('btnSendGroupBroadcast');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          const groupId = document.getElementById('broadcastGroupSelect').value;
          const content = document.getElementById('broadcastMsgText').value.trim();

          if (!content) {
            App.showToast('Pesan broadcast tidak boleh kosong', 'error');
            return;
          }

          Store.addMessage({
            groupId,
            content,
            type: 'announcement'
          });

          App.closeModal();
          App.showToast('Broadcast berhasil dikirim ke grup chat!', 'success');
        });
      }
    }, 100);
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
