/* ============================================================
   SiSeminar — form-builder.js
   Registration Form Builder Page Module (Admin Panel)
   ============================================================ */

const FormBuilderPage = (() => {
  let selectedEventId = '';
  let fieldsCache = [];
  let dragEl = null;

  // ============ Main Render ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    // Get selected eventId from URL params or default to first active event
    const { params } = App.getRouteParams();
    if (params.event) {
      selectedEventId = params.event;
    }

    const events = Store.getEvents();
    if (!selectedEventId && events.length > 0) {
      selectedEventId = events[0].id;
    }

    fieldsCache = selectedEventId ? Store.getFormFields(selectedEventId) : [];

    const eventOptions = events.map(e =>
      `<option value="${e.id}" ${e.id === selectedEventId ? 'selected' : ''}>${escapeHtml(e.title)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="animate-fade-in">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-6 wrap gap-4">
          <div>
            <h1 class="page-title">Pembuat Form Registrasi</h1>
            <div class="breadcrumbs">
              <span>Dashboard</span>
              <span class="separator">/</span>
              <span class="active">Form Builder</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <select class="form-select" id="builderEventSelect" style="width: 200px;">
              <option value="">Pilih Event...</option>
              ${eventOptions}
            </select>
            <button class="btn btn-secondary" id="btnLivePreview" ${!selectedEventId ? 'disabled' : ''}>
              <span class="material-symbols-outlined">visibility</span>
              Live Link
            </button>
            <button class="btn btn-primary" id="btnSaveForm" ${!selectedEventId ? 'disabled' : ''}>
              <span class="material-symbols-outlined">save</span>
              Simpan Form
            </button>
            <button class="btn btn-ghost" id="btnDeleteWholeForm" ${!selectedEventId ? 'disabled' : ''} style="color: var(--destructive-red); border: 1px solid var(--border-subtle);">
              <span class="material-symbols-outlined" style="font-size: 20px;">delete_sweep</span>
              Hapus Form
            </button>
          </div>
        </div>

        ${!selectedEventId ? `
          <div class="empty-state">
            <span class="material-symbols-outlined" style="font-size: 56px;">dynamic_form</span>
            <h3>Pilih Event Terlebih Dahulu</h3>
            <p>Silakan pilih salah satu event aktif dari dropdown di atas untuk mulai membuat form pendaftaran.</p>
          </div>
        ` : `
          <!-- Two-column Layout -->
          <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: var(--space-6); align-items: start;">
            
            <!-- LEFT COLUMN: Form Elements & Editor -->
            <div class="flex flex-col gap-6">
              <!-- Add Field Block -->
              <div class="card" style="padding: var(--space-5);">
                <h4 style="font-family: var(--font-heading); font-size: 15px; font-weight: 600; margin-bottom: var(--space-4); color: var(--primary);">
                  + Tambah Field Baru
                </h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3);" class="field-type-grid">
                  <button class="btn btn-ghost btn-add-field" data-type="text" style="flex-direction: column; height: 74px; gap: 4px; border: 1px dashed var(--border-subtle);">
                    <span class="material-symbols-outlined text-primary" style="font-size: 24px;">match_case</span>
                    <span style="font-size: 11px; font-weight: 600;">Input Teks</span>
                  </button>
                  <button class="btn btn-ghost btn-add-field" data-type="number" style="flex-direction: column; height: 74px; gap: 4px; border: 1px dashed var(--border-subtle);">
                    <span class="material-symbols-outlined text-teal" style="font-size: 24px;">pin</span>
                    <span style="font-size: 11px; font-weight: 600;">Input Angka</span>
                  </button>
                  <button class="btn btn-ghost btn-add-field" data-type="dropdown" style="flex-direction: column; height: 74px; gap: 4px; border: 1px dashed var(--border-subtle);">
                    <span class="material-symbols-outlined text-purple" style="font-size: 24px;">list</span>
                    <span style="font-size: 11px; font-weight: 600;">Pilihan Berganda</span>
                  </button>
                  <button class="btn btn-ghost btn-add-field" data-type="checkbox" style="flex-direction: column; height: 74px; gap: 4px; border: 1px dashed var(--border-subtle);">
                    <span class="material-symbols-outlined text-amber" style="font-size: 24px;">check_box</span>
                    <span style="font-size: 11px; font-weight: 600;">Kotak Persetujuan</span>
                  </button>
                </div>
              </div>

              <!-- Form Structure Block -->
              <div>
                <h4 style="font-family: var(--font-heading); font-size: 15px; font-weight: 600; margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center;">
                  <span>Struktur Form</span>
                  <span class="chip chip-info" style="font-size: 11px;">${fieldsCache.length} Fields</span>
                </h4>

                <div id="fieldsContainer" class="flex flex-col gap-3">
                  ${fieldsCache.length === 0 ? `
                    <div style="border: 2px dashed var(--border-subtle); padding: var(--space-8); text-align: center; border-radius: var(--radius-md); background: var(--surface-container-low);" class="add-field-zone">
                      <span class="material-symbols-outlined" style="font-size: 36px; color: var(--outline);">drag_click</span>
                      <p style="font-size: 13px; color: var(--outline); margin-top: 4px;">Klik salah satu tipe input di atas untuk menyusun form</p>
                    </div>
                  ` : fieldsCache.map((field, idx) => renderFieldCard(field, idx)).join('')}
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN: Realtime Participant Preview -->
            <div class="card" style="position: sticky; top: 90px; overflow: hidden; box-shadow: var(--shadow-lg);">
              <div style="background: linear-gradient(135deg, var(--primary), var(--primary-container)); color: white; padding: var(--space-4) var(--space-5); display: flex; justify-content: space-between; align-items: center;">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-teal" style="font-size: 20px;">preview</span>
                  <span style="font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">TAMPILAN PESERTA / Preview</span>
                </div>
                <span class="chip chip-success" style="font-size: 10px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4);">LIVE</span>
              </div>
              <div style="padding: var(--space-6); background: var(--surface-container-lowest); max-height: 70vh; overflow-y: auto;">
                <div id="previewFormContent" class="flex flex-col gap-4">
                  ${renderFormPreview()}
                </div>
                <button class="btn btn-primary btn-lg mt-6" style="width: 100%; justify-content: center;" disabled>
                  Selesaikan Pendaftaran
                  <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
                </button>
              </div>
            </div>

          </div>
        `}
      </div>
    `;

    bindEvents();
  }

  // ============ Render Configured Field Card ============
  function renderFieldCard(field, idx) {
    const isProtected = ['nama lengkap', 'nomor whatsapp'].includes(field.label.toLowerCase());

    const typeLabels = {
      text: '<span class="chip chip-info" style="font-size: 10px; padding: 2px 8px;">Teks</span>',
      number: '<span class="chip chip-success" style="font-size: 10px; padding: 2px 8px;">Angka</span>',
      dropdown: '<span class="chip chip-warning" style="font-size: 10px; padding: 2px 8px;">Pilihan</span>',
      checkbox: '<span class="chip chip-danger" style="font-size: 10px; padding: 2px 8px;">Persetujuan</span>'
    };

    return `
      <div class="card field-card animate-slide-up" 
           draggable="true" 
           data-id="${field.id}" 
           data-idx="${idx}" 
           style="background: var(--surface-container-lowest); border-left: 4px solid var(--primary); display: flex; flex-direction: column; cursor: grab;"
           onmouseover="this.style.borderColor='var(--teal-accent)'"
           onmouseout="this.style.borderColor='var(--primary)'">
        
        <div style="display: flex; align-items: flex-start; gap: var(--space-4); padding: var(--space-4);">
          <!-- Drag Handle -->
          <div style="color: var(--outline); padding-top: 10px; cursor: move;" class="drag-handle">
            <span class="material-symbols-outlined">drag_indicator</span>
          </div>

          <!-- Content Form Editor -->
          <div style="flex: 1;" class="flex flex-col gap-3">
            <div class="flex items-center justify-between wrap gap-2">
              <div class="flex items-center gap-2">
                ${typeLabels[field.fieldType] || typeLabels.text}
                ${isProtected ? '<span style="font-size: 10px; color: var(--outline); font-weight: 500;">(Field Wajib Sistem)</span>' : ''}
              </div>
              <div class="flex items-center gap-4">
                <!-- Required Toggle -->
                <label class="checkbox-wrapper" style="font-size: 13px; font-weight: 500;">
                  <input type="checkbox" class="field-required-toggle" data-id="${field.id}" ${field.isRequired ? 'checked' : ''} ${isProtected ? 'disabled' : ''}>
                  Wajib Diisi
                </label>
                
                <!-- Delete Button -->
                ${!isProtected ? `
                  <button class="topbar-icon-btn text-danger btn-delete-field" data-id="${field.id}" title="Hapus Field" style="color: var(--destructive-red);">
                    <span class="material-symbols-outlined" style="font-size: 20px;">delete</span>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Label Input -->
            <div class="form-group">
              <input type="text" class="form-input field-label-input" 
                     data-id="${field.id}" 
                     value="${escapeHtml(field.label)}" 
                     placeholder="Nama label input..." 
                     ${isProtected ? 'readonly' : ''}
                     style="height: 38px; font-weight: 500; font-size: 14px;">
            </div>

            <!-- Custom Options Editors -->
            ${field.fieldType === 'dropdown' ? `
              <div class="form-group mt-2">
                <label class="form-label" style="font-size: 12px; color: var(--outline);">Pilihan Menu Dropdown (Pisahkan dengan Koma):</label>
                <input type="text" class="form-input field-options-input" 
                       data-id="${field.id}" 
                       value="${escapeHtml(field.options.join(', '))}" 
                       placeholder="Contoh: Pilihan A, Pilihan B, Pilihan C"
                       style="height: 34px; font-size: 13px;">
              </div>
            ` : ''}

            ${field.fieldType === 'checkbox' ? `
              <div class="form-group mt-2">
                <label class="form-label" style="font-size: 12px; color: var(--outline);">Klausa Pernyataan Persetujuan:</label>
                <textarea class="form-input field-placeholder-input" 
                          data-id="${field.id}" 
                          rows="2"
                          placeholder="Masukkan klausul persetujuan peserta..."
                          style="font-size: 13px; line-height: 1.4;">${escapeHtml(field.placeholder)}</textarea>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ============ Render Dynamic Preview Form ============
  function renderFormPreview() {
    if (fieldsCache.length === 0) {
      return `
        <div style="text-align: center; color: var(--outline); padding: var(--space-8);">
          <span class="material-symbols-outlined" style="font-size: 32px;">assignment</span>
          <p style="font-size: 13px; margin-top: 4px;">Form kosong, silakan tambah field</p>
        </div>
      `;
    }

    return fieldsCache.map(field => {
      const isRequiredText = field.isRequired ? '<span class="required">*</span>' : '';

      let inputHtml = '';
      if (field.fieldType === 'text') {
        inputHtml = `<input type="text" class="form-input" placeholder="${escapeHtml(field.placeholder || 'Masukkan teks...')}" disabled>`;
      } else if (field.fieldType === 'number') {
        inputHtml = `<input type="number" class="form-input" placeholder="${escapeHtml(field.placeholder || 'Masukkan angka...')}" disabled>`;
      } else if (field.fieldType === 'dropdown') {
        const opts = field.options.length > 0 ? field.options : ['Pilihan 1', 'Pilihan 2'];
        inputHtml = `
          <select class="form-select" disabled>
            <option value="">${escapeHtml(field.placeholder || 'Pilih salah satu...')}</option>
            ${opts.map(o => `<option>${escapeHtml(o)}</option>`).join('')}
          </select>
        `;
      } else if (field.fieldType === 'checkbox') {
        return `
          <div class="consent-box" style="padding: var(--space-3); background: var(--surface-container-low); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
            <label class="checkbox-wrapper" style="align-items: flex-start;">
              <input type="checkbox" disabled style="width: 20px; height: 20px; accent-color: var(--teal-accent);">
              <span class="checkbox-label" style="font-size: 12px; line-height: 1.4; color: var(--on-surface-variant);">
                ${escapeHtml(field.placeholder || 'Saya setuju dengan ketentuan yang berlaku.')} ${isRequiredText}
              </span>
            </label>
          </div>
        `;
      }

      return `
        <div class="form-group">
          <label class="form-label">${escapeHtml(field.label)} ${isRequiredText}</label>
          ${inputHtml}
        </div>
      `;
    }).join('');
  }

  // ============ Event Bindings ============
  function bindEvents() {
    // Event Dropdown
    const select = document.getElementById('builderEventSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        selectedEventId = e.target.value;
        if (selectedEventId) {
          window.location.hash = `#form-builder?event=${selectedEventId}`;
        } else {
          window.location.hash = '#form-builder';
        }
      });
    }

    // Live Link button
    const liveBtn = document.getElementById('btnLivePreview');
    if (liveBtn) {
      liveBtn.addEventListener('click', () => {
        if (selectedEventId) {
          window.open(`#register?event=${selectedEventId}`, '_blank');
        }
      });
    }

    // Save Form button
    const saveFormBtn = document.getElementById('btnSaveForm');
    if (saveFormBtn) {
      saveFormBtn.addEventListener('click', () => {
        App.showToast('Seluruh field form kustom berhasil disimpan dan dipublikasikan!', 'success');
      });
    }

    // Delete Whole Form button
    const deleteWholeFormBtn = document.getElementById('btnDeleteWholeForm');
    if (deleteWholeFormBtn) {
      deleteWholeFormBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus SEMUA field form kustom untuk event ini? Field wajib sistem tidak akan ikut terhapus.')) {
          const protectedLabels = ['nama lengkap', 'nomor whatsapp'];
          const fieldsToDelete = fieldsCache.filter(f => !protectedLabels.includes(f.label.toLowerCase()));
          
          fieldsToDelete.forEach(f => {
            Store.deleteFormField(f.id);
          });
          
          App.showToast('Seluruh field form kustom berhasil dihapus!', 'success');
          render();
        }
      });
    }

    // Add Field buttons
    document.querySelectorAll('.btn-add-field').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!selectedEventId) {
          App.showToast('Silakan pilih event terlebih dahulu!', 'error');
          return;
        }
        const fieldType = btn.dataset.type;

        let label = 'Field Baru';
        let placeholder = '';
        let options = [];

        if (fieldType === 'text') {
          label = 'Input Baru';
          placeholder = 'Ketik jawaban Anda...';
        } else if (fieldType === 'number') {
          label = 'Usia / Angka';
          placeholder = 'Ketik angka...';
        } else if (fieldType === 'dropdown') {
          label = 'Sumber Informasi';
          placeholder = 'Pilih saluran...';
          options = ['Instagram', 'Teman', 'Komunitas'];
        } else if (fieldType === 'checkbox') {
          label = 'Klausul Persetujuan';
          placeholder = 'Dengan mendaftar, saya berkenan menerima info kegiatan berikutnya.';
        }

        Store.addFormField({
          eventId: selectedEventId,
          label,
          fieldType,
          isRequired: true,
          placeholder,
          options
        });

        App.showToast('Field berhasil ditambahkan!', 'success');
        render();
      });
    });

    // Delete Field buttons
    document.querySelectorAll('.btn-delete-field').forEach(btn => {
      btn.addEventListener('click', () => {
        const fieldId = btn.dataset.id;
        Store.deleteFormField(fieldId);
        App.showToast('Field berhasil dihapus!', 'success');
        render();
      });
    });

    // Real-time Label inputs
    document.querySelectorAll('.field-label-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.dataset.id;
        const val = e.target.value.trim();
        if (val) {
          Store.updateFormField(id, { label: val });
          updatePreview();
        }
      });
    });

    // Real-time Dropdown Options inputs
    document.querySelectorAll('.field-options-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.dataset.id;
        const val = e.target.value.trim();
        const options = val.split(',').map(o => o.trim()).filter(Boolean);
        Store.updateFormField(id, { options });
        updatePreview();
      });
    });

    // Real-time Checkbox / Placeholder Text inputs
    document.querySelectorAll('.field-placeholder-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const id = input.dataset.id;
        const val = e.target.value.trim();
        Store.updateFormField(id, { placeholder: val });
        updatePreview();
      });
    });

    // Required toggle switches
    document.querySelectorAll('.field-required-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = chk.dataset.id;
        Store.updateFormField(id, { isRequired: e.target.checked });
        updatePreview();
      });
    });

    // --- HTML5 Drag and Drop Events ---
    const cards = document.querySelectorAll('.field-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragover', handleDragOver);
      card.addEventListener('drop', handleDrop);
      card.addEventListener('dragend', handleDragEnd);
    });
  }

  // ============ Drag & Drop Handlers ============
  function handleDragStart(e) {
    dragEl = this;
    e.dataTransfer.effectAllowed = 'move';
    this.style.opacity = '0.4';
  }

  function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragEl !== this) {
      const allCards = Array.from(document.querySelectorAll('.field-card'));
      const dragIdx = allCards.indexOf(dragEl);
      const targetIdx = allCards.indexOf(this);

      // Reorder cache locally
      const movedItem = fieldsCache.splice(dragIdx, 1)[0];
      fieldsCache.splice(targetIdx, 0, movedItem);

      // Save new order to Store
      const orderedIds = fieldsCache.map(f => f.id);
      Store.reorderFormFields(selectedEventId, orderedIds);

      // Re-render
      render();
      App.showToast('Urutan field berhasil diperbarui!', 'success');
    }
    return false;
  }

  function handleDragEnd() {
    this.style.opacity = '1';
    dragEl = null;
  }

  // ============ Live Preview Refresh ============
  function updatePreview() {
    fieldsCache = Store.getFormFields(selectedEventId);
    const container = document.getElementById('previewFormContent');
    if (container) {
      container.innerHTML = renderFormPreview();
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
