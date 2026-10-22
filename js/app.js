/*
 * Amor Stories - Arayüz
 * ---------------------
 * Amor'un ekranları; karakterler sadece "Oluştur" ekranından gelir ve sohbette iki tarafı da kullanıcı yazar.
 * Hash tabanlı yönlendirme (GitHub Pages ile uyumlu):
 *   #/home  #/messages  #/create  #/create/<id>  #/monia  #/monia/<senaryo id>  #/me  #/p/<id>  #/chat/<id>
 */
(() => {
  const Store = Stories.Store;
  const T = Stories.Traits;
  const S = () => Store.state;
  const $ = (sel, root = document) => root.querySelector(sel);
  const view = $('#view');
  const app = $('#app');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const chars = () => S().characters;
  const byId = id => chars().find(c => c.id === id);

  const ui = { homeTab: 'all', profileTab: 'profile', route: null, create: null };
  let playTimer = null;
  let botTimer = null; // 🤖 bot cevabı bekleniyor

  /* ---------- İkonlar ---------- */
  const ICON = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24"><path d="M20 12H5M11 5l-7 7 7 7"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="19" r="1.3"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>',
    photo: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 3.5 3 3-2.5L20 17"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M3.4 11.1 19.6 3.6c.9-.4 1.8.5 1.4 1.4l-7.5 16.2c-.4.9-1.7.8-2-.1l-1.6-5.4a1 1 0 0 0-.6-.6L3.9 13.5c-.9-.3-1-1.6-.1-2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.3 3.4c-.6.5-1.5 0-1.5-.7V16A3.5 3.5 0 0 1 4 12.5z"/><circle cx="9.5" cy="9.5" r="1.2" fill="#fff"/><circle cx="14.5" cy="9.5" r="1.2" fill="#fff"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  /* ---------- Yardımcılar ---------- */
  // Telefonda avatarlar biraz daha küçük
  const avaSize = size => Math.round(window.innerWidth < 768 ? size * 0.8 : size);
  const initial = name => esc((name || '?').trim().charAt(0).toLocaleUpperCase('tr') || '?');
  const grad = c => { const [a, b] = c.colors || T.colors[0]; return `linear-gradient(135deg,${a},${b})`; };

  function avatar(c, size = 56, opts = {}) {
    size = avaSize(size);
    const inner = c.photo ? `<img src="${esc(c.photo)}" alt="${esc(c.name)}" loading="lazy">` : initial(c.name);
    const unread = opts.unread ? `<b class="unread">${opts.unread}</b>` : '';
    return `<div class="ava" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.42)}px;background:${grad(c)}">${inner}${unread}</div>`;
  }

  function userAvatar(size = 56) {
    const u = S().user;
    return avatar({ name: u.name || 'Sen', photo: u.photo, colors: ['#0089c4', '#c2185b'] }, size);
  }
  const userName = () => S().user.name || 'Sen';

  function fmtTime(ts) {
    const d = new Date(ts), now = new Date();
    const hm = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return hm;
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${hm}`;
  }

  /* Sohbetler: bir karakterin birden çok adlı sohbeti (thread) olabilir; mesajlar S().chats[sohbet id] */
  const threads = () => S().threads;
  const threadById = id => threads().find(t => t.id === id);
  const threadsOf = c => threads().filter(t => !t.group && t.charId === c.id).sort((a, b) => activity(b) - activity(a));
  // Grup sohbetleri: { group: true, members: [karakter id], title }; mesajlarda konuşan üye m.who
  const groups = () => threads().filter(t => t.group);
  const groupsOf = c => groups().filter(t => t.members.includes(c.id)).sort((a, b) => activity(b) - activity(a));
  const membersOf = t => (t.group ? t.members : [t.charId]).map(byId).filter(Boolean);
  const GHOST = { name: 'Silinmiş karakter', photo: '', colors: ['#8b8b99', '#5a5a6a'], album: [] };
  const msgsOf = t => (S().chats[t.id] = S().chats[t.id] || []);
  const lastOf = t => { const m = S().chats[t.id]; return m && m.length ? m[m.length - 1] : null; };
  const activity = t => Math.max(t.opened || 0, t.created || 0, (lastOf(t) || {}).ts || 0);
  const currentThread = c => threadsOf(c)[0] || null; // son kalınan sohbet
  const msgCount = c => threadsOf(c).reduce((n, t) => n + msgsOf(t).length, 0);
  const preview = m => m.type === 'photo' ? `📷 ${m.text || 'Fotoğraf'}` : m.text;

  function newThread(c, title) {
    const t = { id: Store.uid(), charId: c.id, title: title || `Sohbet ${threadsOf(c).length + 1}`, created: Date.now(), opened: 0 };
    if (c.theme) t.theme = Object.assign({}, c.theme); // karakterin varsayılan teması
    threads().push(t);
    save();
    return t;
  }
  function groupAvatar(t, size) {
    const ms = membersOf(t);
    if (ms.length < 2) return avatar(ms[0] || { name: '👥', colors: T.colors[1] }, size);
    const s = avaSize(size), inner = Math.round(size * 0.68);
    return `<div class="gava" style="width:${s}px;height:${s}px">${avatar(ms[0], inner)}${avatar(ms[1], inner)}${ms.length > 2 && size >= 50 ? `<b class="gmore">+${ms.length - 2}</b>` : ''}</div>`;
  }

  // Grup oluştur / düzenle: ad + en az 2 üye
  function groupSheet(t, preId) {
    if (chars().length < 2) { notify('Grup için en az 2 karakter gerekli', '👥'); return; }
    const sel = new Set(t ? t.members.filter(byId) : preId ? [preId] : []);
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>👥 ${t ? 'Grubu düzenle' : 'Yeni grup'}</h3>
      <form id="gForm" autocomplete="off">
        <div class="field" style="margin-top:0"><input id="gTitle" maxlength="40" value="${esc(t ? t.title : '')}" placeholder="Grup adı (ör. Ofis 💼)"></div>
        <div class="sec-title">Üyeler <small id="gCount"></small></div>
        <div class="g-pick">${chars().map(c => `<button type="button" data-m="${c.id}" class="${sel.has(c.id) ? 'on' : ''}">${avatar(c, 52)}<b>${esc(c.name)}</b></button>`).join('')}</div>
        <button class="btn primary block" type="submit">${t ? 'Kaydet' : 'Grubu oluştur'}</button>
      </form>`, 'light');
    const el = sh.el;
    const count = () => { el.querySelector('#gCount').textContent = `(${sel.size} seçili · en az 2)`; };
    count();
    el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
      const id = b.dataset.m;
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      b.classList.toggle('on', sel.has(id));
      count();
    });
    el.querySelector('#gForm').onsubmit = e => {
      e.preventDefault();
      if (sel.size < 2) { notify('En az 2 üye seç', '👥'); return; }
      // seçim sırası değil, karakter listesindeki sıra
      const members = chars().filter(c => sel.has(c.id)).map(c => c.id);
      const title = el.querySelector('#gTitle').value.trim() || members.slice(0, 3).map(id => byId(id).name).join(', ');
      sh.close();
      if (t) {
        t.title = title;
        t.members = members;
        save();
        render();
      } else {
        const g = { id: Store.uid(), group: true, members, title, created: Date.now(), opened: 0 };
        threads().push(g);
        save();
        location.hash = `#/chat/${g.id}`;
      }
    };
  }

  // Karakterin son kaldığın sohbetini aç (hiç yoksa yeni bir tane)
  const openChat = c => { location.hash = `#/chat/${(currentThread(c) || newThread(c)).id}`; };

  // Sohbet adı sorma penceresi
  function askTitle(title, heading, cb) {
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>${esc(heading)}</h3>
      <form id="titleForm" autocomplete="off">
        <div class="field" style="margin-top:0"><input id="titleIn" maxlength="40" value="${esc(title)}" placeholder="ör. 1. Bölüm: Yanlış numara"></div>
        <button class="btn primary block" type="submit">Kaydet</button>
      </form>`, 'light');
    const input = sh.el.querySelector('#titleIn');
    setTimeout(() => { input.focus(); input.select(); }, 250);
    sh.el.querySelector('#titleForm').onsubmit = e => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      sh.close();
      cb(v);
    };
  }

  function save() {
    if (!Store.save()) notify('Depolama dolu! Albümden fotoğraf silmeyi dene.', '⚠️');
    if (sysCfg().on) { clearTimeout(sysTimer); sysTimer = setTimeout(() => sysPush().catch(() => notify('Sistem kaydı yapılamadı', '⚠️')), 1500); }
  }

  /* ---------- 💾 Sistem kaydı: yerelde (yerel-duzenleme.bat) eklediklerin js/data/system.js'e yazılır ----------
   * Dosyadakiler her cihazda bir kez "hazır" olarak eklenir (S().sysSeen: eklenenler; silersen geri gelmez).
   * Ayar bu tarayıcıda: { on, types: { events, places, scenarios, characters } } */
  const SYS_TYPES = [
    { k: 'events', label: '🎬 Kalıp olaylar ve olay grupları', on: true },
    { k: 'places', label: '📍 Mekanlar ve etiketleri', on: true },
    { k: 'scenarios', label: '📜 Senaryolar', on: true },
    { k: 'tags', label: '🏷️ Etiketler (senaryo, olay ve mekan etiketleri)', on: true },
    { k: 'cats', label: '🗂️ Olay kategorileri (sırası, eklediklerin, adları), 📶 dereceler, 📊 parametreler, ⚡ eşik olayları, 🤖 bot sonuçları ve 📏 Oluştur kuralları', on: true },
    { k: 'charFields', label: '🧩 Karakterlerin ek özellik alanları', on: true },
    { k: 'characters', label: '👤 Karakterler (cihazdan yüklenen fotoğraflar dosyayı büyütür)', on: false }
  ];
  // etiketler: hazır olanlar (js/data/monia.js) dışında eklediğin / kullandığın tüm senaryo ve olay etiketleri
  const sysTags = () => {
    const mo = S().monia || {}, uniq = (list, base) => [...new Set(list)].filter(t => t && !(base || []).includes(t));
    const inFile = (Stories.SYSTEM || {}).tags || {};
    return {
      scenario: uniq([...(inFile.scenario || []), ...(mo.scTagList || []), ...(mo.scenarios || []).flatMap(s => s.tags || [])], (Stories.MONIA || {}).scTags),
      event: uniq([...(inFile.event || []), ...(mo.evTagList || []), ...(mo.events || []).flatMap(e => e.tags || [])], (Stories.MONIA || {}).evTags)
    };
  };
  const sysSource = k => k === 'characters' ? S().characters : k === 'charFields' ? S().charFields || [] : k === 'tags' ? sysTags() : (S().monia || {})[k] || [];
  let sysTimer = null, sysLast = null, sysLocal = null, sysToldOnce = false, sysPulled = false;
  function sysCfg(v) {
    try {
      if (v) localStorage.setItem('amor-stories:system', JSON.stringify(v));
      const c = JSON.parse(localStorage.getItem('amor-stories:system')) || {};
      return { on: !!c.on, types: Object.assign(Object.fromEntries(SYS_TYPES.map(t => [t.k, t.on])), c.types) };
    } catch (e) { return { on: false, types: {} }; }
  }
  // yalnızca yerel sunucu (tools/bot-server.ps1) üzerinden açıldıysa yazılabilir
  async function sysCheck() {
    if (sysLocal !== null) return sysLocal;
    if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return (sysLocal = false);
    try { const r = await fetch('/api/ping', { cache: 'no-store' }); sysLocal = r.ok && (await r.json()).local === true; }
    catch (e) { sysLocal = false; }
    return sysLocal;
  }
  async function sysPush(force) {
    const cfg = sysCfg();
    if ((!cfg.on && !force) || !(await sysCheck())) return false;
    // ilk yazmadan önce dosyadakiler buraya çekilir: burada olmayanlar dosyadan silinmez, kopya da oluşmaz
    if (!sysPulled) await sysPull(true);
    const file = await (await fetch('/api/system', { cache: 'no-store' })).json();
    const out = Object.assign({}, file);
    SYS_TYPES.forEach(t => { if (cfg.types[t.k]) out[t.k] = sysSource(t.k); });
    if (cfg.types.places || cfg.types.tags) out.groups = (S().monia || {}).groups || [];
    if (cfg.types.cats) {
      const mo = S().monia || {};
      out.catEdits = Object.assign({}, file.catEdits || {}, mo.catEdits || {});
      if (mo.catOrder) out.catOrder = mo.catOrder;
      if (mo.levels) out.levels = mo.levels;
      if (mo.params) out.params = mo.params;
      if (mo.triggers) out.triggers = mo.triggers;
      if (mo.botOuts) out.botOuts = mo.botOuts;
      if (mo.crRules) out.crRules = mo.crRules;
      if (mo.sharedOuts) out.sharedOuts = mo.sharedOuts;
    }
    if (cfg.types.events) out.evGroups = (S().monia || {}).evGroups || [];
    const body = JSON.stringify(out, null, 1);
    if (!force && body === sysLast) return false;
    const r = await (await fetch('/api/system', { method: 'POST', body })).json();
    sysLast = body;
    if (r.ok && (force || !sysToldOnce)) { sysToldOnce = true; notify(r.changed ? 'Sisteme kaydedildi (js/data/system.js)' : 'Sistem dosyası zaten güncel', '💾'); }
    return r.ok;
  }
  /* 📥 Birleştirme: başka yerden gelen Monia verisi (system.js ya da başka cihazdan dışa aktarılan dosya) kopya yaratmadan eklenir.
   * Aynı kimlik: prefer 'incoming' ise gelen, 'local' ise buradaki kalır. Kimliği farklı ama içeriği aynıysa (moKey) eklenmez. */
  const MONIA_KEYS = ['cats', 'groups', 'places', 'events', 'evGroups', 'scenarios'];
  function moKey(k, x) {
    const n = s => String(s || '').toLocaleLowerCase('tr').trim();
    if (k === 'evGroups') return n(x.title);
    if (k === 'charFields') return n(x.label);
    if (k === 'events') return [x.cat || 'mine', n(x.title), n(x.text), (x.mix || []).join('+')].join('|');
    if (k === 'scenarios') return [n(x.title), (x.events || []).map(e => n(e.title)).join('+'), n(x.desc)].join('|');
    if (k === 'characters') return [n(x.name), x.set || ''].join('|');
    return n(x.name || x.label);
  }
  function mergeInto(list, items, k, prefer, r, fix) {
    (items || []).forEach(x0 => {
      if (!x0 || !x0.id) return;
      const x = fix ? fix(x0) : JSON.parse(JSON.stringify(x0));
      const hit = list.find(y => y.id === x.id);
      if (hit) {
        if (prefer === 'incoming' && JSON.stringify(hit) !== JSON.stringify(x)) { Object.keys(hit).forEach(kk => delete hit[kk]); Object.assign(hit, x); r.updated++; }
        else r.same++;
        return;
      }
      if (list.some(y => moKey(k, y) === moKey(k, x))) { r.same++; return; }
      list.push(x); r.added++;
    });
  }
  function mergeMonia(data, prefer, fixScenario) {
    const mo = S().monia = S().monia || {}, r = { added: 0, updated: 0, same: 0 };
    MONIA_KEYS.forEach(k => mergeInto(mo[k] = mo[k] || [], data[k], k, prefer, r, k === 'scenarios' ? fixScenario : null));
    if (data.characters) mergeInto(S().characters, data.characters, 'characters', prefer, r);
    if (data.charFields) mergeInto(S().charFields = S().charFields || [], data.charFields, 'charFields', prefer, r);
    ['levels', 'catOrder', 'params', 'triggers', 'botOuts', 'crRules', 'sharedOuts'].forEach(k => { if (data[k] && (prefer === 'incoming' || !mo[k])) mo[k] = JSON.parse(JSON.stringify(data[k])); });
    if (data.catEdits) mo.catEdits = prefer === 'incoming' ? Object.assign({}, mo.catEdits, data.catEdits) : Object.assign({}, data.catEdits, mo.catEdits);
    const tg = data.tags || {};
    if (tg.scenario) mo.scTagList = [...new Set([...(mo.scTagList || []), ...tg.scenario])];
    if (tg.event) mo.evTagList = [...new Set([...(mo.evTagList || []), ...tg.event])];
    return r;
  }
  // 🧹 aynı içerikli kopyaları siler (ilk eklenen kalır)
  function dedupeMonia() {
    const mo = S().monia || {};
    let n = 0;
    MONIA_KEYS.forEach(k => {
      const seen = new Set();
      mo[k] = (mo[k] || []).filter(x => { const key = moKey(k, x); if (seen.has(key)) { n++; return false; } seen.add(key); return true; });
    });
    return n;
  }
  // 📥 system.js'teki her şeyi buraya çek (eksikler eklenir; buradaki düzenlemelerin korunur)
  async function sysPull(quiet) {
    if (!(await sysCheck())) return null;
    const file = await (await fetch('/api/system', { cache: 'no-store' })).json();
    const r = mergeMonia(file, 'local');
    sysPulled = true;
    Store.save();
    if (!quiet) notify(`Sistemden çekildi: ${r.added} yeni${r.same ? `, ${r.same} zaten vardı` : ''}`, '📥');
    return r;
  }

  // js/data/system.js'teki hazırlar bu cihaza eklenir (bir kez)
  // Dosyada sonradan değişen bir kayıt (ör. olaya renk / emoji verildi) bu cihazda da güncellenir; ama burada
  // kendin değiştirdiysen seninki kalır. S().sysVer: kayıt -> en son dosyadan gelen halinin özeti.
  const sysHash = x => { const s = JSON.stringify(x); let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return String(h >>> 0); };
  function adoptSystem() {
    const SYS = Stories.SYSTEM || {};
    const seen = S().sysSeen = S().sysSeen || [];   // eski sürüm: sadece "eklendi" bilgisi (özet yok)
    const ver = S().sysVer = S().sysVer || {};
    const mo = S().monia = S().monia || {};
    let changed = false;
    ['cats', 'events', 'evGroups', 'places', 'groups', 'scenarios', 'characters', 'charFields'].forEach(k => {
      const target = k === 'characters' ? S().characters : k === 'charFields' ? (S().charFields = S().charFields || []) : (mo[k] = mo[k] || []);
      (SYS[k] || []).forEach(x => {
        if (!x || !x.id) return;
        const key = `${k}:${x.id}`, h = sysHash(x), before = ver[key];
        if (before === h) return;                        // dosyadaki hali değişmemiş
        const known = before != null || seen.includes(key);
        const i = target.findIndex(y => y.id === x.id);
        if (!known) {
          if (i < 0 && !target.some(y => moKey(k, y) === moKey(k, x))) target.push(JSON.parse(JSON.stringify(x)));
          seen.push(key);
        } else if (i >= 0 && (before == null || sysHash(target[i]) === before)) {
          // dosyadaki hali yenilenmiş, burada elle değiştirilmemiş: güncelle (burada sildiysen geri gelmez)
          target[i] = JSON.parse(JSON.stringify(x));
        }
        ver[key] = h;
        changed = true;
      });
    });
    if (changed) Store.save();
  }

  function notify(text, icon = '💜') {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span style="font-size:28px">${icon}</span><div class="info"><b>${esc(text)}</b></div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2600);
  }

  function sheet(html, cls = '') {
    const wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = `<div class="sheet ${cls}">${html}</div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('open'));
    function close() { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 250); }
    return { el: wrap.firstElementChild, close };
  }

  // Fotoğrafı küçültür (localStorage'a sığsın diye). square: ortadan kare kırpar
  function readPhoto(file, max, square) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (square) { const s = Math.min(sw, sh); sx = (sw - s) / 2; sy = (sh - s) / 2; sw = sh = s; }
        const k = Math.min(1, max / Math.max(sw, sh));
        const cv = document.createElement('canvas');
        cv.width = Math.round(sw * k);
        cv.height = Math.round(sh * k);
        cv.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/jpeg', .85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    });
  }

  /* ---------- Yönlendirme ---------- */
  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    const [name = 'home', id, extra] = parts;
    return { name, id, extra };
  }

  function render() {
    const r = ui.route = parseRoute();
    const t = r.name === 'chat' ? threadById(r.id) : null;
    const c = t ? (t.group ? null : byId(t.charId)) : r.id ? byId(r.id) : null;
    ui.chatKeys = null;
    view.onclick = null;
    view.onchange = null;
    const full = ['p', 'chat'].includes(r.name) || (r.name === 'create' && r.id);
    app.classList.toggle('no-nav', !!full);
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.tab === r.name && !full));
    document.querySelectorAll('.sheet-wrap, .lightbox').forEach(el => el.remove());
    clearTimeout(playTimer);
    clearTimeout(botTimer);
    window.scrollTo(0, 0);
    // sayfa değişince yumuşak geçiş (aynı sayfanın yeniden çizilmesinde değil)
    if (ui.lastPage !== location.hash) {
      ui.prevPage = ui.lastPage;
      ui.lastPage = location.hash;
      view.classList.remove('page-in');
      void view.offsetWidth;
      view.classList.add('page-in');
    }

    if ((r.name === 'p' && !c) || (r.name === 'chat' && !(t && (t.group || c)))) { location.hash = '#/home'; return; }
    syncMusic();
    // 🤖 bot editöründen çıkınca kaydedilen kurallar uygulamaya gelir
    if (ui.lastRoute === 'bot' && r.name !== 'bot') reloadBotRules().then(ok => { if (ok && ui.route.name === 'monia' && ui.route.id === 'sonuc') renderMonia('sonuc'); });
    ui.lastRoute = r.name;
    drawHelper(false);
    switch (r.name) {
      case 'bot': return renderBot();
      case 'kurallar': return renderRulesPage();
      case 'hikayeler': return renderHomeMonia();
      case 'messages': return renderMessages();
      case 'me': return renderMe();
      case 'monia': return renderMonia(r.id, r.extra);
      case 'p': return renderProfile(c);
      case 'chat': return renderChat(c, t);
      case 'create': return renderCreate(r.id && byId(r.id) ? r.id : null);
      default: return renderHome();
    }
  }

  /* ---------- 🤖 Bot editörü: yerel düzenlemede (yerel-duzenleme.bat) tools/bot-editor.html uygulamanın içinde açılır ---------- */
  async function reloadBotRules() {
    try {
      const r = await fetch('/api/bot-rules', { cache: 'no-store' });
      if (!r.ok) return false;
      Stories.BOT_RULES = await r.json();
      return true;
    } catch (e) { return false; }
  }
  function renderBot() {
    view.innerHTML = `<div class="page-pad bot-page">
      ${pageHero('bot', '🤖', 'Bot editörü', [botRules().length + ' kural', 'yerel düzenleme'], '<a class="btn primary sm pg-act" href="#/monia/sonuc">🎲 Sebep-sonuç</a>', { back: '#/me' })}
      <div id="botBody" class="about card">Yerel sunucu kontrol ediliyor…</div></div>`;
    sysCheck().then(ok => {
      const b = $('#botBody');
      if (!b) return;
      if (!ok) { b.innerHTML = '⚪ Bot editörü sadece <b>yerel-duzenleme.bat</b> ile açınca çalışır (kurallar <b>js/data/bot-rules.js</b> dosyasına yazılır).'; return; }
      b.outerHTML = '<iframe class="bot-frame" src="tools/bot-editor.html" title="Bot editörü"></iframe>';
    });
  }

  /* ---------- Ana sayfa ---------- */
  /* Ana sayfa: üç büyük, eğik duran kart (💬 Chat · 🎬 Monia · ✨ Oluştur); her kartta resim havuzundan bir fotoğraf
   * (hazır fotoğraf setleri + karakterlerin fotoğrafları). Fotoğraflar oturum boyunca aynı kalır, 🎲 ile değişir */
  const homePool = () => [...new Set([
    ...SETS.flatMap(s => [s.profile, ...(s.photos || [])].filter(Boolean).map(f => photoUrl(s, f))),
    ...chars().flatMap(c => [c.photo, ...(c.album || [])]).filter(u => u && !/^data:/.test(u))
  ])];
  function renderHome() {
    const pool = homePool();
    if (!ui.homePics || ui.homePics.some(u => u && !pool.includes(u))) ui.homePics = sample(pool, 3);
    const pics = ui.homePics;
    const cards = [
      { k: 'chat', href: '#/messages', icon: '💬', title: 'Chat', sub: `${threads().length} sohbet · ${chars().length} karakter` },
      { k: 'monia', href: '#/hikayeler', icon: '🎬', title: 'Monia', sub: `${MO().scenarios.length} senaryo · ${allEvents().length} olay` },
      { k: 'create', href: '#/create', icon: '✨', title: 'Oluştur', sub: 'fotoğraf + kişilik' }
    ];
    view.innerHTML = `
      <div class="page-pad home home-land">
        <div class="hl-head">
          <div><small>Merhaba${S().user.name ? ' ' + esc(S().user.name) : ''} 💗</small><h1>Carmen</h1></div>
          <button type="button" class="icon-btn hl-dice" id="hlShuffle" aria-label="Fotoğrafları değiştir" title="Fotoğrafları değiştir">🎲</button>
        </div>
        ${(() => { const m = meetDraft(); return `<div class="hl-meet" id="hlMeet" role="button" tabindex="0">
          ${m.photo ? `<img src="${esc(m.photo)}" alt="" onerror="this.remove()">` : ''}<span class="hl-shade"></span>
          <span class="hl-ic">👋</span>
          <span class="hl-txt"><small>Tanış</small><b>${esc(m.name || 'Yeni biri')}${m.age ? `, ${esc(m.age)}` : ''}</b>
            <small>${esc([m.city, m.job].filter(Boolean).join(' · '))}</small>
            <span class="hl-tr">${m.traits.filter(t => (T.groups.find(g => g.id === 'personality') || { values: [] }).values.includes(t)).slice(0, 3).map(t => `<em>${esc(t)}</em>`).join('')}</span></span>
          <button type="button" class="hl-reroll" id="hlReroll" aria-label="Başka biri" title="Başka biri">🎲</button>
          <span class="hl-go">💬</span>
        </div>`; })()}
        <div class="hl-deck">${cards.map((c, i) => `
          <a class="hl-card hl-${c.k}" href="${c.href}" style="--i:${i}">
            ${pics[i] ? `<img src="${esc(pics[i])}" alt="" loading="${i ? 'lazy' : 'eager'}" onerror="this.remove()">` : ''}
            <span class="hl-shade"></span>
            <span class="hl-ic">${c.icon}</span>
            <span class="hl-txt"><b>${c.title}</b><small>${esc(c.sub)}</small></span>
            <span class="hl-go">›</span>
          </a>`).join('')}
        </div>
      </div>`;
    $('#hlShuffle').onclick = () => { ui.homePics = sample(homePool(), 3); renderHome(); };
    // 👋 Tanış: önceden üretilmiş rastgele karakter kaydedilir, sohbeti açılır ve ilk selamı o verir
    $('#hlMeet').onclick = e => {
      if (e.target.closest('#hlReroll')) { ui.meet = null; renderHome(); return; }
      const c = Object.assign(meetDraft(), { id: Store.uid(), created: Date.now() });
      ui.meet = null;
      chars().push(c);
      const t = newThread(c, 'Tanışma');
      msgsOf(t).push({ id: Store.uid(), from: 'her', text: pick([`Selam 👋 ben ${c.name.split(' ')[0]}`, 'Heyy, merhaba 😊', `Merhaba! ${c.city ? c.city + "'dan " : ''}yazıyorum 🙈`]), ts: Date.now() });
      save();
      notify(`${c.name} ile tanıştın`, '👋');
      location.hash = `#/chat/${t.id}`;
    };
  }
  /* 💁 Yardımcı karakter (Lia): sol altta kartının ucu görünür; dokununca bulunduğun sayfanın kurallarını adım adım anlatır.
   * Sohbette ucu görünmez, ⋯ Diğer → 💁 Yardım ile açılır. Küçültme bu tarayıcıda hatırlanır */
  const HELPER = { name: 'Lia', role: 'Yardımcın' };
  const HELP = {
    home: ['Merhaba! Ben Lia 💁‍♀️ Burada yapay zeka yok: hikayeyi sen yazarsın, iki tarafı da.', '👋 <b>Tanış</b> kartı rastgele birini hazırlar. Dokununca kaydedilir ve sohbet açılır; 🎲 ile başka biri gelir.', '💬 <b>Chat</b> sohbetlerin, 🎬 <b>Monia</b> hikayelerin, ✨ <b>Oluştur</b> kendi karakterini yapman için.', 'Sağ üstteki 🎲 kartların fotoğraflarını değiştirir.'],
    messages: ['Üstteki yuvarlak avatarlardan birine dokun: son sohbetine gider, yoksa yenisini açar.', 'Bir sohbete <b>basılı tut</b>: sabitle (en fazla 4), adını değiştir ya da sil.', '👥 <b>Yeni grup</b> ile birden çok karakterle aynı sohbeti yazabilirsin.'],
    chat: ['Alttaki avatara dokunarak <b>kimin yazdığını</b> seç: sen sağda, karakter solda. ⇄ Sırayla açıksa taraf her mesajdan sonra değişir.', '<b>#</b> yazınca olaylar çıkar (ör. <b>#cowg</b> → Enter). Olay senin mesajın olur, 🎲 sonucu karakterden gelir.', 'Sonuçlar 📊 parametreleri ve 🔘 durumları değiştirir. Üstteki 📊 kart ve sağ üstteki 🙋 barlar anlık gösterir.', 'Bir mesaja dokunarak düzenle, tepki ver ya da cevapla. ↶ son değişikliği geri alır.', '🤖 Bot modu açıksa karakter bot kurallarına göre cevap verir; kuralın 🎲 sonucu da uygulanır.'],
    create: ['🎲 <b>Hepsi</b> rastgele bir karakter kurar; her bölümün kendi 🎲 düğmesi de var.', '📏 <b>Kurallar</b>: bir özellik varken olamayacakları belirler (ör. Virgo → Loose olamaz). Kurala aykırı seçenek soluk görünür ve seçilemez.', '❤️ Sevdiği / 💔 sevmediği olaylar sadece <b>event</b> etiketli kategorilerden seçilir.', '🧩 Ek özellikler: Hamile, Bakire gibi aç/kapa durumlar burada; sohbetteki olaylar bunları değiştirebilir.'],
    hikayeler: ['🎲 <b>Senaryo üret</b> zaman, mekan ve olaylardan hazır bir hikaye kurar.', '▶️ <b>Başlat</b> yeni bir sohbet açar; olaylar sohbette sırayla 📜 kart olarak gelir.', 'Oynanan hikayelerde 💬 <b>Devam et</b> kaldığın yere götürür.'],
    monia: ['Monia Paneli olayların ve senaryoların merkezi. Olaylar kategorilerde durur.', 'Bir olaya dokununca editörü açılır: renk, emoji, 🪜 alt dereceler, 🎲 sonuçlar, ⚡ olunca etkileri.', 'Kategoriye <b>event</b> etiketi verirsen sohbette üstte çıkar ve sevdiği / sevmediği listelerinde seçilir. <b>if</b> etiketi şart seçiminde üstte çıkar.', '<b>event</b> etiketli bir kategoriden olay olunca karakterin 🔘 Bakire durumu Hayır olur.'],
    olay: ['🎲 Sonuçların yüzdesi toplam %100\'ü geçmesin; eksik kalan kısım "sonuç yok" demek.', '🔒 Şart tutmazsa sonuç engellenir; ⭐ varsayılan sonuç o zaman devreye girer.', '↪ Sonraki olay seçersen o sonuç çıkınca seçtiğin olay hemen ardından gelir.', '⧉ çoğaltır, 📋 kopyalar; kopyaladığını başka olaya 📥 yapıştırırsın.'],
    sonuc: ['🎲 Her olayın sonucu yüzdelere göre seçilir; toplam %100\'den azsa kalanı "sonuç yok".', '📈 Sonuç parametreyi artırır / azaltır, 🔘 durumu Evet / Hayır yapar. Metne <b>{+Aşk}</b> gibi özel kelime de yazabilirsin.', '🔒 Şart tutmazsa sonuç engellenir; ⭐ varsayılan sonuç devreye girer.', '⚡ Eşik olayları: bir değer sınırı geçince olay kendiliğinden gelir.', '🙋 "Ben" parametreleri (ör. Zevk) sende tutulur ve sohbette sağ üstte bar olarak görünür.', '🔗 Ortak sonuç: birden çok olay aynı sonuçları paylaşır. 🤖 Bot kuralları da sonuç üretebilir.', 'Değişiklikler 💾 <b>Kaydet</b>\'e basınca geçerli olur.'],
    gruplar: ['🧺 Grup birden çok olayı bir arada tutar; olay seçerken grubu seçince içindekilerin hepsi gelir.'],
    kategoriler: ['Adını, simgesini, ▲▼ sırasını ve 🏷️ etiketlerini değiştir. Kategoriler ilk etiketlerine göre gruplanır.', '<b>event</b>: sohbette üstte + sevdiği / sevmediği. <b>if</b>: şartlarda üstte. Küçük harfle yaz!'],
    kurallar: ['Her kural: "Eğer şu varsa → şunlar olamaz". Tüm karakterler için geçerlidir.', 'Kurala uymayan karakterler kartta ⚠️ ile görünür; düzeltmek sana kalmış.'],
    bot: ['Bot kuralları bir kelime geçince karakterin ne cevap vereceğini belirler.', 'Bir kuralın 🎲 sonucunu Sebep-Sonuç → 🤖 kartından eklersin.', 'Bot editörü sadece <b>yerel-duzenleme.bat</b> ile açınca çalışır.'],
    me: ['Burada adın, fotoğrafın, 🎵 müzik, ⚙️ ayarlar ve 💾 yedek var.', '💾 Veri → <b>Yedekle</b> ile her şeyi dosyaya alırsın. Sistem kaydı yerel düzenlemede eklediklerini dosyaya yazar.', '⚙️ Ayarlar → 📏 Oluştur kuralları paneline buradan da gidebilirsin.'],
    p: ['Profilde karakterin sohbetleri, albümü ve 🔘 durumları var. ✏️ ile düzenlersin.']
  };
  const helpKey = () => { const r = ui.route || {}; if (r.name === 'monia') return ['sonuc', 'gruplar', 'kategoriler', 'olay'].includes(r.id) ? r.id : 'monia'; return HELP[r.name] ? r.name : 'home'; };
  const helperMin = v => { try { if (v != null) localStorage.setItem('amor-stories:helper', v ? 'min' : ''); return localStorage.getItem('amor-stories:helper') === 'min'; } catch (e) { return false; } };
  function drawHelper(open) {
    let el = document.getElementById('helper');
    if (!el) { el = document.createElement('div'); el.id = 'helper'; document.body.appendChild(el); }
    const key = helpKey(), tips = HELP[key], pool = homePool(), pic = pool.length ? pool[+sysHash('helper-lia') % pool.length] : '';
    if (ui.helpKey !== key) { ui.helpKey = key; ui.helpI = 0; }
    const i = Math.min(ui.helpI || 0, tips.length - 1);
    const ava = `<span class="hp-ava">${pic ? `<img src="${esc(pic)}" alt="">` : '💁‍♀️'}</span>`;
    el.className = `helper${open ? ' open' : ''}${helperMin() ? ' min' : ''}`;
    el.dataset.route = (ui.route || {}).name || 'home';
    el.innerHTML = open ? `<div class="hp-card">
        <div class="hp-head">${ava}<div><b>${HELPER.name}</b><small>${HELPER.role} · ${i + 1}/${tips.length}</small></div><button type="button" class="hp-x" data-hp="close" aria-label="Kapat">✕</button></div>
        <div class="hp-say" style="--k:${i}">${tips[i]}</div>
        <div class="hp-nav"><button type="button" data-hp="prev"${i ? '' : ' disabled'}>‹</button>
          <span>${tips.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</span>
          <button type="button" data-hp="next">${i < tips.length - 1 ? 'Sonraki ›' : 'Tamam ✓'}</button></div>
        <button type="button" class="hp-hide" data-hp="min">${helperMin() ? '👀 Hep göster' : '🙈 Küçült'}</button>
      </div>` : `<button type="button" class="hp-peek" data-hp="open" aria-label="Yardımcı: ${HELPER.name}">${ava}<span class="hp-bub">${helperMin() ? '?' : 'Nasıl çalışır? 💬'}</span></button>`;
    el.onclick = e => {
      const b = e.target.closest('[data-hp]');
      if (!b) return;
      const a = b.dataset.hp;
      if (a === 'open') return drawHelper(true);
      if (a === 'close') return drawHelper(false);
      if (a === 'min') { helperMin(!helperMin()); return drawHelper(false); }
      if (a === 'prev') ui.helpI = Math.max(0, i - 1);
      if (a === 'next') { if (i >= tips.length - 1) { ui.helpI = 0; return drawHelper(false); } ui.helpI = i + 1; }
      drawHelper(true);
    };
  }
  // Tanış kartındaki karakter: oturum boyunca aynı kalır, 🎲 ile yenisi gelir
  const meetDraft = () => {
    if (!ui.meet) { const d = blankChar(); const mod = ui.createMod; ui.createMod = 'amor'; randomize(d, 'all'); ui.createMod = mod; ui.meet = d; }
    return ui.meet;
  };

  function infoChips(c) {
    return [
      c.age || c.gender ? `<span class="chip sex">${esc(c.gender || '')} ${esc(c.age || '')}</span>` : '',
      c.city ? `<span class="chip loc">📍 ${esc(c.city)}</span>` : '',
      c.zodiac ? `<span class="chip zod">✦ ${esc(c.zodiac)}</span>` : ''
    ].join('');
  }

  // Yukarı kaydırınca banner'lar küçülür (eşik aralığı titremeyi önler)
  window.addEventListener('scroll', () => {
    const h = $('.home');
    if (!h) return;
    if (window.scrollY > 120) h.classList.add('compact');
    else if (window.scrollY < 20) h.classList.remove('compact');
  }, { passive: true });

  /* ---------- Mesajlar ---------- */
  // Geniş ekranda (≥1024px) mesaj listesi ve sohbet yan yana
  const wideMQ = window.matchMedia('(min-width: 1024px)');
  const wide = () => wideMQ.matches;

  // Karakter başına tek satır (son kaldığın sohbetin adı ve son mesajı) + her grup ayrı satır
  function msgRowsHtml(activeKey) {
    const rows = [
      ...chars().filter(c => currentThread(c)).map(c => ({ key: c.id, act: activity(currentThread(c)), html: a => msgRow(c, a) })),
      ...groups().map(t => ({ key: t.id, act: activity(t), html: a => groupRow(t, a) }))
    ];
    const pins = pinned();
    rows.sort((a, b) => {
      const pa = pins.indexOf(a.key), pb = pins.indexOf(b.key);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return b.act - a.act;
    });
    return rows.length ? rows.map((r, i) => r.html(r.key === activeKey).replace('class="msg-row', `style="--i:${Math.min(i, 12)}" class="msg-row`)).join('')
      : '<div class="empty"><span class="big">💌</span>Henüz sohbet yok.<br>Yukarıdan bir karaktere dokun ya da 👥 grup kur!</div>';
  }

  function groupRow(t, active) {
    const last = lastOf(t);
    const ms = membersOf(t);
    const who = !last ? '' : last.from === 'me' ? 'Sen: ' : last.from === 'sys' ? '📝 ' : `${(byId(last.who) || GHOST).name}: `;
    return `
      <button class="msg-row ${active ? 'active' : ''} ${isPinned(t.id) ? 'pinned' : ''}" data-gid="${t.id}"${t.scenario ? ' data-sc="1"' : ''}>
        ${groupAvatar(t, 62)}
        <div class="info">
          <div class="top"><span class="name">${esc(t.title)}</span><span class="time">${isPinned(t.id) ? '<span class="pin">📌</span>' : ''}${fmtTime(activity(t))}</span></div>
          <div class="last-chat">👥 <b>${esc(ms.map(m => m.name).join(', '))}</b></div>
          <div class="bottom">
            <div class="last">${last ? esc(who + preview(last)) : 'Henüz mesaj yok'}</div>
          </div>
        </div>
      </button>`;
  }

  function msgRow(c, active) {
    const t = currentThread(c);
    const last = lastOf(t);
    const n = threadsOf(c).length;
    const who = !last ? '' : last.from === 'me' ? 'Sen: ' : last.from === 'sys' ? '📝 ' : '';
    return `
      <button class="msg-row ${active ? 'active' : ''} ${isPinned(c.id) ? 'pinned' : ''}" data-id="${c.id}"${threadsOf(c).some(x => x.scenario) ? ' data-sc="1"' : ''}>
        ${avatar(c, 62)}
        <div class="info">
          <div class="top"><span class="name">${esc(c.name)}</span><span class="time">${isPinned(c.id) ? '<span class="pin">📌</span>' : ''}${fmtTime(activity(t))}</span></div>
          <div class="last-chat">💬 <b>${esc(t.title)}</b></div>
          <div class="bottom">
            <div class="last">${last ? esc(who + preview(last)) : 'Henüz mesaj yok'}</div>
            ${n > 1 ? `<span class="chip lv">🗂️ ${n}</span>` : ''}
          </div>
        </div>
      </button>`;
  }

  /* ---------- Sabitleme (karakter ya da grup, en fazla 4) ---------- */
  const MAX_PINS = 4;
  // Önceki sürümde sohbet id'si saklanıyordu; karakter id'sine çevrilir (gruplar kendi id'siyle kalır)
  const pinned = () => (S().pinned = [...new Set((S().pinned || []).map(id => (threadById(id) || {}).charId || id))]
    .filter(id => byId(id) || (threadById(id) || {}).group));
  const isPinned = id => pinned().includes(id);

  function togglePin(id) {
    const pins = pinned();
    if (pins.includes(id)) {
      S().pinned = pins.filter(x => x !== id);
      notify('Sabitleme kaldırıldı', '📌');
    } else {
      if (pins.length >= MAX_PINS) { notify(`En fazla ${MAX_PINS} sohbet sabitlenebilir`, '📌'); return; }
      pins.push(id);
      notify('En üste sabitlendi', '📌');
    }
    save();
    refreshList();
  }

  function deleteThread(t) {
    if (!confirm(`“${t.title}” sohbeti ve tüm mesajları silinsin mi?`)) return false;
    S().threads = threads().filter(x => x.id !== t.id);
    delete S().chats[t.id];
    delete S().side[t.id];
    delete S().turns[t.id];
    save();
    return true;
  }

  function renameThread(t, done) {
    askTitle(t.title, 'Sohbetin adı', v => { t.title = v; save(); done(); });
  }

  // Aynı başlangıçtan farklı bir son yazmak için sohbetin kopyası
  function duplicateThread(t) {
    const c = byId(t.charId);
    const copy = newThread(c, `${t.title} (kopya)`);
    copy.created = t.created;
    S().chats[copy.id] = JSON.parse(JSON.stringify(msgsOf(t)));
    if (S().side[t.id]) S().side[copy.id] = S().side[t.id];
    if (S().turns[t.id] === false) S().turns[copy.id] = false;
    save();
    return copy;
  }

  function createThread(c) {
    askTitle(`Sohbet ${threadsOf(c).length + 1}`, `${c.name} ile yeni sohbet`, v => {
      location.hash = `#/chat/${newThread(c, v).id}`;
    });
  }

  function groupActions(t) {
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <div class="row-act-head">${groupAvatar(t, 44)}<b>${esc(t.title)}</b></div>
      <button class="act" data-act="pin">📌 ${isPinned(t.id) ? 'Sabitlemeyi kaldır' : `En üste sabitle <small>(${pinned().length}/${MAX_PINS})</small>`}</button>
      <button class="act" data-act="edit">👥 Grubu düzenle</button>
      <button class="act danger" data-act="delete">🗑️ Grubu sil</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      sh.close();
      const a = b.dataset.act;
      if (a === 'pin') togglePin(t.id);
      if (a === 'edit') groupSheet(t);
      if (a === 'delete' && deleteThread(t)) render();
    };
  }

  // Basılı tutunca / sağ tıklayınca açılan işlemler
  function rowActions(id) {
    const g = threadById(id);
    if (g && g.group) return groupActions(g);
    const c = byId(id);
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <div class="row-act-head">${avatar(c, 44)}<b>${esc(c.name)}</b></div>
      <button class="act" data-act="pin">📌 ${isPinned(id) ? 'Sabitlemeyi kaldır' : `En üste sabitle <small>(${pinned().length}/${MAX_PINS})</small>`}</button>
      <button class="act" data-act="chats">🗂️ Sohbetleri düzenle <small>(${threadsOf(c).length})</small></button>
      <button class="act" data-act="new">➕ Yeni sohbet</button>
      <button class="act" data-act="profile">👤 Profili gör</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      sh.close();
      const a = b.dataset.act;
      if (a === 'pin') togglePin(id);
      if (a === 'new') createThread(c);
      if (a === 'chats' || a === 'profile') { ui.profileTab = a === 'chats' ? 'chats' : 'profile'; location.hash = `#/p/${c.id}`; }
    };
  }

  // 💬 Mesaj listesi: arama + süzgeç (Tümü / Sabitli / Gruplar / Senaryo); süzme sayfayı yeniden çizmez
  const MSG_FILTERS = [['all', 'Tümü'], ['pin', '📌 Sabitli'], ['group', '👥 Gruplar'], ['sc', '🎬 Senaryo']];
  /* Sayfa başı (başlık kartı): fotoğraf + renkli perde + başlık + sayı çipleri. Chat / Monia / Oluştur ana sayfadaki kartın
   * fotoğrafını, diğer paneller resim havuzundan kendine sabit bir fotoğrafı kullanır. opts: { back, pic } */
  function pageHero(k, icon, title, chips, extra = '', opts = {}) {
    const i = { chat: 0, monia: 1, create: 2 }[k], pool = homePool();
    const pic = opts.pic || (i != null && (ui.homePics || [])[i]) || (pool.length ? pool[+sysHash(k) % pool.length] : '');
    return `<div class="pg-hero pg-${k}">
      ${pic ? `<img src="${esc(pic)}" alt="" onerror="this.remove()">` : ''}<span class="pg-shade"></span>
      <a class="icon-btn pg-back" href="${esc(opts.back || '#/home')}" aria-label="Geri">${ICON.arrowLeft}</a>
      <div class="pg-txt"><span class="pg-ic">${icon}</span><b>${title}</b>
        <div class="pg-chips">${chips.filter(Boolean).map(c => `<span>${c}</span>`).join('')}</div></div>
      ${extra}</div>`;
  }
  // 💬 karakter şeridi: dokununca son sohbetine gider (sohbeti yoksa yenisi açılır)
  const charStrip = () => chars().length ? `<div class="ch-strip">
      <a class="ch-ava ch-new" href="#/create"><span>＋</span><small>Yeni</small></a>
      ${[...chars()].sort((a, b) => (currentThread(b) ? activity(currentThread(b)) : b.created || 0) - (currentThread(a) ? activity(currentThread(a)) : a.created || 0))
        .map((c, i) => `<button type="button" class="ch-ava${currentThread(c) ? ' has' : ''}" data-cav="${c.id}" style="--i:${i}">${avatar(c, 56)}<small>${esc(c.name.split(' ')[0])}</small></button>`).join('')}
    </div>` : '';
  function messagesPanel(activeKey) {
    const f = ui.msgFilter || 'all';
    return `<div class="msg-panel">
      ${pageHero('chat', '💬', 'Chat', [`${threads().length} sohbet`, `${chars().length} karakter`, groups().length ? `${groups().length} grup` : ''],
        '<button class="btn primary sm pg-act" id="newGroup" type="button">👥 Yeni grup</button>')}
      ${charStrip()}
      <div class="page-pad">
        <label class="mo-search msg-search"><span>🔍</span><input type="search" id="msgSearch" placeholder="Kişi, sohbet ya da mesaj ara…" value="${esc(ui.msgQuery || '')}"></label>
        <div class="msg-filters">${MSG_FILTERS.map(([k, l]) => `<button type="button" data-mf="${k}" class="${f === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      ${!S().user.name ? '<a class="notice" href="#/me" style="display:block">Adını yazarsan sohbetlerde senin adın görünür ✨</a>' : ''}
      <div class="pin-hint">📌 Sabitlemek için basılı tut · sohbetleri karakterin profilinden düzenle · ${pinned().length}/${MAX_PINS}</div>
      <div class="list" id="msgRows">${msgRowsHtml(activeKey)}</div>
      <div class="empty msg-none" id="msgNone" hidden><span class="big">🔍</span>Eşleşen sohbet yok</div></div>`;
  }
  function filterRows(root) {
    const q = (ui.msgQuery || '').toLocaleLowerCase('tr').trim(), f = ui.msgFilter || 'all';
    let n = 0;
    root.querySelectorAll('.msg-row').forEach(r => {
      const kind = f === 'all' || (f === 'pin' && r.classList.contains('pinned')) || (f === 'group' && r.dataset.gid) || (f === 'sc' && r.dataset.sc);
      const hit = kind && (!q || r.textContent.toLocaleLowerCase('tr').includes(q));
      r.hidden = !hit;
      if (hit) n++;
    });
    const none = root.querySelector('#msgNone');
    if (none) none.hidden = !!n || !root.querySelector('.msg-row');
  }

  function bindRows(root) {
    const ng = root.querySelector('#newGroup');
    if (ng) ng.onclick = () => groupSheet();
    root.querySelectorAll('[data-cav]').forEach(b => b.onclick = () => openChat(byId(b.dataset.cav)));
    const ms = root.querySelector('#msgSearch');
    if (ms) ms.oninput = () => { ui.msgQuery = ms.value; filterRows(root); };
    root.querySelectorAll('[data-mf]').forEach(b => b.onclick = () => {
      ui.msgFilter = b.dataset.mf;
      root.querySelectorAll('[data-mf]').forEach(x => x.classList.toggle('on', x === b));
      filterRows(root);
    });
    filterRows(root);
    root.querySelectorAll('.msg-row').forEach(r => {
      const key = r.dataset.gid || r.dataset.id;
      let timer = null, long = false;
      const cancel = () => clearTimeout(timer);
      r.onpointerdown = () => { long = false; timer = setTimeout(() => { long = true; rowActions(key); }, 500); };
      r.onpointerup = cancel;
      r.onpointerleave = cancel;
      r.onpointercancel = cancel;
      r.oncontextmenu = e => { e.preventDefault(); cancel(); long = true; rowActions(key); };
      r.onclick = () => {
        if (long) { long = false; return; }
        if (r.dataset.gid) location.hash = `#/chat/${key}`; else openChat(byId(key));
      };
    });
  }

  // Listede seçili satır: açık sohbetin karakteri ya da grubu
  const activeKey = () => { const t = ui.route.name === 'chat' && threadById(ui.route.id); return t ? (t.group ? t.id : t.charId) : null; };

  function refreshList() {
    const rows = $('#msgRows');
    if (!rows) return;
    rows.innerHTML = msgRowsHtml(activeKey());
    bindRows(rows.parentElement);
    const hint = $('.pin-hint');
    if (hint) hint.textContent = `📌 Sabitlemek için basılı tut · sohbetleri karakterin profilinden düzenle · ${pinned().length}/${MAX_PINS}`;
  }

  function renderMessages() {
    if (wide()) {
      view.innerHTML = `<div class="split"><aside class="split-list">${messagesPanel(null)}</aside>
        <section class="split-empty"><span>💌</span><b>Bir sohbet seç</b><small>Soldaki listeden birine tıkla ya da ana sayfadan bir karakterle yazmaya başla.</small></section></div>`;
      bindRows($('.split-list'));
      return;
    }
    view.innerHTML = messagesPanel(null);
    bindRows(view);
  }

  /* ---------- Profil ---------- */
  function renderProfile(c) {
    const cover = c.album[0] || c.photo;
    const list = threadsOf(c);
    const kwN = keywords().filter(k => k.charId === c.id).length;
    const tabs = [['profile', 'Profil'], ['chats', `Sohbetler (${list.length})`], ['keys', `Kelimeler${kwN ? ` (${kwN})` : ''}`], ['album', 'Albüm']];
    const cur = list[0];

    view.innerHTML = `<div class="profile">
      <div class="cover" style="background:${grad(c)}">
        ${cover ? `<img class="cover-bg" src="${esc(cover)}" alt="" aria-hidden="true"><img class="cover-fg" src="${esc(cover)}" alt="" data-zoom="0">` : ''}
      </div>
      <a class="round-btn left" href="#/home" aria-label="Geri">${ICON.back}</a>
      <a class="round-btn right" href="#/create/${c.id}" aria-label="Düzenle">${ICON.edit}</a>

      <div class="pcard">
        ${avatar(c, 96)}
        <div class="pname">${esc(c.name)}</div>
        <div class="pbio">${esc(c.bio || '')}</div>
        <div class="chips">
          ${infoChips(c)}
          ${c.traits[0] ? `<span class="chip arch">💫 ${esc(c.traits[0])}</span>` : ''}
          ${(c.tags || []).map(t => `<button type="button" class="chip utag" data-tag="${esc(t)}" title="Kaldırmak için dokun">🏷️ ${esc(t)}</button>`).join('')}
          <button type="button" class="chip tag-add" id="tagAdd">+ etiket</button>
        </div>
        <div class="stats">
          <div><b>${list.length}</b><span>Sohbet</span></div>
          <div><b>${msgCount(c)}</b><span>Mesaj</span></div>
          <div><b>${c.album.length}</b><span>Fotoğraf</span></div>
        </div>
      </div>

      <div class="sheet-body">
        <div class="tabs dark">
          ${tabs.map(([k, t]) => `<button data-t="${k}" class="${ui.profileTab === k ? 'active' : ''}">${t}</button>`).join('')}
        </div>
        <div id="ptab">${profileTab(c)}</div>
      </div>

      <div class="cta-bar">
        <button class="follow" id="newChat" aria-label="Yeni sohbet">➕</button>
        <button class="btn primary" id="goChat">💬 ${cur ? `${esc(cur.title)} · devam et` : 'mesaj yaz'}</button>
      </div></div>`;

    const bindTab = () => {
      $('#ptab').querySelectorAll('[data-thread]').forEach(r => r.onclick = () => { location.hash = `#/chat/${r.dataset.thread}`; });
      const nb = $('#ptab').querySelector('#newChat2');
      if (nb) nb.onclick = () => createThread(c);
      const ng = $('#ptab').querySelector('#newGroup2');
      if (ng) ng.onclick = () => groupSheet(null, c.id);
      const kb = $('#ptab').querySelector('#kwEdit');
      if (kb) kb.onclick = () => keywordSheet({ chars: [c.id], onChange: () => { ui.profileTab = 'keys'; refresh(); } });
      // Sohbet düzenleme: ad değiştir, kopyala, sil (sekme yerinde yenilenir)
      const redraw = () => { ui.profileTab = 'chats'; refresh(); };
      $('#ptab').querySelectorAll('[data-tact]').forEach(b => b.onclick = () => {
        const t = threadById(b.dataset.tid);
        const a = b.dataset.tact;
        if (a === 'rename') renameThread(t, redraw);
        if (a === 'copy') { duplicateThread(t); notify('Sohbetin kopyası oluşturuldu', '📄'); redraw(); }
        if (a === 'delete' && deleteThread(t)) redraw();
      });
    };
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      ui.profileTab = b.dataset.t;
      view.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('active', x === b));
      $('#ptab').innerHTML = profileTab(c);
      bindTab();
    });
    bindTab();
    $('#newChat').onclick = () => createThread(c);
    $('#goChat').onclick = () => openChat(c);
    // Albümden profil fotoğrafı seç
    $('#ptab').addEventListener('click', e => {
      const b = e.target.closest('[data-pp]');
      if (!b) return;
      c.photo = c.album[+b.dataset.pp];
      save();
      notify('Profil fotoğrafı değişti', '👤');
      ui.profileTab = 'album';
      refresh();
    });

    // 🏷️ Etiketler: "+ etiket" yazarak ekler, etikete dokununca kaldırır
    function refresh() { const y = window.scrollY; renderProfile(c); window.scrollTo(0, y); }
    $('#tagAdd').onclick = () => {
      const btn = $('#tagAdd');
      const inp = document.createElement('input');
      inp.className = 'tag-in';
      inp.maxLength = 24;
      inp.placeholder = 'etiket yaz, Enter';
      btn.replaceWith(inp);
      inp.focus();
      const add = () => {
        const v = inp.value.trim().replace(/^#/, '');
        c.tags = c.tags || [];
        if (v && !c.tags.some(t => lower(t) === lower(v))) { c.tags.push(v); save(); }
        refresh();
      };
      inp.onkeydown = e => {
        if (e.key === 'Enter') { e.preventDefault(); add(); }
        if (e.key === 'Escape') refresh();
      };
      inp.onblur = () => { if (inp.value.trim()) add(); else refresh(); };
    };
    view.querySelectorAll('[data-tag]').forEach(b => b.onclick = () => {
      if (!confirm(`“${b.dataset.tag}” etiketi kaldırılsın mı?`)) return;
      c.tags = (c.tags || []).filter(t => t !== b.dataset.tag);
      save();
      refresh();
    });
    $('.profile', view).addEventListener('click', e => {
      const z = e.target.closest('[data-zoom]');
      if (z) lightbox(c.album.length ? c.album : [c.photo], +z.dataset.zoom);
      if (e.target.closest('#delChar')) removeChar(c);
      const tg = e.target.closest('[data-sttog]');
      if (tg) {
        c.fields = c.fields || {};
        const on = c.fields[tg.dataset.sttog] = !c.fields[tg.dataset.sttog];
        save();
        tg.classList.toggle('on', on);
        tg.querySelector('em').textContent = on ? 'Evet' : 'Hayır';
      }
    });
  }

  function profileTab(c) {
    if (ui.profileTab === 'album') {
      if (!c.album.length) return `<div class="empty">Albüm boş<br><a href="#/create/${c.id}" style="color:var(--pink)">Fotoğraf ekle</a></div>`;
      return `<div class="album">${c.album.map((src, i) => `<div class="al-item" style="background:${grad(c)}"><img src="${esc(src)}" alt="" loading="lazy" data-zoom="${i}">
          ${src === c.photo ? '<span class="al-pp on">👤 Profil</span>' : `<button type="button" class="al-pp" data-pp="${i}">👤 Profil yap</button>`}</div>`).join('')}</div>
        <small class="mc-hint">Bir fotoğrafı profil fotoğrafı yapmak için altındaki “Profil yap”a dokun. Avatar ortadan kırpılarak gösterilir.</small>`;
    }
    if (ui.profileTab === 'keys') {
      const ks = keywords().filter(k => k.charId === c.id);
      return `
        <p class="kw-help" style="margin-top:4px">${esc(c.name)} bu kelimeleri tüm sohbetlerinde (gruplar dahil) kaç kez söyledi?</p>
        ${ks.length ? ks.map(k => {
          const st = kwStats(k), f = fxById(k.effect);
          return `<div class="kw-row"><div class="info"><b>${esc(k.word)}</b><small>Sohbetlerinde toplam ${st.inChats} kez geçti${f ? ` · ${f.icon} ${esc(f.label)}` : ''}</small></div><span class="kw-count">${st.said}</span></div>`;
        }).join('') : '<div class="empty" style="padding:20px 10px">Henüz anahtar kelime yok</div>'}
        <button class="btn ghost block" id="kwEdit" style="margin-top:12px">🔑 Kelime ekle / düzenle</button>`;
    }
    if (ui.profileTab === 'chats') {
      const list = threadsOf(c);
      return `
        ${list.map((t, i) => {
          const last = lastOf(t);
          return `<div class="thread-row">
            <button class="th-open" data-thread="${t.id}">
              <span class="th-ico">${i === 0 ? '💬' : '🗂️'}</span>
              <div class="info"><b>${esc(t.title)}${i === 0 ? ' <em class="th-cur">son kaldığın</em>' : ''}</b>
                <small>${last ? esc((last.from === 'me' ? 'Sen: ' : '') + preview(last)) : 'Henüz mesaj yok'}</small>
                <small class="th-meta">${fmtTime(activity(t))} · ${msgsOf(t).length} mesaj</small></div>
            </button>
            <div class="th-tools">
              <button data-tact="rename" data-tid="${t.id}" aria-label="Adını değiştir" title="Adını değiştir">✏️</button>
              <button data-tact="copy" data-tid="${t.id}" aria-label="Kopyasını oluştur" title="Kopyasını oluştur">📄</button>
              <button data-tact="delete" data-tid="${t.id}" aria-label="Sil" title="Sil">🗑️</button>
            </div>
          </div>`;
        }).join('') || '<div class="empty" style="padding:24px 10px">Henüz sohbet yok</div>'}
        <div class="th-hint">✏️ adını değiştir · 📄 kopyasını oluştur (aynı başlangıçtan farklı bir son için) · 🗑️ sil</div>
        ${groupsOf(c).length ? `<div class="sec-title">👥 Gruplar</div>${groupsOf(c).map(t => {
          const last = lastOf(t);
          return `<div class="thread-row"><button class="th-open" data-thread="${t.id}">
            ${groupAvatar(t, 44)}
            <div class="info"><b>${esc(t.title)}</b>
              <small>${esc(membersOf(t).map(m => m.name).join(', '))}</small>
              <small class="th-meta">${fmtTime(activity(t))} · ${msgsOf(t).length} mesaj${last ? ` · ${esc(preview(last))}` : ''}</small></div>
          </button></div>`;
        }).join('')}` : ''}
        <button class="btn ghost block" id="newGroup2" style="margin-top:12px">👥 ${esc(c.name)} ile grup kur</button>
        <button class="btn ghost block" id="newChat2" style="margin-top:12px">➕ Yeni sohbet başlat</button>`;
    }
    const rows = [['🎂 Yaş', c.age], ['🏠 Şehir', c.city], ['💼 Meslek', c.job], ['✦ Burç', c.zodiac],
      ...charFields().filter(f => f.type !== 'toggle').map(f => [`${f.icon || '🧩'} ${f.label}`, cfValue(f, (c.fields || {})[f.id])]),
      ...allParams().filter(p => (c.params || {})[p.id] != null).map(p => [`${p.icon || '📊'} ${p.label}`, `${paramVal(c, p)} / ${p.max === '' || p.max == null ? 100 : p.max}`])].filter(r => r[1]);
    const group = g => g.values.filter(t => c.traits.includes(t)).map(t => g.items[g.values.indexOf(t)]);
    const custom = c.traits.filter(t => !T.all.includes(t));
    const chips = list => `<div class="chips">${list.map(t => `<span class="chip">💜 ${esc(t)}</span>`).join('')}</div>`;
    return `
      ${rows.length ? `<div class="sec-title" style="margin-top:4px">Profil</div>${rows.map(([k, v]) => `<div class="info-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}` : ''}
      ${charFields().some(f => f.type === 'toggle') ? `<div class="sec-title">🔘 Durumlar <small>dokunarak değiştir · olayların sonuçları da değiştirir</small></div>
        <div class="st-togs">${charFields().filter(f => f.type === 'toggle').map(f => { const on = !!(c.fields || {})[f.id]; return `<button type="button" class="st-tog${on ? ' on' : ''}" data-sttog="${esc(f.id)}"><span>${esc(f.icon || '🔘')}</span><b>${esc(f.label)}</b><em>${on ? 'Evet' : 'Hayır'}</em></button>`; }).join('')}</div>` : ''}
      ${T.groups.map(g => group(g).length ? `<div class="sec-title">${esc(g.label)}</div>${chips(group(g))}` : '').join('')}
      ${custom.length ? `<div class="sec-title">Diğer özellikler</div>${chips(custom)}` : ''}
      ${FEELS.map(f => feelEvents(c[f.key]).length ? `<div class="sec-title">${f.icon} ${f.label}</div><div class="chips">${feelEvents(c[f.key]).map(e => `<span class="chip">${evEmo(e)}${esc(e.title)}</span>`).join('')}</div>` : '').join('')}
      ${c.about ? `<div class="sec-title">Hakkında</div><div class="about" style="white-space:pre-wrap">${esc(c.about)}</div>` : ''}
      <button class="btn ghost block" id="delChar" style="margin-top:22px;color:#ff2d55">Karakteri sil</button>`;
  }

  function removeChar(c) {
    if (!confirm(`${c.name} silinsin mi? Bütün sohbetleri de silinir.`)) return;
    threadsOf(c).forEach(t => { delete S().chats[t.id]; delete S().side[t.id]; delete S().turns[t.id]; });
    S().threads = threads().filter(t => t.charId !== c.id);
    // Gruplardan çıkar; üyesi kalmayan grup silinir (mesajlarında "Silinmiş karakter" görünür)
    groups().forEach(t => {
      t.members = t.members.filter(id => id !== c.id);
      if (!t.members.length) { S().threads = threads().filter(x => x !== t); delete S().chats[t.id]; }
    });
    S().characters = chars().filter(x => x.id !== c.id);
    S().keywords = keywords().filter(k => k.charId !== c.id);
    save();
    ui.create = null;
    location.hash = '#/home';
  }

  /* ---------- Fotoğraf görüntüleyici ---------- */
  function lightbox(list, start = 0) {
    list = list.filter(Boolean);
    if (!list.length) return;
    let i = Math.min(start, list.length - 1);
    const el = document.createElement('div');
    el.className = 'lightbox';
    const draw = () => {
      el.innerHTML = `
        <img src="${esc(list[i])}" alt="">
        ${list.length > 1 ? `<button class="lb-nav prev" aria-label="Önceki">‹</button><button class="lb-nav next" aria-label="Sonraki">›</button>
        <div class="lb-count">${i + 1} / ${list.length}</div>` : ''}
        <button class="lb-close" aria-label="Kapat">✕</button>`;
    };
    el.onclick = e => {
      if (e.target.closest('.prev')) { i = (i - 1 + list.length) % list.length; draw(); return; }
      if (e.target.closest('.next')) { i = (i + 1) % list.length; draw(); return; }
      el.remove();
    };
    let x0 = null;
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 === null || list.length < 2) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { i = (i + (dx < 0 ? 1 : -1) + list.length) % list.length; draw(); }
      x0 = null;
    });
    draw();
    document.body.appendChild(el);
  }

  /* ---------- Sohbet ----------
   * Alttaki avatara (ya da 🔁 Taraf) dokunarak kimin yazdığını seçersin: sen (sağda, pembe) ya da karakter (solda).
   * "Sırayla" açıksa her mesajdan sonra taraf kendiliğinden değişir. 📝 Not: ortada görünen anlatım satırı.
   * Mesaja dokununca: tepki, cevap ver, düzenle, taraf değiştir, araya ekle, taşı, sil. 📷: fotoğraf mesajı. */
  const REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

  /* ---------- 😊 Emoji kısayolları ve emoji efektleri (js/data/emojis.js) ----------
   * Panel listesi S().emojiBar (yoksa varsayılan), emoji → efekt değişiklikleri S().emojiFx ('' = efektsiz) */
  const EM = Stories.Emojis;
  const noVs = s => String(s || '').replace(/️/g, ''); // ❤ ile ❤️ aynı sayılsın
  const emojiBar = () => (S().emojiBar = S().emojiBar || EM.bar.slice());
  const emojiFxMap = () => Object.assign({}, EM.effects, S().emojiFx || {});
  const emojiFxLabel = id => (EM.list.find(x => x.id === id) || {}).label || '';

  // Mesajda geçen ilk efektli emojinin efekti
  function emojiFxOf(text) {
    const t = noVs(text);
    let best = null, at = Infinity;
    Object.entries(emojiFxMap()).forEach(([e, fx]) => {
      if (!fx) return;
      const i = t.indexOf(noVs(e));
      if (i !== -1 && i < at) { at = i; best = fx; }
    });
    return best;
  }
  // Emoji efektinin giriş animasyonunu baştan oynat
  function playEmojiFx(el) {
    if (!el || !el.classList.contains('efx')) return;
    el.classList.remove('eplay');
    void el.offsetWidth;
    el.classList.add('eplay');
  }

  /* ---------- Efektler ve anahtar kelimeler (js/data/effects.js) ---------- */
  const FX = Stories.Effects;
  const fxById = id => FX.bubble.concat(FX.screen).find(f => f.id === id);
  const isScreenFx = id => FX.screen.some(f => f.id === id);
  const keywords = () => (S().keywords = S().keywords || []);
  const lower = s => (s || '').toLocaleLowerCase('tr');

  // Kelimenin metinde kaç kez geçtiği (büyük/küçük harf ve ekler fark etmez: "kahve" → "Kahveyi" de sayılır)
  function countIn(text, word) {
    const t = lower(text), w = lower(word);
    if (!w) return 0;
    let n = 0, i = 0;
    while ((i = t.indexOf(w, i)) !== -1) { n++; i += w.length; }
    return n;
  }

  // Mesajı yazanın kimliği: 'me', karakter id'si ya da null (not)
  const speakerIdOf = (t, m) => m.from === 'me' ? 'me' : m.from === 'her' ? (t.group ? m.who : t.charId) : null;

  // Mesajın efekti: kendisine seçilen > anahtar kelimeden gelen; 'none' = efektsiz.
  // Karaktere özel kelime sadece o karakterin mesajlarına, genel (charId yok) kelime herkese uygulanır.
  function effectOf(m, sid) {
    if (m.from === 'sys' || m.effect === 'none') return null;
    if (m.effect) return fxById(m.effect) ? m.effect : null;
    const k = keywords().find(x => x.effect && (!x.charId || x.charId === sid) && countIn(m.text, x.word));
    return k ? k.effect : null;
  }

  // Sayaç: karakterin kelimeyi kaç kez söylediği ve onunla olan sohbetlerde toplam kaç kez geçtiği
  function kwStats(k) {
    let said = 0, inChats = 0;
    threads().forEach(t => {
      if (k.charId && !(t.group ? t.members.includes(k.charId) : t.charId === k.charId)) return;
      msgsOf(t).forEach(m => {
        const n = countIn(m.text, k.word);
        if (!n) return;
        inChats += n;
        if (k.charId && speakerIdOf(t, m) === k.charId) said += n;
      });
    });
    return { said, inChats };
  }

  function burst(emojis, count = 22) {
    const layer = document.createElement('div');
    layer.className = 'burst';
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.textContent = emojis[i % emojis.length];
      s.style.left = Math.random() * 100 + '%';
      s.style.animationDelay = Math.random() * 0.8 + 's';
      s.style.fontSize = 18 + Math.random() * 24 + 'px';
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 3000);
  }

  // Efekti oynat: ekran efekti emoji yağdırır, baloncuk efekti animasyonu baştan başlatır
  function playFx(el, id) {
    if (!id) return;
    if (isScreenFx(id)) { burst(fxById(id).emojis); return; }
    if (!el) return;
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
  }

  // Efekt seçici. opts: { title, auto: "Otomatik (anahtar kelime)" seçeneği gösterilsin mi }
  function fxSheet(cur, opts, cb) {
    const item = f => `<button type="button" data-fx="${f.id}" class="${cur === f.id ? 'on' : ''}"><span>${f.icon}</span>${esc(f.label)}</button>`;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>✨ ${esc(opts.title)}</h3>
      <div class="sec-title" style="margin-top:0">Baloncuk efektleri</div>
      <div class="fx-grid">${FX.bubble.map(item).join('')}</div>
      <div class="sec-title">Ekran efektleri</div>
      <div class="fx-grid">${FX.screen.map(item).join('')}</div>
      <div class="fx-grid" style="margin-top:12px">
        ${opts.auto ? `<button type="button" data-fx="auto" class="${!cur ? 'on' : ''}"><span>🔑</span>Otomatik</button>` : ''}
        <button type="button" data-fx="none" class="${cur === 'none' || (!opts.auto && !cur) ? 'on' : ''}"><span>🚫</span>Efekt yok</button>
      </div>
      ${opts.auto ? '<small class="mc-hint">Otomatik: mesajda efekt bağlı bir anahtar kelime geçiyorsa onun efekti kullanılır.</small>' : ''}`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-fx]');
      if (!b) return;
      sh.close();
      cb(b.dataset.fx);
    };
  }

  // 🔑 Anahtar kelimeler (karaktere özel): ekle/sil, karakterin kaç kez söylediğini say, efekt bağla.
  // opts: { chars: [karakter id] (verilmezse hepsi + Genel), list, speakerId(m), onChange }
  //   list verilirse o sohbetteki sayı da görünür
  function keywordSheet(opts = {}) {
    const ids = (opts.chars || chars().map(c => c.id)).filter(byId);
    const showGeneral = !opts.chars;
    if (!ids.length) { notify('Önce bir karakter oluştur', '🔑'); return; }
    let target = ids[0];
    const single = ids.length === 1 && !showGeneral;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>🔑 ${single ? `${esc(byId(ids[0]).name)} · ` : ''}Anahtar kelimeler</h3>
      <p class="kw-help">Her karakterin kendi kelimeleri var. Uygulama karakterin bu kelimeleri kaç kez söylediğini sayar; efekt bağlarsan o karakterin kelimeyi geçirdiği mesajlar efektli görünür.</p>
      ${single ? '' : '<div class="kw-target" id="kwTarget"></div>'}
      <form id="kwForm" class="kw-add" autocomplete="off">
        <input id="kwIn" maxlength="30">
        <button class="btn primary sm" type="submit">Ekle</button>
      </form>
      <div id="kwList"></div>`, 'light');
    const listEl = sh.el.querySelector('#kwList');
    const inp = sh.el.querySelector('#kwIn');

    const row = k => {
      const st = kwStats(k);
      const ch = k.charId && byId(k.charId);
      let here = '';
      if (opts.list) {
        const n = opts.list.reduce((x, m) => x + (!k.charId || opts.speakerId(m) === k.charId ? countIn(m.text, k.word) : 0), 0);
        here = `<small>Bu sohbette <b>${n}</b></small>`;
      }
      const f = fxById(k.effect);
      return `<div class="kw-row">
        <div class="info"><b>${esc(k.word)}</b>
          ${ch ? `<small>${esc(ch.name)} <b>${st.said}</b> kez söyledi · sohbetlerinde toplam ${st.inChats}</small>` : `<small>Tüm sohbetlerde <b>${st.inChats}</b> kez</small>`}${here}</div>
        <button type="button" class="kw-fx ${f ? 'on' : ''}" data-kfx="${k.id}">${f ? `${f.icon} ${esc(f.label)}` : '✨ Efekt ekle'}</button>
        <button type="button" class="kw-del" data-kdel="${k.id}" aria-label="Sil">✕</button>
      </div>`;
    };

    const draw = () => {
      const tg = sh.el.querySelector('#kwTarget');
      if (tg) tg.innerHTML = `<small>Kimin kelimesi?</small><div class="kw-chars">${ids.map(id => `<button type="button" data-kt="${id}" class="${id === target ? 'on' : ''}">${avatar(byId(id), 26)}<span>${esc(byId(id).name)}</span></button>`).join('')}</div>`;
      inp.placeholder = `${byId(target).name} için kelime ekle (ör. kahve)`;
      const groups = ids.map(id => [byId(id), keywords().filter(k => k.charId === id)]).filter(([, ks]) => ks.length);
      const general = showGeneral ? keywords().filter(k => !k.charId) : [];
      listEl.innerHTML = groups.map(([c, ks]) => `${single ? '' : `<div class="kw-sec">${avatar(c, 24)}<b>${esc(c.name)}</b></div>`}${ks.map(row).join('')}`).join('') +
        (general.length ? `<div class="kw-sec">🌐 <b>Genel</b> <small>(tüm karakterler)</small></div>${general.map(row).join('')}` : '') ||
        '<div class="empty" style="padding:18px">Henüz anahtar kelime yok</div>';
    };
    const changed = () => { save(); draw(); if (opts.onChange) opts.onChange(); };
    draw();
    sh.el.onclick = e => {
      const b = e.target.closest('[data-kt]');
      if (b) { target = b.dataset.kt; draw(); inp.focus(); }
    };
    sh.el.querySelector('#kwForm').onsubmit = e => {
      e.preventDefault();
      const w = inp.value.trim();
      if (!w) return;
      if (keywords().some(k => k.charId === target && lower(k.word) === lower(w))) { notify('Bu kelime zaten var', '🔑'); return; }
      keywords().push({ id: Store.uid(), charId: target, word: w, effect: '' });
      inp.value = '';
      changed();
    };
    listEl.onclick = e => {
      const d = e.target.closest('[data-kdel]');
      if (d) { S().keywords = keywords().filter(k => k.id !== d.dataset.kdel); changed(); return; }
      const fb = e.target.closest('[data-kfx]');
      if (!fb) return;
      const k = keywords().find(x => x.id === fb.dataset.kfx);
      fxSheet(k.effect || 'none', { title: `“${k.word}” için efekt${k.charId && byId(k.charId) ? ` · ${byId(k.charId).name}` : ''}` }, v => {
        k.effect = v === 'none' ? '' : v;
        changed();
        if (k.effect && isScreenFx(k.effect)) playFx(null, k.effect);
      });
    };
  }

  // Kelime özeti çipleri: "kahve 3 🎉". c verilirse sadece o karakterinkiler, yoksa karaktere göre gruplu
  function kwSummary(c) {
    const chip = k => {
      const st = kwStats(k), f = fxById(k.effect);
      return `<span class="chip kw-chip">${esc(k.word)} <b>${k.charId ? st.said : st.inChats}</b>${f ? ` ${f.icon}` : ''}</span>`;
    };
    if (c) return `<div class="chips">${keywords().filter(k => k.charId === c.id).map(chip).join('')}</div>`;
    const rows = chars().map(ch => [ch, keywords().filter(k => k.charId === ch.id)]).filter(([, ks]) => ks.length);
    const general = keywords().filter(k => !k.charId);
    return rows.map(([ch, ks]) => `<div class="kw-sum">${avatar(ch, 28)}<div class="chips">${ks.map(chip).join('')}</div></div>`).join('') +
      (general.length ? `<div class="kw-sum"><span class="kw-globe">🌐</span><div class="chips">${general.map(chip).join('')}</div></div>` : '');
  }

  /* Sohbet teması (js/data/themes.js): sohbetin kendi teması > karakterin varsayılanı > Amor */
  const TH = Stories.Themes;
  // Mekanlar: js/data/places.js + Monia'da eklediklerin (S().monia.places, etiketleri tags), etiketler: gruplar + S().monia.groups
  const BASE_PLACES = Stories.PLACES || [], BASE_GROUPS = Stories.PLACE_GROUPS || [];
  const allPlaces = () => [...BASE_PLACES, ...((S().monia || {}).places || [])];
  const allGroups = () => [...BASE_GROUPS, ...((S().monia || {}).groups || [])];
  const inGroup = (p, g) => p.group === g.id || (p.tags || []).includes(g.id);
  const groupOf = p => p.group || (p.tags || []).find(t => BASE_GROUPS.some(g => g.id === t)) || 'yol';
  // varsayılan: Lila pastel arka plan + Gül kurusu baloncuk
  const themeOf = (th, c) => Object.assign({ bg: 'pastel-lila', bubble: 'pastel-gul' }, c.theme || {}, th.theme || {});
  const DARK_BG = () => (TH.backgrounds.find(b => b.id === 'amor') || {}).css || '#160d2c';

  function bubbleVars(b, c) {
    const v = (k, val) => (val ? `--${k}:${val};` : '');
    return v('me-bg', b.me) + v('me-fg', b.meFg) + v('her-bg', b.her === 'char' ? grad(c) : b.her) + v('her-fg', b.herFg) +
      v('me-border', b.meBorder) + v('her-border', b.herBorder) + v('b-radius', b.radius) + v('b-tail', b.tail) +
      v('b-font', b.font) + v('b-shadow', b.shadow);
  }

  function themeCss(t, c) {
    const def = TH.backgrounds.find(b => b.id === t.bg) || TH.backgrounds[0];
    const bg = t.bg === 'img' && t.img
      // en altta Amor degradesi: şeffaf (PNG) fotoğrafların arkası boş kalmasın
      ? `linear-gradient(rgba(14, 8, 30, .45), rgba(14, 8, 30, .8)), url("${t.img}") center / cover no-repeat, ${DARK_BG()}`
      : def.css;
    // Sınıfla tanımlı arka planlar (Amor'un .bg-ucan-kalpler gibi) için satır içi arka plan yazılmaz
    return (bg ? `background:${bg};` : '') + bubbleVars(TH.bubbles.find(b => b.id === t.bubble) || TH.bubbles[0], c);
  }
  // .chat üzerindeki tema sınıfları (arka plan .bg-*, baloncuk süsü .sbub-*)
  function themeClasses(el, t) {
    TH.backgrounds.forEach(b => { if (b.cls) el.classList.toggle(b.cls, t.bg === b.id); });
    TH.bubbles.forEach(b => { if (b.cls) el.classList.toggle(b.cls, t.bubble === b.id); });
  }

  function renderChat(c, th) {
    th.opened = Date.now();
    save();
    const group = !!th.group;
    const list = msgsOf(th);
    const members = () => membersOf(th);
    const look = group ? { theme: null, colors: (members()[0] || {}).colors, name: th.title } : c; // tema için
    const speaker = m => (m.from !== 'her' ? null : group ? byId(m.who) : c) || GHOST;
    const nameOf = m => m.from === 'me' ? userName() : m.from === 'her' ? speaker(m).name : 'Not';
    // Grupta üyeye özel baloncuk rengi (th.memberColors[karakter id] = TH.memberColors sırası)
    const memberColor = ch => { const i = (th.memberColors || {})[ch.id]; return i == null ? null : TH.memberColors[i]; };
    const sidOf = m => speakerIdOf(th, m);
    const fxOf = m => effectOf(m, sidOf(m));
    const ctx = { list, group, speaker, memberColor, sid: sidOf, query: '' };

    // Kim yazıyor: 'me' ya da karakter id'si (grupta üyelerden biri). 'sys' = not.
    const order = () => ['me', ...(group ? th.members.filter(byId) : [c.id])];
    const saved = S().side[th.id];
    const cs = { side: 'me', who: null, before: null, mode: null, reply: null, playing: false, nextFx: null };
    const setKey = k => { if (k === 'me' || k === 'sys') { cs.side = k; } else { cs.side = 'her'; cs.who = k; } };
    if (group) setKey(order().includes(saved) ? saved : 'me');
    else setKey(saved === 'her' ? c.id : 'me');
    const keyOf = () => cs.side === 'her' ? cs.who : cs.side;
    const curChar = () => cs.side === 'her' ? (byId(cs.who) || GHOST) : null;
    const turns = () => S().turns[th.id] !== false;

    ui.undo = ui.undo || {};
    const stack = ui.undo[th.id] = ui.undo[th.id] || [];

    const head = group
      ? `<button class="who" type="button" id="groupHead">${groupAvatar(th, 40)}
          <div><b>${esc(th.title)}</b><small id="chatStatus"></small></div></button>`
      : `<a class="who" href="#/p/${c.id}">${avatar(c, 40)}
          <div><b>${esc(c.name)}</b><small id="chatStatus"></small></div></a>`;
    const meta = c ? [c.age, c.city, c.job, c.zodiac].filter(Boolean).map(esc).join(' | ') : '';
    const hcard = group
      ? `<div class="hcard group">
          <div class="g-members">${members().map(m => `<a class="gm" href="#/p/${m.id}">${avatar(m, 44)}<small>${esc(m.name)}</small></a>`).join('')}</div>
          <button class="mood-btn" id="groupBtn" type="button">👥<small>Düzenle</small></button>
        </div>`
      : `<div class="hcard">
          ${avatar(c, 58)}
          <div class="info">
            <div class="nm">${esc(c.name.toLocaleUpperCase('tr').split('').join(' '))}</div>
            <div class="meta">${meta || esc(c.bio || '')}</div>
            ${c.traits.length ? `<div class="meta traits">${esc(c.traits.slice(0, 4).join(' · '))}</div>` : ''}
            ${c.album.length ? `<div class="thumbs">${c.album.slice(0, 4).map((s, i) => `<img src="${esc(s)}" alt="" data-zoom="${i}">`).join('')}</div>` : ''}
          </div>
          <button class="mood-btn" id="threadBtn" type="button">🗂️<small>${esc(th.title)}</small></button>
        </div>`;

    const chatHtml = `
      <div class="chat">
        <div class="chat-head">
          <a class="icon-btn" href="#/messages" aria-label="Geri">${ICON.arrowLeft}</a>
          ${head}
          <button class="icon-btn st-btn${statsOn() ? ' on' : ''}" id="statBtn" aria-label="Durumlar ve parametreler" title="📊 Durumlar ve parametreler">📊</button>
          <button class="icon-btn" id="heroBtn" aria-label="Büyük fotoğraf">${ICON.photo}</button>
          <button class="icon-btn" id="searchBtn" aria-label="Sohbette ara">${ICON.search}</button>
          <button class="icon-btn" id="moreBtn" aria-label="Menü">${ICON.more}</button>
        </div>
        <div class="hero" id="hero" hidden></div>
        <div class="search-bar" id="searchBar" hidden>
          <input id="sq" type="search" placeholder="Sohbette ara…" autocomplete="off">
          <span id="sCount"></span>
          <button type="button" id="sPrev" aria-label="Önceki">↑</button>
          <button type="button" id="sNext" aria-label="Sonraki">↓</button>
          <button type="button" id="sClose" aria-label="Aramayı kapat">✕</button>
        </div>

        ${hcard}
        <div class="st-card" id="stCard" hidden></div>

        <div class="msgs-wrap">
          <div class="msgs" id="msgs"></div>
          <div class="me-hud" id="meHud" hidden></div>
          <button type="button" class="undo-pill" id="undoBtn" hidden></button>
        </div>

        <div class="mode-bar" id="modeBar" hidden></div>
        <div class="reply-bar" id="replyBar" hidden></div>
        ${group ? '<div class="spk-row" id="spkRow"></div>' : ''}
        <div class="side-hint" id="sideHint"></div>
        <form class="composer" id="composer" autocomplete="off">
          <button type="button" class="side-btn" id="sideBtn" aria-label="Kimin yazdığını değiştir"></button>
          <input id="msgInput" type="text" enterkeyhint="send" maxlength="1000">
          <button class="send-btn" type="submit" aria-label="Gönder">${ICON.send}</button>
        </form>
        <div class="emoji-panel" id="emojiPanel" hidden></div>
        <div class="chat-tools" id="chatTools">
          <div class="ct-more" id="ctMore" hidden>
            <button type="button" data-tool="theme"><span>🎨</span>Tema</button>
            <button type="button" data-tool="turns"><span>⇄</span>Sırayla</button>
            <button type="button" data-tool="place"${placesOn() ? '' : ' hidden'}><span>📍</span>Mekan</button>
            <button type="button" data-tool="places" class="${placesOn() ? 'on' : ''}"><span>🗺️</span>Mekan kartları</button>
            ${MU ? `<button type="button" data-tool="music" class="${th.music ? 'on' : ''}"><span>🎵</span>Müzik</button>` : ''}
            <button type="button" data-tool="help"><span>💁‍♀️</span>Yardım</button>
          </div>
          <div class="ct-main">
            <button type="button" data-tool="photo"><span>📷</span>Fotoğraf</button>
            <button type="button" data-tool="note"><span>📝</span>Not</button>
            <button type="button" data-tool="event"><span>📜</span>Olay</button>
            <button type="button" data-tool="fx"><span>✨</span>Efekt</button>
            <button type="button" data-tool="emoji"><span>😊</span>Emoji</button>
            <button type="button" data-tool="more" aria-label="Diğer araçlar"><span>⋯</span>Diğer</button>
          </div>
        </div>
        <div class="play-bar" id="playBar" hidden>
          <button class="btn ghost sm" id="playSpeed">1x</button>
          <button class="btn pink sm" id="playStop">■ Durdur</button>
        </div>
      </div>`;

    if (wide()) {
      view.innerHTML = `<div class="split"><aside class="split-list">${messagesPanel(group ? th.id : c.id)}</aside>${chatHtml}</div>`;
      bindRows($('.split-list'));
    } else {
      view.innerHTML = chatHtml;
    }

    const input = $('#msgInput');
    const box = $('#msgs');
    const draw = target => { drawMessages(ctx, cs, target); markHits(); drawStats(); };

    /* 📊 Üstteki durum kartı: karakterlerin 🔘 durumları (dokununca değişir), 📊 parametreleri ve 🙋 senin parametrelerin */
    // önceki değerler: değişince efekt oynar (ilk çizimde oynamaz)
    const fxPrev = { bools: null, hud: null };
    function drawStats() {
      const el = $('#stCard');
      if (!el) return;
      const bools = charFields().filter(f => f.type === 'toggle'), mine = paramsOf('me'), single = T.groups.filter(g => g.single);
      // 🤰 Hamile "Evet" olunca: emoji yağmuru + kartta parlayan çip
      const nowB = {}, popped = new Set();
      members().filter(ch => ch && ch !== GHOST).forEach(ch => bools.forEach(f => { nowB[ch.id + '|' + f.id] = !!(ch.fields || {})[f.id]; }));
      if (fxPrev.bools) Object.keys(nowB).forEach(k => {
        if (!nowB[k] || fxPrev.bools[k] !== false) return;
        const [cid, fid] = k.split('|'), fx = BOOL_FX[fid];
        if (!fx) return;
        popped.add(k);
        burst(fx.emojis, 34);
        notify(fx.text.replace('{o}', (byId(cid) || GHOST).name.split(' ')[0]), fx.emojis[0]);
      });
      fxPrev.bools = nowB;
      const rows = members().filter(ch => ch && ch !== GHOST).map(ch => {
        const tr = single.map(g => ch.traits.find(t => g.values.includes(t))).filter(Boolean);
        return `<div class="st-row">${avatar(ch, 28)}<div class="st-body"><b>${esc(ch.name.split(' ')[0])}</b>
          <div class="st-vals">${bools.map(f => { const on = !!(ch.fields || {})[f.id], k = ch.id + '|' + f.id; return `<button type="button" class="st-bool f-${esc(f.id)}${on ? ' on' : ''}${popped.has(k) ? ' pop' : ''}" data-stb="${esc(k)}" title="Dokun: değiştir">${esc(f.icon || '🔘')} ${esc(f.label)}<i>${on ? 'Evet' : 'Hayır'}</i></button>`; }).join('')}
            ${tr.map(t => `<span class="st-tr">${esc(t)}</span>`).join('')}</div>
          ${paramsOf().length ? `<div class="pv-bars">${pvBars(ch)}</div>` : ''}</div></div>`;
      });
      el.hidden = !statsOn() || !rows.length;
      el.innerHTML = rows.join('');
      // 🙋 senin parametrelerin: sağ üstte oyunlardaki can barı gibi
      const hud = $('#meHud');
      hud.hidden = !mine.length;
      hud.classList.toggle('closed', !hudOn());
      // dikey barlar: aşağıdan yukarı dolar; 🙋 düğmesiyle açılıp kapanır
      // barlar önceki yüksekliğinden yeni değere kayar; artınca "+5" uçar
      const pct = p => { const v = paramVal(S().user, p), lo = +p.min || 0, hi = p.max === '' || p.max == null ? 100 : +p.max; return { v, hi, w: Math.max(0, Math.min(100, Math.round((v - lo) / ((hi - lo) || 1) * 100))) }; };
      const prevH = fxPrev.hud || {}, nowH = {};
      hud.innerHTML = `<button type="button" class="hud-tog" id="hudTog" title="${hudOn() ? 'Barları gizle' : 'Barları göster'}">🙋<small>${hudOn() ? '▾' : '▸'}</small></button>
        <div class="hud-bars">${mine.map(p => {
          const { v, hi, w } = pct(p), was = prevH[p.id], up = was && v > was.v, down = was && v < was.v;
          nowH[p.id] = { v, w };
          return `<div class="hud-bar${w >= 80 ? ' hi' : w <= 20 ? ' lo' : ''}${up ? ' up' : down ? ' down' : ''}" data-hp="${esc(p.id)}" title="${esc(p.label)}: ${v} / ${hi}"><b>${v}</b>
            <div class="hud-track"><i style="height:${was ? was.w : w}%"></i></div><span class="hud-ic">${esc(p.icon || '📊')}</span><small>${esc(p.label)}</small>
            ${up || down ? `<em class="hud-float">${up ? '+' : ''}${v - was.v}</em>` : ''}</div>`;
        }).join('')}</div>`;
      requestAnimationFrame(() => mine.forEach(p => { const i = hud.querySelector(`[data-hp="${CSS.escape(p.id)}"] .hud-track i`); if (i) i.style.height = nowH[p.id].w + '%'; }));
      // 🥴 Zevk: yükseldikçe ekran kenarları pembe parlar, kalp atışı hızlanır; artınca kalpler uçuşur
      const zp = mine.find(p => lower(p.label).startsWith(ZEVK_LABEL)), chat = $('.chat');
      if (chat) {
        const z = zp ? nowH[zp.id].w / 100 : 0;
        chat.style.setProperty('--zv', z.toFixed(2));
        chat.style.setProperty('--zbeat', `${(2.4 - 1.8 * z).toFixed(2)}s`);
        chat.classList.toggle('zevk-on', z > 0);
        chat.classList.toggle('zevk-max', z >= 0.8);
        if (zp && prevH[zp.id] && nowH[zp.id].v > prevH[zp.id].v) burst(z >= 0.8 ? ['💗', '💦', '🔥', '🥵'] : ['💗', '💕', '✨'], Math.round(4 + 22 * z));
      }
      fxPrev.hud = nowH;
      $('#hudTog').onclick = () => { hudOn(!hudOn()); drawStats(); };
    }

    function setStatus(text, cls = '') {
      const el = $('#chatStatus');
      el.textContent = text;
      el.className = cls;
    }

    function drawComposer() {
      const side = cs.side;
      const ch = curChar();
      const who = ch ? ch.name : side === 'me' ? userName() : 'Not';
      $('#composer').className = `composer as-${side}`;
      $('#sideBtn').innerHTML = side === 'sys' ? '<span class="note-ico">📝</span>' : ch ? avatar(ch, 40) : userAvatar(40);
      input.placeholder = side === 'sys' ? 'Anlatım / not yaz…' : `${who} olarak yaz… (# olay)`;
      $('#sideHint').innerHTML = side === 'sys'
        ? '📝 Not yazıyorsun · ortada görünür'
        : `<b class="${side}">${esc(who)}</b> yazıyor${side === 'her' ? ' · solda' : ' · sağda'}${turns() ? ' · ⇄ sırayla' : ''}`;
      if (group) {
        $('#spkRow').innerHTML = order().map(k => {
          const m = k === 'me' ? null : byId(k);
          return `<button type="button" data-spk="${k}" class="${keyOf() === k ? 'on' : ''}">${m ? avatar(m, 26) : userAvatar(26)}<span>${esc(m ? m.name : userName())}</span></button>`;
        }).join('');
      }
      $('[data-tool=turns]').classList.toggle('on', turns());
      $('[data-tool=note]').classList.toggle('on', side === 'sys');
      // ✨ sonraki mesajın efekti
      const nf = fxById(cs.nextFx);
      $('[data-tool=fx]').classList.toggle('on', !!nf);
      $('#composer .send-btn').classList.toggle('fx-armed', !!nf);
      if (nf) $('#sideHint').innerHTML += ` · <span class="fx-next">${nf.icon} ${esc(nf.label)} ile gidecek <button type="button" id="fxClear" aria-label="Efekti kaldır">✕</button></span>`;
      if (th.autoAdd) $('#sideHint').innerHTML += ` · <span class="add-on">🪄 Ekler açık <button type="button" id="addOff" aria-label="Otomatik ekleri kapat">✕</button></span>`;
      const ao = $('#addOff');
      if (ao) ao.onclick = () => { th.autoAdd = false; save(); drawComposer(); };
      if (th.bot) $('#sideHint').innerHTML += ` · <span class="bot-on">🤖 Bot açık <button type="button" id="botOff" aria-label="Bot modunu kapat">✕</button></span>`;
      const bo = $('#botOff');
      if (bo) bo.onclick = () => { th.bot = false; save(); clearTimeout(botTimer); drawComposer(); };
      const fc = $('#fxClear');
      if (fc) fc.onclick = () => { cs.nextFx = null; drawComposer(); };
      const n = list.filter(m => m.from !== 'sys').length;
      setStatus(group ? `${members().map(m => m.name).join(', ')} · ${n} mesaj` : `${th.title} · ${n} mesaj`);
    }

    function setSide(k) {
      setKey(k);
      if (k !== 'sys') { S().side[th.id] = group ? k : (k === 'me' ? 'me' : 'her'); save(); }
      drawComposer();
    }
    // Sıradaki konuşan: sen → karakter (grupta sen → üye 1 → üye 2 → …)
    const nextKey = k => { const o = order(); return o[(o.indexOf(k) + 1) % o.length]; };

    function drawMode() {
      const bar = $('#modeBar');
      if (!cs.mode) { bar.hidden = true; return; }
      const m = list.find(x => x.id === cs.mode.id);
      bar.hidden = false;
      bar.innerHTML = `<span>${cs.mode.type === 'edit' ? (m && m.type === 'photo' ? '✏️ Fotoğraf açıklaması düzenleniyor' : '✏️ Mesaj düzenleniyor') : `➕ “${esc(m ? preview(m) : '')}” mesajının üstüne ekleniyor`}</span><button type="button" id="cancelMode" aria-label="Vazgeç">✕</button>`;
      $('#cancelMode').onclick = cancelMode;
    }

    function drawReply() {
      const bar = $('#replyBar');
      const m = cs.reply && list.find(x => x.id === cs.reply);
      if (!m) { cs.reply = null; bar.hidden = true; return; }
      bar.hidden = false;
      bar.innerHTML = `<div class="rq"><b>↩️ ${esc(nameOf(m))}</b><span>${esc(preview(m))}</span></div><button type="button" id="cancelReply" aria-label="Cevabı iptal et">✕</button>`;
      $('#cancelReply').onclick = () => { cs.reply = null; drawReply(); };
    }

    function cancelMode() {
      if (cs.mode && cs.mode.type === 'edit') input.value = '';
      cs.mode = null;
      drawMode();
      draw();
    }

    /* ---------- Geri alma (↶): her değişiklikten önce mesajların kopyası saklanır ---------- */
    function snap(label) {
      stack.push({ label, msgs: JSON.parse(JSON.stringify(list)) });
      if (stack.length > 40) stack.shift();
      drawUndo();
    }
    function drawUndo() {
      const b = $('#undoBtn');
      if (!b) return;
      const last = stack[stack.length - 1];
      b.hidden = !last || cs.playing;
      if (last) b.innerHTML = `↶ Geri al <small>· ${esc(last.label)}</small>`;
    }
    function undo() {
      const s = stack.pop();
      if (!s) { notify('Geri alınacak bir şey yok', '↶'); return; }
      list.splice(0, list.length, ...s.msgs);
      cs.mode = null;
      cs.reply = null;
      input.value = '';
      save();
      drawMode(); drawReply(); drawComposer(); draw(); drawUndo(); refreshList();
      notify(`Geri alındı: ${s.label}`, '↶');
    }

    function setWho(m) {
      if (cs.side === 'her' && group) m.who = cs.who; else delete m.who;
    }

    // Yeni mesaj ekler ya da düzenlenen mesajı günceller. extra: fotoğraf için { type, src }
    function send(text, extra) {
      const editing = cs.mode && cs.mode.type === 'edit';
      let newId = null;
      snap(editing ? 'Mesaj düzenlendi' : extra ? 'Fotoğraf gönderildi' : cs.side === 'sys' ? 'Not eklendi' : 'Mesaj gönderildi');
      let target = null;
      if (editing) {
        const m = list.find(x => x.id === cs.mode.id);
        if (m) {
          m.text = text;
          if (!(m.type === 'photo' && cs.side === 'sys')) { m.from = cs.side; setWho(m); }
          target = m.id;
        }
        cs.mode = null;
      } else {
        const m = Object.assign({ id: Store.uid(), from: cs.side, text, ts: Date.now() }, extra || {});
        setWho(m);
        if (cs.nextFx && cs.side !== 'sys') { m.effect = cs.nextFx; cs.nextFx = null; }
        newId = m.id;
        if (cs.reply) m.reply = cs.reply;
        cs.reply = null;
        if (cs.mode) {
          // Üstüne ekleme modu açık kalır; art arda eklenenler sırayla hedefin üstüne dizilir
          const i = list.findIndex(x => x.id === cs.mode.id);
          if (i >= 0) m.ts = list[i].ts;
          list.splice(i < 0 ? list.length : i, 0, m);
          target = m.id;
        } else list.push(m);
        applyAddons(m);
      }
      save();
      // 🤖 Bot modu: kullanıcının (sona eklenen) mesajına karakter kurallardan cevap verir; taraf "Sen"de kalır
      const botTurn = th.bot && cs.side === 'me' && newId && !target;
      if (cs.side === 'sys') setSide(cs.before || 'me');
      else if (turns() && !editing && !botTurn) setSide(nextKey(keyOf()));
      else drawComposer();
      drawMode();
      drawReply();
      draw(target);
      refreshList();
      if (group) drawHero();
      if (newId) {
        const m = list.find(x => x.id === newId), el = box.querySelector(`[data-id="${newId}"]`);
        playFx(el, m && fxOf(m));
        playEmojiFx(el);
      }
      if (botTurn) botReply(list.find(x => x.id === newId));
      else if (newId && !target) autoScene();
    }

    /* ---------- 🪄 Otomatik ekler: karakterin mesajında kelime/fiil geçerse sonuna ek ya da ayrı mesaj ----------
     * Bot modundan bağımsız; sohbet ⋮ menüsünden açılır (th.autoAdd). Tanımlar: js/data/bot-rules.js → addons */
    function applyAddons(m) {
      if (!th.autoAdd || m.from !== 'her' || m.type) return;
      const ch = byId(group ? m.who : c.id);
      if (!ch) return;
      const res = Stories.Bot.addons(Stories.BOT_RULES || {}, m.text, ch);
      const vars = { sen: userName(), ben: ch.name.split(' ')[0] };
      const roll = a => a && Math.random() * 100 < (a.chance == null ? 100 : +a.chance);
      const text = a => (roll(a) ? Stories.Bot.addText(a, vars).trim() : '');
      const pre = text(res.prepend), post = text(res.append);
      if (pre && !m.text.trim().startsWith(pre)) m.text = `${pre} ${m.text.trim()}`;
      if (post && !m.text.trim().endsWith(post)) m.text = `${m.text.trim()} ${post}`;
      // Ayrı mesajlar: önce (bu mesajın üstüne) ve sonra (altına)
      const extra = (t, after) => {
        if (!t) return;
        const x = { id: Store.uid(), from: 'her', text: t, ts: after ? m.ts + 1 : m.ts };
        if (group) x.who = m.who;
        list.splice(list.indexOf(m) + (after ? 1 : 0), 0, x);
      };
      extra(text(res.before), false);
      extra(text(res.message), true);
    }

    /* ---------- 🤖 Bot modu (kurallar: js/data/bot-rules.js, motor: js/bot.js) ---------- */
    const BOT = Stories.Bot;
    function botReply(userMsg) {
      clearTimeout(botTimer);
      const old = $('#botTyping');
      if (old) old.remove();
      const rules = Stories.BOT_RULES || { rules: [] };
      // Grupta kuralı en iyi eşleşen üye cevap verir (eşitlikte rastgele)
      const cands = (group ? members() : [c]).map(ch => ({ ch, m: BOT.best(rules, userMsg.text, ch) })).filter(x => x.m);
      if (!cands.length) { notify('🤖 Bu karakter için uygun kural yok (Ben → 💾 Veri → 🤖 Bot editörü)', '🤖'); return; }
      const topScore = Math.max(...cands.map(x => x.m.score + (x.m.fallback ? 0 : 1000)));
      const win = cands.filter(x => x.m.score + (x.m.fallback ? 0 : 1000) === topScore);
      const { ch, m } = win[Math.floor(Math.random() * win.length)];
      const parts = BOT.reply(m.rule, { sen: userName(), ben: ch.name.split(' ')[0] });
      const step = i => {
        if (i >= parts.length) { botOutcome(ch, m.rule); drawComposer(); autoScene(); return; }
        box.insertAdjacentHTML('beforeend', `<div class="msg her" id="botTyping">${avatar(ch, 36)}<div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div></div>`);
        box.scrollTop = box.scrollHeight;
        setStatus(group ? `${ch.name} yazıyor…` : 'yazıyor…', 'typing');
        botTimer = setTimeout(() => {
          const t = $('#botTyping');
          if (t) t.remove();
          if (i === 0) snap('Bot cevabı');
          const msg = { id: Store.uid(), from: 'her', text: parts[i], ts: Math.max(Date.now(), (list[list.length - 1] || {}).ts + 1 || 0) };
          if (group) msg.who = ch.id;
          list.push(msg);
          applyAddons(msg);
          save();
          draw();
          refreshList();
          if (group) drawHero(ch.id);
          playFx(box.querySelector(`[data-id="${msg.id}"]`), fxOf(msg));
          botTimer = setTimeout(() => step(i + 1), 350);
        }, Math.min(2600, 700 + parts[i].length * 35));
      };
      botTimer = setTimeout(() => step(0), 500);
    }

    // 🎲 bot kuralının sonucu (Monia → Sebep-sonuç → 🤖): karakterden sonuç mesajı; ↪ sonraki olay ve ⚡ eşik olayları ardından gelir
    function botOutcome(ch, rule) {
      const outs = botOutsOf(rule.id);
      if (!outs.length) return;
      const ids = [ch.id], sc = { chars: ids };
      const res = resolveOutcome(outs.map(x => ({ ...x, text: x.text ? evText({ text: x.text }, sc, true) : '' })), condCtx(ids));
      if (!res) return;
      const who = group ? { who: ch.id } : {}, ts = Math.max(Date.now(), ((list[list.length - 1] || {}).ts || 0) + 1), title = `🤖 ${rule.name || 'Bot'}`, chain = [];
      if (res.blocked) list.push({ id: Store.uid(), from: 'her', ...who, text: res.blocked.text || '🎲 Sonuç', oc: { pct: res.blocked.pct, blocked: res.blocked.why, ev: title }, ts });
      else {
        const out = res.out, r = applyOutcome(out, ids);
        if (r.text || r.changes.length || r.fired.length || res.fallback) list.push({ id: Store.uid(), from: 'her', ...who, text: r.text || '🎲 Sonuç',
          oc: { pct: out.pct, changes: r.changes, fired: r.fired.map(f => f.text), ev: title, ...(res.fallback ? { fallback: res.fallback } : {}) }, ts });
        const nx = out.next && allEvents().find(x => x.id === out.next);
        if (nx) chain.push(nx);
        r.fired.forEach(f => chain.push(f.ev));
      }
      chain.forEach(x => eventMessages(x, undefined, 1));
      save(); draw(); refreshList();
    }

    /* ---------- 📍 Mekan ve ipuçları (js/data/places.js): başta bir mekan kartı, sonra her HINT_EVERY mesajda bir ipucu ----------
     * Kart bir nottur (from: 'sys') + scene: { place, icon, name, kind: 'hint' = aynı yerde sıradaki an } */
    const HINT_EVERY = 8;
    const herFirst = () => (group ? members()[Math.floor(Math.random() * members().length)] || GHOST : c).name.split(' ')[0];
    const fillHint = s => String(s || '').replace(/\{o\}/g, herFirst());
    const inHours = (hr, h) => !hr || (hr[0] <= hr[1] ? h >= hr[0] && h < hr[1] : h >= hr[0] || h < hr[1]);
    const pickOf = a => a[Math.floor(Math.random() * a.length)];
    function pickPlace(exclude) {
      const h = new Date().getHours();
      let pool = allPlaces().filter(p => inHours(p.hours, h) && p.id !== exclude);
      if (!pool.length) pool = allPlaces();
      const p = pickOf(pool);
      return { place: p.id, icon: p.icon, name: p.name, hint: pickOf(p.hints) };
    }
    // Hikaye ilerler: aynı yerin sıradaki ipucu, bitince birkaç küçük an, sonra başka bir yer
    // sohbetin karakterleri (olaylardaki {ben} ve 📈 parametreler için)
    const chatCharIds = () => (group ? members() : [c]).filter(x => x && x !== GHOST && x.id).map(x => x.id);
    const lastScene = () => { let i = list.length - 1; while (i >= 0 && !list[i].scene) i--; return list[i]; };
    // bu hikayede olmuş olaylar (🔒 şartlar için): th.evDone + eski olay mesajları
    const markDone = (...idsDone) => { th.evDone = [...new Set([...(th.evDone || []), ...idsDone.filter(Boolean)])]; };
    const condCtx = charIds => ({ done: new Set([...(th.evDone || []), ...list.filter(m => m.ev).map(m => m.ev)]), chars: charIds.map(byId).filter(Boolean) });
    const MAX_CHAIN = 3; // ↪ / ⚡ ile art arda tetiklenen olay sınırı (sonsuz döngü olmasın)
    // olay kartı: 🎲 neden → sonuç biri seçilir; 🔒 şartı tutmazsa 🛡️ engellenir; 📈 parametreler uygulanır;
    // "sonraki olay" ve ⚡ eşik olayları next(olay) ile hemen ardından gelir
    function eventScene(e, at, ev, charIds, next) {
      at = at || {};
      const o = { place: e.place || at.place || '', icon: e.icon || at.icon || '🎬', name: e.name || at.name || th.title, hint: e.text, kind: 'hint', ev };
      if (e.color) o.color = e.color;
      if (e.emojis) o.emojis = e.emojis;
      if (e.level) o.level = e.level;
      markDone(e.evId, e.subId);
      const res = resolveOutcome(e.outcomes, condCtx(charIds));
      // ⚡ olunca etkileri sonuç belirlendikten sonra (şartlar eski değere baksın: Condom → Korunma, Creampie onu tüketir)
      const onFx = () => {
        if ((e.onEffects || []).length) {
          const r2 = applyOutcome({ text: '', effects: e.onEffects }, charIds);
          if (r2.changes.length) o.onChanges = r2.changes;
          r2.fired.forEach(f => next(f.ev));
        }
        const vc = virginFx(e.evId, charIds);
        if (vc.length) o.onChanges = [...(o.onChanges || []), ...vc];
        return o;
      };
      if (!res) return onFx();
      if (res.blocked) { o.outcome = { text: res.blocked.text, pct: res.blocked.pct, blocked: res.blocked.why }; return onFx(); }
      const out = res.out, r = applyOutcome(out, charIds);
      // 🎲 sonuç kartın altında ayrı kutuda görünür (⭐ varsayılana düştüyse olmayan sonuç da yazılır)
      if (r.text || r.changes.length || r.fired.length || res.fallback) o.outcome = { text: r.text, pct: out.pct, changes: r.changes, fired: r.fired.map(f => f.text), ...(res.fallback ? { fallback: res.fallback } : {}) };
      const nx = out.next && allEvents().find(x => x.id === out.next);
      if (nx) next(nx);
      r.fired.forEach(f => next(f.ev));
      return onFx();
    }
    // 📜 sohbete doğrudan seçilen olay: sen mesaj olarak yazarsın, 🎲 sonucu (📈 parametre değişimleriyle) karakterden mesaj olarak gelir.
    // Sonucun "sonraki olay"ı ve ⚡ eşik olayları hemen ardından aynı şekilde gelir (en fazla MAX_CHAIN adım)
    function eventMessages(e, subId, depth = 0) {
      const ids = chatCharIds(), sc = { chars: ids }, live = withSub(evLive(e), subId), ev = scEventOut(live, sc);
      const ts = Math.max(Date.now(), ((list[list.length - 1] || {}).ts || 0) + 1);
      // evc / oc: sohbette olay ve sonuç kartı olarak çizilir
      const evc = { title: live.title, emojis: live.emojis || '', color: ev.color || '', level: ev.level || '', ...(live.subOf ? { sub: live.subOf } : {}) };
      const ctx = condCtx(ids);
      list.push({ id: Store.uid(), from: 'me', text: evText(live, sc, true), ts, ev: e.id, evc });
      markDone(e.id, live.subId);
      if (!depth) useEvents([e.id]);
      const res = resolveOutcome(ev.outcomes, ctx), chain = [];
      const who = group && ids[0] ? { who: ids[0] } : {};
      if (res && res.blocked) list.push({ id: Store.uid(), from: 'her', ...who, text: res.blocked.text || '🎲 Sonuç', oc: { pct: res.blocked.pct, blocked: res.blocked.why, ev: live.title }, ts: ts + 1 });
      else if (res) {
        const out = res.out, r = applyOutcome(out, ids);
        if (r.text || r.changes.length || r.fired.length || res.fallback) list.push({ id: Store.uid(), from: 'her', ...who, text: r.text || '🎲 Sonuç',
          oc: { pct: out.pct, changes: r.changes, fired: r.fired.map(f => f.text), ev: live.title, ...(res.fallback ? { fallback: res.fallback } : {}) }, ts: ts + 1 });
        const nx = out.next && allEvents().find(x => x.id === out.next);
        if (nx) chain.push(nx);
        r.fired.forEach(f => chain.push(f.ev));
      }
      // ⚡ olunca etkileri (sonuçtan sonra): olay kartında görünür
      if ((ev.onEffects || []).length) {
        const r2 = applyOutcome({ text: '', effects: ev.onEffects }, ids);
        if (r2.changes.length) evc.changes = r2.changes;
        r2.fired.forEach(f => chain.push(f.ev));
      }
      const vc = virginFx(e.id, ids);
      if (vc.length) evc.changes = [...(evc.changes || []), ...vc];
      if (depth >= MAX_CHAIN) return;
      chain.forEach(x => eventMessages(x, undefined, depth + 1));
    }
    function nextScene() {
      const last = lastScene();
      // 🎬 Monia senaryosu: sıradaki olay
      const scn = th.scenario;
      if (scn && scn.i < scn.events.length) {
        // olayın kendi mekanı varsa hikaye oraya geçer
        const n = scn.i++, e = typeof scn.events[n] === 'string' ? { text: scn.events[n] } : scn.events[n];
        const sc0 = MO().scenarios.find(s => s.id === scn.id) || {}, ids = scn.chars || sc0.chars || [];
        // ↪ / ⚡ ile gelen olay "now": hemen ardından kart olur (autoScene)
        let at0 = scn.i;
        const o = eventScene(e, last && last.scene, '', ids.length ? ids : chatCharIds(), nx => { scn.events.splice(at0++, 0, { ...scEventOut(nx, { ...sc0, chars: ids }), now: true }); });
        o.ev = `${n + 1}/${scn.events.length}`;
        return o;
      }
      if (!last) return pickPlace();
      let i = list.lastIndexOf(last);
      // buraya gelindiği kart (ipucu olmayan son mekan kartı) ve sonrası
      let j = i;
      while (j > 0 && !(list[j].scene && !list[j].scene.kind)) j--;
      const here = list.slice(j).filter(m => m.scene), used = new Set(here.map(m => m.scene.hint));
      const p = allPlaces().find(x => x.id === last.scene.place), sc = last.scene;
      const left = p ? p.hints.filter(h => !used.has(h)) : [];
      if (left.length) return { ...sc, hint: pickOf(left), kind: 'hint' };
      const moments = (Stories.MOMENTS || []).filter(h => !used.has(h));
      if ((!p || p.moments !== false) && here.length < (p ? p.hints.length : 1) + 3 && moments.length) return { ...sc, hint: pickOf(moments), kind: 'hint' };
      return pickPlace(sc.place);
    }
    function sceneMsg(sc) {
      const { hint, ...rest } = sc;
      if (!rest.kind) delete rest.kind;
      return { id: Store.uid(), from: 'sys', text: fillHint(hint), scene: { ...rest, hint }, ts: Math.max(Date.now(), ((list[list.length - 1] || {}).ts || 0) + 1) };
    }
    function addScene(sc, label) {
      if (label) snap(label);
      list.push(sceneMsg(sc));
      save(); draw(); refreshList();
    }
    // 🗺️ mekan kartları kapalıysa sadece senaryo olayları kart olarak gelir
    function autoScene() {
      if (cs.playing) return;
      const scn = th.scenario, scEv = scn && scn.i < scn.events.length;
      // sıradaki 📜 olay (bir sonucun "sonraki olay"ı): son olay mesajından HINT_EVERY mesaj sonra
      if ((th.evQueue || []).length) {
        let k = list.length - 1;
        while (k >= 0 && !list[k].ev) k--;
        if (k < 0 || list.slice(k + 1).filter(m => m.from !== 'sys').length >= HINT_EVERY) {
          const qe = allEvents().find(x => x.id === th.evQueue.shift());
          if (qe) eventMessages(qe);
          save(); draw(); refreshList();
          return;
        }
      }
      if (!scEv && (!placesOn() || !allPlaces().length)) return;
      let i = list.length - 1;
      while (i >= 0 && !list[i].scene) i--;
      if (i >= 0 && list.slice(i + 1).filter(m => m.from !== 'sys').length < HINT_EVERY) return;
      addScene(nextScene());
      flushNow();
    }
    // senaryoda ↪ / ⚡ ile tetiklenen olaylar beklemeden kart olur
    function flushNow() {
      const scn = th.scenario;
      for (let g = 0; g < MAX_CHAIN && scn && scn.i < scn.events.length && scn.events[scn.i].now; g++) addScene(nextScene());
    }
    // m: değiştirilecek kart; yoksa sona yeni bir mekan kartı (hikaye başka yere geçer)
    function placeSheet(m) {
      const cur = m ? { ...m.scene, hint: m.text } : (() => { const p = pickPlace(); return { ...p, hint: fillHint(p.hint) }; })();
      const origPlace = cur.place;
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>📍 ${m ? 'Mekanı değiştir' : 'Yeni mekan'}</h3>
        ${allGroups().map(g => `<div class="sec-title">${g.icon} ${esc(g.name)}</div>
          <div class="pl-grid">${allPlaces().filter(p => inGroup(p, g)).map(p => `<button type="button" data-pl="${p.id}" class="${p.id === cur.place ? 'on' : ''}"><span>${p.icon}</span><small>${esc(p.name)}</small></button>`).join('')}</div>`).join('')}
        <div class="sec-title">Kendi mekanın (isteğe bağlı)</div>
        <div class="pl-own"><input id="plIcon" maxlength="4" placeholder="📍"><input id="plName" maxlength="40" placeholder="ör. Büyükannesinin bahçesinde"></div>
        <div class="sec-title">İpucu <button type="button" class="pl-roll" id="plRoll" aria-label="Başka bir ipucu">🎲</button></div>
        <textarea id="plHint" rows="3" maxlength="300" placeholder="Şuradasınız, şunu yapıyorsunuz…">${esc(cur.hint || '')}</textarea>
        <button type="button" class="btn pink block" id="plSave">${m ? 'Kaydet' : 'Mekanı ekle'}</button>`, 'light');
      const hintEl = sh.el.querySelector('#plHint');
      const roll = () => {
        const p = allPlaces().find(x => x.id === cur.place);
        if (!p) return;
        const left = p.hints.map(fillHint).filter(h => h !== hintEl.value);
        hintEl.value = pickOf(left.length ? left : p.hints.map(fillHint));
      };
      sh.el.onclick = e => {
        const b = e.target.closest('[data-pl]');
        if (b) {
          const p = allPlaces().find(x => x.id === b.dataset.pl);
          Object.assign(cur, { place: p.id, icon: p.icon, name: p.name });
          sh.el.querySelectorAll('[data-pl]').forEach(x => x.classList.toggle('on', x === b));
          roll();
          return;
        }
        if (e.target.closest('#plRoll')) { roll(); return; }
        if (!e.target.closest('#plSave')) return;
        const own = sh.el.querySelector('#plName').value.trim(), ownIcon = sh.el.querySelector('#plIcon').value.trim();
        const sc = { place: own ? '' : cur.place, icon: ownIcon || (own ? '📍' : cur.icon), name: own || cur.name, hint: hintEl.value.trim() };
        sh.close();
        if (m) {
          snap('Mekan değişti');
          m.text = sc.hint;
          m.scene = { place: sc.place, icon: sc.icon, name: sc.name, hint: sc.hint };
          if (cur.kind && !own && sc.place === origPlace) m.scene.kind = cur.kind;
          save(); draw(m.id); refreshList();
        } else addScene(sc, 'Mekan eklendi');
      };
    }

    $('#composer').onsubmit = e => {
      e.preventDefault();
      const t = input.value.trim();
      const editingPhoto = cs.mode && cs.mode.type === 'edit' && (list.find(x => x.id === cs.mode.id) || {}).type === 'photo';
      if ((!t && !editingPhoto) || cs.playing) return;
      input.value = '';
      send(t);
      input.focus();
    };
    input.onkeydown = e => {
      if (e.key !== 'Escape') return;
      if (cs.mode) cancelMode();
      else if (cs.reply) { cs.reply = null; drawReply(); }
    };
    // 📜 # ile olay: "#fore" yazınca üstte benzer olaylar çıkar, seçince olay mesaj olarak yazılır (alt derece adıyla da bulunur)
    const writeEvents = picked => {
      snap('Olay');
      picked.forEach(x => eventMessages(x.e, x.sub));
      save(); draw(); refreshList();
    };
    hashSuggest(input, (e, sub) => {
      if (cs.playing) return;
      if (sub) writeEvents([{ e, sub }]);
      else askSubs([e], writeEvents);
      input.focus();
    });

    $('#sideBtn').onclick = () => { setSide(nextKey(cs.side === 'sys' ? (cs.before || 'me') : keyOf())); input.focus(); };
    if (group) $('#spkRow').onclick = e => { const b = e.target.closest('[data-spk]'); if (b) { setSide(b.dataset.spk); input.focus(); } };
    $('#chatTools').onclick = e => {
      const b = e.target.closest('[data-tool]');
      if (!b) return;
      const t = b.dataset.tool;
      if (t === 'theme') themeSheet();
      if (t === 'turns') {
        S().turns[th.id] = !turns();
        save();
        drawComposer();
        notify(turns() ? 'Sırayla: her mesajdan sonra sıradaki kişi yazar' : 'Sırayla kapalı: konuşan sen değiştirene kadar aynı kalır', '⇄');
      }
      if (t === 'note') {
        if (cs.side === 'sys') setSide(cs.before || 'me');
        else { cs.before = keyOf(); setSide('sys'); }
        input.focus();
      }
      if (t === 'photo') photoSheet();
      if (t === 'help') drawHelper(true);
      if (t === 'place') placeSheet(null);
      if (t === 'event') poolPicker({ title: '📜 Olay yaz', catFirst: CHAT_TOP_TAG }, evs => {
        if (!evs.length) return;
        askSubs(evs, writeEvents);
      });
      if (t === 'more') {
        const m = $('#ctMore');
        m.hidden = !m.hidden;
        b.classList.toggle('on', !m.hidden);
      }
      if (t === 'music') {
        const sh = sheet(`
          <div class="sheet-grip"></div>
          <h3>🎵 Bu sohbetin müziği</h3>
          <div class="about" style="margin-bottom:10px">Sohbet açıkken döngüde çalar. Sohbetten çıkınca menü müziğine döner.</div>
          <div class="mu-list">
            <button type="button" class="mu-row mu-pick${th.music ? '' : ' on'}" data-chmu=""><span class="mu-ic">🔇</span><div class="mu-info"><b>Müzik yok</b><small>sessiz sohbet</small></div></button>
            ${MU.list().map(x => `<button type="button" class="mu-row mu-pick${th.music === x.id ? ' on' : ''}" data-chmu="${esc(x.id)}"><span class="mu-ic">${esc(x.icon)}</span><div class="mu-info"><b>${esc(x.name)}</b><small>${esc(MU.info(x))}</small></div></button>`).join('')}
          </div>`, 'light');
        sh.el.onclick = e => {
          const p = e.target.closest('[data-chmu]');
          if (!p) return;
          if (p.dataset.chmu) th.music = p.dataset.chmu; else delete th.music;
          save();
          b.classList.toggle('on', !!th.music);
          sh.close();
          musicUnlocked = true;
          syncMusic(true);
          notify(th.music ? `🎵 ${MU.byId(th.music).name}` : 'Bu sohbette müzik kapalı', '🎵');
        };
      }
      if (t === 'places') {
        placesOn(!placesOn());
        b.classList.toggle('on', placesOn());
        $('[data-tool=place]').hidden = !placesOn();
        notify(placesOn() ? 'Mekan kartları açık' : 'Mekan kartları kapalı (senaryo olayları yine gelir)', '🗺️');
        if (placesOn()) autoScene();
      }
      if (t === 'fx') fxSheet(cs.nextFx, { title: 'Sonraki mesajın efekti' }, v => { cs.nextFx = v === 'none' || v === 'auto' ? null : v; drawComposer(); input.focus(); });
      if (t === 'emoji') {
        cs.emojiOpen = !cs.emojiOpen;
        cs.emojiEdit = false;
        drawEmoji();
      }
    };
    $('.hcard').onclick = e => {
      const z = e.target.closest('[data-zoom]');
      if (z && c) lightbox(c.album, +z.dataset.zoom);
      if (e.target.closest('#threadBtn')) threadSheet();
      if (e.target.closest('#groupBtn')) groupSheet(th);
    };
    if (group) $('#groupHead').onclick = () => groupSheet(th);
    $('#moreBtn').onclick = e => { e.stopPropagation(); toggleMenu(); };
    $('#undoBtn').onclick = undo;
    $('#statBtn').onclick = () => { statsOn(!statsOn()); $('#statBtn').classList.toggle('on', statsOn()); drawStats(); };
    $('#stCard').onclick = e => {
      const b = e.target.closest('[data-stb]');
      if (!b) return;
      const [cid, fid] = b.dataset.stb.split('|'), ch = byId(cid);
      if (!ch) return;
      ch.fields = ch.fields || {};
      ch.fields[fid] = !ch.fields[fid];
      save(); drawStats();
    };

    /* ---------- 🔍 Arama ---------- */
    const sr = { hits: [], cur: -1 };
    function openSearch() {
      $('#searchBar').hidden = false;
      $('#sq').focus();
      $('#sq').select();
    }
    function closeSearch() {
      $('#searchBar').hidden = true;
      $('#sq').value = '';
      ctx.query = '';
      sr.hits = [];
      draw();
    }
    function runSearch() {
      const q = $('#sq').value.trim().toLocaleLowerCase('tr');
      ctx.query = q;
      sr.hits = q ? list.filter(m => (m.text || '').toLocaleLowerCase('tr').includes(q)).map(m => m.id) : [];
      sr.cur = sr.hits.length - 1; // en yeniden başla
      drawMessages(ctx, cs);
      markHits(true);
    }
    function markHits(jump) {
      const cnt = $('#sCount');
      if (!ctx.query) { cnt.textContent = ''; return; }
      cnt.textContent = sr.hits.length ? `${sr.cur + 1}/${sr.hits.length}` : '0 sonuç';
      box.querySelectorAll('.hit-cur').forEach(x => x.classList.remove('hit-cur'));
      const el = sr.hits.length && box.querySelector(`[data-id="${sr.hits[sr.cur]}"]`);
      if (el) { el.classList.add('hit-cur'); if (jump) el.scrollIntoView({ block: 'center' }); }
    }
    const step = d => { if (!sr.hits.length) return; sr.cur = (sr.cur + d + sr.hits.length) % sr.hits.length; markHits(true); };
    $('#searchBtn').onclick = () => ($('#searchBar').hidden ? openSearch() : closeSearch());

    /* ---------- 🖼️ Büyük fotoğraf: sohbetin üstünde karakterin fotoğrafı ----------
     * Tekli: karakterin fotoğrafı; dokununca albümde sıradakine geçer (seçim sohbete kaydedilir).
     * Grup: üyeler yan yana; son yazan (Oynat'ta o an yazan) öne çıkar. */
    const heroPics = ch => [...new Set([ch.photo, ...ch.album].filter(Boolean))];
    function drawHero(activeId) {
      const el = $('#hero');
      const on = !!th.hero;
      el.hidden = !on;
      $('.hcard').hidden = on;
      $('#heroBtn').classList.toggle('on', on);
      if (!on) return;
      el.style.height = th.heroH ? clampHero(th.heroH) + 'px' : '';
      const grip = '<div class="hero-grip" aria-hidden="true"><i></i></div>';
      if (!group) {
        const pics = heroPics(c);
        const i = Math.max(0, pics.indexOf(th.heroImg));
        el.className = 'hero';
        el.innerHTML = (pics.length
          ? `<img src="${esc(pics[i])}" alt="" draggable="false">
             <div class="hero-cap"><b>${esc(c.name)}</b>${pics.length > 1 ? `<small>${i + 1}/${pics.length} · dokun: değiştir · sürükle: boyut</small>` : '<small>sürükle: boyut</small>'}</div>`
          : `<div class="hero-empty" style="background:${esc(grad(c))}">${initial(c.name)}<small>Fotoğraf yok</small></div>`) + grip;
        return;
      }
      const ms = members();
      const lastHer = [...list].reverse().find(m => m.from === 'her');
      const act = activeId || (lastHer && lastHer.who);
      el.className = 'hero group';
      el.innerHTML = ms.map(m => {
        const p = heroPics(m)[0];
        return `<a class="hero-m${m.id === act ? ' on' : ''}" href="#/p/${m.id}" style="background:${esc(grad(m))}">
          ${p ? `<img src="${esc(p)}" alt="" draggable="false">` : `<span class="hero-ini">${initial(m.name)}</span>`}<b>${esc(m.name)}</b></a>`;
      }).join('') + grip;
    }

    // Parmakla (ya da fareyle) aşağı/yukarı sürükleyerek yükseklik ayarı; sadece dokunmak eskisi gibi çalışır
    const clampHero = h => Math.round(Math.max(110, Math.min(h, $('.chat').clientHeight - 230)));
    let drag = null, dragged = false;
    $('#hero').addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      drag = { y: e.clientY, h: $('#hero').offsetHeight, id: e.pointerId };
      dragged = false;
    });
    $('#hero').addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = e.clientY - drag.y;
      if (!dragged && Math.abs(dy) < 8) return;
      if (!dragged) {
        dragged = true;
        try { $('#hero').setPointerCapture(e.pointerId); } catch (err) { /* parmak bu arada kalkmış olabilir */ }
        $('#hero').classList.add('resizing');
      }
      $('#hero').style.height = clampHero(drag.h + dy) + 'px';
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      $('#hero').classList.remove('resizing');
      if (dragged) { th.heroH = $('#hero').offsetHeight; save(); }
    };
    $('#hero').addEventListener('pointerup', endDrag);
    $('#hero').addEventListener('pointercancel', endDrag);
    // Sürüklemeden sonra gelen tıklama fotoğrafı değiştirmesin / profile gitmesin
    $('#hero').addEventListener('click', e => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);    $('#heroBtn').onclick = () => { th.hero = !th.hero; save(); drawHero(); if (!th.hero) box.scrollTop = box.scrollHeight; };
    $('#hero').onclick = e => {
      if (group) return; // grupta üyeye dokununca profili açılır
      const pics = heroPics(c);
      if (pics.length < 2) return;
      th.heroImg = pics[(Math.max(0, pics.indexOf(th.heroImg)) + 1) % pics.length];
      save();
      drawHero();
    };
    $('#sq').oninput = runSearch;
    $('#sq').onkeydown = e => {
      if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? 1 : -1); }
      if (e.key === 'Escape') closeSearch();
    };
    $('#sPrev').onclick = () => step(-1);
    $('#sNext').onclick = () => step(1);
    $('#sClose').onclick = closeSearch;

    // Ctrl+Z: geri al, Ctrl+F: ara
    ui.chatKeys = e => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod || cs.playing) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !(document.activeElement === input && input.value) && document.activeElement !== $('#sq')) { e.preventDefault(); undo(); }
      if (k === 'f') { e.preventDefault(); openSearch(); }
    };

    /* ---------- 😊 Emoji paneli: kısayollar; efektli emojiler noktayla işaretli ---------- */
    function drawEmoji() {
      const el = $('#emojiPanel');
      el.hidden = !cs.emojiOpen;
      $('[data-tool=emoji]').classList.toggle('on', !!cs.emojiOpen);
      if (!cs.emojiOpen) return;
      const map = emojiFxMap(), edit = cs.emojiEdit;
      el.innerHTML = `<div class="ep-grid">${emojiBar().map((e, i) => `<button type="button" class="ep-e${edit ? ' edit' : ''}" data-e="${i}" title="${map[e] ? 'Efekt: ' + esc(emojiFxLabel(map[e])) : ''}">${e}${map[e] ? '<i class="ep-dot"></i>' : ''}${edit ? `<b class="ep-x" data-ex="${i}">✕</b>` : ''}</button>`).join('')}
          ${edit ? '<input class="ep-add" id="epAdd" placeholder="+ emoji yapıştır, Enter" maxlength="40">' : ''}</div>
        <div class="ep-foot"><small>${edit ? 'Emojiye dokun: efektini seç · ✕ kaldır' : 'Noktalı emojiler baloncuğa efekt verir'}</small>
          ${edit ? '<button type="button" id="epReset">Varsayılan</button>' : ''}
          <button type="button" id="epEdit">${edit ? '✓ Bitti' : '✏️ Düzenle'}</button></div>`;
    }

    // Emojiye efekt seç (S().emojiFx: '' = efektsiz; kayıt silinirse varsayılana döner)
    function emojiFxSheet(e) {
      const cur = emojiFxMap()[e] || '';
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>${e} için efekt</h3>
        <div class="fx-grid">${EM.list.map(f => `<button type="button" data-ef="${f.id}" class="${cur === f.id ? 'on' : ''}"><span>${f.icon}</span>${esc(f.label)}</button>`).join('')}
          <button type="button" data-ef="" class="${!cur ? 'on' : ''}"><span>🚫</span>Efekt yok</button></div>
        ${EM.effects[e] !== undefined ? `<button class="btn ghost block" data-ef="default" style="margin-top:12px">Varsayılana dön (${esc(emojiFxLabel(EM.effects[e]) || 'yok')})</button>` : ''}`, 'light');
      sh.el.onclick = ev => {
        const b = ev.target.closest('[data-ef]');
        if (!b) return;
        sh.close();
        S().emojiFx = S().emojiFx || {};
        if (b.dataset.ef === 'default') delete S().emojiFx[e]; else S().emojiFx[e] = b.dataset.ef;
        save();
        drawEmoji();
        draw();
      };
    }

    $('#emojiPanel').addEventListener('click', e => {
      const x = e.target.closest('[data-ex]');
      if (x) { emojiBar().splice(+x.dataset.ex, 1); save(); drawEmoji(); return; }
      if (e.target.closest('#epEdit')) { cs.emojiEdit = !cs.emojiEdit; drawEmoji(); if (cs.emojiEdit) $('#epAdd').focus(); return; }
      if (e.target.closest('#epReset')) {
        if (!confirm('Emoji listesi ve efekt seçimleri varsayılana dönsün mü?')) return;
        S().emojiBar = EM.bar.slice(); S().emojiFx = {}; save(); drawEmoji(); draw(); return;
      }
      const b = e.target.closest('[data-e]');
      if (!b) return;
      const emo = emojiBar()[+b.dataset.e];
      if (cs.emojiEdit) { emojiFxSheet(emo); return; }
      // Yazma alanına imlecin olduğu yere ekle
      const s = input.selectionStart == null ? input.value.length : input.selectionStart;
      const en = input.selectionEnd == null ? s : input.selectionEnd;
      input.setRangeText(emo, s, en, 'end');
      input.focus();
    });
    $('#emojiPanel').addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.target.id !== 'epAdd') return;
      e.preventDefault();
      const v = e.target.value.trim();
      if (!v) return;
      // Yapıştırılan birden çok emojiyi tek tek ayır
      const parts = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('tr', { granularity: 'grapheme' }).segment(v)].map(x => x.segment) : [v];
      parts.filter(p => p.trim() && !emojiBar().includes(p)).forEach(p => emojiBar().push(p));
      save();
      drawEmoji();
      $('#epAdd').focus();
    });

    // 📷 Fotoğraf: cihazdan ya da albümlerden. Yazma alanındaki metin açıklama olur.
    function photoSheet() {
      if (cs.side === 'sys') setSide(cs.before || 'me');
      if (cs.mode && cs.mode.type === 'edit') cancelMode();
      const ch = curChar();
      const who = ch ? ch.name : userName();
      const albums = (ch ? [ch] : group ? members() : [c]).filter(m => m.album.length);
      const srcs = [];
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>📷 Fotoğraf gönder</h3>
        <div class="photo-who">${esc(who)} olarak gönderilecek${input.value.trim() ? ' · yazdığın metin açıklama olur' : ''}</div>
        <label class="btn ghost block photo-up">📁 Cihazdan seç<input type="file" accept="image/*" id="phFile" hidden></label>
        ${GAL ? `<button type="button" class="btn ghost block photo-up" id="phGal">🖼️ ${esc(GAL.name)}'den seç</button>` : ''}
        ${albums.map(m => `<div class="sec-title">${esc(m.name)} albümü</div>
          <div class="pick-photos">${m.album.map(s => `<button type="button" data-ph="${srcs.push(s) - 1}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div>`).join('')}`, 'light');
      const go = src => {
        sh.close();
        const caption = input.value.trim();
        input.value = '';
        send(caption, { type: 'photo', src });
      };
      sh.el.querySelector('#phFile').onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try { go(await readPhoto(f, 720, false)); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      };
      sh.el.querySelectorAll('[data-ph]').forEach(b => b.onclick = () => go(srcs[+b.dataset.ph]));
      const pg = sh.el.querySelector('#phGal');
      if (pg) pg.onclick = () => { sh.close(); galleryPicker({ title: `${who} olarak fotoğraf gönder` }, ([u]) => go(u)); };
    }

    // 🎨 Tema: arka plan (renk, karakter fotoğrafları ya da yüklenen fotoğraf) ve baloncuk stili
    function themeSheet() {
      const cur = () => themeOf(th, look);
      const albums = group ? members().flatMap(m => m.album) : c.album;
      const imgs = [...new Set([look.theme && look.theme.img, th.theme && th.theme.img, ...albums].filter(Boolean))];
      const t0 = cur();
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>🎨 Sohbet teması</h3>
        ${(TH.presets || []).length ? `<div class="sec-title" style="margin-top:0">Hazır temalar</div>
        <div class="preset-row">${TH.presets.map(p => `<button type="button" data-preset="${p.id}" class="${p.bg ? (TH.backgrounds.find(b => b.id === p.bg) || {}).cls || '' : ''}${t0.bg === p.bg && t0.bubble === p.bubble ? ' on' : ''}" title="${esc(p.note || '')}"><b>${p.icon} ${esc(p.label)}</b></button>`).join('')}</div>` : ''}
        <div class="sec-title"${(TH.presets || []).length ? '' : ' style="margin-top:0"'}>Arka plan</div>
        <div class="bg-grid">
          ${TH.backgrounds.map(b => `<button type="button" data-bg="${b.id}" class="${b.cls || ''}${t0.bg === b.id ? ' on' : ''}"${b.css ? ` style="background:${b.css}"` : ''}><span>${esc(b.label)}</span></button>`).join('')}
          ${imgs.map((src, i) => `<button type="button" data-img="${i}" class="${t0.bg === 'img' && t0.img === src ? 'on' : ''}" style="background:url('${esc(src)}') center / cover no-repeat, ${DARK_BG()}"><span>📷</span></button>`).join('')}
          <label class="up">➕<span>Fotoğraf yükle</span><input type="file" accept="image/*" id="bgFile" hidden></label>
          ${GAL ? `<button type="button" class="up" id="bgGal">🖼️<span>${esc(GAL.name)}</span></button>` : ''}
        </div>
        <div class="sec-title">Baloncuklar</div>
        <div class="bub-grid">
          ${TH.bubbles.map(b => `<button type="button" data-bub="${b.id}" class="${t0.bubble === b.id ? 'on' : ''}">
            <div class="mini" style="${esc(bubbleVars(b, look))}"><i class="h">Selam 👋</i><i class="m">Merhaba!</i></div><span>${esc(b.id === 'char' && group ? 'Her üye kendi rengi' : b.label)}</span></button>`).join('')}
        </div>
        ${group ? `<div class="sec-title">Üye renkleri</div>
          <div class="mc-list">${members().map(m => {
            const ci = (th.memberColors || {})[m.id];
            return `<div class="mc-row">${avatar(m, 32)}<b>${esc(m.name)}</b><div class="mc-sw">
              <button type="button" class="def ${ci == null ? 'on' : ''}" data-mc="${m.id}" data-ci="-1" title="Baloncuk stiline göre">–</button>
              ${TH.memberColors.map((p, i) => `<button type="button" class="${ci === i ? 'on' : ''}" data-mc="${m.id}" data-ci="${i}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Renk ${i + 1}"></button>`).join('')}
            </div></div>`;
          }).join('')}</div>
          <small class="mc-hint">Seçtiğin renk, baloncuk stilinden bağımsız olarak o üyenin baloncuklarına uygulanır. “–” stile geri döner.</small>`
          : `<label class="flt-row"><span>${esc(c.name)} ile açılacak yeni sohbetlerde de kullan</span><input type="checkbox" id="thDef" checked></label>`}`, 'light');
      const el = sh.el;
      el.querySelectorAll('[data-mc]').forEach(b => b.onclick = () => {
        const id = b.dataset.mc, ci = +b.dataset.ci;
        th.memberColors = th.memberColors || {};
        if (ci < 0) delete th.memberColors[id]; else th.memberColors[id] = ci;
        save();
        el.querySelectorAll(`[data-mc="${id}"]`).forEach(x => x.classList.toggle('on', x === b));
        draw();
      });
      const set = patch => {
        th.theme = Object.assign(cur(), patch);
        const def = el.querySelector('#thDef');
        if (def && def.checked) c.theme = Object.assign({}, th.theme);
        save();
        applyTheme();
        el.querySelectorAll('[data-bg], [data-img]').forEach(b => b.classList.toggle('on',
          b.dataset.bg ? th.theme.bg === b.dataset.bg : th.theme.bg === 'img' && th.theme.img === imgs[+b.dataset.img]));
        el.querySelectorAll('[data-bub]').forEach(b => b.classList.toggle('on', th.theme.bubble === b.dataset.bub));
        el.querySelectorAll('[data-preset]').forEach(b => {
          const p = TH.presets.find(x => x.id === b.dataset.preset);
          b.classList.toggle('on', th.theme.bg === p.bg && th.theme.bubble === p.bubble);
        });
      };
      el.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => set({ bg: b.dataset.bg }));
      const bgGal = el.querySelector('#bgGal');
      if (bgGal) bgGal.onclick = () => { sh.close(); galleryPicker({ title: 'Sohbet arka planı' }, ([u]) => { set({ bg: 'img', img: u }); notify('Arka plan ayarlandı', '🎨'); }); };
      el.querySelectorAll('[data-img]').forEach(b => b.onclick = () => set({ bg: 'img', img: imgs[+b.dataset.img] }));
      el.querySelectorAll('[data-bub]').forEach(b => b.onclick = () => set({ bubble: b.dataset.bub }));
      el.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
        const p = TH.presets.find(x => x.id === b.dataset.preset);
        set({ bg: p.bg, bubble: p.bubble });
      });
      el.querySelector('#bgFile').onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try { set({ bg: 'img', img: await readPhoto(f, 1080, false) }); sh.close(); notify('Arka plan değişti', '🎨'); }
        catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      };
    }

    function applyTheme() {
      const el = $('.chat');
      if (!el) return;
      const t = themeOf(th, look);
      el.style.cssText = themeCss(t, look);
      themeClasses(el, t);
      // ☁️ açık arka plan: sohbet yazıları koyu
      el.classList.toggle('chat-light', t.bg !== 'img' && !!(TH.backgrounds.find(b => b.id === t.bg) || {}).light);
      // grupta "Karakter rengi": her üyenin baloncuğu kendi renginde
      el.classList.toggle('sbub-char', group && t.bubble === 'char');
    }

    // Bu karakterin diğer sohbetleri
    function threadSheet() {
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>🗂️ ${esc(c.name)} ile sohbetler</h3>
        ${threadsOf(c).map(t => `<button class="act ${t.id === th.id ? 'cur' : ''}" data-th="${t.id}">${t.id === th.id ? '💬' : '🗂️'} ${esc(t.title)} <small>· ${msgsOf(t).length} mesaj</small></button>`).join('')}
        ${groupsOf(c).map(t => `<button class="act" data-th="${t.id}">👥 ${esc(t.title)} <small>· grup</small></button>`).join('')}
        <button class="act" data-th="new">➕ Yeni sohbet</button>
        <button class="act" data-th="group">👥 ${esc(c.name)} ile grup kur</button>
        <button class="act" data-th="rename">✏️ Bu sohbetin adını değiştir</button>`, 'light');
      sh.el.onclick = e => {
        const b = e.target.closest('[data-th]');
        if (!b) return;
        sh.close();
        const v = b.dataset.th;
        if (v === 'new') createThread(c);
        else if (v === 'group') groupSheet(null, c.id);
        else if (v === 'rename') renameThread(th, render);
        else if (v !== th.id) location.hash = `#/chat/${v}`;
      };
    }

    // Konuşanı değiştir (grupta: sen ya da üyelerden biri)
    function speakerSheet(m) {
      const cur = m.from === 'me' ? 'me' : m.who;
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>👤 Bu mesajı kim yazsın?</h3>
        ${order().map(k => {
          const ch = k === 'me' ? null : byId(k);
          return `<button class="act spk-act ${k === cur ? 'cur' : ''}" data-k="${k}">${ch ? avatar(ch, 32) : userAvatar(32)} ${esc(ch ? ch.name : userName())}</button>`;
        }).join('')}`, 'light');
      sh.el.onclick = e => {
        const b = e.target.closest('[data-k]');
        if (!b) return;
        sh.close();
        if (b.dataset.k === cur) return;
        snap('Konuşan değişti');
        if (b.dataset.k === 'me') { m.from = 'me'; delete m.who; } else { m.from = 'her'; m.who = b.dataset.k; }
        save(); draw(m.id); refreshList();
      };
    }

    // Mesaja dokununca: tepki, cevap ver, düzenle, konuşanı değiştir, araya ekle, taşı, sil
    box.onclick = e => {
      if (cs.playing) return;
      const q = e.target.closest('[data-q]');
      if (q) {
        const o = box.querySelector(`[data-id="${q.dataset.q}"]`);
        if (o) { o.scrollIntoView({ block: 'center', behavior: 'smooth' }); o.classList.add('flash'); setTimeout(() => o.classList.remove('flash'), 1200); }
        return;
      }
      const el = e.target.closest('[data-id]');
      if (!el) return;
      const m = list.find(x => x.id === el.dataset.id);
      const i = list.indexOf(m);
      const photo = m.type === 'photo';
      // Efekt rozetine dokununca efekt yeniden oynar; görünmez mürekkep ilk dokunuşta açılır
      if (e.target.closest('.fx-tag')) { playFx(el, fxOf(m)); return; }
      if (el.classList.contains('fx-ink') && !el.classList.contains('shown')) { el.classList.add('shown'); return; }
      const fxNow = fxOf(m), fxDef = fxById(fxNow);
      const flipLabel = group ? '👤 Konuşanı değiştir' : `🔁 ${m.from === 'me' ? `${esc(c.name)} yazsın` : 'Ben yazayım'}`;
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <div class="row-act-head msg-prev">${photo ? `<img class="prev-img" src="${esc(m.src)}" alt="">` : ''}${m.from !== 'sys' && group ? `<b>${esc(nameOf(m))}:</b> ` : ''}${esc(m.text)}</div>
        ${m.from !== 'sys' ? `<div class="react-row">${REACTIONS.map(r => `<button type="button" data-react="${r}" class="${m.react === r ? 'on' : ''}">${r}</button>`).join('')}</div>` : ''}
        ${m.from !== 'sys' ? '<button class="act" data-act="reply">↩️ Cevap ver</button>' : ''}
        ${photo ? '<button class="act" data-act="zoom">🔍 Fotoğrafı büyüt</button>' : ''}
        ${m.from !== 'sys' ? `<button class="act" data-act="fx">✨ Efekt${fxDef ? `: ${fxDef.icon} ${esc(fxDef.label)}${m.effect ? '' : ' <small>(anahtar kelime)</small>'}` : ''}</button>` : ''}
        ${fxDef ? '<button class="act" data-act="fxplay">▶️ Efekti oynat</button>' : ''}
        ${m.scene ? '<button class="act" data-act="sc-pick">📍 Mekanı değiştir</button><button class="act" data-act="sc-roll">🎲 Başka bir yer</button>' : ''}
        <button class="act" data-act="edit">✏️ ${photo ? 'Açıklamayı düzenle' : m.scene ? 'İpucunu düzenle' : 'Düzenle'}</button>
        ${m.from !== 'sys' ? `<button class="act" data-act="flip">${flipLabel}</button>` : ''}
        <button class="act" data-act="insert">➕ Üstüne mesaj ekle</button>
        ${i > 0 ? '<button class="act" data-act="up">⬆️ Yukarı taşı</button>' : ''}
        ${i < list.length - 1 ? '<button class="act" data-act="down">⬇️ Aşağı taşı</button>' : ''}
        <button class="act danger" data-act="del">🗑️ Sil <small>(↶ ile geri alınabilir)</small></button>`, 'light');
      sh.el.onclick = ev => {
        const rb = ev.target.closest('[data-react]');
        if (rb) {
          sh.close();
          snap('Tepki');
          if (m.react === rb.dataset.react) delete m.react; else m.react = rb.dataset.react;
          save();
          draw(m.id);
          return;
        }
        const b = ev.target.closest('[data-act]');
        if (!b) return;
        sh.close();
        const a = b.dataset.act;
        if (a === 'zoom') { lightbox([m.src]); return; }
        if (a === 'sc-pick') { placeSheet(m); return; }
        if (a === 'sc-roll') {
          snap('Mekan değişti');
          const n = sceneMsg(pickPlace(m.scene.place));
          m.text = n.text; m.scene = n.scene;
        }
        if (a === 'fxplay') { playFx(box.querySelector(`[data-id="${m.id}"]`), fxNow); return; }
        if (a === 'fx') {
          fxSheet(m.effect || null, { title: 'Mesaj efekti', auto: true }, v => {
            snap('Efekt');
            if (v === 'auto') delete m.effect; else m.effect = v;
            save();
            draw(m.id);
            playFx(box.querySelector(`[data-id="${m.id}"]`), fxOf(m));
          });
          return;
        }
        if (a === 'reply') {
          cs.reply = m.id;
          if (cs.mode && cs.mode.type === 'edit') { cs.mode = null; input.value = ''; drawMode(); }
          // Kendi mesajına cevap yazmasın: sıradaki kişiye geç
          const mk = m.from === 'me' ? 'me' : (group ? m.who : c.id);
          if (turns() && keyOf() === mk) setSide(nextKey(mk));
          drawReply(); input.focus();
          return;
        }
        if (a === 'edit') {
          cs.mode = { type: 'edit', id: m.id };
          cs.reply = null; drawReply();
          if (m.from === 'sys') cs.before = cs.side === 'sys' ? cs.before : keyOf();
          setSide(m.from === 'sys' ? 'sys' : m.from === 'me' ? 'me' : (group ? m.who : c.id));
          input.value = m.text;
          drawMode(); draw(m.id); input.focus();
          return;
        }
        if (a === 'insert') {
          if (cs.mode && cs.mode.type === 'edit') input.value = '';
          cs.mode = { type: 'insert', id: m.id };
          drawMode(); draw(m.id); input.focus();
          return;
        }
        if (a === 'flip') {
          if (group) { speakerSheet(m); return; }
          snap('Konuşan değişti');
          m.from = m.from === 'me' ? 'her' : 'me';
        }
        if (a === 'up' || a === 'down') {
          snap('Mesaj taşındı');
          const j = a === 'up' ? i - 1 : i + 1;
          const ts = list[i].ts;
          list[i].ts = list[j].ts;
          list[j].ts = ts;
          [list[i], list[j]] = [list[j], list[i]];
        }
        if (a === 'del') {
          snap('Mesaj silindi');
          list.splice(i, 1);
          if (cs.mode && cs.mode.id === m.id) { cs.mode = null; input.value = ''; drawMode(); }
          if (cs.reply === m.id) cs.reply = null;
          drawReply();
        }
        save();
        drawComposer();
        draw(a === 'del' ? null : m.id);
        refreshList();
      };
    };

    function clearAll() {
      if (!list.length || !confirm('Bu sohbetteki tüm mesajlar silinsin mi? (↶ ile geri alınabilir)')) return;
      snap('Sohbet temizlendi');
      list.splice(0, list.length);
      cs.mode = null; cs.reply = null;
      save(); drawMode(); drawReply(); drawComposer(); draw(); refreshList();
    }

    function toggleMenu() {
      const old = $('.menu');
      if (old) { old.remove(); return; }
      const menu = document.createElement('div');
      menu.className = 'menu';
      const pinKey = group ? th.id : c.id;
      menu.innerHTML = (group
        ? '<button data-a="group">👥 Grubu düzenle</button>'
        : `<button data-a="profile">👤 Profili gör</button>
          <button data-a="threads">🗂️ ${esc(c.name)} ile sohbetler</button>
          <button data-a="new">➕ Yeni sohbet</button>
          <button data-a="rename">✏️ Sohbetin adını değiştir</button>`) + `
        <button data-a="autoadd">🪄 Otomatik ekler: </button>
        <button data-a="bot">🤖 Bot modu: </button>
        <button data-a="hero">🖼️ Büyük fotoğrafı </button>
        <button data-a="search">🔍 Sohbette ara</button>
        <button data-a="keywords">🔑 Anahtar kelimeler</button>
        ${stack.length ? `<button data-a="undo">↶ Geri al · ${esc(stack[stack.length - 1].label)}</button>` : ''}
        <button data-a="pin">📌 ${isPinned(pinKey) ? 'Sabitlemeyi kaldır' : 'En üste sabitle'}</button>
        <button data-a="play">▶️ Sohbeti oynat</button>
        <button data-a="copy">📋 Metin olarak kopyala</button>
        <button data-a="clear" class="danger">🧹 Mesajları temizle</button>
        <button data-a="delete" class="danger">🗑️ ${group ? 'Grubu sil' : 'Sohbeti sil'}</button>`;
      $('.chat').appendChild(menu);
      menu.onclick = e => {
        const b = e.target.closest('button');
        const a = b && b.dataset.a;
        if (a === 'profile') location.hash = `#/p/${c.id}`;
        if (a === 'group') groupSheet(th);
        if (a === 'threads') threadSheet();
        if (a === 'new') createThread(c);
        if (a === 'rename') renameThread(th, render);
        if (a === 'search') openSearch();
        if (a === 'hero') $('#heroBtn').click();
        if (a === 'autoadd') {
          th.autoAdd = !th.autoAdd;
          save();
          if (th.autoAdd) notify('Otomatik ekler açık: karakter mesajlarına kelimeye göre ek yapılır', '🪄');
          drawComposer();
        }
        if (a === 'bot') {
          th.bot = !th.bot;
          save();
          if (th.bot) { setSide('me'); notify(`Bot modu açık: sen yaz, ${group ? 'üyeler' : c.name.split(' ')[0]} kurallardan cevap versin`, '🤖'); }
          else clearTimeout(botTimer);
          drawComposer();
        }
        if (a === 'keywords') keywordSheet({ chars: group ? th.members : [c.id], list, speakerId: sidOf, onChange: () => draw() });
        if (a === 'undo') undo();
        if (a === 'pin') togglePin(pinKey);
        if (a === 'play') play();
        if (a === 'copy') copyText(`${group ? th.title : `${c.name} · ${th.title}`}\n\n` + list.map(m => m.from === 'sys' ? `[${m.text}]` : `${nameOf(m)}: ${m.type === 'photo' ? '[📷 Fotoğraf] ' : ''}${m.text}`).join('\n'));
        if (a === 'clear') clearAll();
        if (a === 'delete' && deleteThread(th)) location.hash = group ? '#/messages' : `#/p/${c.id}`;
        menu.remove();
      };
      setTimeout(() => document.addEventListener('click', function off() { menu.remove(); document.removeEventListener('click', off); }), 0);
    }

    /* Oynat: sohbet baştan, karakter "yazıyor…" diye tek tek gelir. Ekrana dokunmak hızlandırır. */
    function play() {
      if (!list.length) { notify('Oynatmak için önce birkaç mesaj yaz', '▶️'); return; }
      clearTimeout(botTimer);
      if (!$('#searchBar').hidden) closeSearch();
      const all = list.slice();
      cs.playing = true;
      cs.mode = null;
      cs.reply = null;
      drawMode();
      drawReply();
      drawUndo();
      let i = 0, speed = 1, typingEl = null;
      const dock = ['#composer', '#chatTools', '#sideHint', '#spkRow'].map(s => $(s)).filter(Boolean);
      $('#emojiPanel').hidden = true;
      dock.forEach(el => { el.hidden = true; });
      $('#playBar').hidden = false;
      $('#playSpeed').textContent = '1x';
      box.innerHTML = '';

      const reveal = () => {
        clearTimeout(playTimer);
        if (typingEl) { typingEl.remove(); typingEl = null; }
        box.insertAdjacentHTML('beforeend', itemHtml(ctx, all[i], all[i - 1]));
        if (group && all[i].from === 'her') drawHero(all[i].who);
        playFx(box.querySelector(`[data-id="${all[i].id}"]`), fxOf(all[i]));
        playEmojiFx(box.querySelector(`[data-id="${all[i].id}"]`));
        i++;
        setStatus(`${i} / ${all.length}`);
        box.scrollTop = box.scrollHeight;
        playTimer = setTimeout(next, 650 / speed);
      };
      const next = () => {
        if (i >= all.length) return stop();
        const m = all[i];
        if (m.from === 'her' && !typingEl) {
          const ch = speaker(m);
          box.insertAdjacentHTML('beforeend', `<div class="msg her" id="typingRow">${avatar(ch, 36)}<div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div></div>`);
          typingEl = $('#typingRow');
          setStatus(group ? `${ch.name} yazıyor…` : 'yazıyor…', 'typing');
          box.scrollTop = box.scrollHeight;
          playTimer = setTimeout(reveal, Math.min(2600, 600 + (m.type === 'photo' ? 40 : m.text.length * 40)) / speed);
        } else playTimer = setTimeout(reveal, (m.from === 'me' ? 500 : 300) / speed);
      };
      function stop() {
        clearTimeout(playTimer);
        cs.playing = false;
        dock.forEach(el => { el.hidden = false; });
        $('#emojiPanel').hidden = !cs.emojiOpen;
        $('#playBar').hidden = true;
        drawComposer();
        draw();
        drawUndo();
        drawHero();
      }
      box.onpointerdown = () => { if (cs.playing && i < all.length) reveal(); };
      $('#playStop').onclick = stop;
      $('#playSpeed').onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; $('#playSpeed').textContent = speed + 'x'; };
      playTimer = setTimeout(next, 500);
    }

    applyTheme();
    drawHero();
    autoScene();
    drawComposer();
    draw();
    drawUndo();
  }

  function copyText(text) {
    if (!navigator.clipboard) { notify('Kopyalanamadı', '📋'); return; }
    navigator.clipboard.writeText(text).then(() => notify('Kopyalandı', '📋'), () => notify('Kopyalanamadı', '📋'));
  }

  // Aramada eşleşen kısımları <mark> ile işaretler (q küçük harfle gelir)
  function highlight(text, q) {
    if (!q) return esc(text);
    const low = text.toLocaleLowerCase('tr');
    let out = '', i = 0, j;
    while ((j = low.indexOf(q, i)) !== -1) {
      out += esc(text.slice(i, j)) + '<mark>' + esc(text.slice(j, j + q.length)) + '</mark>';
      i = j + q.length;
    }
    return out + esc(text.slice(i));
  }

  // 📈 / 📉 sonuçla değişen parametreler: rozetler
  const ocChips = (chs, fired) => ((fired || []).length ? `<div class="oc-fires">${fired.map(f => `<div class="oc-fire">${esc(f)}</div>`).join('')}</div>` : '') + ((chs || []).length ? `<div class="oc-chgs">${chs.map(c => `<span class="oc-chg ${c.up ? 'up' : 'down'}"><i>${c.up ? '▲' : '▼'}</i><span><small>${esc(c.who)}</small><b>${esc(c.label)}</b></span><span class="oc-ft"><s>${esc(c.from || '—')}</s>→<em>${esc(c.to)}</em></span></span>`).join('')}</div>` : '');

  // Tek mesaj (gerekirse üstünde saat damgası). ctx: { list, group, speaker(m), query }
  function itemHtml(ctx, m, prev) {
    const { list } = ctx;
    const txt = s => highlight(s || '', ctx.query);
    let html = '';
    if (!prev || m.ts - prev.ts > 10 * 60 * 1000) html += `<div class="stamp">${fmtTime(m.ts)}</div>`;
    if (m.from === 'sys' && m.scene) {
      // 📍 mekan kartı; kind 'hint' = aynı yerde sıradaki an (küçük kart)
      const sc = m.scene, p = allPlaces().find(x => x.id === sc.place) || {}, hint = sc.kind === 'hint';
      return html + `<div class="scene-card g-${esc(groupOf(p))}${hint ? ' sc-hint' : ''}${evCls(sc)}"${evStyle(sc)} data-id="${m.id}">
        <div class="sc-ic">${sc.ev ? esc(sc.emojis || '📜') : hint ? '💡' : esc(sc.icon || '📍')}</div>
        <div class="sc-body"><small>${sc.ev ? `📜 Olay${sc.ev.trim() ? ' ' + esc(sc.ev) : ''}${sc.level ? ` · 📶 ${esc(sc.level)}` : ''} · ${esc(sc.icon || '')} ${esc(sc.name || '')}` : hint ? `İpucu · ${esc(sc.icon || '')} ${esc(sc.name || '')}` : '📍 Mekan'}</small>${hint ? '' : `<b>${esc(sc.name || 'Bir yerde')}</b>`}<span>${txt(m.text)}</span>${(sc.onChanges || []).length ? `<div class="evb-on sc-on"><small>⚡ Olunca</small>${ocChips(sc.onChanges)}</div>` : ''}${sc.outcome ? `
          <div class="sc-out${sc.outcome.blocked ? ' blocked' : ''}"><div class="sc-out-h"><span class="ocb-dice">${sc.outcome.blocked ? '🛡️' : '🎲'}</span>${sc.outcome.blocked ? 'Olmadı' : sc.outcome.fallback ? 'Sonuç · ⭐ varsayılan' : 'Sonuç'}${sc.outcome.pct < 100 && !sc.outcome.fallback ? ` <em>%${+sc.outcome.pct}</em>` : ''}</div>${sc.outcome.fallback ? `<div class="oc-miss">🛡️ <s>${esc(sc.outcome.fallback.text || 'Sonuç')}</s> <small>· 🔒 ${esc(sc.outcome.fallback.why)}</small></div>` : ''}${sc.outcome.text ? `<p>${txt(sc.outcome.text)}</p>` : ''}${sc.outcome.blocked ? `<div class="oc-why">🔒 Şart tutmadı: ${esc(sc.outcome.blocked)}</div>` : ''}${ocChips(sc.outcome.changes, sc.outcome.fired)}</div>` : ''}</div></div>`;
    }
    if (m.from === 'sys') return html + `<div class="sys" data-id="${m.id}">${txt(m.text)}</div>`;

    const cont = prev && prev.from === m.from && (prev.who || '') === (m.who || '') && !html;
    const o = m.reply && list.find(x => x.id === m.reply);
    const oName = o ? (o.from === 'me' ? userName() : o.from === 'her' ? ctx.speaker(o).name : 'Not') : '';
    const quote = m.reply ? `<div class="quote" data-q="${esc(m.reply)}"><b>${esc(oName)}</b><span>${o ? esc(preview(o)) : 'Silinmiş mesaj'}</span></div>` : '';
    const body = m.type === 'photo'
      ? `<img class="ph" src="${esc(m.src)}" alt="">${m.text ? `<div class="cap">${txt(m.text)}</div>` : ''}`
      : txt(m.text);
    const react = m.react ? `<span class="react">${m.react}</span>` : '';
    // Efekt: baloncuk efekti sınıf olarak, ekran efekti dokununca yeniden oynayan bir rozet olarak
    const fx = effectOf(m, ctx.sid(m));
    const fxTag = fx && isScreenFx(fx) ? `<button type="button" class="fx-tag" aria-label="Efekti oynat">${fxById(fx).icon}</button>` : '';
    // 📜 olay mesajı ve 🎲 sonuç mesajı kendi kart görünümüyle
    const ev = m.evc, oc = m.oc;
    const bubble = ev
      ? `<div class="bubble ev-bubble"${isHex(ev.color) ? ` style="--evc:${esc(ev.color)}"` : ''}><div class="evb-h"><span class="evb-ic">${esc(ev.emojis || '📜')}</span><span class="evb-ti"><small>📜 Olay${ev.sub ? ` · 🪜 ${esc(ev.sub)}` : ''}${ev.level ? ` · 📶 ${esc(ev.level)}` : ''}</small><b>${esc(ev.title || '')}</b></span></div><div class="evb-t">${body}</div>${(ev.changes || []).length ? `<div class="evb-on"><small>⚡ Olunca</small>${ocChips(ev.changes)}</div>` : ''}${react}${fxTag}</div>`
      : oc
        ? `<div class="bubble oc-bubble${oc.blocked ? ' blocked' : ''}"><div class="ocb-h"><span class="ocb-dice">${oc.blocked ? '🛡️' : '🎲'}</span><small>${oc.blocked ? 'Olmadı' : oc.fallback ? 'Sonuç · ⭐ varsayılan' : 'Sonuç'}${oc.pct < 100 && !oc.fallback ? ` · %${+oc.pct}` : ''}${oc.ev ? ` · ${esc(oc.ev)}` : ''}</small></div>${oc.fallback ? `<div class="oc-miss">🛡️ <s>${esc(oc.fallback.text || 'Sonuç')}</s> <small>· 🔒 ${esc(oc.fallback.why)}</small></div>` : ''}${m.text && m.text !== '🎲 Sonuç' ? `<div class="ocb-t">${body}</div>` : ''}${oc.blocked ? `<div class="oc-why">🔒 Şart tutmadı: ${esc(oc.blocked)}</div>` : ''}${ocChips(oc.changes, oc.fired)}${react}${fxTag}</div>`
        : `<div class="bubble${m.type === 'photo' ? ' photo' : ''}${quote ? ' has-quote' : ''}">${quote}${body}${react}${fxTag}</div>`;
    const efx = m.effect === 'none' ? null : emojiFxOf(m.text);
    const cls = `${m.react ? ' reacted' : ''}${ctx.query && (m.text || '').toLocaleLowerCase('tr').includes(ctx.query) ? ' hit' : ''}${fx && !isScreenFx(fx) ? ` fx fx-${fx}` : ''}${efx ? ` efx efx-${efx}` : ''}`;
    if (m.from === 'her') {
      const ch = ctx.speaker(m);
      if (!ctx.group) return html + `<div class="msg her ${cont ? 'cont' : ''}${cls}" data-id="${m.id}">${avatar(ch, 36)}${bubble}</div>`;
      // Grup: ilk mesajda isim, baloncuk rengi için üyenin rengi
      const mc = ctx.memberColor && ctx.memberColor(ch);
      const name = cont ? '' : `<span class="who-name" style="color:${esc((mc || ch.colors)[0])}">${esc(ch.name)}</span>`;
      const bg = mc ? `linear-gradient(135deg,${mc[0]},${mc[1]})` : grad(ch);
      return html + `<div class="msg her ${cont ? 'cont' : ''}${mc ? ' mc' : ''}${cls}" data-id="${m.id}" style="--who-bg:${esc(bg)}">${avatar(ch, 36)}<div class="col">${name}${bubble}</div></div>`;
    }
    return html + `<div class="msg me${cls}" data-id="${m.id}"><span class="seen">${ICON.check}</span>${bubble}</div>`;
  }

  function drawMessages(ctx, cs, target) {
    const box = $('#msgs');
    if (!box) return;
    const msgs = ctx.list;
    box.innerHTML = msgs.length
      ? msgs.map((m, i) => itemHtml(ctx, m, msgs[i - 1])).join('')
      : `<div class="sys">${ctx.group ? 'Grupta' : `${esc(ctx.speaker({ from: 'her' }).name)} ile`} hikayeni yazmaya başla 💌<br>Alttaki avatara dokunarak kimin yazdığını değiştirebilirsin.</div>`;
    if (cs && cs.mode) { const t = box.querySelector(`[data-id="${cs.mode.id}"]`); if (t) t.classList.add('target'); }
    const t = target && box.querySelector(`[data-id="${target}"]`);
    if (t) t.scrollIntoView({ block: 'center' });
    else if (!ctx.query) {
      box.scrollTop = box.scrollHeight;
      // fotoğraflar sonradan yüklenip yüksekliği değiştirince yine en alta in
      box.querySelectorAll('img.ph').forEach(img => img.addEventListener('load', () => { box.scrollTop = box.scrollHeight; }, { once: true }));
    }
  }

  /* ---------- Karakter oluştur / düzenle ---------- */
  const MAX_ALBUM = 8;
  /* 🧩 Karakterlerin ek özellik alanları (S().charFields, sistem dosyasındakiler de gelir):
   * { id, icon, label, type: number | range | toggle | choice | multi | text, options: [], min, max, unit }; değerler c.fields[id] */
  const CF_TYPES = [['number', '🔢 Sayı'], ['range', '🎚️ Kaydırıcı'], ['toggle', '🔘 Aç / kapa'], ['choice', '🔽 Tek seçim'], ['multi', '☑️ Çoklu seçim'], ['text', '✏️ Yazı']];
  // 🔘 hazır aç/kapa durumlar: bir kez eklenir (silersen geri gelmez); sonuçlar → Evet / → Hayır yapabilir
  // v: hangi sürümde eklendi (yeni hazır durumlar eski kayıtlara da bir kez eklenir)
  const CF_SEED = [{ id: 'hamile', icon: '🤰', label: 'Hamile', type: 'toggle', v: 1 }, { id: 'bakire', icon: '🌸', label: 'Bakire', type: 'toggle', v: 1 },
    { id: 'korunma', icon: '🛡️', label: 'Korunma', type: 'toggle', v: 2 }];
  const CF_SEED_V = 2;
  const charFields = () => {
    const s = S();
    s.charFields = s.charFields || [];
    if ((s.cfSeeded || 0) < CF_SEED_V) {
      const from = s.cfSeeded || 0;
      s.cfSeeded = CF_SEED_V;
      CF_SEED.filter(f => f.v > from).forEach(({ v, ...f }) => { if (!s.charFields.some(x => x.id === f.id || String(x.label).toLocaleLowerCase('tr') === f.label.toLocaleLowerCase('tr'))) s.charFields.push(f); });
    }
    return s.charFields;
  };
  function cfInput(f, v) {
    const head = `<span class="cf-l">${esc(f.icon || '🧩')} ${esc(f.label)}</span>`, id = esc(f.id), opts = f.options || [];
    if (f.type === 'number') return `<label class="cf">${head}<span class="cf-in"><input type="number" data-cf="${id}"${f.min !== '' && f.min != null ? ` min="${+f.min}"` : ''}${f.max !== '' && f.max != null ? ` max="${+f.max}"` : ''} value="${v == null ? '' : esc(v)}">${f.unit ? `<small>${esc(f.unit)}</small>` : ''}</span></label>`;
    if (f.type === 'range') { const lo = f.min === '' || f.min == null ? 0 : +f.min, hi = f.max === '' || f.max == null ? 10 : +f.max, val = v == null || v === '' ? lo : v;
      return `<label class="cf">${head}<span class="cf-in"><input type="range" data-cf="${id}" min="${lo}" max="${hi}" value="${esc(val)}"><b data-cfv="${id}">${esc(val)}</b>${f.unit ? `<small>${esc(f.unit)}</small>` : ''}</span></label>`; }
    if (f.type === 'toggle') return `<div class="cf">${head}<button type="button" class="cf-tog${v ? ' on' : ''}" data-cftog="${id}">${v ? 'Evet' : 'Hayır'}</button></div>`;
    if (f.type === 'choice' || f.type === 'multi') {
      const on = x => f.type === 'multi' ? Array.isArray(v) && v.includes(x) : v === x;
      return `<div class="cf cf-wide">${head}<div class="presets">${opts.map(x => `<button type="button" class="${on(x) ? 'on' : ''}" data-${f.type === 'multi' ? 'cfmu' : 'cfch'}="${id}" data-v="${esc(x)}">${esc(x)}</button>`).join('') || '<small>Seçenek yok (⚙️)</small>'}</div></div>`;
    }
    return `<label class="cf cf-wide">${head}<input type="text" data-cf="${id}" maxlength="120" value="${esc(v || '')}"></label>`;
  }
  // profilde görünen hali (boşsa null)
  function cfValue(f, v) {
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return f.type === 'toggle' && v === false ? null : null;
    if (f.type === 'toggle') return v ? '✅ Evet' : null;
    if (Array.isArray(v)) return v.join(', ');
    if (f.type === 'range') return `${v}${f.max !== '' && f.max != null ? ` / ${f.max}` : ''}${f.unit ? ' ' + f.unit : ''}`;
    return `${v}${f.unit ? ' ' + f.unit : ''}`;
  }
  function charFieldSheet(done) {
    const row = f => `<div class="cfm-row" data-fid="${esc(f.id)}">
      <div class="cfm-top"><span class="cat-mv"><button type="button" data-fup aria-label="Yukarı">▲</button><button type="button" data-fdown aria-label="Aşağı">▼</button></span>
        <input class="cfm-ic" maxlength="4" value="${esc(f.icon || '')}" placeholder="🧩"><input class="cfm-lb" maxlength="30" value="${esc(f.label)}" placeholder="Alan adı">
        <button type="button" class="icon-btn" data-fdel aria-label="Sil">🗑️</button></div>
      <div class="cfm-opts"><select class="cfm-ty">${CF_TYPES.map(([k, l]) => `<option value="${k}"${f.type === k ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <input class="cfm-op" placeholder="Seçenekler: virgülle (ör. Mavi, Yeşil, Kahve)" value="${esc((f.options || []).join(', '))}">
        <input class="cfm-mn" type="number" placeholder="en az" value="${f.min == null ? '' : esc(f.min)}"><input class="cfm-mx" type="number" placeholder="en çok" value="${f.max == null ? '' : esc(f.max)}">
        <input class="cfm-un" maxlength="10" placeholder="birim (cm, kg…)" value="${esc(f.unit || '')}"></div></div>`;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>🧩 Karakter ek özellikleri</h3>
      <div class="about" style="margin-bottom:10px">Bütün karakterlerde görünecek alanlar. Türü seç: sayı, kaydırıcı (en az / en çok), aç-kapa, tek ya da çoklu seçim (seçenekleri virgülle yaz), yazı.</div>
      <div class="cfm-list">${charFields().map(row).join('')}</div>
      <div class="pl-own" style="margin-top:10px"><input id="cfNewIc" maxlength="4" placeholder="🧩"><input id="cfNewLb" maxlength="30" placeholder="Yeni alan (ör. Boy)"><button type="button" class="btn ghost sm" id="cfAdd">Ekle</button></div>
      <button class="btn primary block" id="cfSave" style="margin-top:12px">Kaydet</button>`, 'light');
    const el = sh.el, list = el.querySelector('.cfm-list');
    const sync = r => { const ty = r.querySelector('.cfm-ty').value; r.dataset.type = ty; };
    el.querySelectorAll('.cfm-row').forEach(sync);
    el.onchange = e => { const r = e.target.closest('.cfm-row'); if (r) sync(r); };
    topSave(sh, () => el.querySelector('#cfSave').click());
    el.onclick = e => {
      const r = e.target.closest('.cfm-row'), ds = (e.target.closest('button') || {}).dataset || {};
      if (r && 'fup' in ds && r.previousElementSibling) return list.insertBefore(r, r.previousElementSibling);
      if (r && 'fdown' in ds && r.nextElementSibling) return list.insertBefore(r.nextElementSibling, r);
      if (r && 'fdel' in ds) { if (confirm('Bu alan silinsin mi? (Karakterlerdeki değerleri de gizlenir)')) r.remove(); return; }
      if (e.target.closest('#cfAdd')) {
        const label = el.querySelector('#cfNewLb').value.trim();
        if (!label) return;
        list.insertAdjacentHTML('beforeend', row({ id: 'f:' + Store.uid(), icon: el.querySelector('#cfNewIc').value.trim(), label, type: 'number', options: [] }));
        sync(list.lastElementChild);
        el.querySelector('#cfNewLb').value = ''; el.querySelector('#cfNewIc').value = '';
        return;
      }
      if (!e.target.closest('#cfSave')) return;
      const num = v => v === '' ? '' : +v;
      S().charFields = [...el.querySelectorAll('.cfm-row')].map(r => ({
        id: r.dataset.fid, icon: r.querySelector('.cfm-ic').value.trim(), label: r.querySelector('.cfm-lb').value.trim() || 'Alan',
        type: r.querySelector('.cfm-ty').value, options: r.querySelector('.cfm-op').value.split(',').map(s => s.trim()).filter(Boolean),
        min: num(r.querySelector('.cfm-mn').value), max: num(r.querySelector('.cfm-mx').value), unit: r.querySelector('.cfm-un').value.trim()
      }));
      save(); sh.close(); notify('Alanlar kaydedildi', '🧩'); if (done) done();
    };
  }

  const blankChar = () => ({
    id: null, set: '', name: '', gender: '♀', age: '', city: '', job: '', zodiac: '', bio: '', traits: [], tags: [], about: '',
    photo: '', album: [], colors: T.colors[chars().length % T.colors.length], created: 0
  });

  /* Hazır karakterler: characters/<set>/ klasörlerindeki fotoğraf setleri (js/data/photos.js) */
  const SETS = Stories.PHOTO_SETS || [];
  const P = Stories.Pools;
  const photoUrl = (s, file) => `characters/${encodeURIComponent(s.id)}/${s.dir}${encodeURIComponent(file)}`;
  const setName = s => { const n = s.id.replace(/[_\-\s]*\d+$/, '').replace(/[_-]+/g, ' ').trim(); return n.charAt(0).toLocaleUpperCase('tr') + n.slice(1); };
  const usedSets = d => new Set(chars().filter(c => c.set && c.id !== d.id).map(c => c.set));

  const pick = a => a[Math.floor(Math.random() * a.length)];
  const sample = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
  function applySet(d, s) {
    const prev = SETS.find(x => x.id === d.set);
    // İsim boşsa ya da önceki setten geldiyse yeni setin adını al
    if (!d.name || (prev && d.name === setName(prev))) d.name = setName(s);
    d.set = s.id;
    d.mod = 'amor';
    d.photo = photoUrl(s, s.profile);
    d.album = [s.profile, ...s.photos].slice(0, MAX_ALBUM).map(f => photoUrl(s, f));
  }

  /* 🖼️ Galeriden fotoğraf seç (js/gallery.js): albüm sekmeleri + fotoğraflar. multi: birden çok seçim (max adede kadar) */
  const GAL = Stories.Gallery;
  function galleryPicker(opts, cb) {
    if (!GAL) return;
    const sel = [];
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>🖼️ ${esc(opts.title || GAL.name)}</h3>
      <div class="gal-body"><div class="empty" style="padding:24px">Galeri yükleniyor…</div></div>`, 'light');
    const body = sh.el.querySelector('.gal-body');
    const draw = g => {
      const albums = g.albums;
      if (!albums.length) { body.innerHTML = '<div class="empty" style="padding:24px">Galeride fotoğraf yok</div>'; return; }
      const cur = albums.find(a => a.name === ui.galAlbum) || albums[0];
      ui.galAlbum = cur.name;
      body.innerHTML = `
        <div class="gal-albums">${albums.map(a => `<button type="button" class="gal-alb${a === cur ? ' on' : ''}" data-alb="${esc(a.name)}">
          <img src="${esc(a.cover)}" alt="" loading="lazy"><span>${esc(a.name)}</span><small>${a.photos.length}</small></button>`).join('')}</div>
        ${cur.category || cur.tags.length ? `<div class="gal-meta">${esc([cur.category, ...cur.tags.map(t => '#' + t)].filter(Boolean).join(' · '))}</div>` : ''}
        <div class="pick-photos gal-grid">${cur.photos.map(u => `<button type="button" data-gu="${esc(u)}" class="${sel.includes(u) ? 'on' : ''}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div>
        <div class="gal-foot">
          <button type="button" class="btn ghost sm" id="galRef">🔄 Yenile</button>
          ${opts.multi ? `<button type="button" class="btn primary sm" id="galAdd"${sel.length ? '' : ' disabled'}>Ekle${sel.length ? ` (${sel.length})` : ''}</button>` : ''}
          <a class="btn ghost sm" href="${esc(GAL.site)}" target="_blank" rel="noopener">Galeriyi aç ↗</a>
        </div>`;
    };
    const fail = e => { body.innerHTML = `<div class="empty" style="padding:24px">⚠️ ${esc(e.message || 'Galeri okunamadı')}<br><button type="button" class="btn ghost sm" id="galRef" style="margin-top:10px">🔄 Tekrar dene</button></div>`; };
    GAL.load().then(draw, fail);
    sh.el.onclick = e => {
      const alb = e.target.closest('[data-alb]');
      if (alb) { ui.galAlbum = alb.dataset.alb; draw(GAL.cached()); return; }
      if (e.target.closest('#galRef')) { body.innerHTML = '<div class="empty" style="padding:24px">Yenileniyor…</div>'; GAL.load(true).then(draw, fail); return; }
      if (e.target.closest('#galAdd')) { sh.close(); cb(sel); return; }
      const ph = e.target.closest('[data-gu]');
      if (!ph) return;
      const u = ph.dataset.gu;
      if (!opts.multi) { sh.close(); cb([u]); return; }
      const i = sel.indexOf(u);
      if (i >= 0) sel.splice(i, 1);
      else if (!opts.max || sel.length < opts.max) sel.push(u);
      else { notify(`En fazla ${opts.max} fotoğraf`, '🖼️'); return; }
      draw(GAL.cached());
    };
  }

  /* Modlar (js/data/mods.js): her modun hazır karakter listesi { id, name, thumb, apply(d) } */
  const MODS = Stories.MODS || [];
  const modOf = id => MODS.find(m => m.id === id) || MODS[0];
  const modIcon = m => /^mods\//.test(m.icon) ? `<img class="mi" src="${esc(m.icon)}" alt="">` : `<span class="mi">${m.icon}</span>`;

  // Mod karakteri: profil, kişilik, albüm ve sohbet arka planı hazır gelir
  function applyPreset(d, m, p) {
    Object.assign(d, {
      set: `${m.id}:${p.key}`, mod: m.id, name: p.name, gender: p.gender, age: p.age, city: p.city, job: p.job,
      zodiac: p.zodiac, bio: p.bio, traits: [...p.traits], about: p.about, photo: p.photo,
      album: p.album.slice(0, MAX_ALBUM), colors: p.colors
    });
    if (p.bg) d.theme = { bg: 'img', img: p.bg, bubble: 'amor' };
  }

  // 🖼️ Lara Gallery albümü (js/gallery.js) bir karakter seti olur: kapak profil, ilk fotoğraflar albüm
  function applyGallery(d, a) {
    if (!d.name || (d.set || '').startsWith('lara:')) d.name = a.name;
    d.set = `lara:${a.name}`;
    d.mod = 'lara';
    d.photo = a.cover;
    d.album = [a.cover, ...a.photos.filter(p => p !== a.cover)].slice(0, MAX_ALBUM);
  }

  function presets(modId) {
    if (modId === 'amor') return SETS.map(s => ({ id: s.id, name: setName(s), thumb: photoUrl(s, s.profile), apply: d => applySet(d, s) }));
    const m = modOf(modId);
    if (m.gallery) {
      const g = GAL && GAL.cached();
      return g ? g.albums.map(a => ({ id: `lara:${a.name}`, name: a.name, thumb: a.cover, apply: d => applyGallery(d, a) })) : [];
    }
    return (m.characters || []).map(p => ({ id: `${m.id}:${p.key}`, name: p.name, thumb: p.photo || p.album[0], colors: p.colors, apply: d => applyPreset(d, m, p) }));
  }

  /* İsim havuzu (js/data/pools.js ← Amor'un havuzu): ismin dönemi yaşı, yaş mesleği belirler */
  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const eraOf = name => Object.keys(P.eras || {}).find(k => P.eras[k].includes(name));
  function randName(gender) {
    if (gender === '♀' && P.eras) return pick(P.eras[pick(Object.keys(P.eras))]); // önce dönem, sonra isim (dönemler eşit gelsin)
    return pick(P.names[gender] || P.names['♀']);
  }
  function randAge(name) {
    const r = P.eraAge[eraOf(name)] || P.age;
    return String(randInt(r[0], r[1]));
  }
  function randJob(age) {
    if (!P.jobObjs.length) return pick(P.jobs);
    const a = +age || 25;
    const ok = P.jobObjs.filter(j => (!j.min || a >= j.min) && (!j.max || a <= j.max));
    return pick(ok.length ? ok : P.jobObjs).title;
  }
  // 🎀 Süslü isim (Amor'un ekran adları gibi): BÜYÜK, küçük, uzatma, parantez, takma ad + emoji/sembol süsü
  function fancyName(base) {
    const up = s => s.toLocaleUpperCase('tr'), low = s => s.toLocaleLowerCase('tr');
    const total = P.styles.reduce((a, s) => a + s[1], 0);
    let r = Math.random() * total;
    const style = (P.styles.find(s => (r -= s[1]) < 0) || [''])[0];
    let n = base;
    if (style === 'upper') n = up(base);
    else if (style === 'lower') n = low(base);
    else if (style === 'stretch') n = base + base.slice(-1).repeat(randInt(1, 2));
    else if (style === 'paren') { const b = pick(P.brackets); n = b[0] + up(base) + b[1]; }
    else if (style === 'az') n = base.replace(/e/g, 'ə') + base.slice(-1);
    else if (style === 'nick' && P.nicknames.length) n = pick(P.nicknames).replace(/\{name\}/g, base).replace(/\{low\}/g, low(base).replace(/\s+/g, ''));
    if (P.decos.length && (n === base || Math.random() < 0.5)) {
      const [a, b, tight] = pick(P.decos);
      n = tight ? a + n + b : [a, n, b].filter(Boolean).join(' ');
    }
    return n;
  }

  // 🎲: tek alanı ya da ('all') hepsini rastgele belirler
  /* 📏 Oluştur kuralları: { id, if: özellik değeri (ör. 'Experience: Virgo') ya da 'f:<aç/kapa alan>', not: [olamayacak özellik değerleri] }
   * Oluştur → 📏 Kurallar'dan düzenlenir (MO().crRules; yoksa sistem dosyasındaki) */
  const crRules = () => (S().monia || {}).crRules || (Stories.SYSTEM || {}).crRules || [];
  const crHas = (d, x) => String(x).startsWith('f:') ? !!(d.fields || {})[x.slice(2)] : (d.traits || []).includes(x);
  const crLabel = x => { if (!String(x).startsWith('f:')) return x; const f = charFields().find(y => y.id === x.slice(2)); return `🔘 ${f ? f.label : x.slice(2)}`; };
  // şu an olamayacak özellikler: Map(değer → engelleyen şart)
  function crBlocked(d) {
    const m = new Map();
    crRules().forEach(r => { if (r.if && crHas(d, r.if)) (r.not || []).forEach(v => { if (!m.has(v)) m.set(v, r.if); }); });
    return m;
  }
  // kurala aykırı özellikleri çıkarır (repick: tek seçimli grupta yerine izinli biri gelir); çıkanları döndürür
  function crFix(d, repick) {
    const bl = crBlocked(d), gone = (d.traits || []).filter(t => bl.has(t));
    if (!gone.length) return [];
    d.traits = d.traits.filter(t => !bl.has(t));
    if (repick) gone.forEach(t => { const g = T.groups.find(x => x.single && x.values.includes(t)), ok = g ? g.values.filter(v => !bl.has(v)) : []; if (ok.length) d.traits.push(pick(ok)); });
    return gone;
  }
  // 📏 Oluştur kuralları paneli (#/kurallar): tüm karakterler için geçerli. Taslak: ui.crDraft (💾 Kaydet'e kadar)
  function renderRulesPage() {
    const rules = ui.crDraft || (ui.crDraft = JSON.parse(JSON.stringify(crRules())));
    if (ui.prevPage && !ui.prevPage.startsWith('#/kurallar')) ui.crBack = ui.prevPage;
    const opts = (cur, skip) => T.groups.filter(g => g.items.length).map(g => `<optgroup label="${esc(g.label)}">${g.values.filter(v => !(skip || []).includes(v)).map(v => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(g.single ? g.items[g.values.indexOf(v)] : v)}</option>`).join('')}</optgroup>`).join('');
    const toggles = cur => { const fs = charFields().filter(f => f.type === 'toggle'); return fs.length ? `<optgroup label="🔘 Durumlar (açıksa)">${fs.map(f => `<option value="f:${esc(f.id)}"${'f:' + f.id === cur ? ' selected' : ''}>🔘 ${esc(f.label)}</option>`).join('')}</optgroup>` : ''; };
    // kurala şu an uymayan karakterler
    const broken = r => chars().filter(c => crHas(c, r.if) && (r.not || []).some(v => (c.traits || []).includes(v)));
    const draw = () => { const y = window.scrollY; renderRulesPage(); window.scrollTo(0, y); };
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('kurallar', '📏', 'Oluştur kuralları', [`${rules.length} kural`, 'tüm karakterler için'], '', { back: ui.crBack || '#/me' })}
        <div class="mo-top sticky pg-bar"><button type="button" class="btn primary sm" id="crSave">💾 Kaydet</button></div>
        <div class="about card">Tüm karakterler için geçerli: bir özellik seçiliyse bazı özellikler olamaz (ör. <b>Experience: Virgo</b> → 🚫 <b>Pussy Size: Loose</b>). Oluştur'da seçilemez, 🎲 rastgele de seçmez.</div>
        <div class="cr-grid">${rules.map((r, i) => { const bad = broken(r); return `<div class="card cr-row" data-ri="${i}">
          <div class="cr-if"><span class="cr-n">${i + 1}</span><small>Eğer</small><select data-crif>${toggles(r.if)}${opts(r.if)}</select><button type="button" class="icon-btn" data-crrm aria-label="Sil">🗑️</button></div>
          <div class="cr-not"><small>🚫 olamaz</small>${(r.not || []).map((v, j) => `<button type="button" class="chip mo-pick on" data-crnrm="${j}">${esc(v)} ✕</button>`).join('')}
            <select data-crnot><option value="">➕ ekle…</option>${opts('', [r.if, ...(r.not || [])])}</select></div>
          ${bad.length ? `<div class="cr-bad">⚠️ Uymayan: ${bad.map(c => esc(c.name)).join(', ')}</div>` : ''}</div>`; }).join('')
          || '<div class="empty"><span class="big">📏</span>Henüz kural yok.<br>➕ Kural ekle ile başla.</div>'}</div>
        <button type="button" class="btn ghost block" id="crAdd" style="margin-top:10px">➕ Kural ekle</button>
      </div>`;
    view.onchange = e => {
      const row = e.target.closest('[data-ri]');
      if (!row) return;
      const r = rules[+row.dataset.ri];
      if ('crif' in e.target.dataset) r.if = e.target.value;
      if ('crnot' in e.target.dataset && e.target.value) r.not = [...new Set([...(r.not || []), e.target.value])];
      draw();
    };
    view.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const row = b.closest('[data-ri]'), r = row && rules[+row.dataset.ri];
      if (b.id === 'crAdd') { rules.push({ id: Store.uid(), if: T.all.find(v => v.endsWith(': ' + VIRGIN_ITEM)) || T.all[0] || '', not: [] }); return draw(); }
      if ('crrm' in b.dataset) { rules.splice(+row.dataset.ri, 1); return draw(); }
      if (b.dataset.crnrm != null) { r.not.splice(+b.dataset.crnrm, 1); return draw(); }
      if (b.id === 'crSave') {
        MO().crRules = rules.filter(x => x.if && (x.not || []).length);
        ui.crDraft = null;
        save(); notify('Kurallar kaydedildi', '📏'); draw();
      }
    };
    view.querySelector('.pg-back').onclick = () => { ui.crDraft = null; };
  }

  function randomize(d, k) {
    const mod = ui.createMod || 'amor';
    if ((k === 'all' || k === 'set') && mod !== 'amor') {
      // Mod karakterleri tam profil olarak gelir; sadece hangisi olacağı rastgele
      const list = presets(mod);
      const used = usedSets(d);
      const free = list.filter(p => !used.has(p.id) && p.id !== d.set);
      if (list.length) pick(free.length ? free : list).apply(d);
      return;
    }
    if (k === 'all') { delete d.theme; d.traits = []; d.about = ''; }
    if (k === 'all' || k === 'set') {
      if (SETS.length) {
        const used = usedSets(d);
        const free = SETS.filter(s => !used.has(s.id) && s.id !== d.set);
        if (k === 'all') d.name = '';
        applySet(d, pick(free.length ? free : SETS));
      }
      if (k === 'set') return;
      // Amor gibi: fotoğraf seti + isim havuzundan isim
      d.name = randName(d.gender);
    }
    if (k === 'name') d.name = randName(d.gender);
    if (k === 'all' || k === 'age') d.age = randAge(d.name);
    if (k === 'all' || k === 'place') { d.city = pick(P.cities); d.job = randJob(d.age); }
    if (k === 'all' || k === 'zodiac') d.zodiac = pick(T.zodiacs);
    if (k === 'all' || k === 'bio') d.bio = pick(P.bios);
    T.groups.forEach(g => {
      if (k !== 'all' && k !== g.id) return;
      const n = g.single ? 1 : g.id === 'personality' ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
      d.traits = d.traits.filter(t => !g.values.includes(t));
      // 📏 kurala göre olamayacaklar seçilmez
      const bl = crBlocked(d), ok = g.values.filter(v => !bl.has(v));
      d.traits = d.traits.concat(sample(ok.length ? ok : g.values, n));
    });
    if (d.traits) crFix(d, true);
    if (k === 'all' || k === 'color') d.colors = pick(T.colors);
    // ❤️/💔 sadece 'event' etiketli kategorilerden; aynı olay iki listede olmaz
    if (k === 'all' || k === 'feel') {
      const pool = sample(feelPool().map(e => e.id), 5 + Math.floor(Math.random() * 2));
      const n = 2 + Math.floor(Math.random() * 2);
      d.likes = pool.slice(0, n);
      d.dislikes = pool.slice(n);
    }
  }

  /* Oluştur ekranı: üstte bölümlere atlama çubuğu (data-nav), özellik kartları başlığa dokununca katlanır (data-fold;
   * katlıyken seçilenler başlıkta görünür, bu tarayıcıda hatırlanır) */
  const FOLD_KEY = 'amor-stories:create-fold';
  const createFolds = v => { try { if (v) localStorage.setItem(FOLD_KEY, JSON.stringify(v)); return JSON.parse(localStorage.getItem(FOLD_KEY) || '{}'); } catch (e) { return v || {}; } };
  function polishCreate() {
    const nav = $('#crNav');
    if (!nav) return;
    const secs = [...view.querySelectorAll('[data-nav]')], head = view.querySelector('.create .editor-head');
    nav.style.top = head.offsetHeight + 'px';
    nav.innerHTML = secs.map((s, i) => `<button type="button" data-go="${i}">${esc(s.dataset.nav)}</button>`).join('');
    nav.onclick = e => {
      const b = e.target.closest('[data-go]');
      if (!b) return;
      const s = secs[+b.dataset.go];
      if (s.classList.contains('folded')) s.classList.remove('folded');
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - head.offsetHeight - nav.offsetHeight - 8, behavior: 'smooth' });
    };
    // görünen bölüm çubukta seçili
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        const i = secs.indexOf(en.target);
        nav.querySelectorAll('[data-go]').forEach(b => b.classList.toggle('on', +b.dataset.go === i));
        const on = nav.querySelector('.on');
        if (on) nav.scrollTo({ left: on.offsetLeft - nav.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
      }), { rootMargin: '-35% 0px -60% 0px' });
      secs.forEach(s => io.observe(s));
    }
    const folds = createFolds();
    view.querySelectorAll('.cr-fold').forEach(card => {
      const head = card.querySelector('.row2 > span');
      const sum = () => {
        let el = head.querySelector('.fold-sum');
        if (!el) { el = document.createElement('em'); el.className = 'fold-sum'; head.appendChild(el); }
        const on = [...card.querySelectorAll('.presets button.on')].map(b => b.textContent.replace(' ✕', '').trim());
        el.textContent = on.length ? on.slice(0, 3).join(', ') + (on.length > 3 ? ` +${on.length - 3}` : '') : '';
      };
      card.classList.toggle('folded', !!folds[card.dataset.fold]);
      sum();
      head.onclick = () => {
        card.classList.toggle('folded');
        const f = createFolds();
        f[card.dataset.fold] = card.classList.contains('folded');
        createFolds(f);
      };
      card.addEventListener('click', e => { if (e.target.closest('.presets')) setTimeout(sum); });
    });
  }

  // 📚 Hazır karakterlerin fotoğraf setleri: ayrı panelde albüm gibi ızgara; dokununca o set uygulanır
  function setAlbumSheet(mod, list, used, curId, pick) {
    const card = p => `<button type="button" class="al-card${p.id === curId ? ' on' : ''}${used.has(p.id) ? ' used' : ''}" data-alset="${esc(p.id)}" data-q="${esc((p.name || '').toLocaleLowerCase('tr'))}">
      <span class="al-img">${p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy">` : `<span class="set-ph" style="background:${esc(grad(p))}">${initial(p.name)}</span>`}
        ${used.has(p.id) ? '<em class="al-badge">kullanımda</em>' : ''}${p.id === curId ? '<em class="al-badge on">✓ seçili</em>' : ''}</span>
      <b>${esc(p.name)}</b></button>`;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <div class="al-head"><h3>📚 ${esc(mod.name)} albümü <small>${list.length} set</small></h3></div>
      <label class="mo-search al-search"><span>🔍</span><input type="search" id="alQ" placeholder="İsim ara…"></label>
      <div class="al-grid">${list.map(card).join('')}</div>`, 'light album-sheet');
    const el = sh.el;
    el.querySelector('#alQ').oninput = e => {
      const q = e.target.value.toLocaleLowerCase('tr').trim();
      el.querySelectorAll('[data-alset]').forEach(b => { b.hidden = !!q && !b.dataset.q.includes(q); });
    };
    el.onclick = e => {
      const b = e.target.closest('[data-alset]');
      if (!b) return;
      b.classList.add('picked');
      setTimeout(() => { sh.close(); pick(list.find(p => p.id === b.dataset.alset)); }, 160);
    };
    const on = el.querySelector('.al-card.on');
    if (on) setTimeout(() => on.scrollIntoView({ block: 'center' }), 60);
  }

  function renderCreate(id) {
    const key = id || 'new';
    if (!ui.create || ui.create.key !== key) {
      const orig = id && byId(id);
      const d = orig ? JSON.parse(JSON.stringify(orig)) : blankChar();
      if (orig) ui.createMod = orig.mod || 'amor';
      else randomize(d, 'all'); // Amor gibi: yeni karakter hazır bir öneriyle başlar
      ui.create = { key, d };
    }
    const d = ui.create.d;
    const mod = modOf(ui.createMod || 'amor');
    const list = presets(mod.id);
    const back = id ? `#/p/${id}` : '#/home';
    const preset = (val, on, attr) => `<button type="button" ${attr}="${esc(val)}" class="${on ? 'on' : ''}">${esc(val)}</button>`;
    const dice = k => `<button type="button" class="dice-btn" data-dice="${k}" aria-label="Rastgele">🎲</button>`;
    const custom = d.traits.filter(t => !T.all.includes(t));
    const used = usedSets(d);
    const crBl = crBlocked(d);

    view.innerHTML = `
      <div class="create">
        ${pageHero('create', id ? '✏️' : '✨', id ? 'Karakteri Düzenle' : 'Karakter Oluştur', [d.name ? esc(d.name) : '', `${chars().length} karakter`, `${crRules().length} kural`], '', { back, pic: id ? d.photo || d.album[0] : '' })}
        <div class="editor-head pg-bar">
          <a class="chip" href="#/kurallar" title="Oluştur kuralları">📏 Kurallar</a>
          <button class="chip dice-all" id="allDice">🎲 Hepsi</button>
          <button class="btn primary sm" id="saveTop">${id ? '💾 Kaydet' : '✨ Oluştur'}</button>
        </div>

        <nav class="cr-nav" id="crNav"></nav>

        <div class="ctrl" data-nav="⭐ Hazır">
          <div class="row2"><span>⭐ Hazır karakterler</span>${dice('set')}</div>
          <div class="mod-tabs">${MODS.map(m => `<button type="button" data-mod="${m.id}" class="${m.id === mod.id ? 'on' : ''}">${modIcon(m)}${esc(m.name)}</button>`).join('')}</div>
          <small class="mod-desc">${esc(mod.desc || '')}</small>
          ${list.length ? (() => { const curSet = list.find(p => p.id === d.set), peek = [curSet, ...list.filter(p => p !== curSet)].filter(Boolean).slice(0, 4); return `
          <button type="button" class="set-open" id="setOpen">
            <span class="set-stack">${peek.map(p => p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy">` : `<span class="set-ph" style="background:${esc(grad(p))}">${initial(p.name)}</span>`).join('')}</span>
            <span class="set-open-t"><b>📚 Fotoğraf albümünü aç</b><small>${list.length} set${used.size ? ` · ${list.filter(p => used.has(p.id)).length} kullanımda` : ''}${curSet ? ` · seçili: ${esc(curSet.name)}` : ''}</small></span>
            <span class="set-open-go">›</span>
          </button>`; })() : `<div class="empty" style="padding:16px">${mod.gallery && !GAL.cached() ? 'Galeri yükleniyor…' : 'Bu modda karakter yok'}</div>`}
          ${mod.gallery ? `<button type="button" class="btn ghost sm" id="galSets" style="margin-top:8px">🔄 Albümleri yenile</button> <a class="btn ghost sm" href="${esc(GAL.site)}" target="_blank" rel="noopener" style="margin-top:8px">Galeriyi aç ↗</a>` : ''}
          ${!id && mod.id !== 'amor' && list.some(p => !used.has(p.id)) ? `<button type="button" class="btn ghost block" id="addAll" style="margin-top:10px">➕ Tüm ${esc(mod.name)} karakterlerini ekle (${list.filter(p => !used.has(p.id)).length})</button>` : ''}
        </div>

        <div class="ctrl" data-nav="📸 Fotoğraf">
          <div class="row2"><span>📸 Profil fotoğrafı</span><small>kare kırpılır</small></div>
          <div class="photo-pick">
            <label class="pp">${avatar(Object.assign({}, d, { name: d.name || '+' }), 96)}<span class="cam">📷</span>
              <input type="file" accept="image/*" id="photoIn" hidden></label>
            <div class="pp-side">
              <small>Mesajlarda ve profilde görünür.</small>
              ${GAL ? `<button type="button" class="chip" id="galPP">🖼️ ${esc(GAL.name)}'den seç</button>` : ''}
              ${d.photo ? '<button type="button" class="chip" id="rmPhoto">Fotoğrafı kaldır</button>' : ''}
            </div>
          </div>
        </div>

        <div class="ctrl">
          <div class="row2"><span>🖼️ Albüm</span><small>${d.album.length}/${MAX_ALBUM} · ilki kapak olur</small></div>
          <div class="album-strip">
            ${d.album.map((src, i) => `<div class="ph${src === d.photo ? ' is-pp' : ''}"><img src="${esc(src)}" alt=""><button type="button" class="rm" data-rm="${i}" aria-label="Sil">✕</button>
              <button type="button" class="pp" data-setpp="${i}" title="Profil fotoğrafı yap">${src === d.photo ? '👤 Profil' : '👤'}</button></div>`).join('')}
            ${d.album.length < MAX_ALBUM ? '<label class="ph add">+<input type="file" accept="image/*" multiple id="albumIn" hidden></label>' : ''}
            ${d.album.length < MAX_ALBUM && GAL ? `<button type="button" class="ph add gal" id="galAlbum" title="${esc(GAL.name)}'den ekle">🖼️</button>` : ''}
          </div>
        </div>

        <div class="ctrl" data-nav="✍️ Kimlik">
          <div class="row2"><span>✍️ İsim</span><span class="dice-pair"><button type="button" class="dice-btn" id="fancyBtn" title="Süslü isim (✨Elif✨, ELİF, Eliff, ((ELİF)), Küçük Elif…)">🎀</button>${dice('name')}</span></div>
          <input type="text" id="cName" maxlength="40" value="${esc(d.name)}" placeholder="ör. Elif">
        </div>

        <div class="ctrl">
          <div class="row2"><span>👤 Cinsiyet ve yaş</span>${dice('age')}</div>
          <div class="presets">${preset('♀', d.gender === '♀', 'data-gender')}${preset('♂', d.gender === '♂', 'data-gender')}</div>
          <input type="text" id="cAge" inputmode="numeric" maxlength="3" value="${esc(d.age)}" placeholder="Yaş">
        </div>

        <div class="ctrl">
          <div class="row2"><span>📍 Şehir ve meslek</span>${dice('place')}</div>
          <input type="text" id="cCity" maxlength="30" value="${esc(d.city)}" placeholder="Şehir (ör. İzmir)">
          <input type="text" id="cJob" maxlength="30" value="${esc(d.job)}" placeholder="Meslek (ör. Mimar)">
        </div>

        <div class="ctrl">
          <div class="row2"><span>✦ Burç</span>${dice('zodiac')}</div>
          <div class="presets">${T.zodiacs.map(z => preset(z, d.zodiac === z, 'data-zodiac')).join('')}</div>
        </div>

        <div class="ctrl">
          <div class="row2"><span>💬 Durum <small>profilde görünen kısa söz</small></span>${dice('bio')}</div>
          <input type="text" id="cBio" maxlength="80" value="${esc(d.bio)}" placeholder="ör. kahvesiz konuşmam ☕">
        </div>

        ${T.groups.filter(g => g.items.length).map(g => `
          <div class="ctrl cr-fold" data-fold="${esc(g.id)}"${g.id === 'personality' ? ' data-nav="💫 Kişilik"' : g === T.groups.find(x => x.single) ? ' data-nav="🌸 Özellikler"' : ''}>
            <div class="row2"><span>${esc(g.label)} <small>${g.single ? 'birini seç' : 'birden çok seçebilirsin'}</small></span>${dice(g.id)}</div>
            <div class="presets">${g.items.map((t, i) => `<button type="button" data-trait="${esc(g.values[i])}" data-tg="${esc(g.id)}" class="${d.traits.includes(g.values[i]) ? 'on' : ''}${crBl.has(g.values[i]) ? ' blocked' : ''}">${esc(t)}</button>`).join('')}</div>
          </div>`).join('')}

        <div class="ctrl">
          <div class="row2"><span>➕ Diğer özellikler</span></div>
          ${custom.length ? `<div class="presets">${custom.map(t => `<button type="button" class="on x" data-trait="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : ''}
          <input type="text" id="cCustom" maxlength="30" placeholder="Özellik yaz ve Enter'a bas">
        </div>
        <div class="ctrl">
          <div class="row2"><span>🏷️ Etiketler</span><small>profilde ve ana sayfada görünür</small></div>
          ${(d.tags || []).length ? `<div class="presets">${d.tags.map(t => `<button type="button" class="on x" data-tagrm="${esc(t)}">🏷️ ${esc(t)}</button>`).join('')}</div>` : ''}
          <input type="text" id="cTag" maxlength="24" placeholder="Etiket yaz ve Enter'a bas (ör. ex sevgili, iş arkadaşı)">
        </div>

        <div class="ctrl" data-nav="🧩 Ek">
          <div class="row2"><span>🧩 Ek özellikler <small>kendi alanların: sayı, kaydırıcı, aç/kapa, seçim…</small></span><button type="button" class="chip" id="cfEdit">⚙️ Alanları düzenle</button></div>
          <div id="cfBox">${charFields().length ? charFields().map(f => cfInput(f, (d.fields || {})[f.id])).join('') : '<small class="mo-empty">Henüz alan yok. ⚙️ ile ekle (ör. 📏 Boy: sayı, 💍 Evli mi: aç/kapa, 👀 Göz rengi: seçim).</small>'}</div>
        </div>

        <div class="ctrl cr-fold" id="feelBox" data-fold="feel" data-nav="❤️ Olaylar">
          <div class="row2"><span>❤️ Sevdiği / 💔 Sevmediği olaylar <small>"${CHAT_TOP_TAG}" etiketli kategorilerden</small></span>${dice('feel')}</div>
          ${FEELS.map(f => `<div class="mo-sub">${f.icon} ${f.label}</div>
            <div class="presets">${feelEvents(d[f.key]).map(e => `<button type="button" class="on x" data-feelrm="${f.key}" data-id="${esc(e.id)}">${evEmo(e)}${esc(e.title)}</button>`).join('')}
              <button type="button" class="chip" data-feeladd="${f.key}">➕ Seç</button></div>`).join('')}
        </div>

        <div class="ctrl" data-nav="📝 Hakkında">
          <div class="row2"><span>📝 Hakkında</span><small>geçmişi, sırları, ilişkileri</small></div>
          <textarea id="cAbout" rows="4" maxlength="2000" placeholder="Nasıl konuşur, neyi sever, kimden hoşlanır...">${esc(d.about)}</textarea>
        </div>

        <div class="ctrl">
          <div class="row2"><span>🎨 Renk <small>fotoğraf yoksa avatar ve kapak</small></span>${dice('color')}</div>
          <div class="swatches">${T.colors.map((p, i) => `<button type="button" class="sw ${p.join() === (d.colors || []).join() ? 'on' : ''}" data-color="${i}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Renk ${i + 1}"></button>`).join('')}</div>
        </div>

        <div class="sec-title" style="margin:18px 16px 8px" data-nav="👀 Önizleme">Önizleme</div>
        <div class="preview" id="pv">${previewHtml(d)}</div>

        <div class="actions" style="padding-bottom:calc(20px + var(--safe-b))">
          ${id ? '<button class="btn ghost" id="delBtn" style="color:#ff2d55">🗑️ Sil</button>' : '<button class="btn ghost" id="clearBtn">Temizle</button>'}
          <button class="btn primary" id="saveBtn">${id ? '💾 Kaydet' : '✨ Oluştur'}</button>
        </div>
      </div>`;


    const redraw = () => { const y = window.scrollY; renderCreate(id); window.scrollTo(0, y); };
    polishCreate();
    // 🖼️ Lara Gallery: albümler gelince listeyi yenile; profil / albüm için galeriden seçim
    if (mod.gallery && !GAL.cached()) GAL.load().then(() => { if (ui.createMod === mod.id && ui.route.name === 'create') redraw(); }, e => notify(e.message, '⚠️'));
    if ($('#galSets')) $('#galSets').onclick = () => GAL.load(true).then(() => { redraw(); notify('Albümler yenilendi', '🖼️'); }, e => notify(e.message, '⚠️'));
    if ($('#galPP')) $('#galPP').onclick = () => galleryPicker({ title: 'Profil fotoğrafı' }, ([u]) => {
      d.photo = u;
      if (!d.album.includes(u) && d.album.length < MAX_ALBUM) d.album.unshift(u);
      redraw();
    });
    if ($('#galAlbum')) $('#galAlbum').onclick = () => galleryPicker({ title: 'Albüme ekle', multi: true, max: MAX_ALBUM - d.album.length }, us => {
      us.forEach(u => { if (!d.album.includes(u) && d.album.length < MAX_ALBUM) d.album.push(u); });
      if (!d.photo && d.album.length) d.photo = d.album[0];
      redraw();
    });
    if ($('#setOpen')) $('#setOpen').onclick = () => setAlbumSheet(mod, list, used, d.set, p => { p.apply(d); redraw(); });
    view.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => {
      if (ui.createMod === b.dataset.mod) return;
      ui.createMod = b.dataset.mod;
      // yeni karakterde o moddan baştan bir öneri getir
      if (!id) { ui.create.d = blankChar(); randomize(ui.create.d, 'all'); }
      redraw();
    });
    if ($('#addAll')) $('#addAll').onclick = () => {
      const used0 = usedSets({});
      const fresh = list.filter(p => !used0.has(p.id));
      fresh.forEach(p => { const c = blankChar(); p.apply(c); c.id = Store.uid(); c.created = Date.now(); chars().push(c); });
      save();
      ui.create = null;
      notify(`${fresh.length} ${mod.name} karakteri eklendi`, '✨');
      location.hash = '#/home';
    };
    view.querySelectorAll('[data-dice]').forEach(b => b.onclick = () => { randomize(d, b.dataset.dice); redraw(); });
    $('#allDice').onclick = () => { randomize(d, 'all'); redraw(); };
    const pv = () => { $('#pv').innerHTML = previewHtml(d); };
    const bindText = (sel, k, fn) => { const el = $(sel); el.oninput = () => { d[k] = fn ? fn(el) : el.value; }; el.onchange = pv; };
    bindText('#cName', 'name');
    // 🎀 her basışta aynı sade isimden yeni bir süslü hâl (isim elle değiştiyse yeni hâli esas alınır)
    $('#fancyBtn').onclick = () => {
      const st = ui.create;
      const base = st.fancy === d.name && st.base ? st.base : d.name.trim();
      if (!base) { notify('Önce bir isim yaz ya da 🎲 ile seç', '🎀'); return; }
      st.base = base;
      st.fancy = d.name = fancyName(base);
      redraw();
    };
    bindText('#cAge', 'age', el => (el.value = el.value.replace(/\D/g, '')));
    bindText('#cCity', 'city');
    bindText('#cJob', 'job');
    bindText('#cBio', 'bio');
    bindText('#cAbout', 'about');

    $('#photoIn').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try { d.photo = await readPhoto(f, 320, true); d.set = ''; redraw(); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
    };
    if ($('#rmPhoto')) $('#rmPhoto').onclick = () => { d.photo = ''; d.set = ''; redraw(); };
    if ($('#albumIn')) $('#albumIn').onchange = async e => {
      for (const f of [...e.target.files].slice(0, MAX_ALBUM - d.album.length)) {
        try { d.album.push(await readPhoto(f, 720, false)); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      }
      redraw();
    };
    view.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { d.album.splice(+b.dataset.rm, 1); redraw(); });
    view.querySelectorAll('[data-setpp]').forEach(b => b.onclick = () => { d.photo = d.album[+b.dataset.setpp]; redraw(); });

    view.querySelectorAll('[data-gender]').forEach(b => b.onclick = () => {
      d.gender = b.dataset.gender;
      view.querySelectorAll('[data-gender]').forEach(x => x.classList.toggle('on', x === b));
      pv();
    });
    view.querySelectorAll('[data-zodiac]').forEach(b => b.onclick = () => {
      d.zodiac = d.zodiac === b.dataset.zodiac ? '' : b.dataset.zodiac;
      view.querySelectorAll('[data-zodiac]').forEach(x => x.classList.toggle('on', x.dataset.zodiac === d.zodiac));
      pv();
    });
    view.querySelectorAll('[data-trait]').forEach(b => b.onclick = () => {
      const t = b.dataset.trait;
      const g = T.groups.find(x => x.id === b.dataset.tg);
      const was = d.traits.includes(t), bl0 = crBlocked(d);
      // 📏 kural: bu özellik şu an olamaz
      if (!was && bl0.has(t)) { notify(`📏 ${crLabel(bl0.get(t))} varken ${t} olamaz`, '📏'); return; }
      if (g && g.single) d.traits = d.traits.filter(x => !g.values.includes(x));
      d.traits = was ? d.traits.filter(x => x !== t) : d.traits.concat(t);
      const gone = crFix(d);
      if (gone.length) notify(`📏 Kurala göre çıkarıldı: ${gone.join(', ')}`, '📏');
      if (!T.all.includes(t) || crRules().length) return redraw();
      view.querySelectorAll('[data-trait]').forEach(x => { if (x.dataset.tg) x.classList.toggle('on', d.traits.includes(x.dataset.trait)); });
      pv();
    });
    $('#cCustom').onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const t = e.target.value.trim();
      if (t && !d.traits.includes(t)) { d.traits.push(t); redraw(); $('#cCustom').focus(); }
    };
    $('#cTag').onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const t = e.target.value.trim().replace(/^#/, '');
      d.tags = d.tags || [];
      if (t && !d.tags.some(x => lower(x) === lower(t))) { d.tags.push(t); redraw(); $('#cTag').focus(); }
    };
    view.querySelectorAll('[data-tagrm]').forEach(b => b.onclick = () => { d.tags = d.tags.filter(t => t !== b.dataset.tagrm); redraw(); });
    view.querySelectorAll('[data-color]').forEach(b => b.onclick = () => {
      d.colors = T.colors[+b.dataset.color];
      redraw();
    });
    if ($('#clearBtn')) $('#clearBtn').onclick = () => { ui.create = { key: 'new', d: blankChar() }; renderCreate(null); window.scrollTo(0, 0); };
    if ($('#delBtn')) $('#delBtn').onclick = () => removeChar(byId(id));

    $('#saveTop').onclick = () => $('#saveBtn').click();
    // 🧩 ek özellikler: yazılanlar sayfa yeniden çizilmeden kaydedilir, seçimler yeniden çizer
    d.fields = d.fields || {};
    $('#cfEdit').onclick = () => charFieldSheet(redraw);
    // ❤️/💔 olaylar: bir olay ya sevilen ya sevilmeyen listesinde olur
    $('#feelBox').onclick = e => {
      const rm = e.target.closest('[data-feelrm]'), add = e.target.closest('[data-feeladd]');
      if (rm) { d[rm.dataset.feelrm] = (d[rm.dataset.feelrm] || []).filter(x => x !== rm.dataset.id); redraw(); }
      if (!add) return;
      const key = add.dataset.feeladd, other = FEELS.find(f => f.key !== key).key;
      if (!feelPool().length) { notify(`Önce bir kategoriye "${CHAT_TOP_TAG}" etiketi ver (Monia → 🗂️ Kategoriler)`, '🗂️'); return; }
      poolPicker({ title: `${FEELS.find(f => f.key === key).icon} ${FEELS.find(f => f.key === key).label}`, noGroups: true, cats: tagCats(CHAT_TOP_TAG).map(c => c.id),
        skip: feelEvents([...(d.likes || []), ...(d.dislikes || [])]).map(x => x.title) }, evs => {
        const ids = evs.map(x => x.id);
        d[key] = [...new Set([...(d[key] || []), ...ids])];
        d[other] = (d[other] || []).filter(x => !ids.includes(x));
        redraw();
      });
    };
    const cfBox = $('#cfBox');
    cfBox.oninput = e => {
      const t = e.target, fid = t.dataset.cf;
      if (!fid) return;
      d.fields[fid] = t.type === 'number' || t.type === 'range' ? (t.value === '' ? '' : +t.value) : t.value;
      const out = cfBox.querySelector(`[data-cfv="${CSS.escape(fid)}"]`);
      if (out) out.textContent = t.value;
    };
    cfBox.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const ds = b.dataset;
      if (ds.cftog) { d.fields[ds.cftog] = !d.fields[ds.cftog]; const gone = crFix(d); if (gone.length) notify(`📏 Kurala göre çıkarıldı: ${gone.join(', ')}`, '📏'); redraw(); }
      if (ds.cfch) { d.fields[ds.cfch] = d.fields[ds.cfch] === ds.v ? '' : ds.v; redraw(); }
      if (ds.cfmu) { const a = Array.isArray(d.fields[ds.cfmu]) ? d.fields[ds.cfmu] : []; d.fields[ds.cfmu] = a.includes(ds.v) ? a.filter(x => x !== ds.v) : [...a, ds.v]; redraw(); }
    };
    $('#saveBtn').onclick = () => {
      d.name = d.name.trim();
      if (!d.name) { notify('Karaktere bir isim ver', '✍️'); $('#cName').focus(); return; }
      let c = id && byId(id);
      if (c) Object.assign(c, d);
      else {
        c = Object.assign(d, { id: Store.uid(), created: Date.now() });
        chars().push(c);
      }
      save();
      ui.create = null;
      ui.profileTab = 'profile';
      notify(id ? 'Kaydedildi' : `${c.name} oluşturuldu`, '✨');
      location.hash = `#/p/${c.id}`;
    };
  }

  function previewHtml(d) {
    const cover = d.album[0] || d.photo;
    return `
      <div class="pv-photo" style="background:${grad(d)}">
        ${cover ? `<img src="${esc(cover)}" alt="">` : `<div class="pv-letter">${initial(d.name || '?')}</div>`}
        <div class="pv-over">
          <b>${esc(d.name || 'İsim')}</b>
          <div class="chips">${infoChips(d)}${d.job ? `<span class="chip">${esc(d.job)}</span>` : ''}</div>
        </div>
      </div>
      <div class="pv-body">
        ${d.bio ? `<div class="pv-bio">“${esc(d.bio)}”</div>` : ''}
        <div class="chips">${d.traits.map(t => `<span class="chip">💜 ${esc(t)}</span>`).join('') || '<span class="chip">Henüz özellik seçilmedi</span>'}</div>
        ${d.about ? `<div class="about" style="margin-top:10px;white-space:pre-wrap">${esc(d.about)}</div>` : ''}
      </div>`;
  }

  /* ---------- Ben ---------- */
  /* ---------- 🎬 Monia Paneli: senaryo (zaman + mekan + olaylar) üret, hikayeyi onunla başlat ----------
   * Veriler: js/data/monia.js (zamanlar, hazır olay havuzu), js/data/places.js (mekanlar), S().monia (senin senaryo ve kalıpların) */
  const MD = Stories.MONIA || { parts: [], days: [], seasons: [], cats: [] };
  const MO = () => S().monia;
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  const MINE = { id: 'mine', icon: '✍️', label: 'Kalıplarım' };
  // 🗂️ Kategoriler: hazırlar (adı / simgesi değiştirilebilir: catEdits, sistem dosyasındakiler önce) + eklediklerin (monia.cats)
  const catEdits = () => Object.assign({}, ((Stories.SYSTEM || {}).catEdits) || {}, MO().catEdits || {});
  // sıra: monia.catOrder (yoksa sistem dosyasındaki); listede olmayanlar sona
  const catOrder = () => MO().catOrder || (Stories.SYSTEM || {}).catOrder || [];
  const moCats = () => {
    const ed = catEdits(), ord = catOrder(), at = c => { const i = ord.indexOf(c.id); return i < 0 ? 1e6 : i; };
    return [...MD.cats, ...(MO().cats || []), MINE].map((c, i) => ({ c: ed[c.id] ? { ...c, ...ed[c.id] } : c, i }))
      .sort((a, b) => at(a.c) - at(b.c) || a.i - b.i).map(x => x.c);
  };
  // Kategorideki olaylar: hazırlar (b:...) + senin kalıpların (cat'e göre)
  function poolOf(cat) {
    const raw = cat.items || [];
    const built = [...new Set(raw)].map(x => typeof x === 'string' ? { title: x, text: '' } : { title: x.title, text: x.text || '' })
      .map(x => ({ id: `b:${cat.id}:${x.title}`, ...x, cat: cat.id, builtin: true }));
    // detaylandırdığın hazır olay (base) hazırın yerine geçer
    const over = new Set(MO().events.map(e => e.base).filter(Boolean));
    return [...built.filter(b => !over.has(b.id)), ...MO().events.filter(e => (e.cat || 'mine') === cat.id)];
  }
  const allEvents = () => moCats().flatMap(poolOf);
  // ❤️/💔 karakterin sevdiği / sevmediği olaylar: sadece 'event' etiketli kategorilerden seçilir (c.likes / c.dislikes = olay id'leri)
  const EVENT_TAG = 'Event';
  const FEELS = [{ key: 'likes', icon: '❤️', label: 'Sevdiği olaylar' }, { key: 'dislikes', icon: '💔', label: 'Sevmediği olaylar' }];
  // kategori etiketi harfi harfine (küçük harf 'event'; büyük harfli 'Event' sayılmaz)
  const tagCats = t => moCats().filter(c => (c.tags || []).includes(t));
  const feelPool = () => tagCats(CHAT_TOP_TAG).flatMap(poolOf);
  const feelEvents = ids => { const pool = allEvents(); return (ids || []).map(id => pool.find(e => e.id === id)).filter(Boolean); };
  const partOf = sc => MD.parts.find(p => p.id === sc.part);
  const placeOfSc = sc => allPlaces().find(p => p.id === sc.place);
  const scPlaceName = sc => sc.placeName || (placeOfSc(sc) || {}).name || '';
  const scPlaceIcon = sc => sc.placeIcon || (placeOfSc(sc) || {}).icon || '📍';
  const timeLabel = sc => [sc.day, sc.season, (partOf(sc) || {}).label, sc.timeNote].filter(Boolean).join(', ');
  const scChars = sc => (sc.chars || []).map(byId).filter(Boolean);
  // olay metni: değişkenler doldurulur; metni olmayan hazır olay başlığıyla görünür.
  // short: sadece anlatım (senaryo notu için); değilse akış, açılış repliği ve ton da eklenir
  // olayın kendi zamanı / mekanı (yoksa senaryonunki geçerli)
  const evPlace = ev => ev.place ? allPlaces().find(p => p.id === ev.place) : null;
  const evTime = ev => [(MD.parts.find(p => p.id === ev.part) || {}).label, ev.when].filter(Boolean).join(', ');
  function evText(ev, sc, short) {
    const ms = scChars(sc || {}), ben = ms.length ? ms.map(m => m.name.split(' ')[0]).join(' ve ') : 'O';
    // 🧩 tek satırda birden çok ekleme: "A + B + C", açıklama altında
    const mix = (ev.mix || []).filter(Boolean);
    let t = ev.text || (mix.length ? '' : `${(moCats().find(c => c.id === ev.cat) || MINE).icon} ${ev.title}`);
    if (mix.length) t = `🧩 ${mix.join(' + ')}${t ? (short ? ' — ' : '\n') + t : ''}`;
    const ep = evPlace(ev), et = evTime(ev);
    if (short && (ep || et)) t += ` (${[et && `🕰️ ${et}`, ep && `${ep.icon} ${ep.name}`].filter(Boolean).join(' · ')})`;
    if (!short && et) t = `🕰️ ${et}\n${t}`;
    if (!short) {
      const steps = (ev.steps || []).filter(Boolean);
      if (steps.length) t += '\n' + steps.map(s => `• ${s}`).join('\n');
      if (ev.opener) t += `\n💬 ${ev.starter === 'ben' ? '{ben}: ' : ev.starter === 'sen' ? '{sen}: ' : ''}"${ev.opener}"`;
      if ((ev.tones || []).length) t += `\n🎭 ${ev.tones.join(' · ')}`;
    }
    sc = sc || {};
    return t.replace(/\{ben\}/g, ben).replace(/\{sen\}/g, userName()).replace(/\{mekan\}/g, (ep && ep.name) || scPlaceName(sc) || 'Bir yerde')
      .replace(/\{zaman\}/g, et || timeLabel(sc) || 'bir gün');
  }
  const EV_FIELDS = ['title', 'text', 'cat', 'steps', 'opener', 'starter', 'tones', 'note', 'part', 'when', 'place', 'mix', 'tags', 'desc', 'color', 'emojis', 'level', 'outcomes', 'subs', 'sub', 'onEffects'];
  // 🎨 olayın rengi ve en fazla iki emojisi (çiplerde, listelerde ve sohbetteki kartta)
  const EV_COLORS = ['#e0457f', '#ff5f5f', '#ff8a65', '#ffb72b', '#34c77b', '#2fb6c7', '#5f8bff', '#8b5cf6', '#c2185b', '#8b8b99'];
  const isHex = c => /^#[0-9a-f]{6}$/i.test(c || '');
  function twoEmojis(s) {
    const parts = window.Intl && Intl.Segmenter ? [...new Intl.Segmenter('tr', { granularity: 'grapheme' }).segment(String(s || ''))].map(x => x.segment) : [...String(s || '')];
    return parts.filter(g => /\p{Extended_Pictographic}/u.test(g)).slice(0, 2).join('');
  }
  const evEmo = e => e && e.emojis ? `${esc(e.emojis)} ` : '';
  // 📶 dereceler: yüksek derece daha canlı, düşük daha sönük renk (vivid 0-100). Sıra = düşükten yükseğe
  // eski hazır 3 kademe değiştirilmeden kaydedildiyse yeni 5 kademeye geçilir
  const OLD_LEVELS = 'low:Low-volume:35|mid:Volume:70|high:High-volume:100';
  const evLevels = () => {
    const mo = MO();
    if (mo.levels && mo.levels.map(l => `${l.id}:${l.label}:${l.vivid}`).join('|') === OLD_LEVELS) delete mo.levels;
    return mo.levels || (Stories.SYSTEM || {}).levels || MD.levels || [];
  };
  // 📶 derece ve canlılık sadece alt derecelerde (withSub subId verir); olayın kendi eski derecesi yok sayılır
  const levelOf = e => e && e.subId && e.level ? evLevels().find(l => l.id === e.level) : null;
  function vividHex(hex, vivid) {
    if (!isHex(hex)) return hex;
    const v = Math.max(0, Math.min(100, vivid == null ? 100 : +vivid)) / 100;
    const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const g = c[0] * .3 + c[1] * .59 + c[2] * .11;
    // gri tona yaklaştır, sönükleştikçe biraz da açılsın
    return '#' + c.map(x => { const y = g + (x - g) * v; return Math.round(y + (210 - y) * (1 - v) * .35); }).map(x => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
  }
  // canlılık: olayın / alt derecenin kendi vivid'i (0 sönük … 100 tam renk), yoksa 📶 derecesininki
  const vividOf = e => e.subId && e.vivid !== undefined && e.vivid !== '' && e.vivid !== null ? +e.vivid : (levelOf(e) || {}).vivid;
  const evColor = e => e && isHex(e.color) ? vividHex(e.color, vividOf(e)) : '';
  const evStyle = e => evColor(e) ? ` style="--evc:${evColor(e)}"` : '';
  const evCls = e => evColor(e) ? ' has-color' : '';
  // 🏷️ olay etiketleri: js/data/monia.js evTags + olaylarında kullandıkların
  const allEvTags = () => [...new Set([...(MD.evTags || []), ...(((Stories.SYSTEM || {}).tags || {}).event || []), ...(MO().evTagList || []), ...MO().events.flatMap(e => e.tags || [])])];
  // 🧩 eklemeler satırı (düzenleyicilerde): çipler ✕ ile çıkar, ➕ havuzdan / yazarak eklenir
  const mixRow = mix => `<div class="mo-chips mo-mix">${(mix || []).map((x, i) => `<span class="mo-chip on">${esc(x)}<button type="button" data-mixrm="${i}" aria-label="Çıkar">✕</button></span>`).join('')}
    <button type="button" class="mo-chip" data-mixadd>➕ Havuzdan</button></div>
    <div class="pl-own" style="margin-top:6px"><input class="mo-mixin" maxlength="40" placeholder="ya da kendin yaz ve Enter'a bas"></div>`;
  // senaryodaki kopya, havuzdaki aslının (src, eski kopyalarda aynı başlık) güncel rengini / emojisini / derecesini kullanır
  function evLive(e) {
    if (!e) return e;
    const all = allEvents(), live = (e.src && all.find(x => x.id === e.src)) || all.find(x => x.title === e.title && (x.cat || 'mine') === (e.cat || 'mine'));
    return live ? { ...e, color: live.color || e.color, emojis: live.emojis || e.emojis, level: live.level || e.level, outcomes: (e.outcomes || []).length ? e.outcomes : live.outcomes, subs: (e.subs || []).length ? e.subs : live.subs, sub: e.sub || live.sub, onEffects: (e.onEffects || []).length ? e.onEffects : live.onEffects } : e;
  }
  const evCopy = e => {
    const o = { id: Store.uid() };
    if (e.id && !String(e.id).startsWith('tmp')) o.src = e.id;
    EV_FIELDS.forEach(k => { if (e[k] != null && e[k] !== '') o[k] = Array.isArray(e[k]) ? [...e[k]] : e[k]; });
    o.text = o.text || ''; o.cat = o.cat || 'mine';
    return o;
  };

  // Rastgele senaryo: zaman, o saate uyan bir mekan, 3-5 olay
  function randomScenario() {
    const part = pickOne(MD.parts), h = part ? part.hour : new Date().getHours();
    const inH = hr => !hr || (hr[0] <= hr[1] ? h >= hr[0] && h < hr[1] : h >= hr[0] || h < hr[1]);
    const places = allPlaces().filter(p => inH(p.hours));
    const pl = pickOne(places.length ? places : allPlaces()) || {};
    const pool = allEvents(), events = [];
    for (let n = 3 + Math.floor(Math.random() * 3); events.length < n && events.length < pool.length;) {
      const e = pickOne(pool);
      if (!events.some(x => x.title === e.title)) events.push(evCopy(e));
    }
    const ch = chars().length ? [pickOne(chars()).id] : [];
    return { id: Store.uid(), title: `${pl.icon || '🎬'} ${pl.name || 'Senaryo'}`, chars: ch, part: part ? part.id : '', day: Math.random() < .6 ? pickOne(MD.days) : '',
      season: Math.random() < .4 ? pickOne(MD.seasons) : '', timeNote: '', place: pl.id || '', placeName: '', placeIcon: '', events, created: Date.now() };
  }
  function addScenario(sc) { MO().scenarios.unshift(sc); save(); location.hash = `#/monia/${sc.id}`; }

  // 🏷️ senaryo etiketleri: hazırlar (js/data/monia.js scTags) + senaryolarda kullandıkların
  // + sistem dosyasındaki (js/data/system.js tags) ve eklediğin etiketler (kullanılmasa da kalır)
  const SYS_TAGS = (Stories.SYSTEM || {}).tags || {};
  const allScTags = () => [...new Set([...(MD.scTags || []), ...(SYS_TAGS.scenario || []), ...(MO().scTagList || []), ...MO().scenarios.flatMap(s => s.tags || [])])];
  const keepTag = (k, t) => { const l = MO()[k] = MO()[k] || []; if (!l.includes(t)) l.push(t); };
  const tagChips = (list, on, attr = 'data-stag') => list.map(t => `<button type="button" class="chip mo-pick${on.includes(t) ? ' on' : ''}" ${attr}="${esc(t)}">🏷️ ${esc(t)}</button>`).join('');
  // senaryodan başlatılan sohbetler ve en son ne zaman oynandığı
  const scThreads = sc => threads().filter(t => t.scenario && t.scenario.id === sc.id).sort((a, b) => activity(b) - activity(a));
  const scPlayed = sc => { const t = scThreads(sc)[0]; return t ? activity(t) : 0; };

  /* 📤📥 Senaryoları JSON olarak dışa / içe aktar (tüm uygulama yedeğinden ayrı).
   * Dosya: { format: 'amor-stories-monia', version: 1, scenarios, events, places, groups } — kendi kalıpların, mekanların ve etiketlerin de içinde */
  function downloadJson(obj, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function exportScenarios(list) {
    const placeIds = new Set(list.flatMap(s => [s.place, ...s.events.map(e => e.place)]).filter(Boolean));
    const places = list.length === MO().scenarios.length ? MO().places : MO().places.filter(p => placeIds.has(p.id));
    const groupIds = new Set(places.flatMap(p => p.tags || []));
    const day = new Date().toISOString().slice(0, 10);
    downloadJson({ format: 'amor-stories-monia', version: 1, exported: day,
      scenarios: list.map(s => { const c = JSON.parse(JSON.stringify(s)); c.charNames = scChars(s).map(m => m.name); return c; }),
      events: MO().events, places, groups: MO().groups.filter(g => groupIds.has(g.id)) },
      list.length === 1 ? `monia-${(list[0].title || 'senaryo').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase()}-${day}.json` : `monia-senaryolar-${day}.json`);
    notify(`${list.length} senaryo dışa aktarıldı`, '📤');
  }
  // 📤 Tüm Monia verisi (senaryolar, kalıp olaylar, mekanlar, etiketler, kategoriler): başka cihaza / yerel düzenleyiciye taşımak için
  function exportAllMonia() {
    const mo = MO(), day = new Date().toISOString().slice(0, 10);
    downloadJson({ format: 'amor-stories-monia', version: 2, exported: day,
      scenarios: mo.scenarios.map(s => { const c = JSON.parse(JSON.stringify(s)); c.charNames = scChars(s).map(m => m.name); return c; }),
      events: mo.events, evGroups: mo.evGroups || [], places: mo.places, groups: mo.groups, cats: mo.cats || [], catEdits: mo.catEdits || {},
      catOrder: mo.catOrder, levels: mo.levels, params: mo.params, triggers: mo.triggers, charFields: S().charFields || [], tags: sysTags() },
      `monia-tumu-${day}.json`);
    notify('Monia verisi dışa aktarıldı', '📤');
  }
  function importScenarios() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || data.format !== 'amor-stories-monia' || !Array.isArray(data.scenarios)) throw new Error('format');
        // aynı kimlikli kayıt güncellenir, aynı içerikli kopya eklenmez
        const r = mergeMonia(data, 'incoming', s => {
          const c = JSON.parse(JSON.stringify({ ...s, tags: s.tags || [], events: s.events || [], created: s.created || Date.now() }));
          // karakterler bu cihazda yoksa adlarından bulunur, bulunamazsa boş kalır (başlatırken seçersin)
          c.chars = (s.chars || []).map((id, i) => byId(id) ? id : (chars().find(m => m.name === (s.charNames || [])[i]) || {}).id).filter(Boolean);
          delete c.charNames;
          return c;
        });
        save();
        notify(`İçe aktarıldı: ${r.added} yeni, ${r.updated} güncellendi${r.same ? `, ${r.same} zaten vardı` : ''}`, '📥');
        render();
      } catch (e) { notify('Bu dosya bir Monia senaryo dosyası değil', '⚠️'); }
    };
    inp.click();
  }

  // Senaryoda karakter yoksa başlatırken seçilir (bir ya da birkaç; birden fazlası grup sohbeti olur)
  function pickCharsSheet(sc, cb) {
    if (!chars().length) { notify('Önce Oluştur sekmesinden bir karakter oluştur', '👥'); return; }
    const sel = new Set();
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>👥 Kiminle oynayacaksın?</h3>
      <div class="about" style="margin-bottom:10px">"${esc(sc.title)}" senaryosunda karakter yok; bu hikaye için seç.</div>
      <div class="g-pick">${chars().map(c => `<button type="button" data-m="${c.id}">${avatar(c, 52)}<b>${esc(c.name)}</b></button>`).join('')}</div>
      <button class="btn pink block" id="pcGo">▶️ Başlat</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-m]');
      if (b) { sel.has(b.dataset.m) ? sel.delete(b.dataset.m) : sel.add(b.dataset.m); b.classList.toggle('on', sel.has(b.dataset.m)); return; }
      if (!e.target.closest('#pcGo')) return;
      if (!sel.size) { notify('En az bir karakter seç', '👥'); return; }
      sh.close();
      cb(chars().filter(c => sel.has(c.id)).map(c => c.id));
    };
  }

  // Hikaye kartları (Ana sayfa → 🎬 Monia)
  function storyCard(s) {
    const ths = scThreads(s), ms = scChars(s);
    // kapak yoksa: karakterin fotoğrafı, o da yoksa resim havuzundan (senaryoya göre hep aynı) bir fotoğraf
    const pool = homePool(), cover = s.cover || (ms.find(c => c.photo) || {}).photo || (pool.length ? pool[+sysHash(s.id) % pool.length] : '');
    return `<div class="story-card card${ths.length ? ' played' : ''}" data-sc="${s.id}">
      <div class="st-cover"${cover ? ` style="background-image:url('${esc(cover)}')"` : ''}>${cover ? '' : `<span>${esc(scPlaceIcon(s))}</span>`}
        <span class="st-place">${esc(scPlaceIcon(s))} ${esc(scPlaceName(s) || 'Mekan yok')}</span>
        ${ths.length ? '<span class="st-badge">💬 Devam ediyor</span>' : ''}
        ${ms.length ? `<div class="st-avas">${ms.slice(0, 3).map(c => avatar(c, 30)).join('')}</div>` : ''}</div>
      <div class="st-body">
        <b>${esc(s.title || 'Adsız senaryo')}</b>
        ${s.desc ? `<p>${esc(s.desc)}</p>` : ''}
        <div class="chips">${(s.tags || []).map(t => `<span class="chip">🏷️ ${esc(t)}</span>`).join('')}</div>
        <small>${esc([timeLabel(s), `${s.events.length} olay`].filter(Boolean).join(' · '))}</small>
        <div class="st-acts">
          <button type="button" class="btn pink sm" data-st-play>▶️ ${ths.length ? 'Yeniden başlat' : 'Başlat'}</button>
          ${ths.length ? `<button type="button" class="btn primary sm" data-st-cont>💬 Devam et${ths.length > 1 ? ` (${ths.length})` : ''}</button>` : ''}
          <button type="button" class="btn ghost sm" data-st-edit>✏️</button>
        </div>
      </div></div>`;
  }
  function renderHomeMonia() {
    const sorts = [['all', 'Tümü'], ['played', 'Son oynanan'], ['new', 'Yeni']];
    const sort = ui.storySort || 'all', tag = ui.storyTag || '';
    let list = MO().scenarios.filter(s => !tag || (s.tags || []).includes(tag));
    if (sort === 'played') list = list.filter(scPlayed).sort((a, b) => scPlayed(b) - scPlayed(a));
    if (sort === 'new') list = [...list].sort((a, b) => b.created - a.created);
    const used = [...new Set(MO().scenarios.flatMap(s => s.tags || []))];
    view.innerHTML = `
      ${pageHero('monia', '🎬', 'Hikayeler', [`${MO().scenarios.length} senaryo`, `${MO().scenarios.filter(scPlayed).length} oynandı`, `${allEvents().length} olay`])}
      <div class="page-pad home stories">
        <div class="banners">
          <button class="banner gold" id="hmRandom"><b>Senaryo üret</b><small>zaman + mekan + olaylar</small><span class="art">🎲</span></button>
          <a class="banner green" href="#/monia"><b>Monia Paneli</b><small>${MO().scenarios.length} senaryo · ${allEvents().length} olay</small><span class="art">🎬</span></a>
        </div>
        <div class="tabs-row"><div class="tabs">${sorts.map(([k, t]) => `<button data-sort="${k}" class="${sort === k ? 'active' : ''}">${t}</button>`).join('')}</div></div>
        ${used.length ? `<div class="chips mo-filter">${tagChips(used, tag ? [tag] : [], 'data-ftag')}</div>` : ''}
        <div class="story-list">${list.length ? list.map((s, i) => storyCard(s).replace('class="story-card card"', `class="story-card card" style="--i:${Math.min(i, 12)}"`)).join('')
          : `<div class="empty"><span class="big">🎬</span>${MO().scenarios.length ? 'Bu filtrede hikaye yok' : 'Henüz hikaye yok.<br>🎲 ile bir senaryo üret ya da Monia Paneli\'nden kur.'}</div>`}</div>
      </div>`;
    $('#hmRandom').onclick = () => addScenario(randomScenario());
    view.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { ui.storySort = b.dataset.sort; renderHomeMonia(); });
    view.querySelectorAll('[data-ftag]').forEach(b => b.onclick = () => { ui.storyTag = ui.storyTag === b.dataset.ftag ? '' : b.dataset.ftag; renderHomeMonia(); });
    view.querySelectorAll('.story-card').forEach(card => card.onclick = e => {
      const s = MO().scenarios.find(x => x.id === card.dataset.sc);
      if (!s) return;
      if (e.target.closest('[data-st-play]')) return startScenario(s);
      if (e.target.closest('[data-st-cont]')) return continueStory(s);
      location.hash = `#/monia/${s.id}`;
    });
  }
  // bir senaryodan başlatılmış sohbete dön (birden çoksa seç)
  function continueStory(s) {
    const ths = scThreads(s);
    if (ths.length === 1) { location.hash = `#/chat/${ths[0].id}`; return; }
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>💬 ${esc(s.title)}</h3>
      ${ths.map(t => { const ms = membersOf(t), l = lastOf(t); return `<button class="act" data-th="${t.id}">${esc(ms.map(m => m.name).join(', '))} · ${esc(t.title)}<small> · ${(S().chats[t.id] || []).length} mesaj${l ? ' · ' + fmtTime(l.ts) : ''}</small></button>`; }).join('')}`, 'light');
    sh.el.onclick = e => { const b = e.target.closest('[data-th]'); if (b) { sh.close(); location.hash = `#/chat/${b.dataset.th}`; } };
  }

  // Monia sekmeleri: ana panel · 🎲 Sebep-sonuç (📊 parametreler + ⚡ eşik olayları) · 🧺 Olay grupları
  const MO_TABS = [['', '🎬 Senaryo & Olaylar'], ['sonuc', '🎲 Sebep-Sonuç'], ['gruplar', '🧺 Olay grupları']];
  const moTabs = cur => `<div class="mo-tabs">${MO_TABS.map(([k, l]) => `<a href="#/monia${k ? '/' + k : ''}" class="${cur === k ? 'on' : ''}">${l}</a>`).join('')}</div>`;

  /* 🎲 Sebep-sonuç paneli: parametreler ve eşik olayları burada düzenlenir (💾 Kaydet), olayların sonuçları özetlenir
   * (✏️ ile olay editörüne gider, kaydedince buraya döner). Düzenleme taslağı: ui.paramDraft */
  function renderCausePage() {
    ui.moBack = '#/monia/sonuc';
    const dr = ui.paramDraft || (ui.paramDraft = { params: JSON.parse(JSON.stringify(allParams())), triggers: JSON.parse(JSON.stringify(allTriggers())) });
    dr.outs = dr.outs || {};
    const evs = allEvents(), withOut = evs.filter(e => (e.outcomes || []).length || (e.onEffects || []).length || dr.outs[e.id]);
    // 🤖 bot kuralları da sebep olabilir: kural cevap verince sonucu seçilir (MO().botOuts[kural id])
    const botOuts = MO().botOuts || (Stories.SYSTEM || {}).botOuts || {};
    const botEv = r => ({ id: 'bot:' + r.id, title: r.name || (r.when || []).join(', ') || 'Yedek cevap', emojis: '🤖', outcomes: botOuts[r.id] || [], bot: r });
    botRules().filter(r => (botOuts[r.id] || []).length || dr.outs['bot:' + r.id]).forEach(r => withOut.push(botEv(r)));
    // 🔗 ortak sonuçlar (taslak: dr.grps)
    dr.grps = dr.grps || JSON.parse(JSON.stringify(sharedOuts()));
    const grpEv = g => ({ id: 'grp:' + g.id, title: g.title || 'Ortak sonuç', emojis: '🔗', outcomes: g.outs || [], grp: g });
    dr.grps.forEach(g => withOut.push(grpEv(g)));
    const grpOfEv = e => dr.grps.find(g => (g.evs || []).some(x => [e.id, e.src, e.base].includes(x)));
    const evById = id => evs.find(x => x.id === id);
    // olayların sonuçlarının düzenleme taslağı (💾 Kaydet'te olaylara yazılır)
    const draftOuts = e => (dr.outs[e.id] || (dr.outs[e.id] = { list: JSON.parse(JSON.stringify(e.outcomes || [])) })).list;
    const numParams = [...dr.params.filter(p => p.label).map(p => ({ id: 'p:' + p.id, label: `${p.icon || '📊'} ${p.label}` })),
      ...charFields().filter(f => ['number', 'range'].includes(f.type)).map(f => ({ id: 'f:' + f.id, label: `${f.icon || '🧩'} ${f.label}` }))];
    const opt = (v, cur, l) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`;
    const num = v => v == null ? '' : esc(v);
    const effSel = attr => evParams().length ? `<select ${attr}>${evParams().map(p => p.bool ? `<option value="${esc(p.id)}|1">🔘 ${esc(p.f.label)} → Evet</option><option value="${esc(p.id)}|0">🔘 ${esc(p.f.label)} → Hayır</option>` : `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select>` : '';
    // bir olayın (ya da 🤖 bot kuralının) sonuçları: yüzde, metin, etkiler, 🔒 şartlar, ↪ sonraki olay
    function csItem(e, ei) {
      const outs = draftOuts(e), sum = outs.reduce((n, o) => n + (+o.pct || 0), 0), skip = e.bot || e.grp ? '' : e.id, sg = !e.bot && !e.grp && grpOfEv(e);
      return `<div class="cs-item${e.grp ? ' cs-grp' : ''}${sg ? ' cs-shared' : ''}${dr.outs[e.id] && dr.outs[e.id].dirty ? ' dirty' : ''}" data-ei="${ei}">
        ${e.grp ? `<div class="cs-grp-h"><span>🔗</span><input class="cs-gt" data-csgt maxlength="40" value="${esc(e.grp.title || '')}" placeholder="Ortak sonucun adı"><button type="button" class="cs-x" data-csgdel title="Ortak sonucu sil">🗑️</button></div>
          <div class="cs-grp-evs"><small>Kullanan olaylar</small>${(e.grp.evs || []).map(id => { const x = evById(id); return `<button type="button" class="mo-chip${x ? evCls(x) : ''}"${x ? evStyle(x) : ''} data-csgrm="${esc(id)}" title="Çıkar">${x ? evEmo(x) + esc(x.title) : '?'} ✕</button>`; }).join('')}
            <button type="button" class="chip" data-csgadd>➕ Olay</button><input class="hs-in cs-gin" placeholder="# ekle"></div>`
        : `<button type="button" class="cs-ev mo-chip${evCls(e)}"${evStyle(e)} data-csed="${esc(e.id)}">${evEmo(e)}${esc(e.title)} <small>${e.bot ? esc((e.bot.when || []).join(' · ') || 'yedek') : '✏️'}</small></button>
          ${e.bot ? '' : sg ? `<div class="cs-note">🔗 <b>${esc(sg.title || 'Ortak sonuç')}</b> kullanıyor · aşağıdaki kendi sonuçları kullanılmaz</div>` : '<button type="button" class="chip cs-share" data-csshare title="Bu sonuçları başka olaylarla paylaş">🔗 Paylaş</button>'}`}
        ${(e.onEffects || []).length ? `<div class="cs-on"><small>⚡ olunca</small>${e.onEffects.map(ef => `<em class="cs-eff ${+ef.d > 0 ? 'up' : 'down'}">${esc(effLabel(ef))}</em>`).join('')}</div>` : ''}
        <div class="cs-outs">${outs.map((o, j) => { const ck = o._ck || 'not'; return `<div class="cs-out" data-oj="${j}">
          <label class="cs-bar"><i style="width:${Math.min(100, +o.pct || 0)}%"></i><input type="number" min="0" max="100" data-csp value="${+o.pct || 0}"><b>%</b></label>
          <div class="cs-body">
            <input class="cs-t" data-cst maxlength="200" value="${esc(o.text || '')}" placeholder="Sonuç (ör. {ben} hamile kaldı)">
            <button type="button" class="cs-def-btn${o.def ? ' on' : ''}" data-csdef title="Şart tutmazsa bu olur">⭐</button>
            <button type="button" class="cs-x" data-csdup title="Çoğalt">⧉</button>
            <button type="button" class="cs-x" data-cscopy title="Kopyala (başka olaya yapıştırmak için)">📋</button>
            <button type="button" class="cs-x" data-csorm title="Sonucu sil">✕</button>
            <div class="cs-tags">${(o.effects || []).map((ef, k) => `<button type="button" class="cs-eff ${+ef.d > 0 ? 'up' : 'down'}" data-cserm="${k}" title="Kaldır">${esc(effLabel(ef))} ✕</button>`).join('')}${(o.conds || []).map((cd, k) => `<button type="button" class="cs-cond" data-cscrm="${k}" title="Kaldır">${esc(condText(cd))} ✕</button>`).join('')}</div>
            <div class="cs-add">${evParams().length ? `${effSel('data-csesel')}<input type="number" data-csedl value="1" step="1" title="Miktar"><button type="button" class="chip" data-cseadd>📈 Ekle</button>` : ''}
              <select data-csnx class="cs-nx"><option value="">↪ sonraki olay yok</option>${evOptions(CHAT_TOP_TAG, o.next || '', skip)}</select></div>
            <div class="cs-add cs-conds">
              <select data-csck title="Şart türü"><option value="not"${ck === 'not' ? ' selected' : ''}>🚫 olmadıysa</option><option value="had"${ck === 'had' ? ' selected' : ''}>📜 olduysa</option>${condParams().length ? `<option value="p"${ck === 'p' ? ' selected' : ''}>📊 parametre</option>` : ''}${condBools().length ? `<option value="b"${ck === 'b' ? ' selected' : ''}>🔘 durum</option>` : ''}</select>
              ${ck === 'p' ? `<select data-cscp>${condParams().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-cscop><option value=">=">≥</option><option value="<=">≤</option></select><input type="number" data-cscv value="50">`
                : ck === 'b' ? `<select data-cscb>${condBools().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-cscbv><option value="1">ise (Evet)</option><option value="0">değilse (Hayır)</option></select>`
                : `<select data-csce class="cond-ev">${evOptions('if', '', skip)}</select>`}
              <button type="button" class="chip" data-cscadd>🔒 Şart ekle</button></div>
          </div></div>`; }).join('')}
          ${sum < 100 ? `<div class="cs-out none"><div class="cs-bar"><i style="width:${100 - sum}%"></i><b>%${100 - sum}</b></div><div class="cs-body"><span>sonuç yok</span></div></div>` : sum > 100 ? `<div class="cs-warn">Toplam %${sum} · 100'ü geçmesin</div>` : ''}
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm cs-new" data-csnew>➕ Sonuç</button>${ui.ocClip ? `<button type="button" class="btn ghost sm" data-cspaste title="${esc(ui.ocClip.text || '')}">📥 Yapıştır</button>` : ''}</div></div></div>`;
    }
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('sonuc', '🎲', 'Sebep-Sonuç', [`${dr.params.length} parametre`, `${dr.triggers.length} eşik`, `${withOut.filter(e => !e.bot && !e.grp).length} olay`, dr.grps.length ? `${dr.grps.length} ortak` : ''], '', { back: '#/monia' })}
        <div class="mo-top sticky pg-bar"><button type="button" class="btn primary sm" id="prSave">💾 Kaydet</button></div>
        ${moTabs('sonuc')}

        <div class="card">
          <div class="sec-title" style="margin-top:0">📊 Parametreler <small>· 👤 her karakterin sana karşı değerleri ya da 🙋 senin değerlerin (ör. Zevk eşiği); olayların sonuçları artırır / azaltır</small></div>
          <div class="pr-list">${dr.params.map((p, i) => `<div class="pr-row" data-pi="${i}">
            <span class="cat-mv"><button type="button" data-pup aria-label="Yukarı">▲</button><button type="button" data-pdown aria-label="Aşağı">▼</button></span>
            <input class="pr-ic" data-pf="icon" maxlength="4" value="${esc(p.icon || '')}" placeholder="📊">
            <input class="pr-lb" data-pf="label" maxlength="24" value="${esc(p.label || '')}" placeholder="Parametre adı (ör. Aşk)">
            <select class="pr-who" data-pf="who" title="Kimin değeri"><option value="">👤 Karakter</option><option value="me"${p.who === 'me' ? ' selected' : ''}>🙋 Ben</option></select>
            <label class="pr-n"><small>en az</small><input type="number" data-pf="min" value="${num(p.min)}"></label>
            <label class="pr-n"><small>en çok</small><input type="number" data-pf="max" value="${num(p.max)}"></label>
            <label class="pr-n"><small>başlangıç</small><input type="number" data-pf="start" value="${num(p.start)}"></label>
            <button type="button" class="icon-btn" data-prm aria-label="Sil">🗑️</button></div>`).join('')}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="prAdd">➕ Parametre ekle</button>${MO().params ? '<button type="button" class="btn ghost sm" id="prReset">↺ Hazırlara dön</button>' : ''}</div>
          <div class="mo-vars">Olay editöründe her sonuca <b>📈 parametre</b> ekleyebilir ya da sonuç metnine özel kelime yazabilirsin: <code>{+Aşk}</code>, <code>{-Güven}</code>, <code>{+10 Şehvet}</code>.</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">⚡ Eşik olayları <small>· bir değer sınırı geçince olay hikayeye girer</small></div>
          <div class="tr-list">${dr.triggers.map((t, i) => `<div class="tr-row" data-ti="${i}">
            <select data-tf="p">${numParams.map(p => opt(p.id, t.p, p.label)).join('')}</select>
            <select data-tf="op">${opt('>=', t.op || '>=', '≥ yükselince')}${opt('<=', t.op, '≤ düşünce')}</select>
            <input type="number" data-tf="v" value="${num(t.v)}">
            <span class="tr-arrow">→</span>
            <select data-tf="ev" class="tr-ev">${evs.map(e => opt(e.id, t.ev, (e.emojis ? e.emojis + ' ' : '') + e.title)).join('')}</select>
            <button type="button" data-trm aria-label="Sil">✕</button></div>`).join('') || '<small class="mo-empty">Henüz yok. Ör. ❤️ Aşk ≥ 80 → İtiraf</small>'}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="trAdd"${numParams.length && evs.length ? '' : ' disabled'}>➕ Eşik olayı ekle</button></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🎲 Sebep → Sonuç <small>(${withOut.filter(e => !e.bot && !e.grp).length} olay)</small></div>
          <div class="mo-ev-btns" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="csAdd">➕ Bir olaya sonuç ekle</button></div>
          <div class="mo-vars" style="margin:0 0 8px">Yüzdeleri, metni, 📈 parametre / 🔘 durum etkilerini ve 🔒 şartları burada değiştirip üstteki <b>💾 Kaydet</b>'e bas. ⧉ çoğaltır, 📋 kopyalar; kopyaladığını başka bir olaya 📥 yapıştırabilirsin.</div>
          <div class="cs-list">${withOut.map((e, ei) => e.bot || e.grp ? '' : csItem(e, ei)).join('') || '<div class="about">Henüz sonucu olan olay yok. ➕ ile bir olay seç; olay editöründe 🎲 Sonuçlar kartından ekle.</div>'}</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🔗 Ortak sonuçlar <small>· birden çok olay aynı sonuçları paylaşır; burada bir kez düzenlersin, hepsinde geçerli olur</small></div>
          <div class="mo-ev-btns" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="csGrpAdd">➕ Ortak sonuç</button></div>
          <div class="cs-list">${withOut.map((e, ei) => e.grp ? csItem(e, ei) : '').join('') || '<div class="about">Henüz yok. ➕ ile olayları seç ya da bir olayın 🔗 Paylaş düğmesine bas.</div>'}</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🤖 Bot mesajı → Sonuç <small>· bot modunda bu kural cevap verince sonucu seçilir</small></div>
          <div class="mo-ev-btns" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="csBotAdd"${botRules().length ? '' : ' disabled'}>➕ Bot kuralına sonuç ekle</button><a class="btn ghost sm" href="#/bot">🤖 Bot editörü</a></div>
          <div class="cs-list">${withOut.map((e, ei) => e.bot ? csItem(e, ei) : '').join('') || `<div class="about">${botRules().length ? 'Henüz sonucu olan bot kuralı yok.' : 'Henüz bot kuralı yok. Yerel düzenlemede Ben → 💾 Veri → 🤖 Bot editörü.'}</div>`}</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">👥 Karakterlerin değerleri</div>
          ${allParams().some(p => p.who === 'me') ? `<div class="pv-char">${userAvatar(34)}<b>${esc(userName())}</b><div class="pv-bars">${pvBars(S().user, 'me')}</div>
            <button type="button" class="icon-btn" data-pvreset="me" title="Başlangıca döndür">↺</button></div>` : ''}
          ${chars().map(c => `<div class="pv-char">${avatar(c, 34)}<b>${esc(c.name)}</b>
            <div class="pv-bars">${pvBars(c)}</div>
            <button type="button" class="icon-btn" data-pvreset="${c.id}" title="Başlangıca döndür">↺</button></div>`).join('') || '<div class="about">Henüz karakter yok.</div>'}
        </div>
      </div>`;
    const draw = () => { const y = window.scrollY; renderCausePage(); window.scrollTo(0, y); };
    view.querySelectorAll('[data-pf]').forEach(inp => inp.oninput = () => {
      const p = dr.params[+inp.closest('[data-pi]').dataset.pi], f = inp.dataset.pf;
      p[f] = ['min', 'max', 'start'].includes(f) ? (inp.value === '' ? '' : +inp.value) : inp.value;
    });
    view.querySelectorAll('[data-tf]').forEach(inp => inp.onchange = () => {
      const t = dr.triggers[+inp.closest('[data-ti]').dataset.ti], f = inp.dataset.tf;
      t[f] = f === 'v' ? +inp.value : inp.value;
    });
    // sonuç taslağı: hangi olayın hangi sonucu
    const at = el => {
      const it = el.closest('[data-ei]'), e = withOut[+it.dataset.ei], ent = dr.outs[e.id], oj = el.closest('[data-oj]');
      return { e, ent, o: oj ? ent.list[+oj.dataset.oj] : null, j: oj ? +oj.dataset.oj : -1 };
    };
    const touch = el => { const { ent } = at(el); ent.dirty = true; el.closest('.cs-item').classList.add('dirty'); };
    view.querySelectorAll('[data-cst]').forEach(i => i.oninput = () => { at(i).o.text = i.value; touch(i); });
    view.querySelectorAll('[data-csp]').forEach(i => i.oninput = () => { at(i).o.pct = Math.max(0, Math.min(100, +i.value || 0)); touch(i); i.parentNode.querySelector('i').style.width = `${at(i).o.pct}%`; });
    view.querySelectorAll('[data-csnx]').forEach(i => i.onchange = () => { at(i).o.next = i.value; touch(i); });
    view.querySelectorAll('[data-csck]').forEach(i => i.onchange = () => { at(i).o._ck = i.value; draw(); });
    hashSelects(view);
    // 🔗 ortak sonuca olay ekle (bir olay tek bir ortak sonuçta olur)
    const grpAdd = (g, ids) => {
      dr.grps.forEach(x => { if (x !== g) x.evs = (x.evs || []).filter(id => !ids.includes(id)); });
      g.evs = [...new Set([...(g.evs || []), ...ids])];
      dr.grpDirty = true;
    };
    view.querySelectorAll('[data-csgt]').forEach(i => i.oninput = () => { at(i).e.grp.title = i.value; dr.grpDirty = true; });
    view.querySelectorAll('.cs-gin').forEach(i => hashSuggest(i, ev => { grpAdd(at(i).e.grp, [ev.id]); draw(); }, { whole: true, noSubs: true }));
    // seçip "📈 Ekle"ye basmadan kaydedersen de eklenir
    view.querySelectorAll('[data-csesel], [data-csedl]').forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => {
      const box = i.closest('.cs-add'), { o } = at(i);
      o._pend = { sel: box.querySelector('[data-csesel]').value, dl: +box.querySelector('[data-csedl]').value || 0 };
      touch(i);
    }));
    const addEff = (o, sel, dl) => {
      if (!sel) return;
      if (sel.includes('|')) (o.effects = o.effects || []).push({ p: sel.split('|')[0], d: sel.endsWith('|1') ? 1 : -1 });
      else if (dl) (o.effects = o.effects || []).push({ p: sel, d: dl });
      delete o._pend;
    };
    // olayın sonuçlarını yaz: kendi olayıysa günceller, hazır olaysa detaylı hali (base) oluşturur
    const setOutcomes = (e, outs) => {
      if (e.bot) { const bo = MO().botOuts = MO().botOuts || { ...botOuts }; if (outs.length) bo[e.bot.id] = outs; else delete bo[e.bot.id]; return; }
      if (e.grp) { e.grp.outs = outs; dr.grpDirty = true; return; }
      const own = MO().events.find(x => x.id === e.id);
      if (own) { own.outcomes = outs; return; }
      const copy = { id: Store.uid(), base: e.id };
      EV_FIELDS.forEach(k => { if (e[k] != null && e[k] !== '') copy[k] = JSON.parse(JSON.stringify(e[k])); });
      MO().events.push({ ...copy, text: e.text || '', cat: e.cat || 'mine', outcomes: outs });
    };
    view.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const ds = b.dataset, pr = b.closest('[data-pi]'), tr = b.closest('[data-ti]');
      if (b.id === 'prAdd') { dr.params.push({ id: 'u' + Store.uid(), icon: '📊', label: '', min: 0, max: 100, start: 0 }); draw(); const ins = view.querySelectorAll('.pr-lb'); ins[ins.length - 1].focus(); return; }
      if (pr && 'prm' in ds) { dr.params.splice(+pr.dataset.pi, 1); return draw(); }
      if (pr && ('pup' in ds || 'pdown' in ds)) {
        const i = +pr.dataset.pi, j = 'pup' in ds ? i - 1 : i + 1;
        if (j >= 0 && j < dr.params.length) [dr.params[i], dr.params[j]] = [dr.params[j], dr.params[i]];
        return draw();
      }
      if (b.id === 'prReset') { if (!confirm('Hazır parametrelere dönülsün mü?')) return; delete MO().params; save(); ui.paramDraft = null; return draw(); }
      if (b.id === 'trAdd') { dr.triggers.push({ id: Store.uid(), p: numParams[0].id, op: '>=', v: 80, ev: evs[0].id }); return draw(); }
      if (tr && 'trm' in ds) { dr.triggers.splice(+tr.dataset.ti, 1); return draw(); }
      if (ds.csed) {
        if (ds.csed.startsWith('bot:')) { location.hash = '#/bot'; return; }
        ui.moReturn = null; ui.evDraft = null; location.hash = `#/monia/olay/${encodeURIComponent(ds.csed)}`; return;
      }
      if (b.id === 'csBotAdd') {
        // 🤖 sonucu olmayan bot kuralları: seçince boş bir sonuçla listeye gelir
        const free = botRules().filter(r => !withOut.some(x => x.id === 'bot:' + r.id));
        if (!free.length) { notify('Bütün bot kurallarının sonucu var', '🤖'); return; }
        const sh = sheet(`<div class="sheet-grip"></div><h3>🤖 Hangi bot kuralı?</h3>
          <div class="mo-chips">${free.map(r => `<button type="button" class="mo-chip" data-botr="${esc(r.id)}" title="${esc((r.reply || []).join(' / '))}">🤖 ${esc(botEv(r).title)} <small>${esc((r.when || []).join(' · ') || 'yedek')}</small></button>`).join('')}</div>`, 'light');
        sh.el.onclick = ev => {
          const x = ev.target.closest('[data-botr]');
          if (!x) return;
          const e2 = botEv(free.find(r => r.id === x.dataset.botr));
          dr.outs[e2.id] = { list: [{ id: Store.uid(), text: '', pct: 100 }], dirty: true };
          sh.close(); draw();
        };
        return;
      }
      if (b.id === 'csAdd') return poolPicker({ title: '🎲 Sonuç eklenecek olay', noGroups: true, top: 'if' }, list => {
        list.forEach(e => { const ent = dr.outs[e.id] || (dr.outs[e.id] = { list: JSON.parse(JSON.stringify(e.outcomes || [])) }); ent.list.push({ id: Store.uid(), text: '', pct: Math.max(0, 100 - ent.list.reduce((n, o) => n + (+o.pct || 0), 0)) }); ent.dirty = true; });
        draw();
      });
      if (b.id === 'csGrpAdd') return poolPicker({ title: '🔗 Aynı sonucu paylaşacak olaylar', noGroups: true }, list => {
        if (!list.length) return;
        const g = { id: Store.uid(), title: list.length > 1 ? list.map(x => x.title).slice(0, 3).join(' / ') : `${list[0].title} sonuçları`, evs: [], outs: [] };
        dr.grps.push(g);
        grpAdd(g, list.map(x => x.id));
        dr.outs['grp:' + g.id] = { list: [{ id: Store.uid(), text: '', pct: 100 }], dirty: true };
        draw();
      });
      if (b.closest('[data-ei]') && ('csgdel' in ds || ds.csgrm || 'csgadd' in ds || 'csshare' in ds)) {
        const { e } = at(b);
        if ('csgdel' in ds) {
          if (!confirm(`“${e.grp.title || 'Ortak sonuç'}” silinsin mi? (Olaylar kendi sonuçlarına döner)`)) return;
          dr.grps.splice(dr.grps.indexOf(e.grp), 1); delete dr.outs[e.id]; dr.grpDirty = true;
        } else if (ds.csgrm) { e.grp.evs = e.grp.evs.filter(id => id !== ds.csgrm); dr.grpDirty = true; }
        else if ('csgadd' in ds) {
          return poolPicker({ title: '🔗 Bu ortak sonucu kullanacak olaylar', noGroups: true, skip: (e.grp.evs || []).map(id => (evById(id) || {}).title).filter(Boolean) }, list => { grpAdd(e.grp, list.map(x => x.id)); draw(); });
        } else {
          // 🔗 Paylaş: olayın sonuçlarından ortak sonuç kurulur, sonra başka olaylar eklenir
          const list = JSON.parse(JSON.stringify(draftOuts(e)));
          const g = { id: Store.uid(), title: `${e.title} sonuçları`, evs: [], outs: [] };
          dr.grps.push(g);
          grpAdd(g, [e.id]);
          dr.outs['grp:' + g.id] = { list, dirty: true };
          notify('Ortak sonuç kuruldu · 🔗 Ortak sonuçlar kartından olay ekle', '🔗');
        }
        return draw();
      }
      if (b.closest('[data-ei]') && !ds.csed) {
        const { e, ent, o, j } = at(b);
        if ('csnew' in ds) ent.list.push({ id: Store.uid(), text: '', pct: Math.max(0, 100 - ent.list.reduce((n, x) => n + (+x.pct || 0), 0)) });
        else if ('csorm' in ds) ent.list.splice(j, 1);
        else if ('csdup' in ds) { const cp = JSON.parse(JSON.stringify(o)); cp.id = Store.uid(); delete cp.def; ent.list.splice(j + 1, 0, cp); }
        else if ('cscopy' in ds) { ui.ocClip = JSON.parse(JSON.stringify(o)); delete ui.ocClip.def; notify('Sonuç kopyalandı · başka bir olayda 📥 Yapıştır', '📋'); return draw(); }
        else if ('cspaste' in ds) { if (!ui.ocClip) return; ent.list.push({ ...JSON.parse(JSON.stringify(ui.ocClip)), id: Store.uid() }); }
        else if (ds.cscrm != null) o.conds.splice(+ds.cscrm, 1);
        else if ('cscadd' in ds) {
          const box = b.closest('.cs-conds'), q = s => box.querySelector(`[${s}]`), k = o._ck || 'not';
          const cd = k === 'p' ? { k, p: q('data-cscp').value, op: q('data-cscop').value, v: +q('data-cscv').value || 0 }
            : k === 'b' ? { k, p: q('data-cscb').value, v: q('data-cscbv').value === '1' } : { k, ev: (q('data-csce') || {}).value };
          if ((k === 'had' || k === 'not') && !cd.ev) return;
          (o.conds = o.conds || []).push(cd);
        }
        else if ('csdef' in ds) { const on = !o.def; ent.list.forEach(x => { delete x.def; }); if (on) o.def = true; }
        else if (ds.cserm != null) o.effects.splice(+ds.cserm, 1);
        else if ('cseadd' in ds) { const box = b.closest('.cs-add'); addEff(o, box.querySelector('[data-csesel]').value, +box.querySelector('[data-csedl]').value || 0); }
        else return;
        ent.dirty = true;
        return draw();
      }
      if (ds.pvreset) { const c = ds.pvreset === 'me' ? S().user : byId(ds.pvreset); if (c && confirm(`${c === S().user ? userName() : c.name} için parametreler başlangıca dönsün mü?`)) { delete c.params; save(); draw(); } return; }
      if (b.id === 'prSave') {
        MO().params = dr.params.filter(p => String(p.label || '').trim()).map(p => ({ id: p.id || 'u' + Store.uid(), icon: String(p.icon || '').trim() || '📊', label: String(p.label).trim(),
          min: p.min === '' ? 0 : +p.min, max: p.max === '' ? 100 : +p.max, start: p.start === '' ? 0 : +p.start, ...(p.who === 'me' ? { who: 'me' } : {}) }));
        MO().triggers = dr.triggers.filter(t => t.p && t.ev && !isNaN(+t.v));
        // değiştirilen olay sonuçları
        let n = 0;
        for (const id of Object.keys(dr.outs)) {
          const ent = dr.outs[id], e = withOut.find(x => x.id === id) || evs.find(x => x.id === id);
          if (!ent.dirty || !e) continue;
          ent.list.forEach(o => { if (o._pend) addEff(o, o._pend.sel, o._pend.dl); });
          const outs = ent.list.map(o => ({ id: o.id || Store.uid(), text: String(o.text || '').trim(), pct: +o.pct || 0, next: o.next || '',
            ...((o.effects || []).length ? { effects: o.effects } : {}), ...((o.conds || []).length ? { conds: o.conds } : {}), ...(o.def ? { def: true } : {}) }))
            .filter(o => o.text || o.next || o.effects);
          if (outs.reduce((s, o) => s + o.pct, 0) > 100) { notify(`“${e.title}”: sonuçların toplamı %100'ü geçmesin`, '🎲'); return; }
          setOutcomes(e, outs);
          n++;
        }
        // 🔗 ortak sonuçlar: olayı kalmayanlar silinir
        if (dr.grpDirty) MO().sharedOuts = dr.grps.filter(g => (g.evs || []).length).map(g => ({ id: g.id, title: String(g.title || '').trim() || 'Ortak sonuç', evs: g.evs, outs: g.outs || [] }));
        save(); ui.paramDraft = null; notify(`Kaydedildi${n ? ` · ${n} olayın sonuçları` : ''}`, '💾'); draw();
      }
    };
  }

  // 🧺 Olay grupları paneli
  function renderGroupsPage() {
    const gs = evGroups(), draw = () => renderGroupsPage();
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('gruplar', '🧺', 'Olay grupları', [`${gs.length} grup`, `${gs.reduce((n, g) => n + groupEvents(g).length, 0)} olay`], '<button type="button" class="btn primary sm pg-act" id="grNew">➕ Yeni grup</button>', { back: '#/monia' })}
        ${moTabs('gruplar')}
        <div class="about card">Birden çok olayı tek grupta topla. Senaryoya ya da sohbete eklerken grubu seçince içindeki olayların hepsi gelir.</div>
        <div class="gr-grid">${gs.map(g => { const list = groupEvents(g); return `<button type="button" class="gr-card" data-gr="${esc(g.id)}">
          <div class="gr-h"><span class="gr-ic">${evEmo(g) || '🧺'}</span><span class="gr-t"><b>${esc(g.title)}</b><small>${list.length} olay</small></span><span class="gr-go">✏️</span></div>
          <div class="gr-evs">${list.slice(0, 10).map(e => `<span class="mo-chip${evCls(e)}"${evStyle(e)}>${evEmo(e)}${esc(e.title)}</span>`).join('')}${list.length > 10 ? `<span class="mo-chip">+${list.length - 10}</span>` : ''}</div></button>`; }).join('')
          || '<div class="empty"><span class="big">🧺</span>Henüz grup yok.<br>➕ Yeni grup ile olayları seçip bir grup kur.</div>'}</div>
      </div>`;
    $('#grNew').onclick = () => poolPicker({ title: '🧺 Gruptaki olayları seç', noGroups: true }, evs => evGroupSheet(null, draw, evs.map(x => x.id)));
    view.querySelectorAll('[data-gr]').forEach(b => b.onclick = () => evGroupSheet(evGroups().find(g => g.id === b.dataset.gr), draw));
  }

  function renderMonia(id, extra) {
    ['places', 'groups', 'events', 'scenarios'].forEach(k => { MO()[k] = MO()[k] || []; });
    if (id === 'olay') return renderEventEditor(extra);
    if (id === 'kategoriler') return renderCatPage();
    if (id === 'sonuc') return renderCausePage();
    if (id === 'gruplar') return renderGroupsPage();
    ui.moBack = null;
    if (!id) ui.paramDraft = null;
    const sc = id && MO().scenarios.find(s => s.id === id);
    if (id && !sc) { location.hash = '#/monia'; return; }
    if (sc) return renderScenario(sc);
    const usedTags = [...new Set(MO().scenarios.flatMap(s => s.tags || []))];
    const list = MO().scenarios.filter(s => !ui.storyTag || (s.tags || []).includes(ui.storyTag));
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('monia-panel', '🎬', 'Monia Paneli', [`${MO().scenarios.length} senaryo`, `${allEvents().length} olay`, `${moCats().length} kategori`], '<a class="btn primary sm pg-act" href="#/hikayeler">📚 Hikayeler</a>')}
        ${moTabs('')}
        <div class="home-hero mo-hero">
          <button class="hb hb-chat on" id="moRandom"><span class="hb-ic">🎲</span><b>Senaryo üret</b><small>zaman + mekan + olaylar</small></button>
          <button class="hb hb-monia on" id="moNew"><span class="hb-ic">✍️</span><b>Boş senaryo</b><small>kendin kur</small></button>
        </div>
        <div class="mo-stats">
          <a href="#mo-sc"><b>${MO().scenarios.length}</b><small>senaryo</small></a>
          <a href="#mo-pool"><b>${allEvents().length}</b><small>olay</small></a>
          <button type="button" id="moStatCats"><b>${moCats().length}</b><small>kategori</small></button>
          <button type="button" id="moStatGrp"><b>${evGroups().length}</b><small>grup</small></button>
        </div>
        <div class="mo-head" id="mo-sc"><div class="sec-title">Senaryolar <small>(${list.length})</small></div>
          <div class="mo-head-act">
            <button type="button" class="icon-chip" id="moExport"${MO().scenarios.length ? '' : ' disabled'} title="Dışa aktar (JSON)">📤</button>
            <button type="button" class="icon-chip" id="moImport" title="İçe aktar">📥</button>
          </div></div>
        ${usedTags.length ? `<div class="chips mo-filter">${tagChips(usedTags, ui.storyTag ? [ui.storyTag] : [], 'data-ftag')}</div>` : ''}
        ${list.length ? `<div class="mo-list">${list.map(s => `<a class="card mo-sc" href="#/monia/${s.id}">
            ${s.cover ? `<img class="mo-sc-cover" src="${esc(s.cover)}" alt="">` : `<div class="mo-sc-ic">${esc(scPlaceIcon(s))}</div>`}
            <div class="mo-sc-body"><b>${esc(s.title || 'Adsız senaryo')}</b>
              ${s.desc ? `<small class="mo-sc-desc">${esc(s.desc)}</small>` : ''}
              <small>${esc([scPlaceName(s), timeLabel(s)].filter(Boolean).join(' · ') || 'Zaman / mekan yok')}</small>
              <small>${s.events.length} olay${scChars(s).length ? ' · ' + esc(scChars(s).map(c => c.name).join(', ')) : ''}${(s.tags || []).length ? ' · 🏷️ ' + esc(s.tags.join(', ')) : ''}</small></div>
            <div class="mo-sc-avas">${scChars(s).slice(0, 3).map(c => avatar(c, 34)).join('')}</div></a>`).join('')}</div>`
          : '<div class="about card">Henüz senaryo yok. 🎲 ile rastgele üret ya da boş bir senaryo kur: zamanı, mekanı ve olayları seç, sonra ▶️ ile hikayeyi başlat. Olaylar sohbet ilerledikçe sırayla 📜 kart olarak gelir.</div>'}
        <div class="mo-head" id="mo-pool"><div class="sec-title">Olay havuzu <small>(${allEvents().length})</small></div></div>
        <div class="mo-tools">
          <button type="button" class="mo-tool primary" id="moEvNew"><span>➕</span>Yeni olay</button>
          <button type="button" class="mo-tool" id="moCats"><span>🗂️</span>Kategoriler</button>
          <button type="button" class="mo-tool" id="moLevels"><span>📶</span>Dereceler</button>
          <button type="button" class="mo-tool" id="moGroupNew"><span>🧺</span>Olay grupları</button>
        </div>
        <div class="mo-pool-bar">
          <label class="mo-search"><span>🔍</span><input type="search" id="moSearch" placeholder="Olay ara…" value="${esc(ui.moQuery || '')}"></label>
          <button type="button" class="icon-chip${ui.poolList ? ' on' : ''}" id="moPoolView" title="${ui.poolList ? 'Çip görünümü' : 'Açıklamalarla göster'}">${ui.poolList ? '🔘' : '≣'}</button>
          <button type="button" class="icon-chip${ui.catGroup ? ' on' : ''}" id="moCatGroup" title="${ui.catGroup ? 'Sırayla' : 'Etikete göre grupla'}">🏷️</button>
          <button type="button" class="icon-chip" id="moFoldAll" title="Hepsini katla / aç">⊟</button>
        </div>
        ${allEvTags().length ? `<div class="chips mo-filter" style="margin-top:10px">${tagChips(allEvTags(), ui.evTag ? [ui.evTag] : [], 'data-evf')}</div>` : ''}
        ${(ui.catGroup ? catGroups(moCats()).flatMap(g => g.cats.map((c, i) => ({ c, head: i ? null : g.tag ? `🏷️ ${g.tag}` : '📂 Etiketsiz' }))) : moCats().map(c => ({ c }))).map(({ c: cat, head }) => { const evs = poolOf(cat).filter(e => !ui.evTag || (e.tags || []).includes(ui.evTag)); return (head ? `<div class="mo-tagsec">${esc(head)}</div>` : '') + (evs.length || ((cat.id === 'mine' || cat.id.startsWith('c:')) && !ui.evTag) ? `
          <div class="mo-cat${moCatFold()[cat.id] ? ' folded' : ''}" data-cat="${esc(cat.id)}"><button type="button" class="mo-cat-head">${cat.icon} ${esc(cat.label)} <small>${evs.length}</small><i class="mo-chev">▾</i></button>
            ${ui.poolList && evs.length
              ? `<div class="mo-evlist">${evs.map(e => `<button type="button" class="mo-evrow${e.builtin ? '' : ' mine'}${evCls(e)}"${evStyle(e)} data-ev="${esc(e.id)}"><b>${evEmo(e)}${esc(e.title)}${levelOf(e) ? ` <em class="mo-tag">📶 ${esc(levelOf(e).label)}</em>` : ''}${(e.outcomes || []).length ? ' <em class="mo-tag">🎲</em>' : ''}</b>${e.desc || e.text ? `<small>${esc(e.desc || e.text)}</small>` : '<small class="none">açıklama yok · ekle</small>'}</button>`).join('')}</div>`
              : `<div class="mo-chips">${evs.map(e => `<button type="button" class="mo-chip${e.builtin ? '' : ' mine'}${e.desc ? ' has-desc' : ''}${evCls(e)}"${evStyle(e)} data-ev="${esc(e.id)}" title="${esc(e.desc || e.text || e.title)}">${evEmo(e)}${esc(e.title)}${(e.subs || []).length ? ` <small class="sub-n">🪜${e.subs.length}</small>` : ''}${(e.outcomes || []).length ? ' <small class="sub-n">🎲</small>' : ''}</button>`).join('') || '<small class="mo-empty">Bu kategoriye olay eklemek için ➕ Kalıp olay oluştur</small>'}</div>`}</div>` : ''); }).join('')}
      </div>`;
    $('#moRandom').onclick = () => addScenario(randomScenario());
    $('#moNew').onclick = () => addScenario({ id: Store.uid(), title: 'Yeni senaryo', chars: [], part: '', day: '', season: '', timeNote: '', place: '', placeName: '', placeIcon: '', events: [], created: Date.now() });
    $('#moEvNew').onclick = () => { ui.moReturn = null; location.hash = '#/monia/olay/yeni'; };
    $('#moCats').onclick = () => catSheet(render);
    $('#moLevels').onclick = () => levelSheet(render);
    $('#moGroupNew').onclick = () => { location.hash = '#/monia/gruplar'; };
    $('#moPoolView').onclick = () => { const y = window.scrollY; ui.poolList = !ui.poolList; render(); window.scrollTo(0, y); };
    $('#moCatGroup').onclick = () => { const y = window.scrollY; ui.catGroup = !ui.catGroup; render(); window.scrollTo(0, y); };
    $('#moExport').onclick = () => exportScenarios(list.length ? list : MO().scenarios);
    $('#moImport').onclick = importScenarios;
    view.querySelectorAll('[data-ftag]').forEach(b => b.onclick = () => { ui.storyTag = ui.storyTag === b.dataset.ftag ? '' : b.dataset.ftag; render(); });
    view.querySelectorAll('[data-evf]').forEach(b => b.onclick = () => { const y = window.scrollY; ui.evTag = ui.evTag === b.dataset.evf ? '' : b.dataset.evf; render(); window.scrollTo(0, y); });
    view.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => { ui.moReturn = null; location.hash = `#/monia/olay/${encodeURIComponent(b.dataset.ev)}`; });
    $('#moStatCats').onclick = () => catSheet(render);
    $('#moStatGrp').onclick = () => { location.hash = '#/monia/gruplar'; };
    view.querySelectorAll('.mo-stats a').forEach(a => a.onclick = e => { e.preventDefault(); const t = $(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    // kategoriler başlığa dokununca katlanır (bu tarayıcıda hatırlanır)
    view.querySelectorAll('.mo-cat[data-cat] > .mo-cat-head').forEach(h => h.onclick = () => {
      const box = h.parentNode, f = moCatFold();
      box.classList.toggle('folded');
      f[box.dataset.cat] = box.classList.contains('folded');
      moCatFold(f);
    });
    $('#moFoldAll').onclick = () => {
      const boxes = [...view.querySelectorAll('.mo-cat[data-cat]')], fold = boxes.some(b => !b.classList.contains('folded')), f = {};
      boxes.forEach(b => { b.classList.toggle('folded', fold); f[b.dataset.cat] = fold; });
      moCatFold(f);
    };
    // 🔍 olay arama: sayfa yeniden çizilmeden süzer, eşleşen kategoriler açılır
    const search = () => {
      const q = (ui.moQuery || '').toLocaleLowerCase('tr').trim();
      view.querySelectorAll('.mo-cat[data-cat]').forEach(box => {
        let n = 0;
        box.querySelectorAll('[data-ev]').forEach(b => { const hit = !q || b.textContent.toLocaleLowerCase('tr').includes(q); b.hidden = !hit; if (hit) n++; });
        box.hidden = !!q && !n;
        box.classList.toggle('searching', !!q);
      });
      view.querySelectorAll('.mo-tagsec').forEach(s => { let x = s.nextElementSibling, any = false; while (x && !x.classList.contains('mo-tagsec')) { if (!x.hidden) any = true; x = x.nextElementSibling; } s.hidden = !any; });
    };
    $('#moSearch').oninput = e => { ui.moQuery = e.target.value; search(); };
    if (ui.moQuery) search();
  }
  const moCatFold = v => { try { if (v) localStorage.setItem('amor-stories:monia-catfold', JSON.stringify(v)); return JSON.parse(localStorage.getItem('amor-stories:monia-catfold') || '{}'); } catch (e) { return v || {}; } };

  // ✍️ Olay editörü (#/monia/olay/<id | yeni>): başlık, kategori, ton, anlatım, olay akışı, açılış repliği, yazar notu.
  // Hazır bir olayı kaydedince detaylı hali onun yerine geçer (base); ui.moReturn = senaryo id -> kaydedince o senaryoya da eklenir.
  function renderEventEditor(rawId) {
    const id = rawId ? decodeURIComponent(rawId) : 'yeni';
    const base = id === 'yeni' ? null : allEvents().find(e => e.id === id) || MO().events.find(e => e.id === id);
    if (id !== 'yeni' && !base) { location.hash = '#/monia'; return; }
    const mine = base && !base.builtin;
    const back = ui.moReturn && MO().scenarios.some(s => s.id === ui.moReturn) ? `#/monia/${ui.moReturn}` : ui.moBack || '#/monia';
    const d = ui.evDraft && ui.evDraft.for === id ? ui.evDraft : (ui.evDraft = {
      for: id, title: base ? base.title : '', cat: base ? base.cat || 'mine' : 'mine', text: base ? base.text || '' : '',
      steps: base && base.steps ? [...base.steps] : [], opener: base ? base.opener || '' : '', starter: base ? base.starter || '' : '',
      tones: base && base.tones ? [...base.tones] : [], note: base ? base.note || '' : '',
      part: base ? base.part || '' : '', when: base ? base.when || '' : '', place: base ? base.place || '' : '',
      mix: base && base.mix ? [...base.mix] : [], tags: base && base.tags ? [...base.tags] : [], desc: base ? base.desc || '' : '',
      color: base ? base.color || '' : '', emojis: base ? base.emojis || '' : '', level: base ? base.level || '' : '',
      outcomes: base && base.outcomes ? JSON.parse(JSON.stringify(base.outcomes)) : [],
      subs: base && base.subs ? JSON.parse(JSON.stringify(base.subs)) : [], sub: base ? base.sub || '' : '',
      onEffects: base && base.onEffects ? JSON.parse(JSON.stringify(base.onEffects)) : [] });
    d.onEffects = d.onEffects || [];
    d.subs = d.subs || []; d.sub = d.sub || '';
    d.desc = d.desc || ''; d.color = d.color || ''; d.emojis = d.emojis || ''; d.level = d.level || ''; d.outcomes = d.outcomes || [];
    const pctSum = () => d.outcomes.reduce((n, o) => n + (+o.pct || 0), 0);
    d.mix = d.mix || []; d.tags = d.tags || [];
    const draw = () => renderEventEditor(rawId);
    const chip = (attr, val, label, on) => `<button type="button" class="chip mo-pick${on ? ' on' : ''}" ${attr}="${esc(val)}">${label}</button>`;
    const preview = () => evText(d, null).replace(/\n/g, '<br>');
    view.innerHTML = `
      <div class="page-pad narrow monia">
        <div class="mo-top sticky"><a class="icon-btn" href="${back}" id="evBack" aria-label="Geri">${ICON.arrowLeft}</a>
          <input id="evTitle" maxlength="50" value="${esc(d.title)}" placeholder="Olayın adı (ör. Sürpriz ziyaret)">
          <button type="button" class="btn primary sm" id="evSaveTop">💾 Kaydet</button></div>
        ${base && base.builtin ? '<div class="about card">Hazır olay. Kaydedince detaylı hali havuzda bunun yerine geçer (istersen sonra hazır haline dönebilirsin).</div>' : ''}

        <div class="card">
          <div class="sec-title" style="margin-top:0">🎨 Renk ve emoji <small>· en fazla iki emoji</small></div>
          <div class="ev-look">
            <span class="mo-chip ev-sample${evCls(d)}"${evStyle(d)}>${evEmo(d)}${esc(d.title || 'Olay')}</span>
            <input id="evEmo" maxlength="16" value="${esc(d.emojis)}" placeholder="🔥💋" inputmode="text">
          </div>
          <div class="ev-colors">${EV_COLORS.map(c => `<button type="button" class="ev-sw${d.color === c ? ' on' : ''}" data-ecolor="${c}" style="background:${c}" aria-label="Renk ${c}"></button>`).join('')}
            <label class="ev-sw ev-custom${d.color && !EV_COLORS.includes(d.color) ? ' on' : ''}" title="Kendi rengin"${d.color && !EV_COLORS.includes(d.color) ? ` style="background:${d.color}"` : ''}>🎨<input type="color" id="evColor" value="${isHex(d.color) ? d.color : '#8b5cf6'}"></label>
            <button type="button" class="ev-sw ev-none${d.color ? '' : ' on'}" data-ecolor="" aria-label="Renksiz">✕</button></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🪜 Alt dereceler <button type="button" class="pl-roll" id="evLevels" aria-label="📶 Dereceleri düzenle" title="📶 Dereceleri düzenle">✏️</button> <small>· aynı olayın çeşitleri (ör. Low-volume / Normal / High-volume); seçince olayın adı, metni, rengi ve 📶 canlılığı bu olur</small></div>
          <div class="mo-subs">${d.subs.map((s, i) => `<div class="mo-sub-row" data-sbi="${i}"${isHex(s.color) ? ` style="--sbc:${s.color}"` : ''}><span class="sb-n">${i + 1}</span><input class="sb-t" data-sbt="${i}" maxlength="60" value="${esc(s.title || '')}" placeholder="Alt derece adı (ör. Low-volume pre-cumming)"><input class="sb-x" data-sbx="${i}" maxlength="300" value="${esc(s.text || '')}" placeholder="Metni (boşsa olayın metni)"><button type="button" data-sbrm aria-label="Sil">✕</button>
            <div class="sb-look"><input class="sb-e" data-sbe="${i}" maxlength="16" value="${esc(s.emojis || '')}" placeholder="${esc(d.emojis || '🙂')}" title="Emoji (boşsa olayınki)">
              ${EV_COLORS.map(c => `<button type="button" class="ev-sw sm${s.color === c ? ' on' : ''}" data-sbcol="${c}" style="background:${c}" aria-label="Renk ${c}"></button>`).join('')}
              <label class="ev-sw sm ev-custom${s.color && !EV_COLORS.includes(s.color) ? ' on' : ''}"${s.color && !EV_COLORS.includes(s.color) ? ` style="background:${s.color}"` : ''} title="Kendi rengin">🎨<input type="color" data-sbc="${i}" value="${isHex(s.color) ? s.color : isHex(d.color) ? d.color : '#8b5cf6'}"></label>
              <button type="button" class="ev-sw sm ev-none${s.color ? '' : ' on'}" data-sbcol="" title="Olayın rengi">✕</button></div>
            ${(() => { const col = s.color || d.color, lvl = evLevels().find(l => l.id === s.level), auto = s.vivid == null || s.vivid === '', v = auto ? (lvl ? +lvl.vivid : 100) : +s.vivid; return `<div class="sb-viv">
              <span class="sb-lvs">${[{ id: '', label: 'Derecesiz', vivid: 100 }, ...evLevels()].map(l => `<button type="button" class="chip mo-pick lv-chip${(s.level || '') === l.id ? ' on' : ''}" data-sblvc="${esc(l.id)}"${isHex(col) ? ` style="--lvc:${vividHex(col, l.vivid)}"` : ''}>${l.id ? '📶 ' : ''}${esc(l.label)}</button>`).join('')}</span>
              <span class="sb-sample" data-sbs="${i}"${isHex(col) ? ` style="background:${vividHex(col, v)}"` : ''}></span>
              <label class="sb-range"><small>${auto ? 'canlılık: dereceden' : 'canlılık'}</small><input type="range" min="0" max="100" step="5" data-sbv="${i}" value="${v}"><b data-sbvv="${i}">%${v}</b></label>
              ${auto ? '' : '<button type="button" class="sb-auto" data-sbauto title="Dereceye göre">↺</button>'}</div>`; })()}</div>`).join('')}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="evSub">➕ Alt derece ekle</button></div>
          ${d.subs.length ? `<div class="sec-title">Varsayılan <small>· senaryoda ve sohbette; istersen eklerken yine seçebilirsin</small></div>
          <div class="chips"><button type="button" class="chip mo-pick${d.sub ? '' : ' on'}" data-sbdef="">🎲 Rastgele</button>${d.subs.map((s, i) => `<button type="button" class="chip mo-pick sb-chip${d.sub === s.id ? ' on' : ''}" data-sbdef="${esc(s.id)}"${evColor(withSub(d, s.id)) ? ` style="--sbc:${evColor(withSub(d, s.id))}"` : ''}>${esc(s.emojis ? s.emojis + ' ' : '')}${esc(s.title || `${i + 1}. derece`)}</button>`).join('')}</div>` : ''}
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">⚡ Olay olunca <small>· bu olay her gerçekleştiğinde uygulanır (sonuçtan sonra); ör. Condom → 🔘 Korunma → Evet, Creampie → 🔘 Korunma → Hayır</small></div>
          <div class="oc-eff on-eff">${d.onEffects.map((ef, j) => `<button type="button" class="chip mo-pick on" data-onrm="${j}" title="Kaldır">${esc(effLabel(ef))} ✕</button>`).join('')}
            ${evParams().length ? `<select data-onsel>${evParams().map(p => p.bool ? `<option value="${esc(p.id)}|1">🔘 ${esc(p.f.label)} → Evet</option><option value="${esc(p.id)}|0">🔘 ${esc(p.f.label)} → Hayır</option>` : `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><input type="number" data-ondl value="1" step="1" title="Miktar (aç/kapa durumlarda kullanılmaz)"><button type="button" class="chip" data-onadd>⚡ Ekle</button>` : ''}</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🎲 Sonuçlar <small>· neden → sonuç; olay sohbette gelince yüzdelere göre biri seçilir</small></div>
          ${base && sharedOf(base) ? `<div class="cs-note" style="margin-bottom:8px">🔗 Bu olay <b>${esc(sharedOf(base).title)}</b> ortak sonucunu kullanıyor; aşağıdakiler yerine o geçerli. <a href="#/monia/sonuc">Sebep-sonuç'ta düzenle</a></div>` : ''}
          <div class="mo-outs">${d.outcomes.map((o, i) => `<div class="mo-out" data-oi="${i}">
            <input class="oc-text" data-oc="${i}" maxlength="200" value="${esc(o.text || '')}" placeholder="Sonuç (ör. {ben} hamile kaldı)">
            <span class="oc-pct"><input type="number" class="oc-p" data-op="${i}" min="0" max="100" value="${+o.pct || 0}">%</span>
            <select class="oc-next" data-on="${i}"><option value="">↪ sonraki olay yok</option>${allEvents().filter(x => x.id !== (base && base.id)).map(x => `<option value="${esc(x.id)}"${o.next === x.id ? ' selected' : ''}>↪ ${esc((x.emojis ? x.emojis + ' ' : '') + x.title)}</option>`).join('')}</select>
            <button type="button" data-orm aria-label="Sil">✕</button>
            <button type="button" data-odup="${i}" title="Çoğalt">⧉</button>
            <button type="button" data-ocopy="${i}" title="Kopyala (başka olaya yapıştırmak için)">📋</button>
            <button type="button" class="chip oc-def${o.def ? ' on' : ''}" data-odef="${i}" title="Çıkan sonucun şartı tutmazsa bu sonuç olur">⭐ ${o.def ? 'Varsayılan sonuç' : 'Varsayılan yap'}</button>
            <div class="oc-eff">${(o.effects || []).map((ef, j) => `<button type="button" class="chip mo-pick on" data-erm="${i}:${j}" title="Kaldır">${esc(effLabel(ef))} ✕</button>`).join('')}
              ${evParams().length ? `<select data-epar="${i}">${evParams().map(p => p.bool ? `<option value="${esc(p.id)}|1">🔘 ${esc(p.f.label)} → Evet</option><option value="${esc(p.id)}|0">🔘 ${esc(p.f.label)} → Hayır</option>` : `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><input type="number" data-edel="${i}" value="1" step="1" title="Miktar (aç/kapa durumlarda kullanılmaz)"><button type="button" class="chip" data-eadd="${i}">📈 Ekle</button>` : ''}</div>
            <div class="oc-cond">${(o.conds || []).map((cd, j) => `<button type="button" class="chip mo-pick on cond-chip ${cd.k}" data-crm="${i}:${j}" title="Kaldır">${esc(condText(cd))} ✕</button>`).join('')}
              <select data-ck="${i}" title="Şart türü"><option value="not"${(o._ck || 'not') === 'not' ? ' selected' : ''}>🚫 olmadıysa</option><option value="had"${o._ck === 'had' ? ' selected' : ''}>📜 olduysa</option>${condParams().length ? `<option value="p"${o._ck === 'p' ? ' selected' : ''}>📊 parametre</option>` : ''}${condBools().length ? `<option value="b"${o._ck === 'b' ? ' selected' : ''}>🔘 durum</option>` : ''}</select>
              ${o._ck === 'p' ? `<select data-cp="${i}">${condParams().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-cop="${i}"><option value=">=">≥</option><option value="<=">≤</option></select><input type="number" data-cv="${i}" value="50">`
                : o._ck === 'b' ? `<select data-cb="${i}">${condBools().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-cbv="${i}"><option value="1">ise (Evet)</option><option value="0">değilse (Hayır)</option></select>`
                : `<select data-cev="${i}" class="cond-ev">${evOptions('if', '', base && base.id)}</select>`}
              <button type="button" class="chip" data-cadd="${i}">🔒 Şart ekle</button></div></div>`).join('')}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="evOut">➕ Sonuç ekle</button>${ui.ocClip ? `<button type="button" class="btn ghost sm" id="evPaste" title="${esc(ui.ocClip.text || '')}">📥 Yapıştır</button>` : ''}
            ${d.outcomes.length ? `<span class="oc-sum${pctSum() > 100 ? ' bad' : ''}" id="ocSum">Toplam %${pctSum()}${pctSum() < 100 ? ` · kalan %${100 - pctSum()}: sonuç yok` : pctSum() > 100 ? ' · 100\'ü geçmesin' : ''}</span>` : ''}</div>
          <div class="mo-vars">"↪ sonraki olay" seçersen o sonuç çıkınca seçtiğin olay hemen ardından tetiklenir.<br>🔒 Şart: sonuç ancak şartlar tutarsa olur, tutmazsa 🛡️ engellenir (ör. Hamile kaldı · 🚫 Condom olmadıysa). "Olduysa / olmadıysa" bu sohbette daha önce olan olaylara bakar.<br>
            📈 Parametre: sonuç çıkınca karakterin değeri artar / azalır (sayı ve seçim alanları 🧩, tek seçimli özellikler). Sonuç metnine özel kelime de yazabilirsin: ${evParams().slice(0, 2).map(p => `<code>{+${esc(p.name)}}</code>`).join(', ') || '<code>{+Experience}</code>'}, <code>{-2 Ad}</code>.</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">📝 Açıklama <small>· bu olay nedir, nasıl kullanılır; sohbette görünmez, havuzda ve seçerken görünür</small></div>
          <textarea class="mo-area" id="evDesc" rows="3" maxlength="1000" placeholder="ör. İlk buluşmanın sonunda, ikisi de çekingenken kullan.">${esc(d.desc)}</textarea>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🗂️ Kategori <button type="button" class="pl-roll" id="evCats" aria-label="Kategorileri düzenle">✏️</button></div>
          <div class="chips">${moCats().map(c => chip('data-cat', c.id, `${c.icon} ${esc(c.label)}`, d.cat === c.id)).join('')}</div>
          <div class="sec-title">🏷️ Etiketler</div>
          <div class="chips">${[...new Set([...allEvTags(), ...d.tags])].map(t => chip('data-etag', t, `🏷️ ${esc(t)}`, d.tags.includes(t))).join('')}</div>
          <div class="pl-own" style="margin-top:6px"><input class="mo-evtagin" maxlength="24" placeholder="Yeni etiket yaz ve Enter'a bas"></div>
          <div class="sec-title">🎭 Ton</div>
          <div class="chips">${(MD.tones || []).map(t => chip('data-tone', t, esc(t), d.tones.includes(t))).join('')}</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🧩 Eklemeler <small>· bu olayda birlikte olacaklar (tek satırda); açıklamasını aşağıya yaz</small></div>
          ${mixRow(d.mix)}
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🕰️ Zaman ve 📍 Mekan <small>· isteğe bağlı; boşsa senaryonunki geçerli</small></div>
          <div class="chips">${MD.parts.map(p => chip('data-epart', p.id, `${p.icon} ${esc(p.label)}`, d.part === p.id)).join('')}</div>
          <div class="field"><input id="evWhen" maxlength="60" value="${esc(d.when)}" placeholder="Zaman notu (ör. ertesi sabah, iki saat sonra)"></div>
          <div class="field"><select id="evPlace" class="mo-select"><option value="">📍 Senaryonun mekanı</option>
            ${allGroups().map(g => { const ps = allPlaces().filter(p => inGroup(p, g)); return ps.length ? `<optgroup label="${esc(g.icon + ' ' + g.name)}">${ps.map(p => `<option value="${esc(p.id)}"${d.place === p.id ? ' selected' : ''}>${esc(p.icon + ' ' + p.name)}</option>`).join('')}</optgroup>` : ''; }).join('')}
          </select></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">📖 Olay metni <small>· sohbette 📜 kartta görünür</small></div>
          <textarea class="mo-area" id="evText" rows="6" maxlength="2000" placeholder="Ne oluyor? Ortam, his, ayrıntılar… ör. {ben} haber vermeden kapıda beliriyor; elinde bir şişe şarap var, yüzü kızarmış.">${esc(d.text)}</textarea>
          <div class="mo-vars">Değişkenler: <code>{ben}</code> karakter · <code>{sen}</code> sen · <code>{mekan}</code> · <code>{zaman}</code></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🪜 Olay akışı <small>· adım adım ne olacak</small></div>
          <div class="mo-steps">${d.steps.map((s, i) => `<div class="mo-step" data-si="${i}"><span class="n">${i + 1}</span>
            <input data-step="${i}" maxlength="300" value="${esc(s)}" placeholder="ör. {sen} kapıyı açıyor">
            ${i > 0 ? '<button type="button" data-sup aria-label="Yukarı">⬆️</button>' : ''}<button type="button" data-srm aria-label="Sil">✕</button></div>`).join('')}</div>
          <button type="button" class="btn ghost sm" id="evStep">➕ Adım ekle</button>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">💬 Açılış</div>
          <div class="chips">${[['ben', '👤 Karakter başlar'], ['sen', '🙋 Sen başlarsın'], ['', '📝 Anlatım']].map(([k, l]) => chip('data-starter', k, l, d.starter === k)).join('')}</div>
          <div class="field"><input id="evOpener" maxlength="300" value="${esc(d.opener)}" placeholder="İlk replik (ör. kapıyı açacak mısın yoksa burada mı bekleyeyim?)"></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🔒 Yazar notu <small>· sadece burada görünür</small></div>
          <textarea class="mo-area" id="evNote" rows="3" maxlength="1000" placeholder="Kendine hatırlatma, fikirler…">${esc(d.note)}</textarea>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">👁️ Sohbette böyle görünecek</div>
          <div class="scene-card sc-hint mo-prev${evCls(d)}"${evStyle(d)}><div class="sc-ic">${esc(d.emojis || '📜')}</div><div class="sc-body"><small>📜 Olay · ${esc(d.title || 'Adsız')}${evPlace(d) ? ` · ${esc(evPlace(d).icon + ' ' + evPlace(d).name)}` : ''}</small><span id="evPrev">${preview()}</span></div></div>
        </div>

        <button class="btn primary block" id="evSave" style="margin-top:6px">${mine ? 'Kaydet' : ui.moReturn ? 'Kaydet ve senaryoya ekle' : 'Havuza ekle'}</button>
        ${mine && base.base ? '<button class="btn ghost block" id="evReset" style="margin-top:8px">↩️ Hazır haline dön</button>' : ''}
        ${mine ? '<button class="btn ghost block" id="evDel" style="margin-top:8px;color:#ff2d55">🗑️ Olayı sil</button>' : ''}
      </div>`;

    hashSelects(view);
    const live = () => { const p = $('#evPrev'); if (p) p.innerHTML = preview(); };
    const bindIn = (sel, k) => { $(sel).oninput = e => { d[k] = e.target.value; live(); }; };
    bindIn('#evDesc', 'desc');
    // sadece emojiler kalır, en fazla iki. Sayfayı yeniden çizmeden günceller (yoksa hemen ardından Kaydet'e basınca tıklama kaçıyordu)
    const look = () => {
      const s = $('.ev-sample'), p = $('.mo-prev');
      [s, p].forEach(el => { el.classList.toggle('has-color', !!evColor(d)); el.style.setProperty('--evc', evColor(d)); });
      s.textContent = `${d.emojis ? d.emojis + ' ' : ''}${d.title || 'Olay'}`;
      p.querySelector('.sc-ic').textContent = d.emojis || '📜';
    };
    $('#evEmo').oninput = e => { d.emojis = twoEmojis(e.target.value); look(); };
    $('#evEmo').onchange = e => { e.target.value = d.emojis; };
    $('#evColor').oninput = e => { d.color = e.target.value; look(); };
    $('#evColor').onchange = e => { d.color = e.target.value; look(); view.querySelectorAll('.ev-sw').forEach(b => b.classList.toggle('on', b.classList.contains('ev-custom'))); };
    $('#evCats').onclick = () => catSheet(draw);
    $('#evLevels').onclick = () => levelSheet(draw, isHex(d.color) ? d.color : '#ff5f5f');
    // 🎲 sonuçlar: yazarken sayfa yeniden çizilmez
    const sumEl = () => { const el = $('#ocSum'), s = pctSum(); if (el) { el.textContent = `Toplam %${s}${s < 100 ? ` · kalan %${100 - s}: sonuç yok` : s > 100 ? " · 100'ü geçmesin" : ''}`; el.classList.toggle('bad', s > 100); } };
    view.querySelectorAll('[data-oc]').forEach(i => i.oninput = () => { d.outcomes[+i.dataset.oc].text = i.value; });
    view.querySelectorAll('[data-sbt]').forEach(i => i.oninput = () => { d.subs[+i.dataset.sbt].title = i.value; });
    view.querySelectorAll('[data-sbx]').forEach(i => i.oninput = () => { d.subs[+i.dataset.sbx].text = i.value; });
    view.querySelectorAll('[data-sbe]').forEach(i => i.oninput = () => { d.subs[+i.dataset.sbe].emojis = i.value; });
    view.querySelectorAll('[data-sbc]').forEach(i => i.onchange = () => { d.subs[+i.dataset.sbc].color = i.value; draw(); });
    // canlılık kaydırıcısı sayfayı yeniden çizmeden örnek rengi günceller
    view.querySelectorAll('[data-sbv]').forEach(i => i.oninput = () => {
      const k = +i.dataset.sbv, s = d.subs[k], col = s.color || d.color;
      s.vivid = +i.value;
      view.querySelector(`[data-sbvv="${k}"]`).textContent = `%${i.value}`;
      const sm = view.querySelector(`[data-sbs="${k}"]`);
      if (sm && isHex(col)) sm.style.background = vividHex(col, +i.value);
    });
    view.querySelectorAll('[data-sbv]').forEach(i => i.onchange = () => draw());
    view.querySelectorAll('[data-op]').forEach(i => i.oninput = () => { d.outcomes[+i.dataset.op].pct = Math.max(0, Math.min(100, +i.value || 0)); sumEl(); });
    view.querySelectorAll('[data-on]').forEach(i => i.onchange = () => { d.outcomes[+i.dataset.on].next = i.value; });
    view.querySelectorAll('[data-ck]').forEach(i => i.onchange = () => { d.outcomes[+i.dataset.ck]._ck = i.value; draw(); });
    // ⚡ olunca etkisi: seçip Ekle'ye basmadan kaydedersen de eklenir
    const onNow = () => ({ sel: ($('[data-onsel]') || {}).value, dl: +($('[data-ondl]') || {}).value || 0 });
    const addOnFx = (pd = onNow()) => {
      d._onPend = null;
      if (!pd.sel) return;
      if (pd.sel.includes('|')) d.onEffects.push({ p: pd.sel.split('|')[0], d: pd.sel.endsWith('|1') ? 1 : -1 });
      else if (pd.dl) d.onEffects.push({ p: pd.sel, d: pd.dl });
    };
    view.querySelectorAll('[data-onsel], [data-ondl]').forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => { d._onPend = onNow(); }));
    // parametreyi seçip "📈 Ekle"ye basmadan kaydedersen de eklenir
    view.querySelectorAll('[data-epar], [data-edel]').forEach(i => i.addEventListener(i.tagName === 'SELECT' ? 'change' : 'input', () => {
      const k = i.dataset.epar || i.dataset.edel;
      d.outcomes[+k]._pend = { sel: view.querySelector(`[data-epar="${k}"]`).value, dl: +view.querySelector(`[data-edel="${k}"]`).value || 0 };
    }));
    bindIn('#evTitle', 'title'); bindIn('#evText', 'text'); bindIn('#evOpener', 'opener'); bindIn('#evNote', 'note'); bindIn('#evWhen', 'when');
    $('#evPlace').onchange = e => { d.place = e.target.value; draw(); };
    const tagIn = view.querySelector('.mo-evtagin');
    tagIn.onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const v = tagIn.value.trim();
      const t = v && (allEvTags().find(x => x.toLocaleLowerCase('tr') === v.toLocaleLowerCase('tr')) || v);
      if (t && !d.tags.includes(t)) { keepTag('evTagList', t); save(); d.tags.push(t); draw(); view.querySelector('.mo-evtagin').focus(); }
    };
    const mixIn = view.querySelector('.mo-mixin');
    mixIn.onkeydown = e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const v = mixIn.value.trim();
      if (v && !d.mix.includes(v)) { d.mix.push(v); draw(); view.querySelector('.mo-mixin').focus(); }
    };
    view.querySelectorAll('[data-step]').forEach(inp => inp.oninput = () => { d.steps[+inp.dataset.step] = inp.value; live(); });
    $('#evBack').onclick = () => { ui.evDraft = null; };
    view.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const ds = b.dataset;
      if (ds.cat) { d.cat = ds.cat; return draw(); }
      if ('ecolor' in ds) { d.color = ds.ecolor; return draw(); }
      if (b.id === 'evOut') { d.outcomes.push({ id: Store.uid(), text: '', pct: Math.max(0, 100 - pctSum()), next: '' }); draw(); const ins = view.querySelectorAll('[data-oc]'); ins[ins.length - 1].focus(); return; }
      if ('orm' in ds) { d.outcomes.splice(+b.closest('[data-oi]').dataset.oi, 1); return draw(); }
      if (ds.odup != null) { const cp = JSON.parse(JSON.stringify(d.outcomes[+ds.odup])); cp.id = Store.uid(); delete cp.def; d.outcomes.splice(+ds.odup + 1, 0, cp); return draw(); }
      if (ds.ocopy != null) { ui.ocClip = JSON.parse(JSON.stringify(d.outcomes[+ds.ocopy])); delete ui.ocClip.def; notify('Sonuç kopyalandı · başka bir olayda 📥 Yapıştır', '📋'); return draw(); }
      if (b.id === 'evPaste' && ui.ocClip) { d.outcomes.push({ ...JSON.parse(JSON.stringify(ui.ocClip)), id: Store.uid() }); return draw(); }
      if (b.id === 'evSub') { d.subs.push({ id: Store.uid(), title: '', text: '' }); draw(); const ins = view.querySelectorAll('[data-sbt]'); ins[ins.length - 1].focus(); return; }
      if ('sbrm' in ds) { const s = d.subs.splice(+b.closest('[data-sbi]').dataset.sbi, 1)[0]; if (s && d.sub === s.id) d.sub = ''; return draw(); }
      if ('sbdef' in ds) { d.sub = ds.sbdef; return draw(); }
      if (ds.onrm != null) { d.onEffects.splice(+ds.onrm, 1); return draw(); }
      if ('onadd' in ds) { addOnFx(); return draw(); }
      if ('sbcol' in ds) { d.subs[+b.closest('[data-sbi]').dataset.sbi].color = ds.sbcol; return draw(); }
      if ('sblvc' in ds) { const s = d.subs[+b.closest('[data-sbi]').dataset.sbi]; s.level = ds.sblvc; delete s.vivid; return draw(); }
      if ('sbauto' in ds) { delete d.subs[+b.closest('[data-sbi]').dataset.sbi].vivid; return draw(); }
      if (ds.eadd != null) {
        const o = d.outcomes[+ds.eadd], sel = view.querySelector(`[data-epar="${ds.eadd}"]`).value, dl = +view.querySelector(`[data-edel="${ds.eadd}"]`).value || 0;
        // 🔘 aç/kapa: "f:hamile|1" → Evet, "|0" → Hayır
        if (sel.includes('|')) (o.effects = o.effects || []).push({ p: sel.split('|')[0], d: sel.endsWith('|1') ? 1 : -1 });
        else if (dl) (o.effects = o.effects || []).push({ p: sel, d: dl });
        delete o._pend;
        return draw();
      }
      if (ds.erm) { const [i, j] = ds.erm.split(':').map(Number); d.outcomes[i].effects.splice(j, 1); return draw(); }
      if (ds.odef != null) { const i = +ds.odef, on = !d.outcomes[i].def; d.outcomes.forEach(o => { delete o.def; }); if (on) d.outcomes[i].def = true; return draw(); }
      if (ds.crm) { const [i, j] = ds.crm.split(':').map(Number); d.outcomes[i].conds.splice(j, 1); return draw(); }
      if (ds.cadd != null) {
        const i = ds.cadd, o = d.outcomes[+i], k = o._ck || 'not', q = s => view.querySelector(`[${s}="${i}"]`);
        const cd = k === 'p' ? { k, p: q('data-cp').value, op: q('data-cop').value, v: +q('data-cv').value || 0 }
          : k === 'b' ? { k, p: q('data-cb').value, v: q('data-cbv').value === '1' } : { k, ev: (q('data-cev') || {}).value };
        if ((k === 'had' || k === 'not') && !cd.ev) return;
        (o.conds = o.conds || []).push(cd);
        return draw();
      }
      if (ds.epart) { d.part = d.part === ds.epart ? '' : ds.epart; return draw(); }
      if (ds.etag) { d.tags = d.tags.includes(ds.etag) ? d.tags.filter(t => t !== ds.etag) : [...d.tags, ds.etag]; return draw(); }
      if (ds.mixrm != null) { d.mix.splice(+ds.mixrm, 1); return draw(); }
      if ('mixadd' in ds) return poolPicker({ title: '🧩 Eklemeler', skip: [...d.mix, d.title] }, evs => { evs.forEach(x => { if (!d.mix.includes(x.title)) d.mix.push(x.title); }); draw(); });
      if (ds.tone) { d.tones = d.tones.includes(ds.tone) ? d.tones.filter(t => t !== ds.tone) : [...d.tones, ds.tone]; return draw(); }
      if ('starter' in ds) { d.starter = ds.starter; return draw(); }
      if (b.id === 'evStep') { d.steps.push(''); draw(); const ins = view.querySelectorAll('[data-step]'); ins[ins.length - 1].focus(); return; }
      const row = b.closest('[data-si]');
      if (row) {
        const i = +row.dataset.si;
        if ('srm' in ds) d.steps.splice(i, 1);
        if ('sup' in ds) [d.steps[i - 1], d.steps[i]] = [d.steps[i], d.steps[i - 1]];
        return draw();
      }
    };
    $('#evSave').onclick = () => {
      if (d._onPend) addOnFx(d._onPend);
      d.outcomes.forEach(o => {
        const p = o._pend;
        if (!p || !p.sel) return;
        if (p.sel.includes('|')) (o.effects = o.effects || []).push({ p: p.sel.split('|')[0], d: p.sel.endsWith('|1') ? 1 : -1 });
        else if (p.dl) (o.effects = o.effects || []).push({ p: p.sel, d: p.dl });
        delete o._pend;
      });
      const data = { title: d.title.trim(), cat: d.cat, text: d.text.trim(), steps: d.steps.map(s => s.trim()).filter(Boolean),
        opener: d.opener.trim(), starter: d.starter, tones: d.tones, note: d.note.trim(), part: d.part, when: (d.when || '').trim(), place: d.place, mix: d.mix, tags: d.tags, desc: d.desc.trim(), color: isHex(d.color) ? d.color : '', emojis: twoEmojis(d.emojis), level: '',
        outcomes: d.outcomes.map(o => ({ id: o.id || Store.uid(), text: String(o.text || '').trim(), pct: +o.pct || 0, next: o.next || '', ...((o.effects || []).length ? { effects: o.effects } : {}), ...((o.conds || []).length ? { conds: o.conds } : {}), ...(o.def ? { def: true } : {}) })).filter(o => o.text || o.next || o.effects),
        subs: d.subs.map(s => ({ id: s.id || Store.uid(), title: String(s.title || '').trim(), text: String(s.text || '').trim(),
          ...(isHex(s.color) ? { color: s.color } : {}), ...(twoEmojis(s.emojis) ? { emojis: twoEmojis(s.emojis) } : {}),
          ...(s.level ? { level: s.level } : {}), ...(s.vivid != null && s.vivid !== '' ? { vivid: +s.vivid } : {}) })).filter(s => s.title) };
      data.sub = data.subs.some(s => s.id === d.sub) ? d.sub : '';
      data.onEffects = d.onEffects;
      if (data.outcomes.reduce((n, o) => n + o.pct, 0) > 100) { notify("Sonuçların toplamı %100'ü geçmesin", '🎲'); return; }
      if (!data.title && !data.text && !data.mix.length) { notify('Bir başlık, olay ya da ekleme yaz', '✍️'); return; }
      data.title = data.title || (data.mix.length ? data.mix.join(' + ') : data.text.replace(/\{\w+\}/g, '').trim().slice(0, 30));
      let saved;
      if (mine) saved = Object.assign(MO().events.find(x => x.id === base.id), data);
      else {
        saved = { id: Store.uid(), ...data };
        if (base && base.builtin) saved.base = base.id;
        MO().events.push(saved);
      }
      const sc = ui.moReturn && MO().scenarios.find(s => s.id === ui.moReturn);
      if (sc && !mine) sc.events.push(evCopy(saved));
      save();
      ui.evDraft = null;
      notify(sc && !mine ? 'Olay kaydedildi ve senaryoya eklendi' : 'Olay kaydedildi', '🎬');
      location.hash = sc ? `#/monia/${sc.id}` : ui.moBack || '#/monia';
    };
    $('#evSaveTop').onclick = () => $('#evSave').click();
    const del = $('#evDel'), reset = $('#evReset');
    const remove = msg => () => {
      if (!confirm(msg)) return;
      MO().events = MO().events.filter(x => x.id !== base.id);
      save(); ui.evDraft = null; location.hash = back;
    };
    if (del) del.onclick = remove('Bu olay silinsin mi? (Senaryolardaki kopyaları kalır)');
    if (reset) reset.onclick = remove('Detaylı hali silinip hazır olay geri gelsin mi?');
  }

  // 🗂️ Olay kategorilerini yönet: hazırların adı / simgesi değişir, yenileri eklenir / silinir (olayları "Kalıplarım"a geçer)
  // Pencerenin üstüne sabit bir "Kaydet" çubuğu koyar (aşağıdaki kaydet düğmesiyle aynı işi yapar)
  function topSave(sh, fn, label = '💾 Kaydet') {
    const bar = document.createElement('div');
    bar.className = 'top-save';
    bar.innerHTML = `<button type="button" class="btn primary sm">${label}</button>`;
    sh.el.insertBefore(bar, sh.el.firstChild);
    bar.firstChild.onclick = fn;
  }

  // 🗂️ Kategoriler paneli (#/monia/kategoriler): kategoriler ilk etiketlerine göre gruplu görünür.
  // Etiket ekleme / silme, yeni kategori ve silme hemen kaydedilir; ad ve simge 💾 Kaydet ile.
  const catGroups = cats => {
    const out = [];
    cats.forEach(c => {
      const k = (c.tags || [])[0] || '';
      let g = out.find(x => x.tag === k);
      if (!g) out.push(g = { tag: k, cats: [] });
      g.cats.push(c);
    });
    return out.sort((a, b) => !a.tag - !b.tag);
  };
  const allCatTags = () => [...new Set(moCats().flatMap(c => c.tags || []))];
  function catSheet() {
    ui.catReturn = location.hash || '#/monia';
    location.hash = '#/monia/kategoriler';
  }
  function renderCatPage() {
    const base = [...MD.cats, MINE];
    const back = ui.catReturn && ui.catReturn !== '#/monia/kategoriler' ? ui.catReturn : '#/monia';
    const row = c => `<div class="cat-row" data-cid="${esc(c.id)}">
      <span class="cat-mv"><button type="button" data-catup aria-label="Yukarı">▲</button><button type="button" data-catdown aria-label="Aşağı">▼</button></span>
      <input class="cat-ic" maxlength="4" value="${esc(c.icon)}"><input class="cat-lb" maxlength="30" value="${esc(c.label)}">
      ${base.some(b => b.id === c.id) ? '<small>hazır</small>' : '<button type="button" class="icon-btn" data-catdel aria-label="Sil">🗑️</button>'}
      <div class="cat-tags">${(c.tags || []).map(t => `<button type="button" class="chip mo-pick on" data-tagrm="${esc(t)}" title="Kaldır">🏷️ ${esc(t)} ✕</button>`).join('')}
        <input class="cat-tgin" maxlength="24" list="catTagList" placeholder="+ etiket, Enter"></div>
      <small class="cat-n">${poolOf(c).length} olay</small></div>`;
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('kategoriler', '🗂️', 'Kategoriler', [`${moCats().length} kategori`, `${allCatTags().length} etiket`, `${allEvents().length} olay`], '', { back })}
        <div class="mo-top sticky pg-bar"><button type="button" class="btn primary sm" id="catSave">💾 Kaydet</button></div>
        <div class="about card">Adını, simgesini, 🏷️ etiketlerini ve ▲▼ ile sırasını değiştir. Kategoriler <b>ilk etiketlerine göre</b> gruplanır. Sistem kaydı açıksa bunlar da <b>js/data/system.js</b>'e yazılır.</div>
        <datalist id="catTagList">${[...new Set([EVENT_TAG, ...allCatTags()])].map(t => `<option value="${esc(t)}">`).join('')}</datalist>
        ${catGroups(moCats()).map(g => `<div class="card cat-sec">
          <div class="mo-cat-head">${g.tag ? `🏷️ ${esc(g.tag)}` : '📂 Etiketsiz'} <small>${g.cats.length}</small></div>
          <div class="cat-list">${g.cats.map(row).join('')}</div></div>`).join('')}
        <div class="card cat-sec">
          <div class="mo-cat-head">➕ Yeni kategori</div>
          <div class="pl-own"><input id="catNewIc" maxlength="4" placeholder="🗂️"><input id="catNewLb" maxlength="30" placeholder="ör. Ofis olayları"></div>
          <input id="catNewTg" maxlength="60" list="catTagList" placeholder="🏷️ etiketler (virgülle, ör. ${EVENT_TAG})" style="margin-top:8px;width:100%">
          <button type="button" class="btn ghost block" id="catAdd" style="margin-top:8px">Ekle</button>
        </div>
      </div>`;
    const el = view;
    const draw = (focusId) => {
      const y = window.scrollY;
      renderCatPage();
      window.scrollTo(0, y);
      const inp = focusId && view.querySelector(`.cat-row[data-cid="${CSS.escape(focusId)}"] .cat-tgin`);
      if (inp) inp.focus();
    };
    const apply = () => {
      const mo = MO();
      mo.cats = mo.cats || []; mo.catEdits = mo.catEdits || {};
      el.querySelectorAll('.cat-row').forEach(r => {
        const id = r.dataset.cid, icon = r.querySelector('.cat-ic').value.trim() || '🗂️', label = r.querySelector('.cat-lb').value.trim() || 'Adsız';
        const pending = r.querySelector('.cat-tgin').value.split(',').map(t => t.trim());
        const tags = [...new Set([...[...r.querySelectorAll('[data-tagrm]')].map(b => b.dataset.tagrm), ...pending].filter(Boolean))];
        const own = mo.cats.find(c => c.id === id), orig = base.find(c => c.id === id);
        if (own) Object.assign(own, { icon, label, tags });
        else if (orig) {
          if (icon === orig.icon && label === orig.label && tags.join('|') === (orig.tags || []).join('|')) delete mo.catEdits[id];
          else mo.catEdits[id] = { icon, label, tags };
        }
      });
      mo.catOrder = [...el.querySelectorAll('.cat-row')].map(r => r.dataset.cid);
    };
    el.querySelectorAll('.cat-tgin').forEach(inp => inp.onkeydown = e => {
      if (e.key !== 'Enter' && e.key !== ',') return;
      e.preventDefault();
      if (!inp.value.trim()) return;
      apply(); save(); draw(inp.closest('.cat-row').dataset.cid);
    });
    el.onclick = e => {
      const mv = e.target.closest('[data-catup], [data-catdown]');
      if (mv) {
        const r = mv.closest('.cat-row');
        if ('catup' in mv.dataset && r.previousElementSibling) r.parentNode.insertBefore(r, r.previousElementSibling);
        if ('catdown' in mv.dataset && r.nextElementSibling) r.parentNode.insertBefore(r.nextElementSibling, r);
        return;
      }
      const rm = e.target.closest('[data-tagrm]');
      if (rm) { const cid = rm.closest('.cat-row').dataset.cid; rm.remove(); apply(); save(); draw(cid); return; }
      if (e.target.closest('#catAdd')) {
        const label = el.querySelector('#catNewLb').value.trim();
        if (!label) { notify('Kategoriye bir ad ver', '🗂️'); return; }
        apply();
        const tags = [...new Set(el.querySelector('#catNewTg').value.split(',').map(t => t.trim()).filter(Boolean))];
        MO().cats.push({ id: 'c:' + Store.uid(), icon: el.querySelector('#catNewIc').value.trim() || '🗂️', label, tags });
        save(); draw();
        return;
      }
      const del = e.target.closest('[data-catdel]');
      if (del) {
        const id = del.closest('.cat-row').dataset.cid, n = MO().events.filter(x => x.cat === id).length;
        if (!confirm(`Kategori silinsin mi?${n ? ` İçindeki ${n} olay "Kalıplarım"a geçer.` : ''}`)) return;
        apply();
        MO().cats = MO().cats.filter(c => c.id !== id);
        MO().events.forEach(x => { if (x.cat === id) x.cat = 'mine'; });
        save(); draw();
        return;
      }
      if (e.target.closest('#catSave')) { apply(); save(); notify('Kategoriler kaydedildi', '🗂️'); location.hash = back; }
    };
  }

  // 🧺 Olay grupları: birden çok olay tek grupta; senaryoya grup eklenince içindeki olayların hepsi gelir
  const evGroups = () => MO().evGroups = MO().evGroups || [];
  const groupEvents = g => (g.items || []).map(id => allEvents().find(x => x.id === id)).filter(Boolean);
  function evGroupSheet(g, done, items) {
    const cur = g ? { ...g, items: [...(g.items || [])] } : { id: 'g:' + Store.uid(), title: '', emojis: '', items: items || [] };
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>🧺 ${g ? 'Olay grubunu düzenle' : 'Yeni olay grubu'}</h3>
      <div class="pl-own"><input id="egEmo" maxlength="16" placeholder="🧺" value="${esc(cur.emojis || '')}"><input id="egTitle" maxlength="40" placeholder="Grubun adı (ör. Ön sevişme seti)" value="${esc(cur.title)}"></div>
      <div class="sec-title">Gruptaki olaylar <small id="egCount"></small></div>
      <div class="mo-chips" id="egItems"></div>
      <button type="button" class="btn ghost sm" id="egAdd" style="margin-top:8px">➕ Olay ekle</button>
      <button class="btn primary block" id="egSave" style="margin-top:14px">Kaydet</button>
      ${g ? '<button class="btn ghost block" id="egDel" style="margin-top:8px;color:#ff2d55">🗑️ Grubu sil</button>' : ''}`, 'light');
    const el = sh.el;
    const drawItems = () => {
      const evs = groupEvents(cur);
      el.querySelector('#egItems').innerHTML = evs.map(e => `<span class="mo-chip on${evCls(e)}"${evStyle(e)}>${evEmo(e)}${esc(e.title)}<button type="button" data-egrm="${esc(e.id)}" aria-label="Çıkar">✕</button></span>`).join('') || '<small class="mo-empty">Henüz olay yok</small>';
      el.querySelector('#egCount').textContent = `(${evs.length})`;
    };
    drawItems();
    topSave(sh, () => el.querySelector('#egSave').click());
    el.onclick = e => {
      const rm = e.target.closest('[data-egrm]');
      if (rm) { cur.items = cur.items.filter(id => id !== rm.dataset.egrm); drawItems(); return; }
      if (e.target.closest('#egAdd')) { poolPicker({ title: '🧺 Gruba olay ekle', skip: groupEvents(cur).map(x => x.title), noGroups: true }, evs => { evs.forEach(x => { if (!cur.items.includes(x.id)) cur.items.push(x.id); }); drawItems(); }); return; }
      if (e.target.closest('#egDel')) {
        if (!confirm('Bu grup silinsin mi? (İçindeki olaylar havuzda kalır)')) return;
        MO().evGroups = evGroups().filter(x => x.id !== cur.id); save(); sh.close(); if (done) done(); return;
      }
      if (!e.target.closest('#egSave')) return;
      cur.title = el.querySelector('#egTitle').value.trim();
      cur.emojis = twoEmojis(el.querySelector('#egEmo').value);
      if (!cur.title) { notify('Gruba bir ad ver', '🧺'); return; }
      if (!cur.items.length) { notify('Gruba en az bir olay ekle', '🧺'); return; }
      const i = evGroups().findIndex(x => x.id === cur.id);
      if (i >= 0) evGroups()[i] = cur; else evGroups().push(cur);
      save(); sh.close(); notify('Olay grubu kaydedildi', '🧺'); if (done) done();
    };
  }

  // 📶 Olay dereceleri: ad, canlılık (renk ne kadar canlı) ve sıra (düşükten yükseğe)
  function levelSheet(done, sample = '#ff5f5f') {
    const row = l => `<div class="lv-row" data-lid="${esc(l.id)}">
      <span class="cat-mv"><button type="button" data-lvup aria-label="Yukarı">▲</button><button type="button" data-lvdown aria-label="Aşağı">▼</button></span>
      <input class="lv-lb" maxlength="24" value="${esc(l.label)}">
      <span class="lv-sw" style="background:${vividHex(sample, l.vivid)}"></span>
      <input class="lv-vv" type="range" min="0" max="100" step="5" value="${+l.vivid || 0}" aria-label="Canlılık">
      <button type="button" class="icon-btn" data-lvdel aria-label="Sil">🗑️</button></div>`;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>📶 Olay dereceleri</h3>
      <div class="about" style="margin-bottom:10px">Düşükten yükseğe sırala. Kaydırıcı rengin canlılığı: sağa doğru daha canlı, sola doğru daha sönük. Olayın rengi seçtiğin dereceye göre değişir.</div>
      <div class="lv-list">${evLevels().map(row).join('')}</div>
      <div class="pl-own" style="margin-top:10px"><input id="lvNew" maxlength="24" placeholder="Yeni derece (ör. Extreme)"><button type="button" class="btn ghost sm" id="lvAdd">Ekle</button></div>
      <button class="btn ghost block" id="lvReset" style="margin-top:10px">↩️ Hazır derecelere dön</button>
      <button class="btn primary block" id="lvSave" style="margin-top:8px">Kaydet</button>`, 'light');
    const el = sh.el, list = el.querySelector('.lv-list');
    const read = () => [...el.querySelectorAll('.lv-row')].map(r => ({ id: r.dataset.lid, label: r.querySelector('.lv-lb').value.trim() || 'Derece', vivid: +r.querySelector('.lv-vv').value }));
    topSave(sh, () => el.querySelector('#lvSave').click());
    el.oninput = e => { const r = e.target.closest('.lv-row'); if (r && e.target.classList.contains('lv-vv')) r.querySelector('.lv-sw').style.background = vividHex(sample, e.target.value); };
    el.onclick = e => {
      const r = e.target.closest('.lv-row'), ds = (e.target.closest('button') || {}).dataset || {};
      if (r && 'lvup' in ds && r.previousElementSibling) return list.insertBefore(r, r.previousElementSibling);
      if (r && 'lvdown' in ds && r.nextElementSibling) return list.insertBefore(r.nextElementSibling, r);
      if (r && 'lvdel' in ds) { if (confirm('Bu derece silinsin mi? (Bu derecedeki olayların derecesi boş kalır)')) r.remove(); return; }
      if (e.target.closest('#lvAdd')) {
        const label = el.querySelector('#lvNew').value.trim();
        if (!label) return;
        list.insertAdjacentHTML('beforeend', row({ id: 'l:' + Store.uid(), label, vivid: 100 }));
        el.querySelector('#lvNew').value = '';
        return;
      }
      if (e.target.closest('#lvReset')) { if (!confirm('Hazır derecelere dönülsün mü?')) return; delete MO().levels; save(); sh.close(); levelSheet(done, sample); return; }
      if (e.target.closest('#lvSave')) { MO().levels = read(); save(); sh.close(); notify('Dereceler kaydedildi', '📶'); if (done) done(); }
    };
  }

  // Havuzdan çoklu seçim. opts.merge: "tek satırda birleştir" seçeneği; cb(seçilen olaylar, birleştirilsin mi)
  // 🕘 son kullanılan olaylar (önerilen): MO().recent = olay id'leri, en yenisi başta
  const RECENT_MAX = 12;
  const recentIds = () => MO().recent || [];
  function useEvents(ids) {
    const r = [...new Set([...ids.filter(Boolean), ...recentIds()])].slice(0, RECENT_MAX);
    MO().recent = r;
  }
  const recentEvents = () => { const pool = allEvents(); return recentIds().map(id => pool.find(e => e.id === id)).filter(Boolean); };
  const catOfEv = e => moCats().find(c => c.id === (e.cat || 'mine')) || MINE;

  /* # ile olay ara: başlık ve alt derece adlarında; başta geçenler, sonra 🕘 son kullanılanlar ve "event" etiketli kategoriler öne çıkar.
   * Dönüş: [{ e, sub }] (sub: alt derecenin id'si ya da undefined) */
  function evSearch(q, opts = {}) {
    const n = s => lower(s).trim(), qq = n(q), rec = recentIds(), top = new Set(tagCats(CHAT_TOP_TAG).map(c => c.id));
    const pool = allEvents().filter(e => (!opts.cats || opts.cats.includes(e.cat || 'mine')) && !(opts.skip || []).includes(e.title));
    const rank = t => { const s = n(t); return !qq ? 3 : s.startsWith(qq) ? 0 : s.split(/\s+/).some(w => w.startsWith(qq)) ? 1 : s.includes(qq) ? 2 : -1; };
    const out = [];
    pool.forEach(e => {
      const r = rank(e.title), bonus = (rec.includes(e.id) ? -0.5 + rec.indexOf(e.id) / 100 : 0) + (top.has(e.cat) ? 0 : 0.2);
      if (r >= 0) out.push({ e, score: r + bonus });
      if (!qq || opts.noSubs) return;
      (e.subs || []).filter(s => s.title).forEach(s => { const rs = rank(s.title); if (rs >= 0) out.push({ e, sub: s.id, score: rs + bonus + 0.1 }); });
    });
    return out.sort((a, b) => a.score - b.score || a.e.title.localeCompare(b.e.title, 'tr'));
  }
  /* Yazarken üstte benzer olaylar (IDE gibi): ↑↓ seç, Enter / Tab ekle, Esc kapat.
   * opts.whole: kutunun tamamı aranır ("#" isteğe bağlı); yoksa imleçten önceki "#kelime" aranır ve seçince yazıdan silinir.
   * onPick(olay, altDereceId) */
  function hashSuggest(input, onPick, opts = {}) {
    let pop = null, items = [], cur = 0;
    const query = () => {
      const pos = input.selectionStart == null ? input.value.length : input.selectionStart, v = input.value.slice(0, pos);
      if (opts.whole) return { q: v.replace(/^#/, ''), from: 0, to: input.value.length };
      const m = v.match(/(?:^|\s)#([^#\n]*)$/);
      return m ? { q: m[1], from: pos - m[1].length - 1, to: pos } : null;
    };
    const close = () => { if (pop) pop.remove(); pop = null; items = []; };
    const pick = it => {
      const qq = query();
      if (qq) input.value = (input.value.slice(0, qq.from) + input.value.slice(qq.to)).replace(/\s{2,}/g, ' ').replace(/^\s+/, '');
      close();
      onPick(it.e, it.sub);
    };
    const show = () => {
      const qq = query();
      if (!qq || (opts.whole && !qq.q.trim() && !input.value.startsWith('#'))) return close();
      items = evSearch(qq.q, opts).slice(0, 8);
      if (!items.length) return close();
      cur = Math.max(0, Math.min(cur, items.length - 1));
      if (!pop) {
        pop = document.createElement('div');
        pop.className = 'hs-pop';
        document.body.appendChild(pop);
        pop.onmousedown = ev => ev.preventDefault(); // kutu odağını kaybetmesin
        pop.onclick = ev => { const b = ev.target.closest('[data-hs]'); if (b) pick(items[+b.dataset.hs]); };
      }
      const rec = recentIds();
      pop.innerHTML = `<div class="hs-head">📜 Olaylar <small>↑↓ · Enter</small></div>` + items.map((it, i) => {
        const look = it.sub ? withSub(it.e, it.sub) : it.e, c = catOfEv(it.e);
        return `<button type="button" class="hs-it${i === cur ? ' on' : ''}${evCls(look)}"${evStyle(look)} data-hs="${i}">
          <span class="hs-t">${evEmo(look)}${esc(look.title)}${it.sub ? `<small> · ${esc(it.e.title)}</small>` : ''}</span>
          <small class="hs-c">${rec.includes(it.e.id) ? '🕘 ' : ''}${c.icon} ${esc(c.label)}</small></button>`;
      }).join('');
      const r = input.getBoundingClientRect(), w = Math.min(window.innerWidth - 16, Math.max(r.width, 260));
      pop.style.width = `${w}px`;
      pop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 8))}px`;
      // yer varsa kutunun üstünde, yoksa altında
      if (r.top > 220) { pop.style.top = ''; pop.style.bottom = `${window.innerHeight - r.top + 6}px`; }
      else { pop.style.bottom = ''; pop.style.top = `${r.bottom + 6}px`; }
      const on = pop.querySelector('.hs-it.on');
      if (on) on.scrollIntoView({ block: 'nearest' });
    };
    input.addEventListener('input', () => { cur = 0; show(); });
    input.addEventListener('keydown', ev => {
      if (!pop) return;
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); cur = (cur + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; show(); }
      else if (ev.key === 'Enter' || ev.key === 'Tab') { ev.preventDefault(); ev.stopImmediatePropagation(); pick(items[cur]); }
      else if (ev.key === 'Escape') { ev.preventDefault(); ev.stopImmediatePropagation(); close(); }
    }, true);
    input.addEventListener('blur', () => setTimeout(close, 150));
    window.addEventListener('hashchange', close);
  }
  // olay seçim kutularının (select) önüne "# ara" kutusu: seçince kutuda o olay seçilir
  function hashSelects(root) {
    root.querySelectorAll('select.cond-ev, select.cs-nx, select.oc-next, select.tr-ev').forEach(s => {
      if (s.previousElementSibling && s.previousElementSibling.classList.contains('hs-in')) return;
      const inp = document.createElement('input');
      inp.className = 'hs-in';
      inp.placeholder = '# ara';
      inp.autocomplete = 'off';
      s.before(inp);
      hashSuggest(inp, e => {
        if (![...s.options].some(o => o.value === e.id)) { notify('Bu olay burada seçilemez', '📜'); return; }
        s.value = e.id;
        s.dispatchEvent(new Event('change', { bubbles: true }));
        inp.value = '';
      }, { whole: true, noSubs: true });
    });
  }

  function poolPicker(opts, cb) {
    const sel = [];
    const rec = recentEvents().filter(e => (!opts.cats || opts.cats.includes(e.cat || 'mine')) && !(opts.skip || []).includes(e.title));
    const chipOf = e => `<button type="button" class="mo-chip${evCls(e)}"${evStyle(e)} data-pick="${esc(e.id)}" data-tags="${esc((e.tags || []).join('|'))}" data-desc="${esc(e.desc || e.text || '')}" title="${esc(e.desc || e.text || '')}">${evEmo(e)}${esc(e.title)}</button>`;
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>${esc(opts.title)}</h3>
      <input class="pk-search" id="pkSearch" placeholder="# yaz, olay ara…" autocomplete="off">
      ${rec.length ? `<div class="mo-sub pk-rec">🕘 Önerilen <small>· son kullandıkların</small></div><div class="mo-chips">${rec.map(chipOf).join('')}</div>` : ''}
      ${allEvTags().length ? `<div class="chips mo-filter">${tagChips(allEvTags(), [], 'data-pf')}</div>` : ''}
      ${!opts.noGroups && evGroups().length ? `<div class="mo-sub">🧺 Olay grupları <small>· seçince içindeki tüm olaylar gelir</small></div>
        <div class="mo-chips">${evGroups().map(g => `<button type="button" class="mo-chip mo-grp" data-pick="grp:${esc(g.id)}" data-tags="" data-desc="${esc(groupEvents(g).map(x => x.title).join(' + '))}">${evEmo(g) || '🧺 '}${esc(g.title)} <small>${groupEvents(g).length}</small></button>`).join('')}</div>` : ''}
      ${(() => {
        // opts.top: bu etiketi taşıyan olaylar (ya da kategorileri) en üstte ayrı bölümde
        if (!opts.top) return '';
        const top = allEvents().filter(e => hasTag(e, opts.top, opts.topExact) && !(opts.skip || []).includes(e.title) && (!opts.cats || opts.cats.includes(e.cat || 'mine')));
        return top.length ? `<div class="mo-sub pk-top">⭐ ${esc(opts.top)} <small>· ${top.length} olay</small></div>
          <div class="mo-chips">${top.map(e => `<button type="button" class="mo-chip${evCls(e)}"${evStyle(e)} data-pick="${esc(e.id)}" data-tags="${esc((e.tags || []).join('|'))}" data-desc="${esc(e.desc || e.text || '')}" title="${esc(e.desc || e.text || '')}">${evEmo(e)}${esc(e.title)}</button>`).join('')}</div>` : '';
      })()}
      ${(opts.onlyTop ? [] : opts.catFirst ? [...tagCats(opts.catFirst), ...moCats().filter(c => !(c.tags || []).includes(opts.catFirst))] : moCats()).filter(cat => !opts.cats || opts.cats.includes(cat.id)).map(cat => { const evs = poolOf(cat).filter(e => !(opts.skip || []).includes(e.title) && !(opts.top && hasTag(e, opts.top, opts.topExact))); const star = opts.catFirst && (cat.tags || []).includes(opts.catFirst); return evs.length ? `<div class="mo-sub${star ? ' pk-top' : ''}">${star ? '⭐ ' : ''}${cat.icon} ${esc(cat.label)}</div>
        <div class="mo-chips">${evs.map(e => `<button type="button" class="mo-chip${evCls(e)}"${evStyle(e)} data-pick="${esc(e.id)}" data-tags="${esc((e.tags || []).join('|'))}" data-desc="${esc(e.desc || e.text || '')}" title="${esc(e.desc || e.text || '')}">${evEmo(e)}${esc(e.title)}</button>`).join('')}</div>` : ''; }).join('')}
      <div class="mo-pool-foot">
        <div class="mo-pick-info" id="poolInfo" hidden></div>
        ${opts.merge ? '<label class="mo-check"><input type="checkbox" id="poolMerge"> 🧩 Seçtiklerimi tek satırda birleştir (tek olay + açıklama)</label>' : ''}
        <button class="btn primary block" id="poolAdd">Ekle</button>
      </div>`, 'light');
    const btn = sh.el.querySelector('#poolAdd');
    let ptag = '';
    sh.el.onclick = e => {
      const f = e.target.closest('[data-pf]');
      if (f) {
        // etikete göre süz: seçili etiketi taşımayan olaylar gizlenir
        ptag = ptag === f.dataset.pf ? '' : f.dataset.pf;
        sh.el.querySelectorAll('[data-pf]').forEach(x => x.classList.toggle('on', x.dataset.pf === ptag));
        sh.el.querySelectorAll('[data-pick]').forEach(x => { x.hidden = !!ptag && !x.dataset.tags.split('|').includes(ptag); });
        sh.el.querySelectorAll('.mo-chips').forEach(c => { const s = c.previousElementSibling; if (s && s.classList.contains('mo-sub')) s.hidden = c.hidden = ![...c.children].some(x => !x.hidden); });
        return;
      }
      const b = e.target.closest('[data-pick]');
      if (b) {
        const i = sel.indexOf(b.dataset.pick);
        i >= 0 ? sel.splice(i, 1) : sel.push(b.dataset.pick);
        sh.el.querySelectorAll(`[data-pick="${CSS.escape(b.dataset.pick)}"]`).forEach(x => x.classList.toggle('on', i < 0));
        btn.textContent = sel.length ? `Ekle (${sel.length})` : 'Ekle';
        // dokunduğun olayın açıklaması altta görünür
        const info = sh.el.querySelector('#poolInfo');
        info.hidden = i >= 0 || !b.dataset.desc;
        info.innerHTML = `<b>${esc(b.textContent)}</b> · ${esc(b.dataset.desc)}`;
        return;
      }
      if (!e.target.closest('#poolAdd') || !sel.length) return;
      const pool = allEvents(), m = sh.el.querySelector('#poolMerge'), out = [];
      // gruplar içindeki olaylara açılır (aynı olay iki kez gelmez)
      sel.forEach(id => {
        const g = id.startsWith('grp:') && evGroups().find(x => x.id === id.slice(4));
        (g ? groupEvents(g) : [pool.find(x => x.id === id)]).forEach(x => { if (x && !out.includes(x)) out.push(x); });
      });
      useEvents(out.map(x => x.id));
      save();
      sh.close();
      cb(out, !!(m && m.checked));
    };
    // # ile ara: seçilen olay işaretlenir ve görünür yere kayar
    hashSuggest(sh.el.querySelector('#pkSearch'), e => {
      const b = sh.el.querySelector(`[data-pick="${CSS.escape(e.id)}"]`);
      if (!b) return;
      if (!b.classList.contains('on')) b.click();
      b.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, { whole: true, noSubs: true, cats: opts.cats, skip: opts.skip });
    topSave(sh, () => sh.el.querySelector('#poolAdd').click(), '➕ Ekle');
  }

  // Zaman / Mekan panellerinin açık-kapalı hali: { time: kapalı mı, place: kapalı mı }
  function moFold(v) {
    try {
      if (v) localStorage.setItem('amor-stories:monia-fold', JSON.stringify(v));
      return JSON.parse(localStorage.getItem('amor-stories:monia-fold')) || {};
    } catch (e) { return v || {}; }
  }

  // Mekan ekle / düzenle: ad, simge, etiketler (Evde, Dışarıda… ya da kendi etiketin), ipuçları
  function placeEditSheet(p, done) {
    const tags = new Set(p ? p.tags || [] : []);
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>${p ? '✏️ Mekanı düzenle' : '➕ Mekan ekle'}</h3>
      <form id="plForm" autocomplete="off">
        <div class="pl-own"><input id="peIcon" maxlength="4" placeholder="📍" value="${esc(p ? p.icon : '')}"><input id="peName" maxlength="40" placeholder="Mekanın adı (ör. Ofiste, Spor salonunda)" value="${esc(p ? p.name : '')}"></div>
        <div class="sec-title">🏷️ Etiketler</div>
        <div class="chips" id="peTags">${allGroups().map(g => `<button type="button" class="chip mo-pick${tags.has(g.id) ? ' on' : ''}" data-tag="${g.id}">${g.icon} ${esc(g.name)}</button>`).join('')}</div>
        <div class="pl-own" style="margin-top:8px"><input id="ptIcon" maxlength="4" placeholder="🏷️"><input id="ptName" maxlength="24" placeholder="Yeni etiket (ör. İş yerinde)"><button type="button" class="btn ghost sm" id="ptAdd">Ekle</button></div>
        <div class="sec-title">💡 İpuçları <small>· her satır bir ipucu, {o} = onun adı (isteğe bağlı)</small></div>
        <div class="field" style="margin-top:0"><textarea id="peHints" rows="4" maxlength="2000" placeholder="{o} masasında dosyalara gömülmüş, seni görünce gülümsüyor.">${esc(p ? (p.hints || []).join('\n') : '')}</textarea></div>
        <button class="btn primary block" type="submit" style="margin-top:12px">${p ? 'Kaydet' : 'Mekanı ekle'}</button>
        ${p ? '<button class="btn ghost block" type="button" id="peDel" style="margin-top:8px;color:#ff2d55">🗑️ Mekanı sil</button>' : ''}
      </form>`, 'light');
    const el = sh.el;
    el.querySelector('#peTags').onclick = e => {
      const b = e.target.closest('[data-tag]');
      if (!b) return;
      tags.has(b.dataset.tag) ? tags.delete(b.dataset.tag) : tags.add(b.dataset.tag);
      b.classList.toggle('on', tags.has(b.dataset.tag));
    };
    el.querySelector('#ptAdd').onclick = () => {
      const name = el.querySelector('#ptName').value.trim();
      if (!name) return;
      let g = allGroups().find(x => x.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'));
      if (!g) { g = { id: 't:' + Store.uid(), icon: el.querySelector('#ptIcon').value.trim() || '🏷️', name }; MO().groups.push(g); save(); }
      tags.add(g.id);
      el.querySelector('#peTags').insertAdjacentHTML('beforeend', el.querySelector(`[data-tag="${g.id}"]`) ? '' : `<button type="button" class="chip mo-pick on" data-tag="${g.id}">${esc(g.icon)} ${esc(g.name)}</button>`);
      el.querySelector(`[data-tag="${g.id}"]`).classList.add('on');
      el.querySelector('#ptName').value = ''; el.querySelector('#ptIcon').value = '';
    };
    topSave(sh, () => el.querySelector('#plForm').requestSubmit());
    el.querySelector('#plForm').onsubmit = e => {
      e.preventDefault();
      const name = el.querySelector('#peName').value.trim();
      if (!name) { notify('Mekana bir ad ver', '📍'); return; }
      if (!tags.size) { notify('En az bir etiket seç (Evde, Dışarıda…)', '🏷️'); return; }
      const hints = el.querySelector('#peHints').value.split('\n').map(s => s.trim()).filter(Boolean);
      const data = { icon: el.querySelector('#peIcon').value.trim() || '📍', name, tags: [...tags],
        hints: hints.length ? hints : [`${name}, {o} ile baş başasınız.`] };
      let saved;
      if (p) saved = Object.assign(MO().places.find(x => x.id === p.id), data);
      else { saved = { id: 'u:' + Store.uid(), ...data }; MO().places.push(saved); }
      save(); sh.close();
      notify(p ? 'Mekan kaydedildi' : 'Mekan eklendi', '📍');
      done(saved);
    };
    const del = el.querySelector('#peDel');
    if (del) del.onclick = () => {
      if (!confirm(`"${p.name}" silinsin mi? (Başlattığın sohbetlerdeki kartlar kalır)`)) return;
      MO().places = MO().places.filter(x => x.id !== p.id);
      save(); sh.close(); done(null);
    };
  }

  function renderScenario(sc) {
    const draw = () => renderScenario(sc);
    const autoTitle = () => `${scPlaceIcon(sc)} ${scPlaceName(sc)}`;
    // ad hâlâ mekandan geliyorsa mekanla birlikte değişir
    const set = patch => { const auto = sc.title === autoTitle(); Object.assign(sc, patch); if (auto && scPlaceName(sc)) sc.title = autoTitle(); save(); draw(); };
    const chip = (attr, val, label, on) => `<button type="button" class="chip mo-pick${on ? ' on' : ''}" ${attr}="${esc(val)}">${label}</button>`;
    // Zaman / Mekan panelleri açılıp kapanır (tercih bu cihazda hatırlanır)
    const fold = moFold();
    const foldHead = (k, title, sum) => `<button type="button" class="mo-fold${fold[k] ? ' closed' : ''}" data-fold="${k}">
      <span class="sec-title">${title}</span><small>${esc(sum)}</small><i>${fold[k] ? '▸' : '▾'}</i></button>`;
    view.innerHTML = `
      <div class="page-pad narrow monia">
        <div class="mo-top"><a class="icon-btn" href="#/monia" aria-label="Geri">${ICON.arrowLeft}</a>
          <input id="scTitle" maxlength="50" value="${esc(sc.title)}" placeholder="Senaryo adı"></div>

        <div class="mo-cover${sc.cover ? '' : ' empty'}"${sc.cover ? ` style="background-image:url('${esc(sc.cover)}')"` : ''}>
          <button type="button" class="btn ghost sm" id="scCover">🖼️ ${sc.cover ? 'Kapağı değiştir' : 'Kapak ekle'}</button>
          ${sc.cover ? '<button type="button" class="btn ghost sm" id="scCoverRm">✕</button>' : ''}
        </div>
        <div class="card">
          <div class="sec-title" style="margin-top:0">📝 Açıklama</div>
          <textarea class="mo-area" id="scDesc" rows="3" maxlength="1000" placeholder="Bu hikaye ne anlatıyor? (sohbetin başında senaryo notunda da görünür)">${esc(sc.desc || '')}</textarea>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🏷️ Etiketler</div>
          <div class="chips">${tagChips(allScTags(), sc.tags || [])}</div>
          <div class="pl-own" style="margin-top:8px"><input id="scTagIn" maxlength="24" placeholder="Yeni etiket (ör. Yaz tatili)"><button type="button" class="btn ghost sm" id="scTagAdd">Ekle</button></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">👥 Karakterler <small>· isteğe bağlı; seçmezsen başlatırken sorulur</small></div>
          ${chars().length ? `<div class="g-pick">${chars().map(c => `<button type="button" data-ch="${c.id}" class="${sc.chars.includes(c.id) ? 'on' : ''}">${avatar(c, 46)}<b>${esc(c.name)}</b></button>`).join('')}</div>`
            : '<div class="about">Önce <a href="#/create"><b>Oluştur</b></a> sekmesinden bir karakter oluştur.</div>'}
        </div>

        <div class="card">
          ${foldHead('time', '🕰️ Zaman', timeLabel(sc) || 'seçilmedi')}
          <div class="mo-fold-body"${fold.time ? ' hidden' : ''}>
          <div class="chips">${MD.parts.map(p => chip('data-part', p.id, `${p.icon} ${esc(p.label)}`, sc.part === p.id)).join('')}</div>
          <div class="chips">${MD.days.map(d => chip('data-day', d, esc(d), sc.day === d)).join('')}</div>
          <div class="chips">${MD.seasons.map(d => chip('data-season', d, esc(d), sc.season === d)).join('')}</div>
          <div class="field"><input id="scTime" maxlength="60" value="${esc(sc.timeNote || '')}" placeholder="Ek zaman notu (ör. 3 yıl sonra, ilk buluşmadan bir hafta önce)"></div>
          </div>
        </div>

        <div class="card">
          ${foldHead('place', '📍 Mekan', scPlaceName(sc) ? `${scPlaceIcon(sc)} ${scPlaceName(sc)}` : 'seçilmedi')}
          <div class="mo-fold-body"${fold.place ? ' hidden' : ''}>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="scPlRoll">🎲 Rastgele mekan</button><button type="button" class="btn ghost sm" id="scPlAdd">➕ Mekan ekle</button></div>
          ${allGroups().map(g => { const ps = allPlaces().filter(p => inGroup(p, g)); return ps.length ? `<div class="mo-sub">${g.icon} ${esc(g.name)}</div>
            <div class="pl-grid">${ps.map(p => `<button type="button" data-pl="${p.id}" class="${p.id === sc.place && !sc.placeName ? 'on' : ''}${p.id.startsWith('u:') ? ' mine' : ''}"><span>${p.icon}</span><small>${esc(p.name)}</small></button>`).join('')}</div>` : ''; }).join('')}
          ${MO().places.length ? '<div class="mo-vars">Eklediğin bir mekanı düzenlemek için seçiliyken bir kez daha dokun.</div>' : ''}
          <div class="pl-own" style="margin-top:10px"><input id="scPlIcon" maxlength="4" placeholder="📍" value="${esc(sc.placeIcon || '')}"><input id="scPlName" maxlength="40" placeholder="Sadece bu senaryoya özel mekan (kaydedilmez)" value="${esc(sc.placeName || '')}"></div>
          </div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">📜 Olaylar <small>(${sc.events.length}) · sohbette sırayla gelir</small></div>
          <div class="mo-evs">${sc.events.map(evLive).map((e, i) => { const look = e.sub && e.sub !== '§rnd' ? withSub(e, e.sub) : e; return `<div class="mo-ev${evCls(look)}"${evStyle(look)} data-i="${i}">
              <span class="n">${i + 1}</span><span class="t">${evPlace(e) ? `<em class="mo-tag">${esc(evPlace(e).icon + ' ' + evPlace(e).name)}</em>` : ''}${e.emojis ? `<b class="mo-emo">${esc(e.emojis)}</b> ` : ''}${levelOf(e) ? `<em class="mo-tag">📶 ${esc(levelOf(e).label)}</em>` : ''}${esc(evText(e, sc))}${e.desc ? `<small class="mo-desc">📝 ${esc(e.desc)}</small>` : ''}${(e.outcomes || []).length ? `<small class="mo-desc">🎲 ${esc(e.outcomes.map(o => `${o.text || '↪ ' + ((allEvents().find(x => x.id === o.next) || {}).title || '')} %${o.pct}`).join(' · '))}</small>` : ''}</span>
              <span class="a">${(e.subs || []).filter(s => s.title).length ? `<select class="mo-subsel" data-subsel="${i}" title="Alt derece"><option value="">🪜 Varsayılan</option><option value="§rnd"${sc.events[i].sub === '§rnd' ? ' selected' : ''}>🎲 Rastgele</option>${e.subs.filter(s => s.title).map(s => `<option value="${esc(s.id)}"${sc.events[i].sub === s.id ? ' selected' : ''}>${esc(s.title)}</option>`).join('')}</select>` : ''}${i > 0 ? '<button type="button" data-up aria-label="Yukarı">⬆️</button>' : ''}${i < sc.events.length - 1 ? '<button type="button" data-down aria-label="Aşağı">⬇️</button>' : ''}<button type="button" data-edit aria-label="Düzenle">✏️</button><button type="button" data-rm aria-label="Kaldır">✕</button></span></div>`; }).join('')
            || '<div class="about">Henüz olay yok. Havuzdan seç, kendin yaz ya da rastgele ekle.</div>'}</div>
          <div class="mo-ev-btns">
            <button type="button" class="btn ghost sm" id="scPool">➕ Havuzdan</button>
            <button type="button" class="btn ghost sm" id="scWrite">✍️ Kendin yaz</button>
            <button type="button" class="btn ghost sm" id="scRand">🎲 Rastgele</button>
          </div>
          <input class="pk-search" id="scHash" placeholder="# yaz, olay ekle…" autocomplete="off" style="margin-top:8px">
        </div>

        <button class="btn pink block" id="scStart" style="margin-top:14px">▶️ Hikayeyi başlat</button>
        <div class="mo-ev-btns" style="margin-top:8px">
          <button class="btn ghost sm" id="scReroll">🎲 Hepsini yeniden üret</button>
          <button class="btn ghost sm" id="scCopy">📄 Kopyasını al</button>
          <button class="btn ghost sm" id="scExport">📤 Dışa aktar</button>
          <button class="btn ghost sm" id="scDel" style="color:#ff2d55">🗑️ Sil</button>
        </div>
      </div>`;

    $('#scTitle').onchange = e => { sc.title = e.target.value.trim() || 'Adsız senaryo'; save(); };
    $('#scDesc').onchange = e => { sc.desc = e.target.value.trim(); save(); };
    $('#scExport').onclick = () => exportScenarios([sc]);
    const addTag = () => {
      const v = $('#scTagIn').value.trim();
      if (!v) return;
      const t = allScTags().find(x => x.toLocaleLowerCase('tr') === v.toLocaleLowerCase('tr')) || v;
      keepTag('scTagList', t);
      set({ tags: [...new Set([...(sc.tags || []), t])] });
    };
    $('#scTagAdd').onclick = addTag;
    $('#scTagIn').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } };
    if ($('#scCoverRm')) $('#scCoverRm').onclick = () => set({ cover: '' });
    // kapak: seçili karakterlerin (yoksa tüm karakterlerin) fotoğraflarından ya da cihazdan
    $('#scCover').onclick = () => {
      const from = scChars(sc).length ? scChars(sc) : chars();
      const pics = [...new Set(from.flatMap(c => [c.photo, ...(c.album || [])]).filter(Boolean))];
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>🖼️ Senaryo kapağı</h3>
        <label class="btn ghost block photo-up">📁 Cihazdan seç<input type="file" accept="image/*" id="cvFile" hidden></label>
        ${GAL ? `<button type="button" class="btn ghost block photo-up" id="cvGal">🖼️ ${esc(GAL.name)}'den seç</button>` : ''}
        ${pics.length ? `<div class="sec-title">${scChars(sc).length ? 'Karakterlerin fotoğrafları' : 'Tüm karakterler'}</div>
          <div class="pick-photos">${pics.map((s, i) => `<button type="button" data-cv="${i}"><img src="${esc(s)}" alt="" loading="lazy"></button>`).join('')}</div>`
          : '<div class="about">Karakterlerin fotoğrafı yok; cihazından seçebilirsin.</div>'}`, 'light');
      sh.el.onclick = e => {
        if (e.target.closest('#cvGal')) { sh.close(); galleryPicker({ title: 'Senaryo kapağı' }, ([u]) => set({ cover: u })); return; }
        const b = e.target.closest('[data-cv]'); if (b) { sh.close(); set({ cover: pics[+b.dataset.cv] }); }
      };
      sh.el.querySelector('#cvFile').onchange = async e => {
        const f = e.target.files[0];
        if (!f) return;
        try { const src = await readPhoto(f, 900); sh.close(); set({ cover: src }); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
      };
    };
    $('#scTime').onchange = e => { sc.timeNote = e.target.value.trim(); save(); draw(); };
    $('#scPlName').onchange = e => set({ placeName: e.target.value.trim() });
    $('#scPlIcon').onchange = e => set({ placeIcon: e.target.value.trim() });
    $('#scPlRoll').onclick = () => set({ place: pickOne(allPlaces().filter(p => p.id !== sc.place)).id, placeName: '', placeIcon: '' });
    $('#scPlAdd').onclick = () => placeEditSheet(null, p => set({ place: p.id, placeName: '', placeIcon: '' }));
    view.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const d = b.dataset;
      if (d.fold) { fold[d.fold] = !fold[d.fold]; moFold(fold); return draw(); }
      if (d.stag) { const tg = sc.tags || []; return set({ tags: tg.includes(d.stag) ? tg.filter(x => x !== d.stag) : [...tg, d.stag] }); }
      if (d.pl && d.pl === sc.place && !sc.placeName && d.pl.startsWith('u:')) {
        return placeEditSheet(MO().places.find(p => p.id === d.pl), p => set(p ? { place: p.id } : { place: '' }));
      }
      if (d.ch) { const has = sc.chars.includes(d.ch); set({ chars: has ? sc.chars.filter(x => x !== d.ch) : [...sc.chars, d.ch] }); return; }
      if (d.part) return set({ part: sc.part === d.part ? '' : d.part });
      if (d.day) return set({ day: sc.day === d.day ? '' : d.day });
      if (d.season) return set({ season: sc.season === d.season ? '' : d.season });
      if (d.pl) return set({ place: d.pl, placeName: '', placeIcon: '' });
      const row = b.closest('[data-i]');
      if (row) {
        const i = +row.dataset.i, ev = sc.events[i];
        if ('up' in d || 'down' in d) { const j = 'up' in d ? i - 1 : i + 1; [sc.events[i], sc.events[j]] = [sc.events[j], sc.events[i]]; save(); draw(); }
        if ('rm' in d) { sc.events.splice(i, 1); save(); draw(); }
        if ('edit' in d) writeEvent(ev);
      }
    };
    // tek seferlik olay yaz / düzenle (kalıp olarak da kaydedilebilir)
    function writeEvent(ev) {
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>${ev ? '✏️ Olayı düzenle' : '✍️ Olay yaz'}</h3>
        <form id="wForm" autocomplete="off">
          <div class="field" style="margin-top:0"><textarea id="wText" rows="3" maxlength="400" placeholder="{ben} sana bir sır veriyor… (eklemeler varsa: açıklaması)">${esc(ev ? ev.text || ((ev.mix || []).length ? '' : ev.title) : '')}</textarea></div>
          <div class="mo-vars">Değişkenler: <code>{ben}</code> · <code>{sen}</code> · <code>{mekan}</code> · <code>{zaman}</code></div>
          <div class="field"><label>📝 Açıklama <small>· sohbette görünmez</small></label><input id="wDesc" maxlength="1000" value="${esc(ev ? ev.desc || '' : '')}" placeholder="Bu olay nedir, ne zaman kullanılır?"></div>
          <div class="field"><label>🧩 Eklemeler <small>· tek satırda birlikte olacaklar; üstteki metin sohbette altında görünür</small></label><div id="wMix"></div></div>
          <div class="field"><label>🕰️ Zaman</label><select id="wPart"><option value="">Senaryonun zamanı</option>
            ${MD.parts.map(p => `<option value="${p.id}"${ev && ev.part === p.id ? ' selected' : ''}>${p.icon} ${esc(p.label)}</option>`).join('')}</select></div>
          <div class="field"><input id="wWhen" maxlength="60" value="${esc(ev ? ev.when || '' : '')}" placeholder="Zaman notu (ör. ertesi sabah)"></div>
          <div class="field"><label>📍 Mekan</label><select id="wPlace"><option value="">Senaryonun mekanı</option>
            ${allGroups().map(g => { const ps = allPlaces().filter(p => inGroup(p, g)); return ps.length ? `<optgroup label="${esc(g.icon + ' ' + g.name)}">${ps.map(p => `<option value="${esc(p.id)}"${ev && ev.place === p.id ? ' selected' : ''}>${esc(p.icon + ' ' + p.name)}</option>`).join('')}</optgroup>` : ''; }).join('')}</select></div>
          <div class="field"><label>Havuza da ekle</label><select id="wKeep"><option value="">Hayır, sadece bu senaryoda</option>
            ${moCats().map(c => `<option value="${c.id}">${c.icon} ${esc(c.label)} kategorisine</option>`).join('')}</select></div>
          <button class="btn primary block" type="submit" style="margin-top:12px">Kaydet</button>
          ${ev ? '' : '<button class="btn ghost block" type="button" id="wFull" style="margin-top:8px">📝 Detaylı editörde yaz</button>'}
        </form>`, 'light');
      setTimeout(() => sh.el.querySelector('#wText').focus(), 250);
      const mix = ev && ev.mix ? [...ev.mix] : [];
      const drawMix = () => {
        sh.el.querySelector('#wMix').innerHTML = mixRow(mix);
        const inp = sh.el.querySelector('.mo-mixin');
        inp.onkeydown = e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const v = inp.value.trim();
          if (v && !mix.includes(v)) { mix.push(v); drawMix(); sh.el.querySelector('.mo-mixin').focus(); }
        };
      };
      drawMix();
      sh.el.querySelector('#wMix').onclick = e => {
        const rm = e.target.closest('[data-mixrm]');
        if (rm) { mix.splice(+rm.dataset.mixrm, 1); drawMix(); return; }
        if (e.target.closest('[data-mixadd]')) poolPicker({ title: '🧩 Eklemeler', skip: mix }, evs => { evs.forEach(x => { if (!mix.includes(x.title)) mix.push(x.title); }); drawMix(); });
      };
      const full = sh.el.querySelector('#wFull');
      if (full) full.onclick = () => {
        sh.close();
        ui.moReturn = sc.id;
        ui.evDraft = { for: 'yeni', title: '', cat: 'mine', text: sh.el.querySelector('#wText').value, steps: [], opener: '', starter: '', tones: [], note: '',
          part: sh.el.querySelector('#wPart').value, when: sh.el.querySelector('#wWhen').value, place: sh.el.querySelector('#wPlace').value, mix: [...mix], tags: [], desc: sh.el.querySelector('#wDesc').value };
        location.hash = '#/monia/olay/yeni';
      };
      topSave(sh, () => sh.el.querySelector('#wForm').requestSubmit());
      sh.el.querySelector('#wForm').onsubmit = e => {
        e.preventDefault();
        const text = sh.el.querySelector('#wText').value.trim();
        if (!text && !mix.length) return;
        const title = mix.length ? mix.join(' + ') : text.replace(/\{\w+\}/g, '').trim().slice(0, 30) || 'Olay';
        const keep = sh.el.querySelector('#wKeep').value;
        const wt = { part: sh.el.querySelector('#wPart').value, when: sh.el.querySelector('#wWhen').value.trim(), place: sh.el.querySelector('#wPlace').value, mix: [...mix], desc: sh.el.querySelector('#wDesc').value.trim() };
        if (ev) Object.assign(ev, { text, title: ev.title && ev.text && !ev.mix ? ev.title : title }, wt);
        else sc.events.push({ id: Store.uid(), title, text, cat: keep || 'mine', ...wt });
        if (keep) MO().events.push({ ...evCopy(ev || { title, text, ...wt }), cat: keep });
        save(); sh.close(); draw();
      };
    }
    // havuzdan çoklu seçim
    // havuzdan: ayrı ayrı olay olarak ya da 🧩 tek satırda birleşik (açıklaması sonra yazılır)
    $('#scPool').onclick = () => poolPicker({ title: '➕ Havuzdan olay ekle', merge: true }, (evs, merged) => {
      if (merged && evs.length > 1) {
        const ev = { id: Store.uid(), title: evs.map(e => e.title).join(' + '), text: '', cat: 'mine', mix: evs.map(e => e.title) };
        sc.events.push(ev); save(); draw(); writeEvent(ev);
        return;
      }
      evs.forEach(e => sc.events.push(evCopy(e)));
      save(); draw();
    });
    $('#scWrite').onclick = () => writeEvent(null);
    hashSuggest($('#scHash'), (e, sub) => {
      const x = evCopy(e);
      if (sub) x.sub = sub;
      sc.events.push(x);
      useEvents([e.id]);
      save(); draw();
      $('#scHash').focus();
    }, { whole: true });
    view.querySelectorAll('[data-subsel]').forEach(s => { s.onclick = e => e.stopPropagation(); s.onchange = () => { const ev = sc.events[+s.dataset.subsel]; if (s.value) ev.sub = s.value; else delete ev.sub; save(); draw(); }; });
    $('#scRand').onclick = () => {
      const pool = allEvents().filter(e => !sc.events.some(x => x.title === e.title));
      if (!pool.length) { notify('Havuzda eklenmemiş olay kalmadı', '🎲'); return; }
      sc.events.push(evCopy(pickOne(pool))); save(); draw();
    };
    $('#scReroll').onclick = () => {
      const r = randomScenario();
      set({ part: r.part, day: r.day, season: r.season, place: r.place, placeName: '', placeIcon: '', events: r.events, chars: sc.chars.length ? sc.chars : r.chars });
    };
    $('#scCopy').onclick = () => addScenario({ ...JSON.parse(JSON.stringify(sc)), id: Store.uid(), title: sc.title + ' (kopya)', created: Date.now() });
    $('#scDel').onclick = () => {
      if (!confirm('Bu senaryo silinsin mi? (Başlattığın sohbetler kalır)')) return;
      MO().scenarios = MO().scenarios.filter(s => s.id !== sc.id);
      save(); location.hash = '#/monia';
    };
    $('#scStart').onclick = () => startScenario(sc);
  }

  // Hikayeyi başlat: yeni sohbet + mekan/zaman kartı + senaryo notu; olaylar sohbette sırayla 📜 kart olur
  function startScenario(sc0, chosen) {
    // karakter seçilmemişse şimdi sorulur (senaryoya kaydedilmez)
    if (!chosen && !scChars(sc0).length) { pickCharsSheet(sc0, ids => startScenario(sc0, ids)); return; }
    const sc = chosen ? { ...sc0, chars: chosen } : sc0;
    const ms = scChars(sc);
    let t;
    if (ms.length === 1) t = newThread(ms[0], sc.title);
    else { t = { id: Store.uid(), group: true, members: ms.map(m => m.id), title: sc.title, created: Date.now(), opened: 0 }; threads().push(t); }
    const pl = placeOfSc(sc), first = ms[0].name.split(' ')[0];
    const hint = pl && !sc.placeName ? pickOne(pl.hints).replace(/\{o\}/g, first) : '';
    const now = Date.now(), list = msgsOf(t), tl = timeLabel(sc);
    if (pl || sc.placeName) list.push({ id: Store.uid(), from: 'sys', ts: now, text: [tl, hint].filter(Boolean).join(' · '),
      scene: { place: sc.placeName ? '' : sc.place, icon: scPlaceIcon(sc), name: scPlaceName(sc), hint } });
    else if (tl) list.push({ id: Store.uid(), from: 'sys', ts: now, text: `🕰️ ${tl}` });
    const evs = sc.events.map(e => scEventOut(evLive(e), sc));
    const plan = sc.events.map((e, i) => `${i + 1}) ${evText(e, sc, true)}`).join('  ');
    if (evs.length || sc.desc) list.push({ id: Store.uid(), from: 'sys', ts: now + 1,
      text: `🎬 ${sc.title}${sc.desc ? `\n${sc.desc}` : ''}${evs.length ? `\n📜 ${plan}` : ''}` });
    t.scenario = { id: sc.id, events: evs, i: 0, chars: sc.chars };
    save();
    location.hash = `#/chat/${t.id}`;
  }

  // Sohbete giden olay: metin (değişkenler dolu), mekan, derecesine göre ayarlı renk, emoji, olası sonuçlar
  // 🪜 alt derece: seçilen (subId, yoksa olayın varsayılanı) ya da rastgele; olayın adı ve metni onunla değişir
  function withSub(e, subId) {
    const subs = (e.subs || []).filter(s => s.title);
    if (!subs.length) return e;
    const id = subId !== undefined ? subId : e.sub;
    const s = subs.find(x => x.id === id) || pickOne(subs);
    return { ...e, title: s.title, text: s.text || e.text, color: s.color || e.color, emojis: s.emojis || e.emojis, level: s.level || '',
      vivid: s.vivid != null && s.vivid !== '' ? s.vivid : undefined, subOf: e.title, subId: s.id, subs: [] };
  }
  // birden çok olay seçildiyse alt derecesi olanlar için sırayla sorar; done(seçilenler: [{ e, sub }])
  function askSubs(evs, done, out = []) {
    const i = out.length;
    if (i >= evs.length) return done(out);
    const e = evs[i], subs = (e.subs || []).filter(s => s.title);
    if (!subs.length) return askSubs(evs, done, [...out, { e, sub: undefined }]);
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>🪜 ${evEmo(e)}${esc(e.title)} <small>· alt derece</small></h3>
      <div class="sub-pick">
        <button type="button" class="sub-opt rnd" data-subpick="">🎲<b>Rastgele</b><small>${subs.length} dereceden biri</small></button>
        ${subs.map((s, j) => `<button type="button" class="sub-opt${e.sub === s.id ? ' def' : ''}" data-subpick="${esc(s.id)}"${evColor(withSub(e, s.id)) ? ` style="--sbc:${evColor(withSub(e, s.id))}"` : ''}><em>${esc(s.emojis || '') || j + 1}</em><b>${esc(s.title)}</b>${s.text ? `<small>${esc(s.text)}</small>` : ''}${e.sub === s.id ? '<i>varsayılan</i>' : ''}</button>`).join('')}
      </div>`, 'light');
    sh.el.onclick = ev => {
      const b = ev.target.closest('[data-subpick]');
      if (!b) return;
      sh.close();
      askSubs(evs, done, [...out, { e, sub: b.dataset.subpick || '§rnd' }]);
    };
  }

  function scEventOut(e, sc) {
    e = withSub(e);
    const p = evPlace(e), o = p ? { text: evText(e, sc), place: p.id, icon: p.icon, name: p.name } : { text: evText(e, sc) };
    if (evColor(e)) o.color = evColor(e);
    if (e.emojis) o.emojis = e.emojis;
    if (levelOf(e)) o.level = levelOf(e).label;
    const shared = sharedOf(e), outs = shared ? shared.outs : e.outcomes;
    if ((outs || []).length) o.outcomes = outs.map(x => ({ text: x.text ? evText({ text: x.text }, sc, true) : '', pct: +x.pct || 0, next: x.next || '', effects: x.effects || [], conds: x.conds || [], ...(x.def ? { def: true } : {}) }));
    // ⚡ olay olunca uygulanan etkiler (sonuçtan sonra)
    if ((e.onEffects || []).length) o.onEffects = e.onEffects;
    // hangi olay olduğu (🔒 "olduysa / olmadıysa" şartları için)
    o.evId = e.src || e.id || '';
    if (e.subId) o.subId = e.subId;
    // senaryodaki karakter bu olayı seviyor / sevmiyor mu
    const ids = [e.id, e.src, e.base].filter(Boolean);
    const feel = scChars(sc).flatMap(m => FEELS.filter(f => (m[f.key] || []).some(x => ids.includes(x))).map(f => `${f.icon} ${m.name.split(' ')[0]} bunu ${f.key === 'likes' ? 'sever' : 'sevmez'}`));
    if (feel.length) o.text += '\n' + feel.join(' · ');
    return o;
  }
  /* 🔒 sonuç şartları (hepsi tutmalı): { k: 'had', ev } bu hikayede o olay olduysa · { k: 'not', ev } olmadıysa ·
   * { k: 'p', p: parametre, op: '>=' | '<=', v } karakterin değeri. Tutmazsa sonuç 🛡️ engellenir.
   * ctx: { done: Set(olmuş olay id'leri), chars: [karakterler] } */
  const condParams = () => evParams().filter(p => p.prm || (p.f && !['choice', 'toggle'].includes(p.f.type)));
  const condBools = () => evParams().filter(p => p.bool);
  // olay ya da kategorisi bu etiketi taşıyor mu (ör. 'if' → şartlarda üstte, 'Event' → sohbette üstte)
  // exact: sadece olayın kendi etiketi, harfi harfine (ör. sohbette 'event'; kategorilerdeki 'Event' sevdiği/sevmediği içindir)
  const hasTag = (e, t, exact) => {
    if (exact) return (e.tags || []).includes(t);
    const low = x => String(x).toLocaleLowerCase('tr'), tt = low(t), cat = moCats().find(c => c.id === (e.cat || 'mine')) || {};
    return [...(e.tags || []), ...(cat.tags || [])].some(x => low(x) === tt);
  };
  const CHAT_TOP_TAG = 'event';
  // olay seçim listesi: etiketliler üstte ayrı grupta
  const evOptions = (tag, cur, skip) => {
    const evs = allEvents().filter(x => x.id !== skip), top = evs.filter(x => hasTag(x, tag)), rest = evs.filter(x => !hasTag(x, tag));
    const op = x => `<option value="${esc(x.id)}"${x.id === cur ? ' selected' : ''}>${esc((x.emojis ? x.emojis + ' ' : '') + x.title)}</option>`;
    return top.length ? `<optgroup label="🏷️ ${esc(tag)}">${top.map(op).join('')}</optgroup><optgroup label="Diğer olaylar">${rest.map(op).join('')}</optgroup>` : rest.map(op).join('');
  };
  // sonuç etkisinin yazısı: 📈 Aşk +10 · 🔘 Hamile → Evet
  const effLabel = ef => {
    const p = evParams().find(x => x.id === ef.p);
    if (p && p.bool) return `🔘 ${p.label} → ${+ef.d > 0 ? 'Evet' : 'Hayır'}`;
    return `${+ef.d > 0 ? '📈' : '📉'} ${p ? p.label : ef.p} ${+ef.d > 0 ? '+' : ''}${+ef.d}`;
  };
  function condText(cd) {
    if (cd.k === 'p') { const p = evParams().find(x => x.id === cd.p); return `📊 ${p ? p.label : cd.p} ${cd.op === '<=' ? '≤' : '≥'} ${cd.v}`; }
    if (cd.k === 'b') { const p = evParams().find(x => x.id === cd.p); return `🔘 ${p ? p.f.label : cd.p} ${cd.v ? 'ise' : 'değilse'}`; }
    const ev = allEvents().find(x => x.id === cd.ev);
    return `${cd.k === 'had' ? '📜' : '🚫'} ${ev ? ev.title : '?'} ${cd.k === 'had' ? 'olduysa' : 'olmadıysa'}`;
  }
  function condOk(cd, ctx) {
    if (cd.k === 'had') return ctx.done.has(cd.ev);
    if (cd.k === 'not') return !ctx.done.has(cd.ev);
    if (cd.k === 'b') { const id = String(cd.p).slice(2); return (ctx.chars.length ? ctx.chars : [{}]).some(ch => !!(ch.fields || {})[id] === !!cd.v); }
    if (cd.k === 'p') {
      const p = evParams().find(x => x.id === cd.p);
      if (!p) return true;
      return (isMine(p) ? [S().user] : ctx.chars.length ? ctx.chars : [{}]).some(ch => {
        const v = p.prm ? paramVal(ch, p.prm) : +((ch.fields || {})[p.f.id]) || 0;
        return cd.op === '<=' ? v <= +cd.v : v >= +cd.v;
      });
    }
    return true;
  }
  // tutmayan ilk şart (yoksa null)
  const outcomeBlock = (out, ctx) => (out.conds || []).find(cd => !condOk(cd, ctx)) || null;
  /* sonucu belirle: { out } · şart tutmadıysa ⭐ varsayılan sonuç { out, fallback } · o da yoksa { blocked } · hiç çıkmadıysa null */
  function resolveOutcome(outs, ctx) {
    const out = rollOutcome(outs);
    if (!out) return null;
    const block = outcomeBlock(out, ctx);
    if (!block) return { out };
    const miss = { text: String(out.text || '').replace(PARAM_WORD, '').trim(), why: condText(block), pct: out.pct };
    const def = (outs || []).find(o => o.def && o !== out && !outcomeBlock(o, ctx));
    return def ? { out: def, fallback: miss } : { blocked: miss };
  }

  // 🎲 yüzdelere göre bir sonuç seç (toplam 100'den azsa kalan yüzde: sonuç yok)
  function rollOutcome(outs) {
    let r = Math.random() * 100;
    for (const o of outs || []) { if ((r -= +o.pct || 0) < 0) return o; }
    return null;
  }

  /* 📈 Sonuçların değiştirdiği parametreler: karakterin sayı / kaydırıcı / tek seçim alanları (🧩) ve tek seçimli özellik grupları
   * (ör. Experience). Sonuç: effects [{ p: 'f:<alan id>' | 't:<grup id>', d: +1 }] ya da sonuç metninde özel kelime:
   * {+Experience}, {-Güven}, {+5 Güven} (sohbette görünmez, sadece uygulanır) */
  // 📊 parametreler (Monia → 🎲 Sebep-sonuç): karakterde c.params[id], yoksa başlangıç değeri
  const allParams = () => MO().params || (Stories.SYSTEM || {}).params || MD.params || [];
  const paramVal = (c, p) => { const v = (c.params || {})[p.id]; return v == null || v === '' ? +p.start || 0 : +v; };
  // who: 'me' → senin değerin (S().user.params, ör. Zevk eşiği); yoksa her karakterin kendi değeri
  const isMine = p => !!(p && p.prm && p.prm.who === 'me');
  const paramsOf = who => allParams().filter(p => (p.who === 'me') === (who === 'me'));
  const pvBars = (c, who) => paramsOf(who).map(p => { const v = paramVal(c, p), lo = +p.min || 0, hi = p.max === '' || p.max == null ? 100 : +p.max; return `<span class="pv-bar" title="${esc(p.label)}: ${v}"><small>${esc(p.icon || '📊')}</small><i style="--w:${Math.max(0, Math.min(100, Math.round((v - lo) / ((hi - lo) || 1) * 100)))}%"></i><b>${v}</b></span>`; }).join('');
  // 🤖 bot kuralları (js/data/bot-rules.js) ve onlara bağlı sonuçlar (Sebep-sonuç → 🤖)
  const botRules = () => (Stories.BOT_RULES || {}).rules || [];
  const botOutsOf = id => (MO().botOuts || (Stories.SYSTEM || {}).botOuts || {})[id] || [];
  // 🔗 ortak sonuçlar: birden çok olay aynı sonuç listesini kullanır (MO().sharedOuts [{ id, title, evs: [olay id], outs }]); olayın kendi sonuçlarının yerine geçer
  const sharedOuts = () => MO().sharedOuts || (Stories.SYSTEM || {}).sharedOuts || [];
  const sharedOf = e => { const ids = [e.id, e.src, e.base].filter(Boolean); return sharedOuts().find(g => (g.evs || []).some(x => ids.includes(x))) || null; };
  // ⚡ eşik olayları: { id, p: parametre, op: '>=' | '<=', v: sınır, ev: olay } — değer sınırı geçince olay sıraya girer
  const allTriggers = () => MO().triggers || (Stories.SYSTEM || {}).triggers || [];
  const evParams = () => [
    ...allParams().map(p => ({ id: 'p:' + p.id, name: p.label, label: `${p.icon || '📊'} ${p.label}${p.who === 'me' ? ' 🙋' : ''}`, prm: p })),
    ...charFields().filter(f => ['number', 'range', 'choice', 'toggle'].includes(f.type)).map(f => ({ id: 'f:' + f.id, name: f.label, label: `${f.icon || '🧩'} ${f.label}`, f, bool: f.type === 'toggle' })),
    ...T.groups.filter(g => g.single).map(g => ({ id: 't:' + g.id, name: g.label.replace(/^[^\p{L}\p{N}]+/u, '').trim(), label: g.label, g }))
  ];
  const PARAM_WORD = /\{([+-])(\d*)\s*([^{}]+?)\}/g;
  function paramStep(ch, p, dlt) {
    const step = (list, cur) => {
      const i = list.indexOf(cur), j = Math.max(0, Math.min(list.length - 1, (i < 0 ? (dlt > 0 ? -1 : 0) : i) + dlt));
      return list.length ? list[j] : cur;
    };
    // 🔘 aç/kapa durum (ör. Hamile): artış → Evet, azalış → Hayır
    if (p.bool) {
      ch.fields = ch.fields || {};
      const cur = !!ch.fields[p.f.id], nx = dlt > 0;
      ch.fields[p.f.id] = nx;
      return [cur ? 'Evet' : 'Hayır', nx ? 'Evet' : 'Hayır'];
    }
    if (p.prm) {
      const pr = p.prm, cur = paramVal(ch, pr), lo = pr.min === '' || pr.min == null ? 0 : +pr.min, hi = pr.max === '' || pr.max == null ? 100 : +pr.max;
      const nx = Math.max(lo, Math.min(hi, cur + dlt));
      ch.params = { ...(ch.params || {}), [pr.id]: nx };
      return [String(cur), String(nx)];
    }
    if (p.g) {
      const cur = ch.traits.find(t => p.g.values.includes(t)), nx = step(p.g.values, cur);
      if (nx !== cur) ch.traits = ch.traits.filter(t => t !== cur).concat(nx);
      const lb = v => v ? p.g.items[p.g.values.indexOf(v)] : '';
      return [lb(cur), lb(nx)];
    }
    const f = p.f, has = x => x !== '' && x != null;
    ch.fields = ch.fields || {};
    const cur = ch.fields[f.id];
    let nx;
    if (f.type === 'choice') nx = step(f.options || [], cur);
    else {
      const lo = has(f.min) ? +f.min : f.type === 'range' ? 0 : -Infinity, hi = has(f.max) ? +f.max : f.type === 'range' ? 10 : Infinity;
      nx = Math.max(lo, Math.min(hi, (has(cur) ? +cur : f.type === 'range' ? lo : 0) + dlt));
    }
    ch.fields[f.id] = nx;
    return [has(cur) ? String(cur) : '', String(nx)];
  }
  // sonucu uygula: özel kelimeleri metinden çıkar, parametreleri değiştir; { text, lines }
  function applyOutcome(out, charIds) {
    const params = evParams(), effs = [...(out.effects || [])];
    const text = String(out.text || '').replace(PARAM_WORD, (all, sign, num, name) => {
      const p = params.find(x => x.name.toLowerCase() === name.trim().toLowerCase());
      if (!p) return all;
      effs.push({ p: p.id, d: (sign === '-' ? -1 : 1) * (+num || 1) });
      return '';
    }).replace(/\s{2,}/g, ' ').trim();
    const lines = [], changes = [], fired = [];
    effs.forEach(ef => {
      const p = params.find(x => x.id === ef.p), dlt = +ef.d || 0;
      if (!p || !dlt) return;
      // 🙋 senin parametren bir kez, sende değişir
      (isMine(p) ? [S().user] : charIds.map(byId).filter(Boolean)).forEach(ch => {
        const nm = ch === S().user ? userName() : ch.name.split(' ')[0];
        const [a, b] = paramStep(ch, p, dlt);
        if (a === b) return;
        lines.push(`${dlt > 0 ? '📈' : '📉'} ${nm} · ${p.label}: ${a || '—'} → ${b}`);
        changes.push({ who: nm, label: p.label, from: a, to: b, up: dlt > 0 });
        // ⚡ sınırı bu değişimle geçtiyse eşik olayı
        const x = +a || 0, y = +b;
        allTriggers().forEach(tr => {
          if (tr.p !== p.id || isNaN(y)) return;
          const v = +tr.v, hit = tr.op === '<=' ? x > v && y <= v : x < v && y >= v;
          const ev = hit && allEvents().find(e => e.id === tr.ev);
          if (ev) fired.push({ ev, who: nm, text: `⚡ ${nm} · ${p.label} ${tr.op === '<=' ? '≤' : '≥'} ${v} → ${ev.title}` });
        });
      });
    });
    return { text, lines, changes, fired };
  }
  // 🌸 "event" etiketli kategoriden bir olay olunca: 🔘 Bakire → Hayır, Experience: Virgo → bir üst kademe (sonuçtan sonra)
  const VIRGIN_FIELD = 'bakire', VIRGIN_ITEM = 'Virgo';
  function virginFx(evId, charIds) {
    const e = allEvents().find(x => x.id === evId);
    if (!e || !(catOfEv(e).tags || []).includes(CHAT_TOP_TAG)) return [];
    const ps = evParams(), f = ps.find(p => p.bool && p.f.id === VIRGIN_FIELD), g = ps.find(p => p.g && p.g.items.includes(VIRGIN_ITEM)), out = [];
    charIds.map(byId).filter(Boolean).forEach(ch => {
      const who = ch.name.split(' ')[0];
      if (f && (ch.fields || {})[VIRGIN_FIELD]) { const [a, b] = paramStep(ch, f, -1); out.push({ who, label: f.label, from: a, to: b, up: false }); }
      if (g && ch.traits.includes(g.g.values[g.g.items.indexOf(VIRGIN_ITEM)])) { const [a, b] = paramStep(ch, g, 1); if (a !== b) out.push({ who, label: g.name, from: a, to: b, up: true }); }
    });
    return out;
  }

  const ME_TABS = [['profil', '👤 Profil'], ['ses', '🎵 Ses'], ['ayar', '⚙️ Ayarlar'], ['veri', '💾 Veri'], ['yardim', '❓ Yardım']];
  const MU = Stories.Music;
  // 🎵 Ben → Ses: parça listesi, çalan parçanın görselleştiricisi, ses düzeyi, arka plan müziği
  function bindMusic() {
    if (!MU || !$('#muList')) return;
    const draw = () => {
      const now = MU.playing(), bg = MU.background();
      $('#muList').innerHTML = MU.list().map(t => `<div class="mu-row${now && now.id === t.id ? ' on' : ''}" data-mu="${esc(t.id)}">
        <button type="button" class="mu-play" data-muplay aria-label="${now && now.id === t.id ? 'Durdur' : 'Çal'}">${now && now.id === t.id ? '■' : '▶'}</button>
        <span class="mu-ic">${esc(t.icon)}</span>
        <div class="mu-info"><b>${esc(t.name)}</b><small>${esc(MU.info(t))}${t.gen ? ' · 🎲 üretildi' : ''}</small></div>
        ${now && now.id === t.id ? '<span class="mu-eq"><i></i><i></i><i></i><i></i><i></i></span>' : ''}
        <button type="button" class="mu-bg${bg.id === t.id ? ' on' : ''}" data-mubg title="Menü müziği yap">🔁</button>
        ${t.gen ? '<button type="button" class="mu-rm" data-murm title="Sil">🗑️</button>' : ''}</div>`).join('');
      const bgT = bg.id && MU.byId(bg.id);
      $('#muNow').innerHTML = now ? `<span class="mu-now-ic">${esc(now.icon)}</span><div><small>Şimdi çalıyor</small><b>${esc(now.name)}</b></div><button type="button" class="btn ghost sm" id="muStop">■ Durdur</button>`
        : `<small>${bgT ? `🏠 Menü müziği: <b>${esc(bgT.name)}</b>` : 'Bir parçaya ▶ ile dokun'}</small>`;
      const st = $('#muStop');
      if (st) st.onclick = () => MU.stop();
    };
    draw();
    // sayfa yeniden çizilince eski abonelik ve döngü kendini bırakır
    const tok = ui.muTok = {}, alive = () => ui.muTok === tok && $('#muList');
    const off = MU.onChange(() => { if (!alive()) return off(); draw(); });
    $('#muList').onclick = e => {
      const row = e.target.closest('[data-mu]');
      if (!row) return;
      const id = row.dataset.mu, now = MU.playing();
      if (e.target.closest('[data-muplay]') || e.target.closest('.mu-info, .mu-ic')) { now && now.id === id ? MU.stop() : MU.play(id); return; }
      if (e.target.closest('[data-mubg]')) { const bg = MU.background(); MU.background(bg.id === id ? '' : id, bg.id === id ? false : true); $('#muBg').checked = MU.background().on; draw(); notify(bg.id === id ? 'Menü müziği kaldırıldı' : 'Menü müziği seçildi', '🔁'); return; }
      if (e.target.closest('[data-murm]') && confirm('Bu müzik silinsin mi?')) { MU.remove(id); draw(); }
    };
    $('#muGen').onclick = () => { const t = MU.generate(); MU.play(t); notify(`${t.icon} ${t.name} üretildi`, '🎲'); };
    $('#muVol').oninput = e => MU.volume(e.target.value / 100);
    $('#muBg').onchange = e => {
      const bg = MU.background();
      if (e.target.checked && !bg.id) { const t = MU.playing() || MU.list()[0]; MU.background(t.id, true); }
      else MU.background(undefined, e.target.checked);
      if (e.target.checked && !MU.playing()) MU.play(MU.background().id);
      if (!e.target.checked && MU.playing() && MU.playing().id === MU.background().id) MU.stop();
      draw();
    };
    // görselleştirici çubukları
    const eq = () => {
      if (!alive()) return;
      const bars = view.querySelectorAll('.mu-eq i');
      if (bars.length) MU.levels(bars.length).forEach((v, i) => { bars[i].style.transform = `scaleY(${.15 + v * .85})`; });
      requestAnimationFrame(eq);
    };
    requestAnimationFrame(eq);
  }

  function renderMe() {
    const u = S().user;
    const meTab = ui.meTab || 'profil';
    const chatsCount = threads().length;
    const totalMsgs = chars().reduce((n, c) => n + msgCount(c), 0);

    view.innerHTML = `
      ${pageHero('me', '🙋', esc(u.name || 'İsimsiz'), [u.age ? `🎂 ${esc(u.age)}` : '', `📍 ${esc(u.city || 'Türkiye')}`, `${chars().length} karakter`, `${chatsCount} sohbet`, `${totalMsgs} mesaj`],
        `<label class="me-photo pg-act" title="Fotoğrafını değiştir">${userAvatar(64)}<span class="cam">📷</span><input type="file" accept="image/*" id="uPhoto" hidden></label>`, { pic: u.photo || '' })}

      <div class="me-tabs" id="meTabs">${ME_TABS.map(([k, l]) => `<button type="button" data-metab="${k}" class="${meTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <input type="file" id="restoreIn" accept=".json,application/json" hidden>

      <div class="page-pad narrow me-body" data-tab="${meTab}">
        <section class="me-sec" data-sec="profil">
          <div class="me-menu card">
            <a href="#/create"><span class="mi">✨</span>Karakter oluştur</a>
            <a href="#/messages"><span class="mi">💬</span>Mesajlar</a>
            <a href="#/monia"><span class="mi">🎬</span>Monia</a>
          </div>
          ${installCard()}
          <div class="card">
            <div class="sec-title" style="margin-top:0">Profilin</div>
            <div class="field"><label>Adın</label><input id="uName" maxlength="20" value="${esc(u.name)}" placeholder="Sohbetlerde senin adın"></div>
            <div class="field"><label>Yaşın</label><input id="uAge" inputmode="numeric" maxlength="2" value="${esc(u.age)}"></div>
            <div class="field"><label>Şehrin</label><input id="uCity" maxlength="20" value="${esc(u.city)}"></div>
            ${u.photo ? '<button class="btn ghost block" id="uPhotoRm" style="margin-top:12px">Fotoğrafımı kaldır</button>' : ''}
          </div>
        </section>

        <section class="me-sec" data-sec="ses">
          <div class="card music-card">
            <div class="mu-head"><div><div class="sec-title" style="margin:0">🎵 Müzikler</div><small>dosyasız, çalarken üretilir · ${MU ? MU.list().length : 0} parça</small></div>
              <button type="button" class="btn primary sm" id="muGen">🎲 Yeni müzik üret</button></div>
            <div class="mu-now" id="muNow"></div>
            <label class="mu-vol"><span>🔉</span><input type="range" id="muVol" min="0" max="100" value="${Math.round((MU ? MU.volume() : .6) * 100)}"><span>🔊</span></label>
            <div class="mu-list" id="muList"></div>
          </div>
          <div class="card" style="margin-top:12px">
            <div class="sec-title" style="margin-top:0">🔊 Sesler</div>
            <label class="flt-row"><span><b>🏠 Menü müziği</b> <small>🔁 ile seçtiğin parça ana menüde ve sohbet dışındaki sayfalarda çalar · sohbetlere ⋯ Diğer → 🎵 ile ayrı müzik seçebilirsin</small></span><input type="checkbox" id="muBg"${MU && MU.background().on ? ' checked' : ''}></label>
            <label class="flt-row"><span><b>👆 Tıklama sesi</b> <small>düğmelere dokununca kısa bir ses</small></span><input type="checkbox" id="clickOn"${clickOn() ? ' checked' : ''}></label>
          </div>
        </section>

        <section class="me-sec" data-sec="ayar">
          <div class="card">
            <div class="sec-title" style="margin-top:0">💬 Sohbet</div>
            <label class="flt-row"><span><b>🗺️ Mekan kartları</b> <small>sohbette otomatik mekan ve ipucu kartları · kapalıyken de senaryo olayları gelir</small></span><input type="checkbox" id="placesOn"${placesOn() ? ' checked' : ''}></label>
          </div>
        </section>

        <section class="me-sec" data-sec="veri">
          <div class="me-menu card">
            <a role="button" data-act="backup"><span class="mi">💾</span>Yedekle</a>
            <a role="button" data-act="restore"><span class="mi">📂</span>Yedekten yükle</a>
          </div>
        <div class="card" style="margin-top:12px">
          <div class="sec-title" style="margin-top:0">💾 Sistem kaydı <small>· yerel düzenleme</small></div>
          <div class="about">Açıkken eklediklerin tarayıcının yanında <b>js/data/system.js</b> dosyasına da yazılır; GitHub'a yükleyince her cihazda hazır gelir. Sadece <b>yerel-duzenleme.bat</b> ile açınca çalışır.</div>
          <div class="sys-stat" id="sysStat">Yerel sunucu kontrol ediliyor…</div>
          <label class="flt-row"><span><b>Sistem kaydı açık</b></span><input type="checkbox" id="sysOn"${sysCfg().on ? ' checked' : ''}></label>
          ${SYS_TYPES.map(t => `<label class="flt-row sys-type"><span>${esc(t.label)}</span><input type="checkbox" data-systype="${t.k}"${sysCfg().types[t.k] ? ' checked' : ''}></label>`).join('')}
          <a class="btn ghost block" href="#/bot" style="margin-top:10px">🤖 Bot editörü</a>
          <button class="btn ghost block" id="sysCats" style="margin-top:8px">🗂️ Olay kategorilerini ekle / düzenle</button>
          <button class="btn ghost block" id="sysPull" style="margin-top:8px">📥 Sistemdekileri buraya çek (system.js)</button>
          <button class="btn ghost block" id="sysNow" style="margin-top:8px">💾 Şimdi sisteme kaydet</button>
          <div class="sec-title">🔄 Uygulamalar arası taşıma</div>
          <div class="about">Telefondaki / yayındaki uygulamada eklediklerini düzenleyiciye getirmek için orada <b>📤 Dışa aktar</b>, burada <b>📥 İçe aktar</b>. Aynı kayıtlar güncellenir, kopya oluşmaz.</div>
          <div class="mo-ev-btns" style="margin-top:8px">
            <button class="btn ghost sm" id="moAllOut">📤 Monia verisini dışa aktar</button>
            <button class="btn ghost sm" id="moAllIn">📥 İçe aktar (birleştir)</button>
            <button class="btn ghost sm" id="moDedupe">🧹 Kopyaları temizle</button>
          </div>
        </div>

        <button class="btn ghost block" id="resetAll" style="margin-top:14px;color:#ff2d55">Tüm verileri sıfırla</button>
        </section>

        <section class="me-sec" data-sec="ayar">
        <div class="card" style="margin-top:12px">
          <div class="sec-title" style="margin-top:0">📏 Oluştur kuralları <small>· tüm karakterler için: bir özellik varken olamayacaklar</small></div>
          ${crRules().length ? `<div class="cr-list">${crRules().map(r => `<span class="cr-rule"><b>${esc(crLabel(r.if))}</b> → 🚫 ${esc((r.not || []).join(', '))}</span>`).join('')}</div>` : '<div class="about">Henüz kural yok. ör. Experience: Virgo → 🚫 Pussy Size: Loose. Oluştur\'da seçilemez, 🎲 rastgele de seçmez.</div>'}
          <a class="btn ghost block" href="#/kurallar" style="margin-top:12px">📏 Kurallar panelini aç</a>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="sec-title" style="margin-top:0">🔑 Anahtar kelimeler</div>
          ${keywords().length ? kwSummary(null)
            : '<div class="about">Her karaktere takip etmek istediğin kelimeleri ekle; uygulama karakterin onları kaç kez söylediğini sayar, istersen geçtikleri mesajlara efekt ekler.</div>'}
          <button class="btn ghost block" id="kwBtn" style="margin-top:12px">🔑 Anahtar kelimeleri düzenle</button>
        </div>
        </section>

        <section class="me-sec" data-sec="yardim">
        <div class="card">
          <div class="sec-title" style="margin-top:0">Carmen nasıl çalışır?</div>
          <div class="about">
            Burada yapay zeka yok, hikayeyi sen yazarsın.<br><br>
            • <b>Oluştur</b> sekmesinden karakterini fotoğrafı, albümü ve kişilik özellikleriyle oluştur.<br>
            • Sohbette alttaki avatara (ya da 🔁 Taraf) dokunarak <b>kimin yazdığını</b> seç: sen sağda, karakter solda.<br>
            • <b>⇄ Sırayla</b> açıksa her mesajdan sonra taraf kendiliğinden değişir.<br>
            • <b>📝 Not</b> ortada görünen bir anlatım satırı ekler.<br>
            • Bir karakterle birden çok <b>adlı sohbet</b> açabilirsin: profilinde ➕ ya da sohbette 🗂️. Ana sayfadaki 💬 son kaldığın sohbeti açar.<br>
            • Bir mesaja dokunarak ❤️ tepki verebilir, ↩️ cevaplayabilir, düzenleyebilir, tarafını değiştirebilir, üstüne mesaj ekleyebilir ya da taşıyabilirsin.<br>
            • <b>📷 Fotoğraf</b>: cihazından ya da karakterin albümünden fotoğraf mesajı gönder.<br>
            • <b>▶️ Oynat</b> sohbeti baştan, karakter "yazıyor…" diye tek tek gösterir.<br>
            • Tüm veriler sadece bu tarayıcıda (<code>localStorage</code>) saklanır. Başka cihaza taşımak için <b>Yedekle</b>.
          </div>
        </div>
        </section>
      </div>`;
    view.querySelectorAll('[data-metab]').forEach(b => b.onclick = () => {
      ui.meTab = b.dataset.metab;
      view.querySelectorAll('[data-metab]').forEach(x => x.classList.toggle('on', x === b));
      const body = view.querySelector('.me-body');
      body.dataset.tab = ui.meTab;
      body.classList.remove('page-in'); void body.offsetWidth; body.classList.add('page-in');
    });
    bindMusic();

    const ib = $('#installBtn');
    if (ib) ib.onclick = async () => { installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; renderMe(); };
    const bind = (sel, k) => $(sel).onchange = () => { u[k] = $(sel).value.trim(); save(); renderMe(); };
    bind('#uName', 'name'); bind('#uAge', 'age'); bind('#uCity', 'city');
    $('#uPhoto').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try { u.photo = await readPhoto(f, 320, true); save(); renderMe(); } catch (err) { notify('Fotoğraf okunamadı', '⚠️'); }
    };
    if ($('#uPhotoRm')) $('#uPhotoRm').onclick = () => { u.photo = ''; save(); renderMe(); };

    sysCheck().then(ok => {
      const el = $('#sysStat');
      if (!el) return;
      el.className = 'sys-stat ' + (ok ? 'ok' : 'off');
      el.textContent = ok ? '✅ Yerel sunucu bağlı: kayıtlar js/data/system.js dosyasına gider.' : '⚪ Yerel sunucu yok (bu ayar burada çalışmaz). yerel-duzenleme.bat ile aç.';
      $('#sysNow').disabled = !ok;
      $('#sysPull').disabled = !ok;
    });
    $('#sysOn').onchange = e => {
      const c = sysCfg(); c.on = e.target.checked; sysCfg(c);
      if (c.on) sysPush(true).catch(() => notify('Sistem kaydı yapılamadı', '⚠️'));
    };
    view.querySelectorAll('[data-systype]').forEach(cb => cb.onchange = () => { const c = sysCfg(); c.types[cb.dataset.systype] = cb.checked; sysCfg(c); });
    $('#clickOn').onchange = e => { clickOn(e.target.checked); if (e.target.checked) blink(); };
    $('#placesOn').onchange = e => placesOn(e.target.checked);
    $('#sysCats').onclick = () => catSheet();
    $('#sysPull').onclick = () => sysPull().then(r => { if (!r) notify('Yerel sunucu yok: yerel-duzenleme.bat ile aç', '⚠️'); }, () => notify('Sistem dosyası okunamadı', '⚠️'));
    $('#moAllOut').onclick = exportAllMonia;
    $('#moAllIn').onclick = importScenarios;
    $('#moDedupe').onclick = () => { const n = dedupeMonia(); save(); notify(n ? `${n} kopya silindi` : 'Kopya bulunamadı', '🧹'); };
    $('#sysNow').onclick = () => sysPush(true).then(ok => { if (!ok) notify('Yerel sunucu yok: yerel-duzenleme.bat ile aç', '⚠️'); }, () => notify('Sistem kaydı yapılamadı', '⚠️'));
    $('#kwBtn').onclick = () => keywordSheet({ onChange:() => { const y = window.scrollY; renderMe(); window.scrollTo(0, y); } });
    $('[data-act=backup]').onclick = () => {
      const blob = new Blob([JSON.stringify({ format: 'amor-stories-backup', version: 1, state: S() })], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `amor-stories-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('[data-act=restore]').onclick = () => $('#restoreIn').click();
    $('#restoreIn').onchange = async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data || data.format !== 'amor-stories-backup' || !data.state) throw new Error('format');
        if (!confirm('Yedek yüklensin mi? Bu cihazdaki karakterlerin ve sohbetlerin yedektekilerle değiştirilir.')) return;
        if (!Store.replace(data.state)) notify('Depolama dolu, yedek tam yüklenemedi', '⚠️');
        else notify('Yedek yüklendi', '📂');
        location.hash = '#/home';
        render();
      } catch (err) {
        notify('Bu dosya bir Carmen yedeği değil', '⚠️');
      }
    };
    $('#resetAll').onclick = () => {
      if (!confirm('Tüm karakterler ve sohbetler silinsin mi? Bu geri alınamaz.')) return;
      Store.reset();
      ui.create = null;
      location.hash = '#/home';
      render();
    };
  }

  /* ---------- Telefona yükleme (PWA) ---------- */
  let installPrompt = null;
  const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      // yerel düzenleme: eski sürümü göstermesin diye çevrimdışı önbellek kaldırılır
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {});
      if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {});
    } else {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
      // yeni sürüm devreye girince sayfa bir kez kendini yeniler (eski dosyalarla kalmasın)
      let reloaded = false;
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    }
  }
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    if (ui.route && ui.route.name === 'me') renderMe();
  });

  function installCard() {
    if (standalone() || !installPrompt) return '';
    return `<div class="card install"><span>📲</span><div><b>Carmen'i telefonuna yükle</b><small>Ana ekrandan uygulama gibi açılır, internetsiz de çalışır.</small></div><button class="btn sm pink" id="installBtn">Yükle</button></div>`;
  }

  /* ---------- Başlat ---------- */
  /* 🔊 Tıklama sesi: düğmelere dokununca kısa bir "blink" (Ben → ayar; bu tarayıcıda hatırlanır) */
  const clickOn = v => { try { if (v != null) localStorage.setItem('amor-stories:click', v ? '1' : '0'); return localStorage.getItem('amor-stories:click') !== '0'; } catch (e) { return true; } };
  // 🗺️ sohbette otomatik mekan / ipucu kartları (sohbet → ⋯ Diğer ya da Ben → ayar); varsayılan kapalı
  // 📊 sohbetin üstündeki durum kartı açık mı (varsayılan açık)
  const statsOn = v => { try { if (v != null) localStorage.setItem('amor-stories:stats', v ? '1' : '0'); return localStorage.getItem('amor-stories:stats') !== '0'; } catch (e) { return true; } };
  // 🔘 durum "Evet" olunca oynayan efektler (alan id → emojiler, bildirim; {o} = karakterin adı)
  const BOOL_FX = { hamile: { emojis: ['🤰', '👶', '🍼', '💗', '✨'], text: '🤰 {o} hamile!' } };
  const ZEVK_LABEL = 'zevk'; // 🙋 bu adla başlayan parametre yükseldikçe sohbet parlar
  const hudOn = v => { try { if (v != null) localStorage.setItem('amor-stories:hud', v ? '1' : '0'); return localStorage.getItem('amor-stories:hud') !== '0'; } catch (e) { return true; } };
  const placesOn = v => { try { if (v != null) localStorage.setItem('amor-stories:places', v ? '1' : '0'); return localStorage.getItem('amor-stories:places') === '1'; } catch (e) { return false; } };
  let audioCtx = null;
  function blink() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      // Gracie Web'in bildirim sesi (js/notify.js playDing): iki tonlu yumuşak "ding"
      const t = audioCtx.currentTime;
      [[880, 0], [1318.5, 0.09]].forEach(([freq, delay]) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t + delay);
        g.gain.exponentialRampToValueAtTime(0.16, t + delay + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.38);
        o.connect(g).connect(audioCtx.destination);
        o.start(t + delay); o.stop(t + delay + 0.42);
      });
    } catch (e) {}
  }
  document.addEventListener('pointerdown', e => {
    if (e.button || !clickOn()) return;
    if (e.target.closest('button, a[href], .nav a, label.flt-row, [role="button"], .chip')) blink();
  }, true);

  /* 🎵 Hangi müzik çalsın: sohbet dışında 🏠 menü müziği (Ben → Ses), sohbette o sohbetin müziği (⋯ → 🎵, yoksa sessiz).
   * Sadece menü ↔ sohbet geçişinde karar verir; elle başlattığın parça sayfalar arasında sürer.
   * Tarayıcılar sesi dokunmadan başlatmadığı için ilk dokunuşa kadar bekler. */
  let musicUnlocked = false;
  function syncMusic(force) {
    if (!MU || !musicUnlocked) return;
    const r = ui.route || {}, th = r.name === 'chat' && threadById(r.id), key = th ? 'chat:' + th.id : 'menu';
    if (!force && ui.musicCtx === key) return;
    ui.musicCtx = key;
    const bg = MU.background(), want = th ? th.music || '' : bg.on ? bg.id : '', now = MU.playing();
    if (!want) { if (now && (th || ui.musicFrom === 'chat')) MU.stop(); ui.musicFrom = ''; return; }
    if (!now || now.id !== want) MU.play(want);
    ui.musicFrom = th ? 'chat' : 'menu';
  }
  document.addEventListener('pointerdown', () => { if (musicUnlocked) return; musicUnlocked = true; syncMusic(true); }, true);

  // 🎵 çalan müzik: her sayfada küçük bir düğme (dokununca Ben → Ses, ■ durdurur)
  if (MU) {
    const pill = document.createElement('div');
    pill.className = 'mini-mu';
    pill.hidden = true;
    app.appendChild(pill);
    MU.onChange(tr => {
      pill.hidden = !tr;
      if (!tr) return;
      pill.innerHTML = `<button type="button" class="mm-go"><span class="mm-ic">${esc(tr.icon)}</span><span class="mm-eq"><i></i><i></i><i></i></span><b>${esc(tr.name)}</b></button><button type="button" class="mm-stop" aria-label="Durdur">■</button>`;
      pill.querySelector('.mm-go').onclick = () => { ui.meTab = 'ses'; if (location.hash === '#/me') render(); else location.hash = '#/me'; };
      pill.querySelector('.mm-stop').onclick = () => MU.stop();
    });
  }

  adoptSystem();
  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', e => { if (ui.chatKeys) ui.chatKeys(e); });
  wideMQ.addEventListener('change', () => { if (['messages', 'chat'].includes(ui.route.name)) render(); });
  render();
  setTimeout(() => $('#splash').classList.add('hide'), 700);
})();
