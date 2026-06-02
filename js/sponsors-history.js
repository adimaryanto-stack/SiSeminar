/* ============================================================
   SiSeminar — sponsors-history.js
   Sponsor Directory & Past Events History Module (SPA Component)
   ============================================================ */

const SponsorsHistoryPage = (() => {
  let activeViewTab = 'sponsors'; // 'sponsors' or 'past-events'

  // ============ Main Render ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    const currentUser = Store.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    // For participants, enforce tab 'past-events'
    if (!isAdmin) {
      activeViewTab = 'past-events';
    }

    const allEvents = Store.getEvents();
    const today = new Date().toISOString().split('T')[0];
    
    // Past events filter
    const pastEvents = allEvents.filter(e => e.date < today);

    // Extract all unique sponsors (admin only)
    const sponsorsMap = {};
    let sponsorsList = [];
    
    if (isAdmin) {
      // Add some default curated premium sponsors to look WOW
      const defaultSponsorData = {
        'Anakku.id': { desc: 'Platform Edukasi & Pengasuhan Anak Terkemuka di Indonesia.', url: 'https://anakku.id', logoText: 'AK' },
        'InsForge': { desc: 'All-in-One Serverless PostgreSQL & Realtime Backend Platform.', url: 'https://insforge.dev', logoText: 'IF' },
        'Google DeepMind': { desc: 'Pionir penelitian Kecerdasan Buatan (AI) global terdepan.', url: 'https://deepmind.google', logoText: 'DM' },
        'Telkom Indonesia': { desc: 'BUMN Telekomunikasi terbesar penyedia jaringan internet berkualitas.', url: 'https://telkom.co.id', logoText: 'TL' },
        'Bank Mandiri': { desc: 'Mitra finansial terpercaya untuk transaksi aman & terintegrasi.', url: 'https://bankmandiri.co.id', logoText: 'BM' }
      };

      // Populate actual event sponsorships
      allEvents.forEach(event => {
        const sponsors = event.sponsors || ['Anakku.id', 'InsForge'];
        sponsors.forEach(sp => {
          if (!sponsorsMap[sp]) {
            sponsorsMap[sp] = {
              name: sp,
              desc: defaultSponsorData[sp]?.desc || 'Mitra sponsor pendukung suksesnya rangkaian seminar parenting dan teknologi.',
              url: defaultSponsorData[sp]?.url || '#',
              logoText: defaultSponsorData[sp]?.logoText || sp.substring(0, 2).toUpperCase(),
              eventsCount: 0,
              events: []
            };
          }
          sponsorsMap[sp].eventsCount++;
          sponsorsMap[sp].events.push(event.title);
        });
      });
      sponsorsList = Object.values(sponsorsMap);
    }

    // Dynamic Headers based on user role
    const pageTitle = isAdmin ? 'Sponsor & Riwayat Portofolio' : 'Riwayat Seminar & Webinar';
    const breadcrumbLabel = isAdmin ? 'Sponsor & Riwayat' : 'Riwayat';

    // Dynamic Metric Cards based on user role
    const metricCardsHtml = isAdmin ? `
      <!-- Metric Cards (Admin: 3 columns) -->
      <div class="grid grid-cols-3 gap-6 mb-8" style="grid-template-columns: 1fr 1fr 1fr;">
        <div class="card flex items-center gap-4" style="padding: var(--space-5); background: var(--surface-container-low); border-left: 4px solid var(--primary);">
          <div style="background: rgba(30,58,138,0.1); color: var(--primary); width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 26px;">handshake</span>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--primary); line-height: 1.2;">${sponsorsList.length}</div>
            <div style="font-size: 12px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Mitra Sponsor</div>
          </div>
        </div>

        <div class="card flex items-center gap-4" style="padding: var(--space-5); background: var(--surface-container-low); border-left: 4px solid var(--teal-accent);">
          <div style="background: rgba(13,148,136,0.1); color: var(--teal-accent); width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 26px;">history</span>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--primary); line-height: 1.2;">${pastEvents.length}</div>
            <div style="font-size: 12px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Seminar Selesai</div>
          </div>
        </div>

        <div class="card flex items-center gap-4" style="padding: var(--space-5); background: var(--surface-container-low); border-left: 4px solid var(--amber-accent);">
          <div style="background: rgba(245,158,11,0.1); color: var(--amber-accent); width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 26px;">workspace_premium</span>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--primary); line-height: 1.2;">
              ${pastEvents.filter(e => e.category === 'Webinar').length}W | ${pastEvents.filter(e => e.category !== 'Webinar').length}S
            </div>
            <div style="font-size: 12px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Webinar & Seminar</div>
          </div>
        </div>
      </div>
    ` : `
      <!-- Metric Cards (Peserta: 2 columns) -->
      <div class="grid grid-cols-2 gap-6 mb-8" style="grid-template-columns: 1fr 1fr;">
        <div class="card flex items-center gap-4" style="padding: var(--space-5); background: var(--surface-container-low); border-left: 4px solid var(--teal-accent);">
          <div style="background: rgba(13,148,136,0.1); color: var(--teal-accent); width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 26px;">history</span>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--primary); line-height: 1.2;">${pastEvents.length}</div>
            <div style="font-size: 12px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Seminar Selesai</div>
          </div>
        </div>

        <div class="card flex items-center gap-4" style="padding: var(--space-5); background: var(--surface-container-low); border-left: 4px solid var(--amber-accent);">
          <div style="background: rgba(245,158,11,0.1); color: var(--amber-accent); width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 26px;">workspace_premium</span>
          </div>
          <div>
            <div style="font-size: 24px; font-weight: 800; color: var(--primary); line-height: 1.2;">
              ${pastEvents.filter(e => e.category === 'Webinar').length}W | ${pastEvents.filter(e => e.category !== 'Webinar').length}S
            </div>
            <div style="font-size: 12px; color: var(--outline); font-weight: 600; text-transform: uppercase;">Webinar & Seminar</div>
          </div>
        </div>
      </div>
    `;

    // Navigation Tabs only shown to Admin
    const tabsHtml = isAdmin ? `
      <!-- Navigation Tabs -->
      <div class="tabs-container" style="border-bottom: 1px solid var(--border-subtle); display: flex; gap: var(--space-6); margin-bottom: var(--space-6); padding-left: 4px;">
        <button class="tab-link ${activeViewTab === 'sponsors' ? 'active' : ''}" 
                id="tabViewSponsors" 
                style="background: none; border: none; font-family: var(--font-heading); font-size: 15px; font-weight: 600; padding: var(--space-2) 0 var(--space-3); color: ${activeViewTab === 'sponsors' ? 'var(--teal-accent)' : 'var(--outline)'}; border-bottom: 2px solid ${activeViewTab === 'sponsors' ? 'var(--teal-accent)' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
          Daftar Sponsor (${sponsorsList.length})
        </button>
        <button class="tab-link ${activeViewTab === 'past-events' ? 'active' : ''}" 
                id="tabViewPastEvents" 
                style="background: none; border: none; font-family: var(--font-heading); font-size: 15px; font-weight: 600; padding: var(--space-2) 0 var(--space-3); color: ${activeViewTab === 'past-events' ? 'var(--teal-accent)' : 'var(--outline)'}; border-bottom: 2px solid ${activeViewTab === 'past-events' ? 'var(--teal-accent)' : 'transparent'}; cursor: pointer; transition: all 0.2s;">
          Seminar & Webinar Selesai (${pastEvents.length})
        </button>
      </div>
    ` : '';

    container.innerHTML = `
      <div class="animate-fade-in" style="padding-bottom: var(--space-12);">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8 wrap gap-4">
          <div>
            <h1 class="page-title">${pageTitle}</h1>
            <div class="breadcrumbs">
              <span>Dashboard</span>
              <span class="separator">/</span>
              <span class="active">${breadcrumbLabel}</span>
            </div>
          </div>
        </div>

        ${metricCardsHtml}
        ${tabsHtml}

        <!-- Section Content -->
        <div id="tabContentSection">
          ${activeViewTab === 'sponsors' ? renderSponsorsSection(sponsorsList) : renderPastEventsSection(pastEvents)}
        </div>
      </div>
    `;

    bindEvents();
  }

  // ============ Render Sponsors Section ============
  function renderSponsorsSection(sponsors) {
    if (sponsors.length === 0) {
      return `
        <div class="empty-state card" style="padding: var(--space-10);">
          <span class="material-symbols-outlined" style="font-size: 48px; color: var(--outline);">handshake</span>
          <h3>Belum Ada Sponsor</h3>
          <p>Belum ada mitra sponsor yang terintegrasi di sistem saat ini.</p>
        </div>
      `;
    }

    // Cyclic vibrant gradient borders for sponsor logo avatars
    const logoGradients = [
      'linear-gradient(135deg, #3b82f6, #06b6d4)', // blue-teal
      'linear-gradient(135deg, #10b981, #059669)', // green
      'linear-gradient(135deg, #8b5cf6, #d946ef)', // purple-pink
      'linear-gradient(135deg, #f59e0b, #ec4899)'  // amber-pink
    ];

    return `
      <div class="grid grid-cols-2 gap-6" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
        ${sponsors.map((sp, idx) => {
          const grad = logoGradients[idx % logoGradients.length];
          return `
            <div class="card flex flex-col justify-between animate-scale-in" style="padding: var(--space-6); background: var(--surface-container-low); border: 1px solid var(--border-subtle); transition: transform 0.2s, box-shadow 0.2s;">
              <div>
                <div class="flex items-center gap-4 mb-4">
                  <!-- Custom Brand Avatar -->
                  <div style="background: ${grad}; color: white; width: 56px; height: 56px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; font-family: var(--font-heading); box-shadow: var(--shadow-md);">
                    ${escapeHtml(sp.logoText)}
                  </div>
                  <div>
                    <h3 style="font-family: var(--font-heading); font-size: 16.5px; font-weight: 700; color: var(--primary); margin: 0;">
                      ${escapeHtml(sp.name)}
                    </h3>
                    <a href="${sp.url}" target="_blank" style="font-size: 12px; color: var(--teal-accent); text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 2px; margin-top: 2px;">
                      <span class="material-symbols-outlined" style="font-size: 14px;">open_in_new</span>
                      Kunjungi Website
                    </a>
                  </div>
                </div>

                <p style="font-size: 13px; color: var(--on-surface-variant); line-height: 1.6; margin-bottom: var(--space-4);">
                  ${escapeHtml(sp.desc)}
                </p>
              </div>

              <!-- Sponsoring Events list -->
              <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4); margin-top: var(--space-2);">
                <div style="font-size: 11px; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);">
                  Mensponsori ${sp.eventsCount} Event
                </div>
                <div class="flex flex-col gap-2">
                  ${sp.events.map(ev => `
                    <div class="flex items-center gap-2" style="font-size: 12px; color: var(--on-surface); font-weight: 500;">
                      <span class="material-symbols-outlined" style="font-size:16px; color: var(--teal-accent);">bookmark</span>
                      <span class="text-truncate" style="max-width: 280px;" title="${escapeHtml(ev)}">${escapeHtml(ev)}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============ Render Past Events Section ============
  function renderPastEventsSection(events) {
    if (events.length === 0) {
      return `
        <div class="empty-state card" style="padding: var(--space-10);">
          <span class="material-symbols-outlined" style="font-size: 48px; color: var(--outline);">event_busy</span>
          <h3>Belum Ada Seminar Lampau</h3>
          <p>Belum ada seminar atau webinar yang masuk kategori selesai saat ini.</p>
        </div>
      `;
    }

    const currentUser = Store.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    return `
      <div class="grid grid-cols-2 gap-6" style="grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
        ${events.map((event, idx) => {
          const formattedDate = App.formatDate(event.date);
          
          // Cyclic colorful gradients
          const cardGradients = [
            'linear-gradient(135deg, #1e3a8a, #3b82f6)',
            'linear-gradient(135deg, #0f172a, #0d9488)',
            'linear-gradient(135deg, #4c1d95, #8b5cf6)',
            'linear-gradient(135deg, #881337, #ec4899)'
          ];
          const grad = cardGradients[idx % cardGradients.length];

          const categoryBadge = event.category === 'Webinar'
            ? `<span class="badge" style="font-size: 11px; background: rgba(13,148,136,0.15); color: #0d9488; border: 1px solid rgba(13,148,136,0.25); padding: 2px 8px; border-radius: 20px; font-weight:600;">WEBINAR</span>`
            : `<span class="badge" style="font-size: 11px; background: rgba(59,130,246,0.15); color: #2563eb; border: 1px solid rgba(59,130,246,0.25); padding: 2px 8px; border-radius: 20px; font-weight:600;">SEMINAR</span>`;

          const sponsors = event.sponsors || ['Anakku.id', 'InsForge'];

          // Only render sponsors section for admin role
          const sponsorsBlock = isAdmin ? `
            <!-- Sponsors badges inside -->
            <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-3); margin-top: var(--space-3);">
              <div style="font-size: 10px; font-weight: 700; color: var(--outline); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">Supported by:</div>
              <div class="flex flex-wrap gap-1.5">
                ${sponsors.map(sp => `
                  <span class="chip-source" style="background: var(--surface-container-high); color: var(--primary); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">
                    <span class="material-symbols-outlined" style="font-size:12px; color: var(--teal-accent);">stars</span>
                    ${escapeHtml(sp)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : '';

          return `
            <div class="card flex flex-col justify-between animate-scale-in" style="padding: 0; background: var(--surface-container-low); border: 1px solid var(--border-subtle); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;">
              
              <!-- Header Gradient bar -->
              <div style="background: ${grad}; padding: var(--space-4) var(--space-5); display: flex; justify-content: space-between; align-items: center; color: white;">
                ${categoryBadge}
                <div class="flex items-center gap-1" style="font-size: 11px; font-weight: 700; background: rgba(0,0,0,0.3); padding: 3px 8px; border-radius: 12px; backdrop-filter: blur(4px);">
                  <span class="material-symbols-outlined" style="font-size: 13px; color: #10b981;">check_circle</span>
                  SELESAI
                </div>
              </div>

              <!-- Card Body -->
              <div style="padding: var(--space-5);">
                <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--primary); margin: 0 0 var(--space-3); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(event.title)}">
                  ${escapeHtml(event.title)}
                </h3>
                
                <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--space-4);">
                  <div class="flex items-center gap-2" style="font-size: 12.5px; color: var(--outline); font-weight: 500;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">calendar_month</span>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="flex items-center gap-2" style="font-size: 12.5px; color: var(--outline); font-weight: 500;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">location_on</span>
                    <span class="text-truncate" style="max-width: 280px;">${escapeHtml(event.location || 'Online')}</span>
                  </div>
                  <div class="flex items-center gap-2" style="font-size: 12.5px; color: var(--outline); font-weight: 500;">
                    <span class="material-symbols-outlined" style="font-size: 16px;">group</span>
                    <span>${event.participantCount || 0} Peserta Menghadiri</span>
                  </div>
                </div>

                ${sponsorsBlock}

              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============ Event Bindings ============
  function bindEvents() {
    const tabSponsors = document.getElementById('tabViewSponsors');
    const tabPastEvents = document.getElementById('tabViewPastEvents');

    if (tabSponsors) {
      tabSponsors.addEventListener('click', () => {
        activeViewTab = 'sponsors';
        render();
      });
    }

    if (tabPastEvents) {
      tabPastEvents.addEventListener('click', () => {
        activeViewTab = 'past-events';
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
