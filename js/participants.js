/* ============================================================
   SiSeminar — participants.js
   Participant Directory / Spreadsheet Page Module (Admin Panel)
   ============================================================ */

const ParticipantsPage = (() => {
  let selectedEventId = 'all';
  let selectedDistrict = 'all';
  let searchQuery = '';
  let sortField = 'submittedAt'; // name, submittedAt
  let sortOrder = 'desc'; // asc, desc
  let currentPage = 1;
  const itemsPerPage = 10;
  let activeMenuRegistrationId = null;

  // ============ Main Render ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    // Detect if event query parameter is present in URL
    const { params } = App.getRouteParams();
    if (params.event && selectedEventId === 'all') {
      selectedEventId = params.event;
    }

    const events = Store.getEvents();
    const allRegistrations = selectedEventId === 'all' 
      ? Store.getAllRegistrations() 
      : Store.getRegistrations(selectedEventId);

    // Get unique districts for filter
    const districts = getUniqueDistricts(Store.getAllRegistrations());

    // Apply filter, search and sort
    const processedList = getProcessedList(allRegistrations);

    // Pagination bounds
    const totalItems = processedList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedList = processedList.slice(startIndex, endIndex);

    const eventOptions = events.map(e =>
      `<option value="${e.id}" ${e.id === selectedEventId ? 'selected' : ''}>${escapeHtml(e.title)}</option>`
    ).join('');

    const districtOptions = districts.map(d =>
      `<option value="${escapeHtml(d)}" ${d === selectedDistrict ? 'selected' : ''}>${escapeHtml(d)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8 wrap gap-4">
          <div>
            <h1 class="page-title">Direktori Peserta</h1>
            <div class="breadcrumbs">
              <span>Dashboard</span>
              <span class="separator">/</span>
              <span class="active">Peserta</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button class="btn btn-secondary" id="btnExportCSV">
              <span class="material-symbols-outlined">download</span>
              Ekspor CSV
            </button>
            <button class="btn btn-primary" id="btnAddParticipant">
              <span class="material-symbols-outlined">person_add</span>
              Tambah Peserta
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="card mb-6" style="padding: var(--space-4);">
          <div style="display: grid; grid-template-columns: 1.5fr 1fr 1fr 0.5fr; gap: var(--space-4); align-items: end;" class="filter-bar">
            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600; color: var(--outline);">Filter Event</label>
              <select class="form-select" id="filterEventSelect" style="height: 38px;">
                <option value="all">Semua Event</option>
                ${eventOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 12px; font-weight: 600; color: var(--outline);">Kecamatan Domisili</label>
              <select class="form-select" id="filterDistrictSelect" style="height: 38px;">
                <option value="all">Semua Kecamatan</option>
                ${districtOptions}
              </select>
            </div>

            <div class="form-group" style="position: relative;">
              <label class="form-label" style="font-size: 12px; font-weight: 600; color: var(--outline);">Pencarian Nama/WA</label>
              <input type="text" class="form-input" id="inlineSearchInput" placeholder="Cari nama / nomor..." value="${escapeHtml(searchQuery)}" style="height: 38px; padding-left: 36px;">
              <span class="material-symbols-outlined" style="position: absolute; left: 10px; bottom: 8px; color: var(--outline); font-size: 20px;">search</span>
            </div>

            <button class="btn btn-ghost" id="btnClearFilters" style="height: 38px; justify-content: center;" title="Reset Filter">
              <span class="material-symbols-outlined">restart_alt</span>
              Reset
            </button>
          </div>
        </div>

        <!-- Info & Result Counter -->
        <div class="flex items-center justify-between mb-4">
          <span style="font-size: 13px; color: var(--outline); font-weight: 500;">
            Menampilkan <strong class="text-primary">${totalItems === 0 ? 0 : startIndex + 1}-${endIndex}</strong> dari <strong class="text-primary">${totalItems}</strong> hasil pendaftaran
          </span>
        </div>

        <!-- Data Table -->
        <div class="table-container card">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: var(--surface-container-low); border-bottom: 1px solid var(--border-subtle);">
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline); cursor: pointer;" class="sortable-header" data-field="name">
                  Nama Peserta
                  ${getSortIcon('name')}
                </th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline);">Usia Anak</th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline);">WhatsApp</th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline);">Usia Ibu/Wali</th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline);">Sumber Info</th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline);">Kecamatan</th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline);">Status</th>
                <th style="padding: var(--space-4); font-size: 12px; font-weight: 600; color: var(--outline); width: 60px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${paginatedList.length === 0 ? `
                <tr>
                  <td colspan="8" style="padding: var(--space-10); text-align: center; color: var(--outline);">
                    <span class="material-symbols-outlined" style="font-size: 40px; margin-bottom: 8px; display: block;">group_off</span>
                    Tidak ada data peserta terdaftar yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ` : paginatedList.map((reg, idx) => renderRow(reg, idx)).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        ${totalPages > 1 ? `
          <div class="table-pagination mt-6 flex items-center justify-between wrap gap-4">
            <span style="font-size: 13px; color: var(--outline);">Halaman ${currentPage} dari ${totalPages}</span>
            <div class="flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btnPrevPage" ${currentPage === 1 ? 'disabled' : ''}>
                <span class="material-symbols-outlined" style="font-size: 18px;">chevron_left</span>
                Sebelumnya
              </button>
              ${Array.from({ length: totalPages }).map((_, i) => `
                <button class="btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'} btn-page-number" data-page="${i + 1}">
                  ${i + 1}
                </button>
              `).join('')}
              <button class="btn btn-secondary btn-sm" id="btnNextPage" ${currentPage === totalPages ? 'disabled' : ''}>
                Berikutnya
                <span class="material-symbols-outlined" style="font-size: 18px;">chevron_right</span>
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    bindEvents(processedList);
  }

  // ============ Render Participant Row ============
  function renderRow(reg, idx) {
    const user = Store.getUserById(reg.userId);
    const name = reg.name || user?.name || 'Anonim';
    const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

    // Responses parsing
    const usiaAnak = reg.responses?.find(r => r.label?.toLowerCase().includes('usia anak'))?.value || '-';
    const usiaWali = reg.responses?.find(r => r.label?.toLowerCase().includes('usia anda') || r.label?.toLowerCase().includes('umur'))?.value || '-';
    const sumber = reg.responses?.find(r => r.label?.toLowerCase().includes('sumber') || r.label?.toLowerCase().includes('mengetahui'))?.value || '-';
    const kecamatan = reg.responses?.find(r => r.label?.toLowerCase().includes('kecamatan'))?.value || '-';

    const phoneFormatted = Store.formatPhone(reg.phone || user?.phone);

    const statusChips = {
      confirmed: '<span class="chip chip-success" style="font-size: 11px;">Dikonfirmasi</span>',
      pending: '<span class="chip chip-warning" style="font-size: 11px;">Menunggu</span>',
      cancelled: '<span class="chip chip-danger" style="font-size: 11px;">Dibatalkan</span>'
    };

    return `
      <tr style="border-bottom: 1px solid var(--border-subtle); background: ${idx % 2 === 0 ? 'transparent' : 'var(--surface-container-lowest)'};" class="table-row-hover">
        <td style="padding: var(--space-4);" class="table-cell-name flex items-center gap-3">
          <div class="table-avatar av-${(idx % 4) + 1}">${initials}</div>
          <div>
            <div style="font-weight: 600; color: var(--on-surface);">${escapeHtml(name)}</div>
            <div style="font-size: 11px; color: var(--outline); margin-top: 2px;">Daftar: ${App.formatDate(reg.submittedAt)}</div>
          </div>
        </td>
        <td style="padding: var(--space-4); font-size: 14px;">${escapeHtml(usiaAnak)} Tahun</td>
        <td style="padding: var(--space-4); font-family: monospace; font-size: 13px;">${escapeHtml(phoneFormatted)}</td>
        <td style="padding: var(--space-4); font-size: 14px;">${escapeHtml(usiaWali)} Thn</td>
        <td style="padding: var(--space-4);">
          <span class="chip-source" style="background: var(--surface-container-high); color: var(--on-surface-variant); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            ${escapeHtml(sumber)}
          </span>
        </td>
        <td style="padding: var(--space-4); font-size: 14px;">${escapeHtml(kecamatan)}</td>
        <td style="padding: var(--space-4);">${statusChips[reg.status] || statusChips.confirmed}</td>
        <td style="padding: var(--space-4); position: relative;">
          <button class="topbar-icon-btn btn-action-menu" data-id="${reg.id}" style="color: var(--outline);">
            <span class="material-symbols-outlined">more_vert</span>
          </button>
          
          <!-- Popup Action Dropdown -->
          ${activeMenuRegistrationId === reg.id ? `
            <div class="action-dropdown" style="position: absolute; right: 40px; top: 10px; background: white; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; min-width: 160px; display: flex; flex-direction: column; overflow: hidden; animation: scaleIn var(--transition-fast) forwards;">
              <button class="action-dropdown-item btn-view-detail" data-id="${reg.id}" style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: none; background: transparent; text-align: left; cursor: pointer; font-size: 13px; color: var(--on-surface);">
                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--outline);">info</span>
                Lihat Detail
              </button>
              
              <!-- Submenu Status change -->
              <div style="border-top: 1px solid var(--border-subtle); padding: var(--space-1) 0;">
                <span style="font-size: 10px; color: var(--outline); padding: 4px 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: block;">Ubah Status</span>
                <button class="action-dropdown-item btn-set-status" data-id="${reg.id}" data-status="confirmed" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: none; background: transparent; text-align: left; cursor: pointer; font-size: 13px; color: var(--teal-accent);">
                  <span class="material-symbols-outlined" style="font-size: 18px;">check</span>
                  Dikonfirmasi
                </button>
                <button class="action-dropdown-item btn-set-status" data-id="${reg.id}" data-status="pending" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: none; background: transparent; text-align: left; cursor: pointer; font-size: 13px; color: var(--amber-accent);">
                  <span class="material-symbols-outlined" style="font-size: 18px;">schedule</span>
                  Menunggu
                </button>
                <button class="action-dropdown-item btn-set-status" data-id="${reg.id}" data-status="cancelled" style="display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: none; background: transparent; text-align: left; cursor: pointer; font-size: 13px; color: var(--destructive-red);">
                  <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
                  Dibatalkan
                </button>
              </div>

              <button class="action-dropdown-item btn-delete-reg" data-id="${reg.id}" style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; border: none; background: transparent; text-align: left; cursor: pointer; font-size: 13px; color: var(--destructive-red); border-top: 1px solid var(--border-subtle);">
                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                Hapus Peserta
              </button>
            </div>
          ` : ''}
        </td>
      </tr>
    `;
  }

  // ============ Event Bindings ============
  function bindEvents(processedList) {
    // Dropdown filters
    const filterEvent = document.getElementById('filterEventSelect');
    if (filterEvent) {
      filterEvent.addEventListener('change', (e) => {
        selectedEventId = e.target.value;
        currentPage = 1;
        render();
      });
    }

    const filterDistrict = document.getElementById('filterDistrictSelect');
    if (filterDistrict) {
      filterDistrict.addEventListener('change', (e) => {
        selectedDistrict = e.target.value;
        currentPage = 1;
        render();
      });
    }

    // Inline Search input
    const inlineSearch = document.getElementById('inlineSearchInput');
    if (inlineSearch) {
      inlineSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        // Search without reloading is extremely snappy!
        render();
        // Keep focus
        const freshInput = document.getElementById('inlineSearchInput');
        if (freshInput) {
          freshInput.focus();
          freshInput.setSelectionRange(freshInput.value.length, freshInput.value.length);
        }
      });
    }

    // Clear Filters button
    const clearBtn = document.getElementById('btnClearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        selectedEventId = 'all';
        selectedDistrict = 'all';
        searchQuery = '';
        currentPage = 1;
        // Clear global search as well
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) globalSearch.value = '';
        render();
      });
    }

    // Export CSV
    const exportBtn = document.getElementById('btnExportCSV');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const listToExport = processedList.map(item => {
          const user = Store.getUserById(item.userId);
          const data = {
            Nama: item.name || user?.name || '',
            WhatsApp: item.phone || user?.phone || '',
            Status: item.status,
            'Tanggal Daftar': App.formatDate(item.submittedAt)
          };
          item.responses?.forEach(r => {
            data[r.label] = r.value;
          });
          return data;
        });

        Store.exportCSV(listToExport, `peserta_seminar_${selectedEventId}.csv`);
        App.showToast('Data peserta berhasil diekspor ke CSV!', 'success');
      });
    }

    // Add Participant Manual modal
    const addBtn = document.getElementById('btnAddParticipant');
    if (addBtn) {
      addBtn.addEventListener('click', () => openAddParticipantModal());
    }

    // Sort Headers
    document.querySelectorAll('.sortable-header').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (sortField === field) {
          sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortOrder = 'asc';
        }
        render();
      });
    });

    // Pagination clicks
    const prevBtn = document.getElementById('btnPrevPage');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          render();
        }
      });
    }

    const nextBtn = document.getElementById('btnNextPage');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentPage++;
        render();
      });
    }

    document.querySelectorAll('.btn-page-number').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        render();
      });
    });

    // Action menu triggers
    document.querySelectorAll('.btn-action-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        activeMenuRegistrationId = activeMenuRegistrationId === id ? null : id;
        render();
      });
    });

    // Close action dropdowns on clicking anywhere else
    document.addEventListener('click', () => {
      if (activeMenuRegistrationId !== null) {
        activeMenuRegistrationId = null;
        render();
      }
    }, { once: true });

    // Menu Actions
    document.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        showParticipantDetail(btn.dataset.id);
      });
    });

    document.querySelectorAll('.btn-set-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const regId = btn.dataset.id;
        const status = btn.dataset.status;
        Store.updateRegistration(regId, { status });
        App.showToast(`Status peserta berhasil diubah ke ${status === 'confirmed' ? 'Dikonfirmasi' : status === 'pending' ? 'Menunggu' : 'Dibatalkan'}!`, 'success');
        activeMenuRegistrationId = null;
        render();
      });
    });

    document.querySelectorAll('.btn-delete-reg').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus peserta ini dari daftar seminar?')) {
          Store.deleteRegistration(btn.dataset.id);
          App.showToast('Peserta berhasil dihapus dari direktori.', 'success');
          activeMenuRegistrationId = null;
          render();
        }
      });
    });
  }

  // ============ Process Filter, Search & Sort ============
  function getProcessedList(list) {
    let result = [...list];

    // 1. District Filter
    if (selectedDistrict !== 'all') {
      result = result.filter(reg => {
        const districtVal = reg.responses?.find(r => r.label?.toLowerCase().includes('kecamatan'))?.value || '';
        return districtVal.trim().toLowerCase() === selectedDistrict.trim().toLowerCase();
      });
    }

    // 2. Search query (filter by name / phone)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(reg => {
        const user = Store.getUserById(reg.userId);
        const name = (reg.name || user?.name || '').toLowerCase();
        const phone = (reg.phone || user?.phone || '').toLowerCase();
        return name.includes(q) || phone.includes(q);
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'name') {
        const userA = Store.getUserById(a.userId);
        const userB = Store.getUserById(b.userId);
        aVal = a.name || userA?.name || '';
        bVal = b.name || userB?.name || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  // ============ Get Unique Districts for Filter ============
  function getUniqueDistricts(list) {
    const set = new Set();
    list.forEach(reg => {
      const d = reg.responses?.find(r => r.label?.toLowerCase().includes('kecamatan'))?.value;
      if (d) set.add(d.trim());
    });
    return Array.from(set);
  }

  function getSortIcon(field) {
    if (sortField !== field) {
      return '<span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; opacity:0.3;">unfold_more</span>';
    }
    return sortOrder === 'asc' 
      ? '<span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; color:var(--primary);">arrow_upward</span>'
      : '<span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; color:var(--primary);">arrow_downward</span>';
  }

  // ============ Show Detailed Info Modal ============
  function showParticipantDetail(regId) {
    const reg = Store.getAllRegistrations().find(r => r.id === regId);
    if (!reg) return;

    const user = Store.getUserById(reg.userId);
    const event = Store.getEventById(reg.eventId);

    const body = `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
          <p style="font-size: 11px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Event Terdaftar</p>
          <p style="font-weight: 600; color: var(--on-surface); font-size: 15px;">${event ? escapeHtml(event.title) : 'Tidak Diketahui'}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-3);">
          <div>
            <p style="font-size: 11px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Nomor WhatsApp</p>
            <p style="font-family: monospace; font-size: 14px;">${Store.formatPhone(reg.phone || user?.phone)}</p>
          </div>
          <div>
            <p style="font-size: 11px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Tanggal Registrasi</p>
            <p style="font-size: 14px;">${App.formatDateTime(reg.submittedAt)}</p>
          </div>
        </div>

        <div>
          <p style="font-size: 11px; color: var(--outline); font-weight: 600; text-transform: uppercase; margin-bottom: var(--space-2);">Jawaban Lengkap Form</p>
          <div style="background: var(--surface-container-low); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4);" class="flex flex-col gap-3">
            ${reg.responses.map(res => `
              <div>
                <span style="font-size: 12px; color: var(--outline); display: block; font-weight: 500;">${escapeHtml(res.label)}</span>
                <span style="font-size: 13.5px; font-weight: 600; color: var(--on-surface);">${escapeHtml(res.value || '-')}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const footer = `<button class="btn btn-primary" onclick="App.closeModal()">Tutup</button>`;
    App.showModal('Detail Formulir Peserta', body, footer);
  }

  // ============ Manual Add Modal ============
  function openAddParticipantModal() {
    const events = Store.getEvents();
    if (events.length === 0) {
      App.showToast('Silakan buat event terlebih dahulu!', 'error');
      return;
    }

    const eventOptions = events.map(e =>
      `<option value="${e.id}">${escapeHtml(e.title)}</option>`
    ).join('');

    const body = `
      <form id="manualParticipantForm" class="flex flex-col gap-4">
        <div class="form-group">
          <label class="form-label" for="manualEvent">Pilih Event <span class="required">*</span></label>
          <select class="form-select" id="manualEvent" required>
            ${eventOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="manualName">Nama Lengkap <span class="required">*</span></label>
          <input type="text" class="form-input" id="manualName" placeholder="Contoh: Budi Santoso" required>
        </div>

        <div class="form-group">
          <label class="form-label" for="manualPhone">Nomor WhatsApp <span class="required">*</span></label>
          <div class="phone-input-wrapper">
            <span class="phone-prefix">+62</span>
            <input type="tel" id="manualPhone" placeholder="8xxxxxxxxxx" required style="height: 42px;">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="manualUsiaIbu">Usia Anda (Tahun)</label>
            <input type="number" class="form-input" id="manualUsiaIbu" placeholder="Thn">
          </div>
          <div class="form-group">
            <label class="form-label" for="manualUsiaAnak">Usia Anak (Tahun)</label>
            <input type="number" class="form-input" id="manualUsiaAnak" placeholder="Thn">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="manualKecamatan">Kecamatan Domisili</label>
            <input type="text" class="form-input" id="manualKecamatan" placeholder="Kecamatan">
          </div>
          <div class="form-group">
            <label class="form-label" for="manualSumber">Sumber Informasi</label>
            <select class="form-select" id="manualSumber">
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Teman/Keluarga">Teman/Keluarga</option>
              <option value="Komunitas WhatsApp">Komunitas WhatsApp</option>
              <option value="Website">Website</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSaveManualParticipant">
        <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
        Tambah Peserta
      </button>
    `;

    App.showModal('Tambah Peserta Secara Manual', body, footer);

    setTimeout(() => {
      const saveBtn = document.getElementById('btnSaveManualParticipant');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const eventId = document.getElementById('manualEvent').value;
          const name = document.getElementById('manualName').value.trim();
          const phoneInput = document.getElementById('manualPhone').value.trim();
          const usiaIbu = document.getElementById('manualUsiaIbu').value.trim();
          const usiaAnak = document.getElementById('manualUsiaAnak').value.trim();
          const kecamatan = document.getElementById('manualKecamatan').value.trim();
          const sumber = document.getElementById('manualSumber').value;

          if (!name || !phoneInput) {
            App.showToast('Nama Lengkap dan Nomor WhatsApp wajib diisi!', 'error');
            return;
          }

          const phone = Store.normalizePhone(phoneInput);
          if (phone.length < 9) {
            App.showToast('Format Nomor WhatsApp tidak valid!', 'error');
            return;
          }

          try {
            // Create account
            const userRes = await Store.addUser({ name, phone, password: '123456', role: 'peserta' });
            let userId = '';
            if (userRes.success) {
              userId = userRes.user.id;
            } else {
              const exUser = Store.getUserByPhone(phone);
              if (exUser) userId = exUser.id;
            }

            const responses = [
              { label: 'Nama Lengkap', value: name },
              { label: 'Nomor WhatsApp', value: phone },
              { label: 'Usia Anda (Tahun)', value: usiaIbu || '-' },
              { label: 'Usia Anak (Tahun)', value: usiaAnak || '-' },
              { label: 'Kecamatan Domisili', value: kecamatan || '-' },
              { label: 'Mengetahui Informasi Seminar Dari', value: sumber }
            ];

            const regRes = await Store.addRegistration({
              eventId,
              userId,
              name,
              phone,
              responses
            });

            if (!regRes.success) {
              App.showToast(regRes.error || 'Gagal menambahkan registrasi manual!', 'error');
              return;
            }

            App.showToast('Peserta manual berhasil didaftarkan!', 'success');
            App.closeModal();
            render();
          } catch (err) {
            console.error("Manual participant addition failed:", err);
            App.showToast('Terjadi kesalahan saat menyimpan peserta.', 'error');
          }
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
