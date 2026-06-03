/* ============================================================
   SiSeminar — form-builder.js
   Registration Form Builder Page Module (Admin Panel)
   Redesigned to match builder_form_registrasi reference design
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

    const selectedEvent = selectedEventId ? Store.getEventById(selectedEventId) : null;
    const eventTitle = selectedEvent ? escapeHtml(selectedEvent.title) : 'Pilih Event';

    const eventOptions = events.map(e =>
      `<option value="${e.id}" ${e.id === selectedEventId ? 'selected' : ''}>${escapeHtml(e.title)}</option>`
    ).join('');

    container.innerHTML = `
      <div class="animate-fade-in" style="padding-bottom: var(--space-10);">
        <!-- Page Header Section -->
        <div class="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <nav class="flex items-center gap-2 text-[12px] font-medium text-outline mb-1">
              <span>Management</span>
              <span class="material-symbols-outlined text-[14px]">chevron_right</span>
              <span class="text-primary font-bold">Form Builder</span>
            </nav>
            <h2 class="font-bold text-3xl font-heading text-on-surface" style="margin: 0;">Registration Form Builder</h2>
            <p class="text-on-surface-variant text-[14px] mt-1 max-w-2xl" style="margin: 0;">Desain form pendaftaran kustom untuk event <strong class="text-primary">"${eventTitle}"</strong>. Tambahkan, atur ulang, dan preview form yang akan dilihat peserta.</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <select class="bg-surface-container-low border border-border-subtle rounded-xl px-4 py-2.5 text-[13px] font-semibold text-on-surface focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer" id="builderEventSelect" style="min-width: 200px;">
              <option value="">Pilih Event...</option>
              ${eventOptions}
            </select>
            <button class="px-4 py-2.5 border border-primary text-primary rounded-xl font-bold text-[13px] flex items-center gap-2 bg-transparent hover:bg-surface-container-low transition-colors cursor-pointer" id="btnLivePreview" ${!selectedEventId ? 'disabled' : ''} style="${!selectedEventId ? 'opacity:0.5;cursor:not-allowed;' : ''}">
              <span class="material-symbols-outlined text-[18px]">visibility</span>
              Live Preview
            </button>
            <button class="px-4 py-2.5 bg-teal-accent hover:bg-secondary text-white rounded-xl font-bold text-[13px] flex items-center gap-2 border-0 cursor-pointer shadow-sm hover:shadow-md transition-all active:scale-95" id="btnSaveForm" ${!selectedEventId ? 'disabled' : ''} style="${!selectedEventId ? 'opacity:0.5;cursor:not-allowed;' : ''}">
              <span class="material-symbols-outlined text-[18px]">publish</span>
              Publish Changes
            </button>
          </div>
        </div>

        ${!selectedEventId ? `
          <div class="bg-surface-container-lowest border border-border-subtle rounded-xl p-16 flex flex-col items-center justify-center text-center" style="min-height: 400px;">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <span class="material-symbols-outlined text-primary" style="font-size: 36px;">dynamic_form</span>
            </div>
            <h3 class="font-bold text-xl font-heading text-on-surface mb-2">Pilih Event Terlebih Dahulu</h3>
            <p class="text-on-surface-variant text-[14px] max-w-md">Silakan pilih salah satu event aktif dari dropdown di atas untuk mulai membuat form pendaftaran.</p>
          </div>
        ` : `
          <!-- Workspace Grid: 12-col Layout -->
          <div class="grid grid-cols-12 gap-6" style="align-items: start;">
            
            <!-- LEFT COLUMN: Field Library & Builder (col-span-7) -->
            <div class="col-span-12 xl:col-span-7 flex flex-col gap-6">
              
              <!-- Add New Field Block -->
              <div class="bg-surface-container-lowest border border-border-subtle rounded-xl p-6">
                <h3 class="text-[11px] font-bold text-on-surface uppercase tracking-widest mb-4">Add New Field</h3>
                <div class="grid grid-cols-4 gap-4">
                  <button class="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-border-subtle rounded-xl bg-transparent hover:border-teal-accent hover:bg-surface-container-low transition-all cursor-pointer group btn-add-field" data-type="text" style="min-height: 80px;">
                    <span class="material-symbols-outlined text-outline group-hover:text-teal-accent transition-colors" style="font-size: 24px;">text_fields</span>
                    <span class="text-[12px] font-semibold text-on-surface-variant">Text</span>
                  </button>
                  <button class="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-border-subtle rounded-xl bg-transparent hover:border-teal-accent hover:bg-surface-container-low transition-all cursor-pointer group btn-add-field" data-type="number" style="min-height: 80px;">
                    <span class="material-symbols-outlined text-outline group-hover:text-teal-accent transition-colors" style="font-size: 24px;">pin</span>
                    <span class="text-[12px] font-semibold text-on-surface-variant">Number</span>
                  </button>
                  <button class="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-border-subtle rounded-xl bg-transparent hover:border-teal-accent hover:bg-surface-container-low transition-all cursor-pointer group btn-add-field" data-type="dropdown" style="min-height: 80px;">
                    <span class="material-symbols-outlined text-outline group-hover:text-teal-accent transition-colors" style="font-size: 24px;">arrow_drop_down_circle</span>
                    <span class="text-[12px] font-semibold text-on-surface-variant">Dropdown</span>
                  </button>
                  <button class="flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-border-subtle rounded-xl bg-transparent hover:border-teal-accent hover:bg-surface-container-low transition-all cursor-pointer group btn-add-field" data-type="checkbox" style="min-height: 80px;">
                    <span class="material-symbols-outlined text-outline group-hover:text-teal-accent transition-colors" style="font-size: 24px;">check_box</span>
                    <span class="text-[12px] font-semibold text-on-surface-variant">Checkbox</span>
                  </button>
                </div>
              </div>

              <!-- Form Structure Block -->
              <div>
                <div class="flex items-center justify-between mb-4">
                  <h3 class="font-bold text-xl font-heading text-primary" style="margin: 0;">Form Structure</h3>
                  <span class="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-[11px] font-semibold">${fieldsCache.length} Fields Configured</span>
                </div>

                <div id="fieldsContainer" class="flex flex-col gap-4">
                  ${fieldsCache.length === 0 ? `
                    <div class="border-2 border-dashed border-border-subtle rounded-xl py-8 flex flex-col items-center justify-center text-on-surface-variant cursor-pointer hover:bg-surface-container-low hover:border-primary transition-all" style="opacity: 0.6;">
                      <span class="material-symbols-outlined mb-2" style="font-size: 36px;">add_circle</span>
                      <p class="text-[13px] font-semibold">Click to add more fields</p>
                    </div>
                  ` : fieldsCache.map((field, idx) => renderFieldCard(field, idx)).join('')}
                </div>

                ${fieldsCache.length > 0 ? `
                  <!-- Delete Whole Form Action -->
                  <div class="mt-6 flex justify-end">
                    <button class="px-4 py-2 border border-destructive-red/30 text-destructive-red rounded-xl text-[12px] font-semibold bg-transparent hover:bg-destructive-red/5 transition-colors cursor-pointer flex items-center gap-2" id="btnDeleteWholeForm">
                      <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
                      Hapus Semua Field Kustom
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- RIGHT COLUMN: Live Preview Pane (col-span-5) -->
            <div class="col-span-12 xl:col-span-5">
              <div class="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col" style="position: sticky; top: 90px; max-height: 700px;">
                <!-- Preview Header -->
                <div class="bg-primary p-6 text-white">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-[18px]" style="opacity: 0.8;">devices</span>
                    <span class="text-[11px] uppercase tracking-widest font-semibold" style="opacity: 0.8;">Participant View Preview</span>
                  </div>
                  <h4 class="font-bold text-lg" style="margin: 0;">Seminar Registration</h4>
                </div>
                
                <!-- Preview Content -->
                <div class="p-8 flex-grow overflow-y-auto bg-surface-container-lowest" id="previewFormContent" style="scrollbar-width: thin;">
                  <div class="flex flex-col gap-6">
                    ${renderFormPreview()}
                  </div>
                  <button class="w-full py-4 bg-primary text-white rounded-xl font-bold text-[16px] shadow-md mt-8 border-0 cursor-not-allowed" style="opacity: 0.5;" disabled>
                    Register Now
                  </button>
                  <p class="text-center text-[13px] text-on-surface-variant mt-4" style="opacity: 0.6;">
                    Already registered? <a class="text-primary font-semibold" href="#" style="text-decoration: none;">Check Status</a>
                  </p>
                </div>
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
      text: `<span class="bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Short Text</span>`,
      number: `<span class="bg-teal-accent/10 text-teal-accent px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Number</span>`,
      dropdown: `<span class="bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Dropdown</span>`,
      checkbox: `<span class="bg-purple-500/10 text-purple-600 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide">Checkbox</span>`
    };

    const requiredBadge = isProtected 
      ? `<span class="text-[10px] text-outline font-medium">(Required)</span>`
      : '';

    return `
      <div class="group bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden flex items-start gap-4 hover:border-primary transition-all relative field-card animate-slide-up" 
           draggable="true" 
           data-id="${field.id}" 
           data-idx="${idx}"
           style="cursor: grab; animation-delay: ${idx * 0.03}s;">
        
        <!-- Left Accent Bar -->
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:bg-teal-accent transition-colors"></div>
        
        <!-- Drag Handle -->
        <div class="mt-5 ml-4 text-outline cursor-move drag-handle" style="opacity: 0.4;">
          <span class="material-symbols-outlined">drag_indicator</span>
        </div>

        <!-- Field Content -->
        <div class="flex-grow py-5 pr-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Field Label</label>
              <input type="text" 
                     class="w-full border border-border-subtle rounded-lg text-[14px] font-medium h-10 px-3 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all field-label-input" 
                     data-id="${field.id}" 
                     value="${escapeHtml(field.label)}" 
                     placeholder="Enter label..." 
                     ${isProtected ? 'readonly style="background: var(--surface-container-low); cursor: default;"' : ''}>
            </div>
            <div>
              <label class="block text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Type</label>
              <div class="h-10 px-3 bg-surface-container-low rounded-lg flex items-center text-[14px] text-on-surface gap-2">
                ${typeLabels[field.fieldType] || typeLabels.text}
                ${requiredBadge}
              </div>
            </div>
          </div>

          ${field.fieldType === 'dropdown' ? `
            <div class="mt-3">
              <label class="block text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Pilihan Dropdown (Pisahkan dengan Koma)</label>
              <input type="text" 
                     class="w-full border border-border-subtle rounded-lg text-[13px] h-10 px-3 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all field-options-input" 
                     data-id="${field.id}" 
                     value="${escapeHtml(field.options.join(', '))}" 
                     placeholder="Pilihan A, Pilihan B, Pilihan C">
            </div>
          ` : ''}

          ${field.fieldType === 'checkbox' ? `
            <div class="mt-3">
              <label class="block text-[12px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Consent Clause Description</label>
              <textarea class="w-full border border-border-subtle rounded-lg text-[13px] p-3 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all field-placeholder-input" 
                        data-id="${field.id}" 
                        rows="2"
                        placeholder="Masukkan klausul persetujuan peserta...">${escapeHtml(field.placeholder)}</textarea>
            </div>
          ` : ''}

          <!-- Toggle & Actions Row -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle/50">
            <label class="flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-on-surface-variant">
              <input type="checkbox" class="w-4 h-4 rounded border-border-subtle text-teal-accent focus:ring-teal-accent field-required-toggle" data-id="${field.id}" ${field.isRequired ? 'checked' : ''} ${isProtected ? 'disabled' : ''}>
              Wajib Diisi
            </label>
            ${!isProtected ? `
              <button class="p-2 text-outline hover:text-destructive-red transition-colors bg-transparent border-0 cursor-pointer rounded-lg hover:bg-destructive-red/5 btn-delete-field" data-id="${field.id}" title="Hapus Field">
                <span class="material-symbols-outlined text-[20px]">delete</span>
              </button>
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
        <div class="text-center py-12" style="opacity: 0.5;">
          <span class="material-symbols-outlined mb-2" style="font-size: 36px; color: var(--outline);">assignment</span>
          <p class="text-[13px] text-on-surface-variant font-medium">Form kosong, silakan tambah field</p>
        </div>
      `;
    }

    return fieldsCache.map(field => {
      const requiredMark = field.isRequired ? '<span class="text-destructive-red">*</span>' : '';

      if (field.fieldType === 'text') {
        return `
          <div>
            <label class="block text-[13px] font-semibold text-on-surface mb-2">${escapeHtml(field.label)} ${requiredMark}</label>
            <input type="text" class="w-full border border-border-subtle rounded-lg text-[13px] h-10 bg-white px-3" placeholder="${escapeHtml(field.placeholder || 'e.g. Masukkan teks...')}" disabled>
          </div>
        `;
      }

      if (field.fieldType === 'number') {
        const isPhone = field.label.toLowerCase().includes('whatsapp') || field.label.toLowerCase().includes('telepon');
        if (isPhone) {
          return `
            <div>
              <label class="block text-[13px] font-semibold text-on-surface mb-2">${escapeHtml(field.label)} ${requiredMark}</label>
              <div class="relative">
                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-on-surface-variant border-r border-border-subtle pr-2">+62</div>
                <input type="text" class="w-full border border-border-subtle rounded-lg text-[13px] h-10 pl-14 bg-white" placeholder="812-3456-7890" disabled>
              </div>
            </div>
          `;
        }
        return `
          <div>
            <label class="block text-[13px] font-semibold text-on-surface mb-2">${escapeHtml(field.label)} ${requiredMark}</label>
            <input type="number" class="w-full border border-border-subtle rounded-lg text-[13px] h-10 bg-white px-3" placeholder="${escapeHtml(field.placeholder || 'Masukkan angka...')}" disabled>
          </div>
        `;
      }

      if (field.fieldType === 'dropdown') {
        const opts = field.options.length > 0 ? field.options : ['Pilihan 1', 'Pilihan 2'];
        return `
          <div>
            <label class="block text-[13px] font-semibold text-on-surface mb-2">${escapeHtml(field.label)} ${requiredMark}</label>
            <select class="w-full border border-border-subtle rounded-lg text-[13px] h-10 bg-white px-3" disabled>
              <option value="">${escapeHtml(field.placeholder || 'Pilih salah satu...')}</option>
              ${opts.map(o => `<option>${escapeHtml(o)}</option>`).join('')}
            </select>
          </div>
        `;
      }

      if (field.fieldType === 'checkbox') {
        return `
          <div class="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl border border-border-subtle">
            <input type="checkbox" class="w-5 h-5 rounded border-border-subtle text-teal-accent focus:ring-teal-accent mt-0.5" disabled>
            <div class="text-[13px] text-on-surface">
              <span class="font-bold block mb-1">${escapeHtml(field.label)}</span>
              ${escapeHtml(field.placeholder || 'Saya setuju dengan ketentuan yang berlaku.')} ${requiredMark}
              <a class="text-teal-accent underline ml-1" href="#" style="font-size: 12px;">Read full policy.</a>
            </div>
          </div>
        `;
      }

      return '';
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
    this.style.transform = 'scale(0.98)';
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
    this.style.transform = 'scale(1)';
    dragEl = null;
  }

  // ============ Live Preview Refresh ============
  function updatePreview() {
    fieldsCache = Store.getFormFields(selectedEventId);
    const container = document.getElementById('previewFormContent');
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col gap-6">
          ${renderFormPreview()}
        </div>
        <button class="w-full py-4 bg-primary text-white rounded-xl font-bold text-[16px] shadow-md mt-8 border-0 cursor-not-allowed" style="opacity: 0.5;" disabled>
          Register Now
        </button>
        <p class="text-center text-[13px] text-on-surface-variant mt-4" style="opacity: 0.6;">
          Already registered? <a class="text-primary font-semibold" href="#" style="text-decoration: none;">Check Status</a>
        </p>
      `;
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
