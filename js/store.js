/* ============================================================
   SiSeminar — store.js
   Hybrid Data Layer using LocalStorage and Dynamic InsForge SDK
   ============================================================ */

const Store = (() => {
  const KEYS = {
    users: 'siseminar_users',
    events: 'siseminar_events',
    formFields: 'siseminar_form_fields',
    registrations: 'siseminar_registrations',
    chatGroups: 'siseminar_chat_groups',
    chatMembers: 'siseminar_chat_members',
    messages: 'siseminar_messages',
    attendance: 'siseminar_attendance',
    currentUser: 'siseminar_current_user',
    initialized: 'siseminar_initialized'
  };

  let isSyncing = false;
  let sdkLoaded = null;

  // ============ Helpers ============
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function generateQRToken() {
    return 'QR-' + generateId().toUpperCase();
  }

  function normalizePhone(phone) {
    if (!phone) return '';
    let p = phone.replace(/[\s\-\(\)\+]/g, '');
    if (p.startsWith('08')) {
      p = '62' + p.substring(1);
    } else if (p.startsWith('+62')) {
      p = p.substring(1);
    } else if (!p.startsWith('62')) {
      p = '62' + p;
    }
    return p;
  }

  function formatPhone(phone) {
    const n = normalizePhone(phone);
    if (n.length < 4) return n;
    return '+' + n.substring(0, 2) + ' ' + n.substring(2, 5) + '-' + n.substring(5, 9) + '-' + n.substring(9);
  }

  function get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  }

  function set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getObj(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  }

  function setObj(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ============ Dynamic SDK Loader ============
  async function ensureSdk() {
    if (sdkLoaded) return sdkLoaded;
    try {
      // Dynamically import the ESM bundle from jsDelivr
      const module = await import('https://cdn.jsdelivr.net/npm/@insforge/sdk@1.3.0/dist/index.mjs');
      window.insforge = module.createClient({
        baseUrl: 'https://yf9g53qm.ap-southeast.insforge.app',
        anonKey: 'ik_27bb066827cca211bd663f03ae24d47a'
      });
      sdkLoaded = window.insforge;
      console.log("[InsForge] SDK client loaded dynamically successfully!");
      return sdkLoaded;
    } catch (err) {
      console.error("[InsForge] Gagal memuat SDK secara dinamis:", err);
      return null;
    }
  }

  // ============ InsForge Backend Sync ============
  async function syncWithBackend() {
    const sdk = await ensureSdk();
    if (!sdk) return null;
    
    if (isSyncing) return sdk;
    isSyncing = true;
    console.log("[InsForge] Memulai sinkronisasi dengan database Postgres...");
    try {
      // 1. Users
      const { data: users } = await sdk.database.from('users').select('*');
      if (users) set(KEYS.users, users);

      // 2. Events
      const { data: events } = await sdk.database.from('events').select('*');
      if (events) set(KEYS.events, events);

      // 3. Form Fields
      const { data: formFields } = await sdk.database.from('form_fields').select('*');
      if (formFields) {
        set(KEYS.formFields, formFields.map(f => ({
          id: f.id,
          eventId: f.event_id,
          label: f.label,
          fieldType: f.field_type,
          options: f.options || [],
          isRequired: f.is_required,
          placeholder: f.placeholder,
          orderIndex: f.order_index,
          createdAt: f.created_at
        })));
      }

      // 4. Registrations
      const { data: regs } = await sdk.database.from('registrations').select('*');
      if (regs) {
        set(KEYS.registrations, regs.map(r => ({
          id: r.id,
          eventId: r.event_id,
          userId: r.user_id,
          name: r.name,
          phone: r.phone,
          responses: r.responses || [],
          status: r.status,
          submittedAt: r.submitted_at
        })));
      }

      // 5. Chat Groups
      const { data: groups } = await sdk.database.from('chat_groups').select('*');
      if (groups) {
        set(KEYS.chatGroups, groups.map(g => ({
          id: g.id,
          eventId: g.event_id,
          name: g.name,
          description: g.description,
          bannerUrl: g.banner_url,
          isLocked: g.is_locked,
          createdBy: g.created_by,
          createdAt: g.created_at
        })));
      }

      // 6. Chat Members
      const { data: members } = await sdk.database.from('chat_members').select('*');
      if (members) {
        set(KEYS.chatMembers, members.map(m => ({
          id: m.id,
          groupId: m.group_id,
          userId: m.user_id,
          joinedAt: m.joined_at
        })));
      }

      // 7. Messages
      const { data: msgs } = await sdk.database.from('messages').select('*');
      if (msgs) {
        set(KEYS.messages, msgs.map(m => ({
          id: m.id,
          groupId: m.group_id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          type: m.type,
          createdAt: m.created_at
        })));
      }

      // 8. Attendance
      const { data: att } = await sdk.database.from('attendance').select('*');
      if (att) {
        set(KEYS.attendance, att.map(a => ({
          id: a.id,
          eventId: a.event_id,
          userId: a.user_id,
          userName: a.user_name,
          userPhone: a.user_phone,
          method: a.method,
          qrToken: a.qr_token,
          checkedInAt: a.checked_in_at
        })));
      }

      console.log("[InsForge] Sinkronisasi database berhasil diselesaikan!");
    } catch (err) {
      console.error("[InsForge] Gagal melakukan sinkronisasi database:", err);
    } finally {
      isSyncing = false;
    }
    return sdk;
  }

  // ============ Auth ============
  async function login(identifier, password) {
    const sdk = await ensureSdk();
    if (!sdk) {
      // Local fallback
      const users = get(KEYS.users);
      const normalizedPhone = normalizePhone(identifier);
      const user = users.find(u => normalizePhone(u.phone) === normalizedPhone && u.password === password);
      if (user) {
        const sessionUser = { ...user };
        delete sessionUser.password;
        setObj(KEYS.currentUser, sessionUser);
        return { success: true, user: sessionUser };
      }
      return { success: false, error: 'Nomor WhatsApp atau password salah' };
    }

    try {
      let email = identifier;
      if (!identifier.includes('@')) {
        // Phone login - lookup user email first
        const user = getUserByPhone(identifier);
        if (user && user.email) {
          email = user.email;
        } else {
          email = normalizePhone(identifier) + '@siseminar.com';
        }
      }

      const { data, error } = await sdk.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }

      const profile = data.user.profile || {};
      const sessionUser = {
        id: data.user.id,
        email: data.user.email,
        name: profile.name || data.user.email.split('@')[0],
        phone: profile.phone || normalizePhone(identifier),
        role: data.user.email.includes('admin') || data.user.id === 'admin_001' ? 'admin' : 'peserta'
      };

      setObj(KEYS.currentUser, sessionUser);
      return { success: true, user: sessionUser };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function logout() {
    localStorage.removeItem(KEYS.currentUser);
    const sdk = await ensureSdk();
    if (sdk) {
      sdk.auth.signOut();
    }
  }

  function getCurrentUser() {
    return getObj(KEYS.currentUser);
  }

  function updateCurrentUserSession() {
    const current = getCurrentUser();
    if (!current) return;
    const users = get(KEYS.users);
    const fresh = users.find(u => u.id === current.id);
    if (fresh) {
      const sessionUser = { ...fresh };
      delete sessionUser.password;
      setObj(KEYS.currentUser, sessionUser);
    }
  }

  function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
  }

  // ============ Users ============
  function getUsers() { return get(KEYS.users); }

  function getUserById(id) {
    return get(KEYS.users).find(u => u.id === id);
  }

  function getUserByPhone(phone) {
    const n = normalizePhone(phone);
    return get(KEYS.users).find(u => normalizePhone(u.phone) === n);
  }

  async function addUser(userData) {
    const users = get(KEYS.users);
    const existing = users.find(u => normalizePhone(u.phone) === normalizePhone(userData.phone));
    if (existing) return { success: false, error: 'Nomor WhatsApp sudah terdaftar' };
    
    const userId = userData.id || generateId();
    const user = {
      id: userId,
      name: userData.name,
      phone: normalizePhone(userData.phone),
      password: userData.password || '123456',
      role: userData.role || 'peserta',
      email: userData.email || (normalizePhone(userData.phone) + '@siseminar.com'),
      createdAt: new Date().toISOString()
    };
    users.push(user);
    set(KEYS.users, users);

    // Sync to InsForge in background
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        // Register Auth in InsForge first
        await sdk.auth.signUp({
          email: user.email,
          password: user.password,
          profile: {
            name: user.name,
            phone: user.phone
          }
        });

        // Insert to public users table
        await sdk.database.from('users').insert([{
          id: user.id,
          name: user.name,
          phone: user.phone,
          password: user.password,
          role: user.role,
          email: user.email,
          created_at: user.createdAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan pengguna baru:", err);
      }
    }

    return { success: true, user };
  }

  // ============ Events ============
  function getEvents() { return get(KEYS.events); }

  function getEventById(id) {
    return get(KEYS.events).find(e => e.id === id);
  }

  async function addEvent(eventData) {
    const events = get(KEYS.events);
    const event = {
      id: generateId(),
      title: eventData.title,
      description: eventData.description || '',
      date: eventData.date,
      endDate: eventData.endDate || '',
      location: eventData.location || '',
      coverImage: eventData.coverImage || '',
      status: eventData.status || 'draft',
      joinCode: generateJoinCode(),
      adminId: getCurrentUser()?.id || 'admin_001',
      participantCount: 0,
      createdAt: new Date().toISOString()
    };
    events.push(event);
    set(KEYS.events, events);

    // Sync to InsForge
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('events').insert([{
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          end_date: event.endDate,
          location: event.location,
          cover_image: event.coverImage,
          status: event.status,
          join_code: event.joinCode,
          admin_id: event.adminId,
          participant_count: event.participantCount,
          created_at: event.createdAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan event baru:", err);
      }
    }

    // Auto-create default chat group
    await addChatGroup({ eventId: event.id, name: 'Grup Umum - ' + event.title, description: 'Grup chat utama untuk event ini' });
    return event;
  }

  async function updateEvent(id, data) {
    const events = get(KEYS.events);
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    events[idx] = { ...events[idx], ...data };
    set(KEYS.events, events);

    // Sync to InsForge
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('events').update({
          title: data.title,
          description: data.description,
          date: data.date,
          end_date: data.endDate || '',
          location: data.location,
          cover_image: data.coverImage || '',
          status: data.status,
          participant_count: data.participantCount ?? events[idx].participantCount
        }).eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan update event:", err);
      }
    }

    return events[idx];
  }

  async function deleteEvent(id) {
    set(KEYS.events, get(KEYS.events).filter(e => e.id !== id));
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('events').delete().eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menghapus event di cloud:", err);
      }
    }
  }

  // ============ Form Fields ============
  function getFormFields(eventId) {
    return get(KEYS.formFields).filter(f => f.eventId === eventId).sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async function addFormField(fieldData) {
    const fields = get(KEYS.formFields);
    const eventFields = fields.filter(f => f.eventId === fieldData.eventId);
    const field = {
      id: generateId(),
      eventId: fieldData.eventId,
      label: fieldData.label,
      fieldType: fieldData.fieldType || 'text',
      options: fieldData.options || [],
      isRequired: fieldData.isRequired !== false,
      placeholder: fieldData.placeholder || '',
      orderIndex: fieldData.orderIndex ?? eventFields.length,
      createdAt: new Date().toISOString()
    };
    fields.push(field);
    set(KEYS.formFields, fields);

    // Sync to InsForge
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('form_fields').insert([{
          id: field.id,
          event_id: field.eventId,
          label: field.label,
          field_type: field.fieldType,
          options: field.options,
          is_required: field.isRequired,
          placeholder: field.placeholder,
          order_index: field.orderIndex,
          created_at: field.createdAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan form field baru:", err);
      }
    }

    return field;
  }

  async function updateFormField(id, data) {
    const fields = get(KEYS.formFields);
    const idx = fields.findIndex(f => f.id === id);
    if (idx === -1) return null;
    fields[idx] = { ...fields[idx], ...data };
    set(KEYS.formFields, fields);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('form_fields').update({
          label: data.label,
          field_type: data.fieldType,
          options: data.options,
          is_required: data.isRequired,
          placeholder: data.placeholder,
          order_index: data.orderIndex
        }).eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan update form field:", err);
      }
    }

    return fields[idx];
  }

  async function deleteFormField(id) {
    set(KEYS.formFields, get(KEYS.formFields).filter(f => f.id !== id));
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('form_fields').delete().eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menghapus form field di cloud:", err);
      }
    }
  }

  async function reorderFormFields(eventId, orderedIds) {
    const fields = get(KEYS.formFields);
    orderedIds.forEach((fid, index) => {
      const f = fields.find(x => x.id === fid);
      if (f) f.orderIndex = index;
    });
    set(KEYS.formFields, fields);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          await sdk.database.from('form_fields').update({ order_index: i }).eq('id', orderedIds[i]);
        }
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan penyusunan ulang form fields:", err);
      }
    }
  }

  // ============ Registrations ============
  function getRegistrations(eventId) {
    return get(KEYS.registrations).filter(r => r.eventId === eventId);
  }

  function getAllRegistrations() {
    return get(KEYS.registrations);
  }

  async function addRegistration(regData) {
    const regs = get(KEYS.registrations);
    const normalizedPhone = normalizePhone(regData.phone || regData.responses?.find(r => r.label?.toLowerCase().includes('whatsapp'))?.value || '');
    const existing = regs.find(r => r.eventId === regData.eventId && normalizePhone(r.phone) === normalizedPhone);
    if (existing) return { success: false, error: 'Anda sudah terdaftar di event ini' };

    const reg = {
      id: generateId(),
      eventId: regData.eventId,
      userId: regData.userId,
      name: regData.name,
      phone: normalizedPhone,
      responses: regData.responses || [],
      status: 'confirmed',
      submittedAt: new Date().toISOString()
    };
    regs.push(reg);
    set(KEYS.registrations, regs);

    // Sync to InsForge
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('registrations').insert([{
          id: reg.id,
          event_id: reg.eventId,
          user_id: reg.userId,
          name: reg.name,
          phone: reg.phone,
          responses: reg.responses,
          status: reg.status,
          submitted_at: reg.submittedAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan registrasi:", err);
      }
    }

    // Update event participant count
    const event = getEventById(regData.eventId);
    if (event) {
      await updateEvent(event.id, { participantCount: (event.participantCount || 0) + 1 });
    }

    // Auto join all chat groups for this event
    const groups = getChatGroups(regData.eventId);
    for (const g of groups) {
      await addChatMember(g.id, regData.userId);
    }

    return { success: true, registration: reg };
  }

  async function updateRegistration(id, data) {
    const regs = get(KEYS.registrations);
    const idx = regs.findIndex(r => r.id === id);
    if (idx === -1) return null;
    regs[idx] = { ...regs[idx], ...data };
    set(KEYS.registrations, regs);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('registrations').update({
          status: data.status
        }).eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan update registrasi:", err);
      }
    }

    return regs[idx];
  }

  async function deleteRegistration(id) {
    set(KEYS.registrations, get(KEYS.registrations).filter(r => r.id !== id));
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('registrations').delete().eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menghapus registrasi di cloud:", err);
      }
    }
  }

  // ============ Chat Groups ============
  function getChatGroups(eventId) {
    if (eventId) return get(KEYS.chatGroups).filter(g => g.eventId === eventId);
    return get(KEYS.chatGroups);
  }

  function getChatGroupById(id) {
    return get(KEYS.chatGroups).find(g => g.id === id);
  }

  function getUserChatGroups(userId) {
    const members = get(KEYS.chatMembers).filter(m => m.userId === userId);
    const groupIds = members.map(m => m.groupId);
    return get(KEYS.chatGroups).filter(g => groupIds.includes(g.id));
  }

  async function addChatGroup(data) {
    const groups = get(KEYS.chatGroups);
    const group = {
      id: generateId(),
      eventId: data.eventId,
      name: data.name,
      description: data.description || '',
      bannerUrl: data.bannerUrl || '',
      isLocked: false,
      createdBy: getCurrentUser()?.id || 'admin_001',
      createdAt: new Date().toISOString()
    };
    groups.push(group);
    set(KEYS.chatGroups, groups);

    // Sync to InsForge
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('chat_groups').insert([{
          id: group.id,
          event_id: group.eventId,
          name: group.name,
          description: group.description,
          banner_url: group.bannerUrl,
          is_locked: group.isLocked,
          created_by: group.createdBy,
          created_at: group.createdAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan grup chat baru:", err);
      }
    }
    
    // Add creator as member
    if (getCurrentUser()) {
      await addChatMember(group.id, getCurrentUser().id);
    }
    return group;
  }

  async function updateChatGroup(id, data) {
    const groups = get(KEYS.chatGroups);
    const idx = groups.findIndex(g => g.id === id);
    if (idx === -1) return null;
    groups[idx] = { ...groups[idx], ...data };
    set(KEYS.chatGroups, groups);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('chat_groups').update({
          name: data.name,
          description: data.description,
          is_locked: data.isLocked
        }).eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan update grup chat:", err);
      }
    }

    return groups[idx];
  }

  async function deleteChatGroup(id) {
    set(KEYS.chatGroups, get(KEYS.chatGroups).filter(g => g.id !== id));
    set(KEYS.chatMembers, get(KEYS.chatMembers).filter(m => m.groupId !== id));
    set(KEYS.messages, get(KEYS.messages).filter(m => m.groupId !== id));

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('chat_groups').delete().eq('id', id);
      } catch (err) {
        console.warn("[InsForge] Gagal menghapus grup chat di cloud:", err);
      }
    }
  }

  // ============ Chat Members ============
  function getChatMembers(groupId) {
    const members = get(KEYS.chatMembers).filter(m => m.groupId === groupId);
    return members.map(m => {
      const user = getUserById(m.userId);
      return { ...m, user };
    });
  }

  async function addChatMember(groupId, userId) {
    const members = get(KEYS.chatMembers);
    const existing = members.find(m => m.groupId === groupId && m.userId === userId);
    if (existing) return existing;
    const member = {
      id: generateId(),
      groupId,
      userId,
      joinedAt: new Date().toISOString()
    };
    members.push(member);
    set(KEYS.chatMembers, members);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('chat_members').insert([{
          id: member.id,
          group_id: member.groupId,
          user_id: member.userId,
          joined_at: member.joinedAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan anggota grup chat:", err);
      }
    }

    return member;
  }

  async function removeChatMember(groupId, userId) {
    set(KEYS.chatMembers, get(KEYS.chatMembers).filter(m => !(m.groupId === groupId && m.userId === userId)));
    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('chat_members').delete().eq('group_id', groupId).eq('user_id', userId);
      } catch (err) {
        console.warn("[InsForge] Gagal mengeluarkan anggota grup chat di cloud:", err);
      }
    }
  }

  // ============ Messages ============
  function getMessages(groupId) {
    return get(KEYS.messages).filter(m => m.groupId === groupId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  async function addMessage(msgData) {
    const messages = get(KEYS.messages);
    const msg = {
      id: generateId(),
      groupId: msgData.groupId,
      senderId: msgData.senderId || getCurrentUser()?.id,
      senderName: msgData.senderName || getCurrentUser()?.name,
      content: msgData.content,
      type: msgData.type || 'text', // text, announcement
      createdAt: new Date().toISOString()
    };
    messages.push(msg);
    set(KEYS.messages, messages);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('messages').insert([{
          id: msg.id,
          group_id: msg.groupId,
          sender_id: msg.senderId,
          sender_name: msg.senderName,
          content: msg.content,
          type: msg.type,
          created_at: msg.createdAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan pesan baru:", err);
      }
    }

    return msg;
  }

  function getLastMessage(groupId) {
    const msgs = getMessages(groupId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  }

  function getUnreadCount(groupId, userId) {
    const msgs = getMessages(groupId);
    const recentMsgs = msgs.slice(-5);
    return recentMsgs.filter(m => m.senderId !== userId).length;
  }

  // ============ Attendance ============
  function getAttendance(eventId) {
    return get(KEYS.attendance).filter(a => a.eventId === eventId);
  }

  async function addAttendance(data) {
    const attendance = get(KEYS.attendance);
    const existing = attendance.find(a => a.eventId === data.eventId && a.userId === data.userId);
    if (existing) return { success: false, error: 'Sudah melakukan check-in', attendance: existing };

    const record = {
      id: generateId(),
      eventId: data.eventId,
      userId: data.userId,
      userName: data.userName,
      userPhone: data.userPhone,
      method: data.method || 'qr',
      qrToken: data.qrToken || '',
      checkedInAt: new Date().toISOString()
    };
    attendance.push(record);
    set(KEYS.attendance, attendance);

    const sdk = await ensureSdk();
    if (sdk) {
      try {
        await sdk.database.from('attendance').insert([{
          id: record.id,
          event_id: record.eventId,
          user_id: record.userId,
          user_name: record.userName,
          user_phone: record.userPhone,
          method: record.method,
          qr_token: record.qrToken,
          checked_in_at: record.checkedInAt
        }]);
      } catch (err) {
        console.warn("[InsForge] Gagal menyelaraskan data kehadiran:", err);
      }
    }

    return { success: true, attendance: record };
  }

  function getEventQRToken(eventId) {
    const events = get(KEYS.events);
    const event = events.find(e => e.id === eventId);
    if (!event) return null;
    if (!event.qrToken) {
      event.qrToken = generateQRToken();
      const idx = events.findIndex(e => e.id === eventId);
      events[idx] = event;
      set(KEYS.events, events);
      updateEvent(eventId, { qrToken: event.qrToken });
    }
    return event.qrToken;
  }

  // ============ Export CSV ============
  function exportCSV(data, filename) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(h => {
        let val = row[h];
        if (typeof val === 'object') val = JSON.stringify(val);
        if (typeof val === 'string') val = '"' + val.replace(/"/g, '""') + '"';
        return val ?? '';
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || 'export.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ============ Initialize Demo Data ============
  function initDemoData() {
    // If we have dynamic SDK, let's sync in background!
    ensureSdk().then(sdk => {
      if (sdk) syncWithBackend();
    });

    if (localStorage.getItem(KEYS.initialized) && get(KEYS.events).length > 0) return;

    // Admin user
    const adminId = 'admin_001';
    const admin = {
      id: adminId,
      name: 'Admin SiSeminar',
      phone: '6287881527804',
      password: 'admin123',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    // Peserta demo
    const peserta = [
      { id: 'user_001', name: 'Sarah Mitchell', phone: '628123456789', password: '123456', role: 'peserta', createdAt: '2024-09-15T08:00:00.000Z' },
      { id: 'user_002', name: 'David Wilson', phone: '628119988776', password: '123456', role: 'peserta', createdAt: '2024-09-16T10:00:00.000Z' },
      { id: 'user_003', name: 'Elena Lavoie', phone: '628131122334', password: '123456', role: 'peserta', createdAt: '2024-09-17T09:00:00.000Z' },
      { id: 'user_004', name: 'Robert Brown', phone: '628124455667', password: '123456', role: 'peserta', createdAt: '2024-09-18T11:00:00.000Z' },
      { id: 'user_005', name: 'Anisa Putri', phone: '628567891234', password: '123456', role: 'peserta', createdAt: '2024-09-19T07:00:00.000Z' },
    ];

    set(KEYS.users, [admin, ...peserta]);

    // Events
    const events = [
      {
        id: 'event_001',
        title: 'Seminar Parenting Digital: Mendidik Anak di Era Teknologi',
        description: 'Bergabunglah dalam seminar eksklusif tentang perkembangan anak usia dini dan strategi pendidikan modern.',
        date: '2024-10-24',
        endDate: '2024-10-24',
        location: 'Aula Utama, Jakarta Convention Center',
        coverImage: '',
        status: 'active',
        joinCode: 'SEM24A',
        qrToken: 'QR-SEM24A',
        adminId: adminId,
        participantCount: 5,
        createdAt: '2024-09-01T00:00:00.000Z'
      },
      {
        id: 'event_002',
        title: 'Workshop Kesehatan Anak: Nutrisi & Tumbuh Kembang',
        description: 'Workshop interaktif bersama ahli gizi dan dokter anak tentang nutrisi optimal untuk tumbuh kembang anak.',
        date: '2024-11-12',
        endDate: '2024-11-12',
        location: 'Hotel Grand Mercure, Bandung',
        coverImage: '',
        status: 'draft',
        joinCode: 'WRK24B',
        adminId: adminId,
        participantCount: 0,
        createdAt: '2024-09-10T00:00:00.000Z'
      },
      {
        id: 'event_003',
        title: 'Forum Edukasi Nasional 2024',
        description: 'Forum tahunan tentang inovasi pendidikan di Indonesia.',
        date: '2024-12-05',
        endDate: '2024-12-07',
        location: 'Balai Sidang Surabaya',
        coverImage: '',
        status: 'active',
        joinCode: 'FEN24C',
        adminId: adminId,
        participantCount: 2,
        createdAt: '2024-09-15T00:00:00.000Z'
      }
    ];
    set(KEYS.events, events);

    // Form Fields for event_001
    const formFields = [
      { id: 'ff_001', eventId: 'event_001', label: 'Nama Lengkap', fieldType: 'text', options: [], isRequired: true, placeholder: 'Masukkan nama lengkap', orderIndex: 0, createdAt: '2024-09-01T00:00:00.000Z' },
      { id: 'ff_002', eventId: 'event_001', label: 'Nomor WhatsApp', fieldType: 'text', options: [], isRequired: true, placeholder: '08xxxxxxxxxx', orderIndex: 1, createdAt: '2024-09-01T00:00:00.000Z' },
      { id: 'ff_003', eventId: 'event_001', label: 'Usia Anda (Tahun)', fieldType: 'number', options: [], isRequired: true, placeholder: 'Tahun', orderIndex: 2, createdAt: '2024-09-01T00:00:00.000Z' },
      { id: 'ff_004', eventId: 'event_001', label: 'Usia Anak (Tahun)', fieldType: 'number', options: [], isRequired: true, placeholder: 'Tahun', orderIndex: 3, createdAt: '2024-09-01T00:00:00.000Z' },
      { id: 'ff_005', eventId: 'event_001', label: 'Kecamatan Domisili', fieldType: 'text', options: [], isRequired: true, placeholder: 'Masukkan kecamatan', orderIndex: 4, createdAt: '2024-09-01T00:00:00.000Z' },
      { id: 'ff_006', eventId: 'event_001', label: 'Mengetahui Informasi Seminar Dari', fieldType: 'dropdown', options: ['Instagram', 'Facebook', 'Teman/Keluarga', 'Komunitas WhatsApp', 'Website', 'Lainnya'], isRequired: true, placeholder: 'Pilih salah satu', orderIndex: 5, createdAt: '2024-09-01T00:00:00.000Z' },
      { id: 'ff_007', eventId: 'event_001', label: 'Persetujuan Anakku.id', fieldType: 'checkbox', options: [], isRequired: true, placeholder: 'Dengan melakukan klik/tap Submit, Anda berkenan dan memberi izin kepada anakku.id untuk memperoleh, mengumpulkan, menggunakan, mengungkapkan dan/atau mengolah data yang telah diberikan serta bersedia menerima informasi terkait anakku.id.', orderIndex: 6, createdAt: '2024-09-01T00:00:00.000Z' },
    ];
    set(KEYS.formFields, formFields);

    // Registrations for event_001
    const registrations = [
      { id: 'reg_001', eventId: 'event_001', userId: 'user_001', name: 'Sarah Mitchell', phone: '628123456789', responses: [{label:'Nama Lengkap',value:'Sarah Mitchell'},{label:'Nomor WhatsApp',value:'628123456789'},{label:'Usia Anda (Tahun)',value:'32'},{label:'Usia Anak (Tahun)',value:'6'},{label:'Kecamatan Domisili',value:'Menteng'},{label:'Mengetahui Informasi Seminar Dari',value:'Instagram'}], status: 'confirmed', submittedAt: '2024-09-20T08:00:00.000Z' },
      { id: 'reg_002', eventId: 'event_001', userId: 'user_002', name: 'David Wilson', phone: '628119988776', responses: [{label:'Nama Lengkap',value:'David Wilson'},{label:'Nomor WhatsApp',value:'628119988776'},{label:'Usia Anda (Tahun)',value:'41'},{label:'Usia Anak (Tahun)',value:'4'},{label:'Kecamatan Domisili',value:'Kemang'},{label:'Mengetahui Informasi Seminar Dari',value:'Teman/Keluarga'}], status: 'pending', submittedAt: '2024-09-21T10:00:00.000Z' },
      { id: 'reg_003', eventId: 'event_001', userId: 'user_003', name: 'Elena Lavoie', phone: '628131122334', responses: [{label:'Nama Lengkap',value:'Elena Lavoie'},{label:'Nomor WhatsApp',value:'628131122334'},{label:'Usia Anda (Tahun)',value:'29'},{label:'Usia Anak (Tahun)',value:'10'},{label:'Kecamatan Domisili',value:'Kebayoran Baru'},{label:'Mengetahui Informasi Seminar Dari',value:'Facebook'}], status: 'confirmed', submittedAt: '2024-09-22T09:00:00.000Z' },
      { id: 'reg_004', eventId: 'event_001', userId: 'user_004', name: 'Robert Brown', phone: '628124455667', responses: [{label:'Nama Lengkap',value:'Robert Brown'},{label:'Nomor WhatsApp',value:'628124455667'},{label:'Usia Anda (Tahun)',value:'38'},{label:'Usia Anak (Tahun)',value:'5'},{label:'Kecamatan Domisili',value:'Tanah Abang'},{label:'Mengetahui Informasi Seminar Dari',value:'Website'}], status: 'cancelled', submittedAt: '2024-09-23T11:00:00.000Z' },
      { id: 'reg_005', eventId: 'event_001', userId: 'user_005', name: 'Anisa Putri', phone: '628567891234', responses: [{label:'Nama Lengkap',value:'Anisa Putri'},{label:'Nomor WhatsApp',value:'628567891234'},{label:'Usia Anda (Tahun)',value:'35'},{label:'Usia Anak (Tahun)',value:'7'},{label:'Kecamatan Domisili',value:'Cilandak'},{label:'Mengetahui Informasi Seminar Dari',value:'Komunitas WhatsApp'}], status: 'confirmed', submittedAt: '2024-09-24T07:00:00.000Z' },
    ];
    set(KEYS.registrations, registrations);

    // Chat Groups
    const chatGroups = [
      { id: 'cg_001', eventId: 'event_001', name: 'Grup Umum - Seminar Parenting', description: 'Grup chat utama untuk diskusi seputar seminar', bannerUrl: '', createdBy: adminId, createdAt: '2024-09-01T00:00:00.000Z', isLocked: false },
      { id: 'cg_002', eventId: 'event_001', name: 'Info & Pengumuman', description: 'Informasi resmi dan pengumuman dari panitia', bannerUrl: '', createdBy: adminId, createdAt: '2024-09-01T00:00:00.000Z', isLocked: false },
      { id: 'cg_003', eventId: 'event_003', name: 'Grup Umum - Forum Edukasi', description: 'Grup chat untuk Forum Edukasi Nasional', bannerUrl: '', createdBy: adminId, createdAt: '2024-09-15T00:00:00.000Z', isLocked: false },
    ];
    set(KEYS.chatGroups, chatGroups);

    // Chat Members
    const chatMembers = [
      { id: 'cm_001', groupId: 'cg_001', userId: adminId, joinedAt: '2024-09-01T00:00:00.000Z' },
      { id: 'cm_002', groupId: 'cg_001', userId: 'user_001', joinedAt: '2024-09-20T08:00:00.000Z' },
      { id: 'cm_003', groupId: 'cg_001', userId: 'user_002', joinedAt: '2024-09-21T10:00:00.000Z' },
      { id: 'cm_004', groupId: 'cg_001', userId: 'user_003', joinedAt: '2024-09-22T09:00:00.000Z' },
      { id: 'cm_005', groupId: 'cg_001', userId: 'user_004', joinedAt: '2024-09-23T11:00:00.000Z' },
      { id: 'cm_006', groupId: 'cg_001', userId: 'user_005', joinedAt: '2024-09-24T07:00:00.000Z' },
      { id: 'cm_007', groupId: 'cg_002', userId: adminId, joinedAt: '2024-09-01T00:00:00.000Z' },
      { id: 'cm_008', groupId: 'cg_002', userId: 'user_001', joinedAt: '2024-09-20T08:00:00.000Z' },
      { id: 'cm_009', groupId: 'cg_002', userId: 'user_003', joinedAt: '2024-09-22T09:00:00.000Z' },
      { id: 'cm_010', groupId: 'cg_003', userId: adminId, joinedAt: '2024-09-15T00:00:00.000Z' },
    ];
    set(KEYS.chatMembers, chatMembers);

    // Messages
    const messages = [
      { id: 'msg_001', groupId: 'cg_001', senderId: adminId, senderName: 'Admin SiSeminar', content: 'Selamat datang di grup Seminar Parenting Digital! 🎉 Silakan berkenalan di sini.', type: 'announcement', createdAt: '2024-09-20T08:30:00.000Z' },
      { id: 'msg_002', groupId: 'cg_001', senderId: 'user_001', senderName: 'Sarah Mitchell', content: 'Halo semuanya! Senang bergabung di seminar ini 😊', type: 'text', createdAt: '2024-09-20T09:00:00.000Z' },
      { id: 'msg_003', groupId: 'cg_001', senderId: 'user_003', senderName: 'Elena Lavoie', content: 'Halo Sarah! Saya juga excited banget untuk seminar ini', type: 'text', createdAt: '2024-09-20T09:15:00.000Z' },
      { id: 'msg_004', groupId: 'cg_001', senderId: adminId, senderName: 'Admin SiSeminar', content: 'Reminder: Seminar akan diadakan tanggal 24 Oktober 2024 di Jakarta Convention Center. Pastikan hadir tepat waktu ya! ⏰', type: 'announcement', createdAt: '2024-10-20T08:00:00.000Z' },
      { id: 'msg_005', groupId: 'cg_001', senderId: 'user_005', senderName: 'Anisa Putri', content: 'Siap, terima kasih infonya admin!', type: 'text', createdAt: '2024-10-20T08:30:00.000Z' },
      { id: 'msg_006', groupId: 'cg_002', senderId: adminId, senderName: 'Admin SiSeminar', content: '📢 PENGUMUMAN: Dresscode untuk seminar adalah Smart Casual. Warna tema: Biru Navy & Putih.', type: 'announcement', createdAt: '2024-10-18T10:00:00.000Z' },
      { id: 'msg_007', groupId: 'cg_002', senderId: adminId, senderName: 'Admin SiSeminar', content: '📢 Rundown acara:\n09:00 - Registrasi & Check-in\n09:30 - Pembukaan\n10:00 - Sesi 1: Parenting di Era Digital\n11:30 - Coffee Break\n12:00 - Sesi 2: Strategi Komunikasi\n13:00 - Penutupan', type: 'announcement', createdAt: '2024-10-22T09:00:00.000Z' },
    ];
    set(KEYS.messages, messages);

    // Attendance
    const attendance = [
      { id: 'att_001', eventId: 'event_001', userId: 'user_001', userName: 'Sarah Mitchell', userPhone: '628123456789', method: 'qr', qrToken: 'QR-SEM24A', checkedInAt: '2024-10-24T08:45:00.000Z' },
      { id: 'att_002', eventId: 'event_001', userId: 'user_003', userName: 'Elena Lavoie', userPhone: '628131122334', method: 'qr', qrToken: 'QR-SEM24A', checkedInAt: '2024-10-24T08:50:00.000Z' },
    ];
    set(KEYS.attendance, attendance);

    localStorage.setItem(KEYS.initialized, 'true');
  }

  function resetData() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    initDemoData();
  }

  // ============ Public API ============
  return {
    // Helpers
    generateId,
    normalizePhone,
    formatPhone,
    generateQRToken,
    syncWithBackend,

    // Auth
    login,
    logout,
    getCurrentUser,
    updateCurrentUserSession,
    isAdmin,

    // Users
    getUsers,
    getUserById,
    getUserByPhone,
    addUser,

    // Events
    getEvents,
    getEventById,
    addEvent,
    updateEvent,
    deleteEvent,

    // Form Fields
    getFormFields,
    addFormField,
    updateFormField,
    deleteFormField,
    reorderFormFields,

    // Registrations
    getRegistrations,
    getAllRegistrations,
    addRegistration,
    updateRegistration,
    deleteRegistration,

    // Chat Groups
    getChatGroups,
    getChatGroupById,
    getUserChatGroups,
    addChatGroup,
    updateChatGroup,
    deleteChatGroup,

    // Chat Members
    getChatMembers,
    addChatMember,
    removeChatMember,

    // Messages
    getMessages,
    addMessage,
    getLastMessage,
    getUnreadCount,

    // Attendance
    getAttendance,
    addAttendance,
    getEventQRToken,

    // Export
    exportCSV,

    // Init
    initDemoData,
    resetData
  };
})();
