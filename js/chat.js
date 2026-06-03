/* ============================================================
   SiSeminar — chat.js
   Chat Group Page Module — with InsForge Realtime
   ============================================================ */

const ChatPage = (() => {
  let selectedGroupId = null;
  let currentGroups = [];
  let realtimeSubscribed = null; // track currently subscribed channel
  let pollingInterval = null;    // fallback polling timer

  // ============ Main Render ============
  function render() {
    const container = App.getPageContent();
    if (!container) return;

    const user = Store.getCurrentUser();
    const isAdmin = Store.isAdmin();

    // Get groups based on role
    currentGroups = isAdmin
      ? Store.getChatGroups()
      : Store.getUserChatGroups(user.id);

    // If no groups, show empty state
    if (currentGroups.length === 0) {
      cleanupRealtime();
      container.innerHTML = renderEmptyState(isAdmin);
      if (isAdmin) {
        const createBtn = document.getElementById('btnCreateGroupEmpty');
        if (createBtn) createBtn.addEventListener('click', openCreateGroupModal);
      }
      return;
    }

    // Select first group if none selected or selected no longer exists
    if (!selectedGroupId || !currentGroups.find(g => g.id === selectedGroupId)) {
      selectedGroupId = currentGroups[0].id;
    }

    container.innerHTML = `
      <div class="chat-layout animate-fade-in">
        ${renderSidebar(isAdmin)}
        ${renderChatMain()}
      </div>
    `;

    bindSidebarEvents(isAdmin);
    bindChatEvents(isAdmin);
    scrollToBottom();

    // Subscribe to realtime channel for the selected group
    subscribeToGroup(selectedGroupId);
  }

  // ============ Realtime Subscription ============
  async function subscribeToGroup(groupId) {
    if (!groupId) return;

    const channelName = `chat:${groupId}`;

    // Already subscribed to this channel
    if (realtimeSubscribed === channelName) return;

    // Cleanup previous subscription
    cleanupRealtime();

    try {
      const sdk = window.insforge;
      if (!sdk || !sdk.realtime) {
        // Fallback: polling every 3 seconds
        startPolling(groupId);
        return;
      }

      // Connect to realtime server
      await sdk.realtime.connect();

      // Subscribe to the group channel
      const result = await sdk.realtime.subscribe(channelName);
      if (result.ok) {
        realtimeSubscribed = channelName;
        console.log(`[Realtime] Subscribed to ${channelName}`);

        // Listen for incoming messages
        sdk.realtime.on(`${channelName}:message`, (payload) => {
          handleIncomingMessage(payload, groupId);
        });
      } else {
        console.warn('[Realtime] Subscribe failed, falling back to polling');
        startPolling(groupId);
      }
    } catch (err) {
      console.warn('[Realtime] Connection failed, falling back to polling:', err.message);
      startPolling(groupId);
    }
  }

  function cleanupRealtime() {
    // Unsubscribe from previous channel
    if (realtimeSubscribed && window.insforge?.realtime) {
      window.insforge.realtime.off(`${realtimeSubscribed}:message`);
      window.insforge.realtime.unsubscribe(realtimeSubscribed);
      realtimeSubscribed = null;
    }

    // Stop polling if active
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }

  // ============ Fallback Polling ============
  function startPolling(groupId) {
    if (pollingInterval) clearInterval(pollingInterval);

    let lastMessageCount = Store.getMessages(groupId).length;

    pollingInterval = setInterval(() => {
      // Only poll if we're still on the chat page and same group
      if (selectedGroupId !== groupId) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        return;
      }

      const currentMessages = Store.getMessages(groupId);
      if (currentMessages.length > lastMessageCount) {
        const user = Store.getCurrentUser();
        // Append only the new messages that aren't from us
        const newMessages = currentMessages.slice(lastMessageCount);
        newMessages.forEach(msg => {
          if (msg.senderId !== user.id) {
            appendBubble(msg);
          }
        });
        lastMessageCount = currentMessages.length;
        updateSidebarGroupItem(groupId);
      }
    }, 3000); // Poll every 3 seconds
  }

  // ============ Handle Incoming Realtime Message ============
  function handleIncomingMessage(payload, groupId) {
    if (!payload || !payload.id) return;

    const user = Store.getCurrentUser();

    // Don't process our own messages (we already appended them optimistically)
    if (payload.senderId === user.id) return;

    // Check if message is for the currently selected group
    if (payload.groupId !== selectedGroupId) {
      // Update sidebar unread indicator for other groups
      updateSidebarGroupItem(payload.groupId);
      return;
    }

    // Add to local store (if not already there)
    const existing = Store.getMessages(groupId);
    if (!existing.find(m => m.id === payload.id)) {
      // Inject directly into localStorage without re-triggering DB write
      const allMessages = JSON.parse(localStorage.getItem('siseminar_messages') || '[]');
      allMessages.push(payload);
      localStorage.setItem('siseminar_messages', JSON.stringify(allMessages));
    }

    // Append bubble to chat
    appendBubble(payload);
    updateSidebarGroupItem(groupId);
  }

  // ============ Empty State ============
  function renderEmptyState(isAdmin) {
    return `
      <div class="empty-state animate-fade-in">
        <span class="material-symbols-outlined">forum</span>
        <h3>Belum Ada Grup Chat</h3>
        <p>Belum ada grup chat yang tersedia saat ini.</p>
        ${isAdmin ? `
          <button class="btn btn-primary mt-6" id="btnCreateGroupEmpty">
            <span class="material-symbols-outlined">add</span>
            Buat Grup Baru
          </button>
        ` : ''}
      </div>
    `;
  }

  // ============ Sidebar ============
  function renderSidebar(isAdmin) {
    const user = Store.getCurrentUser();

    return `
      <div class="chat-sidebar" id="chatSidebar">
        <div class="chat-sidebar-header">
          <div class="flex items-center justify-between">
            <h3 style="font-family: var(--font-heading); font-size: 18px; font-weight: 600;">Chat Grup</h3>
            ${isAdmin ? `
              <button class="btn btn-primary btn-sm" id="btnCreateGroup">
                <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
                Grup Baru
              </button>
            ` : ''}
          </div>
        </div>
        <div class="chat-group-list" id="chatGroupList">
          ${currentGroups.map(group => renderGroupItem(group, user)).join('')}
        </div>
      </div>
    `;
  }

  function renderGroupItem(group, user) {
    const lastMsg = Store.getLastMessage(group.id);
    const unread = Store.getUnreadCount(group.id, user.id);
    const initials = group.name.substring(0, 2).toUpperCase();
    const isActive = group.id === selectedGroupId;

    let lastMsgPreview = 'Belum ada pesan';
    let lastMsgTime = '';
    if (lastMsg) {
      lastMsgPreview = lastMsg.type === 'announcement'
        ? '📢 ' + truncate(lastMsg.content, 30)
        : truncate(lastMsg.content, 35);
      lastMsgTime = App.formatTime(lastMsg.createdAt);
    }

    return `
      <div class="chat-group-item ${isActive ? 'active' : ''}" data-group-id="${group.id}">
        <div class="chat-group-avatar">${initials}</div>
        <div class="chat-group-info">
          <div class="chat-group-name">${escapeHtml(group.name)}</div>
          <div class="chat-group-last">${escapeHtml(lastMsgPreview)}</div>
        </div>
        <div class="chat-group-meta">
          <div class="chat-group-time">${lastMsgTime}</div>
          ${unread > 0 ? `<div class="chat-unread-badge">${unread}</div>` : ''}
        </div>
      </div>
    `;
  }

  // ============ Chat Main Area ============
  function renderChatMain() {
    const group = Store.getChatGroupById(selectedGroupId);
    if (!group) return '<div class="chat-main"></div>';

    const members = Store.getChatMembers(group.id);
    const messages = Store.getMessages(group.id);
    const user = Store.getCurrentUser();
    const isAdmin = Store.isAdmin();
    const isLocked = !!group.isLocked;
    const isInputDisabled = !isAdmin && isLocked;
    const inputPlaceholder = isInputDisabled 
      ? '🔒 Grup dikunci. Hanya admin yang dapat mengirim pesan...' 
      : 'Ketik pesan...';

    return `
      <div class="chat-main">
        <div class="chat-header">
          <div>
            <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
              ${escapeHtml(group.name)}
              ${isLocked ? '<span class="material-symbols-outlined" style="font-size: 16px; color: var(--outline);" title="Grup dikunci oleh admin">lock</span>' : ''}
            </h3>
            <span style="font-size: 12px; color: var(--outline);">${members.length} anggota</span>
          </div>
          <div class="flex items-center gap-2">
            <span id="realtimeStatus" style="font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 12px; ${realtimeSubscribed ? 'background: rgba(16,185,129,0.15); color: #10B981;' : 'background: rgba(239,68,68,0.1); color: #EF4444;'}">${realtimeSubscribed ? '● LIVE' : '○ POLLING'}</span>
            <button class="topbar-icon-btn" id="btnGroupInfo" title="Info Grup">
              <span class="material-symbols-outlined">info</span>
            </button>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages">
          ${messages.length === 0
            ? `<div class="empty-state" style="padding: var(--space-8);">
                <span class="material-symbols-outlined" style="font-size: 48px;">chat</span>
                <p style="margin-top: var(--space-2);">Belum ada pesan. Mulai percakapan!</p>
              </div>`
            : messages.map(msg => renderBubble(msg, user)).join('')
          }
        </div>

        <div class="chat-input-area">
          ${isAdmin ? `
            <button class="topbar-icon-btn" id="btnBroadcast" title="Kirim Pengumuman">
              <span class="material-symbols-outlined">campaign</span>
            </button>
          ` : ''}
          <input type="text" class="chat-input" id="chatInput" placeholder="${inputPlaceholder}" autocomplete="off" ${isInputDisabled ? 'disabled' : ''}>
          <button class="chat-send-btn" id="btnSend" title="Kirim Pesan" ${isInputDisabled ? 'disabled' : ''}>
            <span class="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderBubble(msg, currentUser) {
    const isSent = msg.senderId === currentUser.id;
    const isAnnouncement = msg.type === 'announcement';

    let bubbleClass = 'chat-bubble';
    if (isAnnouncement) {
      bubbleClass += ' announcement';
    } else if (isSent) {
      bubbleClass += ' sent';
    } else {
      bubbleClass += ' received';
    }

    const senderLabel = isAnnouncement
      ? `<div class="chat-bubble-sender">📢 ${escapeHtml(msg.senderName || 'Admin')}</div>`
      : (!isSent ? `<div class="chat-bubble-sender">${escapeHtml(msg.senderName || 'Anonim')}</div>` : '');

    const contentHtml = escapeHtml(msg.content).replace(/\n/g, '<br>');

    return `
      <div class="${bubbleClass}">
        ${senderLabel}
        <div>${contentHtml}</div>
        <div class="chat-bubble-time">${App.formatTime(msg.createdAt)}</div>
      </div>
    `;
  }

  // ============ Event Bindings ============
  function bindSidebarEvents(isAdmin) {
    // Group item clicks
    document.querySelectorAll('.chat-group-item').forEach(item => {
      item.addEventListener('click', () => {
        const groupId = item.dataset.groupId;
        if (groupId === selectedGroupId) return;
        selectedGroupId = groupId;
        render();
      });
    });

    // Create group button
    if (isAdmin) {
      const createBtn = document.getElementById('btnCreateGroup');
      if (createBtn) createBtn.addEventListener('click', openCreateGroupModal);
    }
  }

  function bindChatEvents(isAdmin) {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('btnSend');
    const broadcastBtn = document.getElementById('btnBroadcast');
    const infoBtn = document.getElementById('btnGroupInfo');

    // Send message on click
    if (sendBtn) {
      sendBtn.addEventListener('click', () => sendMessage());
    }

    // Send message on Enter
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
      // Auto-focus the input
      input.focus();
    }

    // Broadcast button (Admin)
    if (broadcastBtn) {
      broadcastBtn.addEventListener('click', openBroadcastModal);
    }

    // Group Info button
    if (infoBtn) {
      infoBtn.addEventListener('click', showGroupInfo);
    }
  }

  // ============ Send Message (Optimistic + Realtime Publish) ============
  function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const content = input.value.trim();
    if (!content || !selectedGroupId) return;

    const user = Store.getCurrentUser();

    // 1. Build message object immediately (optimistic)
    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      groupId: selectedGroupId,
      senderId: user.id,
      senderName: user.name,
      content,
      type: 'text',
      createdAt: new Date().toISOString()
    };

    // 2. Append bubble instantly (zero latency for sender)
    appendBubble(msg);
    input.value = '';
    input.focus();

    // 3. Update sidebar last message immediately
    updateSidebarGroupItem(selectedGroupId);

    // 4. Save to localStorage immediately
    const allMessages = JSON.parse(localStorage.getItem('siseminar_messages') || '[]');
    allMessages.push(msg);
    localStorage.setItem('siseminar_messages', JSON.stringify(allMessages));

    // 5. Fire-and-forget: sync to database + publish to realtime
    (async () => {
      try {
        const sdk = window.insforge;
        if (!sdk) return;

        // Insert into database
        await sdk.database.from('messages').insert([{
          id: msg.id,
          group_id: msg.groupId,
          sender_id: msg.senderId,
          sender_name: msg.senderName,
          content: msg.content,
          type: msg.type,
          created_at: msg.createdAt
        }]);

        // Publish via realtime so other users get it instantly
        if (sdk.realtime && sdk.realtime.isConnected) {
          await sdk.realtime.publish(`chat:${selectedGroupId}`, 'message', msg);
        }
      } catch (err) {
        console.warn('[Chat] Background sync error (message still saved locally):', err.message);
      }
    })();
  }

  function appendBubble(msg) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    // Remove empty state if present
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Check if bubble already exists (prevent duplicates)
    if (container.querySelector(`[data-msg-id="${msg.id}"]`)) return;

    const user = Store.getCurrentUser();
    const isSent = msg.senderId === user.id;
    const isAnnouncement = msg.type === 'announcement';

    let bubbleClass = 'chat-bubble';
    if (isAnnouncement) bubbleClass += ' announcement';
    else if (isSent) bubbleClass += ' sent';
    else bubbleClass += ' received';

    const senderLabel = isAnnouncement
      ? `<div class="chat-bubble-sender">📢 ${escapeHtml(msg.senderName || 'Admin')}</div>`
      : (!isSent ? `<div class="chat-bubble-sender">${escapeHtml(msg.senderName || 'Anonim')}</div>` : '');

    const contentHtml = escapeHtml(msg.content).replace(/\n/g, '<br>');

    const bubbleEl = document.createElement('div');
    bubbleEl.className = bubbleClass + ' animate-slide-up';
    bubbleEl.setAttribute('data-msg-id', msg.id);
    bubbleEl.innerHTML = `
      ${senderLabel}
      <div>${contentHtml}</div>
      <div class="chat-bubble-time">${App.formatTime(msg.createdAt)}</div>
    `;

    container.appendChild(bubbleEl);
    scrollToBottom();
  }

  function updateSidebarGroupItem(groupId) {
    const user = Store.getCurrentUser();
    const group = Store.getChatGroupById(groupId);
    if (!group) return;

    const item = document.querySelector(`.chat-group-item[data-group-id="${groupId}"]`);
    if (!item) return;

    const lastMsg = Store.getLastMessage(groupId);
    const lastEl = item.querySelector('.chat-group-last');
    const timeEl = item.querySelector('.chat-group-time');

    if (lastMsg && lastEl) {
      const preview = lastMsg.type === 'announcement'
        ? '📢 ' + truncate(lastMsg.content, 30)
        : truncate(lastMsg.content, 35);
      lastEl.textContent = preview;
    }
    if (lastMsg && timeEl) {
      timeEl.textContent = App.formatTime(lastMsg.createdAt);
    }
  }

  // ============ Broadcast (Admin) ============
  function openBroadcastModal() {
    const body = `
      <div class="form-group">
        <label class="form-label">Pesan Pengumuman <span class="required">*</span></label>
        <textarea class="form-input" id="broadcastContent" rows="4" placeholder="Tulis pengumuman untuk semua anggota..."></textarea>
      </div>
      <p style="font-size: 13px; color: var(--outline);">
        <span class="material-symbols-outlined" style="font-size: 16px; vertical-align: middle;">info</span>
        Pengumuman akan ditampilkan sebagai pesan khusus di tengah chat.
      </p>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSendBroadcast">
        <span class="material-symbols-outlined" style="font-size: 18px;">campaign</span>
        Kirim Pengumuman
      </button>
    `;

    App.showModal('Kirim Pengumuman', body, footer);

    setTimeout(() => {
      const sendBtn = document.getElementById('btnSendBroadcast');
      if (sendBtn) {
        sendBtn.addEventListener('click', () => {
          const content = document.getElementById('broadcastContent')?.value.trim();
          if (!content) {
            App.showToast('Pesan pengumuman tidak boleh kosong', 'error');
            return;
          }

          const user = Store.getCurrentUser();
          const msg = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            groupId: selectedGroupId,
            senderId: user.id,
            senderName: user.name,
            content,
            type: 'announcement',
            createdAt: new Date().toISOString()
          };

          // Save locally
          const allMessages = JSON.parse(localStorage.getItem('siseminar_messages') || '[]');
          allMessages.push(msg);
          localStorage.setItem('siseminar_messages', JSON.stringify(allMessages));

          App.closeModal();
          appendBubble(msg);
          updateSidebarGroupItem(selectedGroupId);
          App.showToast('Pengumuman berhasil dikirim', 'success');

          // Fire-and-forget: sync to DB + realtime
          (async () => {
            try {
              const sdk = window.insforge;
              if (!sdk) return;
              await sdk.database.from('messages').insert([{
                id: msg.id, group_id: msg.groupId, sender_id: msg.senderId,
                sender_name: msg.senderName, content: msg.content,
                type: msg.type, created_at: msg.createdAt
              }]);
              if (sdk.realtime?.isConnected) {
                await sdk.realtime.publish(`chat:${selectedGroupId}`, 'message', msg);
              }
            } catch (err) {
              console.warn('[Chat] Broadcast sync error:', err.message);
            }
          })();
        });
      }
    }, 100);
  }

  // ============ Create Group (Admin) ============
  function openCreateGroupModal() {
    const events = Store.getEvents();
    const eventOptions = events.map(e =>
      `<option value="${e.id}">${escapeHtml(e.title)}</option>`
    ).join('');

    const body = `
      <div class="form-group">
        <label class="form-label">Nama Grup <span class="required">*</span></label>
        <input type="text" class="form-input" id="groupName" placeholder="Contoh: Grup Diskusi Seminar">
      </div>
      <div class="form-group">
        <label class="form-label">Deskripsi</label>
        <textarea class="form-input" id="groupDescription" rows="3" placeholder="Deskripsi singkat tentang grup ini..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Event <span class="required">*</span></label>
        <select class="form-select" id="groupEventId">
          <option value="">Pilih Event</option>
          ${eventOptions}
        </select>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
      <button class="btn btn-primary" id="btnSaveGroup">
        <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
        Buat Grup
      </button>
    `;

    App.showModal('Buat Grup Chat Baru', body, footer);

    setTimeout(() => {
      const saveBtn = document.getElementById('btnSaveGroup');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const name = document.getElementById('groupName')?.value.trim();
          const description = document.getElementById('groupDescription')?.value.trim();
          const eventId = document.getElementById('groupEventId')?.value;

          if (!name) {
            App.showToast('Nama grup harus diisi', 'error');
            return;
          }
          if (!eventId) {
            App.showToast('Pilih event terlebih dahulu', 'error');
            return;
          }

          const group = Store.addChatGroup({ name, description, eventId });
          selectedGroupId = group.id;

          App.closeModal();
          App.showToast('Grup chat berhasil dibuat', 'success');
          render();
        });
      }
    }, 100);
  }

  // ============ Group Info ============
  function showGroupInfo() {
    const group = Store.getChatGroupById(selectedGroupId);
    if (!group) return;

    const event = Store.getEventById(group.eventId);
    const members = Store.getChatMembers(group.id);
    const isAdmin = Store.isAdmin();

    const memberList = members.map(m => {
      const name = m.user ? m.user.name : 'Pengguna Tidak Dikenal';
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const role = m.user?.role === 'admin' ? '<span class="chip chip-info" style="margin-left: 8px;">Admin</span>' : '';
      return `
        <div class="flex items-center gap-3" style="padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
          <div class="table-avatar av-${(members.indexOf(m) % 4) + 1}">${initials}</div>
          <div style="flex: 1;">
            <div style="font-size: 14px; font-weight: 500;">${escapeHtml(name)}${role}</div>
          </div>
        </div>
      `;
    }).join('');

    const body = `
      ${isAdmin ? `
        <!-- Admin Management Panel -->
        <div style="background: var(--surface-container-low); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: var(--space-5);">
          <h4 style="font-family: var(--font-heading); font-size: 12px; font-weight: 700; color: var(--primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">
            🛠️ PENGELOLAAN GRUP ADMIN
          </h4>
          <div class="flex gap-2" style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" id="btnEditGroupDetail" style="flex: 1; justify-content: center; height: 32px; font-size: 12px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">edit</span>
              Ubah
            </button>
            <button class="btn btn-secondary btn-sm" id="btnToggleLockGroup" style="flex: 1; justify-content: center; height: 32px; font-size: 12px;">
              <span class="material-symbols-outlined" style="font-size: 16px;">${group.isLocked ? 'lock_open' : 'lock'}</span>
              ${group.isLocked ? 'Buka Kunci' : 'Kunci Grup'}
            </button>
            <button class="btn btn-ghost btn-sm" id="btnDeleteGroupDirect" style="flex: 1; justify-content: center; height: 32px; font-size: 12px; color: var(--destructive-red); border: 1px solid var(--border-subtle);">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
              Hapus
            </button>
          </div>
        </div>
      ` : ''}

      <div class="mb-4">
        <p style="font-size: 13px; color: var(--outline);">Event</p>
        <p style="font-weight: 600;">${event ? escapeHtml(event.title) : '-'}</p>
      </div>
      ${group.description ? `
        <div class="mb-4">
          <p style="font-size: 13px; color: var(--outline);">Deskripsi</p>
          <p>${escapeHtml(group.description)}</p>
        </div>
      ` : ''}
      <div>
        <p style="font-size: 13px; color: var(--outline); margin-bottom: 8px;">Anggota (${members.length})</p>
        ${memberList}
      </div>
    `;

    App.showModal('Info Grup', body);

    // Bind admin actions after DOM renders
    if (isAdmin) {
      setTimeout(() => {
        // Edit group detail
        const editBtn = document.getElementById('btnEditGroupDetail');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            const editBody = `
              <div class="form-group mb-4">
                <label class="form-label">Nama Grup <span class="required">*</span></label>
                <input type="text" class="form-input" id="editGroupName" value="${escapeHtml(group.name)}">
              </div>
              <div class="form-group">
                <label class="form-label">Deskripsi</label>
                <textarea class="form-input" id="editGroupDescription" rows="3">${escapeHtml(group.description || '')}</textarea>
              </div>
            `;
            const editFooter = `
              <button class="btn btn-ghost" onclick="App.closeModal()">Batal</button>
              <button class="btn btn-primary" id="btnSaveEditedGroup">
                <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
                Simpan Perubahan
              </button>
            `;
            App.showModal('Ubah Detail Grup', editBody, editFooter);

            setTimeout(() => {
              const saveBtn = document.getElementById('btnSaveEditedGroup');
              if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                  const newName = document.getElementById('editGroupName').value.trim();
                  const newDesc = document.getElementById('editGroupDescription').value.trim();

                  if (!newName) {
                    App.showToast('Nama grup tidak boleh kosong!', 'error');
                    return;
                  }

                  Store.updateChatGroup(group.id, { name: newName, description: newDesc });
                  App.showToast('Detail grup berhasil diperbarui!', 'success');
                  App.closeModal();
                  render();
                });
              }
            }, 100);
          });
        }

        // Toggle Lock group
        const lockBtn = document.getElementById('btnToggleLockGroup');
        if (lockBtn) {
          lockBtn.addEventListener('click', () => {
            const newLockState = !group.isLocked;
            Store.updateChatGroup(group.id, { isLocked: newLockState });
            App.showToast(newLockState ? 'Grup chat berhasil dikunci!' : 'Grup chat berhasil dibuka kunci!', 'success');
            App.closeModal();
            render();
          });
        }

        // Delete group
        const deleteBtn = document.getElementById('btnDeleteGroupDirect');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus grup chat ini beserta seluruh pesan di dalamnya?')) {
              Store.deleteChatGroup(group.id);
              selectedGroupId = null;
              App.showToast('Grup chat berhasil dihapus!', 'success');
              App.closeModal();
              render();
            }
          });
        }
      }, 150);
    }
  }

  // ============ Scroll ============
  function scrollToBottom() {
    requestAnimationFrame(() => {
      const messages = document.getElementById('chatMessages');
      if (messages) {
        messages.scrollTop = messages.scrollHeight;
      }
    });
  }

  // ============ Utilities ============
  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ============ Cleanup on Page Leave ============
  function destroy() {
    cleanupRealtime();
  }

  // ============ Public API ============
  return {
    render,
    destroy
  };
})();
