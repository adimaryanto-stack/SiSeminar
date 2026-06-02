/* ============================================================
   SiSeminar — questionnaire.js
   Questionnaire & Feedback Module (Builder, Form, and Results)
   ============================================================ */

const QuestionnairePage = (() => {
  let activeEvent = null;
  let activeQuestionnaire = null;

  // ============ 1. Questionnaire Builder (Admin View) ============
  function renderBuilder(eventId) {
    const container = App.getPageContent();
    if (!container) return;

    activeEvent = Store.getEventById(eventId);
    if (!activeEvent) {
      container.innerHTML = `<div class="empty-state"><h3>Event Tidak Ditemukan</h3><a href="#events" class="btn btn-primary mt-4">Kembali</a></div>`;
      return;
    }

    activeQuestionnaire = Store.getQuestionnaire(eventId) || {
      title: 'Evaluasi Seminar: ' + activeEvent.title,
      description: 'Mohon luangkan waktu 1 menit untuk mengisi kuesioner feedback evaluasi seminar kami.',
      questions: [
        { id: 'q_default_1', type: 'rating', label: 'Bagaimana penilaian Anda terhadap materi seminar ini?', required: true },
        { id: 'q_default_2', type: 'choice', label: 'Apakah topik seminar ini bermanfaat bagi Anda?', options: ['Sangat Bermanfaat', 'Cukup Bermanfaat', 'Kurang Bermanfaat'], required: true },
        { id: 'q_default_3', type: 'text', label: 'Tuliskan kritik, saran, atau masukan untuk perbaikan seminar kami berikutnya:', required: false }
      ]
    };

    container.innerHTML = `
      <div class="animate-fade-in mb-12">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8 wrap gap-4">
          <div>
            <h1 class="page-title">Builder Kuesioner Evaluasi</h1>
            <div class="breadcrumbs">
              <a href="#events">Manajemen Event</a>
              <span class="separator">/</span>
              <span>Builder Kuesioner</span>
            </div>
          </div>
          <div class="flex gap-3">
            <a href="#events" class="btn btn-secondary">Batal</a>
            <button class="btn btn-primary" id="btnSaveBuilder">
              <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
              Simpan Template Kuesioner
            </button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-6" style="grid-template-columns: 1.2fr 1.8fr; align-items: start;">
          <!-- Left: General Config -->
          <div class="card flex flex-col gap-4" style="padding: var(--space-6);">
            <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--primary);">Informasi Kuesioner</h3>
            
            <div class="form-group">
              <label class="form-label" for="qTitle">Judul Kuesioner <span style="color:var(--destructive-red);">*</span></label>
              <input type="text" class="form-input" id="qTitle" value="${escapeHtml(activeQuestionnaire.title)}" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="qDesc">Deskripsi Kuesioner</label>
              <textarea class="form-input" id="qDesc" rows="4" style="resize:vertical;">${escapeHtml(activeQuestionnaire.description)}</textarea>
            </div>

            <div style="background: var(--surface-container-low); border: 1px solid var(--border-subtle); padding: var(--space-4); border-radius: var(--radius-md); font-size: 12px; color: var(--outline); line-height: 1.5;">
              <h4 style="font-weight: 600; color: var(--on-surface); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                <span class="material-symbols-outlined" style="font-size: 16px; color: var(--teal-accent);">info</span>
                Info Kuesioner
              </h4>
              Kuesioner evaluasi ini akan otomatis tampil di Portal Peserta setelah mereka terdaftar atau ketika seminar selesai dilaksanakan untuk menghimpun data umpan balik secara real-time.
            </div>
          </div>

          <!-- Right: Questions List Editor -->
          <div class="flex flex-col gap-4">
            <div class="card" style="padding: var(--space-6);">
              <div class="flex items-center justify-between mb-4">
                <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--primary);">Daftar Pertanyaan</h3>
                
                <div style="position: relative;">
                  <button class="btn btn-secondary btn-sm" id="btnShowAddOptions">
                    <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
                    Tambah Pertanyaan
                  </button>
                  <div class="action-dropdown" id="addQuestionDropdown" style="display:none; position: absolute; right: 0; top: 36px; background: white; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; min-width: 180px; display: none; flex-direction: column;">
                    <button class="action-dropdown-item add-q-btn" data-type="rating" style="display:flex; align-items:center; gap:8px; padding:10px 14px; border:none; background:transparent; cursor:pointer; font-size:13px;">
                      <span class="material-symbols-outlined" style="color:var(--amber-accent);">star</span> Penilaian (Rating 1-5)
                    </button>
                    <button class="action-dropdown-item add-q-btn" data-type="choice" style="display:flex; align-items:center; gap:8px; padding:10px 14px; border:none; background:transparent; cursor:pointer; font-size:13px; border-top:1px solid var(--border-subtle);">
                      <span class="material-symbols-outlined" style="color:var(--teal-accent);">list</span> Pilihan Ganda
                    </button>
                    <button class="action-dropdown-item add-q-btn" data-type="text" style="display:flex; align-items:center; gap:8px; padding:10px 14px; border:none; background:transparent; cursor:pointer; font-size:13px; border-top:1px solid var(--border-subtle);">
                      <span class="material-symbols-outlined" style="color:var(--primary);">subject</span> Teks Bebas / Essay
                    </button>
                  </div>
                </div>
              </div>

              <!-- Questions Container -->
              <div class="flex flex-col gap-4" id="questionsContainer">
                <!-- Injected dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    renderQuestionsList();
    bindBuilderEvents(eventId);
  }

  function renderQuestionsList() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    if (activeQuestionnaire.questions.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: var(--space-8); background: var(--surface-container-low); border: 2px dashed var(--border-subtle); border-radius: var(--radius-md);">
          <span class="material-symbols-outlined" style="font-size:36px; color: var(--outline);">quiz</span>
          <p style="font-size:13px; color: var(--outline); margin-top: 8px;">Belum ada pertanyaan. Silakan tambahkan pertanyaan baru!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = activeQuestionnaire.questions.map((q, idx) => {
      let icon = 'subject';
      let colorClass = 'text-primary';
      let previewHtml = '';

      if (q.type === 'rating') {
        icon = 'star';
        colorClass = 'text-amber';
        previewHtml = `
          <div style="display:flex; gap:6px; color: var(--outline); margin-top: var(--space-2);">
            <span class="material-symbols-outlined" style="font-size:20px;">star</span>
            <span class="material-symbols-outlined" style="font-size:20px;">star</span>
            <span class="material-symbols-outlined" style="font-size:20px;">star</span>
            <span class="material-symbols-outlined" style="font-size:20px;">star</span>
            <span class="material-symbols-outlined" style="font-size:20px;">star</span>
          </div>
        `;
      } else if (q.type === 'choice') {
        icon = 'list';
        colorClass = 'text-teal';
        const opts = q.options || [];
        previewHtml = `
          <div style="display:flex; flex-direction:column; gap:6px; margin-top: var(--space-2);">
            ${opts.map(o => `
              <div style="display:flex; align-items:center; gap:8px; font-size:12px; color: var(--on-surface-variant);">
                <span class="material-symbols-outlined" style="font-size:16px;">radio_button_unchecked</span>
                ${escapeHtml(o)}
              </div>
            `).join('')}
            <div style="display:flex; gap:8px; margin-top:4px;">
              <input type="text" class="form-input btn-sm option-input-${q.id}" placeholder="Tambah opsi baru..." style="height:28px; font-size:11px; max-width:180px;">
              <button class="btn btn-secondary btn-sm btn-add-option" data-id="${q.id}" style="height:28px; padding:0 8px; font-size:11px;">Tambah Opsi</button>
            </div>
          </div>
        `;
      } else {
        previewHtml = `<input type="text" class="form-input" disabled placeholder="Kolom jawaban teks bebas..." style="margin-top:var(--space-2); height: 32px; font-size:12px; opacity:0.6;">`;
      }

      return `
        <div class="card flex flex-col gap-3" style="padding: var(--space-4); border: 1px solid var(--border-subtle); background: var(--surface-container-lowest);" data-idx="${idx}">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface-container-high); display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined ${colorClass}" style="font-size: 18px;">${icon}</span>
              </div>
              <div>
                <span style="font-size:11px; font-weight:600; text-transform:uppercase; color: var(--outline); letter-spacing:0.05em;">Pertanyaan ${idx + 1} (${q.type === 'rating' ? 'Penilaian' : q.type === 'choice' ? 'Pilihan Ganda' : 'Teks Bebas'})</span>
              </div>
            </div>
            <div class="flex gap-2">
              <label class="checkbox-wrapper" style="font-size:11px; padding: 4px 8px; background: var(--surface-container-low); border-radius: var(--radius-sm); border:1px solid var(--border-subtle); cursor:pointer;">
                <input type="checkbox" class="q-required-toggle" data-id="${q.id}" ${q.required ? 'checked' : ''} style="width:14px; height:14px;">
                Wajib diisi
              </label>
              <button class="topbar-icon-btn btn-delete-question" data-id="${q.id}" title="Hapus" style="color:var(--destructive-red); padding:4px;">
                <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
              </button>
            </div>
          </div>

          <div class="form-group" style="margin-top:2px;">
            <input type="text" class="form-input q-label-input" data-id="${q.id}" value="${escapeHtml(q.label)}" placeholder="Masukkan pertanyaan evaluasi di sini..." style="height:36px; font-size:13px; font-weight:500;">
          </div>

          ${previewHtml}
        </div>
      `;
    }).join('');

    bindBuilderListEvents();
  }

  function bindBuilderEvents(eventId) {
    const toggleBtn = document.getElementById('btnShowAddOptions');
    const dropdown = document.getElementById('addQuestionDropdown');

    if (toggleBtn && dropdown) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'flex';
        dropdown.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
      });
    }

    // Add Question buttons
    document.querySelectorAll('.add-q-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const newQ = {
          id: 'q_' + Date.now() + Math.random().toString(36).substring(2, 5),
          type: type,
          label: type === 'rating' ? 'Nilai materi/topik seminar' : type === 'choice' ? 'Topik pilihan ganda' : 'Kritik dan masukan bebas',
          required: true,
          options: type === 'choice' ? ['Sangat Baik', 'Cukup Baik', 'Perlu Ditingkatkan'] : []
        };
        activeQuestionnaire.questions.push(newQ);
        dropdown.style.display = 'none';
        renderQuestionsList();
        App.showToast('Pertanyaan baru ditambahkan!', 'success');
      });
    });

    // Save Template Button
    const saveBtn = document.getElementById('btnSaveBuilder');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const title = document.getElementById('qTitle').value.trim();
        const description = document.getElementById('qDesc').value.trim();

        if (!title) {
          App.showToast('Judul kuesioner wajib diisi!', 'error');
          return;
        }

        activeQuestionnaire.title = title;
        activeQuestionnaire.description = description;

        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner" style="border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; width: 14px; height: 14px; display: inline-block; animation: spin 1s linear infinite; margin-right: 6px;"></span> Menyimpan...`;

        try {
          await Store.saveQuestionnaire(eventId, activeQuestionnaire);
          App.showToast('Template kuesioner berhasil disimpan!', 'success');
          setTimeout(() => {
            window.location.hash = '#events';
          }, 1000);
        } catch (err) {
          console.error("Save template error:", err);
          App.showToast('Gagal menyimpan template.', 'error');
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">save</span> Simpan Template Kuesioner`;
        }
      });
    }
  }

  function bindBuilderListEvents() {
    // Required toggle
    document.querySelectorAll('.q-required-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        const qId = chk.dataset.id;
        const q = activeQuestionnaire.questions.find(item => item.id === qId);
        if (q) q.required = chk.checked;
      });
    });

    // Question Label Input
    document.querySelectorAll('.q-label-input').forEach(input => {
      input.addEventListener('input', () => {
        const qId = input.dataset.id;
        const q = activeQuestionnaire.questions.find(item => item.id === qId);
        if (q) q.label = input.value.trim();
      });
    });

    // Option additions for Multiple Choice
    document.querySelectorAll('.btn-add-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const qId = btn.dataset.id;
        const input = document.querySelector(`.option-input-${qId}`);
        const optVal = input ? input.value.trim() : '';

        if (!optVal) {
          App.showToast('Opsi pilihan ganda tidak boleh kosong!', 'error');
          return;
        }

        const q = activeQuestionnaire.questions.find(item => item.id === qId);
        if (q) {
          if (!q.options) q.options = [];
          q.options.push(optVal);
          input.value = '';
          renderQuestionsList();
          App.showToast('Opsi ditambahkan!', 'success');
        }
      });
    });

    // Delete question
    document.querySelectorAll('.btn-delete-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.dataset.id;
        activeQuestionnaire.questions = activeQuestionnaire.questions.filter(item => item.id !== qId);
        renderQuestionsList();
        App.showToast('Pertanyaan dihapus.', 'info');
      });
    });
  }

  // ============ 2. Questionnaire Submission Form (Participant View) ============
  function renderForm(eventId) {
    const container = App.getPageContent();
    if (!container) return;

    const currentUser = Store.getCurrentUser();
    if (!currentUser) {
      container.innerHTML = `<div class="empty-state"><h3>Silakan Login Terlebih Dahulu</h3><a href="#login" class="btn btn-primary mt-4">Login</a></div>`;
      return;
    }

    activeEvent = Store.getEventById(eventId);
    if (!activeEvent) {
      container.innerHTML = `<div class="empty-state"><h3>Event Tidak Ditemukan</h3><a href="#list-seminar" class="btn btn-primary mt-4">Kembali</a></div>`;
      return;
    }

    // Check if user has already filled questionnaire
    const hasFilled = Store.hasUserSubmittedFeedback(eventId, currentUser.id);
    if (hasFilled) {
      container.innerHTML = `
        <div class="participant-container animate-fade-in" style="max-width: 600px; margin: var(--space-12) auto; padding: 0 var(--space-4);">
          <div class="card" style="padding: var(--space-8); text-align: center; border-top: 6px solid var(--teal-accent);">
            <div style="background: var(--teal-accent); color: white; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-4);">
              <span class="material-symbols-outlined" style="font-size: 32px;">verified</span>
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--primary);">Evaluasi Sudah Diisi</h3>
            <p style="color: var(--outline); font-size: 14px; margin-top: var(--space-2);">Terima kasih, Anda sudah mengirimkan kuesioner evaluasi seminar ini sebelumnya.</p>
            <a href="#list-seminar" class="btn btn-primary mt-6" style="justify-content:center; width:100%;">Kembali Ke Portal</a>
          </div>
        </div>
      `;
      return;
    }

    activeQuestionnaire = Store.getQuestionnaire(eventId);
    // Fallback default if not seeded
    if (!activeQuestionnaire) {
      activeQuestionnaire = {
        title: 'Evaluasi Seminar: ' + activeEvent.title,
        description: 'Mohon luangkan waktu sejenak untuk membagikan pengalaman Anda demi peningkatan seminar kami.',
        questions: [
          { id: 'q_default_1', type: 'rating', label: 'Bagaimana penilaian Anda terhadap materi seminar ini?', required: true },
          { id: 'q_default_2', type: 'choice', label: 'Apakah topik seminar ini bermanfaat bagi Anda?', options: ['Sangat Bermanfaat', 'Cukup Bermanfaat', 'Kurang Bermanfaat'], required: true },
          { id: 'q_default_3', type: 'text', label: 'Tuliskan masukan bebas Anda untuk perbaikan acara berikutnya:', required: false }
        ]
      };
    }

    container.innerHTML = `
      <div class="participant-container animate-fade-in" style="max-width: 700px; margin: 0 auto; padding: var(--space-6) var(--space-4) var(--space-12);">
        <!-- Back Link -->
        <a href="#list-seminar" class="flex items-center gap-1 mb-6 text-primary" style="text-decoration:none; font-weight:600; font-size:13px;">
          <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span>
          Kembali Ke Portal Seminar Saya
        </a>

        <!-- Form Card -->
        <div class="registration-card animate-scale-in">
          <div style="border-bottom: 1px solid var(--border-subtle); padding-bottom: var(--space-4); margin-bottom: var(--space-5);">
            <div style="font-size:11px; font-weight:700; text-transform:uppercase; color: var(--teal-accent); margin-bottom:4px; letter-spacing:0.05em;">Form Evaluasi Feedback</div>
            <h2 style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--primary);">${escapeHtml(activeQuestionnaire.title)}</h2>
            <p style="color: var(--on-surface-variant); font-size: 13px; margin-top: 6px; line-height: 1.5;">${escapeHtml(activeQuestionnaire.description)}</p>
          </div>

          <!-- Progress Bar -->
          <div style="background: var(--surface-container-high); border-radius: var(--radius-full); height: 6px; position:relative; overflow:hidden; margin-bottom: var(--space-6);">
            <div id="progressIndicator" style="width: 0%; height:100%; background:var(--teal-accent); transition: width 0.3s ease;"></div>
          </div>

          <form id="feedbackForm" class="flex flex-col gap-6">
            ${activeQuestionnaire.questions.map((q, idx) => renderFormQuestion(q, idx)).join('')}

            <button type="submit" class="btn btn-primary btn-lg mt-6" style="justify-content: center; width: 100%;" id="btnSubmitFeedback">
              Kirim Kuesioner Evaluasi
              <span class="material-symbols-outlined" style="font-size: 20px;">send</span>
            </button>
          </form>
        </div>
      </div>
    `;

    bindFormEvents(eventId);
    updateFormProgress();
  }

  function renderFormQuestion(q, idx) {
    const requiredAsterisk = q.required ? '<span class="required" style="color:var(--destructive-red);">*</span>' : '';
    let inputHtml = '';

    if (q.type === 'rating') {
      inputHtml = `
        <div class="star-rating-container" style="display:flex; gap:12px; margin-top: var(--space-3);" data-id="${q.id}">
          ${[1, 2, 3, 4, 5].map(star => `
            <span class="material-symbols-outlined star-icon" data-val="${star}" style="font-size:36px; color: var(--surface-container-high); cursor:pointer; transition: transform var(--transition-fast) ease, color var(--transition-fast) ease;">star</span>
          `).join('')}
          <input type="hidden" class="feedback-input" data-id="${q.id}" data-type="rating" data-required="${q.required}" value="">
        </div>
      `;
    } else if (q.type === 'choice') {
      const opts = q.options || [];
      inputHtml = `
        <div class="flex flex-col gap-2 mt-3">
          ${opts.map((o, oIdx) => `
            <label class="consent-box flex items-center gap-3" style="padding:var(--space-3); border:1px solid var(--border-subtle); border-radius:var(--radius-md); background:var(--surface-container-lowest); cursor:pointer; transition: background var(--transition-fast) ease;">
              <input type="radio" name="radio-${q.id}" value="${escapeHtml(o)}" class="feedback-radio" data-id="${q.id}" style="width:18px; height:18px; accent-color: var(--teal-accent);">
              <span style="font-size:13px; color: var(--on-surface); font-weight: 500;">${escapeHtml(o)}</span>
            </label>
          `).join('')}
          <input type="hidden" class="feedback-input" data-id="${q.id}" data-type="choice" data-required="${q.required}" value="">
        </div>
      `;
    } else {
      inputHtml = `
        <textarea class="form-input feedback-input mt-3" data-id="${q.id}" data-type="text" data-required="${q.required}" rows="4" placeholder="Tuliskan jawaban lengkap Anda di sini..." style="resize:vertical;"></textarea>
      `;
    }

    return `
      <div class="form-group animate-slide-up" style="animation-delay: ${idx * 0.05}s; border:1px solid var(--border-subtle); background: var(--surface-container-low); padding: var(--space-5); border-radius: var(--radius-md);" id="fg-${q.id}">
        <label class="form-label" style="font-size:14px; font-weight:600; line-height:1.5; color: var(--primary);">
          ${idx + 1}. ${escapeHtml(q.label)} ${requiredAsterisk}
        </label>
        ${inputHtml}
        <div class="form-error" id="err-${q.id}" style="display: none; margin-top:4px;">Pertanyaan ini wajib dijawab!</div>
      </div>
    `;
  }

  function bindFormEvents(eventId) {
    // 1. Star Rating Hover/Click Interactions
    document.querySelectorAll('.star-rating-container').forEach(container => {
      const qId = container.dataset.id;
      const stars = container.querySelectorAll('.star-icon');
      const hiddenInput = container.querySelector('.feedback-input');

      stars.forEach(star => {
        star.addEventListener('click', () => {
          const val = parseInt(star.dataset.val);
          hiddenInput.value = val;

          // Paint stars
          stars.forEach(s => {
            const sVal = parseInt(s.dataset.val);
            if (sVal <= val) {
              s.style.color = 'var(--amber-accent)';
              s.style.transform = 'scale(1.1)';
            } else {
              s.style.color = 'var(--surface-container-high)';
              s.style.transform = 'scale(1.0)';
            }
          });

          updateFormProgress();
        });

        star.addEventListener('mouseenter', () => {
          const hoverVal = parseInt(star.dataset.val);
          stars.forEach(s => {
            const sVal = parseInt(s.dataset.val);
            if (sVal <= hoverVal) {
              s.style.color = 'var(--amber-accent)';
            }
          });
        });

        star.addEventListener('mouseleave', () => {
          const currentVal = parseInt(hiddenInput.value) || 0;
          stars.forEach(s => {
            const sVal = parseInt(s.dataset.val);
            if (sVal <= currentVal) {
              s.style.color = 'var(--amber-accent)';
            } else {
              s.style.color = 'var(--surface-container-high)';
            }
          });
        });
      });
    });

    // 2. Radio Choice Interactions
    document.querySelectorAll('.feedback-radio').forEach(radio => {
      radio.addEventListener('change', () => {
        const qId = radio.dataset.id;
        const hiddenInput = document.querySelector(`.feedback-input[data-id="${qId}"]`);
        if (hiddenInput) {
          hiddenInput.value = radio.value;
        }

        // Highlight selected box
        const radios = document.querySelectorAll(`input[name="radio-${qId}"]`);
        radios.forEach(r => {
          const parent = r.closest('label');
          if (parent) {
            if (r.checked) {
              parent.style.background = 'var(--surface-container-high)';
              parent.style.borderColor = 'var(--teal-accent)';
            } else {
              parent.style.background = 'var(--surface-container-lowest)';
              parent.style.borderColor = 'var(--border-subtle)';
            }
          }
        });

        updateFormProgress();
      });
    });

    // 3. Text Area Change interaction
    document.querySelectorAll('textarea.feedback-input').forEach(ta => {
      ta.addEventListener('input', () => {
        updateFormProgress();
      });
    });

    // 4. Submit Event
    const form = document.getElementById('feedbackForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(eventId);
      });
    }
  }

  function updateFormProgress() {
    if (!activeQuestionnaire) return;
    const questions = activeQuestionnaire.questions || [];
    let completedCount = 0;

    questions.forEach(q => {
      let answered = false;
      if (q.type === 'rating' || q.type === 'choice') {
        const input = document.querySelector(`.feedback-input[data-id="${q.id}"]`);
        if (input && input.value) answered = true;
      } else {
        const input = document.querySelector(`.feedback-input[data-id="${q.id}"]`);
        if (input && input.value.trim()) answered = true;
      }
      if (answered) completedCount++;
    });

    const progressEl = document.getElementById('progressIndicator');
    if (progressEl) {
      const pct = (completedCount / questions.length) * 100;
      progressEl.style.width = pct + '%';
    }
  }

  async function handleFormSubmit(eventId) {
    let isValid = true;
    const answers = [];

    // Clear previous errors
    document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-group').forEach(el => el.style.borderColor = 'var(--border-subtle)');

    activeQuestionnaire.questions.forEach(q => {
      let val = '';
      const input = document.querySelector(`.feedback-input[data-id="${q.id}"]`);
      if (input) {
        val = input.value.trim();
      }

      if (q.required && !val) {
        isValid = false;
        const errEl = document.getElementById(`err-${q.id}`);
        if (errEl) errEl.style.display = 'block';
        const groupEl = document.getElementById(`fg-${q.id}`);
        if (groupEl) groupEl.style.borderColor = 'var(--destructive-red)';
      }

      answers.push({
        questionId: q.id,
        label: q.label,
        type: q.type,
        value: val
      });
    });

    if (!isValid) {
      App.showToast('Mohon lengkapi seluruh kolom evaluasi wajib!', 'error');
      return;
    }

    const btnSubmit = document.getElementById('btnSubmitFeedback');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<span class="spinner" style="border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; width: 18px; height: 18px; display: inline-block; animation: spin 1s linear infinite; margin-right: 8px;"></span> Mengirim Evaluasi...`;
    }

    try {
      const res = await Store.submitFeedbackResponse({
        eventId: eventId,
        answers: answers
      });

      if (!res.success) {
        App.showToast(res.error || 'Gagal mengirim evaluasi.', 'error');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `Kirim Kuesioner Evaluasi <span class="material-symbols-outlined" style="font-size:20px;">send</span>`;
        }
        return;
      }

      // Show beautiful success screen
      renderSubmissionSuccess();
    } catch (err) {
      console.error("Feedback submit error:", err);
      App.showToast('Terjadi kesalahan database.', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `Kirim Kuesioner Evaluasi <span class="material-symbols-outlined" style="font-size:20px;">send</span>`;
      }
    }
  }

  function renderSubmissionSuccess() {
    const container = App.getPageContent();
    if (!container) return;

    // Beep sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {}

    container.innerHTML = `
      <div class="participant-container animate-fade-in" style="max-width: 600px; margin: var(--space-12) auto; padding: 0 var(--space-4);">
        <div class="card" style="padding: var(--space-10); text-align: center; box-shadow: var(--shadow-lg); border-top: 6px solid var(--teal-accent);">
          <div class="checkin-success-icon" style="background: var(--teal-accent); color: white; width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-6); box-shadow: 0 0 20px rgba(13,148,136,0.3);">
            <span class="material-symbols-outlined" style="font-size: 40px;">celebration</span>
          </div>

          <h2 style="font-family: var(--font-heading); font-size: 26px; font-weight: 700; color: var(--primary); margin-bottom: var(--space-2);">
            Terima Kasih Banyak!
          </h2>
          <p style="color: var(--on-surface-variant); font-size: 15px; margin-bottom: var(--space-8); line-height:1.6;">
            Masukan, saran, dan evaluasi Anda sangat berharga bagi kami untuk menyelenggarakan seminar yang lebih luar biasa di masa depan.<br>
            <span style="font-weight: 600; color: var(--on-surface);">${escapeHtml(activeEvent.title)}</span>
          </p>

          <a href="#list-seminar" class="btn btn-primary btn-lg" style="justify-content: center; width: 100%;">
            <span class="material-symbols-outlined" style="font-size: 20px;">home</span>
            Kembali Ke Portal Seminar Saya
          </a>
        </div>
      </div>
    `;
  }

  // ============ 3. Questionnaire Results Analysis (Admin View) ============
  function renderResults(eventId) {
    const container = App.getPageContent();
    if (!container) return;

    const events = Store.getEvents();
    if (!eventId && events.length > 0) {
      eventId = events[0].id;
    }

    if (!eventId) {
      container.innerHTML = `
        <div class="animate-fade-in mb-12">
          <!-- Page Header -->
          <div class="flex items-center justify-between mb-8 wrap gap-4">
            <div>
              <h1 class="page-title">Hasil Analisis Feedback</h1>
              <div class="breadcrumbs">
                <span>Dashboard</span>
                <span class="separator">/</span>
                <span class="active">Hasil Feedback</span>
              </div>
            </div>
            <a href="#events" class="btn btn-secondary">Kembali</a>
          </div>

          <div class="card empty-state" style="min-height:50vh;">
            <span class="material-symbols-outlined" style="font-size:56px;">query_stats</span>
            <h3>Belum Ada Event</h3>
            <p>Silakan buat event seminar baru terlebih dahulu untuk melihat analisis feedback.</p>
          </div>
        </div>
      `;
      return;
    }

    activeEvent = Store.getEventById(eventId);
    if (!activeEvent) {
      container.innerHTML = `<div class="empty-state"><h3>Event Tidak Ditemukan</h3><a href="#events" class="btn btn-primary mt-4">Kembali</a></div>`;
      return;
    }

    const eventOptions = events.map(e =>
      `<option value="${e.id}" ${e.id === eventId ? 'selected' : ''}>${escapeHtml(e.title)}</option>`
    ).join('');

    const template = Store.getQuestionnaire(eventId);
    const responses = Store.getFeedbackResponses(eventId);

    if (!template || template.questions.length === 0) {
      container.innerHTML = `
        <div class="animate-fade-in mb-12">
          <!-- Page Header -->
          <div class="flex items-center justify-between mb-8 wrap gap-4">
            <div>
              <h1 class="page-title">Hasil Analisis Feedback</h1>
              <div class="breadcrumbs">
                <span>Dashboard</span>
                <span class="separator">/</span>
                <span class="active">Hasil Feedback</span>
              </div>
            </div>
            <div class="flex gap-3">
              <select class="form-select" id="feedbackEventSelect" style="width: 250px; height: 38px; padding: 0 12px; border-radius: var(--radius-md);">
                ${eventOptions}
              </select>
              <a href="#events" class="btn btn-secondary">Kembali</a>
            </div>
          </div>

          <div class="card empty-state" style="min-height:50vh;">
            <span class="material-symbols-outlined" style="font-size:56px;">query_stats</span>
            <h3>Belum Ada Template Kuesioner</h3>
            <p>Silakan buat kuesioner evaluasi terlebih dahulu untuk event ini.</p>
            <a href="#questionnaire-builder?event=${eventId}" class="btn btn-primary mt-4">Buat Template Kuesioner</a>
          </div>
        </div>
      `;
      bindResultsDropdownOnly();
      return;
    }

    if (responses.length === 0) {
      container.innerHTML = `
        <div class="animate-fade-in mb-12">
          <!-- Page Header -->
          <div class="flex items-center justify-between mb-8 wrap gap-4">
            <div>
              <h1 class="page-title">Hasil Analisis Feedback</h1>
              <div class="breadcrumbs">
                <span>Dashboard</span>
                <span class="separator">/</span>
                <span class="active">Hasil Feedback</span>
              </div>
            </div>
            <div class="flex gap-3">
              <select class="form-select" id="feedbackEventSelect" style="width: 250px; height: 38px; padding: 0 12px; border-radius: var(--radius-md);">
                ${eventOptions}
              </select>
              <a href="#events" class="btn btn-secondary">Kembali</a>
            </div>
          </div>

          <div class="card empty-state" style="min-height:50vh;">
            <span class="material-symbols-outlined" style="font-size:56px;">insights</span>
            <h3>Belum Ada Responden</h3>
            <p>Template kuesioner "${escapeHtml(template.title)}" sudah aktif, tetapi belum ada peserta yang mengisi kuesioner.</p>
            <a href="#events" class="btn btn-secondary mt-4">Kembali Ke Event</a>
          </div>
        </div>
      `;
      bindResultsDropdownOnly();
      return;
    }

    // Process summary metrics
    const ratingQuestions = template.questions.filter(q => q.type === 'rating');
    const textQuestions = template.questions.filter(q => q.type === 'text');
    const choiceQuestions = template.questions.filter(q => q.type === 'choice');

    // 1. Calculate Average Rating score
    let overallRatingSum = 0;
    let totalRatingsCount = 0;
    const ratingAverages = {};

    ratingQuestions.forEach(q => {
      let sum = 0;
      let count = 0;
      responses.forEach(res => {
        const ans = res.answers?.find(a => a.questionId === q.id);
        if (ans && ans.value) {
          const val = parseInt(ans.value);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }
      });
      const avg = count > 0 ? (sum / count).toFixed(1) : '-';
      ratingAverages[q.id] = { avg, count, label: q.label };
      
      if (count > 0) {
        overallRatingSum += sum;
        totalRatingsCount += count;
      }
    });

    const overallAverage = totalRatingsCount > 0 ? (overallRatingSum / totalRatingsCount).toFixed(1) : '-';

    // 2. Choice Distribution counts
    const choiceDistributions = {};
    choiceQuestions.forEach(q => {
      const counts = {};
      (q.options || []).forEach(o => counts[o] = 0);
      
      responses.forEach(res => {
        const ans = res.answers?.find(a => a.questionId === q.id);
        if (ans && ans.value) {
          counts[ans.value] = (counts[ans.value] || 0) + 1;
        }
      });
      choiceDistributions[q.id] = { counts, label: q.label, total: responses.length };
    });

    container.innerHTML = `
      <div class="animate-fade-in mb-12">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8 wrap gap-4">
          <div>
            <h1 class="page-title">Hasil Analisis Feedback</h1>
            <div class="breadcrumbs">
              <span>Dashboard</span>
              <span class="separator">/</span>
              <span class="active">Hasil Feedback</span>
            </div>
          </div>
          <div class="flex gap-3">
            <select class="form-select" id="feedbackEventSelect" style="width: 250px; height: 38px; padding: 0 12px; border-radius: var(--radius-md);">
              ${eventOptions}
            </select>
            <button class="btn btn-secondary" id="btnExportFeedback">
              <span class="material-symbols-outlined" style="font-size:18px;">download</span>
              Ekspor Hasil (CSV)
            </button>
            <a href="#events" class="btn btn-secondary">Kembali</a>
          </div>
        </div>

        <!-- Seminar Title Info -->
        <div style="background: var(--surface-container-low); padding: var(--space-4) var(--space-6); border-radius: var(--radius-md); border:1px solid var(--border-subtle); margin-bottom: var(--space-6); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:11px; font-weight:700; color:var(--outline); text-transform:uppercase; letter-spacing:0.05em;">Seminar Terkait</div>
            <div style="font-size:15px; font-weight:600; color:var(--primary); margin-top:2px;">${escapeHtml(activeEvent.title)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; font-weight:700; color:var(--outline); text-transform:uppercase; letter-spacing:0.05em;">Total Responden</div>
            <div style="font-size:18px; font-weight:700; color:var(--teal-accent); margin-top:2px;">${responses.length} Peserta</div>
          </div>
        </div>

        <!-- Metric Widgets Row -->
        <div class="grid grid-cols-3 gap-6 mb-8" style="grid-template-columns: 1fr 1fr 1.2fr;">
          <!-- Overall Rating -->
          <div class="card flex flex-col items-center justify-center text-center" style="padding:var(--space-6); background: linear-gradient(135deg, var(--surface-container-high), var(--surface-container-low)); min-height:160px;">
            <span style="font-size:11px; font-weight:700; color:var(--outline); text-transform:uppercase; margin-bottom:4px; letter-spacing:0.05em;">Rata-rata Skor Rating</span>
            <div style="font-size: 48px; font-weight: 800; color: var(--amber-accent); display:flex; align-items:center; gap:4px;">
              ${overallAverage}
              <span class="material-symbols-outlined" style="font-size:40px;">star</span>
            </div>
            <span style="font-size:11px; color:var(--outline); margin-top:4px;">Dari total ${totalRatingsCount} pertanyaan penilaian</span>
          </div>

          <!-- Total Questions -->
          <div class="card flex flex-col items-center justify-center text-center" style="padding:var(--space-6); min-height:160px;">
            <span style="font-size:11px; font-weight:700; color:var(--outline); text-transform:uppercase; margin-bottom:4px; letter-spacing:0.05em;">Jumlah Pertanyaan</span>
            <div style="font-size:48px; font-weight:800; color:var(--primary);">${template.questions.length}</div>
            <span style="font-size:11px; color:var(--outline); margin-top:4px;">
              ${ratingQuestions.length} Rating | ${choiceQuestions.length} Opsi | ${textQuestions.length} Essay
            </span>
          </div>

          <!-- Satisfaction Gauge -->
          <div class="card flex flex-col items-center justify-center text-center" style="padding:var(--space-6); min-height:160px;">
            <span style="font-size:11px; font-weight:700; color:var(--outline); text-transform:uppercase; margin-bottom:4px; letter-spacing:0.05em;">Tingkat Kepuasan</span>
            <div style="font-size:42px; font-weight:800; color:var(--teal-accent);">
              ${overallAverage !== '-' ? Math.round((parseFloat(overallAverage) / 5) * 100) : 0}%
            </div>
            <span style="font-size:11px; color:var(--outline); margin-top:4px; line-height:1.4;">
              Berdasarkan persentase rating rata-rata dari seluruh responden
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6" style="grid-template-columns: 1.6fr 1.4fr; align-items: start;">
          <!-- Left Column: Rating details & Choice distributions -->
          <div class="flex flex-col gap-6">
            <!-- Ratings Breakdown -->
            ${ratingQuestions.length > 0 ? `
              <div class="card" style="padding:var(--space-6);">
                <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary); margin-bottom:var(--space-5); border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
                  Detail Skor Rating
                </h3>
                <div class="flex flex-col gap-5">
                  ${ratingQuestions.map((q, idx) => {
                    const avgData = ratingAverages[q.id] || { avg: '-', count: 0 };
                    const pct = avgData.avg !== '-' ? (parseFloat(avgData.avg) / 5) * 100 : 0;
                    return `
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <span style="font-size:13px; font-weight:600; color:var(--on-surface); line-height:1.4;">
                            ${idx + 1}. ${escapeHtml(q.label)}
                          </span>
                          <span style="font-size:14px; font-weight:700; color:var(--amber-accent); display:flex; align-items:center; gap:2px;">
                            ${avgData.avg} <span class="material-symbols-outlined" style="font-size:16px;">star</span>
                          </span>
                        </div>
                        <div style="background:var(--surface-container-high); border-radius:var(--radius-full); height:8px; overflow:hidden;">
                          <div style="width:${pct}%; height:100%; background:var(--amber-accent); border-radius:var(--radius-full);"></div>
                        </div>
                        <div style="font-size:11px; color:var(--outline); margin-top:4px; text-align:right;">
                          ${avgData.count} Jawaban
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Choice Distributions -->
            ${choiceQuestions.length > 0 ? choiceQuestions.map(q => {
              const dist = choiceDistributions[q.id] || { counts: {}, label: q.label, total: 1 };
              return `
                <div class="card" style="padding:var(--space-6);">
                  <h3 style="font-family:var(--font-heading); font-size:15px; font-weight:700; color:var(--primary); margin-bottom:var(--space-5); border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
                    Distribusi Pilihan: ${escapeHtml(dist.label)}
                  </h3>
                  <div class="flex flex-col gap-4">
                    ${Object.entries(dist.counts).map(([opt, count]) => {
                      const pct = dist.total > 0 ? Math.round((count / dist.total) * 100) : 0;
                      return `
                        <div>
                          <div class="flex items-center justify-between mb-1" style="font-size:12px;">
                            <span style="font-weight:600; color:var(--on-surface);">${escapeHtml(opt)}</span>
                            <span style="font-weight:700; color:var(--teal-accent);">${count} (${pct}%)</span>
                          </div>
                          <div style="background:var(--surface-container-high); border-radius:var(--radius-full); height:8px; overflow:hidden;">
                            <div style="width:${pct}%; height:100%; background:var(--teal-accent); border-radius:var(--radius-full);"></div>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('') : ''}
          </div>

          <!-- Right Column: Text Feedback Scroll -->
          <div class="card" style="padding:var(--space-6); max-height: 80vh; display:flex; flex-direction:column; overflow:hidden;">
            <h3 style="font-family:var(--font-heading); font-size:16px; font-weight:700; color:var(--primary); margin-bottom:var(--space-4); border-bottom:1px solid var(--border-subtle); padding-bottom:10px; flex-shrink:0;">
              Umpan Balik & Masukan Essay
            </h3>

            ${textQuestions.length === 0 ? `
              <div class="empty-state" style="padding:var(--space-6);">
                <span class="material-symbols-outlined">forum</span>
                <p style="font-size:12px; color:var(--outline);">Tidak ada pertanyaan esai di kuesioner ini.</p>
              </div>
            ` : `
              <div style="overflow-y:auto; flex-grow:1; display:flex; flex-direction:column; gap:4px; padding-right:6px;" class="custom-scroll">
                ${responses.map(res => {
                  return textQuestions.map(q => {
                    const ans = res.answers?.find(a => a.questionId === q.id);
                    const val = ans ? ans.value.trim() : '';
                    if (!val || val === '-') return '';
                    return `
                      <div style="background:var(--surface-container-low); border:1px solid var(--border-subtle); padding:var(--space-4); border-radius:var(--radius-md); margin-bottom: var(--space-3);" class="animate-scale-in">
                        <div class="flex items-center justify-between mb-2">
                          <span style="font-size:11px; font-weight:700; color:var(--primary);">${escapeHtml(res.userName)}</span>
                          <span style="font-size:10px; color:var(--outline);">${App.formatDate(res.submittedAt)}</span>
                        </div>
                        <div style="font-size:11px; font-weight:600; color:var(--outline); margin-bottom:4px; text-transform:uppercase; letter-spacing:0.05em;">Q: "${escapeHtml(q.label)}"</div>
                        <p style="font-size:13px; color:var(--on-surface-variant); line-height:1.5; font-style:italic;">
                          "${escapeHtml(val)}"
                        </p>
                      </div>
                    `;
                  }).join('');
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    bindResultsEvents(eventId, responses, template);
  }

  function bindResultsDropdownOnly() {
    const select = document.getElementById('feedbackEventSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        const val = e.target.value;
        window.location.hash = val ? `#feedback-results?event=${val}` : '#feedback-results';
      });
    }
  }

  function bindResultsEvents(eventId, responses, template) {
    bindResultsDropdownOnly();

    const exportBtn = document.getElementById('btnExportFeedback');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const csvData = [];

        responses.forEach(res => {
          const row = {
            'Nama Responden': res.userName,
            'Tanggal Isi': App.formatDate(res.submittedAt)
          };

          template.questions.forEach(q => {
            const ans = res.answers?.find(a => a.questionId === q.id);
            row[q.label] = ans ? ans.value : '';
          });

          csvData.push(row);
        });

        Store.exportCSV(csvData, `feedback_evaluasi_${eventId}.csv`);
        App.showToast('Hasil evaluasi berhasil diekspor!', 'success');
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
    renderBuilder,
    renderForm,
    renderResults
  };
})();
