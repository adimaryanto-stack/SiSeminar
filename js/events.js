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
      <div class="animate-fade-in">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="page-title">Manajemen Event</h1>
            <div class="breadcrumbs">
              <span>Dashboard</span>
              <span class="separator">/</span>
              <span class="active">Event</span>
            </div>
          </div>
          <button class="btn btn-primary" id="btnCreateEvent">
            <span class="material-symbols-outlined">add</span>
            Event Baru
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Seminar Aktif</span>
              <span class="material-symbols-outlined text-primary" style="font-size: 24px;">campaign</span>
            </div>
            <div class="stat-card-value">${stats.activeEvents}</div>
            <div class="stat-card-desc">Dari total ${stats.totalEvents} event</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Total Peserta</span>
              <span class="material-symbols-outlined text-teal" style="font-size: 24px;">group</span>
            </div>
            <div class="stat-card-value">${stats.totalParticipants}</div>
            <div class="stat-card-desc">Peserta terdaftar aktif</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Rata-rata Kehadiran</span>
              <span class="material-symbols-outlined text-purple" style="font-size: 24px;">check_circle</span>
            </div>
            <div class="stat-card-value">${stats.avgAttendance}%</div>
            <div class="stat-card-desc">Tingkat kehadiran presensi</div>
          </div>

          <div class="stat-card">
            <div class="stat-card-header">
              <span class="stat-card-label">Event Mendatang</span>
              <span class="material-symbols-outlined text-amber" style="font-size: 24px;">event_upcoming</span>
            </div>
            <div class="stat-card-value">${stats.upcomingEvents}</div>
            <div class="stat-card-desc">Menunggu pelaksanaan</div>
          </div>
        </div>

        <!-- Filter & Sort Bar -->
        <div class="filter-bar mb-6">
          <div class="flex items-center gap-3 wrap">
            <span class="filter-label flex items-center gap-1">
              <span class="material-symbols-outlined" style="font-size: 18px;">filter_list</span>
              Filter Status:
            </span>
            <button class="chip ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Semua</button>
            <button class="chip ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">Aktif</button>
            <button class="chip ${currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">Draft</button>
          </div>
          <div class="flex items-center gap-3">
            <span class="filter-label flex items-center gap-1">
              <span class="material-symbols-outlined" style="font-size: 18px;">sort</span>
              Urutkan:
            </span>
            <select class="form-select" id="sortEvents" style="width: 180px; height: 36px; padding: 0 12px;">
              <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>Terbaru dibuat</option>
              <option value="oldest" ${currentSort === 'oldest' ? 'selected' : ''}>Terlama dibuat</option>
              <option value="dateAsc" ${currentSort === 'dateAsc' ? 'selected' : ''}>Tanggal Terdekat</option>
            </select>
          </div>
        </div>

        <!-- Event Cards Grid -->
        ${events.length === 0 ? `
          <div class="empty-state">
            <span class="material-symbols-outlined">event_busy</span>
            <h3>Tidak Ada Event Ditemukan</h3>
            <p>Silakan buat event baru untuk memulai.</p>
          </div>
        ` : `
          <div class="grid grid-cols-3 gap-6" id="eventsGrid">
            ${events.slice(0, displayCount).map((event, idx) => renderEventCard(event, idx)).join('')}
          </div>

          ${events.length > displayCount ? `
            <div class="flex flex-col items-center mt-8">
              <span class="text-sm text-outline mb-3">Menampilkan ${Math.min(displayCount, events.length)} dari ${events.length} event</span>
              <button class="btn btn-secondary" id="btnLoadMore">Muat Lebih Banyak</button>
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
      active: '<span class="chip chip-success">AKTIF</span>',
      draft: '<span class="chip chip-warning">DRAFT</span>',
      full: '<span class="chip chip-danger">PENUH</span>'
    };

    // Cyclic vibrant gradient colors for cards
    const gradients = [
      'linear-gradient(135deg, #4f46e5, #06b6d4)',
      'linear-gradient(135deg, #ec4899, #8b5cf6)',
      'linear-gradient(135deg, #f59e0b, #e11d48)',
      'linear-gradient(135deg, #10b981, #059669)'
    ];
    const gradient = gradients[idx % gradients.length];

    const formattedDate = App.formatDate(event.date);

    return `
      <div class="card animate-slide-up" style="animation-delay: ${idx * 0.05}s;">
        <!-- Card Header Image/Gradient -->
        <div style="height: 140px; background: ${gradient}; position: relative; display: flex; align-items: flex-end; padding: var(--space-4);">
          <div style="position: absolute; top: var(--space-4); left: var(--space-4);">
            ${statusBadges[event.status] || statusBadges.draft}
          </div>
          <div style="position: absolute; top: var(--space-4); right: var(--space-4); background: rgba(0, 0, 0, 0.4); color: white; padding: 4px 10px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; backdrop-filter: blur(4px);">
            ${event.participantCount || 0} Peserta
          </div>
          <div style="color: white; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.2); padding: 2px 6px; border-radius: 4px;">
            <span class="material-symbols-outlined" style="font-size: 14px;">key</span>
            Kode: ${event.joinCode}
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-body" style="padding: var(--space-5);">
          <div class="flex items-center gap-2 mb-2" style="font-size: 12px; color: var(--outline); font-weight: 500;">
            <span class="material-symbols-outlined text-teal" style="font-size: 16px;">calendar_month</span>
            ${formattedDate}
          </div>
          <h4 style="font-family: var(--font-heading); font-size: 16px; font-weight: 600; line-height: 1.4; margin-bottom: var(--space-2); min-height: 44px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(event.title)}">
            ${escapeHtml(event.title)}
          </h4>
          <p class="flex items-start gap-1" style="font-size: 13px; color: var(--on-surface-variant); min-height: 36px; line-height: 1.4;">
            <span class="material-symbols-outlined text-teal" style="font-size: 16px; margin-top: 1px;">location_on</span>
            <span style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(event.location || 'Online')}</span>
          </p>
        </div>

        <!-- Card Footer Actions -->
        <div style="padding: 0 var(--space-5) var(--space-5); display: flex; gap: var(--space-2); flex-wrap: wrap;">
          <button class="btn btn-ghost btn-sm flex-1 btn-edit-event" data-id="${event.id}" title="Edit Detail">
            <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
            Ubah
          </button>
          <button class="btn btn-ghost btn-sm flex-1 btn-view-participants" data-id="${event.id}" title="Lihat Peserta">
            <span class="material-symbols-outlined" style="font-size: 16px;">group</span>
            Peserta
          </button>
          <button class="btn btn-secondary btn-sm flex-1 btn-builder" data-id="${event.id}" title="Form Builder">
            <span class="material-symbols-outlined" style="font-size: 16px;">dynamic_form</span>
            Form
          </button>
        </div>
        <div style="border-top: 1px solid var(--border-subtle); padding: 8px var(--space-5); background: var(--surface-container-low); display: flex; justify-content: space-between; align-items: center;">
          <a href="#register?event=${event.id}" class="text-sm font-semibold flex items-center gap-1 text-primary" target="_blank" style="text-decoration: none;">
            <span class="material-symbols-outlined" style="font-size: 16px;">link</span>
            Link Registrasi
          </a>
          <button class="btn-broadcast-event topbar-icon-btn" data-id="${event.id}" data-title="${escapeHtml(event.title)}" title="Kirim Broadcast ke Grup Chat" style="padding: 2px; color: var(--primary);">
            <span class="material-symbols-outlined">campaign</span>
          </button>
        </div>
      </div>
    `;
  }

  // ============ Event Bindings ============
  function bindEvents() {
    // Filter chips
    document.querySelectorAll('.filter-bar button.chip').forEach(btn => {
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
            <label class="form-label" for="evStatus">Status Event</label>
            <select class="form-select" id="evStatus">
              <option value="active" ${event && event.status === 'active' ? 'selected' : ''}>Aktif</option>
              <option value="draft" ${event && event.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="full" ${event && event.status === 'full' ? 'selected' : ''}>Penuh</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="evLocation">Tempat / Lokasi <span class="required">*</span></label>
          <input type="text" class="form-input" id="evLocation" value="${event ? escapeHtml(event.location) : ''}" placeholder="Contoh: Gedung Aula JCC, Lantai 2 / Online (Zoom)" required>
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
          const status = document.getElementById('evStatus').value;
          const location = document.getElementById('evLocation').value.trim();

          if (!title || !date || !location) {
            App.showToast('Mohon lengkapi semua kolom wajib!', 'error');
            return;
          }

          const eventData = { title, description, date, status, location };

          if (isEdit) {
            Store.updateEvent(eventId, eventData);
            App.showToast('Event berhasil diperbarui!', 'success');
          } else {
            const newEv = Store.addEvent(eventData);
            // Pre-populate Form Builder with basic fields for new event
            Store.addFormField({
              eventId: newEv.id,
              label: 'Nama Lengkap',
              fieldType: 'text',
              isRequired: true,
              placeholder: 'Masukkan nama lengkap',
              orderIndex: 0
            });
            Store.addFormField({
              eventId: newEv.id,
              label: 'Nomor WhatsApp',
              fieldType: 'text',
              isRequired: true,
              placeholder: '08xxxxxxxxxx',
              orderIndex: 1
            });
            App.showToast('Event baru berhasil dibuat!', 'success');
          }

          App.closeModal();
          render();
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
