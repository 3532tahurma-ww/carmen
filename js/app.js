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
    { k: 'cats', label: '🗂️ Olay kategorileri (sırası, eklediklerin, adları), 📶 dereceler, 📊 parametreler, ⚡ eşik olayları, 🤖 bot sonuçları, 📏 Oluştur kuralları, ⚙️ izin ayarları ve 🕰️ saat', on: true },
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
      if (mo.clock) out.clock = mo.clock;
      if (mo.bandRules) out.bandRules = mo.bandRules;
      if (mo.botOuts) out.botOuts = mo.botOuts;
      if (mo.crRules) out.crRules = mo.crRules;
      if (mo.permCfg) out.permCfg = mo.permCfg;
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
    ['levels', 'catOrder', 'params', 'triggers', 'botOuts', 'crRules', 'permCfg', 'sharedOuts', 'clock', 'bandRules'].forEach(k => { if (data[k] && (prefer === 'incoming' || !mo[k])) mo[k] = JSON.parse(JSON.stringify(data[k])); });
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
    // kayıtlı karakterin düzenleme taslağı sayfadan çıkınca bırakılır; yeniden açınca güncel hâli gelir (sohbette değişen Hamile vb.)
    if (['chat', 'p', 'home', 'messages', 'esles'].includes(r.name) && ui.create && ui.create.key !== 'new') ui.create = null;
    syncMusic();
    // 🤖 bot editöründen çıkınca kaydedilen kurallar uygulamaya gelir
    if (ui.lastRoute === 'bot' && r.name !== 'bot') reloadBotRules().then(ok => { if (ok && ui.route.name === 'monia' && ui.route.id === 'sonuc') renderMonia('sonuc'); });
    ui.lastRoute = r.name;
    drawHelper(false);
    switch (r.name) {
      case 'bot': return renderBot();
      case 'kurallar': return r.id === 'izin' ? renderPermRulesPage() : renderRulesPage();
      case 'deney': return renderBotLab();
      case 'esles': return renderMatch();
      case 'carmen': return renderCarmen(r.id);
      case 'internet': return renderInternet();
      case 'shop': return renderShop();
      case 'klinik': return renderClinic(r.id);
      case 'is': return renderJobs(r.id);
      case 'itiraf': return renderConfess();
      case 'flix': return renderFlix(r.id, r.extra);
      case 'canli': return renderLive(r.id);
      case 'fans': return renderFans(r.id);
      case 'otel': return renderStay(r.id);
      // #/kitap/<kitap>/<bölüm> (eski #/kitap/<bölüm> Carmen Kitabı)
      case 'kitap': return r.id != null && isNaN(+r.id) ? renderBook(r.id, r.extra == null ? NaN : +r.extra) : renderBook('carmen', r.id == null ? NaN : +r.id);
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
      ${(S().botMiss || []).length ? `<a class="about card bot-miss" href="#/deney">📭 <b>${S().botMiss.length} eksik cevap</b>: sohbette karakterin anlamadığı mesajlar. En çok tekrarlananlar: ${S().botMiss.slice().sort((a, b) => b.n - a.n).slice(0, 3).map(x => `"${esc(x.t)}" ×${x.n}`).join(', ')} → 🧪 Bot deneyinde gör</a>` : ''}
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
          <span><button type="button" class="icon-btn hl-dice" id="hlBoss" aria-label="Patron geldi" title="Patron geldi">🙈</button>
          <button type="button" class="icon-btn hl-dice" id="hlShuffle" aria-label="Fotoğrafları değiştir" title="Fotoğrafları değiştir">🎲</button></span>
        </div>
        ${(() => { const m = meetDraft(); return `<a class="hl-meet" id="hlMeet" href="#/esles">
          ${m.photo ? `<img src="${esc(m.photo)}" alt="" onerror="this.remove()">` : ''}<span class="hl-shade"></span>
          <span class="hl-ic">💘</span>
          <span class="hl-txt"><small>Eşleş</small><b>${esc(m.name || 'Yeni biri')}${m.age ? `, ${esc(m.age)}` : ''}</b>
            <small>${esc([m.city, m.job].filter(Boolean).join(' · '))}</small>
            <span class="hl-tr">${persOf(m).slice(0, 3).map(t => `<em>${esc(t)}</em>`).join('')}</span></span>
          <span class="hl-go">›</span>
        </a>`; })()}
        <a class="hl-meet hl-net" href="#/internet">
          ${pool.length ? `<img src="${esc(pool[+sysHash('internet') % pool.length])}" alt="" onerror="this.remove()">` : ''}<span class="hl-shade"></span>
          <span class="hl-ic">🌐</span>
          <span class="hl-txt"><small>İnternet</small><b>Siteler</b><span class="hl-tr"><em>🌹 Carmen.com</em><em>🫦 Fans</em><em>🍿 Flix</em><em>🏨 Stay</em><em>🎥 Live</em><em>+4</em></span></span>
          <span class="hl-go">›</span>
        </a>
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
    $('#hlBoss').onclick = () => bossKey();
  }
  const persOf = m => m.traits.filter(t => (T.groups.find(g => g.id === 'personality') || { values: [] }).values.includes(t));
  /* 💘 Eşleş (#/esles): rastgele kızlardan bir deste; sağa kaydır (❤️) → kaydedilir, sohbet açılır ve ilk selamı o verir,
   * sola kaydır (✕) → sıradaki. Deste oturum boyunca durur (ana sayfadaki kart destenin en üstündekini gösterir) */
  // 🔎 Eşleş filtreleri (bu tarayıcıda): yaş aralığı, şehir, kişilik, göğüs, kalça; uymayan kart desteye girmez (en fazla 80 deneme)
  const matchF = v => { try { if (v) localStorage.setItem('amor-stories:matchf', JSON.stringify(v)); return JSON.parse(localStorage.getItem('amor-stories:matchf') || '{}') || {}; } catch (e) { return {}; } };
  const matchFits = (d, f) => (!f.ageMin || +d.age >= +f.ageMin) && (!f.ageMax || +d.age <= +f.ageMax) && (!f.city || d.city === f.city)
    && (!f.pers || d.traits.includes(f.pers)) && (!f.boob || d.traits.includes(f.boob)) && (!f.butt || d.traits.includes(f.butt));
  const matchDeck = () => {
    ui.matchDeck = ui.matchDeck || [];
    const f = matchF();
    while (ui.matchDeck.length < 3) {
      let d = null;
      for (let i = 0; i < 80 && !d; i++) {
        const x = blankChar(), mod = ui.createMod;
        ui.createMod = 'amor'; randomize(x, 'all'); ui.createMod = mod;
        // istenen özellik kurala uyuyorsa elle de verilir (rastgele hiç tutmazsa)
        if (i === 79) { ['pers', 'boob', 'butt'].forEach(k => { if (f[k] && !x.traits.includes(f[k])) { const g = T.groups.find(gg => gg.values.includes(f[k])); x.traits = [...x.traits.filter(t => !(g && g.single && g.values.includes(t))), f[k]]; } }); if (f.city) x.city = f.city; if (f.ageMin && +x.age < +f.ageMin) x.age = +f.ageMin; if (f.ageMax && +x.age > +f.ageMax) x.age = +f.ageMax; }
        if (matchFits(x, f) || i === 79) d = x;
      }
      ui.matchDeck.push(d);
    }
    return ui.matchDeck;
  };
  function matchStart(m, star) {
    const c = Object.assign(m, { id: Store.uid(), created: Date.now() });
    // ⭐ süper beğeni: ❤️ Aşk +20 ile başlar
    if (star) { const p = allParams().find(x => x.who !== 'me' && String(x.label).toLocaleLowerCase('tr') === 'aşk'); if (p) { c.params = c.params || {}; c.params[p.id] = Math.min(+p.max || 100, (+p.start || 0) + 20); } }
    chars().push(c);
    const t = newThread(c, star ? 'Süper eşleşme' : 'Eşleşme');
    msgsOf(t).push({ id: Store.uid(), from: 'her', text: star ? pick(['Süper beğeni mi?! 😳💗', 'Vay, yıldız mı attın bana? ⭐🙈', 'Bu kadar mı beğendin beni? 🥺💘', 'Süper beğeni… etkilendim 😏⭐'])
      : pick([`Selam 👋 ben ${c.name.split(' ')[0]}`, 'Heyy, eşleştik 😊', `Merhaba! ${c.city ? trEk(c.city, 'den') + ' ' : ''}yazıyorum 🙈`, 'Sağa kaydırdın demek 😏', 'Sonunda biri cesaret etti 💘', 'Profilime uzun baktın galiba 🙈']), ts: Date.now() });
    save();
    sfx('match');
    return t;
  }
  function matchFilterSheet(done) {
    const f = matchF(), opt = (v, cur, l) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`, g = id => T.groups.find(x => x.id === id) || { values: [], items: [] };
    const cities = [...new Set(P.cities || [])].sort((a, b) => a.localeCompare(b, 'tr'));
    const sh = sheet(`<div class="sheet-grip"></div><h3>🔎 Eşleş filtreleri</h3>
      <div class="mt-f"><label>Yaş<span><input type="number" id="mfMin" min="18" max="99" placeholder="en az" value="${esc(f.ageMin || '')}"> – <input type="number" id="mfMax" min="18" max="99" placeholder="en çok" value="${esc(f.ageMax || '')}"></span></label>
        <label>Şehir<select id="mfCity"><option value="">Hepsi</option>${cities.map(c => opt(c, f.city, c)).join('')}</select></label>
        <label>Kişilik<select id="mfPers"><option value="">Hepsi</option>${g('personality').values.map(v => opt(v, f.pers, v)).join('')}</select></label>
        <label>🍒 Göğüs<select id="mfBoob"><option value="">Hepsi</option>${g('boob').values.map((v, i) => opt(v, f.boob, g('boob').items[i])).join('')}</select></label>
        <label>🍑 Kalça<select id="mfButt"><option value="">Hepsi</option>${g('butt').values.map((v, i) => opt(v, f.butt, g('butt').items[i])).join('')}</select></label></div>
      <div class="row-btns"><button class="btn ghost" data-mf="clear">Temizle</button><button class="btn primary" data-mf="ok">Uygula</button></div>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-mf]');
      if (!b) return;
      const v = b.dataset.mf === 'clear' ? {} : { ageMin: sh.el.querySelector('#mfMin').value, ageMax: sh.el.querySelector('#mfMax').value, city: sh.el.querySelector('#mfCity').value,
        pers: sh.el.querySelector('#mfPers').value, boob: sh.el.querySelector('#mfBoob').value, butt: sh.el.querySelector('#mfButt').value };
      matchF(v);
      ui.matchDeck = null;
      sh.close();
      done();
    };
  }
  function renderMatch() {
    const deck = matchDeck(), hamile = c => (c.fields || {}).hamile;
    const info = c => {
      const sz = ['Boob Size', 'Butt Size', 'Experience'].map(g => { const t = c.traits.find(x => x.startsWith(g + ':')); return t ? `<em>${esc(t.replace(/^[^:]+:\s*/, g === 'Experience' ? '✨ ' : g === 'Boob Size' ? '🍒 ' : '🍑 '))}</em>` : ''; }).join('');
      const likes = feelEvents(c.likes || []).slice(0, 5);
      return `${c.bio ? `<p>${esc(c.bio)}</p>` : ''}<div class="mt-tags">${sz}${c.zodiac ? `<em>${esc(c.zodiac)}</em>` : ''}${hamile(c) ? '<em>🤰 Hamile</em>' : ''}</div>
        ${likes.length ? `<div class="mt-likes"><small>❤️ Sever</small>${likes.map(e => `<span class="st-fe${evCls(e)}"${evStyle(e)}>${evEmo(e)}${esc(e.title)}</span>`).join('')}</div>` : ''}`;
    };
    const card = (c, i) => `<div class="mt-card${i ? ' back' : ' top'}${ui.matchInfo && !i ? ' open' : ''}" ${i ? '' : 'id="mtTop"'} style="--mtbg:${esc(grad(c))}">
        ${c.photo ? `<img src="${esc(c.photo)}" alt="" draggable="false" onerror="this.remove()">` : `<span class="mt-ini">${esc((c.name || '?')[0])}</span>`}
        <span class="mt-stamp yes">LIKE 💘</span><span class="mt-stamp no">NOPE ✕</span>
        <div class="mt-info"><b>${esc(c.name || 'Yeni biri')}${c.age ? `<span>, ${esc(c.age)}</span>` : ''}</b>
          <small>${esc([c.city, c.job].filter(Boolean).join(' · '))}</small>
          <div class="mt-tr">${persOf(c).map(t => `<em>${esc(t)}</em>`).join('')}</div>
          ${!i && ui.matchInfo ? info(c) : ''}</div></div>`;
    const fN = Object.values(matchF()).filter(Boolean).length;
    view.innerHTML = `<div class="page-pad narrow mt-page">
      ${pageHero('esles', '💘', 'Eşleş', [`${chars().length} karakter`, 'sağa kaydır → sohbet'], `<button type="button" class="btn ghost sm pg-act" id="mtFilter">🔎 Filtre${fN ? ` · ${fN}` : ''}</button>`, { back: '#/home' })}
      <div class="mt-stack">${deck.slice(0, 2).reverse().map(c => card(c, deck.indexOf(c))).join('')}</div>
      <div class="mt-acts">
        <button type="button" class="mt-btn undo" data-mt="undo" aria-label="Geri al"${ui.matchPrev ? '' : ' disabled'}>↶</button>
        <button type="button" class="mt-btn no" data-mt="no" aria-label="Geç">✕</button>
        <button type="button" class="mt-btn star" data-mt="star" aria-label="Süper beğeni">⭐</button>
        <button type="button" class="mt-btn yes" data-mt="yes" aria-label="Beğen">💘</button>
        <button type="button" class="mt-btn info${ui.matchInfo ? ' on' : ''}" data-mt="info" aria-label="Bilgi">ℹ️</button>
      </div></div>`;
    $('#mtFilter').onclick = () => matchFilterSheet(renderMatch);
    const top = $('#mtTop');
    const decide = (yes, star) => {
      if (!top || top.dataset.gone) return;
      top.dataset.gone = 1;
      top.style.transition = 'transform .35s ease-in, opacity .35s';
      top.style.transform = star ? 'translateY(-130%) scale(.9)' : `translateX(${yes ? 140 : -140}%) rotate(${yes ? 24 : -24}deg)`;
      top.style.opacity = '0';
      const m = deck.shift();
      ui.matchInfo = false;
      // ↶ sadece son geçilen kart geri alınır
      if (!yes) { ui.matchPrev = m; return setTimeout(() => { if (ui.route.name === 'esles') renderMatch(); }, 280); }
      ui.matchPrev = null;
      const t = matchStart(m, star);
      // 💘 eşleşme ekranı, sonra sohbet
      const ov = document.createElement('div');
      ov.className = 'mt-match' + (star ? ' star' : '');
      ov.innerHTML = `<div><h2>${star ? '⭐ Süper eşleşme!' : '💘 Eşleştiniz!'}</h2><div class="mt-pair">${avatar(m, 84)}<span>💞</span>${S().user.photo ? `<img class="mt-me" src="${esc(S().user.photo)}" alt="">` : '<span class="mt-me">🙋</span>'}</div><p>${esc(m.name)} seni de beğendi</p><small>Sohbet açılıyor…</small></div>`;
      document.body.appendChild(ov);
      const go = () => { ov.remove(); location.hash = `#/chat/${t.id}`; };
      ov.onclick = go;
      setTimeout(() => { if (ov.isConnected) go(); }, 1600);
    };
    view.querySelector('.mt-acts').onclick = e => {
      const b = e.target.closest('[data-mt]');
      if (!b) return;
      if (b.dataset.mt === 'info') { ui.matchInfo = !ui.matchInfo; return renderMatch(); }
      if (b.dataset.mt === 'undo') { if (ui.matchPrev) { deck.unshift(ui.matchPrev); ui.matchPrev = null; renderMatch(); } return; }
      decide(b.dataset.mt !== 'no', b.dataset.mt === 'star');
    };
    if (!top) return;
    // 👆 sürükle: yeterince sağa / sola gidince karar, yoksa geri döner; kısa dokunuş bilgiyi açar
    let x0 = null, y0 = 0, dx = 0;
    top.onpointerdown = e => { x0 = e.clientX; y0 = e.clientY; dx = 0; top.setPointerCapture(e.pointerId); top.style.transition = 'none'; };
    top.onpointermove = e => {
      if (x0 == null) return;
      dx = e.clientX - x0;
      top.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
      top.style.setProperty('--yes', Math.max(0, Math.min(1, dx / 100)));
      top.style.setProperty('--no', Math.max(0, Math.min(1, -dx / 100)));
    };
    const end = e => {
      if (x0 == null) return;
      const tap = Math.abs(dx) < 6 && Math.abs(e.clientY - y0) < 6;
      x0 = null;
      if (Math.abs(dx) > 100) return decide(dx > 0);
      top.style.transition = 'transform .25s ease-out';
      top.style.transform = '';
      top.style.setProperty('--yes', 0); top.style.setProperty('--no', 0);
      if (tap) { ui.matchInfo = !ui.matchInfo; renderMatch(); }
    };
    top.onpointerup = end;
    top.onpointercancel = end;
  }
  /* 🌹 Carmen.com (#/carmen): kayıtlı karakterler bir ilan sitesindeki gibi kartlarla; kart → #/carmen/<id> profil sayfası
   * (hakkımda, 📏 fiziksel, 🫦 iyi yaptıkları, 🛡️ kondom şartı, seanslar). İlanlar = kayıtlı karakterler + bu tarayıcıda üretilmiş
   * ilan kızları (localStorage amor-stories:carmen-ads; mesaj atınca kaydedilir). Puan / boy / ücret / çevrimiçi id'den sabit üretilir */
  // cmRid: ilan kızı kaydedilince eski ilan id'si; puan / ücret / yorumlar değişmesin
  const cmNum = (c, k, n) => +sysHash((c.cmRid || c.id) + ':' + k) % n;
  const cmPick = (c, k, a) => a[cmNum(c, k, a.length)];
  const cmPicks = (c, k, a, n) => [...a].sort((x, y) => +sysHash((c.cmRid || c.id) + k + x) - +sysHash((c.cmRid || c.id) + k + y)).slice(0, n);
  const CM_N = 36;
  // her ilanın kendi fotoğraf seti var: kayıtlı karakterlerin ve diğer ilanların setleri / fotoğrafları kullanılmaz
  const CM_KEY = 'amor-stories:carmen-ads2';
  function cmAds(fresh) {
    if (!ui.cmAds || fresh) {
      let a = [];
      try { localStorage.removeItem('amor-stories:carmen-ads'); if (!fresh) a = JSON.parse(localStorage.getItem(CM_KEY) || '[]') || []; } catch (e) { a = []; }
      const charSets = new Set(chars().map(c => c.set).filter(Boolean)), charPics = new Set(chars().flatMap(c => [c.photo, ...(c.album || [])]).filter(Boolean));
      a = a.filter((x, i) => !charSets.has(x.set) && !charPics.has(x.photo) && a.findIndex(y => y.set === x.set) === i);
      const used = new Set(a.map(x => x.set)), free = sample(SETS.filter(s => !charSets.has(s.id) && !used.has(s.id) && !charPics.has(photoUrl(s, s.profile))), CM_N);
      const mod = ui.createMod;
      ui.createMod = 'amor';
      while (a.length < CM_N && free.length) {
        const x = blankChar();
        randomize(x, 'all');
        applySet(x, free.shift());
        Object.assign(x, { id: 'cm' + Store.uid(), created: Date.now() - Math.floor(Math.random() * 40) * 864e5, cmVip: Math.random() < .3, age: Math.max(18, +x.age || 18) });
        a.push(x);
      }
      ui.createMod = mod;
      ui.cmAds = a;
      try { localStorage.setItem(CM_KEY, JSON.stringify(a)); } catch (e) {}
    }
    return ui.cmAds;
  }
  const cmAll = () => [...chars(), ...cmAds()].filter((c, i, a) => !c.photo || a.findIndex(x => x.photo === c.photo) === i);
  const cmFind = id => byId(id) || cmAds().find(x => x.id === id);
  const cmVip = c => c.cmVip != null ? !!c.cmVip : cmNum(c, 'vip', 4) === 0;
  const cmOnline = c => cmNum(c, 'on', 3) > 0;
  const cmStars = c => (cmVip(c) ? 4.6 + cmNum(c, 'st', 5) / 10 : 4 + cmNum(c, 'st', 10) / 10).toFixed(1);
  const cmBadge = c => Date.now() - (c.created || 0) < 3 * 864e5 ? 'YENİ' : '';
  // 📏 fiziksel özellikler: göğüs / kalça / dar-geniş / deneyim özelliklerden, boy-kilo-saç-göz id'den
  const CM_SIZE = { 'Extremely Tight': 'Çok çok dar', 'Very Tight': 'Çok dar', Tight: 'Dar', Average: 'Normal', Relaxed: 'Rahat', Loose: 'Geniş', 'Very Loose': 'Çok geniş' };
  const CM_EXP = { Virgo: 'Bakire', Little: 'Az', Some: 'Biraz', Medium: 'Orta', Much: 'Çok', 'A lot': 'Epey', Great: 'Uzman' };
  const CM_CUP = { 70: 'A', 75: 'B', 80: 'C', 85: 'D', 90: 'DD', 95: 'E' };
  const cmTrait = (c, g) => { const t = (c.traits || []).find(x => x.startsWith(g + ':')); return t ? t.replace(/^[^:]+:\s*/, '') : ''; };
  function cmBody(c) {
    const h = 155 + cmNum(c, 'boy', 26), boob = +cmTrait(c, 'Boob Size') || 0, butt = cmTrait(c, 'Butt Size'), pus = cmTrait(c, 'Pussy Size'), an = cmTrait(c, 'Anal Size'), ex = cmTrait(c, 'Experience');
    const big = ['L', 'XL'].includes(butt), small = ['XS', 'S'].includes(butt);
    const kg = Math.round(h - 112 + (boob ? (boob - 80) / 4 : 0) + (big ? 5 : small ? -4 : 0) + cmNum(c, 'kg', 7) - 3);
    const shape = boob >= 90 || big ? 'Kıvrımlı' : small && boob && boob <= 75 ? 'Minyon' : cmPick(c, 'vu', ['Fit', 'İnce', 'Atletik', 'Balık etli', 'Kum saati']);
    return [['📏', 'Boy', h + ' cm'], ['⚖️', 'Kilo', kg + ' kg'], ['✨', 'Vücut', shape],
      ['💇‍♀️', 'Saç', cmPick(c, 'sa', ['Sarı', 'Kumral', 'Siyah', 'Kızıl', 'Açık kahve', 'Koyu kahve', 'Platin sarı', 'Bal köpüğü'])],
      ['👁️', 'Göz', cmPick(c, 'go', ['Kahverengi', 'Ela', 'Yeşil', 'Mavi', 'Siyah', 'Bal rengi'])], ['🧴', 'Ten', cmPick(c, 'te', ['Beyaz', 'Buğday', 'Bronz', 'Esmer', 'Porselen'])],
      boob && ['🍒', 'Göğüs', `${boob} ${CM_CUP[boob] || ''}`.trim()], butt && ['🍑', 'Kalça', butt], pus && ['🌸', 'Vajina', CM_SIZE[pus] || pus], an && ['🍑', 'Anal', CM_SIZE[an] || an],
      ex && ['🔥', 'Deneyim', CM_EXP[ex] || ex]].filter(Boolean);
  }
  // 🛡️ kondom şartı: ✅ izinlerden (Nothing / hap / sabah hapı / dışarı boşalma yoksa kondom şart)
  function cmProt(c) {
    const low = s => String(s || '').toLocaleLowerCase('tr').trim(), a = t => feelEvents(c.allows || []).some(e => low(e.title) === t);
    const nothing = a('nothing'), pill = a('control pill'), morning = a('morning-after pill'), pull = a('pull-out method');
    return { need: !nothing && !pill && !morning && !pull, inside: nothing || pill || morning, nothing, pill, morning, pull };
  }
  function cmRules(c) {
    const p = cmProt(c);
    return [p.need ? ['🛡️', 'Kondom şartım vardır.', 'Kondomsuz görüşme yapmıyorum, sağlığım her şeyden önce gelir.']
      : ['🔥', 'Kondom şartım yoktur.', p.pill ? 'Doğum kontrol hapı kullanıyorum, içi rahat olsun.' : p.morning ? 'Gerekirse ertesi sabah hap alırım.' : p.pull ? 'Kondomsuz olur ama sonunda dışarı boşalman şartıyla.' : 'Hiçbir şey kullanmasan da olur 😈'],
      p.inside ? ['💦', 'İçime boşalabilirsin.', p.nothing ? 'Bunu çok severim, hiç çekinme 😏' : 'Merak etme, önlemimi alırım.']
        : ['🚫', 'İçe boşalmaya izin vermiyorum.', 'Lütfen ısrar etmeyin, bu konuda kesinim.']];
  }
  // 💎 seanslar: kısa / standart / uzun / gece + sevdiklerine uyan seans tipleri (SEANS_TYPES); VIP 2.5 kat; kondom şartı yoksa kondomsuz +%40
  function cmSessions(c) {
    const base = (1500 + cmNum(c, 'pr', 12) * 250) * (cmVip(c) ? 2.5 : 1), r = n => Math.round(n / 50) * 50, p = cmProt(c);
    const liked = new Set(feelEvents(c.likes || []).map(e => String(e.title).toLocaleLowerCase('tr')));
    const themed = SEANS_TYPES.filter(s => s.id !== 'hamile' || (c.fields || {}).hamile).map(s => ({ s, n: s.seq.filter(t => liked.has(t.toLocaleLowerCase('tr'))).length }))
      .filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 3).map(({ s }) => [s.icon, s.name + ' seansı', '1,5 saat', 1.6, s.desc.split(/[.:]/)[0]]);
    return [['⏱️', 'Kısa seans', '30 dk', .6, 'Hızlı ve tutkulu bir kaçamak'], ['🕐', 'Standart seans', '1 saat', 1, 'Isınma, sohbet ve tam bir keyif'],
      ['🕑', 'Uzun seans', '2 saat', 1.8, 'Acele yok, her pozisyonun tadını çıkarırız'], ...themed, ['🌙', 'Gece seansı', 'sabaha kadar', 5, 'Sabah kahvaltısı dahil 😉']]
      .map(([ic, name, dur, m, desc]) => ({ ic, name, dur, desc, kon: r(base * m), raw: p.need ? 0 : r(base * m * 1.4) }));
  }
  const cmTl = n => n.toLocaleString('tr-TR') + ' ₺';
  // 💌 hakkımda: flörtöz açılış + kişilik + vücut + sevdiği + kapanış
  const CM_OPEN = ['Merhaba canım, ben {ad} 💋', 'Selam yakışıklı, ben {ad}…', 'Hoş geldin, ben {ad}; seni bekliyordum 😏', 'Ben {ad}, bu gecenin en güzel sürprizi 🌹', 'Merhaba beyefendi, ben {ad} 💄'];
  const CM_FLIRT = ['Sana unutamayacağın mutlu anlar yaşatıyorum.', 'Zevk kadınınız olmaya hazırım.', 'Benimle geçen her dakika ayrı bir keyif.', 'Kapıdan girdiğin andan itibaren bütün stresini unutturacağım.',
    'Gerçek bir sevgili deneyimi arıyorsan doğru yerdesin.', 'Temizliğe ve gizliliğe çok önem veririm; aramızda kalır.', 'Acele etmem, her anın tadını birlikte çıkarırız.', 'Sınırlarını zorlamayı seven beyler için biçilmiş kaftanım.',
    'Kibar, bakımlı ve cömert beyleri çok severim.', 'Yanımda kendini bir kral gibi hissedeceksin.', 'Tatlı bir sohbetle başlar, tutkulu bir finalle biteriz.', 'Bir kez gelen bir daha gelir 😉',
    'Dokunuşlarım seni benden başka hiçbir şey düşünemez hâle getirecek.', 'Fantezilerini anlat, gerçeğe dönüştüreyim.', 'Seni memnun etmek benim en büyük zevkim.', 'Ses tonum bile seni tahrik etmeye yeter 🔥'];
  const CM_PERS = { 'Utangaç': 'İlk başta biraz utangacımdır ama ısındım mı durdurulamam 🙈', 'Flörtöz': 'Flört etmeye bayılırım; bakışlarımla bile seni tahrik ederim.', 'Neşeli': 'Gülmeyi ve güldürmeyi severim, benimle asla sıkılmazsın.',
    'Romantik': 'Mum ışığı, şarap ve yavaş dokunuşlar… romantik bir ruhum var.', 'Soğuk': 'Dışarıdan soğuk görünürüm ama yatakta buzlar erir ❄️🔥', 'Asi': 'Kurallara pek uymam; biraz yaramaz, biraz asiyim.',
    'Sakin': 'Sakin ve huzurlu bir ortam yaratırım, kendini bana bırak.', 'Gizemli': 'Biraz gizemliyim; beni keşfetmek sana kalmış.', 'Şımarık': 'Biraz şımarığımdır, beni şımartan beyleri asla unutmam 💅',
    'Olgun': 'Olgun ve tecrübeli bir kadınım; ne istediğini anlamam bir bakış sürer.', 'Çocuksu': 'İçimdeki yaramaz kız seni çok eğlendirecek.', 'Kibirli': 'Pahalı zevklerim var ve buna fazlasıyla değerim.',
    'Komik': 'Esprilerime gülmeden kapıdan çıkamazsın 😄', 'Özgüvenli': 'Vücudumla barışığım ve bunu sana göstermekten zevk alırım.', 'Güvensiz': 'Bana nazik davranırsan karşılığını fazlasıyla alırsın.',
    'Duygusal': 'Bağ kurduğum adama her şeyimi veririm.', 'Manipülatif': 'Ne istediğini sen söylemeden bilirim… ve sana istediğimi yaptırırım 😈', 'Korumacı': 'Yanımda kendini güvende hissedeceksin.',
    'Sadık': 'Düzenli görüştüğüm beylere çok bağlıyımdır.', 'Meraklı': 'Yeni şeyler denemeye her zaman açığım.', 'Alaycı': 'Dilim biraz sivridir ama tatlıdır 😏', 'Dürüst': 'Ne vaat ediyorsam o; sürpriz yok, sadece zevk var.',
    'Ciddi': 'Profesyonelimdir; dakik ve özenli.', 'Mantıklı': 'Her şey net: kurallar belli, keyif garanti.', 'Gergin': 'İlk dakikalar heyecanlanırım ama sonra ikimiz de uçarız.', 'İnatçı': 'İstediğimi alana kadar bırakmam 😏',
    'Kıskanç': 'Benimleyken sadece bana bakacaksın 😘', 'Alçakgönüllü': 'Gösterişi sevmem; sade, sıcak ve içten bir kadınım.' };
  const CM_CLOSE = ['Hemen yaz, seni bekliyorum 💌', 'Mesajını bekliyorum yakışıklı 😘', 'Randevu için mesaj at, gerisini bana bırak 🌹', 'Bu gece müsaitim… geç kalma 😉'];
  // 🫦 sevdikleri: "bunları çok iyi yaparım"
  const CM_GOOD = ['💋 {e} benim uzmanlık alanım.', '🔥 {e} konusunda çok iddialıyım, denemeden bilemezsin.', '😈 {e} yaparken kendimi kaybederim.', '✨ {e} yaptığımda kimse unutamıyor.',
    '💦 {e} en sevdiğim, en iyi yaptığım şey.', '🌹 {e} için bana gelen bir daha gelir.', '🥵 {e} yaparken sesimi bastıramıyorum.', '👑 {e} deyince akla ilk ben gelirim.', '🫦 {e}… bunu sana göstermek için sabırsızlanıyorum.', '💯 {e} mi? Bunu çok iyi yaparım.'];
  function cmAbout(c) {
    const first = (c.name || 'Ben').split(' ')[0], pers = persOf(c), body = Object.fromEntries(cmBody(c).map(([, k, v]) => [k, v])), likes = feelEvents(c.likes || []);
    return [
      [cmPick(c, 'op', CM_OPEN).replace('{ad}', first), `${c.age ? c.age + ' yaşında, ' : ''}${c.city ? trEk(c.city, 'de') + ' yaşayan ' : ''}${body.Saç.toLocaleLowerCase('tr')} saçlı, ${body.Vücut.toLocaleLowerCase('tr')} bir kadınım.`,
        c.job ? `Gündüzleri ${c.job.toLocaleLowerCase('tr')}, geceleri senin en güzel sırrın.` : ''].filter(Boolean).join(' '),
      [...pers.map(t => CM_PERS[t]).filter(Boolean).slice(0, 2), ...cmPicks(c, 'fl', CM_FLIRT, 3)].join(' '),
      [cmVip(c) ? '👑 VIP hizmet: sadece seçkin beylerle, tamamen gizli ve lüks bir deneyim.' : '', likes.length ? `En çok ${likes.slice(0, 2).map(e => e.title).join(' ve ')} severim 💋` : '', cmPick(c, 'cl', CM_CLOSE)].filter(Boolean).join(' ')
    ];
  }
  // 💬 yorumlar: kondom / içe boşalma kuralına ve sevdiklerine uyan sahte yorumlar (id'den sabit) + bu tarayıcıda yazdıkların (amor-stories:carmen-reviews)
  const CM_REV = {
    gen: [[5, 'Harika 2 saat geçirdik, off… 🔥'], [5, 'Fotoğraflarından bile güzel, kesinlikle tavsiye ederim.'], [5, 'Çok ilgili ve tatlı, zamanın nasıl geçtiğini anlamadım.'], [5, 'Tam bir zevk kadını, yine geleceğim.'],
      [5, 'Temiz, bakımlı, güler yüzlü. 10/10'], [4, 'Sohbeti bile ayrı keyif, sonrasını söylemiyorum 😏'], [5, 'Profesyonel ama sevgili gibi davranıyor.'], [4, 'Dakik ve çok kibar, mekanı da temizdi.'],
      [5, 'Gece seansı aldım, sabaha kadar uyumadık 😅'], [5, 'Bir kere gittim, şimdi müdavimiyim.'], [4, 'Biraz geç kaldı ama telafisi efsaneydi 🥵'], [5, 'Öpüşmesi bile insanı bitiriyor.'],
      [5, '1 saat dedik, 2 saat oldu, saate bakmadı bile.'], [5, 'Kapıyı açtığı an aklım gitti, ilandaki fotoğraflar ona haksızlık.'], [4, 'Başta çekingendi, sonra beni yatağa o itti 😳'], [5, 'Üç kez boşaldım, hâlâ "bitti mi?" diye güldü.'],
      [5, 'Sesi, kokusu, dokunuşu… bir haftadır aklımdan çıkmıyor.'], [4, 'Güzel vakit geçirdik ama mesajlara biraz geç dönüyor.'], [5, 'Bacaklarımın titremesi hâlâ geçmedi 😅']],
    inside: [[5, 'Gerçekten içine boşalmama izin verdi 😳'], [5, 'Kondomsuz oldu, içine boşaldım, hiç sorun yapmadı.'], [5, 'İki kez içine boşaldım, ikincisinde o da geldi 🥵'], [5, 'İçine bırakınca gözlerimin içine bakıp gülümsedi… bitirdi beni.'],
      [5, '"İçime bırak" diye fısıldadı, daha ne olsun 🥵'], [5, 'Her damlasını içine akıttım, bacaklarıyla bırakmadı beni.'], [5, 'Üçüncü seansımız, her seferinde içine boşalıyorum, hâlâ ilk günkü gibi.'], [4, 'İçine boşalınca biraz daha kalmamı istedi, ekstra süreye para almadı 😅']],
    noIn: [[3, 'Ne kadar ısrar etsem de içine boşalttırmadı.'], [4, 'Yanlışlıkla içine boşaldım, kızdı bana 😬'], [4, 'Onunla zevkle sevişirken tutuyordum dölümü içimde ama dayanamadım, bi an patladım… sonrası biraz gergindi 😅'], [4, 'Kuralları net, son anda çıkarttırdı.'],
      [4, 'Tam boşalacakken itti beni, "içime yok demiştim" dedi 😂'], [3, 'İçine boşalmak için ekstra para teklif ettim, yine de kabul etmedi.'], [5, 'Karnına boşalttırdı, o da ayrı güzeldi 😏'], [4, 'Kontrolü hep onda; ben dayanamayacağım dedim, hemen çıkardı.'],
      [3, 'Bir an kendimi kaybedip içine kaçırdım, seansı orada bitirdi 😬'], [4, 'Son anda ağzına aldı, içine izin yok ama bu da fena değil 🥵']],
    pill: [[5, 'Haplıymış, rahat rahat içine bıraktım.']], pull: [[4, 'Kondomsuz oldu ama sonunda dışarı boşaltmamı istedi, sözümü tuttum 😇']],
    condom: [[4, 'Kondom şart diyor, ona göre gidin.'], [3, 'Kondomsuz istedim, kapıyı gösterdi 😂']], vip: [[5, 'VIP\'ye değer, her kuruşuna değdi 👑'], [5, 'Lüks otel, şampanya, sonra cennet. Pahalı ama değer.']],
    like: [[5, '{e} yaptı, hayatımın en iyisiydi.'], [5, '{e} konusunda ilanında yazdığı kadar iyi 🔥'], [5, '{e} için tekrar gideceğim 😏']], dislike: [[3, '{e} istedim, pek hevesli değildi 😕']]
  };
  const CM_WHO = ['Kerem_34', 'Anonim', 'Mert K.', 'gececi_adam', 'Burak', 'Ozan.T', 'sessizmisafir', 'Emre', 'Volkan_06', 'Tolga', 'yalnızkurt', 'Serkan', 'iş_adamı', 'Cem', 'Anonim üye', 'Kaan_35', 'Barış', 'Onur', 'Hakan.Y', 'misafir_42'];
  const cmMyRev = v => { try { if (v) localStorage.setItem('amor-stories:carmen-reviews', JSON.stringify(v)); return JSON.parse(localStorage.getItem('amor-stories:carmen-reviews') || '{}') || {}; } catch (e) { return {}; } };
  function cmReviews(c) {
    const p = cmProt(c), R = CM_REV, likes = feelEvents(c.likes || []), dis = feelEvents(c.dislikes || []), ses = cmSessions(c).map(s => s.name);
    const fx = (pool, evs) => evs.length ? pool.map(([s, t], i) => [s, t.replace('{e}', evs[i % evs.length].title)]) : [];
    const cand = [...R.gen, ...(p.inside ? R.inside : R.noIn), ...(p.pill ? R.pill : []), ...(p.pull && !p.inside ? R.pull : []), ...(p.need ? R.condom : []), ...(cmVip(c) ? R.vip : []),
      ...fx(R.like, cmPicks(c, 'rl', likes, 3)), ...fx(R.dislike, cmPicks(c, 'rd', dis, 1))];
    // kuralı anlatan bir yorum hep var
    const key = (p.inside ? R.inside : R.noIn)[cmNum(c, 'rk', 4)];
    const rest = cmPicks(c, 'rv', cand.filter(x => x !== key).map(x => x.join('|')), 3 + cmNum(c, 'rn', 5)).map(x => { const [s, ...t] = x.split('|'); return [+s, t.join('|')]; });
    return [key, ...rest].map(([s, t], i) => ({ s, t, who: cmPick(c, 'w' + i, CM_WHO), ago: 1 + cmNum(c, 'a' + i, 60), ses: cmPick(c, 's' + i, ses) })).sort((a, b) => a.ago - b.ago);
  }
  // ilan kızı sohbete geçince kaydedilir, ilk mesajı o atar
  // ilan kızını karakter olarak kaydeder (kayıtlıysa olduğu gibi döner)
  function cmAdopt(ad) {
    if (byId(ad.id)) return ad;
    const ads = cmAds(), i = ads.indexOf(ad);
    if (i >= 0) { ads.splice(i, 1); cmSaveAds(); }
    const c = Object.assign(ad, { cmRid: ad.id, id: Store.uid(), created: Date.now() });
    chars().push(c);
    return c;
  }
  const cmSaveAds = () => { try { localStorage.setItem(CM_KEY, JSON.stringify(cmAds())); } catch (e) {} };
  // sohbete onun mesajıyla girer (yeni sohbet ya da son sohbet)
  function cmChat(c, title, text, fresh) {
    c = cmAdopt(c);
    const t = (!fresh && currentThread(c)) || newThread(c, title);
    msgsOf(t).push({ id: Store.uid(), from: 'her', text, ts: Date.now() });
    save();
    location.hash = `#/chat/${t.id}`;
    return t;
  }
  const cmTake = ad => cmChat(ad, 'Carmen.com', pick(['Carmen.com\'dan mı buldun beni? 😏', `Merhaba, ben ${ad.name.split(' ')[0]} 💋 ilanımı görmüşsün`, 'Selam yakışıklı, ne zaman görüşmek istersin? 😘', 'Mesajını bekliyordum 🌹 hangi seansı düşünüyorsun?']), true);
  const cmBar = () => `<div class="cm-bar"><a class="cm-back" href="${location.hash.split('/').length > 2 ? '#/carmen' : '#/internet'}" aria-label="Geri">${ICON.arrowLeft}</a>
      <a class="cm-logo" href="#/carmen">Carmen<i>.com</i></a><span class="cm-url">🔒 carmen.com${esc(location.hash.replace(/^#\/carmen/, ''))}</span>${ctxHelp('cm-back')}</div>`;
  function renderCarmen(id) {
    const c = id && cmFind(id);
    if (c) return renderCarmenProfile(c);
    const q = (ui.cmQ || '').toLocaleLowerCase('tr'), f = ['on', 'vip', 'new'].includes(ui.cmF) ? ui.cmF : 'all', all = cmAll();
    const list = all.filter(c => (!q || [c.name, c.city, c.job, ...persOf(c), ...cmBody(c).map(x => x[2])].join(' ').toLocaleLowerCase('tr').includes(q))
      && (f === 'all' || (f === 'on' && cmOnline(c)) || (f === 'vip' && cmVip(c)) || (f === 'new' && cmBadge(c))))
      .sort((a, b) => cmVip(b) - cmVip(a));
    const card = (c, i) => {
      const b = cmBadge(c), v = cmVip(c), sv = feelEvents(c.likes || []), bd = Object.fromEntries(cmBody(c).map(([, k, x]) => [k, x]));
      return `<a class="cm-card${v ? ' vip' : ''}" href="#/carmen/${c.id}" style="--i:${Math.min(i, 20)};--mtbg:${esc(grad(c))}">
        <span class="cm-pic">${c.photo ? `<img src="${esc(c.photo)}" alt="" loading="lazy" onerror="this.remove()">` : `<span class="mt-ini">${esc((c.name || '?')[0])}</span>`}
          ${v ? '<em class="cm-badge vip">👑 VIP</em>' : b ? `<em class="cm-badge">${b}</em>` : ''}${cmOnline(c) ? '<em class="cm-on">● Çevrimiçi</em>' : ''}
          <em class="cm-from">${cmTl(cmSessions(c)[1].kon)}</em></span>
        <span class="cm-meta"><b>${esc((c.name || 'İsimsiz').split(' ')[0])}${c.age ? `<span>, ${esc(c.age)}</span>` : ''}</b>
          <small>📍 ${esc(c.city || 'Gizli')} · ⭐ ${cmStars(c)}</small>
          <small class="cm-ph">📏 ${esc(bd.Boy)} · ⚖️ ${esc(bd.Kilo)}${bd['Göğüs'] ? ` · 🍒 ${esc(bd['Göğüs'])}` : ''}${bd['Kalça'] ? ` · 🍑 ${esc(bd['Kalça'])}` : ''}</small>
          <small class="cm-ph">${cmProt(c).need ? '🛡️ Kondomlu' : '🔥 Kondomsuz olur'} · ${esc(bd['Saç'])}</small>
          <span class="cm-sv">${sv.slice(0, 3).map(e => `<i>${evEmo(e)}${esc(e.title)}</i>`).join('')}${sv.length > 3 ? `<i>+${sv.length - 3}</i>` : ''}</span></span></a>`;
    };
    const vips = all.filter(cmVip);
    view.innerHTML = `<div class="cm-site">${cmBar()}
      <div class="cm-hero"><h1>Carmen<i>.com</i></h1><p>Şehrin en seçkin profilleri · ${all.length} ilan · ${vips.length} VIP</p>
        <input id="cmQ" type="search" placeholder="🔍 İsim, şehir, saç, vücut ara…" value="${esc(ui.cmQ || '')}"></div>
      ${vips.length && f === 'all' && !q ? `<div class="cm-vrow"><h3>👑 VIP Vitrin</h3><div class="cm-vip-list">${vips.map(card).join('')}</div></div>` : ''}
      <div class="cm-tabs">${[['all', 'Hepsi'], ['on', '● Çevrimiçi'], ['vip', '👑 VIP'], ['new', '✨ Yeni']].map(([k, l]) => `<button type="button" data-cmf="${k}" class="${f === k ? 'on' : ''}">${l}</button>`).join('')}
        <button type="button" id="cmNew" title="İlanları yenile">🔄 Yeni ilanlar</button></div>
      ${list.length ? `<div class="cm-grid">${list.map(card).join('')}</div>` : '<div class="cm-empty">Aramana uyan ilan yok</div>'}
      <footer class="cm-foot">© Carmen.com · Tüm profiller kurgusaldır, 18+</footer></div>`;
    const inp = $('#cmQ');
    inp.oninput = () => { ui.cmQ = inp.value; renderCarmen(); const n = $('#cmQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    view.querySelector('.cm-tabs').onclick = e => {
      if (e.target.closest('#cmNew')) { cmAds(true); return renderCarmen(); }
      const b = e.target.closest('[data-cmf]'); if (b) { ui.cmF = b.dataset.cmf; renderCarmen(); }
    };
  }
  function renderCarmenProfile(c) {
    const first = (c.name || 'Ben').split(' ')[0], pers = persOf(c), saved = !!byId(c.id), vip = cmVip(c), album = [c.photo, ...(c.album || [])].filter((u, i, a) => u && a.indexOf(u) === i);
    const byCat = evs => { const m = new Map(); evs.forEach(e => { const k = catOfEv(e); if (!m.has(k)) m.set(k, []); m.get(k).push(e); }); return [...m]; };
    const chips = evs => evs.map(e => `<span class="st-fe${evCls(e)}"${evStyle(e)}>${evEmo(e)}${esc(e.title)}</span>`).join('');
    const sec = (ic, t, body) => body ? `<section class="cm-sec"><h3>${ic} ${t}</h3>${body}</section>` : '';
    const likes = feelEvents(c.likes || []), denies = feelEvents(c.denies || []), dislikes = feelEvents(c.dislikes || []), prot = cmProt(c), ses = cmSessions(c);
    const off = cmNum(c, 'gd', CM_GOOD.length), rid = c.cmRid || c.id;
    const revs = [...(cmMyRev()[rid] || []).map((r, i) => ({ ...r, mine: true, i })).reverse(), ...cmReviews(c)];
    const avg = (revs.reduce((n, r) => n + r.s, 0) / revs.length).toFixed(1);
    view.innerHTML = `<div class="cm-site cm-prof${vip ? ' is-vip' : ''}">${cmBar()}
      <div class="cm-cover" style="--mtbg:${esc(grad(c))}">${c.photo ? `<img src="${esc(c.photo)}" alt="" data-cmz="0" onerror="this.remove()">` : `<span class="mt-ini">${esc(first[0])}</span>`}
        ${vip ? '<em class="cm-badge vip cm-cvip">👑 VIP</em>' : ''}
        <div class="cm-ct"><b>${esc(c.name || 'İsimsiz')}${c.age ? `<span>, ${esc(c.age)}</span>` : ''} <i title="Doğrulanmış">✔</i></b>
          <small>📍 ${esc(c.city || 'Gizli')} · ⭐ ${cmStars(c)} · ${cmOnline(c) ? '<em class="cm-on">● Çevrimiçi</em>' : 'Son görülme bugün'}</small>
          <span class="mt-tr">${pers.map(t => `<em>${esc(t)}</em>`).join('')}</span></div></div>
      <div class="cm-acts"><button type="button" class="btn primary" id="cmMsg">💬 Mesaj at</button>${saved ? `<a class="btn ghost" href="#/p/${c.id}">👤 Profil</a>` : ''}</div>
      ${sec('💌', 'Hakkımda', cmAbout(c).map(p => `<p>${esc(p)}</p>`).join('') + (c.bio ? `<p class="cm-bio">“${esc(c.bio)}”</p>` : ''))}
      ${sec('📏', 'Fiziksel özellikler', `<div class="cm-phys">${cmBody(c).map(([ic, k, v]) => `<div><small>${ic} ${k}</small><b>${esc(v)}</b></div>`).join('')}</div>`)}
      ${sec('🫦', 'Bunları çok iyi yaparım', likes.length ? `<ul class="cm-good">${likes.map((e, i) => `<li>${esc(CM_GOOD[(off + i) % CM_GOOD.length].replace('{e}', e.title))}</li>`).join('')}</ul>
        ${byCat(likes).map(([k, evs]) => `<div class="cm-cat"><small>${esc(k.icon || '')} ${esc(k.label || '')}</small>${chips(evs)}</div>`).join('')}` : '')}
      ${sec('🛡️', 'Kondom ve kurallarım', `<div class="cm-rules">${cmRules(c).map(([ic, t, d]) => `<div class="${ic === '🚫' || ic === '🛡️' ? 'no' : 'ok'}"><span>${ic}</span><p><b>${esc(t)}</b> ${esc(d)}</p></div>`).join('')}</div>
        ${denies.length ? `<div class="cm-cat cm-no"><small>İzin vermediklerim</small>${chips(denies)}</div>` : ''}`)}
      ${sec('💔', 'Pek sevmediklerim', dislikes.length ? `<p class="cm-mute">Bunları pek tercih etmem, ısrar etme lütfen.</p><div class="cm-cat cm-no">${chips(dislikes)}</div>` : '')}
      ${sec('📸', 'Fotoğraflar', album.length > 1 ? `<div class="cm-album">${album.map((u, i) => `<img src="${esc(u)}" alt="" loading="lazy" data-cmz="${i}">`).join('')}</div>` : '')}
      ${sec('💎', 'Seanslar', `${vip ? '<p class="cm-mute">👑 VIP fiyatlarıdır: lüks otel, tam gizlilik.</p>' : ''}${prot.need ? '<p class="cm-mute">🛡️ Bütün seanslar kondomludur.</p>' : ''}
        <div class="cm-ses">${ses.map(s => `<div><span class="cm-sn"><b>${s.ic} ${esc(s.name)}</b><small>${esc(s.dur)} · ${esc(s.desc)}</small></span>
          <span class="cm-sp"><em>🛡️ Kondomlu <b>${cmTl(s.kon)}</b></em>${s.raw ? `<em class="raw">🔥 Kondomsuz <b>${cmTl(s.raw)}</b></em>` : ''}</span></div>`).join('')}</div>`)}
      ${sec('💬', `Yorumlar <small class="cm-rc">${revs.length} yorum · ⭐ ${avg}</small>`, `<div class="cm-revs">${revs.map(r => `<div class="cm-rev${r.mine ? ' mine' : ''}">
          <div class="cm-rh"><b>${esc(r.who)}</b><span class="cm-rs">${'★'.repeat(r.s)}${'☆'.repeat(5 - r.s)}</span>${r.mine ? `<button type="button" data-cmrm="${r.i}" aria-label="Sil">✕</button>` : ''}</div>
          <p>${esc(r.t)}</p><small>${r.mine ? 'Senin yorumun' : `${r.ago} gün önce · ${esc(r.ses)}`}</small></div>`).join('')}</div>
        <form class="cm-form" id="cmForm"><div><input id="cmRw" maxlength="24" placeholder="Rumuz (boş = Anonim)"><select id="cmRs">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select></div>
          <textarea id="cmRt" maxlength="400" rows="2" placeholder="Deneyimini yaz…" required></textarea><button type="submit" class="btn primary sm">Yorum gönder</button></form>`)}
      <footer class="cm-foot">© Carmen.com · Tüm profiller kurgusaldır, 18+</footer></div>`;
    $('#cmMsg').onclick = () => saved ? openChat(c) : cmTake(c);
    $('#cmForm').onsubmit = e => {
      e.preventDefault();
      const t = $('#cmRt').value.trim();
      if (!t) return;
      const all = cmMyRev();
      (all[rid] = all[rid] || []).push({ who: $('#cmRw').value.trim() || 'Anonim', s: +$('#cmRs').value, t });
      cmMyRev(all);
      renderCarmenProfile(c);
    };
    view.querySelectorAll('[data-cmrm]').forEach(b => b.onclick = () => { const all = cmMyRev(); (all[rid] || []).splice(+b.dataset.cmrm, 1); cmMyRev(all); renderCarmenProfile(c); });
    view.querySelectorAll('[data-cmz]').forEach(im => im.onclick = () => lightbox(album, +im.dataset.cmz));
  }

  /* 🌐 İnternet (#/internet): üç site geniş kartlarla */
  function renderInternet() {
    const sites = [
      { k: 'carmen', href: '#/carmen', ic: '🌹', logo: 'Carmen<i>.com</i>', url: 'carmen.com', desc: 'Şehrin en seçkin ilanları: profiller, seanslar, kondom kuralları ve yorumlar.', chips: [`${cmAll().length} ilan`, `👑 ${cmAll().filter(cmVip).length} VIP`] },
      { k: 'fans', href: '#/fans', ic: '🫦', logo: 'Carmen<i>Fans</i>', url: 'carmenfans.com', desc: 'Abone ol, kilitli gönderileri aç; haftanın kostümü ve özel içerikler.', chips: [`${Object.keys(fnState().subs).length} abonelik`, '📢 haftalık kostüm'] },
      { k: 'stay', href: '#/otel', ic: '🏨', logo: 'Carmen<i>Stay</i>', url: 'carmenstay.com', desc: 'Otel odası, jakuzili süit, VIP loca… rezervasyon yap, sohbet orada başlasın.', chips: [`${SY_VENUES.length} mekan`, `🗓️ ${syRes().length} rezervasyon`] },
      { k: 'flix', href: '#/flix', ic: '🍿', logo: 'Carmen<i>Flix</i>', url: 'carmenflix.com', desc: 'Netflix gibi: film ve diziler yazışma olarak oynar. Aldatma, iş yeri, fantezi, komşular…', chips: [`${FX_TITLES.filter(t => t.k === 'film').length} film`, `${FX_TITLES.filter(t => t.k === 'dizi').length} dizi`] },
      { k: 'live', href: '#/canli', ic: '🎥', logo: 'Carmen<i>Live</i>', url: 'carmenlive.com', desc: 'Canlı yayınlar: bahşiş gönder, dans ettir, kostüm değiştirt, özel yayına geç.', chips: [`🔴 ${cmAll().filter(cmOnline).length} canlı`, '🎯 bahşiş hedefi'] },
      { k: 'shop', href: '#/shop', ic: '🛍️', logo: 'Carmen<i>Shop</i>', url: 'carmenshop.com', desc: 'Oyuncak, iç çamaşırı, kostüm. Kargo gelince sohbette "Paketin geldi, açayım mı? 😏"', chips: [`${shopProds().length} ürün`, `📦 ${shopData().orders.filter(o => !o.done).length} yolda`] },
      { k: 'jobs', href: '#/is', ic: '💼', logo: 'Carmen<i>Jobs</i>', url: 'carmenjobs.com', desc: 'Onun iş yerine başvur: mülakat Patron – Sekreter, Doktor, Hoca gibi rol fantezileriyle başlar.', chips: [`${cmAll().filter(c => c.job).length} ilan`, '🎭 rol hazır'] },
      { k: 'clinic', href: '#/klinik', ic: '🩺', logo: 'Carmen<i>Klinik</i>', url: 'carmenklinik.com', desc: 'Döngü takvimi, riskli günler, hamilelik haftası, bebeğin boyu ve ultrason notları.', chips: [`🤰 ${chars().filter(c => pregWeek(c)).length} hamile`, `${chars().length} hasta`] },
      { k: 'conf', href: '#/itiraf', ic: '🎭', logo: 'Gizli<i>İtiraf</i>', url: 'gizliitiraf.com', desc: 'İsimsiz aldatma itirafları: kocası maç izlerken üst katta, düğünden önceki gece, balayında spa\'da… Kadın da erkek de yazar.', chips: [`${CF_POOL.length} itiraf`, '🔥😂😳'] }
    ];
    view.innerHTML = `<div class="page-pad narrow">${pageHero('internet', '🌐', 'İnternet', [`${sites.length} site`, 'gizli sekme 🕶️'])}
      <div class="net-list">${sites.map((s, i) => `<a class="net-card net-${s.k}" href="${s.href}" style="--i:${i}">
        <span class="net-ic">${s.ic}</span>
        <span class="net-txt"><small>🔒 ${s.url}</small><b>${s.logo}</b><span>${esc(s.desc)}</span>
          <span class="net-chips">${s.chips.map(c => `<em>${esc(c)}</em>`).join('')}</span></span>
        <span class="hl-go">›</span></a>`).join('')}</div></div>`;
  }
  const appBar = (cls, logo, url, back) => `<div class="${cls}-bar"><a class="cm-back" href="${back}" aria-label="Geri">${ICON.arrowLeft}</a>
      <span class="${cls}-logo">${logo}</span><span class="cm-url">🔒 ${esc(url)}</span>${ctxHelp('cm-back')}</div>`;

  /* 🫦 CarmenFans (#/fans, #/fans/<id>): içerik üreticisi sayfaları; abone olunca kilitli gönderiler açılır, 💎 özel içerik tek tek alınır.
   * 📢 "Bu hafta" kostümü sevdiği fantezilere uyan kostüm / kombinlerden (js/data/clothes.js); foto seti alınca kostüm gardırobuna girer.
   * Abonelik ve alınanlar bu tarayıcıda: localStorage amor-stories:fans { subs: {rid: ts}, bought: {rid: [anahtar]} } */
  const fnState = v => { try { if (v) localStorage.setItem('amor-stories:fans', JSON.stringify(v)); const s = JSON.parse(localStorage.getItem('amor-stories:fans') || '{}') || {}; return { subs: s.subs || {}, bought: s.bought || {} }; } catch (e) { return { subs: {}, bought: {} }; } };
  const fnRid = c => c.cmRid || c.id;
  const fnHandle = c => '@' + String((c.name || 'kiz').split(' ')[0]).toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '') + (cmNum(c, 'hd', 90) + 10);
  const fnSub = c => Math.round((99 + cmNum(c, 'fs', 16) * 10) * (cmVip(c) ? 2.5 : 1) / 10) * 10 - 1;
  function fnCostumes(c) {
    const keys = new Set(feelEvents(c.likes || []).filter(isFant).map(fantKey));
    const all = [...CL.items.filter(x => x.style === 'k').map(x => ({ id: x.id, name: x.name, emoji: x.emoji, fant: x.fant, parts: { elbise: x.id } })),
      ...(CL.combos || []).filter(x => x.fant).map(x => ({ id: 'cb:' + x.id, name: x.name, emoji: x.emoji, fant: x.fant, parts: x.parts }))];
    const liked = all.filter(x => x.fant && keys.has(x.fant));
    return [...liked, ...cmPicks(c, 'fc', all.filter(x => !liked.includes(x)).map(x => x.id), 5).map(id => all.find(x => x.id === id))];
  }
  // 📢 haftanın kostümü: her hafta değişir, sevdiği fanteziler önce
  const fnWeek = c => { const l = fnCostumes(c), n = Math.min(3, l.length), w = Math.floor(Date.now() / (7 * 864e5)); return n ? l[(w + cmNum(c, 'wk', n)) % n] : null; };
  function fnItems(c) {
    const m = cmVip(c) ? 2 : 1, r = n => Math.round(n * m / 10) * 10;
    const vids = cmPicks(c, 'fv', c.likes || [], 4).map(id => feelEvents([id])[0]).filter(Boolean)
      .map((e, i) => ({ k: 'v:' + e.id, ic: '🎥', name: `${e.title} videosu`, sub: `${6 + cmNum(c, 'vd' + i, 20)} dk · ${isFant(e) ? 'fantezi' : 'tam sürüm'}`, price: r(150 + cmNum(c, 'vp' + i, 8) * 25), ev: e }));
    const sets = fnCostumes(c).slice(0, 3).map((x, i) => ({ k: 'c:' + x.id, ic: '📸', name: `${x.emoji} ${x.name} foto seti`, sub: `${12 + cmNum(c, 'cs' + i, 25)} fotoğraf · 👗 gardırobuna girer`, price: r(120 + cmNum(c, 'cp' + i, 6) * 20), cos: x }));
    return [...vids, ...sets,
      { k: 'x:ses', ic: '🎙️', name: 'Sana özel sesli mesaj', sub: 'Adını fısıldayarak…', price: r(90) },
      { k: 'x:sext', ic: '💬', name: 'Sexting seansı', sub: '30 dk, sadece ikimiz', price: r(250), chat: 'Sexting seansımız başladı 😈 şu an ne yapıyorsun? Anlat bana…' },
      { k: 'x:ozel', ic: '📹', name: 'İsteğe özel video', sub: 'Ne istediğini yaz, sana özel çekeyim', price: r(600), chat: 'Özel videon için buradayım 😏 ne görmek istersin? Kostüm, pozisyon, ne istersen…' }];
  }
  const FN_CAP = ['Yeni güne böyle uyandım 😴☀️', 'Bu akşam ne giysem? Yorumlara yaz 👇', 'Aynanın karşısında biraz fazla oyalandım 🙈', 'Duştan yeni çıktım 💦', 'Abonelerime özel, kimseye gösterme 🤫',
    'Bugün çok azgınım, biri ilgilensin 😈', 'Sence bu çok mu kısa? 😏', 'Yatakta tek başıma sıkıldım…', 'Yarın canlı yayın var, kaçırma 🔴', 'Bu fotoğrafı silmeden önce gör 👀', 'Bu açıdan nasıl? 🍑',
    'Yeni iç çamaşırı aldım, ilk siz görün 🖤', 'Mesajlarına tek tek bakıyorum, yaz bana 💌', 'Bugün kimseye söylemediğim bir şey yaptım… 🤫', 'Sabah kahvesi ve ben ☕', 'Bu hafta en çok beğeni alan fotoğrafım 🔥'];
  // kostümü giydirip sohbete gider
  function fnWear(c, x, text) {
    c = cmAdopt(c);
    c.wardrobe = [...new Set([...(c.wardrobe || []), ...Object.values(x.parts)])];
    c.outfit = { ust: '', alt: '', elbise: '', sutyen: '', tanga: '', corap: '', ...x.parts };
    cmChat(c, 'CarmenFans', text);
  }
  const fnSaveChar = c => { if (byId(c.id)) save(); else cmSaveAds(); };
  function renderFans(id) {
    const st = fnState(), c = id && cmFind(id);
    if (c) return renderFansPage(c, st);
    const tab = ui.fnTab === 'subs' ? 'subs' : 'all', all = cmAll().filter(c => tab === 'all' || st.subs[fnRid(c)]);
    view.innerHTML = `<div class="fn-site">${appBar('fn', 'Carmen<i>Fans</i>', 'carmenfans.com', '#/internet')}
      <div class="fn-tabs"><button type="button" data-fnt="all" class="${tab === 'all' ? 'on' : ''}">Keşfet</button><button type="button" data-fnt="subs" class="${tab === 'subs' ? 'on' : ''}">Aboneliklerim · ${Object.keys(st.subs).length}</button></div>
      ${all.length ? `<div class="fn-list">${all.map((c, i) => { const w = fnWeek(c), sub = st.subs[fnRid(c)], ban = (c.album || [])[1] || c.photo; return `<a class="fn-card" href="#/fans/${c.id}" style="--i:${Math.min(i, 20)};--mtbg:${esc(grad(c))}">
        <span class="fn-ban">${ban ? `<img src="${esc(ban)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>
        <span class="fn-row">${avatar(c, 58)}<span class="fn-nm"><b>${esc(c.name || 'İsimsiz')} ${cmVip(c) ? '<i class="fn-v">✔</i>' : ''}</b><small>${esc(fnHandle(c))}</small></span>
          <em class="fn-price${sub ? ' on' : ''}">${sub ? '✓ Abonesin' : `${fnSub(c)} ₺/ay`}</em></span>
        ${w ? `<span class="fn-week">📢 Bu hafta: ${esc(w.emoji)} ${esc(w.name)}</span>` : ''}</a>`; }).join('')}</div>`
        : '<div class="cm-empty">Henüz aboneliğin yok<br><button type="button" class="btn ghost sm" data-fnt="all">Keşfet</button></div>'}
      <footer class="cm-foot">© CarmenFans · Tüm içerik üreticileri kurgusaldır, 18+</footer></div>`;
    view.querySelectorAll('[data-fnt]').forEach(b => b.onclick = () => { ui.fnTab = b.dataset.fnt; renderFans(); });
  }
  function renderFansPage(c, st) {
    const rid = fnRid(c), sub = !!st.subs[rid], bought = new Set(st.bought[rid] || []), w = fnWeek(c), items = fnItems(c), first = (c.name || 'Ben').split(' ')[0];
    const pics = (c.album || []).length > 1 ? c.album.slice(1) : [c.photo].filter(Boolean), tab = ui.fnPTab === 'ppv' ? 'ppv' : 'posts';
    const posts = pics.map((u, i) => ({ u, cap: cmPicks(c, 'cap' + i, FN_CAP, 1)[0], likes: 40 + cmNum(c, 'lk' + i, 900), ago: i * 2 + 1 + cmNum(c, 'ag' + i, 2), free: i === 0 }));
    const lock = '<span class="fn-lock">🔒<small>Abone ol, gör</small></span>';
    const likedW = w && w.fant && feelEvents(c.likes || []).some(e => isFant(e) && fantKey(e) === w.fant);
    view.innerHTML = `<div class="fn-site fn-page">${appBar('fn', 'Carmen<i>Fans</i>', 'carmenfans.com/' + fnHandle(c).slice(1), '#/fans')}
      <div class="fn-hero" style="--mtbg:${esc(grad(c))}">${pics[0] ? `<img src="${esc(pics[0])}" alt="" onerror="this.remove()">` : ''}</div>
      <div class="fn-head">${avatar(c, 92)}<div><b>${esc(c.name || 'İsimsiz')} ${cmVip(c) ? '<i class="fn-v">✔</i>' : ''}</b><small>${esc(fnHandle(c))} · ${cmOnline(c) ? '<em class="cm-on">● Çevrimiçi</em>' : 'az önce aktifti'}</small>
        <span class="fn-stats">📷 ${posts.length + 40 + cmNum(c, 'pc', 300)} gönderi · ❤️ ${2 + cmNum(c, 'tl', 80)}B beğeni · 🎥 ${10 + cmNum(c, 'vc', 60)} video</span></div></div>
      <p class="fn-bio">${esc(cmAbout(c)[1])}</p>
      <div class="fn-acts">${sub ? '<button type="button" class="btn ghost" data-fn="unsub">✓ Abonesin · Çık</button>' : `<button type="button" class="btn primary fn-subbtn" data-fn="sub">Abone ol · ${fnSub(c)} ₺/ay</button>`}
        <button type="button" class="btn ghost" data-fn="msg">💬 Mesaj</button></div>
      ${w ? `<div class="fn-ann"><small>📢 Bu hafta</small><b>${esc(w.emoji)} ${esc(w.name)}</b><p>Bütün hafta kanalımda bu kostümle olacağım${likedW ? ', en sevdiğim fantezi 😈' : ' 😏'} Abonelerime özel fotoğraflar her gün geliyor.</p>
        ${sub ? '<button type="button" class="btn primary sm" data-fn="wear">💬 Bu kostümle yaz</button>' : '<button type="button" class="btn ghost sm" data-fn="sub">🔒 Görmek için abone ol</button>'}</div>` : ''}
      <div class="fn-tabs"><button type="button" data-fnp="posts" class="${tab === 'posts' ? 'on' : ''}">📷 Gönderiler</button><button type="button" data-fnp="ppv" class="${tab === 'ppv' ? 'on' : ''}">💎 Özel içerik · ${items.length}</button></div>
      ${tab === 'posts' ? `<div class="fn-posts">${posts.map((p, i) => `<article class="fn-post"><div class="fn-ph">${avatar(c, 34)}<b>${esc(first)}</b><small>${p.ago} gün önce</small></div><p>${esc(p.cap)}</p>
          <div class="fn-media${sub || p.free ? '' : ' locked'}"><img src="${esc(p.u)}" alt="" loading="lazy" data-fnz="${i}">${sub || p.free ? '' : lock}</div>
          <small class="fn-likes">❤️ ${p.likes} · 💬 ${Math.round(p.likes / 9)}${p.free && !sub ? ' · 🆓 ücretsiz' : ''}</small></article>`).join('')}</div>`
        : `<div class="fn-ppv">${items.map(x => { const own = bought.has(x.k); return `<div class="fn-item${own ? ' own' : ''}"><span class="fn-iic">${x.ic}</span><span class="fn-in"><b>${esc(x.name)}</b><small>${esc(x.sub)}</small>
          ${own && x.ev ? `<em>“${esc(x.ev.title)}… bu videoda kendimi kaybettim, sonuna kadar izle 😈”</em>` : ''}${own && x.cos ? '<em>👗 Gardırobunda · sohbette giyebilir</em>' : ''}</span>
          ${own ? (x.chat ? `<button type="button" class="btn primary sm" data-fnbuy="${esc(x.k)}">Başlat</button>` : x.cos ? `<button type="button" class="btn primary sm" data-fnbuy="${esc(x.k)}">Giydir</button>` : x.ev ? `<button type="button" class="btn ghost sm" data-fnbuy="${esc(x.k)}">▶ İzle</button>` : '<span class="fn-ok">✓</span>')
            : `<button type="button" class="btn ghost sm fn-buy" data-fnbuy="${esc(x.k)}">${x.price} ₺</button>`}</div>`; }).join('')}</div>`}
      <footer class="cm-foot">© CarmenFans · Tüm içerik üreticileri kurgusaldır, 18+</footer></div>`;
    const re = () => renderFansPage(c, fnState());
    const act = a => {
      const s = fnState();
      if (a === 'sub') { s.subs[rid] = Date.now(); fnState(s); sfx('match'); return re(); }
      if (a === 'unsub') { delete s.subs[rid]; fnState(s); return re(); }
      if (a === 'msg') return cmChat(c, 'CarmenFans', sub ? pick(['Abonem gelmiş 😍 bugün ne görmek istersin?', 'Selam tatlım 💋 yeni gönderimi gördün mü?', 'Sana özel bir şey hazırlıyorum, sabırsızlanıyor musun? 😏']) : pick(['Merhaba 😊 kanalıma abone olsana, pişman olmazsın 😏', 'Selam! Profilime baktığını gördüm 👀']));
      if (a === 'wear' && w) fnWear(c, w, pick([`Bu hafta ${w.name} giydim… sana özel bir kez daha giydim 😈`, `${w.emoji} Bak bakalım ne giydim? Kanalımdakinden fazlasını sana göstereceğim 😏`]));
    };
    view.querySelectorAll('[data-fn]').forEach(b => b.onclick = () => act(b.dataset.fn));
    view.querySelectorAll('[data-fnp]').forEach(b => b.onclick = () => { ui.fnPTab = b.dataset.fnp; re(); });
    view.querySelectorAll('[data-fnz]').forEach(im => im.onclick = () => {
      const p = posts[+im.dataset.fnz];
      if (!sub && !p.free) return act('sub');
      const open = posts.filter(q => sub || q.free);
      lightbox(open.map(q => q.u), open.indexOf(p));
    });
    view.querySelectorAll('[data-fnbuy]').forEach(b => b.onclick = () => {
      const x = items.find(i => i.k === b.dataset.fnbuy), s = fnState(), l = s.bought[rid] = s.bought[rid] || [];
      if (!x) return;
      if (!l.includes(x.k)) {
        l.push(x.k); fnState(s); sfx('match');
        if (x.cos) { c.wardrobe = [...new Set([...(c.wardrobe || []), ...Object.values(x.cos.parts)])]; fnSaveChar(c); }
        return re();
      }
      if (x.chat) return cmChat(c, 'CarmenFans', x.chat, true);
      if (x.cos) return fnWear(c, x.cos, `${x.cos.emoji} Aldığın setteki ${x.cos.name} şimdi üstümde… beğendin mi? 😈`);
      if (x.ev && pics.length) lightbox(pics, cmNum(c, 'pv' + x.k, pics.length));
    });
  }

  /* 🏨 CarmenStay (#/otel, #/otel/<id>): otel odası / süit / kulüp rezervasyonu. Rezervasyon = yeni sohbet: 📍 mekan kartı
   * (place = en yakın hazır mekan, bot mekan kurallarını kullanır), 🕰️ saat seçilen saatten başlar, ilk mesajı o atar.
   * Rezervasyonlar bu tarayıcıda: localStorage amor-stories:stay */
  const SY_VENUES = [
    { id: 'standart', ic: '🛏️', kind: 'Otel', name: 'Şehir Oteli · Standart oda', place: 'yatak', price: 2400, stars: 3, area: 'Merkez', feats: ['Çift kişilik yatak', 'Klima', 'Minibar', 'Gizli giriş'], desc: 'Sade, temiz ve gözden uzak. Kısa buluşmalar için ideal.', hints: ['Odanın kapısı kapandı, perdeler çekili', 'Yatak sımsıkı yapılmış, minibarda iki küçük şişe var'], greet: ['Odadayım, 304 numara… kapıyı aralık bıraktım 😏', 'Geldim, resepsiyon hiçbir şey sormadı 🙈 sen neredesin?'] },
    { id: 'deniz', ic: '🌊', kind: 'Otel', name: 'Mavi Koy · Deniz manzaralı oda', place: 'balkon', price: 4200, stars: 4, area: 'Sahil', feats: ['Deniz manzarası', 'Balkon', 'Şampanya ikramı', 'Geç çıkış'], desc: 'Balkondan deniz, içeride ikiniz. Gün batımında rezervasyon önerilir.', hints: ['Balkon kapısı açık, deniz sesi odaya doluyor', 'Gün batıyor, oda turuncuya boyanmış'], greet: ['Balkonda seni bekliyorum, manzara muhteşem… ama ben daha güzelim 😏', 'Şampanyayı açmadım, seninle açalım 🥂'] },
    { id: 'jakuzi', ic: '🛁', kind: 'Süit', name: 'Lumière · Jakuzili süit', place: 'banyo', price: 6800, stars: 5, area: 'Nişantaşı', feats: ['Jakuzi', 'Gül yaprakları', 'Bornoz ve terlik', 'Oda servisi'], desc: 'Köpüklü jakuzi, mum ışığı ve kocaman bir yatak. Romantik ve tutkulu geceler için.', hints: ['Jakuzi köpükle dolu, mumlar yanıyor', 'Gül yaprakları jakuzinin kenarına kadar serpilmiş'], greet: ['Jakuziye girdim bile 🛁 sen de gel, su sıcacık 😈', 'Bornozumun altında hiçbir şey yok… kapıyı çal 😏'] },
    { id: 'kral', ic: '👑', kind: 'Süit', name: 'Grand Palace · Kral dairesi', place: 'cati', price: 14500, stars: 5, area: 'Boğaz', feats: ['Boğaz manzarası', 'Özel teras', 'Kişisel uşak', 'Havuz erişimi'], desc: 'Şehrin en lüks dairesi: teras, piyano, panoramik cam. VIP buluşmalar için.', hints: ['Panoramik camlardan bütün şehir ışıl ışıl', 'Terasta iki kadeh ve bir şişe şampanya bekliyor'], greet: ['Kral dairesi mi? Kendimi kraliçe gibi hissediyorum 👑 gel de taçlandır beni 😏', 'Terastayım, şehir ayaklarımın altında… ama ben senin altında olmak istiyorum 😈'] },
    { id: 'butik', ic: '🕯️', kind: 'Butik otel', name: 'Maison Rouge · Butik oda', place: 'yatak', price: 3600, stars: 4, area: 'Cihangir', feats: ['Kırmızı ışık', 'Aynalı tavan', 'Ses yalıtımı', 'Saatlik kiralama'], desc: 'Aynalı tavan, kırmızı loş ışık ve tam ses yalıtımı. Bağırsan bile kimse duymaz.', hints: ['Tavandaki aynada ikinizi de görüyorsunuz', 'Kırmızı loş ışık tenini parlatıyor'], greet: ['Tavanda ayna var 😳 her şeyi göreceğiz…', 'Ses yalıtımı varmış, istediğim kadar bağırabilirim 😈'] },
    { id: 'tema', ic: '💗', kind: 'Love hotel', name: 'Amour · Tematik oda', place: 'yatak', price: 3900, stars: 4, area: 'Kadıköy', feats: ['Yuvarlak yatak', 'Kostüm dolabı', 'Oyuncak menüsü', 'Pole dans direği'], desc: 'Kostüm dolabı, pole direği ve yuvarlak yatak. Fanteziler için tasarlandı.', hints: ['Kostüm dolabının kapağı aralık', 'Odanın ortasında parlayan bir pole direği'], greet: ['Kostüm dolabını açtım… hangisini giyeyim? 😏', 'Direği gördün mü? Sana küçük bir gösteri hazırladım 💃'] },
    { id: 'spa', ic: '♨️', kind: 'Spa', name: 'Hamam & Spa · Özel kabin', place: 'banyo', price: 3200, stars: 4, area: 'Sultanahmet', feats: ['Özel hamam', 'Kese ve köpük', 'Masaj yatağı', 'Sauna'], desc: 'Mermer kurna, sıcak buhar ve masaj yatağı. Sadece ikiniz için kapatılır.', hints: ['Buhar her yeri kaplamış, mermer sıcacık', 'Masaj yağı ve havlular hazır'], greet: ['Peştamalımı bağladım, sıcak mermerde bekliyorum ♨️', 'Masaj yağını ısıttım, sırtüstü yat bakalım 😏'] },
    { id: 'loca', ic: '🍾', kind: 'Kulüp', name: 'Velvet Club · VIP loca', place: 'dans', price: 5500, stars: 5, area: 'Bebek', feats: ['Özel loca', 'Şişe servisi', 'Perdeli bölme', 'Arka kapı çıkışı'], desc: 'Müzik, ışıklar ve perdeli özel loca. Kalabalığın ortasında gizli kalın.', hints: ['Bas sesi göğsünüzde, perdeler kapalı', 'Locanın kadife koltukları sadece size ait'], greet: ['Locadayım, perdeleri çektim… kimse görmüyor 😈', 'Müzik çok yüksek, kulağına fısıldamam lazım 😏 gel'] },
    { id: 'bar', ic: '🍸', kind: 'Kulüp', name: 'Noir · Lounge bar', place: 'bar', price: 1800, stars: 3, area: 'Karaköy', feats: ['Kokteyl menüsü', 'Loş ışık', 'Üst katta oda', 'Canlı caz'], desc: 'Caz, kokteyl ve üst katta küçük bir oda. Önce bir içki, sonra yukarı.', hints: ['Bardaki caz yavaşladı, gözler sizde', 'Üst kata çıkan merdiven loş'], greet: ['Barın köşesindeyim, kırmızı elbiseli 🍸', 'Sana bir kokteyl söyledim, gel de iç… sonra yukarı çıkarız 😏'] },
    { id: 'bungalov', ic: '🏔️', kind: 'Doğa', name: 'Çam Evi · Dağ bungalovu', place: 'dag-evi', price: 3000, stars: 4, area: 'Abant', feats: ['Şömine', 'Kar manzarası', 'Sıcak şarap', 'Kimse yok'], desc: 'Kilometrelerce kimse yok: şömine, battaniye ve ikiniz.', hints: ['Şömine çıtırdıyor, dışarıda kar', 'Battaniyenin altı sıcacık'], greet: ['Şömineyi yaktım, sadece battaniyeye sarındım 🔥', 'Dışarısı buz gibi, gel ısıt beni 🥶😏'] },
    { id: 'villa', ic: '🏝️', kind: 'Villa', name: 'Villa Azur · Havuzlu villa', place: 'yazlik', price: 9800, stars: 5, area: 'Bodrum', feats: ['Sonsuzluk havuzu', 'Özel plaj', 'Açık hava duşu', 'Hafta sonu paketi'], desc: 'Havuz, özel plaj ve kimsenin göremeyeceği bir bahçe. Çıplak yüzmek serbest.', hints: ['Havuzun suyu ay ışığında parlıyor', 'Bahçede açık hava duşu, etrafta kimse yok'], greet: ['Havuzdayım… ve mayo giymedim 😈🏝️', 'Villa bizim, kimse gelmeyecek. Ne yapmak istersen 😏'] },
    { id: 'yat', ic: '🛥️', kind: 'Özel', name: 'Mavi Yolculuk · Kiralık yat', place: 'vapur', price: 12000, stars: 5, area: 'Göcek', feats: ['Kaptan kamarası', 'Güverte yatağı', 'Gün batımı turu', 'Koylarda demir'], desc: 'Issız bir koyda demir atın; güvertede güneş, kamarada gece.', hints: ['Yat ıssız bir koyda demirlemiş', 'Güverte yatağında güneş tenini ısıtıyor'], greet: ['Güvertede bikinimle güneşleniyorum ☀️ kaptan sensin bugün 😏', 'Koyda kimse yok… güvertede sevişelim mi? 😈'] }
  ];
  const syRes = v => { try { if (v) localStorage.setItem('amor-stories:stay', JSON.stringify(v)); return JSON.parse(localStorage.getItem('amor-stories:stay') || '[]') || []; } catch (e) { return []; } };
  const SY_DUR = [['2 saat', .4], ['4 saat', .6], ['Gecelik', 1], ['Hafta sonu', 2.4]];
  const hh2 = h => String(h).padStart(2, '0') + ':00';
  function renderStay(id) {
    const v = id && SY_VENUES.find(x => x.id === id);
    if (v) return renderStayPage(v);
    const kinds = [...new Set(SY_VENUES.map(x => x.kind))], k = kinds.includes(ui.syK) ? ui.syK : '', res = syRes().filter(r => threads().some(t => t.id === r.thread));
    view.innerHTML = `<div class="sy-site">${appBar('sy', 'Carmen<i>Stay</i>', 'carmenstay.com', '#/internet')}
      <div class="sy-hero"><h1>Gizli, lüks, sadece ikiniz.</h1><p>${SY_VENUES.length} mekan · anında onay · %100 gizlilik</p></div>
      ${res.length ? `<div class="sy-res"><h3>🗓️ Rezervasyonlarım</h3>${res.slice(-4).reverse().map(r => { const x = SY_VENUES.find(y => y.id === r.venue) || {}, ch = byId(r.char); return `<a class="sy-rrow" href="#/chat/${r.thread}"><span>${x.ic || '🏨'}</span><span><b>${esc(x.name || '')}</b><small>${esc(ch ? ch.name : '')} · ${hh2(r.hour)} · ${esc(r.dur)} · ${esc(r.code)}</small></span><i>›</i></a>`; }).join('')}</div>` : ''}
      <div class="sy-tabs"><button type="button" data-syk="" class="${k ? '' : 'on'}">Hepsi</button>${kinds.map(x => `<button type="button" data-syk="${esc(x)}" class="${k === x ? 'on' : ''}">${esc(x)}</button>`).join('')}</div>
      <div class="sy-list">${SY_VENUES.filter(x => !k || x.kind === k).map((x, i) => `<a class="sy-card" href="#/otel/${x.id}" style="--i:${i}">
        <span class="sy-cov sy-c${SY_VENUES.indexOf(x) % 6}">${x.ic}</span>
        <span class="sy-in"><small>${esc(x.kind)} · 📍 ${esc(x.area)}</small><b>${esc(x.name)}</b><span class="sy-st">${'★'.repeat(x.stars)}</span><small>${esc(x.feats.slice(0, 3).join(' · '))}</small></span>
        <span class="sy-pr"><small>gecelik</small><b>${cmTl(x.price)}</b></span></a>`).join('')}</div>
      <footer class="cm-foot">© CarmenStay · Tüm mekanlar kurgusaldır</footer></div>`;
    view.querySelector('.sy-tabs').onclick = e => { const b = e.target.closest('[data-syk]'); if (b) { ui.syK = b.dataset.syk; renderStay(); } };
  }
  function renderStayPage(v) {
    const i = SY_VENUES.indexOf(v), saved = chars(), ads = [...cmAds().filter(cmVip), ...cmAds().filter(x => !cmVip(x))].slice(0, 12);
    view.innerHTML = `<div class="sy-site sy-page">${appBar('sy', 'Carmen<i>Stay</i>', 'carmenstay.com/' + v.id, '#/otel')}
      <div class="sy-big sy-c${i % 6}"><span>${v.ic}</span></div>
      <div class="sy-sec"><small>${esc(v.kind)} · 📍 ${esc(v.area)} · <span class="sy-st">${'★'.repeat(v.stars)}</span></small><h2>${esc(v.name)}</h2><p>${esc(v.desc)}</p>
        <div class="sy-feats">${v.feats.map(f => `<span>✓ ${esc(f)}</span>`).join('')}</div></div>
      <form class="sy-sec sy-form" id="syForm"><h3>📅 Rezervasyon</h3>
        <label>Kiminle?<select id="syWho">${saved.length ? `<optgroup label="Karakterlerin">${saved.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>` : ''}
          ${ads.length ? `<optgroup label="Carmen.com ilanları">${ads.map(c => `<option value="${esc(c.id)}">${cmVip(c) ? '👑 ' : ''}${esc(c.name)}, ${esc(c.age)}</option>`).join('')}</optgroup>` : ''}</select></label>
        <div class="sy-two"><label>Saat<select id="syHour">${Array.from({ length: 24 }, (_, h) => `<option value="${h}"${h === 22 ? ' selected' : ''}>${hh2(h)}</option>`).join('')}</select></label>
          <label>Süre<select id="syDur">${SY_DUR.map(([l, m], j) => `<option value="${j}"${j === 2 ? ' selected' : ''}>${l} · ${cmTl(Math.round(v.price * m / 50) * 50)}</option>`).join('')}</select></label></div>
        <button type="submit" class="btn primary sy-go">Rezervasyon yap</button></form>
      <footer class="cm-foot">© CarmenStay · Tüm mekanlar kurgusaldır</footer></div>`;
    $('#syForm').onsubmit = e => {
      e.preventDefault();
      const c0 = cmFind($('#syWho').value);
      if (!c0) return;
      const hour = +$('#syHour').value, [dur] = SY_DUR[+$('#syDur').value], code = 'CRM-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      const c = cmAdopt(c0), t = newThread(c, v.name.split(' · ').pop()), now = Date.now(), hint = pick(v.hints);
      msgsOf(t).push({ id: Store.uid(), from: 'sys', ts: now, text: `🕰️ ${hh2(hour)} · ${dur} · ${hint}`, scene: { place: v.place, icon: v.ic, name: v.name, hint } },
        { id: Store.uid(), from: 'her', ts: now + 1, text: pick(v.greet) });
      t.clock = { start: hour * 60, done: 0 };
      syRes([...syRes(), { venue: v.id, char: c.id, thread: t.id, hour, dur, code, ts: now }]);
      save();
      sfx('match');
      const ov = document.createElement('div');
      ov.className = 'mt-match sy-ok';
      ov.innerHTML = `<div><h2>✅ Rezervasyon onaylandı</h2><div class="mt-pair">${avatar(c, 84)}<span>${v.ic}</span></div><p>${esc(v.name)} · ${hh2(hour)}</p><small>Kod ${code} · sohbet açılıyor…</small></div>`;
      document.body.appendChild(ov);
      const go = () => { ov.remove(); location.hash = `#/chat/${t.id}`; };
      ov.onclick = go;
      setTimeout(() => { if (ov.isConnected) go(); }, 1800);
    };
  }

  /* ---------- 🌐 diğer siteler: ortak parçalar ---------- */
  const low = s => String(s || '').toLocaleLowerCase('tr').trim();
  // olay adına göre (tam ya da başı tutan)
  const evFind = t => { const all = allEvents(), l = low(t); return all.find(e => low(e.title) === l) || all.find(e => low(e.title).startsWith(l)); };
  // 📊 karakterin parametresini etiketine göre değiştir (sınırlar içinde)
  function cmParam(c, label, d) {
    const p = allParams().find(x => x.who !== 'me' && low(x.label) === label);
    if (!p || !d) return;
    const lo = +p.min || 0, hi = p.max === '' || p.max == null ? 100 : +p.max;
    c.params = c.params || {};
    c.params[p.id] = Math.max(lo, Math.min(hi, paramVal(c, p) + d));
  }
  const quickPin = e => { if (!e) return; MO().quickPins = [e.id, ...(MO().quickPins || []).filter(x => x !== e.id)].slice(0, 8); };
  const wsPage = (cls, logo, url, back, body) => `<div class="ws-site ws-${cls}">${appBar('ws', logo, url, back)}${body}<footer class="cm-foot">© ${logo.replace(/<[^>]+>/g, '')} · Her şey kurgusaldır, 18+</footer></div>`;
  const wsTabs = (key, tabs, cur) => `<div class="ws-tabs">${tabs.map(([k, l]) => `<button type="button" data-${key}="${esc(k)}" class="${k === cur ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const charOpts = () => {
    const ads = [...cmAds().filter(cmVip), ...cmAds().filter(x => !cmVip(x))].slice(0, 12);
    return `${chars().length ? `<optgroup label="Karakterlerin">${chars().map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup>` : ''}
      ${ads.length ? `<optgroup label="Carmen.com ilanları">${ads.map(c => `<option value="${esc(c.id)}">${cmVip(c) ? '👑 ' : ''}${esc(c.name)}, ${esc(c.age)}</option>`).join('')}</optgroup>` : ''}`;
  };

  /* 🛍️ CarmenShop (#/shop): oyuncak / iç çamaşırı / kostüm. Sipariş bir karaktere gider; kargo süresi dolunca (shopTick) teslim:
   * oyuncak = olay (hazır olay ya da "🛍️ Oyuncaklar" kategorisinde yeni olay) ⚡ kısayola sabitlenir, giyim = gardırobuna girer,
   * sohbette "Paketin geldi, açayım mı? 😏". Siparişler S().shop.orders */
  const SHOP_TOYS = [
    { id: 'vib', name: 'Vibratör', emoji: '🪄', price: 690, desc: 'Sessiz, 10 titreşim modu. Uyarılmayı hızla yükseltir.', fx: [['uyarılma', 20], ['şehvet', 5]], color: '#e040fb' },
    { id: 'remote', name: 'Uzaktan kumandalı vibratör', emoji: '📱', price: 1290, desc: 'Kumandası sende. Dışarıda bile, kimse fark etmeden…', fx: [['uyarılma', 25], ['şehvet', 10]], color: '#7c4dff' },
    { id: 'wand', name: 'Wand masaj aleti', emoji: '🔌', price: 990, desc: 'Güçlü titreşim, hızlı orgazm.', fx: [['uyarılma', 35]], color: '#ff4081' },
    { id: 'dildo', name: 'Realistik dildo', emoji: '🍆', price: 790, desc: 'Gerçekçi doku, vantuzlu taban.', fx: [['uyarılma', 20], ['şehvet', 10]], color: '#ab47bc' },
    { id: 'plug', name: 'Anal tıkaç', emoji: '💎', price: 450, desc: 'Mücevher uçlu, başlangıç boyu.', fx: [['uyarılma', 10], ['acı', 5]], color: '#26c6da' },
    { id: 'cuff', name: 'Kelepçe ve göz bandı', emoji: '⛓️', price: 390, ev: 'bondage', desc: 'Peluş kelepçe ve saten göz bandı.' },
    { id: 'whip', name: 'Deri kırbaç', emoji: '🏇', price: 520, desc: 'Hafif şaplaklar için; tenini pembeleştirir.', fx: [['acı', 8], ['şehvet', 8]], color: '#8d6e63' },
    { id: 'oil', name: 'Masaj yağı', emoji: '🫗', price: 240, desc: 'Isıtıcı etkili, vanilya kokulu.', fx: [['samimiyet', 3], ['uyarılma', 8]], color: '#ffb74d' },
    { id: 'lube', name: 'Kayganlaştırıcı', emoji: '💦', price: 180, desc: 'Su bazlı, uzun süre kalıcı. Acıyı azaltır.', fx: [['acı', -10]], color: '#4fc3f7' },
    { id: 'condom', name: 'Prezervatif (12\'li)', emoji: '🛡️', price: 150, ev: 'condom', desc: 'İnce hisli, kayganlaştırıcılı.' },
    { id: 'ring', name: 'Titreşimli halka', emoji: '💍', price: 350, ev: 'cock ring', desc: 'Daha uzun süre dayanırsın.' },
    { id: 'set', name: 'Oyuncak seti', emoji: '🎁', price: 1490, ev: 'sex toys', desc: 'Vibratör, tıkaç, kelepçe: hepsi bir arada.' }
  ];
  const shopPrice = (id, lo, n, step) => lo + (+sysHash('shop' + id) % n) * step;
  function shopProds() {
    const wear = CL.items.filter(x => ['sutyen', 'tanga', 'corap'].includes(x.slot) || (x.slot === 'elbise' && x.style === 'i'))
      .map(x => ({ id: 'w:' + x.id, kind: 'wear', name: x.name, emoji: x.emoji, price: shopPrice(x.id, 190, 12, 40), desc: (CL.slots.find(s => s.id === x.slot) || {}).label || '', parts: { [x.slot]: x.id } }));
    const cos = [...CL.items.filter(x => x.style === 'k').map(x => ({ id: 'k:' + x.id, name: x.name, emoji: x.emoji, parts: { elbise: x.id }, desc: 'Kostüm' })),
      ...(CL.combos || []).filter(x => x.fant).map(x => ({ id: 'k:cb:' + x.id, name: x.name + ' kombini', emoji: x.emoji, parts: x.parts, desc: 'Komple kombin' }))]
      .map(x => ({ ...x, kind: 'cos', price: shopPrice(x.id, 590, 10, 70) }));
    return [...SHOP_TOYS.map(x => ({ ...x, id: 't:' + x.id, kind: 'toy' })), ...wear, ...cos];
  }
  const shopProd = id => shopProds().find(p => p.id === id);
  const shopData = () => { const s = S(); s.shop = s.shop || { orders: [] }; return s.shop; };
  // oyuncağın olayı: hazır olay ya da bir kez oluşturulan "🛍️ Oyuncaklar" olayı
  function shopEvent(p) {
    if (p.ev) return evFind(p.ev);
    const mo = MO(), key = p.id.slice(2);
    let e = mo.events.find(x => x.shop === key) || mo.events.find(x => low(x.title) === low(p.name));
    if (e) return e;
    mo.cats = mo.cats || [];
    if (!mo.cats.some(c => c.id === 'c:shop')) mo.cats.push({ id: 'c:shop', icon: '🛍️', label: 'Oyuncaklar', tags: [] });
    const P = l => (allParams().find(x => x.who !== 'me' && low(x.label) === l) || {}).id;
    e = { id: Store.uid(), title: p.name, cat: 'c:shop', text: '', steps: [], opener: '', starter: '', tones: [], note: '', part: '', when: '', place: '', mix: [], tags: ['oyuncak'],
      onEffects: (p.fx || []).map(([l, d]) => P(l) && { p: 'p:' + P(l), d }).filter(Boolean), desc: p.desc, color: p.color || '', emojis: p.emoji, shop: key };
    mo.events.push(e);
    return e;
  }
  function shopTick() {
    try {
      const sh = S().shop, now = Date.now();
      const due = sh && (sh.orders || []).filter(o => !o.done && o.at <= now);
      if (!due || !due.length) return;
      due.forEach(o => {
        o.done = 1;
        const c = byId(o.char);
        if (!c) return;
        const items = o.items.map(shopProd).filter(Boolean);
        items.forEach(p => { if (p.kind === 'toy') quickPin(shopEvent(p)); else c.wardrobe = [...new Set([...(c.wardrobe || []), ...Object.values(p.parts)])]; });
        const t = currentThread(c) || newThread(c, 'CarmenShop');
        msgsOf(t).push({ id: Store.uid(), from: 'sys', ts: now, text: `📦 CarmenShop teslimatı · ${items.map(p => `${p.emoji} ${p.name}`).join(', ')}` },
          { id: Store.uid(), from: 'her', ts: now + 1, text: pick(['Paketin geldi, açayım mı? 😏', 'Kapıya bir paket bıraktılar… üstünde senin adın var 😳 açıyorum!', 'Kargo geldi 📦 içinde ne var acaba, tahmin et 😈', 'Paketi açtım… yüzüm kızardı 🙈 bunu benim için mi aldın?']) });
        o.thread = t.id;
        notify(`📦 ${c.name.split(' ')[0]}: paketin teslim edildi`, '📦');
      });
      save();
      const a = document.activeElement;
      if (ui.route && ui.route.name === 'chat' && due.some(o => o.thread === ui.route.id) && !(a && /TEXTAREA|INPUT/.test(a.tagName))) render();
      else if (ui.route && ui.route.name === 'shop') render();
    } catch (e) { /* teslimat bir sonraki turda denenir */ }
  }
  function renderShop() {
    const tab = ['toy', 'wear', 'cos', 'orders'].includes(ui.shTab) ? ui.shTab : 'toy', cart = ui.shCart = ui.shCart || [];
    const prods = shopProds(), orders = shopData().orders.slice().reverse(), total = cart.reduce((n, id) => n + ((shopProd(id) || {}).price || 0), 0);
    const left = o => Math.max(0, Math.ceil((o.at - Date.now()) / 60000));
    const body = tab === 'orders'
      ? (orders.length ? `<div class="ws-list">${orders.map(o => { const c = byId(o.char); return `<div class="ws-row"><span class="ws-ric">${o.done ? '✅' : '🚚'}</span><span class="ws-rin"><b>${o.items.map(id => (shopProd(id) || {}).emoji || '📦').join(' ')} · ${cmTl(o.total)}</b>
          <small>${esc(c ? c.name : '?')} · ${o.done ? 'Teslim edildi' : `Yolda · ${left(o)} dk kaldı`} · #${esc(o.code)}</small></span>${o.done && o.thread ? `<a class="btn ghost sm" href="#/chat/${o.thread}">💬</a>` : ''}</div>`; }).join('')}</div>` : '<div class="cm-empty">Henüz siparişin yok</div>')
      : `<div class="ws-grid">${prods.filter(p => p.kind === tab).map(p => `<div class="ws-prod"><span class="ws-pic" style="--pc:${esc(p.color || '#e91e63')}">${p.emoji}</span>
          <b>${esc(p.name)}</b><small>${esc(p.desc)}</small><span class="ws-pr"><b>${cmTl(p.price)}</b>
          <button type="button" class="btn ${cart.includes(p.id) ? 'ghost' : 'primary'} sm" data-shadd="${esc(p.id)}">${cart.includes(p.id) ? '✓ Sepette' : 'Sepete ekle'}</button></span></div>`).join('')}</div>`;
    view.innerHTML = wsPage('shop', 'Carmen<i>Shop</i>', 'carmenshop.com', '#/internet', `
      <div class="ws-hero"><h1>Gizli paket, hızlı kargo 📦</h1><p>Oyuncaklar sohbette ⚡ olay olur, giyim gardıroba girer</p></div>
      ${wsTabs('sht', [['toy', '🪄 Oyuncaklar'], ['wear', '👙 İç çamaşırı'], ['cos', '🐰 Kostümler'], ['orders', `📦 Siparişlerim · ${orders.length}`]], tab)}
      ${body}
      ${cart.length ? `<div class="ws-cart"><span>🛒 ${cart.length} ürün · <b>${cmTl(total)}</b></span><button type="button" class="btn ghost sm" id="shClear">Boşalt</button><button type="button" class="btn primary sm" id="shBuy">Siparişi tamamla</button></div>` : ''}`);
    view.querySelectorAll('[data-sht]').forEach(b => b.onclick = () => { ui.shTab = b.dataset.sht; renderShop(); });
    view.querySelectorAll('[data-shadd]').forEach(b => b.onclick = () => { const id = b.dataset.shadd; ui.shCart = cart.includes(id) ? cart.filter(x => x !== id) : [...cart, id]; renderShop(); });
    if (!cart.length) return;
    $('#shClear').onclick = () => { ui.shCart = []; renderShop(); };
    $('#shBuy').onclick = () => {
      const sh = sheet(`<div class="sheet-grip"></div><h3>📦 Sipariş</h3>
        <div class="mt-f"><label>Kime gidecek?<select id="shWho">${charOpts()}</select></label>
          <label>Kargo<select id="shShip"><option value="3">🚚 Standart · 3 dk · ücretsiz</option><option value="1">⚡ Ekspres · 1 dk · 99 ₺</option></select></label></div>
        <p class="cm-mute" style="margin:8px 0">${cart.map(id => { const p = shopProd(id); return p ? `${p.emoji} ${esc(p.name)}` : ''; }).join(' · ')}</p>
        <div class="row-btns"><button class="btn ghost" data-sh="no">Vazgeç</button><button class="btn primary" data-sh="ok">Öde · ${cmTl(total)}</button></div>`, 'light');
      sh.el.onclick = e => {
        const b = e.target.closest('[data-sh]');
        if (!b) return;
        if (b.dataset.sh === 'ok') {
          const c0 = cmFind(sh.el.querySelector('#shWho').value);
          if (!c0) return;
          const c = cmAdopt(c0), m = +sh.el.querySelector('#shShip').value;
          shopData().orders.push({ id: Store.uid(), char: c.id, items: cart.slice(), total: total + (m === 1 ? 99 : 0), at: Date.now() + m * 60000, code: Math.random().toString(36).slice(2, 7).toUpperCase() });
          save();
          sfx('match');
          notify(`🚚 Sipariş yolda: ${m} dk sonra ${c.name.split(' ')[0]} teslim alacak`, '📦');
          ui.shCart = []; ui.shTab = 'orders';
        }
        sh.close();
        renderShop();
      };
    };
  }

  /* 🩺 CarmenKlinik (#/klinik, #/klinik/<id>): 🩸 döngü takvimi (cycleDay / cyclePhase), 🌱 doğurganlık, 🤰 hamilelik haftası (pregWeek),
   * bebeğin boyu ve ultrason notları. Zaman sohbetteki 🕰️ saatle ilerler (c.life) */
  const BABY = [[4, 'haşhaş tanesi', '⚫', .1], [6, 'mercimek', '🫘', .6], [8, 'ahududu', '🍇', 1.6], [10, 'çilek', '🍓', 3.1], [12, 'erik', '🫐', 5.4], [14, 'limon', '🍋', 8.7],
    [16, 'avokado', '🥑', 11.6], [18, 'biber', '🫑', 14.2], [20, 'muz', '🍌', 25.6], [24, 'mısır', '🌽', 30], [28, 'patlıcan', '🍆', 37.6], [32, 'kabak', '🥒', 42.4], [36, 'kavun', '🍈', 47.4], [40, 'karpuz', '🍉', 51.2]];
  const US_NOTE = [[8, 'Kalp atışı duyuldu 💓 Her şey yolunda.'], [12, 'Ense kalınlığı normal, ilk üç ay tamamlanıyor.'], [20, 'Detaylı ultrason: bütün organlar gelişiyor, tekmeler hissediliyor 👣'],
    [28, 'Bebek baş aşağı dönmeye hazırlanıyor, göğüslerde süt başladı 🍼'], [36, 'Bebek doğuma hazır pozisyonda, her an olabilir.'], [41, 'Doğum yaklaştı; hastane çantası hazır olsun 👜']];
  const fertOf = c => { const v = (c.fields || {})[FERT_ID]; return v === '' || v == null ? 50 : +v; };
  function renderClinic(id) {
    const c = id && byId(id);
    if (c) return renderClinicPage(c);
    const list = chars();
    view.innerHTML = wsPage('clinic', 'Carmen<i>Klinik</i>', 'carmenklinik.com', '#/internet', `
      <div class="ws-hero"><h1>Kadın sağlığı & gebelik takibi</h1><p>Döngü takvimi, riskli günler, hamilelik haftası</p></div>
      ${list.length ? `<div class="ws-list">${list.map(c => { const w = pregWeek(c), ph = CYCLE[cyclePhase(c)]; return `<a class="ws-row" href="#/klinik/${c.id}">${avatar(c, 46)}<span class="ws-rin"><b>${esc(c.name)}</b>
          <small>${w ? `🤰 ${w}. hafta · ${w < 13 ? '1.' : w < 27 ? '2.' : '3.'} üç ay` : `${ph.icon} Döngünün ${cycleDay(c)}. günü · ${ph.label}`}${c.births ? ` · 👶 ${c.births}` : ''}</small></span><i class="ws-go">›</i></a>`; }).join('')}</div>`
        : '<div class="cm-empty">Kayıtlı karakter yok<br><a href="#/carmen">🌹 Carmen.com</a></div>'}`);
  }
  function renderClinicPage(c) {
    const w = pregWeek(c), day = cycleDay(c), ph = cyclePhase(c), fert = fertOf(c), first = c.name.split(' ')[0];
    const toRisk = ph === 'riskli' ? 0 : ((11 - day) + 28) % 28;
    const cal = Array.from({ length: 28 }, (_, i) => { const d = i + 1, k = d <= 5 ? 'regl' : d >= 11 && d <= 16 ? 'riskli' : ''; return `<span class="kl-d ${k}${d === day ? ' now' : ''}">${d}</span>`; }).join('');
    const baby = w ? BABY.find(b => w <= b[0]) || BABY[BABY.length - 1] : null, us = w ? (US_NOTE.find(n => w <= n[0]) || US_NOTE[US_NOTE.length - 1])[1] : '';
    view.innerHTML = wsPage('clinic', 'Carmen<i>Klinik</i>', 'carmenklinik.com/hasta/' + first.toLocaleLowerCase('tr'), '#/klinik', `
      <div class="ws-sec kl-head">${avatar(c, 64)}<div><b>${esc(c.name)}</b><small>${esc([c.age && c.age + ' yaş', c.city].filter(Boolean).join(' · '))}</small>
        <small>${w ? `🤰 Hamile · ${w}. hafta` : `${CYCLE[ph].icon} ${CYCLE[ph].label}`} · 🌱 doğurganlık %${fert}${c.births ? ` · 👶 ${c.births} doğum` : ''}</small></div></div>
      ${w ? `<section class="ws-sec"><h3>🤰 Hamilelik</h3>
          <div class="kl-bar"><i style="--w:${Math.min(100, w / 40 * 100)}%"></i></div><small class="cm-mute">${w}/40 hafta · ${w < 13 ? 'ilk' : w < 27 ? 'ikinci' : 'son'} üç ay · doğuma ${Math.max(0, 40 - w)} hafta (≈ ${Math.max(0, 40 - w) * 2} saat sohbet)</small>
          <div class="kl-baby"><span>${baby[2]}</span><p>Bebeğin şu an bir <b>${baby[1]}</b> kadar · yaklaşık <b>${baby[3]} cm</b></p></div>
          <p class="kl-us">🖥️ <b>Ultrason notu:</b> ${esc(us)}</p></section>`
        : `<section class="ws-sec"><h3>🩸 Döngü takvimi</h3><div class="kl-cal">${cal}</div>
          <div class="kl-leg"><span class="regl">Regl (1–5)</span><span class="riskli">Riskli (11–16)</span><span class="now">Bugün: ${day}. gün</span></div>
          <p>${ph === 'riskli' ? `🔥 <b>Şu an riskli günlerde.</b> Hamile kalma ihtimali ×${CYCLE.riskli.mul}.` : ph === 'regl' ? `🩸 <b>Regl döneminde.</b> Hamile kalma ihtimali çok düşük (×${CYCLE.regl.mul}).` : `🌸 Düşük riskli günler. Riskli günlere <b>${toRisk} gün</b> (≈ ${toRisk * 24} saat sohbet).`}</p></section>`}
      <section class="ws-sec"><h3>🌱 Doğurganlık</h3><div class="kl-bar fert"><i style="--w:${fert}%"></i></div>
        <small class="cm-mute">%${fert}${fert >= 80 ? ' · çok doğurgan' : fert <= 15 ? ' · neredeyse kısır' : ''} · bugünkü çarpan ×${CYCLE[ph].mul} → etkin %${Math.min(100, Math.round(fert * CYCLE[ph].mul))}</small></section>
      <section class="ws-sec"><h3>🧪 Testler</h3><div class="ws-btns"><button type="button" class="btn ghost sm" id="klTest">🧪 Gebelik testi</button><a class="btn ghost sm" href="#/p/${c.id}">👤 Profil</a><button type="button" class="btn primary sm" id="klChat">💬 Ona yaz</button></div>
        <p id="klRes" class="kl-res" hidden></p></section>`);
    $('#klTest').onclick = () => { const r = $('#klRes'); r.hidden = false; r.innerHTML = w ? '➕➕ <b>Pozitif.</b> Tebrikler, hamile 🤰' : '➖ <b>Negatif.</b> Hamile değil.'; sfx(w ? 'preg' : 'match'); };
    $('#klChat').onclick = () => openChat(c);
  }

  /* 💼 CarmenJobs (#/is, #/is/<id>): karakterin mesleğine göre iş yeri ilanı; başvurunca mülakat sohbeti açılır:
   * 📍 iş yeri kartı + 🕰️ 10:00, rol fantezisi olayı ⚡ kısayola sabitlenir, karakter rolün kıyafetini giyer */
  const JOB_ROLES = [
    { re: /hemşire|doktor|hekim|eczacı|ebe|diyetisyen|fizyoterap|psikolog|veteriner|sağlık|tıp/, rp: 'doktor', place: 'calisma', ic: '🩺', you: ['Hasta olarak muayeneye', 'Yeni doktor olarak'], wear: 'hemsirekost', co: ['Lale Klinik', 'Şifa Hastanesi', 'Moda Sağlık Merkezi'], greet: ['Buyurun, oturun lütfen 🩺 şikayetinizi anlatın bakalım…', 'Hoş geldiniz, kapıyı kapatır mısınız? Muayeneye başlayalım 😏'] },
    { re: /öğretmen|akademisyen|profesör|hoca|eğitmen|araştırma|okutman/, rp: 'kadın hoca', place: 'kampus', ic: '👩‍🏫', you: ['Öğrenci olarak', 'Asistan olarak'], wear: 'cb:prof', co: ['Boğaziçi Akademi', 'Kuzey Üniversitesi', 'Ege Koleji'], greet: ['Gir bakalım… notların pek parlak değil, ne yapacağız seninle? 👩‍🏫', 'Ofis saatime tam zamanında geldin, otur 😏'] },
    { re: /öğrenci|stajyer/, rp: 'hoca', place: 'kampus', ic: '🎒', you: ['Hoca olarak', 'Danışman olarak'], wear: 'ogrencikost', co: ['Kuzey Üniversitesi', 'Marmara Kampüsü'], greet: ['Hocam, notumu konuşmaya geldim… 🙈', 'Hocam, ödevi getirdim ama bir şey daha sormam lazım 😳'] },
    { re: /polis|güvenlik|asker|bekçi|dedektif|komiser/, rp: 'polis', place: 'calisma', ic: '🚓', you: ['Şüpheli olarak ifadeye', 'Yeni memur olarak'], wear: 'poliskost', co: ['Merkez Karakolu', 'Asayiş Şube', 'Özel Güvenlik A.Ş.'], greet: ['Otur. Sorgu odasında yalnızız, kamera kapalı 🚓', 'Ellerini masaya koy… dün gece neredeydin? 😏'] },
    { re: /masöz|masaj|spa|estetisyen|güzellik|kuaför|terapist|yoga|pilates|makyaj/, rp: 'masöz', place: 'calisma', ic: '💆', you: ['Müşteri olarak randevuya', 'Yeni çalışan olarak'], wear: 'masozkost', co: ['Elit Spa', 'Lotus Wellness', 'İpek Güzellik'], greet: ['Hoş geldiniz 💆 havlunuzu alıp yüzüstü uzanır mısınız?', 'Masaj yağını ısıttım… sırtınızdan başlayalım 😏'] },
    { re: /temizlik|hizmetçi|garson|aşçı|bakıcı|dadı|otel|resepsiyon|kat görevlisi|barmen/, rp: 'hizmetçi', place: 'senin-evin', ic: '🧹', you: ['Ev sahibi olarak', 'İşveren olarak'], wear: 'hizmetcikost', co: ['Ev Hizmetleri Ltd.', 'Grand Otel', 'Lezzet Restoran'], greet: ['İyi günler efendim 🧹 bugün nereden başlamamı istersiniz?', 'Yatak odasını topladım… başka bir isteğiniz var mı? 😏'] },
    { re: /.*/, rp: 'patron', place: 'calisma', ic: '💼', you: ['Yeni patron olarak', 'Yönetici adayı olarak'], wear: 'cb:ofis2', co: ['Atlas Holding', 'Nova Medya', 'Zirve Danışmanlık', 'Kuzey Teknoloji', 'Mavi Ajans'], greet: ['Hoş geldiniz, sizi bekliyordum 💼 kahvenizi masanıza bıraktım.', 'Toplantı odası boş, orada konuşalım mı? Kapıyı kilitlerim 😏'] }
  ];
  const JOB_REQ = ['Esnek çalışma saatlerine uyum (gece mesaisi dahil 😏)', 'Takım çalışmasına ve yakın temasa yatkın', 'Gizlilik konusunda titiz', 'Stresli anlarda sakin kalabilen', 'Fazla mesaiden kaçmayan', 'Güler yüzlü ve iletişimi güçlü', 'Kıyafet yönetmeliğine uyacak', 'Yönetimle birebir çalışmaya istekli'];
  const jobRole = c => JOB_ROLES.find(r => r.re.test(low(c.job))) || JOB_ROLES[JOB_ROLES.length - 1];
  const jobCo = c => cmPick(c, 'co', jobRole(c).co);
  function renderJobs(id) {
    const c = id && cmFind(id);
    if (c) return renderJobPage(c);
    const list = cmAll().filter(c => c.job), q = low(ui.jbQ);
    const shown = list.filter(c => !q || low([c.job, c.city, jobCo(c)].join(' ')).includes(q));
    view.innerHTML = wsPage('jobs', 'Carmen<i>Jobs</i>', 'carmenjobs.com', '#/internet', `
      <div class="ws-hero"><h1>Hayalindeki iş seni bekliyor 💼</h1><p>${list.length} açık pozisyon · başvur, mülakata çağrıl</p>
        <input id="jbQ" type="search" placeholder="🔍 Meslek, şehir, şirket…" value="${esc(ui.jbQ || '')}"></div>
      <div class="ws-list">${shown.map(c => { const r = jobRole(c); return `<a class="ws-row" href="#/is/${c.id}"><span class="ws-ric jb-ic">${r.ic}</span><span class="ws-rin"><b>${esc(c.job)}</b>
        <small>${esc(jobCo(c))} · 📍 ${esc(c.city || 'Uzaktan')} · ${1 + cmNum(c, 'jd', 20)} gün önce</small><small>İşe alım: ${esc(c.name.split(' ')[0])} · ${12 + cmNum(c, 'ja', 140)} başvuru</small></span><i class="ws-go">›</i></a>`; }).join('')}</div>`);
    const inp = $('#jbQ');
    inp.oninput = () => { ui.jbQ = inp.value; renderJobs(); const n = $('#jbQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  }
  function renderJobPage(c) {
    const r = jobRole(c), co = jobCo(c), first = c.name.split(' ')[0], sal = 25 + cmNum(c, 'sl', 40);
    const rp = evFind(r.rp);
    view.innerHTML = wsPage('jobs', 'Carmen<i>Jobs</i>', 'carmenjobs.com/ilan/' + c.id.slice(-6), '#/is', `
      <div class="ws-sec jb-top"><span class="jb-logo">${r.ic}</span><div><small>${esc(co)} · 📍 ${esc(c.city || 'Uzaktan')}</small><h2>${esc(c.job)}</h2>
        <small>💰 ${sal}.000 – ${sal + 15}.000 ₺ · ⏰ Tam zamanlı · ${12 + cmNum(c, 'ja', 140)} başvuru</small></div></div>
      <section class="ws-sec"><h3>📄 İş tanımı</h3><p>${esc(co)}, ${esc(c.city ? trEk(c.city, 'de') : 'merkez')} ofisinde ${esc(low(c.job))} ekibiyle yakın çalışacak yeni bir ekip arkadaşı arıyor. Mülakatları ${esc(first)} hanım bizzat yapıyor.</p>
        <ul class="cm-good">${cmPicks(c, 'rq', JOB_REQ, 4).map(x => `<li>✓ ${esc(x)}</li>`).join('')}</ul></section>
      <section class="ws-sec jb-hr">${avatar(c, 56)}<div><small>İşe alım sorumlusu</small><b>${esc(c.name)}</b><small>${esc(c.job)} · ${persOf(c).slice(0, 2).map(esc).join(', ')}</small></div></section>
      <form class="ws-sec sy-form" id="jbForm"><h3>📩 Başvur</h3>
        <label>Pozisyon<select id="jbYou">${r.you.map((y, i) => `<option value="${i}">${esc(y)}</option>`).join('')}</select></label>
        <label>Ön yazı<textarea id="jbNote" rows="3" maxlength="300" placeholder="Kendini kısaca anlat…"></textarea></label>
        ${rp ? `<small class="cm-mute">🎭 Mülakat "${esc(rp.title)}" rolüyle başlar, olay ⚡ kısayollara eklenir.</small>` : ''}
        <button type="submit" class="btn primary">Başvuruyu gönder</button></form>`);
    $('#jbForm').onsubmit = e => {
      e.preventDefault();
      const you = r.you[+$('#jbYou').value], note = $('#jbNote').value.trim(), ch = cmAdopt(c), now = Date.now();
      const cos = fnCostumes(ch).find(x => x.id === r.wear) || (CL.items.find(x => x.id === r.wear) && { parts: { elbise: r.wear } });
      if (cos) { ch.wardrobe = [...new Set([...(ch.wardrobe || []), ...Object.values(cos.parts)])]; ch.outfit = { ust: '', alt: '', elbise: '', sutyen: '', tanga: '', corap: '', ...cos.parts }; }
      const t = newThread(ch, 'İş görüşmesi');
      msgsOf(t).push({ id: Store.uid(), from: 'sys', ts: now, text: `🕰️ 10:00 · ${co}`, scene: { place: r.place, icon: r.ic, name: co, hint: `${co} · ${c.job} mülakatı` } },
        { id: Store.uid(), from: 'sys', ts: now + 1, text: `💼 ${you} başvurdun${rp ? ` · 🎭 Rol: ${rp.title}` : ''}${note ? `\n📝 ${note}` : ''}` },
        { id: Store.uid(), from: 'her', ts: now + 2, text: pick(r.greet) });
      t.clock = { start: 600, done: 0 };
      quickPin(rp);
      save();
      sfx('match');
      const ov = document.createElement('div');
      ov.className = 'mt-match ws-ok';
      ov.innerHTML = `<div><h2>📩 Mülakata çağrıldın!</h2><div class="mt-pair">${avatar(ch, 84)}<span>${r.ic}</span></div><p>${esc(co)} · bugün 10:00</p><small>Sohbet açılıyor…</small></div>`;
      document.body.appendChild(ov);
      const go = () => { ov.remove(); location.hash = `#/chat/${t.id}`; };
      ov.onclick = go;
      setTimeout(() => { if (ov.isConnected) go(); }, 1800);
    };
  }

  /* 💬 Gizli İtiraf (#/itiraf): hepsi aldatma temalı, ultra fantezili; kadın ve erkek, kısa ve uzun isimsiz itiraflar (CF_POOL).
   * Sıra her açılışta karışık; 🎲 yeniden karıştırır, 🔥😂😳 tepkiler bu açılışlık (ui.cfReact) */
  const CF_POOL = [
    ['k', 'Kocam alt kattaki salonda maç izlerken ben üst katta, onun en yakın arkadaşının kucağındaydım. Her gol sesinde biz de bağırdık; kimse fark etmedi. Kocam o maçı "hayatımın en heyecanlı maçı" diye anlatıyor. Bence de ⚽🔥'],
    ['e', 'Nişanlımla düğün davetiyelerini seçmeye gittik. Matbaadaki kızla göz göze geldik. Nişanlım fontlara bakarken ben arka odada kâğıt kalitesini "test ediyordum". Davetiyeler çok güzel oldu bu arada 💌'],
    ['k', 'Sevgilim "bu hafta sonu iş seyahatim var" dedi. Ben de "benim de" dedim. Aynı otelde, aynı katta, yan yana odalarda başka insanlarla kalmışız. Kahvaltıda karşılaştık. İkimiz de hiçbir şey demedik. Hâlâ beraberiz 🏨😶'],
    ['e', 'Karım yoga hocasıyla, ben yoga hocasının karısıyla. Dört kişilik bir yalan zinciri. Yılbaşını beraber geçirdik, dördümüz de çok mutlu göründük 🧘‍♀️🎄'],
    ['k', 'Kocamın patronunu yemeğe davet ettik. Kocam şarap almaya markete inince patron masanın altından ayağımı buldu. Kocam döndüğünde tatlıyı ben servis etmiştim; patron "bu evin her şeyi çok lezzetli" dedi. Kocam terfi aldı 🍷'],
    ['e', 'Kız arkadaşımın ikiz kardeşiyle yattım. Bilerek. Kız arkadaşım hâlâ bilmiyor; ikizi her bayram bana göz kırpıyor 👯‍♀️'],
    ['k', 'Kısa: Nişan yüzüğümü çıkarıp çantama koyduğum ilk gece, hayatımın en iyi gecesiydi 💍'],
    ['e', 'Kısa: "Toplantıdayım" diye yazdım. Toplantı odasındaydım. Ama toplantı değildi 💼'],
    ['k', 'Düğünümden bir gece önce bekârlığa veda partisinde striptizci geldi. Herkes güldü, ben gülmedim. Ertesi gün gelinliğimin altında onun telefon numarası yazılıydı, ön kısmımda. Nikah memuru imzamı sorduğunda elim titriyordu, başka sebepten 👰'],
    ['e', 'Karım hamileyken ebe hemşireyle… biliyorum, cehennemde yerim hazır. Ama hemşire de evli çıktı, kocası da doğumhanede bizimle beraber bekledi. Dördümüz kahve içtik. Kimse kimseye bakamadı ☕'],
    ['k', 'Kocam beni her sabah 7\'de öperek işe gidiyor. 7.15\'te kapı tekrar çalıyor. Komşu kapıcı değil, ama bende anahtarı var 🔑'],
    ['e', 'Sevgilim duşta şarkı söylerken ben onun kız kardeşiyle mutfakta öpüşüyordum. Şarkı bitince durduk. Şimdi sevgilim duşta hep uzun şarkılar söylüyor; fark ettiğini düşünüyorum ve devam etmemizi istiyor gibi 🚿🎶'],
    ['k', 'Kısa: Kocamın adını bağırmam gereken yerde başka bir isim bağırdım. Kocam "o kim?" dedi. "Bir dizi karakteri" dedim. Dizi yok 📺'],
    ['e', 'Kısa: Evlilik yıldönümü hediyesini alırken kasiyer kızla tuvalette… hediye çok beğenildi 🎁'],
    ['k', 'Cadılar bayramında kocamla ikimiz de maskeli partiye gittik. Ben kedi kostümündeydim, o vampir. Gece boyu başka bir vampirle öpüştüm. Eve dönünce anladım: kocamın kostümü kırmızı pelerinliydi, benimki siyah pelerinli birini öpmüştü. Kocam da o gece bir kediyle öpüşmüş, ama ben değilmişim 🎭🐱🧛'],
    ['e', 'Sevgilimle çiftler terapisine gidiyoruz. Terapistle ben, seanslar arasında çiftler terapisi yapıyoruz. Sevgilim "çok ilerleme kaydettik" diyor. Kaydettik 🛋️'],
    ['k', 'Eşimle tatildeyken otelin animatörü beni gece yarısı aqua parkın kaydırağına çıkardı. Eşim balkondan "nerdesin?" diye mesaj attı. "Yüzüyorum" yazdım. Teknik olarak doğruydu 🌊'],
    ['e', 'Karımın en yakın arkadaşı bana "senin karın çok şanslı" dedi. Sonra o şansı bir öğleden sonralığına ödünç aldı. Karım akşam ona "bugün çok parlıyorsun" dedi ✨'],
    ['k', 'Kısa: Kocam beni yatakta hiç bu kadar mutlu görmemiş. Haklı. Görmedi 😏'],
    ['e', 'Kısa: Aldattığım gece eve çiçekle geldim. Karım ağladı. Mutluluktan. Ben de ağladım. Başka sebepten 💐'],
    ['k', 'Nişanlım beni sürpriz yapmak için işyerime geldi. Sürpriz olan oydu: masamın altında stajyer vardı. Nişanlım çiçeği masaya bıraktı, "yoğunsun herhalde" dedi ve gitti. Stajyer hâlâ o çiçeği saklıyor 🌹'],
    ['e', 'Karım Paris\'e anne babasını görmeye gittiğinde ben de Paris\'e gittim. Aynı uçak, iki sıra arkada, yanımda başka bir kadın. Karım bir kez bile dönüp bakmadı. Eyfel kulesinin dibinde birbirimize el salladık bile, uzaktan 🗼'],
    ['k', 'Kocamın doktoruyla muayene sırasında göz göze geldik. Şimdi kocam her ay kontrole gidiyor, ben de ona "eşlik ediyorum". Doktor her seferinde "sizi bekleme salonunda bekletmeyeyim" diyor ve beni başka odaya alıyor 🩺'],
    ['e', 'Kısa: Karım "kiminle konuşuyorsun?" dedi. "Annemle" dedim. Annem 3 yıldır tatilde değil 📱'],
    ['k', 'Kısa: Evlilik yüzüğüm onun parmağında kaldı, kendisininki benim çantamda. İkimizin de eşi fark etmedi 💍💍'],
    ['e', 'Ben ve karım swinger partiye gitmeyi konuştuk. Ben gittim. Karım gelmedi; çünkü o başka bir swinger partisindeymiş. Kapıda karşılaştık. Ev sahibi "ikiniz de mi buradasınız?" diye sevindi. O gece hiç konuşmadık ama çok… eğlendik 🎉'],
    ['k', 'Kocam için kırmızı iç çamaşırı aldım. Kocam yorgundu, uyudu. Yan daire de uyumuyordu. İç çamaşırı boşa gitmedi ❤️'],
    ['e', 'Sevgilim bana sürpriz doğum günü partisi hazırlamış. Ben ise partiye 2 saat geç geldim çünkü pastacı kızla pastayı "test ediyorduk". Pastada mum yerine onun ruj izi vardı, kimse anlamadı 🎂'],
    ['k', 'Bir gecede iki ayrı erkekle aynı restoranda, iki ayrı masada yemek yedim. Tuvalete gidiyorum diyerek masa değiştirdim. İkisi de tatlıyı ısmarladı. Gece ikisiyle de… sıralı 🍝🍝'],
    ['e', 'Kısa: Karımın kuzeniyle düğünümde dans ettim. Sadece dans değildi 💃'],
    ['k', 'Kocam beni uyurken izlemeyi seviyor. Ben de uyuyor gibi yapıp telefonun altından başkasına mesaj atmayı seviyorum. Sabah "çok huzurlu uyuyordun" diyor. Çok huzursuzdum aslında 😈'],
    ['e', 'Evlendiğimiz otelde, düğün gecesi, karım duştayken resepsiyondaki kız oda servisini getirdi. Şampanya ve iki kadeh. Biri onun için değildi 🥂'],
    ['k', 'Nişanlımla gelinlik provasına gittim. Terzi ölçü alırken o kadar uzun sürdü ki nişanlım dışarıda iki kahve içti. Gelinlik mükemmel oturdu; terzi her santimini biliyor 👗'],
    ['e', 'Kısa: Kayınpederimin sekreteri, kayınpederimin masasında. Ben de oradaydım. Kayınpederim tatildeydi 🗂️'],
    ['k', 'Sevgilim spor salonuna beni sürpriz yapmak için geldi. Personal trainer\'ım beni o sırada "esnetiyordu". Sevgilim "çok terlemişsin" dedi, ben "bugün bacak günüydü" dedim. Bacak günüydü gerçekten 🏋️'],
    ['e', 'Karımla evlilik yeminlerimizi yenilemek için adaya gittik. Törende yemin ederken gözüm nedimedeydi. Tören bittiğinde nedimeyle yemin bozduk, karımla yemin yeniledik. Aynı gün, aynı ada 🏝️'],
    ['k', 'Kısa: Kocam beni "en sadık kadın" diye arkadaşlarına övüyor. Arkadaşlarından üçü buna gülmemek için kendini zor tutuyor 😇'],
    ['e', 'Kısa: Ofis partisinde müdürümüzün karısı bana "kocam hiç bu kadar eğlenceli değil" dedi. Fotokopi odasında bunu kanıtladım 📠'],
    ['k', 'Komşumla aramızda sadece bir duvar var. Kocam işe gidince duvarın iki tarafından aynı anda vuruşlar başlıyor. Kocam akşam "komşu yine tadilat mı yapıyor?" diye soruyor. Evet, kocacım. Her gün 🔨'],
    ['e', 'Kız arkadaşımla birlikte yaşıyoruz. Kız arkadaşımın en yakın arkadaşı bizde kalmaya geldi, kanepede yattı. Üç gece boyunca kanepe hiç yalnız kalmadı. Kız arkadaşım dördüncü gün "kanepe neden gıcırdıyor?" diye sordu. "Eski" dedim 🛋️'],
    ['k', 'Kocamla Kapadokya\'da balon turuna çıktık. Balon pilotu bir sonraki turu "özel" yapmayı teklif etti. Kocam otelde uyurken gün doğumunda gökyüzünde iki kişiydik. Kocam fotoğraflarıma bakıp "yalnız mı çıktın?" dedi. Yalnız değildim, ama yerden çok yüksekteydim 🎈'],
    ['e', 'Kısa: Karım beni aradı, "neredesin?" dedi. "Trafikte" dedim. Arabanın arka koltuğundaydım, araba park hâlindeydi 🚗'],
    ['k', 'Kısa: Evliliğimizin 10. yılında kocama bir sırrımı söyledim. Doğru olanı değil 🙊'],
    ['e', 'Nişanlım yurt dışında master yaparken onun ev arkadaşı bana nişanlımın eşyalarını göndermek için geldi. Kutu bantlamamız 4 saat sürdü. Kutu yine de eksik gitti; içinden bir tanga eksikti, bende kaldı 📦'],
    ['k', 'Ben bir uzay istasyonunda olduğumu hayal ederek kocamla sevişiyordum. Sonra gerçek oldu: kocamın uzay mühendisi arkadaşı bizi simülatöre götürdü. Kocam kontrol odasındaydı, ben ve arkadaşı yerçekimsiz kabinde. "Uçuş" 40 dakika sürdü. Kocam "çok mutlu görünüyorsun" dedi 🚀'],
    ['e', 'Kısa: Karımın kardeşinin düğününde gelinin annesiyle… evet. Kayınvalidemin kız kardeşiyle 🙈'],
    ['k', 'Kocamı 15 yıldır aldatıyorum. Aynı adamla. O adam da karısını 15 yıldır benimle aldatıyor. Her yıl aynı gün, aynı otelde yıldönümümüzü kutluyoruz. Bazen düşünüyorum, asıl evliliğim hangisi? 🗓️'],
    ['e', 'Kız arkadaşım beni deniz kızı fantezisi yaparken yakalayacaktı. Ama o sırada havuzda başka bir deniz kızı vardı, kuyruğu gerçek değildi tabii. Kız arkadaşım "havuz neden bu kadar köpüklü?" diye sordu. Köpük banyosu yaptım dedim 🧜‍♀️'],
    ['k', 'Kısa: Kocam "sen bensiz ne yapardın?" diye sordu. Söyleyemedim, ama dün yaptım 😌'],
    ['e', 'Kısa: Gece vardiyası diye söylediğim her gece, gerçekten çok yoruldum 🌙'],
    ['k', 'Kocamın kız kardeşinin kocası… aileden biri gibi olduk. Bayram sofralarında ayaklarımız masanın altında, ellerimiz baklava tepsisinde. Kayınvalidem "ne güzel anlaşıyorsunuz" diyor. Çok iyi anlaşıyoruz anne 🥮'],
    ['e', 'Karımla beraber tango kursuna yazıldık. Hocamız karıma çok yakın durup "tangoda üç kişi olmaz" dedi. Ben de o hafta salsa hocasıyla özel derse başladım. Şimdi ikimiz de çok iyi dans ediyoruz, ama birbirimizle değil 💃🕺'],
    ['k', 'Kısa: Kocamın kravatını takan başka bir adamla yattım. Kocam o kravatı aradı, hâlâ arıyor 👔'],
    ['e', 'Kısa: Ben evli değilim. Ama yattığım kadınların hepsi evliydi. Ben bir hizmetim 😏'],
    ['k', 'Eşim bana "dışarıda biri var mı?" diye sordu. "Dışarıda yok" dedim. İçeride vardı, gardırobun içinde. Eşim duşa girince gardırop açıldı ve hayatımın en hızlı veda öpücüğü oldu 🚪'],
    ['e', 'Kısa: Balayında karım uyurken otelin spa\'sındaki masözle masaj masasında… masaj gerçekten rahatlatıcıydı 💆'],
    ['k', 'Sevgilimin doğum günü için onun en sevdiği şarkıcıyı özel konsere davet ettim. Konserden sonra şarkıcı beni kulise çağırdı. Sevgilim sahnede bana el sallarken ben kuliste şarkıcının mikrofonuyla… başka bir şarkı söylüyordum 🎤'],
    ['e', 'Kısa: "Bir daha olmayacak" dedik. Bu 47. "bir daha olmayacak"tı 🔁'],
    ['k', 'Kısa: Kocamın işe geç kaldığı her sabah, ben erken kalkıyorum. Komşu da 🌅']
  ];
  const cfAgeOf = i => 19 + (+sysHash('cfa' + i) % 27);
  function renderConfess() {
    if (!ui.cfOrder || ui.cfOrder.length !== CF_POOL.length) ui.cfOrder = sample(CF_POOL.map((_, i) => i), CF_POOL.length);
    const f = ['k', 'e', 'long', 'short'].includes(ui.cfF) ? ui.cfF : 'all', R = ui.cfReact = ui.cfReact || {}, n = ui.cfN || 20;
    const long = i => CF_POOL[i][1].length > 110;
    const ids = ui.cfOrder.filter(i => f === 'all' || (f === 'long' ? long(i) : f === 'short' ? !long(i) : CF_POOL[i][0] === f));
    const cnt = (i, k) => 3 + (+sysHash(`cf${k}${i}`) % 240) + ((R[i] || {})[k] ? 1 : 0);
    view.innerHTML = wsPage('conf', 'Gizli<i>İtiraf</i>', 'gizliitiraf.com', '#/internet', `
      <div class="ws-hero"><h1>Kimse bilmeyecek… 🤫</h1><p>${CF_POOL.length} aldatma itirafı · isim yok, yargı yok</p></div>
      ${wsTabs('cff', [['all', 'Hepsi'], ['k', '👩 Kadınlar'], ['e', '👨 Erkekler'], ['long', '📜 Uzun'], ['short', '⚡ Kısa']], f)}
      <div class="ws-list">${ids.slice(0, n).map(i => { const [g, t] = CF_POOL[i]; return `<article class="cf-card cf-${g}">
        <div class="cf-h"><span class="cf-anon">🎭</span><b>Anonim</b><small>${g === 'k' ? '👩 Kadın' : '👨 Erkek'}, ${cfAgeOf(i)} · ${1 + (+sysHash('cfh' + i) % 47)} saat önce</small></div>
        <p>“${esc(t.replace(/^Kısa:\s*/, ''))}”</p>
        <div class="cf-re">${[['fire', '🔥'], ['lol', '😂'], ['wow', '😳']].map(([k, e]) => `<button type="button" class="${(R[i] || {})[k] ? 'on' : ''}" data-cfr="${i}:${k}">${e} ${cnt(i, k)}</button>`).join('')}</div></article>`; }).join('')}</div>
      <div class="ws-btns cf-more">${ids.length > n ? '<button type="button" class="btn ghost" data-cfm="more">⬇️ Daha fazla</button>' : ''}<button type="button" class="btn primary" data-cfm="mix">🎲 Karıştır</button></div>`);
    view.querySelectorAll('[data-cff]').forEach(b => b.onclick = () => { ui.cfF = b.dataset.cff; ui.cfN = 20; renderConfess(); });
    view.querySelectorAll('[data-cfr]').forEach(b => b.onclick = () => {
      const [i, k] = b.dataset.cfr.split(':'), r = R[i] = R[i] || {};
      r[k] = !r[k];
      b.classList.toggle('on', r[k]);
      b.textContent = `${{ fire: '🔥', lol: '😂', wow: '😳' }[k]} ${cnt(+i, k)}`;
    });
    view.querySelectorAll('[data-cfm]').forEach(b => b.onclick = () => {
      if (b.dataset.cfm === 'more') ui.cfN = n + 20;
      else { ui.cfOrder = null; ui.cfN = 20; window.scrollTo(0, 0); }
      renderConfess();
    });
  }

  /* 🎬 CarmenFlix (#/flix, #/flix/<id>, #/flix/<id>/<bölüm>): Netflix gibi; film ve diziler yazışma olarak sırayla oynar.
   * Başrol: ilanlardan / karakterlerinden bir kadın (fotoğraf) + bir erkek adı. Senaryo konuya göre (FX_TROPE) ve genel havuzlardan
   * tohumla kurulur: aynı bölüm hep aynı. İzleme durumu bu tarayıcıda: amor-stories:flix { last: {id, ep}, seen: {id: [ep]}, list: [id] } */
  const FX_MEN = ['Kerem', 'Mert', 'Emre', 'Can', 'Burak', 'Ozan', 'Deniz', 'Arda', 'Kaan', 'Tolga', 'Cem', 'Onur', 'Barış', 'Selim', 'Efe'];
  const FX_TITLES = [
    { id: 'komsu', k: 'film', t: 'Kapı Komşusu', tr: 'komsu', g: ['komsu', 'aldatma'], p: 'Yan daire', tag: 'Duvarlar ince, geceler uzun.', desc: 'Yanlış kapıya gelen bir kargo, iki komşuyu aynı duvarın iki yanından tek bir yatağa taşır. Kocası şehir dışındayken her ses bir davettir.' },
    { id: 'mesai', k: 'film', t: 'Mesai Sonrası', tr: 'patron', g: ['is'], p: 'Plaza, 32. kat', tag: 'Herkes gitti. Rapor bahaneydi.', desc: 'Genç asistan ve soğuk patronu; boş bir plazada bitmeyen bir rapor ve kilitlenen bir kapı.' },
    { id: 'ders', k: 'film', t: 'Son Ders', tr: 'hoca', g: ['is', 'fantezi'], p: 'Kampüs, ofis 214', tag: 'Ofis saati 18:00\'de başlar.', desc: 'Final haftası. Notu sınırda bir öğrenci ve gözünü ondan alamayan hocası. Ekstra ödev hiç bu kadar uzun sürmemişti.' },
    { id: 'muayene', k: 'film', t: 'Muayene', tr: 'doktor', g: ['is', 'fantezi'], p: 'Özel klinik', tag: 'Tam muayene. Sütyen dahil.', desc: 'Göğsündeki ağrıyı anlatmaya gelen kadın, doktorun stetoskopunu tenine değdirdiği an teşhisi değiştirir.' },
    { id: 'yasakoda', k: 'film', t: 'Yasak Oda', tr: 'otel', g: ['aldatma', 'romantik'], p: 'Otel Lumière, 507', tag: 'Kocası yan odada uyuyor.', desc: 'Balayı süitinin yanındaki odada jakuzi bozulur; tamire gelen resepsiyonist aletleriyle değil, dudaklarıyla gelir.' },
    { id: 'asansor', k: 'film', t: 'Asansör', tr: 'yabanci', g: ['yabanci'], p: 'Asansör, 14. kat', tag: '40 dakika. İki yabancı. Sıcak.', desc: 'Asansör katlar arasında durur. İki yabancı, bir karar ve buğulanan aynalar.' },
    { id: 'eski', k: 'film', t: 'Düğünden Önceki Gece', tr: 'eski', g: ['aldatma', 'romantik'], p: 'Eski evleri', tag: 'Bir son kez. Belki.', desc: 'Yarın evleniyor. Bu gece ise eski sevgilisinin kapısında; aynı parfüm, aynı bakış, aynı hata.' },
    { id: 'kar', k: 'film', t: 'Kar Fırtınası', tr: 'tatil', g: ['romantik', 'yabanci'], p: 'Dağ evi', tag: 'Elektrik yok. Battaniye tek.', desc: 'Kar iki yabancıyı aynı dağ evine kapatır. Şömine yanar, battaniye paylaşılır, kimse üşümez.' },
    { id: 'kostum', k: 'film', t: 'Maskeli Balo', tr: 'kostum', g: ['fantezi'], p: 'Kostüm partisi', tag: 'Maske kalır. Gerisi çıkar.', desc: 'Kedi kulaklı bir kadın ve tasmalı bir yabancı. Kimse kimsenin adını bilmez; sabaha kadar bilmeyecekler de.' },
    { id: 'masaj', k: 'film', t: 'Özel Paket', tr: 'masaj', g: ['fantezi', 'is'], p: 'Lotus Spa', tag: 'Havlu isteğe bağlıdır.', desc: 'Sırtı gergin bir müşteri, yağları ısıtan bir masöz ve menüde olmayan "özel paket".' },
    { id: 'nedime', k: 'film', t: 'Nedime', tr: 'aldatma', g: ['aldatma'], p: 'Düğün salonu, vestiyer', tag: 'Buket havada, nedime kayıp.', desc: 'Düğünün ortasında damadın sağdıcı ve gelinin nedimesi vestiyerde kaybolur. Yemin edenler başkaları, yemini bozanlar onlar.' },
    { id: 'tren', k: 'film', t: 'Gece Treni', tr: 'yabanci', g: ['yabanci', 'romantik'], p: 'Kompartıman 7', tag: 'Sabaha kadar sadece ikisi.', desc: 'Doğu Ekspresi, tek kompartıman, iki yabancı. Raylar sallar, onlar durmaz.' },
    { id: 'evarkadasi', k: 'dizi', eps: 6, t: 'Ev Arkadaşları', tr: 'oda', g: ['komsu', 'romantik'], p: 'Kadıköy, 3+1', tag: 'Kural: ev arkadaşları arasında asla.', desc: 'Üç kişilik bir evde tek bir kural vardır ve ilk hafta yıkılır. Banyo kapısı, gece mutfağı, ince duvarlar.' },
    { id: 'plaza', k: 'dizi', eps: 5, t: 'Plaza', tr: 'patron', g: ['is', 'aldatma'], p: 'Atlas Holding', tag: 'Terfi listesinde adın var.', desc: 'Evli CEO ve yeni asistanı. Toplantı odaları, iş seyahatleri ve bir türlü ters çevrilmeyen bir aile fotoğrafı.' },
    { id: 'komsular', k: 'dizi', eps: 5, t: 'Komşular', tr: 'komsu', g: ['komsu', 'aldatma'], p: 'Bahçeli site', tag: 'Her ev bir sır saklar.', desc: 'Bahçeli bir sitede kocalar işe gider, kapılar aralanır. Balkonlar, havuz ve herkesin herkesi duyduğu geceler.' },
    { id: 'sadakatsiz', k: 'dizi', eps: 6, t: 'Sadakatsiz Kalpler', tr: 'aldatma', g: ['aldatma', 'romantik'], p: 'Nişantaşı', tag: 'Yüzüğünü çıkarmadı. Bilsin diye.', desc: 'Mükemmel görünen bir evlilik, bir yabancının mesajıyla çatlar. Her bölümde yalan biraz daha büyür, tutku biraz daha ateşlenir.' },
    { id: 'kampus', k: 'dizi', eps: 5, t: 'Kampüs', tr: 'hoca', g: ['is', 'fantezi'], p: 'Kuzey Üniversitesi', tag: 'Final sınavı yarın.', desc: 'Genç bir akademisyen ve parlak öğrencisi. Ofis saatleri, kütüphane rafları ve kimsenin bilmemesi gereken notlar.' },
    { id: 'lumiere', k: 'dizi', eps: 5, t: 'Otel Lumière', tr: 'otel', g: ['aldatma', 'fantezi'], p: 'Otel Lumière', tag: 'Her odanın bir hikayesi var.', desc: 'Lüks bir otelin resepsiyonisti her gece başka bir odaya çağrılır. Oda servisi asla sadece şampanya değildir.' },
    { id: 'yaz', k: 'dizi', eps: 4, t: 'Yaz Aşkı', tr: 'tatil', g: ['romantik', 'yabanci'], p: 'Bodrum', tag: 'Tatil bitmedi daha.', desc: 'Bir yaz, bir otel, bir animatör. Gece kapalı havuzlar, mayosuz yüzmeler ve dönüş bileti olmayan bir aşk.' },
    { id: 'kulup', k: 'dizi', eps: 6, t: 'Fantezi Kulübü', tr: 'fantezi', g: ['fantezi'], p: 'Kırmızı Kulüp', tag: 'Kural basit: hayır demek yok.', desc: 'Maskeli bir kulüpte her hafta yeni bir rol: polis, hizmetçi, öğretmen… Gözler bağlı, kelepçeler hazır.' },
    { id: 'hastane', k: 'dizi', eps: 4, t: 'Gece Vardiyası', tr: 'doktor', g: ['is', 'aldatma'], p: 'Şifa Hastanesi', tag: 'Koridorda sadece ikisi.', desc: 'Evli bir doktor ve gece vardiyasındaki hemşire. Boş muayene odaları, nöbet odası ve hızlanan kalp atışları.' },
    { id: 'mesajlar', k: 'dizi', eps: 4, t: 'Kayıp Mesajlar', tr: 'eski', g: ['romantik', 'aldatma'], p: 'İstanbul', tag: '"Hâlâ o dövmen var mı?"', desc: 'Yıllar sonra gelen tek bir mesaj, iki eski sevgiliyi evliliklerinin ortasında yeniden buluşturur.' },
    { id: 'salon', k: 'dizi', eps: 4, t: 'Spor Salonu', tr: 'spor', g: ['is', 'fantezi'], p: 'FitLife', tag: 'Son set. Son tekrar.', desc: 'Kişisel antrenör ve en hevesli öğrencisi. Kapanıştan sonra soyunma odası, duşlar ve "özel program".' },
    { id: 'kostumgece', k: 'dizi', eps: 3, t: 'Kostüm Gecesi', tr: 'kostum', g: ['fantezi'], p: 'Amour Otel', tag: 'Kuyruğun gerçek mi?', desc: 'Kedi, tavşan, hemşire, polis… Her bölüm yeni bir kostüm, aynı iki kişi ve aynı açlık.' }
  ];
  const FX_GENRE = { aldatma: '💔 Aldatma', is: '💼 İş yerinde', fantezi: '🎭 Fantezi & kostüm', romantik: '🌹 Romantik', komsu: '🏠 Komşular & ev', yabanci: '🌙 Yabancılar' };
  const FX_TROPE = {
    komsu: { open: [[['b', 'Merhaba, ben yan daireden {b}. Kargonuz yanlışlıkla bana gelmiş 📦'], ['a', 'Aa teşekkürler! İçinde ne olduğunu sormadın değil mi? 🙈'], ['b', 'Kutunun üstünde "gizli paket" yazıyordu… merak etmedim desem yalan olur 😏'], ['a', 'Gel bir kahve iç, belki gösteririm ☕']],
      [['a', 'Komşu, gece müziğin çok yüksekti 😤'], ['b', 'Özür dilerim… senin sesin de çok yüksekti ama ben şikâyet etmedim 😏'], ['a', 'Duydun mu?! 😳'], ['b', 'Duvarlar ince {a}. Her şeyi duyuyorum.']]],
      twist: [[['a', 'Kocam bu hafta şehir dışında…'], ['b', 'Biliyorum. Arabası 3 gündür yok.']], [['b', 'Balkonda çamaşır asarken seni izledim, kızdın mı?'], ['a', 'Kızsam perdeyi kapatırdım 😈']]] },
    patron: { open: [[['b', '{a}, mesai bitti ama raporu bitirmeden gitmiyorsun.'], ['a', 'Herkes gitti efendim…'], ['b', 'Biliyorum. O yüzden kapıyı kilitledim 🔒'], ['a', 'Rapor bahaneydi değil mi? 😏']],
      [['a', 'Toplantıda bana bakıp durdunuz, sunumum o kadar mı kötüydü?'], ['b', 'Sunumun mükemmeldi. Eteğin daha da mükemmeldi.'], ['a', 'Bunu İK\'ya bildirmeliyim 😏'], ['b', 'Bildir. Ama önce odama gel.']]],
      twist: [[['a', 'Masanızdaki fotoğraftaki kadın… eşiniz mi?'], ['b', 'Evet. Fotoğrafı ters çevir.']], [['b', 'Terfi listesinde adın var.'], ['a', 'Bunu hak etmek için ne yapmam gerek? 😇']]] },
    hoca: { open: [[['a', 'Hocam, notum için konuşmaya geldim 🙈'], ['b', 'Kapıyı kapat {a}. Notunu konuşalım.'], ['a', 'Ne yapmam gerekiyorsa yaparım…'], ['b', 'Ekstra ödev mi istiyorsun?']],
      [['b', 'Derste sürekli dudağını ısırıyordun.'], ['a', 'Siz de sürekli bana bakıyordunuz hocam.'], ['b', 'Ofis saatim 18:00\'de başlıyor.'], ['a', 'Ben 17:59\'da oradayım 😈']]],
      twist: [[['a', 'Diğer öğrenciler fark ederse?'], ['b', 'Kampüs boş. Sadece biz ve bekçi var.']], [['b', 'Final sınavı yarın.'], ['a', 'Bu gece çalışalım o zaman… sizinle 📚']]] },
    doktor: { open: [[['a', 'Doktor bey, göğsümde bir ağrı var…'], ['b', 'Bluzunuzu çıkarın lütfen, dinlemem lazım 🩺'], ['a', 'Sütyeni de mi? 🙈'], ['b', 'Tam muayene, {a} hanım.']],
      [['b', 'Gece vardiyasında yalnız mısın?'], ['a', 'Koridorda sadece ikimiz varız doktor.'], ['b', 'Boş muayene odası var.'], ['a', 'Ben de tam yorgunluk muayenesi olacaktım 😏']]],
      twist: [[['a', 'Kalp atışım çok mu hızlı?'], ['b', 'Benimki daha hızlı. Dinle.']], [['b', 'Ateşin var gibi.'], ['a', 'Siz dokununca çıkıyor 🔥']]] },
    aldatma: { open: [[['a', 'Kocam alt katta. Sessiz olmalıyız 🤫'], ['b', 'Sen mi sessiz olacaksın? Hiç sanmıyorum 😏'], ['a', 'Deneyeceğim… söz veremem.'], ['b', 'Kapıyı kilitledin mi?']],
      [['b', 'Nişanlın bu gece nerede?'], ['a', 'Bekârlığa veda partisinde. Ben de kendi vedamı yapıyorum 😈'], ['b', 'Sabah ona ne diyeceksin?'], ['a', '"Seni çok özledim" diyeceğim. Doğru olacak.']]],
      twist: [[['a', 'Telefon çalıyor… o arıyor 😱'], ['b', 'Aç. Ben durmayacağım.']], [['b', 'Yüzüğünü çıkarmadın.'], ['a', 'Çıkarmayacağım. Bilsin istiyorum ki ona rağmen buradayım.']]] },
    yabanci: { open: [[['b', 'Asansör durdu galiba…'], ['a', 'Harika. Tanımadığım biriyle mahsur kaldım 🙄'], ['b', '{b}. Artık tanıyorsun.'], ['a', '{a}. Ve sıcak… çok sıcak burası.']],
      [['a', 'Bu koltuk boş mu? Tren çok kalabalık.'], ['b', 'Senin için boş. Gece treni uzun sürer.'], ['a', 'Kompartımanda başka kimse yok mu?'], ['b', 'Sabaha kadar sadece biz 🚆']]],
      twist: [[['a', 'Normalde yabancılarla konuşmam.'], ['b', 'Konuşmayalım o zaman.']], [['b', 'Adını bile bilmiyorum aslında.'], ['a', 'Bilme. Gizemli kalsın 😏']]] },
    eski: { open: [[['b', 'Yıllar sonra… hâlâ aynı parfümü kullanıyorsun.'], ['a', 'Sen de hâlâ aynı bakıyorsun bana.'], ['b', 'Neden ayrıldık biz?'], ['a', 'Hatırlamıyorum. Bu gece hatırlatmak ister misin?']],
      [['a', 'Düğünüme gelmeyecek misin?'], ['b', 'Gelirsem gelinle kaçarım 😏'], ['a', 'Belki bunu istiyorumdur…'], ['b', 'Düğünden önceki gece. Eski evimizde.']]],
      twist: [[['a', 'Bu bir hata.'], ['b', 'En güzel hatamızdın her zaman.']], [['b', 'Hâlâ o dövmen var mı?'], ['a', 'Gel kendin bak.']]] },
    tatil: { open: [[['a', 'Elektrik kesildi, sen de mi karanlıktasın? 🕯️'], ['b', 'Şömineyi yaktım. Gel, sıcak.'], ['a', 'Sadece ısınmak için geliyorum…'], ['b', 'Tabii. Battaniye tek ama ❄️']],
      [['b', 'Havuz gece kapalıymış.'], ['a', 'Duvar alçak. Atlayalım mı? 🏊'], ['b', 'Mayon yok ki.'], ['a', 'Kimin mayoya ihtiyacı var? 😈']]],
      twist: [[['a', 'Tatil bitince ne olacak?'], ['b', 'Tatil bitmedi daha.']], [['b', 'Otelin animatörü sana bakıyordu.'], ['a', 'Ben sana bakıyordum.']]] },
    kostum: { open: [[['a', 'Partiye kedi kostümüyle geldim 🐱'], ['b', 'Ben de kediler için tasmayla geldim 😏'], ['a', 'Miyav… dikkat et, tırmalarım.'], ['b', 'Tırmala. İz kalsın.']],
      [['b', 'Hemşire kostümü mü? Cadılar bayramı değil ki.'], ['a', 'Kim dedi bayram için giydim diye? 🩺'], ['b', 'Hastaya bakar mısın?'], ['a', 'Önce ateşini ölçeyim…']]],
      twist: [[['a', 'Maskemi çıkarmayacağım.'], ['b', 'Sadece maskeni.']], [['b', 'Kuyruğun gerçek mi?'], ['a', 'Çekip görsene 😈']]] },
    masaj: { open: [[['b', 'Masaj randevum vardı. {b}.'], ['a', 'Hoş geldin. Havluyla yüzüstü uzan lütfen 💆‍♀️'], ['b', 'Sadece havlu mu?'], ['a', 'İstersen havlu da olmaz.']],
      [['a', 'Sırtın çok gergin.'], ['b', 'Sadece sırtım değil 😳'], ['a', 'Bunu da çözeriz. Özel paket var.'], ['b', 'Neler içeriyor?']]],
      twist: [[['a', 'Masaj yağı ısınıyor 🔥'], ['b', 'Ben de.']], [['b', 'Ellerin büyülü.'], ['a', 'Daha dudaklarımı görmedin.']]] },
    oda: { open: [[['a', 'Banyo kapısını kilitlemeyi unuttum, sen de girdin 😳'], ['b', 'Buhardan görmedim… pek.'], ['a', 'Pek mi?! 🙈'], ['b', 'Ev arkadaşı olarak itiraf etmeliyim: çok güzelsin.']],
      [['b', 'Gece mutfakta ne yapıyorsun?'], ['a', 'Uyuyamadım. Sen?'], ['b', 'Seni düşünüyordum, uyuyamadım.'], ['a', 'Tezgâh soğuk ama… 😏']]],
      twist: [[['a', 'Diğer ev arkadaşımız uyanmasın.'], ['b', 'O uyusun, sen uyanık kal yeter.']], [['b', 'Kural vardı: ev arkadaşları arasında asla.'], ['a', 'Kurallar yıkılmak için var.']]] },
    otel: { open: [[['b', 'Oda servisi istemiştiniz?'], ['a', 'Şampanya istemiştim… ama sen de olur 🍾'], ['b', 'Menüde yokum.'], ['a', 'Gizli menü?']],
      [['a', 'Resepsiyon, 507\'deyim, jakuzi çalışmıyor.'], ['b', 'Hemen geliyorum hanımefendi.'], ['a', 'Acele et… su soğuyor 🛁'], ['b', 'Tamir için yanımda alet getirdim 😏']]],
      twist: [[['a', 'Kocam yan odada uyuyor.'], ['b', 'Ses yalıtımı iyidir bizim otelde.']], [['b', 'Kartını unutmuşsun.'], ['a', 'Bilerek unuttum.']]] },
    fantezi: { open: [[['a', 'Kulübe hoş geldin. Kural basit: maskeyi çıkarmak yok 🎭'], ['b', 'Başka kural?'], ['a', 'Hayır demek de yok. Bu gece.'], ['b', 'Kabul.']],
      [['b', 'Bu gece hangi rolü oynuyoruz?'], ['a', 'Ben polis, sen şüpheli 🚓'], ['b', 'Suçum ne?'], ['a', 'Fazla yakışıklı olmak. Kelepçe zamanı.']]],
      twist: [[['a', 'Kırmızı oda hazır.'], ['b', 'Neden kırmızı?'], ['a', 'İzler görünmesin diye 😈']], [['b', 'Gözlerini bağlayacağım.'], ['a', 'Sonra ne olacak?'], ['b', 'Sürpriz.']]] },
    spor: { open: [[['b', 'Son set. Bacakları biraz aç.'], ['a', 'Hocam bu egzersiz programda yok 😳'], ['b', 'Özel program.'], ['a', 'Kaç tekrar?']],
      [['a', 'Soyunma odasında kimse yok mu?'], ['b', 'Salon 10 dakika önce kapandı.'], ['a', 'Duşa beraber mi giriyoruz? 🚿'], ['b', 'Su tasarrufu.']]],
      twist: [[['a', 'Çok terledim.'], ['b', 'Daha terleyeceksin.']], [['b', 'Esneme hareketi yap.'], ['a', 'Böyle mi? 😏']]] }
  };
  const FX_FLIRT = [[['b', 'Bugün çok güzel görünüyorsun, biliyor musun?'], ['a', 'Biliyorum 😏 senin için giyindim']], [['a', 'Neden bana öyle bakıyorsun?'], ['b', 'Gözlerimi senden alamıyorum']],
    [['b', 'Dudakların çok davetkâr'], ['a', 'Davet edildin o zaman 💋']], [['a', 'Kalbim çok hızlı atıyor…'], ['b', 'Dokunayım mı?']], [['b', 'Sana dokunmak istiyorum'], ['a', 'Neden bekliyorsun?']],
    [['a', 'Bu yaptığımız çok yanlış'], ['b', 'O zaman neden bu kadar güzel hissettiriyor?']], [['b', 'Kokun aklımı başımdan alıyor'], ['a', 'Daha yakından kokla 😏']], [['a', 'Ellerin titriyor'], ['b', 'Senin yüzünden']],
    [['b', 'Bu elbiseyi kim için giydin?'], ['a', 'Çıkaracak kişi için 😈']], [['a', 'Bana yaklaşma… yoksa kendimi tutamam'], ['b', 'Tutma']], [['b', 'Sesini duymak istiyorum'], ['a', 'Duyacaksın… söz 🔥']], [['a', 'Hiç böyle hissetmemiştim'], ['b', 'Daha başlamadık bile']]];
  const FX_ESC = [[['sys', 'Kapı kapandı. Işıklar loş.'], ['a', 'Gel buraya…']], [['sys', 'Dudakları buluştu; önce yavaş, sonra açlıkla.'], ['b', 'Ne kadar zamandır bunu bekliyordum']],
    [['sys', 'Gömleğin düğmeleri teker teker açıldı.'], ['a', 'Acele etme… ya da et 😏']], [['sys', 'Elbise yere düştü.'], ['b', 'Vay…'], ['a', 'Beğendin mi?']],
    [['sys', 'Duvara yaslandılar, nefesleri birbirine karıştı.'], ['a', 'Daha sıkı tut beni']], [['sys', 'Yatağa düştüler.'], ['b', 'Seni istiyorum {a}'], ['a', 'Al o zaman']],
    [['sys', 'Parmakları tenini keşfetti.'], ['a', 'Ahh… orası…']], [['sys', 'Sütyeni kayıp gitti.'], ['b', 'Mükemmelsin']]];
  const FX_EVS = ['Kissing', 'Show Tits', 'Blowjob', 'Cunnilingus', '69', 'Missionary', 'Cowgirl', 'Doggy', 'Spooning', 'Standing', 'Ondesk', 'Full Nelson', 'Lap Sex', 'Standing doggy'];
  const FX_SEX = [[['a', 'Ahh… evet, böyle 🥵']], [['b', 'Çok güzelsin böyle']], [['a', 'Durma… sakın durma']], [['b', '{a}… beni deli ediyorsun']], [['a', 'Daha sert… lütfen']], [['a', 'Hissediyor musun? Tamamen seninim']],
    [['b', 'Sesini bastırma… kimse duymaz. Belki duyar 😏']], [['a', 'Ahhh {b}!']], [['b', 'Bana bak… gözlerini kapatma']], [['a', 'Bacaklarım titriyor…']], [['b', 'Biraz daha… dayan']], [['a', 'Ölüyorum… ahhh']]];
  // 💗 onun orgazmı (ortadaki pozisyondan sonra) ve 💦 boşalma: son pozisyona göre nereye; ardından miktar kartı
  const FX_ORG = [[['a', 'Geliyorum… ahhhh 💗'], ['sys', 'Bacakları titredi; orgazmı dalga dalga geldi.']], [['a', 'Durma… durma… ahhhh! 💦'], ['b', 'Hissediyorum… beni sıkıyorsun']],
    [['sys', 'Islaklığı çarşafa yayıldı, nefesi kesildi.'], ['a', 'Ne yaptın bana…']]];
  const FX_FIN = {
    inside: { ev: 'Vaginal Creampie', rows: [[['b', 'Geliyorum {a}… içine mi?'], ['a', 'İçime… hepsini istiyorum 🥵'], ['sys', 'Derinlere boşaldı; ikisi de titreyerek durdu.']],
      [['a', 'Çıkarma! İçimde bitir…'], ['b', 'Ahhh… 💦'], ['sys', 'Sıcaklığı içine yayıldı.']]] },
    pull: { ev: 'Leg Cumshot', rows: [[['a', 'Dışarı! Dışarı boşal…'], ['b', 'Ahhh… 💦'], ['sys', 'Son anda çıktı; bacaklarına boşaldı.']]] },
    tits: { ev: 'Tit Cumshot', rows: [[['a', 'Göğüslerime… hadi 😈'], ['b', 'Ahhh {a}…'], ['sys', 'Göğüslerine boşaldı; o gülümseyerek parmağını gezdirdi.']]] },
    face: { ev: 'Face Cumming', rows: [[['a', 'Yüzüme… istiyorum 😈'], ['b', 'Ahhh {a}!'], ['sys', 'Yüzüne boşaldı; o dudaklarını yaladı.']]] },
    oral: { ev: 'Oral Creampie', rows: [[['b', 'Geliyorum…'], ['a', 'Ağzıma… 😋'], ['sys', 'Ağzına boşaldı; son damlasına kadar yuttu.']]] },
    ass: { ev: 'Ass Cumshot', rows: [[['b', 'Kalçana…'], ['a', 'Evet! 🍑'], ['sys', 'Kalçasına boşaldı; sıcaklığı sırtına kadar aktı.']]] }
  };
  const FX_AMT = ['Normal Cumming', 'Thick White Cumming', 'Thick White Cumming', 'High Sperm Cumming', 'Watery Cumming', 'Low-volume Cumming'];
  const FX_CUM = new Set(['Orgazm', ...Object.values(FX_FIN).map(f => f.ev), ...FX_AMT]);
  const FX_AFTER = [[['a', 'Bu… inanılmazdı'], ['b', 'Bir daha?']], [['a', 'Kimse bilmemeli'], ['b', 'Bizim sırrımız 🤫']], [['b', 'Kalmak ister misin?'], ['a', 'Sabaha kadar 😌']],
    [['sys', 'Sessizlik. Sadece saatin tik takları.'], ['a', 'Şimdi ne olacak?']], [['a', 'Biraz daha sarıl bana'], ['b', 'Bırakmam']]];
  const FX_CLIFF = [[['sys', '📱 Telefon çaldı. Ekranda "Kocam" yazıyordu.']], [['sys', '🚪 Kapı çalındı. Üç kere. Hızlı.']], [['sys', 'Pencerenin önünde bir gölge belirdi…']], [['a', 'Bir şey söylemem lazım… hamileyim.']],
    [['sys', '📱 Bilinmeyen numaradan bir mesaj: "Her şeyi biliyorum."']], [['b', 'Sana söylemediğim bir şey var… evliyim.']]];
  const FX_CONT = [[['sys', 'Önceki bölümde: o gece hiçbir şey eskisi gibi olmadı.'], ['a', 'Dünü düşünmeden duramıyorum…'], ['b', 'Ben de. Bir daha olmamalı… değil mi?'], ['a', 'Olmamalı. Ama olacak 😏']],
    [['sys', 'Önceki bölümde: sır büyüyordu.'], ['b', 'Kimseye söylemedin değil mi?'], ['a', 'Söylesem kim inanır ki?']], [['sys', 'Önceki bölümde: neredeyse yakalanıyorlardı.'], ['a', 'Az kalsın 😱'], ['b', 'Az kalsın. Bu daha heyecanlı yapıyor']],
    [['sys', 'Bir hafta sonra.'], ['a', 'Bugün seni görmeden duramadım'], ['b', 'Ben de bütün gün telefonuma baktım']]];
  const FX_EPN = ['İlk Bakış', 'Sınır', 'Gece Yarısı', 'Kilitli Kapı', 'Yakalanma', 'İtiraf', 'Sır', 'Fırtına', 'Bedel'];
  const fxState = v => { try { if (v) localStorage.setItem('amor-stories:flix', JSON.stringify(v)); const s = JSON.parse(localStorage.getItem('amor-stories:flix') || '{}') || {}; return { last: s.last || null, seen: s.seen || {}, list: s.list || [] }; } catch (e) { return { last: null, seen: {}, list: [] }; } };
  const fxEps = x => x.k === 'film' ? 1 : x.eps;
  const fxEpName = (x, i) => x.k === 'film' ? x.t : i === fxEps(x) ? 'Final' : i === 1 ? FX_EPN[0] : FX_EPN[1 + (i - 2 + +sysHash(x.id) % 3) % (FX_EPN.length - 1)];
  const fxLen = (x, i) => x.k === 'film' ? `1 sa ${20 + +sysHash('fl' + x.id) % 40} dk` : `${22 + +sysHash(`fl${x.id}${i}`) % 18} dk`;
  function fxCast(x) {
    const all = cmAll(), her = all.length ? all[+sysHash('fxc' + x.id) % all.length] : null;
    return { her, a: her ? her.name.split(' ')[0] : 'Elif', b: FX_MEN[+sysHash('fxm' + x.id) % FX_MEN.length] };
  }
  // tohumlu rastgele: aynı film / bölüm hep aynı senaryo
  const fxRnd = s => { let h = +sysHash(s) || 1; return () => { h = (h + 0x6D2B79F5) | 0; let t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  function fxScript(x, ep) {
    const r = fxRnd(x.id + ':' + ep), pk = a => a[Math.floor(r() * a.length)], sh = a => a.map(v => [r(), v]).sort((p, q) => p[0] - q[0]).map(v => v[1]);
    const T = FX_TROPE[x.tr], c = fxCast(x), film = x.k === 'film', out = [];
    const add = rows => rows.forEach(([w, t]) => out.push([w, t.replace(/\{a\}/g, c.a).replace(/\{b\}/g, c.b)]));
    add([['sys', `📍 ${x.p} · 🕰️ ${pk(['19:05', '21:40', '22:00', '23:15', '00:30', '02:10'])}`]]);
    add(ep === 1 ? pk(T.open) : pk(FX_CONT));
    if (ep > 1 && r() < .6) add(pk(T.open).slice(2));
    sh(FX_FLIRT).slice(0, film ? 3 : 2).forEach(add);
    add(pk(T.twist));
    sh(FX_ESC).slice(0, 2).forEach(add);
    const evs = sh(FX_EVS.filter(t => t !== 'Kissing')).slice(0, film ? 5 : 3), sex = sh(FX_SEX);
    ['Kissing', ...evs].forEach((t, i) => {
      out.push(['ev', t]); add(sex[i % sex.length]);
      if (i === 2) { out.push(['ev', 'Orgazm']); add(pk(FX_ORG)); }
    });
    const last = evs[evs.length - 1], kind = ['Blowjob', '69'].includes(last) ? pk(['oral', 'face'])
      : /doggy/i.test(last) ? pk(['inside', 'ass', 'pull']) : pk(['inside', 'inside', 'pull', 'tits', 'face']);
    const fin = FX_FIN[kind], rows = pk(fin.rows);
    add([['sys', pk(['Sonuna geldiler.', 'Nefesleri hızlandı; artık dayanamıyordu.', 'Son hamleler…'])]]);
    add(rows.slice(0, 2));
    out.push(['ev', fin.ev]); out.push(['ev', pk(FX_AMT)]);
    add(rows.slice(2));
    add(pk(FX_AFTER));
    if (ep < fxEps(x)) add(pk(FX_CLIFF)); else out.push(['sys', '✨ Son']);
    return out;
  }
  const fxPoster = (x, cls = '') => { const c = fxCast(x), st = fxState(), seen = (st.seen[x.id] || []).length; return `<a class="fx-po ${cls}" href="#/flix/${x.id}" style="--mtbg:${esc(c.her ? grad(c.her) : 'linear-gradient(135deg,#e50914,#300)')}">
      ${c.her && c.her.photo ? `<img src="${esc(c.her.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span class="fx-pt">${esc(x.t)}</span>
      ${x.k === 'dizi' ? '<em class="fx-tag">DİZİ</em>' : ''}${seen && seen < fxEps(x) ? `<i class="fx-pb" style="--w:${seen / fxEps(x) * 100}%"></i>` : ''}</a>`; };
  const fxRow = (title, list, cls) => list.length ? `<section class="fx-row"><h3>${title}</h3><div class="fx-scroll">${list.map((x, i) => cls === 'top' ? `<span class="fx-top"><b>${i + 1}</b>${fxPoster(x)}</span>` : fxPoster(x)).join('')}</div></section>` : '';
  const fxBar = back => `<div class="fx-bar"><a class="cm-back" href="${back}" aria-label="Geri">${ICON.arrowLeft}</a><a class="fx-logo" href="#/flix">CARMENFLIX</a><span></span>${ctxHelp('cm-back')}</div>`;
  function renderFlix(id, ep) {
    clearTimeout(ui.fxT);
    const x = id && FX_TITLES.find(t => t.id === id);
    if (x && ep != null) return renderFlixPlay(x, Math.max(1, Math.min(fxEps(x), +ep || 1)));
    if (x) return renderFlixTitle(x);
    const st = fxState(), day = Math.floor(Date.now() / 864e5), hero = FX_TITLES[day % FX_TITLES.length], hc = fxCast(hero);
    const cont = [st.last && FX_TITLES.find(t => t.id === st.last.id), ...FX_TITLES.filter(t => (st.seen[t.id] || []).length && (st.seen[t.id] || []).length < fxEps(t))].filter((t, i, a) => t && a.indexOf(t) === i);
    const top = [...FX_TITLES].sort((a, b) => +sysHash('top' + day + a.id) - +sysHash('top' + day + b.id)).slice(0, 10);
    view.innerHTML = `<div class="fx-site">${fxBar('#/internet')}
      <div class="fx-hero" style="--mtbg:${esc(hc.her ? grad(hc.her) : '#300')}">${hc.her && hc.her.photo ? `<img src="${esc(hc.her.photo)}" alt="" onerror="this.remove()">` : ''}
        <div class="fx-ht"><small>${hero.k === 'dizi' ? '🎞️ DİZİ' : '🎬 FİLM'} · ${hero.g.map(g => FX_GENRE[g]).join(' · ')}</small><h1>${esc(hero.t)}</h1><p>${esc(hero.tag)}</p>
          <div class="fx-acts"><a class="fx-play" href="#/flix/${hero.id}/${st.last && st.last.id === hero.id ? st.last.ep : 1}">▶ Oynat</a><a class="fx-info" href="#/flix/${hero.id}">ℹ️ Daha fazla bilgi</a></div></div></div>
      ${fxRow('▶️ İzlemeye devam et', cont)}
      ${fxRow('➕ Listem', st.list.map(i => FX_TITLES.find(t => t.id === i)).filter(Boolean))}
      ${fxRow('🔥 Bugün Top 10', top, 'top')}
      ${fxRow('🎞️ Diziler', FX_TITLES.filter(t => t.k === 'dizi'))}
      ${fxRow('🎬 Filmler', FX_TITLES.filter(t => t.k === 'film'))}
      ${Object.entries(FX_GENRE).map(([g, l]) => fxRow(l, FX_TITLES.filter(t => t.g.includes(g)))).join('')}
      <footer class="cm-foot">© CarmenFlix · Bütün yapımlar kurgusaldır, 18+</footer></div>`;
  }
  function renderFlixTitle(x) {
    const c = fxCast(x), st = fxState(), seen = st.seen[x.id] || [], n = fxEps(x), next = st.last && st.last.id === x.id ? st.last.ep : (seen.length && seen.length < n ? Math.max(...seen) + 1 : 1), inList = st.list.includes(x.id);
    view.innerHTML = `<div class="fx-site">${fxBar('#/flix')}
      <div class="fx-hero fx-det" style="--mtbg:${esc(c.her ? grad(c.her) : '#300')}">${c.her && c.her.photo ? `<img src="${esc(c.her.photo)}" alt="" onerror="this.remove()">` : ''}
        <div class="fx-ht"><h1>${esc(x.t)}</h1><div class="fx-meta"><b>%${90 + +sysHash('m' + x.id) % 10} eşleşme</b><span>2026</span><em>18+</em><span>${x.k === 'film' ? fxLen(x, 1) : `${n} bölüm`}</span><em>HD</em></div></div></div>
      <div class="fx-body">
        <div class="fx-acts"><a class="fx-play" href="#/flix/${x.id}/${next}">▶ ${seen.length ? 'Devam et' : 'Oynat'}${x.k === 'dizi' ? ` · B${next}` : ''}</a>
          <button type="button" class="fx-info" id="fxList">${inList ? '✓ Listemde' : '➕ Listem'}</button>${c.her ? '<button type="button" class="fx-info" id="fxRole">💬 Rolü oyna</button>' : ''}</div>
        <p class="fx-desc">${esc(x.desc)}</p>
        <p class="fx-cast"><small>Başrol:</small> ${esc(c.her ? c.her.name : c.a)}, ${esc(c.b)} · <small>Tür:</small> ${x.g.map(g => FX_GENRE[g]).join(', ')} · <small>Mekan:</small> ${esc(x.p)}</p>
        ${x.k === 'dizi' ? `<h3>Bölümler</h3><div class="fx-eps">${Array.from({ length: n }, (_, i) => i + 1).map(i => `<a class="fx-ep${seen.includes(i) ? ' seen' : ''}" href="#/flix/${x.id}/${i}">
          <b>${i}</b><span><strong>${esc(fxEpName(x, i))}</strong><small>${fxLen(x, i)}${seen.includes(i) ? ' · ✓ izlendi' : ''}</small><small>${esc((fxScript(x, i).find(l => l[0] === 'a' || l[0] === 'b') || [, ''])[1])}</small></span><i>▶</i></a>`).join('')}</div>` : ''}
        <h3>Benzer içerikler</h3><div class="fx-scroll">${FX_TITLES.filter(t => t !== x && t.g.some(g => x.g.includes(g))).slice(0, 8).map(t => fxPoster(t)).join('')}</div>
      </div><footer class="cm-foot">© CarmenFlix · Bütün yapımlar kurgusaldır, 18+</footer></div>`;
    $('#fxList').onclick = () => { const s = fxState(); s.list = inList ? s.list.filter(i => i !== x.id) : [x.id, ...s.list]; fxState(s); renderFlixTitle(x); };
    const role = $('#fxRole');
    if (role) role.onclick = () => cmChat(c.her, x.t, `${x.tag} 😏 Bu gece "${x.t}" bizim hikayemiz olsun mu?`, true);
  }
  function renderFlixPlay(x, ep) {
    const c = fxCast(x), lines = fxScript(x, ep), n = fxEps(x), P = ui.fxP = { i: 0, speed: ui.fxSpeed || 1, paused: false };
    const st = fxState(); st.last = { id: x.id, ep }; fxState(st);
    view.innerHTML = `<div class="fx-site fx-player">${fxBar('#/flix/' + x.id)}
      <div class="fx-ph"><span class="fx-pa">${c.her ? avatar(c.her, 40) : '🎬'}</span><div><b>${esc(x.t)}</b><small>${x.k === 'dizi' ? `B${ep} · ${esc(fxEpName(x, ep))}` : esc(x.tag)}</small></div></div>
      <div class="fx-chat" id="fxChat"></div>
      <div class="fx-end" id="fxEnd" hidden></div>
      <div class="fx-ctl"><div class="fx-prog"><i id="fxProg"></i></div>
        <div class="fx-btns"><button type="button" data-fx="restart" aria-label="Baştan">⏮</button><button type="button" data-fx="pause" id="fxPause" aria-label="Duraklat">⏸</button>
          <button type="button" data-fx="speed" id="fxSpd">${P.speed}x</button><button type="button" data-fx="all" aria-label="Hepsini göster">⏭</button></div></div></div>`;
    const box = $('#fxChat');
    const bubble = ([w, t]) => w === 'sys' ? `<div class="fx-sys">${esc(t)}</div>` : w === 'ev' ? (() => { const e = evFind(t), cum = FX_CUM.has(t); return `<div class="fx-ev${cum ? ' cum' : ''}">${e && e.emojis ? evEmo(e) : `${cum ? (t === 'Orgazm' ? '💗' : '💦') : '📜'} `}${esc(e ? e.title : t)}</div>`; })()
      : `<div class="fx-b ${w}">${w === 'a' ? `<small>${esc(c.a)}</small>` : `<small>${esc(c.b)}</small>`}${esc(t)}</div>`;
    const prog = () => { const p = $('#fxProg'); if (p) p.style.width = (P.i / lines.length * 100) + '%'; };
    const end = () => {
      const s = fxState(); s.seen[x.id] = [...new Set([...(s.seen[x.id] || []), ep])]; if (ep < n) s.last = { id: x.id, ep: ep + 1 }; else s.last = null; fxState(s);
      const e = $('#fxEnd'); if (!e) return;
      e.hidden = false;
      if (ep < n) {
        let k = 6;
        e.innerHTML = `<b>Sonraki bölüm</b><span>B${ep + 1} · ${esc(fxEpName(x, ep + 1))}</span><a class="fx-play" href="#/flix/${x.id}/${ep + 1}">▶ Oynat <i id="fxCd">${k}</i></a><button type="button" class="fx-info" id="fxStop">İptal</button>`;
        const tick = () => { if (!$('#fxCd')) return; if (--k <= 0) { location.hash = `#/flix/${x.id}/${ep + 1}`; return; } $('#fxCd').textContent = k; ui.fxT = setTimeout(tick, 1000); };
        ui.fxT = setTimeout(tick, 1000);
        $('#fxStop').onclick = () => { clearTimeout(ui.fxT); $('#fxCd') && $('#fxCd').remove(); $('#fxStop').remove(); };
      } else e.innerHTML = `<b>✨ ${esc(x.t)} bitti</b><span>Beğendin mi?</span><a class="fx-play" href="#/flix">Ana sayfa</a>${c.her ? '<button type="button" class="fx-info" id="fxRole2">💬 Rolü oyna</button>' : ''}`;
      const r2 = $('#fxRole2'); if (r2) r2.onclick = () => cmChat(c.her, x.t, `${x.tag} 😏 Bu gece "${x.t}" bizim hikayemiz olsun mu?`, true);
    };
    const step = () => {
      if (!$('#fxChat') || P.paused) return;
      if (P.i >= lines.length) return end();
      const l = lines[P.i], typing = l[0] === 'a' || l[0] === 'b';
      const show = () => {
        if (!$('#fxChat') || P.paused) return;
        box.querySelector('.fx-typing') && box.querySelector('.fx-typing').remove();
        box.insertAdjacentHTML('beforeend', bubble(l));
        P.i++; prog();
        box.scrollTop = box.scrollHeight;
        ui.fxT = setTimeout(step, (l[0] === 'ev' ? 1400 : 700 + Math.min(1600, l[1].length * 22)) / P.speed);
      };
      if (typing) { box.insertAdjacentHTML('beforeend', `<div class="fx-b ${l[0]} fx-typing"><span></span><span></span><span></span></div>`); box.scrollTop = box.scrollHeight; ui.fxT = setTimeout(show, 650 / P.speed); }
      else show();
    };
    view.querySelector('.fx-btns').onclick = e => {
      const b = e.target.closest('[data-fx]');
      if (!b) return;
      const a = b.dataset.fx;
      clearTimeout(ui.fxT);
      box.querySelector('.fx-typing') && box.querySelector('.fx-typing').remove();
      if (a === 'pause') { P.paused = !P.paused; $('#fxPause').textContent = P.paused ? '▶' : '⏸'; if (!P.paused) step(); return; }
      if (a === 'speed') { P.speed = ui.fxSpeed = P.speed >= 3 ? 1 : P.speed + 1; $('#fxSpd').textContent = P.speed + 'x'; }
      if (a === 'restart') { P.i = 0; box.innerHTML = ''; $('#fxEnd').hidden = true; P.paused = false; $('#fxPause').textContent = '⏸'; }
      if (a === 'all') { box.insertAdjacentHTML('beforeend', lines.slice(P.i).map(bubble).join('')); P.i = lines.length; prog(); box.scrollTop = box.scrollHeight; return end(); }
      if (!P.paused) step();
    };
    ui.fxT = setTimeout(step, 500);
  }

  /* 🎥 CarmenLive (#/canli, #/canli/<id>): canlı yayın; 💸 bahşiş menüsü olay tetikler (Show Tits, kostüm, oyuncak…), 🎯 hedef çubuğu,
   * 🔒 özel yayın = sohbet. Bahşiş ❤️ Aşk / 🔥 Şehvet artırır. Yayın durumu ui.live (sayfa açıkken) */
  const TIP_MENU = [
    { amt: 50, t: '👋 Selam ver', say: ['Teşekkürler canım 😘', 'Hoş geldin bebeğim 💋'] },
    { amt: 100, t: '💃 Dans et', say: ['Senin için dans ediyorum 💃', 'Bu şarkı senin için 🎶'] },
    { amt: 200, t: '🍒 Göğüslerini göster', ev: 'show tits', say: ['Sadece senin için… 🙈', 'Beğendin mi? 😈'] },
    { amt: 250, t: '🍑 Kalçanı göster', ev: 'show ass', say: ['Dönüyorum… yavaşça 😏', 'Böyle mi? 🍑'] },
    { amt: 400, t: '👗 Kostüm değiştir', cos: true, say: ['Hemen geliyorum… 😏', 'Bunu sen seçtin 😈'] },
    { amt: 600, t: '🍆 Oyuncakla oyna', ev: 'sex toys', say: ['Oyuncağımı aldım… izle 🥵', 'Bunu sen istedin 😈'] },
    { amt: 1000, t: '🔒 Özel yayın', priv: true, say: ['Özel odaya geçiyoruz 😈'] }
  ];
  const LV_CHAT = ['çok güzelsin 😍', 'selam güzellik 👋', 'dans etsene 💃', '🔥🔥🔥', 'biraz dön bakalım', 'sesini duyalım', 'kostüm giy!', 'hedefe az kaldı 💸', 'bu akşam harikasın', 'özel yayın ne zaman? 😏', '😍😍', 'gülüşün 💘', 'nerelisin?', 'bir şarkı söyle 🎤', 'ilk kez izliyorum, bayıldım'];
  const LV_GOAL = 2000;
  function renderLive(id) {
    clearInterval(ui.liveT);
    const c = id && cmFind(id);
    if (c) return renderLivePage(c);
    const list = cmAll().filter(cmOnline);
    view.innerHTML = wsPage('live', 'Carmen<i>Live</i>', 'carmenlive.com', '#/internet', `
      <div class="ws-hero"><h1>🔴 Şu an canlı</h1><p>${list.length} yayın · bahşiş gönder, istediğini yaptır</p></div>
      <div class="lv-grid">${list.map((c, i) => `<a class="lv-card" href="#/canli/${c.id}" style="--i:${Math.min(i, 20)};--mtbg:${esc(grad(c))}">
        ${c.photo ? `<img src="${esc(c.photo)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<em class="lv-on">🔴 CANLI</em><em class="lv-v">👁 ${120 + cmNum(c, 'vw', 2400)}</em>
        <span><b>${esc(c.name.split(' ')[0])}</b><small>${esc(cmPick(c, 'lt', ['Sohbet & dans 💃', 'Yeni kostüm gecesi 🐰', 'Duştan sonra 💦', 'Sorularınızı cevaplıyorum 💬', 'Hedefe ulaşınca sürpriz 🎁', 'Uykum yok, eşlik et 🌙']))}</small></span></a>`).join('')}</div>`);
  }
  function renderLivePage(c) {
    const L = ui.live && ui.live.id === c.id ? ui.live : (ui.live = { id: c.id, lines: [], tips: 0, view: 120 + cmNum(c, 'vw', 2400), pic: 0, cos: '' });
    const pics = [c.photo, ...(c.album || [])].filter((u, i, a) => u && a.indexOf(u) === i), first = c.name.split(' ')[0];
    const line = l => `<p class="lv-l${l.me ? ' me' : l.her ? ' her' : ''}"><b>${esc(l.who)}</b> ${esc(l.t)}</p>`;
    view.innerHTML = wsPage('live', 'Carmen<i>Live</i>', 'carmenlive.com/' + first.toLocaleLowerCase('tr'), '#/canli', `
      <div class="lv-stage" style="--mtbg:${esc(grad(c))}">${pics.length ? `<img id="lvPic" src="${esc(pics[L.pic % pics.length])}" alt="">` : ''}
        <em class="lv-on">🔴 CANLI</em><em class="lv-v" id="lvView">👁 ${L.view}</em>${L.cos ? `<em class="lv-cos">👗 ${esc(L.cos)}</em>` : ''}<div class="lv-fx" id="lvFx"></div>
        <div class="lv-name">${avatar(c, 36)}<b>${esc(first)}</b></div></div>
      <div class="lv-goal"><small>🎯 Hedef: ${cmTl(LV_GOAL)} → 🎁 sürpriz</small><div class="kl-bar"><i id="lvGoal" style="--w:${Math.min(100, L.tips / LV_GOAL * 100)}%"></i></div></div>
      <div class="lv-tips">${TIP_MENU.map((m, i) => `<button type="button" data-tip="${i}"><b>${m.amt} ₺</b><small>${m.t}</small></button>`).join('')}</div>
      <div class="lv-chat" id="lvChat">${L.lines.map(line).join('')}</div>`);
    const chat = $('#lvChat');
    const add = l => { L.lines.push(l); L.lines = L.lines.slice(-40); const el = $('#lvChat'); if (el) { el.insertAdjacentHTML('beforeend', line(l)); while (el.children.length > 40) el.firstChild.remove(); el.scrollTop = el.scrollHeight; } };
    chat.scrollTop = chat.scrollHeight;
    const fx = t => { const el = $('#lvFx'); if (!el) return; el.innerHTML = `<span>${t}</span>`; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go'); };
    ui.liveT = setInterval(() => {
      if (!$('#lvChat')) return clearInterval(ui.liveT);
      if (Math.random() < .7) add({ who: pick(CM_WHO), t: pick(LV_CHAT) });
      L.view = Math.max(50, L.view + Math.round((Math.random() - .45) * 20));
      $('#lvView').textContent = '👁 ' + L.view;
      if (pics.length > 1 && Math.random() < .25) { L.pic++; const im = $('#lvPic'); if (im) im.src = pics[L.pic % pics.length]; }
    }, 2500);
    view.querySelector('.lv-tips').onclick = e => {
      const b = e.target.closest('[data-tip]');
      if (!b) return;
      const m = TIP_MENU[+b.dataset.tip];
      L.tips += m.amt;
      add({ who: 'Sen', me: true, t: `💸 ${m.amt} ₺ bahşiş · ${m.t}` });
      sfx('match');
      if (m.amt >= 200) cmParam(c, 'aşk', 1);
      if (m.ev) { const ev = evFind(m.ev); cmParam(c, 'şehvet', 5); fx(`📜 ${ev ? `${ev.emojis || ''} ${ev.title}` : m.t}`); }
      if (m.cos) {
        const l = fnCostumes(c), x = l[(L.ci = (L.ci == null ? -1 : L.ci) + 1) % l.length];
        if (x) { c.wardrobe = [...new Set([...(c.wardrobe || []), ...Object.values(x.parts)])]; c.outfit = { ust: '', alt: '', elbise: '', sutyen: '', tanga: '', corap: '', ...x.parts }; L.cos = `${x.emoji} ${x.name}`; fx(`👗 ${L.cos}`); }
      }
      fnSaveChar(c);
      setTimeout(() => add({ who: first, her: true, t: pick(m.say) }), 700);
      const was = L.tips - m.amt;
      if (was < LV_GOAL && L.tips >= LV_GOAL) setTimeout(() => { add({ who: first, her: true, t: '🎯 Hedef tamam! Sürprizim: bu gece kostümümü sen seç 😈' }); fx('🎁 Hedef tamamlandı!'); }, 1400);
      const g = $('#lvGoal'); if (g) g.style.setProperty('--w', Math.min(100, L.tips / LV_GOAL * 100) + '%');
      if (m.cos) { const cosEl = view.querySelector('.lv-cos'); if (cosEl) cosEl.textContent = '👗 ' + L.cos; else view.querySelector('.lv-stage').insertAdjacentHTML('beforeend', `<em class="lv-cos">👗 ${esc(L.cos)}</em>`); }
      if (m.priv) setTimeout(() => { clearInterval(ui.liveT); cmChat(c, 'CarmenLive', 'Özel yayına hoş geldin 😈 sadece ikimiz kaldık… ne yapmamı istersin?', true); }, 1200);
    };
  }
  /* 💁 Yardımcı karakter (Lia): sol altta kartının ucu görünür; dokununca bulunduğun sayfanın kurallarını adım adım anlatır.
   * Sohbette ucu görünmez, ⋯ Diğer → 💁 Yardım ile açılır. Küçültme bu tarayıcıda hatırlanır */
  const HELPER = { name: 'Lia', role: 'Yardımcın' };
  const HELP = {
    home: ['Merhaba! Ben Lia 💁‍♀️ Burada yapay zeka yok: hikayeyi sen yazarsın, iki tarafı da.', '💘 <b>Eşleş</b> kartı eşleşme sayfasını açar: rastgele kızları sağa kaydır (💘) → kaydedilir ve sohbet açılır, sola kaydır (✕) → sıradaki.', '💬 <b>Chat</b> sohbetlerin, 🎬 <b>Monia</b> hikayelerin, ✨ <b>Oluştur</b> kendi karakterini yapman için.', '🌐 <b>İnternet</b> kartında dokuz site var: ilanlar, abonelik, dizi-film, otel, canlı yayın, mağaza, iş, klinik, itiraf.', 'Sağ üstteki 🎲 kartların fotoğraflarını değiştirir.'],
    messages: ['Üstteki yuvarlak avatarlardan birine dokun: son sohbetine gider, yoksa yenisini açar.', 'Bir sohbete <b>basılı tut</b>: sabitle (en fazla 4), adını değiştir ya da sil.', '👥 <b>Yeni grup</b> ile birden çok karakterle aynı sohbeti yazabilirsin.'],
    chat: ['Alttaki avatara dokunarak <b>kimin yazdığını</b> seç: sen sağda, karakter solda. ⇄ Sırayla açıksa taraf her mesajdan sonra değişir.', '<b>#</b> yazınca olaylar çıkar (ör. <b>#cowg</b> → Enter). Olay senin mesajın olur, 🎲 sonucu karakterden gelir.', 'Sonuçlar 📊 parametreleri ve 🔘 durumları değiştirir. Üstteki 📊 kart ve sağ üstteki 🙋 barlar anlık gösterir.', 'Bir mesaja dokunarak düzenle, tepki ver ya da cevapla. ↶ son değişikliği geri alır.', '🤖 Bot modu açıksa karakter bot kurallarına göre cevap verir; kuralın 🎲 sonucu da uygulanır.', '💁‍♀️ Altta ben de varım: sıradaki adımı ve tetiklenen olaylara göre öneriler veririm. Bir öneriye dokun, olay yazılsın. ✕ ya da ⋯ Diğer → <b>Lia önerileri</b> ile kapat / aç.'],
    create: ['🎲 <b>Hepsi</b> rastgele bir karakter kurar; her bölümün kendi 🎲 düğmesi de var.', '📏 <b>Kurallar</b>: bir özellik varken olamayacakları belirler (ör. Virgo → Loose olamaz). Kurala aykırı seçenek soluk görünür ve seçilemez.', '❤️ Sevdiği / 💔 sevmediği olaylar sadece <b>event</b> etiketli kategorilerden seçilir.', '🧩 Ek özellikler: Hamile, Bakire gibi aç/kapa durumlar burada; sohbetteki olaylar bunları değiştirebilir.'],
    hikayeler: ['🎲 <b>Senaryo üret</b> zaman, mekan ve olaylardan hazır bir hikaye kurar.', '▶️ <b>Başlat</b> yeni bir sohbet açar; olaylar sohbette sırayla 📜 kart olarak gelir.', 'Oynanan hikayelerde 💬 <b>Devam et</b> kaldığın yere götürür.'],
    monia: ['Monia Paneli olayların ve senaryoların merkezi. Olaylar kategorilerde durur.', 'Bir olaya dokununca editörü açılır: renk, emoji, 🪜 alt dereceler, 🎲 sonuçlar, ⚡ olunca etkileri.', 'Kategoriye <b>event</b> etiketi verirsen sohbette üstte çıkar ve sevdiği / sevmediği listelerinde seçilir. <b>if</b> etiketi şart seçiminde üstte çıkar.', '<b>event</b> etiketli bir kategoriden olay olunca karakterin 🔘 Bakire durumu Hayır olur.'],
    olay: ['🎲 Sonuçların yüzdesi toplam %100\'ü geçmesin; eksik kalan kısım "sonuç yok" demek.', '🔒 Şart tutmazsa sonuç engellenir; ⭐ varsayılan sonuç o zaman devreye girer.', '↪ Sonraki olay seçersen o sonuç çıkınca seçtiğin olay hemen ardından gelir.', '⧉ çoğaltır, 📋 kopyalar; kopyaladığını başka olaya 📥 yapıştırırsın.'],
    sonuc: ['🎲 Her olayın sonucu yüzdelere göre seçilir; toplam %100\'den azsa kalanı "sonuç yok".', '📈 Sonuç parametreyi artırır / azaltır, 🔘 durumu Evet / Hayır yapar. Metne <b>{+Aşk}</b> gibi özel kelime de yazabilirsin.', '🔒 Şart tutmazsa sonuç engellenir; ⭐ varsayılan sonuç devreye girer.', '⚡ Eşik olayları: bir değer sınırı geçince olay kendiliğinden gelir.', '🙋 "Ben" parametreleri (ör. Zevk) sende tutulur ve sohbette sağ üstte bar olarak görünür.', '🔗 Ortak sonuç: birden çok olay aynı sonuçları paylaşır. 🤖 Bot kuralları da sonuç üretebilir.', 'Değişiklikler 💾 <b>Kaydet</b>\'e basınca geçerli olur.'],
    gruplar: ['🧺 Grup birden çok olayı bir arada tutar; olay seçerken grubu seçince içindekilerin hepsi gelir.'],
    kategoriler: ['Adını, simgesini, ▲▼ sırasını ve 🏷️ etiketlerini değiştir. Kategoriler ilk etiketlerine göre gruplanır.', '<b>event</b>: sohbette üstte + sevdiği / sevmediği. <b>if</b>: şartlarda üstte. Küçük harfle yaz!'],
    kurallar: ['Her kural: "Eğer şu varsa → şunlar olamaz". Tüm karakterler için geçerlidir.', '"Eğer"e birden çok şart ekle. Aradaki <b>ve</b>\'ye dokununca <b>veya</b> olur: "ve"ler birlikte tutmalı, "veya" ile ayrılanlardan biri yeter (ör. Virgo ve Hamile <b>veya</b> Bakire).', '🧺 Küme: <b>✅ Diğer tüm izinler</b> = şartta olmayan bütün izinler olamaz (ör. ✅ Nothing ise başka hiçbir şeye izin vermez).', 'Olaylar da kurala girer: <b>✅ X</b> olamaz = X\'e izin veremez (izin vermediklerine geçer), <b>🚫 X</b> olamaz = X\'i reddedemez.', 'Kurala uymayan karakterler kartta ⚠️ ile görünür; ✅/🚫 izinler kendiliğinden düzelir, özellikleri düzeltmek sana kalmış.'],
    bot: ['Bot kuralları bir kelime geçince karakterin ne cevap vereceğini belirler.', 'Bir kuralın 🎲 sonucunu Sebep-Sonuç → 🤖 kartından eklersin.', 'Bot editörü sadece <b>yerel-duzenleme.bat</b> ile açınca çalışır.'],
    me: ['Burada adın, fotoğrafın, 🎵 müzik, ⚙️ ayarlar ve 💾 yedek var.', '💾 Veri → <b>Yedekle</b> ile her şeyi dosyaya alırsın. Sistem kaydı yerel düzenlemede eklediklerini dosyaya yazar.', '⚙️ Ayarlar → 📏 Oluştur kuralları paneline buradan da gidebilirsin.', '⚙️ Ayarlar → 🌙 <b>Tema</b>: Açık, Koyu ya da telefonunun temasına uyan Sistem.'],
    p: ['Profilde karakterin sohbetleri, albümü ve 🔘 durumları var. ✏️ ile düzenlersin.'],
    internet: ['🌐 Dokuz site var; hepsi senin karakterlerine bağlı.', 'Bir ilan kızına mesaj atınca, rezervasyon ya da sipariş yapınca karakterlerine eklenir.', 'Sağ üstteki ❓ her sitenin kitap bölümünü açar.'],
    carmen: ['🌹 İlanlarda kondom şartı, seanslar ve yorumlar var.', '👑 VIP ilanlar 2,5 kat pahalı. 💬 Mesaj at sohbeti açar.'],
    fans: ['🫦 Abone olunca kilitli gönderiler açılır.', '📢 Haftanın kostümü: aboneysen "Bu kostümle yaz" giydirip sohbeti açar. 📸 Foto setleri gardıroba girer.'],
    otel: ['🏨 Mekan, saat ve süre seç: sohbet 📍 mekan kartı ve 🕰️ o saatle başlar.'],
    canli: ['🎥 Bahşiş tutarına göre dans, Show, kostüm, oyuncak; 1000 ₺ özel yayın sohbeti açar.', '200 ₺ ve üstü ❤️ Aşk +1.'],
    shop: ['🛍️ Sepete ekle, kime gideceğini seç. Kargo gelince sohbette "Paketin geldi, açayım mı? 😏"', 'Oyuncaklar ⚡ kısayola olay olur, giyim gardıroba girer.'],
    is: ['💼 Başvurunca mülakat sohbeti açılır; rol olayı ⚡ kısayolda, karakter rolün kıyafetini giyer.'],
    klinik: ['🩺 Döngü takvimi ve hamilelik haftası; zaman 🕰️ sohbet saatiyle ilerler.'],
    flix: ['🍿 Bir film ya da dizi seç, ▶ Oynat: hikaye yazışma olarak sırayla akar.', '⏸ duraklat, 1x/2x/3x hız, ⏭ hepsini göster. Dizide bölüm bitince sonraki kendiliğinden başlar.', '💬 Rolü oyna: başroldeki kızla o hikayeyi sohbette yaşarsın.'],
    itiraf: ['🎭 İsimsiz itiraflar; her açılışta sıra karışık. 🎲 Karıştır ile yeniden.', 'Kadın / erkek, uzun / kısa diye süz; 🔥😂😳 ile tepki ver.']
  };
  // her sayfanın kitaptaki bölümü (Lia "📖 Kitapta oku" ile oraya götürür)
  const HELP_BOOK = { home: 'Sohbetin temelleri', messages: 'Sohbetin temelleri', chat: 'İdeal bir seans', create: 'İzinler ve kurallar', hikayeler: 'Sohbetin temelleri',
    monia: 'Olaylar ve sonuçlar', olay: 'Olaylar ve sonuçlar', sonuc: 'Eşik olayları', gruplar: 'Ortak sonuçlar ve etiketler', kategoriler: 'Ortak sonuçlar ve etiketler',
    kurallar: 'İzinler ve kurallar', bot: 'Olaylar ve sonuçlar', me: 'Kayıt ve kurulumlar', p: 'Parametreler ve durumlar',
    internet: 'İnternet nedir?', carmen: 'Carmen.com', fans: 'CarmenFans', otel: 'CarmenStay', canli: 'CarmenLive', shop: 'CarmenShop', is: 'CarmenJobs', klinik: 'CarmenKlinik', itiraf: 'Gizli İtiraf', flix: 'CarmenFlix' };
  // bölüm adı → [kitap, bölüm] (bütün kitaplarda arar)
  const bookIdx = title => { for (const b of BOOKS) { const i = b.chapters.findIndex(c => c.title === title); if (i >= 0) return [b.id, i]; } return ['carmen', 0]; };
  // Lia'nın fotoğrafı: resim havuzundan hep aynısı
  const liaAva = () => { const pool = homePool(), pic = pool.length ? pool[+sysHash('helper-lia') % pool.length] : ''; return pic ? `<img src="${esc(pic)}" alt="">` : '💁‍♀️'; };
  // 💁‍♀️ sohbette Lia önerileri (açık / kapalı, bu tarayıcıda)
  const modeMusicOn = v => { try { if (v != null) localStorage.setItem('amor-stories:modemusic', v ? '1' : '0'); return localStorage.getItem('amor-stories:modemusic') !== '0'; } catch (e) { return true; } };
  const quickOn = v => { try { if (v != null) localStorage.setItem('amor-stories:quick', v ? '1' : '0'); return localStorage.getItem('amor-stories:quick') !== '0'; } catch (e) { return true; } };
  const scoreOn = v => { try { if (v != null) localStorage.setItem('amor-stories:botscore', v ? '1' : '0'); return localStorage.getItem('amor-stories:botscore') === '1'; } catch (e) { return false; } };
  // 🌙 tema: light | dark | auto (sistem). index.html başındaki betik açılışta uygular; burada değişince ve sistem teması değişince
  const themePref = v => { try { if (v != null) localStorage.setItem('amor-stories:theme', v); return localStorage.getItem('amor-stories:theme') || 'light'; } catch (e) { return 'light'; } };
  const darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() {
    const t = themePref(), dark = t === 'dark' || (t === 'auto' && darkMQ && darkMQ.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', dark ? '#0e1120' : '#0089c4');
  }
  if (darkMQ) darkMQ.addEventListener('change', () => { if (themePref() === 'auto') applyTheme(); });
  applyTheme();
  const liaOn = v => { try { if (v != null) localStorage.setItem('amor-stories:lia', v ? '1' : '0'); return localStorage.getItem('amor-stories:lia') !== '0'; } catch (e) { return true; } };
  // 💞 ideal seansın aşamaları (kategori adlarıyla); Lia sıradaki aşamayı önerir
  const LIA_PHASES = [
    { cat: 'foreplay', icon: '💋', name: 'Isınma', say: 'Önce ısınalım: öpüşme, sarılma, yavaş yavaş.' },
    { cat: 'eat', icon: '👅', name: 'Onu ısıt', say: 'Şimdi onu ısıt; 💗 Uyarılma yükselsin, ilk orgazmı gelsin.' },
    { cat: 'outercourse', icon: '🤲', name: 'Dokunuş', say: 'Sıra sende: el, ağız, göğüs… 🥴 Zevk yavaş yavaş artsın.' },
    { cat: 'forward', icon: '❤️', name: 'Önden', say: 'Hazırsınız: önden pozisyonlar. 🛡️ Korunmayı unutma.' },
    { cat: 'backward', icon: '🍑', name: 'Arkadan', say: 'Tempoyu artır: arkadan pozisyonlar.' }
  ];
  const helpKey = () => { const r = ui.route || {}; if (r.name === 'monia') return ['sonuc', 'gruplar', 'kategoriler', 'olay'].includes(r.id) ? r.id : 'monia'; return HELP[r.name] ? r.name : 'home'; };
  const helperMin = v => { try { if (v != null) localStorage.setItem('amor-stories:helper', v ? 'min' : ''); return localStorage.getItem('amor-stories:helper') === 'min'; } catch (e) { return false; } };
  function drawHelper(open) {
    let el = document.getElementById('helper');
    if (!el) { el = document.createElement('div'); el.id = 'helper'; document.body.appendChild(el); }
    const key = helpKey(), tips = HELP[key], chap = HELP_BOOK[key] || 'Sohbetin temelleri';
    if (ui.helpKey !== key) { ui.helpKey = key; ui.helpI = 0; }
    const i = Math.min(ui.helpI || 0, tips.length - 1);
    const ava = `<span class="hp-ava">${liaAva()}</span>`;
    el.className = `helper${open ? ' open' : ''}${helperMin() ? ' min' : ''}`;
    el.dataset.route = (ui.route || {}).name || 'home';
    el.innerHTML = open ? `<div class="hp-card">
        <div class="hp-head">${ava}<div><b>${HELPER.name}</b><small>${HELPER.role} · ${i + 1}/${tips.length}</small></div><button type="button" class="hp-x" data-hp="close" aria-label="Kapat">✕</button></div>
        <div class="hp-say" style="--k:${i}">${tips[i]}</div>
        <div class="hp-nav"><button type="button" data-hp="prev"${i ? '' : ' disabled'}>‹</button>
          <span>${tips.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</span>
          <button type="button" data-hp="next">${i < tips.length - 1 ? 'Sonraki ›' : 'Tamam ✓'}</button></div>
        <button type="button" class="hp-book" data-hp="book">📖 Kitapta oku: <b>${esc(chap)}</b></button>
        <button type="button" class="hp-hide" data-hp="min">${helperMin() ? '👀 Hep göster' : '🙈 Küçült'}</button>
      </div>` : `<button type="button" class="hp-peek" data-hp="open" aria-label="Yardımcı: ${HELPER.name}">${ava}<span class="hp-bub">${helperMin() ? '?' : 'Nasıl çalışır? 💬'}</span></button>`;
    el.onclick = e => {
      const b = e.target.closest('[data-hp]');
      if (!b) return;
      const a = b.dataset.hp;
      if (a === 'open') return drawHelper(true);
      if (a === 'close') return drawHelper(false);
      if (a === 'min') { helperMin(!helperMin()); return drawHelper(false); }
      if (a === 'book') { drawHelper(false); return openBook(...bookIdx(chap)); }
      if (a === 'prev') ui.helpI = Math.max(0, i - 1);
      if (a === 'next') { if (i >= tips.length - 1) { ui.helpI = 0; return drawHelper(false); } ui.helpI = i + 1; }
      drawHelper(true);
    };
  }
  // 💘 Eşleş kartındaki karakter: destenin en üstündeki
  const meetDraft = () => matchDeck()[0];

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
      <a class="icon-btn pg-back" href="${esc(opts.back || '#/home')}" aria-label="Geri">${ICON.arrowLeft}</a>${k.startsWith('kitap') ? '' : ctxHelp('icon-btn pg-ctx')}
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
    const tabs = [['profile', 'Profil'], ['wear', '👗 Giyim'], ['diary', '📔 Günlük'], ['chats', `Sohbetler (${list.length})`], ['keys', `Kelimeler${kwN ? ` (${kwN})` : ''}`], ['album', 'Albüm']];
    const cur = list[0];

    view.innerHTML = `<div class="profile">
      <div class="cover" style="background:${grad(c)}">
        ${cover ? `<img class="cover-bg" src="${esc(cover)}" alt="" aria-hidden="true"><img class="cover-fg" src="${esc(cover)}" alt="" data-zoom="0">` : ''}
      </div>
      <a class="round-btn left" href="#/home" aria-label="Geri">${ICON.back}</a>
      ${ctxHelp('round-btn ctx-r')}
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
        <div class="p-acts"><button type="button" class="chip" id="pClone">🧬 Klonla</button><button type="button" class="chip" id="pShare">📤 Paylaş</button></div>
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
      // 👗 giydir
      const redrawWear = () => { if (ui.profileTab === 'wear') { $('#ptab').innerHTML = profileTab(c); bindTab(); } };
      $('#ptab').querySelectorAll('[data-dress]').forEach(b => b.onclick = () => {
        if (b.dataset.dress === 'rnd') { if (!(c.wardrobe || []).length) randWear(c); else c.outfit = randOutfit(c); save(); return redrawWear(); }
        dressSheet(c, redrawWear);
      });
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
    $('#pClone').onclick = () => cloneSheet(c);
    $('#pShare').onclick = () => shareChar(c);
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

  /* 📔 günlük: bu karakterle bütün sohbetlerde neler yaşandı (olaylar ve önemli anlar), günlere ayrılmış, en yenisi üstte */
  function diaryOf(c) {
    const all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr'), items = [];
    threadsOf(c).forEach(t => {
      const ms = S().chats[t.id] || [];
      if (ms[0]) items.push({ ts: ms[0].ts || t.created || 0, ic: '💬', tx: `"${t.title}" sohbeti başladı`, t });
      ms.forEach(m => {
        if (m.ev) {
          const e = all.find(x => x.id === m.ev), title = (m.evc || {}).title || (e || {}).title || 'Olay';
          const big = e && (low(e.title) === 'orgazm' || (e.tags || []).some(x => low(x) === 'boşalma'));
          items.push({ ts: m.ts, ic: (m.evc || {}).emojis || (e && e.emojis) || '📜', tx: title, big, t });
        }
        (m.oc && m.oc.changes || []).forEach(x => { if (low(x.label).endsWith('hamile') && low(x.to) === 'evet') items.push({ ts: m.ts, ic: '🤰', tx: 'Hamile kaldı', big: true, t }); });
        if (m.from === 'sys' && /👶|🤰/.test(m.text || '')) items.push({ ts: m.ts, ic: '🍼', tx: String(m.text).replace(/^\S+\s/, ''), big: true, t });
      });
    });
    items.sort((a, b) => b.ts - a.ts);
    if (!items.length) return '<div class="empty">Henüz birlikte bir şey yaşanmadı 🙈</div>';
    const days = [];
    items.slice(0, 400).forEach(x => { const d = new Date(x.ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }); const g = days[days.length - 1]; if (g && g.d === d) g.xs.push(x); else days.push({ d, xs: [x] }); });
    const n = items.filter(x => x.big).length;
    return `<p class="kw-help" style="margin-top:4px">📔 ${esc(c.name.split(' ')[0])} ile ${items.length} an${n ? ` · ${n} önemli an` : ''}${c.births ? ` · 👶 ${c.births} bebek` : ''}</p>
      <div class="diary">${days.map(g => `<div class="dy-day"><div class="dy-d">${esc(g.d)}</div>${g.xs.map(x => `<div class="dy-it${x.big ? ' big' : ''}" data-thread="${esc(x.t.id)}"><span class="dy-ic">${esc(x.ic)}</span><span class="dy-tx">${esc(x.tx)}</span><small>${new Date(x.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('')}</div>`).join('')}</div>`;
  }
  // 👗 profil: şu an üstündekiler (yuva yuva) ve genelde giydikleri; 👗 Giydir ile değiştirilir
  function wearTab(c) {
    const o = outfitOf(c), w = (c.wardrobe || []).map(clItem).filter(Boolean);
    return `<div class="wear-now">${CL.slots.map(s => { const x = clItem(o[s.id]); return `<button type="button" class="wn-slot${x ? ' on' : ''}${x && x.style === 'i' ? ' bold' : ''}" data-dress="1"><span class="wn-ic">${x ? x.emoji : s.icon}</span><small>${esc(s.label)}</small><b>${x ? esc(x.name) : '—'}</b></button>`; }).join('')}</div>
      <div class="row-btns" style="margin:10px 0"><button type="button" class="btn primary" data-dress="1">👗 Giydir</button><button type="button" class="btn ghost" data-dress="rnd">🎲 Kombin</button></div>
      <p class="kw-help">⭐ Genelde giydikleri (${w.length}): ${w.length ? w.map(x => `${x.emoji} ${esc(x.name)}`).join(' · ') : 'henüz yok, 👗 Giydir → ⭐ Gardırop'}</p>
      <p class="kw-help">Bot modunda karakter giydiklerine göre konuşur: "Gömleğimin üst düğmelerini açtım…", "Tangamı kenara çektim…"</p>`;
  }
  function profileTab(c) {
    if (ui.profileTab === 'wear') return wearTab(c);
    if (ui.profileTab === 'diary') return diaryOf(c);
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
      ${[...FEELS, ...PERMS].map(f => feelEvents(c[f.key]).length ? `<div class="sec-title">${f.icon} ${f.label}</div><div class="chips">${feelEvents(c[f.key]).map(e => `<span class="chip">${evEmo(e)}${esc(e.title)}</span>`).join('')}</div>` : '').join('')}
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

    // 🤖 bot modu varsayılan açık: hiç açılıp kapatılmamış sohbette açılır (kapattığın sohbet kapalı kalır)
    if (th.bot === undefined) th.bot = true;
    const chatHtml = `
      <div class="chat">
        <div class="chat-head">
          <a class="icon-btn" href="#/messages" aria-label="Geri">${ICON.arrowLeft}</a>
          ${head}
          ${ctxHelp()}
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
          <button type="button" class="chat-clock" id="chatClock" title="Sohbet saati" hidden></button>
          <div class="me-hud" id="meHud" hidden></div>
          <button type="button" class="undo-pill" id="undoBtn" hidden></button>
        </div>

        <div class="lia-bar" id="liaBar" hidden></div>
        <div class="mode-bar" id="modeBar" hidden></div>
        <div class="reply-bar" id="replyBar" hidden></div>
        ${group ? '<div class="spk-row" id="spkRow"></div>' : ''}
        <div class="side-hint" id="sideHint"></div>
        <div class="ev-quick" id="evQuick" hidden></div>
        <div class="ev-pend" id="evPend" hidden></div>
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
            <button type="button" data-tool="lia" class="${liaOn() ? 'on' : ''}"><span>💡</span>Lia önerileri</button>
            <button type="button" data-tool="quick" class="${quickOn() ? 'on' : ''}"><span>⚡</span>Kısayollar</button>
            ${MU ? `<button type="button" data-tool="modemusic" class="${modeMusicOn() ? 'on' : ''}"><span>🎼</span>Moda göre müzik</button>` : ''}
            <button type="button" data-tool="sfx" class="${sfxOn() ? 'on' : ''}"><span>🔔</span>Efekt sesleri</button>
            <button type="button" data-tool="chg" class="${chgOn() ? 'on' : ''}"><span>📈</span>Değer değişimleri</button>
            <button type="button" data-tool="boss"><span>🙈</span>Patron geldi</button>
            <button type="button" data-tool="score" class="${scoreOn() ? 'on' : ''}"><span>🎯</span>Bot puanları</button>
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
    const draw = target => { drawMessages(ctx, cs, target); markHits(); drawStats(); drawClock(); drawLia(); drawQuick(); idleArm(); };
    /* 💭 kendiliğinden mesaj: bot modu açıkken bir süre yazmazsan karakter yazar ("neredesin? 🥺").
     * ❤️ Aşk 70+ → 1,5 dk · 40+ → 3 dk · yoksa 5 dk; gece (sohbet saati 23–06) "uyudun mu?". Bir sessizlikte bir kez; grupta yok */
    function idleArm() {
      clearTimeout(ui.idleT);
      if (!th.bot || group || cs.playing || !c) return;
      const last = list[list.length - 1];
      if (last && last.idle) return;
      const a = relV(c, 'aşk');
      ui.idleT = setTimeout(idlePing, (a >= 70 ? 90 : a >= 40 ? 180 : 300) * 1000);
    }
    function idlePing() {
      if (location.hash !== `#/chat/${th.id}` || document.hidden || cs.playing || !th.bot) return;
      const hr = clockOn() ? Math.floor((((clockNow() % 1440) + 1440) % 1440) / 60) : new Date().getHours();
      const st = hr >= 23 || hr < 6 ? 'sessizgece' : relV(c, 'aşk') >= 70 ? 'sessizask' : 'sessiz';
      const rules = Stories.BOT_RULES || { rules: [] }, only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=' + st)) };
      const m = only.rules.length && BOT.best(only, `durum ${st}`, c);
      if (!m || m.fallback) return;
      const parts = BOT.reply(m.rule, { sen: hitapOf(c), ben: c.name.split(' ')[0] }).map(p => fillTraits(p, c, {}));
      personaParts(parts, c, false);
      parts.forEach((p, i) => list.push({ id: Store.uid(), from: 'her', text: p, ts: nowTs() + 1 + i, idle: 1 }));
      save(); draw(); refreshList();
      sfx('match');
    }

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
            ${tr.map(t => `<span class="st-tr">${esc(t)}</span>`).join('')}
            ${charFields().some(f => f.id === FERT_ID) ? (v => `<span class="st-tr st-fert">🌱 %${v} ${fertWord(v)}</span>`)((ch.fields || {})[FERT_ID] == null || (ch.fields || {})[FERT_ID] === '' ? 50 : ch.fields[FERT_ID]) : ''}
            ${(ch.fields || {}).hamile ? `<span class="st-tr st-preg">🤰 ${Math.max(1, pregWeek(ch))}. hafta</span>` : (ph => `<span class="st-tr st-cyc c-${ph}" title="Döngü günü">${CYCLE[ph].icon} ${cycleDay(ch)}. gün · ${CYCLE[ph].label}</span>`)(cyclePhase(ch))}</div>
          ${paramsOf().length ? `<div class="pv-bars">${pvBars(ch)}</div>` : ''}${feelBlock(ch)}
          <button type="button" class="st-feel st-wear" data-stwear="${esc(ch.id)}" title="Giydir">👗 ${esc(outfitItems(ch).map(x => x.name).join(' · ') || ((ch.wardrobe || []).length ? 'çıplak 🫣' : 'giydir'))}</button></div></div>`;
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
      const botTurn = th.bot && cs.side === 'me' && newId && !target && !cs.noBot;
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
    /* 📊 bot için senin durumun (🙋 parametrelerinden), öncelik sırasıyla:
     * zevkyuksek / zevkdolu / zevkbos (Zevk ≥ 70; Cum ≥ 80 / ≤ 20 ile) · cumcok (Cumming sayısı ≥ 3) · cumdolu (Cum ≥ 80 ve Zevk ≥ 20) · cumbos (Cum ≤ 20) · zevkorta (Zevk ≥ 40)
     * 🥴 Zevk = boşalma isteği, 💦 Cum = ne kadar boşalabileceği */
    // 🗣️ komut kuralının olayı (CMD_EV): varsa önce karakterin ❤️ sevdiği, 🚫 izin vermediği atlanır
    function cmdEvent(ruleId, ch) {
      const key = String(ruleId || '').replace(/_(shy|exp|sever|sevmez)$/, '').replace(/\d+$/, '');
      return pickByTitles(CMD_EV[key], ch);
    }
    // ❔ şimdi sorulabilecek bir soru konusu (BOT_ASK): bitişten sonra "tekrar", önden pozisyonda Zevk yüksekse çoğu zaman "icine"
    function askTopic(opts) {
      const low = s => String(s || '').toLocaleLowerCase('tr'), pos = posNow();
      const zp = allParams().find(x => x.who === 'me' && low(x.label) === 'zevk');
      const ctx = { cat: pos ? low(catOfEv(pos).label) : '', vaj: !!pos && (pos.tags || []).some(t => low(t) === 'vajinal'), zevk: zp ? paramVal(S().user, zp) : 0, done: !!opts.climax };
      // 💦 bitişten sonra: anal sevmiyorsa / bakireyse arkası sorulmaz
      if (ctx.done) {
        const ch = byId(chatCharIds()[0]) || {}, anal = !dislikesTag(ch, 'anal') && traitVal(ch, 'Experience') !== 'Virgo';
        const r = Math.random();
        return anal && r < .4 ? 'arkaistek' : r < .75 ? 'pozistek' : 'tekrar';
      }
      if (BOT_ASK.icine.ok(ctx) && Math.random() < .6) return 'icine';
      if (BOT_ASK.begen.ok(ctx) && Math.random() < .4) return 'begen';
      const ok = Object.keys(BOT_ASK).filter(k => !['tekrar', 'icine', 'begen', 'arkaistek', 'pozistek'].includes(k) && BOT_ASK[k].ok(ctx));
      return ok.length ? pickOne(ok) : '';
    }
    // "beğenmedim" → şu ankinden farklı bir pozisyon: önce ❤️ sevdikleri, yoksa aynı / yakın kategoriden rastgele (💔 ve 🚫 atlanır)
    function otherPosition(ch) {
      const low = s => String(s || '').toLocaleLowerCase('tr'), cur = posNow();
      const ok = e => e !== cur && SEX_CATS.includes(low(catOfEv(e).label)) && !((ch || {}).dislikes || []).includes(e.id) && !((ch || {}).denies || []).includes(e.id);
      const liked = feelEvents((ch || {}).likes || []).filter(ok);
      if (liked.length) return pickOne(liked);
      const same = cur && allEvents().filter(e => ok(e) && e.cat === cur.cat);
      return same && same.length ? pickOne(same) : pickOne(allEvents().filter(ok)) || null;
    }
    // 🛡️ korunma durumu kelimesi (korkondom · korpullout · korhap · korsabah · koricine · kordikkat)
    function korToken(ch) {
      // 🙏 ısrara razı olduysa bu tur "içime"
      if (th.izinVerdi) return 'koricine';
      const p = protOf(ch);
      return p.condom ? 'korkondom' : p.pullout ? 'korpullout' : p.pill ? 'korhap' : p.morning ? 'korsabah' : p.nothing ? 'koricine' : 'kordikkat';
    }
    // adlarıyla verilen olaylardan biri: 🚫 izin vermediği atlanır, ❤️ sevdiği öne çıkar
    function pickByTitles(titles, ch) {
      if (!(titles || []).length) return null;
      const low = s => String(s || '').toLocaleLowerCase('tr'), all = allEvents();
      const evs = titles.map(t => all.find(e => low(e.title) === low(t))).filter(Boolean).filter(e => !((ch || {}).denies || []).includes(e.id));
      const fav = evs.filter(e => ((ch || {}).likes || []).includes(e.id));
      return (fav.length ? pickOne(fav) : evs.length ? pickOne(evs) : null);
    }
    // 🎭 son Mode ile yakın zamandaki fantezilerin tonu cevaba eklenir (FLAVOR)
    function flavorParts(parts) {
      if (!parts.length) return;
      const all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr').trim(), msgs = list.filter(m => m.from !== 'sys');
      // olay en son kaç mesaj önce oldu (hiç olmadıysa Infinity)
      const ago = id => { for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].ev === id) return msgs.length - 1 - i; return Infinity; };
      const hits = FLAVOR.map(f => {
        const evs = all.filter(e => f.mode ? low(catOfEv(e).label) === 'mode' && low(e.title) === f.key : low(e.title).startsWith(f.key));
        return { f, a: Math.min(Infinity, ...evs.map(e => ago(e.id))) };
      }).filter(h => h.a !== Infinity && (h.f.mode || h.a <= 30));
      // Mode'lardan sadece en sonuncusu geçerli
      const lastMode = hits.filter(h => h.f.mode).sort((x, y) => x.a - y.a)[0];
      hits.filter(h => !h.f.mode || h === lastMode).forEach(({ f }) => {
        if (Math.random() > (f.p || .5)) return;
        // cevap zaten aynı sözle başlıyorsa (ör. "Şşş…") ön ek eklenmez
        const p = f.pre && pickOne(f.pre), w = p && p.trim().split(/[\s,…]/)[0];
        if (p && !parts[0].startsWith(w)) parts[0] = p + parts[0];
        if (f.add) parts[parts.length - 1] += pickOne(f.add);
      });
    }
    // 🛡️ karakterin korunma izinleri (✅ listesi) ve şu an takılı bir kondom var mı (olmuş, henüz harcanmamış)
    function protOf(ch) {
      const all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr').trim(), byT = t => all.find(e => low(e.title) === t);
      const ok = t => { const e = byT(t); return !!e && ((ch || {}).allows || []).includes(e.id); };
      const done = condCtx(chatCharIds()).done, on = t => { const e = byT(t); return !!e && done.has(e.id); };
      return { condom: on('condom') || on('tight condom'), pullout: ok('pull-out method'), pill: ok('control pill'), morning: ok('morning-after pill'), nothing: ok('nothing') };
    }
    /* önce: önden pozisyonda Zevk ≥ 50 ise karakterin korunmasına göre (korkondom · korpullout "dışarı boşal" · korhap "hap alırım" ·
     * korsabah · koricine · kordikkat "sakın içime"); sonra sırayla: zevkyuksek · onugeliyor (onun Uyarılma ≥ 60) · cumcok ·
     * onyorgun (bu sohbette 3+ orgazm) · cumdolu · sutdolu (hamile, Süt ≥ 70) · onazgin (Şehvet ≥ 80) · cumbos · zevkorta · ilişki · hamile.
     * 💞 ilişki (karakterin Aşk / Güven / Samimiyet / Kıskançlık): kiskanc · askyuksek · guvendusuk · askorta · samimi · guvenyuksek.
     * talk: normal sohbet mesajı (olay / komut değil) → ilişki durumu en önde */
    function botState(ch, talk) {
      const low = s => String(s || '').toLocaleLowerCase('tr').trim();
      const v = l => { const p = allParams().find(x => x.who === 'me' && low(x.label) === l); return p ? paramVal(S().user, p) : null; };
      const cv0 = l => { const p = ch && allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? paramVal(ch, p) : null; };
      const ask = cv0('aşk'), guv = cv0('güven'), sam = cv0('samimiyet'), kis = cv0('kıskançlık');
      const rel = kis != null && kis >= 60 ? 'kiskanc' : ask != null && ask >= 70 ? 'askyuksek' : guv != null && guv <= 15 ? 'guvendusuk'
        : ask != null && ask >= 40 ? 'askorta' : sam != null && sam >= 60 ? 'samimi' : guv != null && guv >= 70 ? 'guvenyuksek' : '';
      // 🕰️ sohbet saati: gece (22–04) · sabah (05–10) · akşam (18–21); sevişirken 01–05 arası "uykum geldi"
      const hr = clockOn() ? Math.floor((((clockNow() % 1440) + 1440) % 1440) / 60) : -1;
      const tm = hr < 0 ? '' : hr >= 22 || hr <= 4 ? 'saatgece' : hr <= 10 ? 'saatsabah' : hr >= 18 ? 'saataksam' : '';
      if (talk && rel) return rel;
      if (talk && tm) return tm;
      const z = v('zevk'), cum = v('cum'), n = v('cumming sayısı');
      const pos = posNow(), vaj = pos && (pos.tags || []).some(t => low(t) === 'vajinal');
      // 🩸 riskli günde önden pozisyonda (hap ya da kondom yoksa) bazen uyarır
      if (ch && vaj && z != null && z >= 30 && !(ch.fields || {}).hamile && cyclePhase(ch) === 'riskli' && Math.random() < .35) { const p = protOf(ch); if (!p.pill && !p.condom) return 'riskligun'; }
      // 🛡️ önden pozisyonda korunmasına göre: içine istemeyen (Pull-Out, sabah hapı, korunmasız) Zevk 30 / 55 / 75'te giderek ısrarcı ("korpullout1…3")
      if (ch && z != null && vaj && !(ch.fields || {}).hamile) {
        const k = korToken(ch);
        if (['korpullout', 'korsabah', 'kordikkat'].includes(k) && z >= 30) return k + (z >= 75 ? 3 : z >= 55 ? 2 : 1);
        if (z >= 50) return k;
      }
      // 😣 acı
      const aci = cv0('acı');
      if (aci != null && aci >= 60) return 'acili';
      // 💗 onun değerleri (👤 karakter parametreleri) ve bu sohbetteki orgazm sayısı
      const cv = l => { const p = ch && allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? paramVal(ch, p) : null; };
      const ua = cv('uyarılma'), sh = cv('şehvet'), sut = cv('süt'), preg = ch && (ch.fields || {}).hamile;
      const org = allEvents().find(e => low(e.title) === 'orgazm'), orgN = org ? list.filter(m => m.ev === org.id).length : 0;
      // 🥴 Zevk = boşalma isteği · 💦 Cum = ne kadar boşalabileceği (miktar); ikisi birlikte: "gelmek üzeresin ve çok dolusun"
      if (z != null && z >= 70) return cum != null && cum >= 80 && Math.random() < .5 ? 'zevkdolu' : cum != null && cum <= 20 && Math.random() < .5 ? 'zevkbos' : 'zevkyuksek';
      if (ua != null && ua >= 60) return 'onugeliyor';
      if (n != null && n >= 3) return 'cumcok';
      if (orgN >= 3) return 'onyorgun';
      // Cum dolu sadece miktarı söyler; Zevk ortadayken çoğu zaman isteği (zevkorta) öne çıkar
      if (cum != null && cum >= 80 && z != null && z >= 20 && (z < 40 || Math.random() < .35)) return 'cumdolu';
      if (preg && sut != null && sut >= 70) return 'sutdolu';
      if (sh != null && sh >= 80) return 'onazgin';
      if (cum != null && cum <= 20) return 'cumbos';
      if (z != null && z >= 40) return 'zevkorta';
      if (aci != null && aci >= 30 && Math.random() < .5) return 'aciorta';
      // 😩 sevişirken bazen inleyen, destekleyen bir baloncuk ("ahhh harikasın", "devam et…")
      if (sexPhase() === 'sexnow' && Math.random() < .4) return 'destek';
      if (hr >= 1 && hr <= 5) return 'saatgecesex';
      if (rel) return rel;
      // 🤰 hamilelikte üç aya göre (bazen genel hamile cevapları)
      if (preg) { const w = pregWeek(ch); return Math.random() < .3 ? 'hamile' : w >= 27 ? 'hamile3' : w >= 13 ? 'hamile2' : 'hamile1'; }
      if (talk && ch && cyclePhase(ch) === 'regl' && Math.random() < .3) return 'regl';
      return '';
    }
    // events: olaya cevap (sadece olay kuralı tutarsa; yedek cevap verilmez, uyarı çıkmaz)
    function botReply(userMsg, opts = {}) {
      clearTimeout(botTimer);
      const old = $('#botTyping');
      if (old) old.remove();
      const rules = Stories.BOT_RULES || { rules: [] };
      // Grupta kuralı en iyi eşleşen üye cevap verir (eşitlikte rastgele)
      // ❔ karakter bir soru sorduysa ve bu mesaj "evet / hayır" ise önce o sorunun cevap kuralları ("=cevap" + konu)
      const pend = !opts.events && th.botAsk, yn = pend ? yesNo(userMsg.text) : '';
      if (!opts.events) th.botAsk = null;
      // 🧠 senin mesajından öğrendikleri (ad, sevdiklerin, şehir…): her üye kendi hafızasına yazar; yeni bir şeyse "not ettim" cümlesi
      const memAck = {};
      if (!opts.events) (group ? members() : [c]).forEach(k => { if (k && k !== GHOST) { const a = learnFacts(k, userMsg.text); if (a) memAck[k.id] = a; } });
      // ❤️ / 💔 olayı seviyor / sevmiyorsa önce "=sever" / "=sevmez" içeren kurallar (yoksa normal kurallar)
      const moodBest = ch => {
        // 🛡️ korunma olayında genel olay cevabı yerine sadece izne göre tepki (izin verdiği / vermediği / nötr)
        if (opts.events && /^izin_/.test(opts.state || '')) return { rule: { id: '_durum', reply: [] }, score: 0, fallback: false };
        if (yn) {
          const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=cevap') && (r.when || []).includes('=' + pend.t)) };
          const m = only.rules.length && BOT.best(only, `cevap ${pend.t} ${yn} ${korToken(ch)}`, ch);
          if (m && !m.fallback) return m;
        }
        // 😤 başka bir kızdan / karakterden bahsedince kıskanç karakter alınır ("=kiskanc" kuralları, {diger} = anılan ad)
        const other = !opts.events && otherMention(userMsg.text, ch);
        if (other && jealousOf(ch)) {
          const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=kiskanc')) };
          const m = only.rules.length && BOT.best(only, 'kiskanc', ch);
          if (m && !m.fallback) return { ...m, other };
        }
        if (opts.mood) {
          const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=' + opts.mood)) };
          const m = only.rules.length && BOT.best(only, `${userMsg.text} ${opts.mood}`, ch);
          if (m && !m.fallback) return m;
        }
        // 🔥 sevişirken ("ahh harikasın", "devam et", "ben de inliyorum") önce "=sexnow", az önce biri bitirdiyse "=sexsonra" kuralları
        const sx = !opts.events && sexPhase();
        if (sx) {
          const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=' + sx)) };
          const m = only.rules.length && BOT.best(only, `${userMsg.text} ${sx}`, ch, true);
          if (m && !m.fallback) return m;
        }
        // 🎭 kişiliği varsa yarı yarıya önce kişilik kuralları (r_pk_*: sevişme, ısınma, boşalma, onun orgazmı)
        // kendi cevabı zaten kişiliğe göre değişen olaylar (🍼 Breastfeeding) hariç
        const own = BOT.best(rules, userMsg.text, ch, false);
        if (Math.random() < .5 && !(own && PK_OWN.has(own.rule.id))) {
          const only = { ...rules, rules: (rules.rules || []).filter(r => String(r.id).startsWith('r_pk_') && !(r.when || []).includes('=durum')) };
          const m = only.rules.length && BOT.best(only, userMsg.text, ch, !opts.events);
          if (m && !m.fallback && !m.loose) return m;
        }
        // 🔓 senin mesajında gevşek eşleşme: sırası farklı ya da bir kelimesi eksik kurallar da tutar (daha düşük puanla)
        return BOT.best(rules, userMsg.text, ch, !opts.events);
      };
      let cands = (group ? members() : [c]).map(ch => ({ ch, m: moodBest(ch) })).filter(x => x.m && !(opts.events && x.m.fallback));
      // olayın kendi kuralı yoksa ama bir durumu varsa (ör. 🛡️ Pull-Out'a izin, 🚪 ilk giriş) sadece durum baloncuğu gelir
      if (!cands.length && opts.events && opts.state) cands = [{ ch: group ? byId(chatCharIds()[0]) : c, m: { rule: { id: '_durum', reply: [] }, score: 0, fallback: false } }];
      if (!cands.length) { if (!opts.events) notify('🤖 Bu karakter için uygun kural yok (Ben → 💾 Veri → 🤖 Bot editörü)', '🤖'); return; }
      const topScore = Math.max(...cands.map(x => x.m.score + (x.m.fallback ? 0 : 1000)));
      const win = cands.filter(x => x.m.score + (x.m.fallback ? 0 : 1000) === topScore);
      const { ch, m } = win[Math.floor(Math.random() * win.length)];
      // 📭 yedek cevaba düşen mesaj: Bot deneyindeki eksik cevap raporuna
      if (m.fallback && !opts.events && !yn) botMiss(userMsg.text, ch);
      // 🙏 izin dışı ısrar: kaçıncı ısrar; razı olursa bu tur içine istiyormuş gibi (uyarı yok, boşalınca kızmaz)
      const kor0 = ch ? korToken(ch) : '';
      if (String(m.rule.id).startsWith('r_israr')) {
        th.israr = (th.israr || 0) + 1;
        const n = th.israr, a = relV(ch, 'aşk');
        if ((kor0 === 'korpullout' && n >= 3 && a >= 70) || (kor0 === 'korsabah' && n >= 2) || (kor0 === 'kordikkat' && n >= 3 && a >= 80)) th.izinVerdi = true;
      }
      // 🗣️ komut kuralı (ör. "dön" → Doggy): olay hemen olur, cevap ardından gelir
      let cmdAdded = null;
      const ask = yn && BOT_ASK[pend.t], ansList = ask && ask[yn === 'evet' ? 'yes' : 'no'];
      const ansEv = ansList === '@pos' ? posNow() : ansList === '@other' ? otherPosition(ch) : ask && pickByTitles(ansList, ch);
      const cmdEv = !opts.events && (ansEv || cmdEvent(m.rule.id, ch));
      if (cmdEv) {
        const n0 = list.length;
        snap('Komut');
        eventMessages(cmdEv);
        clockTick();
        save(); draw(); refreshList();
        cmdAdded = list.slice(n0);
        opts = { ...opts, olay: cmdEv.title };
      }
      // {sen} ilişkiye göre hitap (adın · canım · aşkım)
      const vars = { sen: hitapOf(ch), ben: ch.name.split(' ')[0] };
      let parts = m.rule.id === '_durum' ? [] : BOT.reply(m.rule, vars, botRecent(m.rule.id));
      // 😤 kıskançlık: anılan ad cevaba girer, 😤 Kıskançlık +6
      if (m.other) {
        parts = parts.map(p => p.replace(/\{diger\}/g, capTr(m.other)));
        const kp = allParams().find(x => x.who !== 'me' && String(x.label).toLocaleLowerCase('tr') === 'kıskançlık');
        if (kp) applyOutcome({ text: '', effects: [{ p: 'p:' + kp.id, d: 6 }] }, [ch.id]);
      }
      // 🧠 yeni bir şey öğrendiyse "not ettim"
      if (memAck[ch.id] && Math.random() < .7) parts.push(memAck[ch.id]);
      // ❓ soruya cevap: 🤝 Güven ≤ 15 iken özel sorulara kaçamak cevap ("=durum =kacamak")
      const qid = String(m.rule.id), isQ = qid.startsWith('r_q');
      const intimate = isQ && QPRIVATE.some(p => qid.startsWith(p)) && relV(ch, 'güven') <= 15;
      if (intimate) {
        const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=kacamak')) };
        const km = only.rules.length && BOT.best(only, 'durum kacamak', ch);
        if (km && !km.fallback) parts = BOT.reply(km.rule, vars, botRecent(km.rule.id));
      }
      // 👗 kıyafete göre (gömleğin düğmeleri, eteği sıyırmak, tangayı kenara çekmek…)
      const wl = wearPart(ch, opts, qid);
      if (wl) parts.push(wl);
      // 📊 durumuna göre bir baloncuk daha (ör. Zevk yüksekse "boşal, rahatla"): "=durum" + durum kelimesi.
      // Olaydan gelen durum (opts.state: hamile kaldı, geçiş, ilk kez…) opts.stateP olasılıkla (yoksa her zaman), tutmazsa
      // ya da yoksa senin / onun değerlerinden gelen durum çoğu zaman
      let st = opts.state && Math.random() < (opts.stateP == null ? 1 : opts.stateP) ? opts.state : '';
      const fromEvent = !!st;
      // sevişirken normal sohbet baloncukları (saat, ilişki) yerine sevişme durumları
      if (!st && !isQ) st = botState(ch, !opts.events && !cmdEv && !sexPhase());
      // 🛡️ ısrarcı korunma uyarıları (seviye 2–3) her zaman gelir
      if (st && (fromEvent || /^kor\w+[23]$/.test(st) || Math.random() < .65)) {
        // 🎭 durumun kişilik varyantı (r_pk_*) çoğu zaman öne geçer, bazen genel cevap gelsin diye dışarıda kalır
        const pk = Math.random() < .7;
        // kuralı yoksa genel hâline düşer: "korpullout3" → "korpullout", "izin_red_hap" → "izin_red"
        const pickSt = s => [s, s.replace(/\d$/, ''), s.replace(/_[^_]+$/, '')].find(x => (rules.rules || []).some(r => (r.when || []).includes('=' + x))) || s;
        const st2 = pickSt(st);
        const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=' + st2) && (pk || !String(r.id).startsWith('r_pk_'))) };
        const sm = only.rules.length && BOT.best(only, `durum ${st2}`, ch);
        if (sm && !sm.fallback) parts.push(...BOT.reply(sm.rule, vars, botRecent(sm.rule.id)));
      }
      // ❔ olaydan sonra bazen karakter bir soru sorar ("=sor" + konu); senin sonraki "evet / hayır"ın ona göre cevaplanır
      // boşalmadan sonra daha sık (%60): yeni pozisyon isteği
      if (opts.events && Math.random() < (opts.climax ? .6 : .3)) {
        const t = askTopic(opts);
        const only = t && { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=sor') && (r.when || []).includes('=' + t)) };
        const qm = only && only.rules.length && BOT.best(only, `sor ${t}`, ch);
        if (qm && !qm.fallback) { parts.push(...BOT.reply(qm.rule, vars, botRecent(qm.rule.id))); th.botAsk = { t }; }
      }
      // ❓ soruya cevap verdiyse bazen karşı soru ("=sor" + k_konu); senin evet / hayır'ın dinlenir
      if (isQ && !intimate && Math.random() < .4) {
        const t = (QCOUNTER.find(([p]) => qid.startsWith(p)) || [, 'k_genel'])[1];
        const only = { ...rules, rules: (rules.rules || []).filter(r => (r.when || []).includes('=sor') && (r.when || []).includes('=' + t)) };
        const qm = only.rules.length && BOT.best(only, `sor ${t}`, ch);
        if (qm && !qm.fallback) { parts.push(...BOT.reply(qm.rule, vars, botRecent(qm.rule.id))); th.botAsk = { t }; }
      }
      botRecent();
      // yer tutucular: {ö:Boob Size} {sever} {cevap:…} … (bu sohbetteki orgazm / boşalma sayılarıyla)
      const lowA = s => String(s || '').toLocaleLowerCase('tr'), allE = allEvents(), evOf = x => x.ev && allE.find(e => e.id === x.ev);
      // 🙏 izin dışı ısrar ("lütfen içine boşalayım"): bu turda kaçıncı ısrar ve korunma durumu {cevap:ısrar}'a gider
      const fctx = { kor: kor0, israr: th.israr || 0, olay: opts.olay, text: opts.events ? '' : userMsg.text, orgN: list.filter(x => lowA((evOf(x) || {}).title) === 'orgazm').length,
        cumN: list.filter(x => x.from === 'me' && ((evOf(x) || {}).tags || []).includes('boşalma')).length };
      if (!parts.length) return;
      parts.forEach((p, i) => { parts[i] = fillTraits(p, ch, fctx); });
      // 🎭 soru cevabında kişiliğe göre çerçeve (Utangaç "S-söylemem gerekiyor mu? 🙈 …", Kibirli "… kıskandın mı? 💅")
      if (isQ && !intimate && Math.random() < .6) {
        const fr = (ch.traits || []).map(t => QFRAME[t]).filter(Boolean);
        const f = fr.length && pickOne(fr);
        if (f && f.pre) parts[0] = pickOne(f.pre) + parts[0];
        if (f && f.add) parts[0] += pickOne(f.add);
      }
      // 🎭 Mode / fantezi tonu (Cat Girl → miyav, Bondage → *ellerim bağlı* …), sonra kişilik ve yazım tarzı
      flavorParts(parts);
      // 💕 canım / aşkım / bebeğim
      if (!qid.startsWith('r_rude')) petParts(parts, ch);
      // 😩 sevişirken ve hemen sonrasında bütün cevaplara bazen inleme / destek ("Ahhh… ", "… devam et 😩"); soru cevabı ve kırgın cevapta yok
      if (!isQ && !qid.startsWith('r_rude')) moanParts(parts, sexPhase());
      // kabalığa kırgın cevapta ve soru cevabında (kişiliği çerçeve verdi) kişilik eki yok; yazım tarzı yine uygulanır
      personaParts(parts, ch, String(m.rule.id).startsWith('r_rude') || isQ);
      const slow = (ch.traits || []).includes('Geç cevap verir') ? 2.5 : 1;
      const step = i => {
        if (i >= parts.length) {
          lockInput(false);
          botOutcome(ch, m.rule); drawComposer();
          // komutun olayı bir bitiş getirdiyse ona da cevap
          const low = s => String(s || '').toLocaleLowerCase('tr');
          const climax = (cmdAdded || []).some(x => x.from === 'me' && x.ev && (ev => ev && (low(ev.title) === 'orgazm' || (ev.tags || []).some(t => low(t) === 'boşalma')))(allEvents().find(y => y.id === x.ev)));
          if (climax) botEventReply(cmdAdded); else autoScene();
          return;
        }
        box.insertAdjacentHTML('beforeend', `<div class="msg her" id="botTyping">${avatar(ch, 36)}<div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div></div>`);
        box.scrollTop = box.scrollHeight;
        setStatus(group ? `${ch.name} yazıyor…` : 'yazıyor…', 'typing');
        botTimer = setTimeout(() => {
          const t = $('#botTyping');
          if (t) t.remove();
          if (i === 0) snap('Bot cevabı');
          const msg = { id: Store.uid(), from: 'her', text: parts[i], ts: Math.max(Date.now(), (list[list.length - 1] || {}).ts + 1 || 0) };
          if (group) msg.who = ch.id;
          if (i === 0) msg.bsc = { n: m.rule.name || m.rule.id, s: m.score, l: m.loose ? 1 : 0, f: m.fallback ? 1 : 0 };
          list.push(msg);
          applyAddons(msg);
          save();
          draw();
          refreshList();
          if (group) drawHero(ch.id);
          playFx(box.querySelector(`[data-id="${msg.id}"]`), fxOf(msg));
          botTimer = setTimeout(() => step(i + 1), 350);
        }, Math.min(2600, 700 + parts[i].length * 35) * slow);
      };
      // ⏳ o yazarken sen yazamazsın
      lockInput(true, ch.name.split(' ')[0]);
      botTimer = setTimeout(() => step(0), 500);
    }

    // 🎲 bot kuralının sonucu (Monia → Sebep-sonuç → 🤖): karakterden sonuç mesajı; ↪ sonraki olay ve ⚡ eşik olayları ardından gelir
    function botOutcome(ch, rule) {
      const outs = botOutsOf(rule.id);
      if (!outs.length) return;
      const ids = [ch.id], sc = { chars: ids };
      trPos = posNow();
      const ctx = condCtx(ids), res = resolveOutcome(outs.map(x => ({ ...x, text: x.text ? evText({ text: x.text }, sc, true) : '' })), ctx);
      spendConds(outs, ctx);
      if (!res) return;
      const who = group ? { who: ch.id } : {}, ts = Math.max(Date.now(), ((list[list.length - 1] || {}).ts || 0) + 1), title = `🤖 ${rule.name || 'Bot'}`, chain = [];
      if (res.blocked) list.push({ id: Store.uid(), from: 'her', ...who, text: res.blocked.text || '🎲 Sonuç', oc: { pct: res.blocked.pct, blocked: res.blocked.why, ev: title }, ts });
      else {
        const out = res.out, r = applyOutcome(out, ids);
        if (r.text || r.changes.length || r.fired.length || res.fallback) list.push({ id: Store.uid(), from: 'her', ...who, text: r.text || '🎲 Sonuç',
          oc: { pct: out.pct, changes: r.changes, fired: r.fired.map(f => f.text), ev: title, ...(out.fert != null ? { fert: out.fert } : {}), ...(res.fallback ? { fallback: res.fallback } : {}) }, ts });
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
    // th.evAt: olayın en son ne zaman olduğu · th.evSpent: 🔒 şartta en son ne zaman harcandığı
    const nowTs = () => Math.max(Date.now(), (list[list.length - 1] || {}).ts || 0);
    const markDone = (...idsDone) => {
      const ids = idsDone.filter(Boolean), t = nowTs();
      th.evDone = [...new Set([...(th.evDone || []), ...ids])];
      th.evAt = th.evAt || {};
      ids.forEach(id => { th.evAt[id] = t; });
    };
    const lastDone = () => {
      const last = {};
      (th.evDone || []).forEach(id => { last[id] = Math.max(last[id] || 0, (th.evAt || {})[id] || 1); });
      list.forEach(m => { if (m.ev) last[m.ev] = Math.max(last[m.ev] || 0, m.ts || 1); });
      return last;
    };
    // 🎯 şu anki pozisyon: en son olmuş, "event" etiketli kategorideki olay (eşleşen olay hedefi için)
    const posNow = () => {
      const at = lastDone(), all = allEvents();
      let best = null, bt = -1;
      Object.keys(at).forEach(id => { const e = all.find(x => x.id === id); if (e && at[id] > bt && (catOfEv(e).tags || []).includes(CHAT_TOP_TAG)) { best = e; bt = at[id]; } });
      return best;
    };
    // 🕰️ sohbet saati: th.clock { start: dakika (mesaj 0'ın saati), step: bu sohbete özel (yoksa genel), done: işlenmiş mesaj sayısı, off }
    const msgCount = () => list.filter(m => m.from !== 'sys').length;
    const clockOn = () => clockCfg().on !== false && !(th.clock && th.clock.off);
    const clockStep = () => { const s = th.clock && th.clock.step; return s !== '' && s != null ? +s : +clockCfg().step || 0; };
    const clockInit = () => { if (!th.clock) th.clock = { start: hm(clockCfg().start) - (+clockCfg().step || 0) * msgCount(), done: msgCount() }; };
    const clockNow = () => { clockInit(); return th.clock.start + clockStep() * msgCount(); };
    // yeni mesajlar için saat kuralları: parametreler değişir, ⚡ eşikleri olay olarak gelir
    function clockTick() {
      if (!clockOn()) return false;
      clockInit();
      const ck = th.clock, n = msgCount(), rules = clockCfg().rules || [];
      if (n <= ck.done) { ck.done = n; return false; }
      const step = clockStep(), ids = chatCharIds(), shown = [], chain = [];
      let any = false;
      trPos = posNow();
      for (let k = ck.done + 1; k <= n; k++) {
        const t = ck.start + step * k, prev = t - step;
        rules.forEach(r => {
          let times = 0;
          if (r.every === 'hour') { for (let h = Math.floor(prev / 60) + 1; h <= Math.floor(t / 60); h++) if (inWin(h * 60, r.from, r.to)) times++; }
          else if (r.every === 'at') { const a = hm(r.from); for (let d = Math.floor(prev / 1440); d <= Math.floor(t / 1440); d++) { const x = d * 1440 + a; if (x > prev && x <= t) times++; } }
          else if (inWin(t, r.from, r.to)) times = 1;
          for (let i = 0; i < times; i++) {
            const res = applyOutcome({ text: '', effects: [{ p: r.p, d: +r.d || 0 }] }, ids);
            if (res.changes.length) any = true;
            if (r.every !== 'msg') shown.push(...res.changes.map(x => `${x.label} ${x.from} → ${x.to}`));
            res.fired.forEach(f => chain.push(f.ev));
          }
        });
      }
      // 🩸🤰 karakterlerin zamanı da ilerler (döngü günü, hamilelik haftası, doğum)
      const dt = step * (n - ck.done);
      ids.forEach(id => { const c0 = byId(id); if (c0) bodyTick(c0, dt, txt => list.push({ id: Store.uid(), from: 'sys', text: txt, ts: nowTs() + 1 })); });
      ck.done = n;
      if (shown.length) notify(`${hmText(clockNow())} · ${shown.slice(0, 3).join(' · ')}`, '🕰️');
      chain.slice(0, MAX_CHAIN).forEach(x => eventMessages(x, undefined, 1));
      save();
      return any || chain.length > 0;
    }
    function drawClock() {
      const el = $('#chatClock');
      if (!el) return;
      el.hidden = clockCfg().on === false;
      if (el.hidden) return;
      const now = clockNow(), day = Math.floor(now / 1440) + 1, off = !!th.clock.off;
      el.classList.toggle('off', off);
      el.innerHTML = off ? '🕰️' : `${clockIcon(now)} <b>${hmText(now)}</b>${day > 1 ? `<small>${day}. gün</small>` : ''}`;
    }
    /* 💁‍♀️ Lia önerileri: anlık durum (orgazm sonrası, onun Uyarılma'sı, senin Zevk'in, korunma) önce, sonra 💞 ideal seansın sıradaki aşaması.
     * Öneriler karakterin ❤️ sevdiklerinden başlar, 💔 sevmediklerini atlar. Dönüş: { say, evs } */
    function liaTips() {
      const all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr').trim(), at = lastDone();
      const cat = name => moCats().find(c => low(c.label) === name);
      const ch = byId(chatCharIds()[0]) || {}, name = ch.name ? ch.name.split(' ')[0] : 'O';
      const likes = new Set(ch.likes || []), dislikes = new Set(ch.dislikes || []);
      const pick = (c, n = 2) => {
        if (!c) return [];
        const pk = placeKey(), evs = all.filter(e => e.cat === c.id && !dislikes.has(e.id) && !placeBlock(pk, e));
        return [...sample(evs.filter(e => likes.has(e.id)), n), ...sample(evs.filter(e => !likes.has(e.id)), n)].slice(0, n);
      };
      const byT = t => all.find(e => low(e.title) === low(t));
      const val = (mine, label) => { const p = allParams().find(x => low(x.label) === label && (x.who === 'me') === mine); return p ? paramVal(mine ? S().user : ch, p) : null; };
      // en son pozisyon ve ondan sonra biri bitirdi mi (en son ne zaman olduğuna göre)
      const lastT = f => Object.keys(at).reduce((m, id) => { const e = all.find(x => x.id === id); return e && f(e) ? Math.max(m, at[id]) : m; }, 0);
      const pos = posNow(), posCat = pos ? low(catOfEv(pos).label) : '', posT = pos ? at[pos.id] || 0 : 0;
      const phaseI = LIA_PHASES.findIndex(p => p.cat === posCat);
      const done = new Set(Object.keys(at).map(id => (all.find(e => e.id === id) || {}).cat).filter(Boolean));
      const ua = val(false, 'uyarılma'), zevk = val(true, 'zevk'), cum = val(true, 'cum');
      const cumT = lastT(e => (e.tags || []).some(t => low(t) === 'boşalma')), orgT = lastT(e => low(e.title) === 'orgazm');
      // 1) az önce biri bitirdiyse (ondan sonra yeni pozisyon yok)
      if (cumT && cumT >= posT && cumT >= orgT) return { say: `💦 Bitti${cum != null ? ` · Cum ${cum}` : ''}. Dinlenin, sarılın; 🕰️ saat ilerledikçe toparlanırsın.`, evs: pick(cat('foreplay'), 3) };
      if (orgT && orgT >= posT) return { say: `💗 ${esc(name)} az önce orgazm oldu. Biraz sarılın, sonra devam edebilirsiniz.`, evs: [...pick(cat('foreplay'), 2), ...pick(cat('eat'), 1)] };
      // 2) onun ya da senin sınırına yakınsa
      if (ua != null && ua >= 55) return { say: `💗 ${esc(name)} çok yakın (Uyarılma ${ua}). Bir Eat daha onu bitirir.`, evs: pick(cat('eat'), 3) };
      if (zevk != null && zevk >= 60) return { say: `🥴 Zevk'in ${zevk}: 80'de bitireceksin. Uzatmak istersen tut.`, evs: CUM_HOLD.map(byT).filter(Boolean).slice(0, 3) };
      // 3) 💞 sıradaki aşama
      let next = phaseI >= 0 ? LIA_PHASES[phaseI + 1] : LIA_PHASES.find(p => !done.has((cat(p.cat) || {}).id)) || LIA_PHASES[0];
      if (!next) return { say: `🔥 Son aşamadasınız. Tempoyu Mode ile artır; 🥴 Zevk 80'de bitiş kendiliğinden gelir.`, evs: [...pick(cat('mode'), 2), ...pick(cat(posCat), 1)] };
      const evs = pick(cat(next.cat), 3);
      // 🛡️ penetrasyondan önce korunma (Nothing'e izin veriyorsa önermez)
      const condom = byT('Condom'), nothing = byT('Nothing');
      if (['forward', 'backward'].includes(next.cat) && condom && !(nothing && (ch.allows || []).includes(nothing.id)) && !condCtx(chatCharIds()).done.has(condom.id)) evs.unshift(condom);
      return { say: `${next.icon} <b>${next.name}</b> · ${LIA_PHASES.indexOf(next) + 1}/${LIA_PHASES.length} — ${next.say}`, evs: evs.slice(0, 4) };
    }
    function drawLia() {
      const el = $('#liaBar');
      if (!el) return;
      el.hidden = !liaOn() || cs.playing || !allEvents().length;
      if (el.hidden) return;
      const t = liaTips();
      el.innerHTML = `<span class="lia-ava">${liaAva()}</span>
        <div class="lia-body"><p>${t.say}</p>
          <div class="lia-chips">${t.evs.map(e => `<button type="button" class="mo-chip${evCls(e)}"${evStyle(e)} data-liaev="${esc(e.id)}">${evEmo(e)}${esc(e.title)}</button>`).join('')}<button type="button" class="lia-more" data-lia="book">📖 İdeal seans</button></div></div>
        <button type="button" class="lia-x" data-lia="off" aria-label="Lia önerilerini kapat">✕</button>`;
    }
    /* 👗 kıyafete göre bir baloncuk: göster komutları / Show Tits / Show Ass → "show", soyun komutu ve bu sohbetteki ilk sevişme → "off",
     * ön sevişmede bazen ne giydiğinden bahseder ("t"). Bir bölge (göğüs / kalça) bu sohbette bir kez açılır (th.undress) */
    function wearPart(ch, opts, rid) {
      if (!ch) return '';
      const und = th.undress = th.undress || {}, u = und[ch.id] = und[ch.id] || {}, low = s => String(s || '').toLocaleLowerCase('tr');
      const t = low(opts.olay), e = t && allEvents().find(x => low(x.title) === t);
      // 🎭 fantezi / rol olunca uygun kostüm (gardırobundaki önce) ya da hazır kombin giyilir; bu sohbette yeniden soyunabilir
      if (opts.events && e && isFant(e)) {
        const key = fantKey(e), w = ch.wardrobe || [], cos = CL.items.filter(x => x.fant === key), mine = cos.filter(x => w.includes(x.id));
        const x = pickOne(mine.length ? mine : cos), cb = (CL.combos || []).find(k => k.fant === key);
        if (x) ch.outfit = { ...outfitOf(ch), ust: '', alt: '', elbise: x.id };
        else if (cb) ch.outfit = { ust: '', alt: '', elbise: '', sutyen: '', tanga: '', corap: '', ...cb.parts };
        else return '';
        und[ch.id] = {};
        save();
        return x ? pickOne(x.t) : pickOne(cb.say);
      }
      if (!outfitItems(ch).length) return '';
      const once = (zone, kind) => { if (u[zone]) return ''; u[zone] = 1; return wearLine(ch, kind, zone); };
      if (/^r_cmd_meme/.test(rid)) return once('gogus', 'show');
      if (/^r_cmd_(kalca|kaldir)/.test(rid)) return once('kalca', 'show');
      if (rid === 'r_cmd_goster') return [once('gogus', 'off'), once('kalca', 'off')].filter(Boolean).join(' ');
      if (!t) return '';
      if (t === 'show tits') return once('gogus', 'show');
      if (t === 'show ass') return once('kalca', 'show');
      if (!e || !isPosEv(e)) return '';
      const cat = low(catOfEv(e).label), tags = (e.tags || []).map(low);
      if (cat === 'foreplay') return !u.gogus && !u.kalca && Math.random() < .3 ? wearLine(ch, 't', 'any') : '';
      if (tags.includes('göğüs')) return once('gogus', 'off');
      if (tags.includes('vajinal') || tags.includes('anal') || tags.includes('kalça') || cat === 'eat') return once('kalca', 'off');
      return '';
    }
    const MOAN = {
      pre: ['Ahhh… ', 'Ahh ', 'Off… ', 'Mmmh… ', 'Ohh… ', 'Ahhh evet… ', 'Of of… ', 'Hmmm… '],
      now: [' Devam et… ahhh 😩', ' Harikasın 🥵', ' Durma… 😩', ' Ben de inliyorum… 🥵', ' Off, harikasın 😩', ' Çok iyisin… ahh', ' Evet… tam böyle 😩', ' Sakın durma 😵‍💫', ' Mmm, bayılıyorum 🥵', ' Ahh {sen}… 😩'],
      sonra: [' Harikaydın… ahhh 😩', ' Off… ne güzeldi 🥵', ' Hâlâ titriyorum 😵‍💫', ' Mmm… harikasın 💗', ' Nefesim hâlâ kesik… 😩']
    };
    function moanParts(parts, phase) {
      if (!phase || !parts.length) return;
      const vars = { sen: hitapOf(byId(chatCharIds()[0]) || {}) }, low = s => String(s || '').toLocaleLowerCase('tr');
      if (phase === 'sexnow' && Math.random() < .3 && !/^(ah|of|mm|oh|hm)/.test(low(parts[0]))) parts[0] = pickOne(MOAN.pre) + parts[0];
      else if (Math.random() < .28) { const last = parts.length - 1, tail = pickOne(MOAN[phase === 'sexnow' ? 'now' : 'sonra']).replace('{sen}', vars.sen); if (!low(parts[last]).includes(low(tail).trim().split(/[ …,]/)[0])) parts[last] += tail; }
    }
    /* 🔥 sevişme anı: son 12 mesajdaki en son olay bir pozisyon / Mode / fantezi ise 'sexnow', boşalma ya da orgazm ise 'sexsonra', yoksa '' */
    const sexPhase = () => {
      const ms = list.filter(m => m.from !== 'sys').slice(-12), all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr');
      for (let i = ms.length - 1; i >= 0; i--) {
        const e = ms[i].ev && all.find(x => x.id === ms[i].ev);
        if (!e) continue;
        if (low(e.title) === 'orgazm' || (e.tags || []).some(t => low(t) === 'boşalma')) return 'sexsonra';
        if (isPosEv(e) || isFant(e) || low(catOfEv(e).label) === 'mode') return 'sexnow';
      }
      return '';
    };
    // 📍 sohbetin şu anki mekanı (son mekan kartı) → PLACE_KEY anahtarı
    const placeKey = () => { const s = lastScene(); return (s && PLACE_KEY[s.scene.place]) || ''; };
    // 🦄 son 30 mesajdaki en son fantezi
    const fantRecent = () => { const all = allEvents(); return list.filter(m => m.from !== 'sys').slice(-30).map(m => m.ev && all.find(y => y.id === m.ev)).filter(isFant).pop() || null; };
    // 🎼 Mode olayı olunca ona uygun parça kendiliğinden çalar (⋯ Diğer → 🎼 ile kapatılır)
    const MODE_MUSIC = { gentle: 'ruya', passionate: 'kalp', assertive: 'tutku', rough: 'tutku', brutal: 'tutku', inletmeli: 'gece', 'bağırtmalı': 'tutku', 'ağlatmalı': 'yagmur' };
    function modeMusic(e) {
      if (!MU || !modeMusicOn() || String(catOfEv(e).label).toLocaleLowerCase('tr') !== 'mode') return;
      const id = MODE_MUSIC[String(e.title).toLocaleLowerCase('tr')], tr = id && MU.byId(id);
      if (!tr || th.music === id) return;
      th.music = id;
      syncMusic(true);
      notify(`🎼 ${tr.icon} ${tr.name}`, '🎵');
      const b = $('[data-tool="music"]');
      if (b) b.classList.add('on');
    }
    /* 📱 rastgele kesintiler: pozisyondan sonra bazen telefon çalar, kapı çalınır, komşu duyar… (%6; son 30 mesajda Cheating varsa %22 ve
     * "yakalanma" hâlleri). Karakter "=durum =kes_<tür>" kurallarıyla cevap verir; arka arkaya 8 mesaj içinde bir daha gelmez */
    const INTERRUPTS = [
      { k: 'telefon', n: '📱 Telefon çaldı…', g: '📱 Telefon çaldı… ekranda "Sevgilim ❤️" yazıyor' },
      { k: 'kapi', n: '🚪 Kapı çalındı!', g: '🚪 Kapı çalındı… "Aşkım, anahtarımı unuttum!"' },
      { k: 'komsu', n: '🏠 Duvara vuruldu: "Biraz sessiz olun!"', g: '🏠 Koridorda ayak sesleri… komşu duydu galiba' },
      { k: 'bildirim', n: '🔔 Telefonuna bir mesaj geldi', g: '🔔 Mesaj geldi: "Neredesin? Eve ne zaman geliyorsun?"' },
      { k: 'eve', only: true, g: '🔑 Kapıda anahtar sesi… biri eve geliyor!' }
    ];
    function maybeInterrupt(e) {
      if (!isPosEv(e) || cs.playing) return;
      const n = msgCount();
      if (th.intAt && n - th.intAt < 8) return;
      const gizli = fantKey(fantRecent() || {}) === 'fxgizli';
      if (Math.random() >= (gizli ? .22 : .06)) return;
      const it = pickOne(INTERRUPTS.filter(x => gizli || !x.only));
      list.push({ id: Store.uid(), from: 'sys', text: gizli ? it.g : it.n, ts: nowTs() + 1 });
      th.interrupt = it.k + (gizli ? '_gizli' : '');
      th.intAt = n;
    }
    // ⚡ kısayollar: en son kullandığın olaylar, mesaj kutusunun hemen üstünde (dokununca olay yazılır)
    function drawQuick() {
      const el = $('#evQuick');
      if (!el) return;
      // 📌 sabitlenenler (olay kartına uzun bas) önce, sonra son kullanılanlar
      const all = allEvents(), pins = (MO().quickPins || []).map(id => all.find(e => e.id === id)).filter(Boolean);
      const evs = [...pins, ...recentEvents().filter(e => !pins.includes(e))].slice(0, 12);
      el.hidden = !quickOn() || cs.playing || !evs.length;
      if (el.hidden) return;
      el.innerHTML = `<span class="eq-ic" title="Son kullanılan olaylar">⚡</span><div class="eq-row">${evs.map(e => `<button type="button" class="mo-chip${evCls(e)}"${evStyle(e)} data-qev="${esc(e.id)}">${pins.includes(e) ? '📌' : ''}${evEmo(e)}${esc(e.title)}</button>`).join('')}</div>
        <button type="button" class="eq-x" data-q="off" aria-label="Kısayolları kapat">✕</button>`;
    }
    // olmuş sayılan: harcandıktan sonra yeniden olmuş olaylar
    const condCtx = charIds => {
      const last = lastDone(), spent = th.evSpent || {};
      return { done: new Set(Object.keys(last).filter(id => last[id] > (spent[id] || 0))), chars: charIds.map(byId).filter(Boolean) };
    };
    // 🔒 "olduysa / olmadıysa" şartlarındaki olay, sonuç belirlenince harcanır: Condom bir ilişkiyi korur, sonrakini korumak için yeniden olmalı
    const spendConds = (outs, ctx) => {
      const last = lastDone();
      (outs || []).forEach(o => (o.conds || []).forEach(cd => {
        if ((cd.k === 'had' || cd.k === 'not') && ctx.done.has(cd.ev)) (th.evSpent = th.evSpent || {})[cd.ev] = last[cd.ev];
      }));
    };
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
      trPos = posNow();
      const bands = bandPicks(allEvents().find(x => x.id === e.evId), charIds);
      const ctx = condCtx(charIds), res = resolveOutcome(e.outcomes, ctx);
      spendConds(e.outcomes, ctx);
      // ⚡ olunca etkileri sonuç belirlendikten sonra (şartlar eski değere baksın: Condom → Korunma, Creampie onu tüketir)
      const onFx = () => {
        bands.forEach(b => next(b));
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
      // 🔀 pozisyon geçişi: kartta önceki pozisyondan oklu zincir
      const pp = isPosEv(e) && posNow();
      if (pp && pp.id !== e.id) evc.prev = { t: pp.title, emo: pp.emojis || '' };
      const ctx = condCtx(ids);
      list.push({ id: Store.uid(), from: 'me', text: evText(live, sc, true), ts, ev: e.id, evc });
      markDone(e.id, live.subId);
      trPos = posNow();
      const bands = bandPicks(allEvents().find(x => x.id === e.id) || e, ids);
      if (!depth) useEvents([e.id]);
      const res = resolveOutcome(ev.outcomes, ctx), chain = [];
      spendConds(ev.outcomes, ctx);
      const who = group && ids[0] ? { who: ids[0] } : {};
      if (res && res.blocked) list.push({ id: Store.uid(), from: 'her', ...who, text: res.blocked.text || '🎲 Sonuç', oc: { pct: res.blocked.pct, blocked: res.blocked.why, ev: live.title }, ts: ts + 1 });
      else if (res) {
        const out = res.out, r = applyOutcome(out, ids);
        if (r.text || r.changes.length || r.fired.length || res.fallback) list.push({ id: Store.uid(), from: 'her', ...who, text: r.text || '🎲 Sonuç',
          oc: { pct: out.pct, changes: r.changes, fired: r.fired.map(f => f.text), ev: live.title, ...(out.fert != null ? { fert: out.fert } : {}), ...(res.fallback ? { fallback: res.fallback } : {}) }, ts: ts + 1 });
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
      // 💔 sevmediği olay: o karakterin 🤝 Güven −3, ❤️ Aşk −1
      const lowT = s => String(s || '').toLocaleLowerCase('tr'), relP = l => (allParams().find(x => x.who !== 'me' && lowT(x.label) === l) || {}).id;
      const hate = ids.filter(cid => ((byId(cid) || {}).dislikes || []).includes(e.id)), guvP = relP('güven'), askP = relP('aşk');
      if (hate.length && guvP && askP) {
        const r3 = applyOutcome({ text: '', effects: [{ p: 'p:' + guvP, d: -3 }, { p: 'p:' + askP, d: -1 }] }, hate);
        if (r3.changes.length) evc.changes = [...(evc.changes || []), ...r3.changes];
      }
      if (!depth) {
        // 😣 acı / rahatlık
        ids.forEach(cid => {
          const c0 = byId(cid), d = c0 && painDelta(e, c0), pid = painParam();
          if (!d || !pid) return;
          const r4 = applyOutcome({ text: '', effects: [{ p: 'p:' + pid, d }] }, [cid]);
          if (r4.changes.length) evc.changes = [...(evc.changes || []), ...r4.changes];
        });
        modeMusic(e);
      }
      if (lowT(e.title) === 'orgazm') sfx('orgasm');
      ids.forEach(cid => { const c0 = byId(cid); if (c0) bodyTick(c0, 0, txt => list.push({ id: Store.uid(), from: 'sys', text: txt, ts: nowTs() + 1 })); });
      chain.push(...bands);
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
      if (clockTick()) { draw(); refreshList(); }
      else drawClock();
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
      if (cs.busy) return;
      const t = input.value.trim();
      const editingPhoto = cs.mode && cs.mode.type === 'edit' && (list.find(x => x.id === cs.mode.id) || {}).type === 'photo';
      // 📜 # ile seçilip bekleyen olaylar: yazdığın metin önce mesaj olur (karakter ona ayrıca cevap vermez), sonra olaylar yazılır
      const pend = cs.pend || [];
      if (pend.length && !cs.playing && !(cs.mode && cs.mode.type === 'edit')) {
        input.value = '';
        cs.pend = [];
        drawPend();
        if (t) { cs.noBot = true; send(t); cs.noBot = false; }
        writeEvents(pend);
        input.focus();
        return;
      }
      if ((!t && !editingPhoto) || cs.playing) return;
      input.value = '';
      send(t);
      input.focus();
    };
    // 📎 bekleyen olay şeridi (✕ ile çıkar)
    function drawPend() {
      const bar = $('#evPend'), p = cs.pend || [];
      if (!bar) return;
      bar.hidden = !p.length;
      bar.innerHTML = p.length ? `<span class="ev-pend-h">📜</span>${p.map((x, i) => { const look = x.sub ? withSub(x.e, x.sub) : x.e; return `<button type="button" class="ev-pend-it${evCls(look)}"${evStyle(look)} data-pendx="${i}">${evEmo(look)}${esc(look.title)} <b>✕</b></button>`; }).join('')}<small>yazıp gönder · boşken Enter olayı yazar</small>` : '';
    }
    $('#evPend').onclick = e => { const b = e.target.closest('[data-pendx]'); if (!b) return; cs.pend.splice(+b.dataset.pendx, 1); drawPend(); input.focus(); };
    input.onkeydown = e => {
      if (e.key !== 'Escape') return;
      if (cs.mode) cancelMode();
      else if (cs.reply) { cs.reply = null; drawReply(); }
    };
    // 📜 # ile olay: "#fore" yazınca üstte benzer olaylar çıkar, seçince olay mesaj olarak yazılır (alt derece adıyla da bulunur)
    /* ⏳ karşı taraf yazarken (olay zinciri gelirken ya da bot cevap verirken) mesaj kutusu kilitli; 40 sn sonra kendiliğinden açılır */
    const lockInput = (on, who) => {
      cs.busy = !!on;
      clearTimeout(ui.lockT);
      input.disabled = !!on;
      const sb = $('#composer .send-btn');
      if (sb) sb.disabled = !!on;
      $('#composer').classList.toggle('busy', !!on);
      if (on) { input.placeholder = `${who || 'O'} yazıyor… bekle ⏳`; ui.lockT = setTimeout(() => lockInput(false), 40000); }
      else drawComposer();
    };
    const writeEvents = picked => {
      if (cs.busy) { notify('Biraz bekle, karşı taraf yazıyor… ⏳', '⏳'); return; }
      // 📍 mekan kısıtı: bu mekanda olamayacak pozisyonlar yazılmaz
      const pk = placeKey(), no = picked.filter(x => placeBlock(pk, x.e));
      if (no.length) {
        notify(`${placeBlock(pk, no[0].e)}: ${no.map(x => x.e.title).join(', ')} olmaz`, '📍');
        picked = picked.filter(x => !no.includes(x));
        if (!picked.length) return;
      }
      snap('Olay');
      const n0 = list.length;
      picked.forEach(x => eventMessages(x.e, x.sub));
      maybeInterrupt(picked[picked.length - 1].e);
      clockTick();
      // ⏳ zincirdeki mesajlar (olay, sonuç, ⚡ boşalma, miktar…) birer birer gelir; karşı taraftan önce "yazıyor…"
      const added = list.splice(n0), who = byId(chatCharIds()[0]) || c;
      lockInput(true, who && who.name.split(' ')[0]);
      const done = () => { save(); draw(); refreshList(); lockInput(false); if (th.bot) botEventReply(added); else th.interrupt = null; };
      let k = 0;
      const next = () => {
        const tp = $('#evTyping');
        if (tp) tp.remove();
        if (k >= added.length) return done();
        list.push(added[k++]);
        save(); draw();
        const nx = added[k];
        if (!nx) return done();
        if (nx.from === 'her') {
          const sp = (nx.who && byId(nx.who)) || who;
          box.insertAdjacentHTML('beforeend', `<div class="msg her" id="evTyping">${sp ? avatar(sp, 36) : ''}<div class="bubble"><span class="typing-dots"><i></i><i></i><i></i></span></div></div>`);
          box.scrollTop = box.scrollHeight;
        }
        ui.revealT = setTimeout(next, nx.from === 'me' ? 500 : nx.from === 'sys' ? 900 : 1100);
      };
      next();
    };
    /* 🤖 Bot modunda olaya cevap: zincirde onun orgazmı ya da senin boşalman varsa ona, yoksa ilk olaya.
     * Bot kuralına giden metin: "evt <etiketler> <kategori> <olay adı>" (kurallar ör. =evt, =anal, =backward) */
    function botEventReply(added) {
      const all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr');
      const evs = added.filter(m => m.from === 'me' && m.ev).map(m => all.find(e => e.id === m.ev)).filter(Boolean);
      const e = evs.find(x => low(x.title) === 'orgazm' || (x.tags || []).some(t => low(t) === 'boşalma')) || evs[0];
      if (!e) return;
      // zincirde karakterin sevdiği bir olay varsa daha zevkli, ilk olayı sevmiyorsa isteksiz cevaplar
      const ch = group ? byId(chatCharIds()[0]) : c, has = k => evs.some(x => ((ch || {})[k] || []).includes(x.id));
      const mood = has('likes') ? 'sever' : ((ch || {}).dislikes || []).includes(evs[0].id) ? 'sevmez' : '';
      // 💦 boşalmada hangi pozisyondayken olduğu da gider: "… poz <pozisyon> <kategorisi>" (kurallar ör. =poz, doggy)
      // 🦄 fantezi olayında da şu anki pozisyon gider ("evt fantesy Cat Girl poz Doggy Backward")
      const cum = (e.tags || []).some(t => low(t) === 'boşalma'), fan = isFant(e), pos = (cum || fan) && posNow();
      // 🦄 son 30 mesajda bir fantezi olduysa pozisyon / boşalma çoğu zaman onunla gider: "… <olay> fant fxkedi poz …"
      const fmsgs = list.slice(0, Math.max(0, list.indexOf(added[0]))).filter(m => m.from !== 'sys').slice(-30);
      const fnow = !fan && Math.random() < .6 && (fmsgs.map(m => m.ev && all.find(y => y.id === m.ev)).filter(isFant).pop() || null);
      // 📍 pozisyonda bazen mekan da gider: "… mekan araba" (kurallar =mekan, =araba)
      const mk = isPosEv(e) && !cum && placeKey(), mekan = mk && Math.random() < .4 ? ` mekan ${mk}` : '';
      // 💥 son Mode pozisyonun şiddetini belirler (%70): "… mod mdinlet" (inletmeli), mdbagir, mdaglat, mdsert, mdvahsi, mdnaz, mdtutku, mdbaskin
      const MODE_KEY = { gentle: 'mdnaz', passionate: 'mdtutku', assertive: 'mdbaskin', rough: 'mdsert', brutal: 'mdvahsi', inletmeli: 'mdinlet', 'bağırtmalı': 'mdbagir', 'ağlatmalı': 'mdaglat' };
      const lastMode = isPosEv(e) && !cum && low(catOfEv(e).label) !== 'foreplay' && fmsgs.slice(-20).map(m => m.ev && all.find(y => y.id === m.ev)).filter(x => x && low(catOfEv(x).label) === 'mode').pop();
      const modq = lastMode && MODE_KEY[low(lastMode.title)] && Math.random() < .7 ? ` mod ${MODE_KEY[low(lastMode.title)]}` : '';
      // 🛡️🤰 önden bitişten sonra: hamile kaldı · zaten hamile · kondom korudu · hap / sabah hapı · çıkarmadın · içime istedi · riskli
      // 📱 az önce bir kesinti olduysa (telefon, kapı…) önce ona cevap
      let state = th.interrupt ? 'kes_' + th.interrupt : '';
      th.interrupt = null;
      if (cum && (e.tags || []).some(t => low(t) === 'vajinal') && ch) {
        // değişimin etiketi alanın simgesiyle gelir ("🧩 Hamile")
        const preg = added.some(m => m.oc && (m.oc.changes || []).some(x => low(x.label).trim().endsWith('hamile') && low(x.to) === 'evet'));
        const shield = added.some(m => m.oc && /condom/i.test(String(m.oc.blocked || '') + String((m.oc.fallback || {}).why || '')));
        const p = protOf(ch);
        // 🤰 hamile kaldı: Nothing'e izin verdiyse sevinir, yoksa istememiştir (panik / kızgınlık)
        // 🙏 ısrara razı olduysa kızmaz (hamile kalırsa da istemiş sayılır)
        const ok = p.nothing || th.izinVerdi;
        state = preg ? (ok ? 'hamilekaldi' : 'hamilekaldi_istemedi') : (ch.fields || {}).hamile ? 'hamileyken' : shield ? 'kondomkorudu'
          : p.pill ? 'haplakorundu' : th.izinVerdi ? 'icineistedi' : p.morning ? 'sabahhap' : p.pullout ? 'pulloutkacti' : p.nothing ? 'icineistedi' : 'riskli';
        th.izinVerdi = false;
        // bir sonraki önden girişte yine "kondomsuz giriyorsun" tepkisi gelebilir
        if (th.giris) delete th.giris[ch.id];
        th.israr = 0;
      }
      // 🔀 aşama değişti mi (önceki pozisyon başka kategorideyse: gecisforward, gecisbackward…) · 🧠 bu olay bu sohbette kaçıncı kez
      let stateP = 1;
      const isPos = x => (catOfEv(x).tags || []).includes(CHAT_TOP_TAG), i0 = list.indexOf(added[0]);
      // 🛡️ korunma olayı (Condom, Control Pill, Pull-Out…): izin verdiyse rahat, vermediyse itiraz ("izin_ok_kondom", "izin_red_hap"…)
      if (!state && ch && (catOfEv(e).tags || []).includes(PERM_TAG)) {
        const t = low(e.title), key = /condom/.test(t) ? 'kondom' : /control/.test(t) ? 'hap' : /morning/.test(t) ? 'sabah' : /pull/.test(t) ? 'pullout' : t === 'nothing' ? 'nothing' : 'diger';
        const ok = (ch.allows || []).includes(e.id), red = (ch.denies || []).includes(e.id);
        state = `izin_${ok ? 'ok' : red ? 'red' : 'notr'}_${key}`;
      }
      // ✋ Holding / Hard Holding / Cock Ring: korunmasına göre ("hold_pullout": "Tut… sakın içime gelme 😳", "hold_icine": "Tut, sonra hepsini içime ver 😈")
      if (!state && ch && HOLD_OUTS[low(e.title)]) {
        const p = protOf(ch);
        state = 'hold_' + ((ch.fields || {}).hamile ? 'icine' : p.condom ? 'kondom' : p.nothing ? 'icine' : p.pill ? 'hap' : p.pullout ? 'pullout' : p.morning ? 'sabah' : 'dikkat');
      }
      // 🚪 bu turda ilk önden giriş: korunmasına göre ("Kondomsuz giriyorsun… dışarı boşal tamam mı canım? 🥺")
      if (!state && ch && evs[0] && isPos(evs[0]) && (evs[0].tags || []).some(t => low(t) === 'vajinal') && !(ch.fields || {}).hamile) {
        const gd = th.giris = th.giris || {};
        if (!gd[ch.id]) {
          gd[ch.id] = 1;
          const p = protOf(ch);
          state = p.condom ? 'giriskondomlu' : p.nothing ? 'girisicine' : p.pill ? 'girishap' : p.pullout ? 'girispullout' : p.morning ? 'girissabah' : 'girisdikkat';
        }
      }
      // 💔 izinsiz / istenmeyen olanlar güveni sarsar
      const HURT = { hamilekaldi_istemedi: [['güven', -8], ['aşk', -3]], pulloutkacti: [['güven', -5]], girisdikkat: [['güven', -3]], riskli: [['güven', -2]] };
      const hurt = HURT[state] || (/^izin_red_/.test(state) ? [['güven', -3]] : null);
      if (hurt && ch) {
        const fx = hurt.map(([l, d]) => { const pp = allParams().find(x => x.who !== 'me' && low(x.label) === l); return pp && { p: 'p:' + pp.id, d }; }).filter(Boolean);
        if (fx.length) applyOutcome({ text: '', effects: fx }, [ch.id]);
      }
      if (!state && evs[0] && isPos(evs[0]) && i0 > 0) {
        let prev = null;
        for (let i = i0 - 1; i >= 0 && !prev; i--) { const x = list[i].ev && all.find(y => y.id === list[i].ev); if (x && isPos(x)) prev = x; }
        const cc = low(catOfEv(evs[0]).label);
        if (prev && low(catOfEv(prev).label) !== cc && LIA_PHASES.some(p => p.cat === cc)) state = 'gecis' + cc;
      }
      if (!state && (isPos(e) || cum || low(e.title) === 'orgazm') && i0 >= 0) {
        const n = list.slice(0, i0).filter(x => x.ev === e.id).length;
        state = n === 0 ? 'ilkkez' : n >= 2 ? 'hepbunu' : 'yine';
        stateP = .5;
      }
      // 💧 ardından gelen miktar / yoğunluk olayları da gider: "… miktar Thick White Cumming Hyper-concentrated (4/4)"
      const sizes = cum ? evs.filter(x => low(catOfEv(x).label) === 'cumming size').map(x => x.title) : [];
      // 💦 onun orgazmında ardından gelen Woter / Milk da gider: "… sivi Squirt Woter Normal Milk"
      const fluids = low(e.title) === 'orgazm' ? evs.filter(x => x !== e && low(catOfEv(x).label) === 'lactation').map(x => x.title) : [];
      botReply({ text: `evt ${(e.tags || []).join(' ')} ${catOfEv(e).label || ''} ${e.title}${fnow ? ` fant ${fantKey(fnow)}` : ''}${mekan}${modq}${pos ? ` poz ${pos.title} ${catOfEv(pos).label || ''}` : ''}${sizes.length ? ` miktar ${sizes.join(' ')}` : ''}${fluids.length ? ` sivi ${fluids.join(' ')}` : ''}` }, { events: true, mood, state, stateP, olay: e.title, climax: cum || low(e.title) === 'orgazm' });
    }
    // 💁‍♀️ Lia önerisine dokununca olay yazılır; 📖 kitabın "İdeal bir seans" bölümü; ✕ kapatır
    $('#evQuick').onclick = e => {
      const b = e.target.closest('[data-qev], [data-q]');
      if (!b || cs.playing) return;
      if (b.dataset.q === 'off') { quickOn(false); const tb = $('[data-tool="quick"]'); if (tb) tb.classList.remove('on'); drawQuick(); notify('Kısayollar kapalı · ⋯ Diğer → ⚡ ile aç', '⚡'); return; }
      const ev = allEvents().find(x => x.id === b.dataset.qev);
      if (ev) askSubs([ev], writeEvents);
    };
    $('#liaBar').onclick = e => {
      const b = e.target.closest('[data-liaev], [data-lia]');
      if (!b || cs.playing) return;
      if (b.dataset.liaev) { const ev = allEvents().find(x => x.id === b.dataset.liaev); if (ev) askSubs([ev], writeEvents); return; }
      if (b.dataset.lia === 'book') return openBook(...bookIdx('İdeal bir seans'));
      if (b.dataset.lia === 'off') { liaOn(false); const tb = $('[data-tool="lia"]'); if (tb) tb.classList.remove('on'); drawLia(); notify('Lia önerileri kapalı · ⋯ Diğer → 💡 ile aç', '💁‍♀️'); }
    };
    // seçilen olay hemen yazılmaz, mesaj kutusunun üstünde bekler: istersen yanına metin yaz ("#Missionary aşkım sana köklüyorum şu an")
    hashSuggest(input, (e, sub) => {
      if (cs.playing) return;
      const add = items => { cs.pend = [...(cs.pend || []), ...items]; drawPend(); input.focus(); };
      if (sub) add([{ e, sub }]);
      else askSubs([e], add);
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
      if (t === 'score') { scoreOn(!scoreOn()); b.classList.toggle('on', scoreOn()); draw(); notify(scoreOn() ? '🎯 Bot puanları görünüyor' : '🎯 Bot puanları gizli', '🤖'); }
      if (t === 'modemusic') { modeMusicOn(!modeMusicOn()); b.classList.toggle('on', modeMusicOn()); notify(modeMusicOn() ? '🎼 Mode olunca müzik kendiliğinden değişir' : '🎼 Moda göre müzik kapalı', '🎵'); }
      if (t === 'sfx') { sfxOn(!sfxOn()); b.classList.toggle('on', sfxOn()); notify(sfxOn() ? '🔔 Efekt sesleri açık' : '🔔 Efekt sesleri kapalı', '🔔'); if (sfxOn()) sfx('match'); }
      if (t === 'boss') bossKey();
      if (t === 'chg') { chgOn(!chgOn()); b.classList.toggle('on', chgOn()); draw(); notify(chgOn() ? '📈 Değer değişimleri mesajlarda görünüyor' : '📈 Değer değişimleri gizli (barlar ve 📊 kart yine gösterir)', '📈'); }
      if (t === 'quick') { quickOn(!quickOn()); b.classList.toggle('on', quickOn()); drawQuick(); notify(quickOn() ? '⚡ Kısayollar açık' : '⚡ Kısayollar kapalı', '⚡'); }
      if (t === 'lia') { liaOn(!liaOn()); b.classList.toggle('on', liaOn()); drawLia(); notify(liaOn() ? 'Lia önerileri açık' : 'Lia önerileri kapalı', '💁‍♀️'); }
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
    // 🕰️ saate dokununca: bu sohbetin şu anki saati, mesaj başına dakika, aç / kapat
    $('#chatClock').onclick = () => {
      clockInit();
      const ck = th.clock;
      const sh = sheet(`
        <div class="sheet-grip"></div>
        <h3>🕰️ Sohbet saati</h3>
        <div class="field" style="margin-top:0"><label>Şu an saat</label><input type="time" id="ckNow" value="${hmText(clockNow())}"></div>
        <div class="field"><label>Mesaj başına dakika <small>· boş bırakırsan genel ayar (${+clockCfg().step || 0} dk)</small></label><input type="number" id="ckStep" min="0" max="240" value="${ck.step != null && ck.step !== '' ? esc(ck.step) : ''}"></div>
        <button class="btn primary block" type="button" id="ckSave" style="margin-top:12px">Kaydet</button>
        <button class="btn ghost block" type="button" id="ckOff" style="margin-top:8px">${ck.off ? '🕰️ Bu sohbette saati aç' : 'Bu sohbette saati kapat'}</button>
        <div class="mo-vars" style="margin-top:10px">Başlangıç saati ve saate bağlı kurallar: Monia → 🎲 Sebep-Sonuç → 🕰️ Saat.</div>`, 'light');
      sh.el.querySelector('#ckSave').onclick = () => {
        const v = sh.el.querySelector('#ckStep').value, day = Math.floor(clockNow() / 1440) * 1440;
        if (v === '') delete ck.step; else ck.step = Math.max(0, +v || 0);
        ck.start = day + hm(sh.el.querySelector('#ckNow').value) - clockStep() * msgCount();
        save(); sh.close(); drawClock();
      };
      sh.el.querySelector('#ckOff').onclick = () => { ck.off = !ck.off; if (!ck.off) ck.done = msgCount(); save(); sh.close(); drawClock(); };
    };
    $('#stCard').onclick = e => {
      // ❤️ 💔 ✅ 🚫 özeti: dokununca listeler açılır / kapanır
      const f = e.target.closest('[data-stfeel]');
      if (f) { const s = ui.stFeel || (ui.stFeel = new Set()); s.has(f.dataset.stfeel) ? s.delete(f.dataset.stfeel) : s.add(f.dataset.stfeel); drawStats(); return; }
      // 👗 kıyafet çipi: giydir; değişince bu sohbette yeniden soyunabilir
      const wr = e.target.closest('[data-stwear]');
      if (wr) { const c0 = byId(wr.dataset.stwear); if (c0) dressSheet(c0, () => { if (th.undress) delete th.undress[c0.id]; save(); drawStats(); }); return; }
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

    /* 👆 uzun basınca hızlı menü: olay kartı (bir daha / kısayola sabitle / düzenle), karakterin avatarı (profil, günlük, klonla, paylaş),
     * diğer mesajlar (hızlı tepki). Basılı tutup bırakınca normal dokunuş menüsü açılmaz */
    let lpT = null, lpXY = null, lpFired = false;
    box.addEventListener('pointerdown', e => {
      const el = e.target.closest('[data-id]');
      if (!el || cs.playing) return;
      lpXY = [e.clientX, e.clientY];
      lpFired = false;
      clearTimeout(lpT);
      lpT = setTimeout(() => { lpFired = true; if (navigator.vibrate) navigator.vibrate(15); longMenu(e.target, el); }, 520);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => box.addEventListener(t, () => clearTimeout(lpT)));
    box.addEventListener('pointermove', e => { if (lpXY && Math.hypot(e.clientX - lpXY[0], e.clientY - lpXY[1]) > 10) clearTimeout(lpT); });
    box.addEventListener('contextmenu', e => { if (e.target.closest('[data-id]')) e.preventDefault(); });
    function longMenu(target, el) {
      const m = list.find(x => x.id === el.dataset.id);
      if (!m) return;
      const ch = m.from === 'her' && ctx.speaker(m);
      if (ch && ch !== GHOST && target.closest('.ava')) return charMenu(ch);
      const e = m.ev && allEvents().find(x => x.id === m.ev);
      if (e) {
        const pins = MO().quickPins || [], pinned = pins.includes(e.id);
        const sh = sheet(`<div class="sheet-grip"></div><h3>${esc(evEmo(e))}${esc(e.title)}</h3>
          <button class="act" data-lm="again">🔁 Bir daha</button>
          <button class="act" data-lm="pin">📌 ${pinned ? 'Kısayoldan çıkar' : 'Kısayola sabitle'}</button>
          <button class="act" data-lm="edit">✏️ Olayı düzenle</button>`, 'light');
        sh.el.onclick = ev => {
          const b = ev.target.closest('[data-lm]');
          if (!b) return;
          sh.close();
          if (b.dataset.lm === 'again') askSubs([e], writeEvents);
          if (b.dataset.lm === 'pin') { MO().quickPins = pinned ? pins.filter(x => x !== e.id) : [e.id, ...pins].slice(0, 8); save(); drawQuick(); notify(pinned ? 'Kısayoldan çıkarıldı' : '📌 Kısayola sabitlendi', '⚡'); }
          if (b.dataset.lm === 'edit') { ui.moReturn = location.hash; location.hash = `#/monia/olay/${encodeURIComponent(e.id)}`; }
        };
        return;
      }
      if (m.from === 'sys' || m.scene) return;
      // hızlı tepki: baloncuğun üstünde küçük bir şerit
      document.querySelectorAll('.lp-react').forEach(x => x.remove());
      const r = el.getBoundingClientRect(), bar = document.createElement('div');
      bar.className = 'lp-react';
      bar.innerHTML = REACTIONS.map(x => `<button type="button" data-r="${x}" class="${m.react === x ? 'on' : ''}">${x}</button>`).join('');
      bar.style.top = `${Math.max(8, r.top - 52)}px`;
      bar.style.left = `${Math.max(8, Math.min(window.innerWidth - 290, m.from === 'me' ? r.right - 280 : r.left + 40))}px`;
      document.body.appendChild(bar);
      const off = ev => { if (!bar.contains(ev.target)) { bar.remove(); document.removeEventListener('pointerdown', off, true); } };
      setTimeout(() => document.addEventListener('pointerdown', off, true), 0);
      bar.onclick = ev => {
        const b = ev.target.closest('[data-r]');
        if (!b) return;
        if (m.react === b.dataset.r) delete m.react; else m.react = b.dataset.r;
        bar.remove();
        save(); draw(m.id);
      };
    }
    // Mesaja dokununca: tepki, cevap ver, düzenle, konuşanı değiştir, araya ekle, taşı, sil
    box.onclick = e => {
      if (lpFired) { lpFired = false; return; }
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
  // 🔁 bot cevaplarında tekrarı önleme: kural başına son seçilen cevaplar (bu tarayıcıda). botRecent(id) → o kuralın listesi, botRecent() → kaydet
  const BOT_RECENT_KEY = 'amor-stories:bot-recent';
  let botRecentMap = null;
  function botRecent(id) {
    if (!botRecentMap) { try { botRecentMap = JSON.parse(localStorage.getItem(BOT_RECENT_KEY) || '{}'); } catch (e) { botRecentMap = {}; } }
    if (id) return botRecentMap[id] || (botRecentMap[id] = []);
    try { localStorage.setItem(BOT_RECENT_KEY, JSON.stringify(botRecentMap)); } catch (e) { /* dolu */ }
    return null;
  }
  // 💬 hitap: {sen} karakterin ❤️ Aşk'ına göre: < 30 adın · 30–69 adın / canım / tatlım · 70+ aşkım / bebeğim / canım (Soğuk ve Resmi konuşur hep adınla)
  function hitapOf(ch) {
    // 🧠 karakter adını öğrendiyse (hafıza) onu kullanır
    const name = ((ch || {}).memory || {}).ad || userName(), has = t => ((ch || {}).traits || []).includes(t);
    if (has('Soğuk') || has('Resmi konuşur')) return name;
    const p = allParams().find(x => x.who !== 'me' && String(x.label).toLocaleLowerCase('tr') === 'aşk'), ask = p && ch ? paramVal(ch, p) : 0;
    return ask >= 70 ? pickOne(['aşkım', 'bebeğim', 'canım', 'aşkım', 'hayatım', 'sevgilim']) : ask >= 30 ? pickOne([name, 'canım', 'tatlım']) : name;
  }
  /* ❔ karakterin soruları ("=sor" + konu) ve cevabın: "evet / hayır" gelince "=cevap" + konu + evet|hayir (+ korunma durumu) kuralı,
   * yes / no: o cevapta tetiklenecek olaylar. ok(ctx): bu soru şimdi sorulabilir mi (cat: şu anki pozisyonun kategorisi) */
  const BOT_ASK = {
    sert: { ok: c => ['forward', 'backward'].includes(c.cat), yes: ['Rough', 'Passionate'], no: ['Gentle'] },
    devam: { ok: c => c.cat === 'foreplay', yes: ['Missionary', 'Cowgirl', 'Spooning'], no: ['Kissing', 'Front Hugging'] },
    agiz: { ok: c => ['outercourse', 'foreplay'].includes(c.cat), yes: ['Blowjob', 'Deepthroat'], no: [] },
    arka: { ok: c => c.cat === 'forward', yes: ['Standing Anal', 'Spooning Anal', 'Cowgirl Anal'], no: [] },
    yala: { ok: c => ['foreplay', 'outercourse'].includes(c.cat), yes: ['Cunnilingus'], no: [] },
    icine: { ok: c => c.vaj && c.zevk >= 55, yes: [], no: [] },
    tekrar: { ok: c => c.done, yes: ['Kissing', 'Lap Kissing'], no: ['Front Hugging', 'Back Hugging'] },
    // 💦 boşalmadan sonra yeni pozisyon isteği: "İstersen bu kez arkama gir 😈" (anal sevmiyorsa sorulmaz) · "Bir dahakine nasıl istersin?"
    arkaistek: { ok: c => c.done, yes: ['Standing Anal', 'Spooning Anal', 'Cowgirl Anal', 'Rough Anal'], no: ['Back Hugging', 'Front Hugging'] },
    pozistek: { ok: c => c.done, yes: '@other', no: ['Back Hugging', 'Front Hugging'] },
    // "Beğendin mi?": evet → şu anki pozisyonla devam (@pos), hayır → başka bir pozisyon (@other, önce ❤️ sevdikleri)
    begen: { ok: c => ['forward', 'backward', 'outercourse', 'eat', 'foreplay'].includes(c.cat), yes: '@pos', no: '@other' }
  };
  const SEX_CATS = ['forward', 'backward', 'outercourse', 'eat'];
  // ❓ özel sorular (🤝 Güven ≤ 15 iken kaçamak cevap): kural kimliğinin başı
  const QPRIVATE = ['r_q_boob', 'r_q_pussy', 'r_q_anal', 'r_q_butt', 'r_q_exp', 'r_q_virgin', 'r_q_sever', 'r_q_sevmez', 'r_q_korunma', 'r_q_hamile',
    'r_q2_pozisyon', 'r_q2_fantezi', 'r_q2_bosal', 'r_q2_bebek', 'r_q2_ilk', 'r_q2_gecmis', 'r_q2_seks', 'r_q2_hassas', 'r_q2_anal', 'r_q2_oral',
    'r_q2_kondom', 'r_q2_hap', 'r_q2_azgin', 'r_q2_sut', 'r_q2_kiyafet', 'r_q2_sertyavas', 'r_q2_orgazmsay', 'r_q2_bosalmasay',
    'r_q2_disaribosal', 'r_q2_kondomsuz', 'r_q2_kiyas', 'r_q2_boy', 'r_q2_son', 'r_q2_kackez', 'r_q2_yut', 'r_q2_yuz', 'r_q2_hamilebirak', 'r_q2_arkadan', 'r_q2_mastur', 'r_q2_oyuncak', 'r_q2_baglan', 'r_q3_'];
  // ❓ cevaptan sonraki karşı soru konusu (kural kimliğinin başı → "=sor" konusu); yoksa k_genel
  const QCOUNTER = [['r_q_boob', 'k_buyuk'], ['r_q_pussy', 'k_dar'], ['r_q_anal', 'k_anal'], ['r_q2_anal', 'k_anal'], ['r_q_butt', 'k_kalca'],
    ['r_q_exp', 'k_deneyim'], ['r_q_virgin', 'k_deneyim'], ['r_q2_ilk', 'k_deneyim'], ['r_q2_gecmis', 'k_deneyim'], ['r_q_sever', 'k_sever'], ['r_q2_pozisyon', 'k_sever'],
    ['r_q2_fantezi', 'k_fantezi'], ['r_q2_sevgi', 'k_sevgi'], ['r_q2_ozledin', 'k_sevgi'], ['r_q2_kiskanc', 'k_kiskanc'], ['r_q2_sevgili', 'k_kiskanc'],
    ['r_q2_bebek', 'k_bebek'], ['r_q_hamile', 'k_bebek'], ['r_q2_bosal', 'k_icine'], ['r_q2_oral', 'k_oral'], ['r_q2_sertyavas', 'k_sert'],
    ['r_q2_disaribosal', 'k_icine'], ['r_q2_kondomsuz', 'k_icine'], ['r_q2_hamilebirak', 'k_bebek'], ['r_q2_kiyas', 'k_kiyas'], ['r_q2_boy', 'k_boy'],
    ['r_q2_yut', 'k_oral'], ['r_q2_arkadan', 'k_anal'], ['r_q2_oyuncak', 'k_fantezi'], ['r_q2_baglan', 'k_fantezi'], ['r_q2_yer', 'k_yer'],
    ['r_q3_meme', 'k_buyuk'], ['r_q3_sut', 'k_bebek'], ['r_q3_kalca', 'k_kalca']];
  // 🎭 soru cevabının kişiliğe göre çerçevesi (pre başa, add cevabın sonuna)
  const QFRAME = {
    'Utangaç': { pre: ['S-söylemem gerekiyor mu? 🙈 ', 'Utanıyorum ama… ', 'Ş-şey… '] }, 'Kibirli': { add: [' kıskandın mı? 💅', ' etkilendin değil mi? 💁‍♀️'] },
    'Flörtöz': { add: [' neden sordun bakalım? 😘', ' merak ettin demek 😉'] }, 'Alaycı': { pre: ['Bunu mu merak ettin? 🙄 ', 'Ciddi soru mu bu? 😏 '] },
    'Çocuksu': { pre: ['Hihi ', 'Yaa '] }, 'Duygusal': { add: [' 🥺', ' bunu sorman çok tatlı 😢💗'] }, 'Romantik': { add: [' …sana söyleyebilirim 💞', ' sadece sana söylüyorum 🌹'] },
    'Neşeli': { add: [' 😄', ' hihi 😆'] }, 'Şımarık': { add: [' ama önce iltifat etmeliydin 💅', ' hmpf 😤'] }, 'Asi': { pre: ['Sana ne? 😤 Neyse… ', 'Merak etme, söylerim: '] },
    'Özgüvenli': { add: [' 😎', ' başka sorun var mı? 😏'] }, 'Gizemli': { pre: ['Bu bir sır ama… ', 'Kimseye söyleme: '] }, 'Komik': { add: [' 😂', ' (bunu yazdığıma inanamıyorum)'] },
    'Güvensiz': { add: [' …bu kötü mü? 😟', ' sence sorun mu? 🥺'] }, 'Gergin': { pre: ['Ş-şey… ', '*boğazını temizler* '] }, 'Meraklı': { add: [' Peki seninki? 🤔'] },
    'Manipülatif': { add: [' …bunu sana bir iyilik olarak söylüyorum 😏'] }, 'Dürüst': { pre: ['Açık konuşayım: '] }
  };
  // "evet / hayır" cevabı mı? (kısa mesajda)
  function yesNo(text) {
    const w = String(text || '').toLocaleLowerCase('tr').replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    if (!w.length || w.length > 6) return '';
    const NO = ['hayır', 'hayir', 'yok', 'istemem', 'istemiyorum', 'olmaz', 'yapma', 'dur', 'sonra', 'no', 'ıh', 'ıhı', 'asla', 'değil', 'degil', 'beğenmedim', 'begenmedim', 'kötü', 'kotu', 'değiştir', 'degistir', 'başka', 'baska', 'sıkıldım', 'sikildim'];
    const YES = ['evet', 'eveet', 'tabi', 'tabii', 'tabiki', 'olur', 'aynen', 'hıhı', 'tamam', 'istiyorum', 'isterim', 'hadi', 'kesinlikle', 'he', 'ok', 'okey', 'elbette', 'evt', 'yes', 'olsun', 'lütfen',
      'çok', 'cok', 'bayıldım', 'bayildim', 'beğendim', 'begendim', 'harika', 'süper', 'super', 'güzel', 'guzel', 'mükemmel', 'mukemmel', 'iyi', 'devam', 'durma', 'muhteşem', 'muhtesem', 'evettt'];
    if (w.some(x => NO.includes(x))) return 'hayir';
    if (w.some(x => YES.includes(x))) return 'evet';
    return '';
  }
  /* 🎭 kişilik ve ⌨️ yazım tarzı: kişilik cevaba bazen küçük bir ek yapar; yazım tarzı her cevabı dönüştürür */
  const PERSONA = {
    'Neşeli': { add: [' 😄', ' hihi 😊'] }, 'Alaycı': { add: [' …ama fena değil 😏', ' 🙄'], p: .3 }, 'Flörtöz': { add: [' 😘', ' 😉'] },
    'Romantik': { add: [' 💞', ' 🌹'] }, 'Asi': { add: [' 😤', ' kimse bana karışamaz 😤'], p: .3 }, 'Gergin': { pre: ['*gergin gergin gülümser* ', 'Ş-şey… '], p: .3 },
    'Meraklı': { add: [' Sen ne düşünüyorsun? 🤔', ' Peki sen? 👀'], p: .25 }, 'Gizemli': { add: [' …belki 🤫', ' sonra anlatırım 😶‍🌫️'], p: .25 },
    'Şımarık': { add: [' hmpf 😤', ' ama şımart beni 💅'] }, 'Çocuksu': { add: [' hihi 🙈', ' yaa 🥺'] }, 'Kibirli': { add: [' tabii ki 💅', ' ben buyum 💁‍♀️'], p: .35 },
    'Duygusal': { add: [' 🥺', ' 😢💗'] }, 'Komik': { add: [' 😂', ' (gülmekten öldüm)'], p: .35 }, 'Güvensiz': { add: [' …bu iyi mi? 😟', ' doğru mu yapıyorum? 🥺'], p: .3 },
    'Özgüvenli': { add: [' 😎', ' biliyorum zaten 😏'], p: .3 }, 'Manipülatif': { add: [' …ama sonra bana borçlusun 😏', ' bunu unutmam 😈'], p: .3 },
    'Sadık': { add: [' sadece seninim 💗'], p: .2 }, 'Korumacı': { add: [' seni kimseye vermem 🛡️'], p: .2 }, 'İnatçı': { add: [' ama son sözü ben söylerim 😤'], p: .2 },
    'Kıskanç': { add: [' …başka kimseyle böyle konuşmuyorsun değil mi? 😤', ' sadece benimsin 😠', ' kimseye bakma 😒'], p: .3 },
    'Sakin': { pre: ['*sakince* ', 'Acele etmeyelim… '], add: [' 😌', ' her şey yolunda 🍃'], p: .3 },
    'Mantıklı': { pre: ['Mantıklı düşünürsek, ', 'Açıkçası '], add: [' …mantıklı, değil mi? 🤔'], p: .25 },
    'Ciddi': { pre: ['Ciddiyim, '], add: [' Ciddiyim.', ' 😐'], p: .25 },
    'Alçakgönüllü': { add: [' …ama ben pek bir şey yapmadım 🙈', ' sen benden daha iyisin 😊', ' abartma ama 😅'], p: .3 },
    'Olgun': { add: [' 🙂', ' bunu konuşabiliriz'], p: .2 }, 'Dürüst': { pre: ['Açık konuşayım: ', 'Dürüst olayım, '], p: .2 }
  };
  /* 🧠 karakter hafızası (c.memory): senin mesajlarından öğrendikleri: ad, yaş, şehir, iş, evcil hayvan, en sevdiğin şeyler, sevdiğin / sevmediğin şeyler.
   * {hatıra} bunlardan birini anar ("Kahveyi sevdiğini unutmadım 😏"); yeni bir şey öğrenince bazen "not ettim" der */
  const MEM_STOP = ['seni', 'beni', 'onu', 'bunu', 'şunu', 'sizi', 'hepsini', 'herşeyi', 'her', 'şeyi', 'de', 'da', 've', 'çok', 'sensin', 'seninle', 'bence', 'ben', 'sen', 'hep', 'hiç', 'ama', 'yine', 'bura', 'ora', 'şura', 'yurt', 'site', 'apartman', 'kendi'];
  const MEM_RE = [
    ['ad', /(?:^|\s)ad[ıi]m\s+(\p{L}{2,})/u], ['yas', /(\d{2})\s*yaşında(?:yım|yim)/u],
    ['sehir', /(\p{L}{3,})['’]?(?:da|de|ta|te)\s+(?:yaşıyorum|oturuyorum)/u],
    ['is', /(\p{L}{3,}(?:\s\p{L}{3,})?)\s+olarak\s+çalışıyorum/u], ['is', /mesleğim\s+(\p{L}{3,}(?:\s\p{L}{3,})?)/u],
    ['pet', /(kedim|köpeğim|kuşum|tavşanım|balığım)\s+var/u], ['fav', /en\s+sevdiğim\s+(\p{L}{3,})\s+(\p{L}{2,}(?:\s\p{L}{2,})?)/u],
    ['sever', /(\p{L}{3,}(?:\s(?!çok\s)\p{L}{3,})?)\s+(?:çok\s+)?(?:severim|seviyorum|bayılırım|bayılıyorum)/u],
    ['sevmez', /(\p{L}{3,}(?:\s(?!hiç\s)\p{L}{3,})?)\s+(?:hiç\s+)?(?:sevmem|sevmiyorum|nefret ederim)/u]
  ];
  const capTr = s => String(s).charAt(0).toLocaleUpperCase('tr') + String(s).slice(1);
  // öğren: yeni bir şey öğrendiyse "not ettim" cümlesi, yoksa ''
  function learnFacts(c, text) {
    const t = String(text || '').toLocaleLowerCase('tr').replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim(), m = c.memory = c.memory || { sever: [], sevmez: [], fav: {} };
    let ack = '';
    const ok = s => s && !s.split(' ').some(w => MEM_STOP.includes(w));
    MEM_RE.forEach(([k, re]) => {
      const r = re.exec(t);
      if (!r || ack) return;
      const v = r[1];
      if (k === 'ad' && ok(v) && m.ad !== capTr(v)) { m.ad = capTr(v); ack = pickOne([`${m.ad}… güzel isim, unutmam 😊`, `${m.ad} demek 😏 aklımda`]); }
      if (k === 'yas' && m.yas !== v) { m.yas = v; ack = `${v} yaşındasın demek, not ettim 😏`; }
      if (k === 'sehir' && ok(v) && m.sehir !== capTr(v)) { m.sehir = capTr(v); ack = `${trEk(m.sehir, 'de')}… not ettim 📍`; }
      if (k === 'is' && ok(v) && m.is !== v) { m.is = v; ack = pickOne([`${capTr(v)} demek… etkileyici 😏`, `${capTr(v)} olarak çalışıyorsun, aklımda 💼`]); }
      if (k === 'pet' && m.pet !== v) { m.pet = v; ack = `${capTr(v)} var demek, onu da seveceğim 🐾`; }
      if (k === 'fav' && ok(r[2]) && m.fav[v] !== r[2]) { m.fav[v] = r[2]; ack = `En sevdiğin ${v} ${r[2]}… aklımda 😌`; }
      if (k === 'sever' && ok(v) && !m.sever.includes(v)) { m.sever = [v, ...m.sever].slice(0, 8); ack = pickOne([`${capTr(v)} seviyorsun… not ettim 😏`, `Demek ${v} seviyorsun 😊 unutmam`]); }
      if (k === 'sevmez' && ok(v) && !m.sevmez.includes(v)) { m.sevmez = [v, ...m.sevmez].slice(0, 8); ack = `${capTr(v)} sevmiyorsun, tamam 🙈 aklımda`; }
    });
    return ack;
  }
  function hatira(c) {
    const m = (c || {}).memory || {}, out = [];
    if (m.ad) out.push(`Adının ${m.ad} olduğunu unutur muyum hiç 😌`);
    if (m.yas) out.push(`${m.yas} yaşındasın, hatırlıyorum 😏`);
    if (m.sehir) out.push(`${trEk(m.sehir, 'de')} yaşıyorsun, bir gün gelirim belki 😏`);
    if (m.is) out.push(`${capTr(m.is)} olarak çalışıyorsun, yorulmuyor musun? 💼`);
    if (m.pet) out.push(`${capTr(m.pet)} nasıl? Ona selam söyle 🐾`);
    Object.entries(m.fav || {}).forEach(([k, v]) => out.push(`En sevdiğin ${k} ${v}, değil mi? 😊`));
    (m.sever || []).forEach(v => out.push(`${capTr(v)} sevdiğini unutmadım 😏`));
    (m.sevmez || []).forEach(v => out.push(`${capTr(v)} sevmediğini biliyorum 🙈`));
    return out.length ? pickOne(out) : '';
  }
  // 😤 başka bir kızdan / karakterden bahsetti mi? (adı ya da "eski sevgilim", "başka bir kız"…) → anılan ad
  const jealousOf = c => (c.traits || []).includes('Kıskanç') || relV(c, 'kıskançlık') >= 50;
  function otherMention(text, ch) {
    const n = Stories.Bot.norm(text);
    const o = chars().find(x => x.id !== ch.id && x.name && x.name.split(' ')[0].length >= 3 && n.includes(' ' + Stories.Bot.norm(x.name.split(' ')[0]).trim()));
    if (o) return o.name.split(' ')[0];
    return / (eski sevgili|başka bir kız|başka kız|kız arkadaşım|bir kızla|biriyle tanıştım|eski karım|eski sevgilim) /.test(n) ? 'o kız' : '';
  }
  // 💕 sevgi sözcükleri: ❤️ Aşk 30+ iken cevaplara bazen "canım / tatlım", 70+ iken "aşkım / bebeğim / hayatım" (Soğuk ve Resmi konuşan hariç; zaten varsa eklenmez)
  const PET_RE = /(canım|aşkım|tatlım|bebeğim|hayatım|sevgilim|güzelim)/iu;
  function petParts(parts, ch) {
    const tr = (ch || {}).traits || [], a = relV(ch || {}, 'aşk');
    if (!parts.length || a < 30 || tr.includes('Soğuk') || tr.includes('Resmi konuşur') || parts.some(p => PET_RE.test(p)) || Math.random() > (a >= 70 ? .4 : .25)) return;
    const pet = pickOne(a >= 70 ? ['aşkım', 'bebeğim', 'canım', 'hayatım', 'sevgilim', 'aşkım'] : ['canım', 'tatlım', 'canım']);
    const i = Math.floor(Math.random() * parts.length), p = parts[i], tail = /([\s\p{Extended_Pictographic}‍️]+)$/u.exec(p);
    parts[i] = Math.random() < .35 && /^\p{Lu}/u.test(p) ? `${capTr(pet)}, ${p.charAt(0).toLocaleLowerCase('tr')}${p.slice(1)}` : tail && tail.index > 0 ? `${p.slice(0, tail.index)} ${pet}${tail[0]}` : `${p} ${pet}`;
  }
  // ⌨️ Uzun yazar: cevabına bir cümle daha ekler
  const LONG_TAIL = [' Bunu söylerken bile kalbim hızlandı, inanır mısın?', ' Aslında anlatmak istediğim çok şey var ama nereden başlasam bilmiyorum.', ' Seninle konuşmak bana iyi geliyor, bunu bil.',
    ' Bütün gün aklımdaydın, sonunda yazabildim.', ' Biliyorum uzun yazıyorum ama sana her şeyi anlatmak istiyorum.', ' Ne zamandır böyle hissetmiyordum, gerçekten.', ' Sonra bunu bir daha konuşalım mı, uzun uzun?',
    ' Bazen ne düşündüğümü sana yazmadan anlayamıyorum.', ' Gülümseyerek yazıyorum şu an, görmeni isterdim.', ' Kafamda bin tane düşünce var ve hepsi sende bitiyor.'];
  const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}️‍]/gu;
  // serious: kırgın / ciddi cevap (ör. kabalığa) → kişilik eki yapılmaz, sadece yazım tarzı uygulanır
  function personaParts(parts, ch, serious) {
    const tr = new Set((ch || {}).traits || []), last = () => parts.length - 1;
    Object.entries(PERSONA).forEach(([t, f]) => {
      if (serious || !tr.has(t) || Math.random() > (f.p || .4)) return;
      if (f.pre) parts[0] = pickOne(f.pre) + parts[0];
      // cevapta zaten varsa (ör. 😘) tekrar eklenmez
      const a = f.add && pickOne(f.add);
      if (a && !parts[last()].includes(a.trim())) parts[last()] += a;
    });
    if (tr.has('Kısa yazar')) parts.splice(1);
    if (tr.has('Uzun yazar') && !serious && Math.random() < .55) parts[last()] += pickOne(LONG_TAIL);
    if (tr.has('Argo kullanır') && Math.random() < .3) parts[last()] += pickOne([' lan', ' ya', ' yaa amk 😅']);
    if (tr.has('Çok güler (sjsjsj)') && Math.random() < .4) parts[last()] += pickOne([' sjsjsj', ' ksksks', ' asdfgh']);
    if (tr.has('Emoji sever') && !serious && Math.random() < .7) parts[last()] += pickOne([' 😍✨', ' 🥰💕', ' 😚💖', ' 🙈💫']);
    if (tr.has('Sesli mesaj sever') && Math.random() < .25) parts[0] = '🎤 ' + parts[0];
    parts.forEach((p, i) => {
      let s = p;
      if (tr.has('Emoji kullanmaz') || tr.has('Soğuk')) s = s.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim() || p;
      if (tr.has('Noktalama kullanmaz')) s = s.replace(/[.,!?…;:]+/g, '').replace(/\s{2,}/g, ' ').trim();
      if (tr.has('Harf uzatır (canımmm)') && i === parts.length - 1 && Math.random() < .6) s = s.replace(/(\p{L})(?=[^\p{L}]*$)/u, '$1$1$1');
      if (tr.has('Hep küçük harf')) s = s.toLocaleLowerCase('tr');
      parts[i] = s;
    });
  }
  // 🗣️ bot modunda komut kuralı (bot-rules.js "🗣️ Komutlar", r_cmd_*) → tetiklenecek olaylar (adlarıyla; biri seçilir)
  const CMD_EV = {
    r_cmd_sert: ['Rough', 'Passionate', 'Brutal'], r_cmd_yavas: ['Gentle'], r_cmd_don: ['Doggy', 'Standing doggy'], r_cmd_ustume: ['Cowgirl'],
    r_cmd_gel: ['Lap Kissing', 'Front Hugging'], r_cmd_op: ['Kissing', 'Lap Kissing'], r_cmd_saril: ['Front Hugging', 'Back Hugging'],
    r_cmd_em: ['Blowjob', 'Deepthroat'], r_cmd_yala: ['Cunnilingus'], r_cmd_arka: ['Standing Anal', 'Spooning Anal', 'Cowgirl Anal'],
    r_cmd_goster: ['Show Tits', 'Show Ass'], r_cmd_otur: ['Facesitting'], r_cmd_gogus: ['Titfuck'],
    r_cmd_meme: ['Show Tits'], r_cmd_kalca: ['Show Ass'], r_cmd_kaldir: ['Doggy', 'Standing doggy'], r_cmd_dizcok: ['Blowjob', 'Deepthroat'],
    r_cmd_agiz: ['Blowjob', 'Deepthroat'], r_cmd_hotdog: ['Hotdogging'], r_cmd_emzir: ['Breastfeeding'], r_cmd_rtit: ['Reverse Titfuck'], r_cmd_rtit2: ['Reverse Titfuck'], r_cmd_yat: ['Missionary'], r_cmd_gir: ['Missionary', 'Cowgirl', 'Spooning', 'Doggy']
  };
  /* 🎭 ton: fantezi son 30 mesajda olduysa, Mode'lardan en sonuncusu hep (p: olasılık). pre başa, add sona eklenir */
  const FLAVOR = [
    { key: 'cat girl', add: [' miyav 🐱', ' mrrr~ 🐾', ' *patisiyle dokunur* 🐾'], p: .6 },
    { key: 'bunny girl', add: [' 🐰', ' *kulaklarını oynatır* 🐰', ' *zıplar* 🐇'] },
    { key: 'fox girl', add: [' 🦊', ' *kurnazca sırıtır* 🦊'] },
    { key: 'doggy girl', add: [' hav! 🐶', ' efendim 🐾', ' *kuyruğunu sallar* 🐶'], p: .6 },
    { key: 'unicorn girl', add: [' 🦄✨', ' *parıldar* 🦄'] },
    { key: 'bondage', pre: ['*ellerim bağlı* ', '*iplere yaslanarak* ', '*kıpırdayamıyorum* '] },
    { key: 'cheating', pre: ['Şşş… duyacaklar, ', '*fısıldayarak* ', 'Sevgilim aramadan… '] },
    { key: 'sex toys', add: [' *vızzz* 🍆', ' *oyuncak titriyor* 🍆'] },
    { key: 'belly bulge', add: [' *karnını tutar* 😳'] },
    { key: 'cumflation', add: [' *karnı şişti* 😳💦'] },
    // 🎭 rol yapma: sana rolündeki gibi hitap eder
    { key: 'patron', pre: ['Patronum… ', 'Efendim, ', '*eteğini düzeltir* '], add: [' 💼'] },
    { key: 'hoca', pre: ['Hocam… ', '*kitaplarını bırakır* ', 'Hocam, '], add: [' 🎓'] },
    { key: 'kadın hoca', pre: ['Öğrencim… ', '*gözlüğünü indirir* ', 'Bak bakalım öğrencim, ', '*kalemiyle dudağına dokunur* '], add: [' 👩‍🏫'] },
    { key: 'doktor', pre: ['Doktor bey… ', '*önlüğünü çıkarır* '], add: [' 🩺'] },
    { key: 'polis', pre: ['Memur bey… ', '*kelepçelerini şakırdatır* '], add: [' 🚓'] },
    { key: 'yeni komşu', pre: ['Komşucuğum… ', 'Şşş, duvarlar ince… '], add: [' 🏠'] },
    { key: 'hizmetçi', pre: ['Efendim… ', '*önlüğünü düzeltir* '], add: [' 🧹'] },
    { key: 'masöz', add: [' *yağlı ellerle*', ' *omuzlarına bastırır*', ' 💆'] },
    { key: 'gentle', mode: true, add: [' 💕', ' 🥰'] },
    { key: 'passionate', mode: true, add: [' 🔥', ' 💋'] },
    { key: 'assertive', mode: true, pre: ['*kontrolü ele alır* ', '*seni yatağa iter* '] },
    { key: 'rough', mode: true, pre: ['*nefes nefese* '], add: ['!', ' 🔥'] },
    { key: 'brutal', mode: true, pre: ['*soluk soluğa* ', '*çığlık atarak* '], add: ['!!'], p: .6 },
    { key: 'inletmeli', mode: true, add: [' ahh~', ' mmh~'] },
    { key: 'bağırtmalı', mode: true, pre: ['*bağırarak* '] },
    { key: 'ağlatmalı', mode: true, add: [' 😭', ' *gözleri yaşlı*'] }
  ];
  /* bot cevabındaki yer tutucular (karaktere göre doldurulur):
   * {ö:Boob Size} özelliğin değeri ("Boob Size: 95" → 95) · {sever} / {sevmez} ❤️ / 💔 olaylarından 1-2 tanesi ·
   * {izin} / {izinyok} ✅ / 🚫 olayları · {olay} cevap verilen olayın adı · {cevap:yaş} {cevap:şehir} {cevap:hamile} hazır cümle */
  // cevabı kendi içinde kişiliğe göre değişen kurallar: 🎭 kişilik kuralları öne geçmez
  const PK_OWN = new Set(['r_ev_breast', 'r_sx2_bosal']);
  const BOT_ANS = {
    'yaş': ch => ch.age ? pickOne([`${ch.age} yaşındayım 😊`, `${ch.age}… genç sayılırım değil mi? 😏`, `${ch.age} yaşındayım, neden sordun? 😌`]) : pickOne(['Yaşımı söylemem 😏', 'Kadına yaş sorulmaz 😌']),
    'şehir': ch => { const ben = s => s + ({ ı: 'yım', i: 'yim', u: 'yum', ü: 'yüm', a: 'yım', e: 'yim' })[s.slice(-1)];
      return ch.city ? pickOne([`${ben(trEk(ch.city, 'li'))} 😊`, `${ch.city}… gelmek ister misin? 😏`, `Ben ${ben(trEk(ch.city, 'de'))} 🏙️`]) : pickOne(['Bir yerlerden işte 😏', 'Söylesem gelir misin? 😌']); },
    hamile: ch => (ch.fields || {}).hamile ? pickOne(['Evet… hamileyim 🥺💗', 'Evet, karnımda bebeğimiz var 🤰', 'Evet… senden 🙈💕']) : pickOne(['Hayır, değilim… şimdilik 😏', 'Hayır 😌 ama dikkatli ol', 'Değilim… istiyor musun yoksa? 🙈']),
    // 🛡️ nereye boşalayım: korunmasına göre
    'boşal': ch => {
      if ((ch.fields || {}).hamile) return pickOne(['Zaten hamileyim, içime 😈💦', 'İçime… korkacak bir şey kalmadı 😏']);
      const ok = t => evAllowed(ch, t);
      if (ok('control pill')) return pickOne(['İçime, hap alıyorum 😈', 'İçime boşal, merak etme hap içiyorum 😏💦']);
      if (ok('nothing')) return pickOne(['İçime… hepsini istiyorum 🥵', 'Sorma bile, içime 😩💦']);
      if (ok('morning-after pill')) return pickOne(['İçime… sabah hap alırım 😳', 'İçime olsun, sabah hallederim 😏']);
      if (ok('pull-out method')) return pickOne(['Dışarı… göğüslerime 😏', 'Karnıma boşal, içime değil 😳', 'Son anda çek, ağzıma ver istersen 😈']);
      if (ok('condom') || ok('tight condom')) return pickOne(['Kondomla içime, kondomsuz asla 😳', 'Kondom taktıysan içime 😏']);
      return pickOne(['İçime olmaz, korunmuyoruz 😳', 'Dışarı, nereye istersen ama içime değil 😏']);
    },
    // ❤️ 🤝 😤 ilişki değerleri
    sevgi: ch => { const a = relV(ch, 'aşk'); return a >= 80 ? pickOne(['Deli gibi seviyorum 💞', 'Bunu sormana gerek var mı? Seni seviyorum 💗']) : a >= 50 ? pickOne(['Galiba evet… 💗', 'Seni seviyorum sanırım 🙈💕']) : a >= 20 ? pickOne(['Senden hoşlanıyorum 🙈', 'Kalbim bir şeyler söylüyor… 😌']) : pickOne(['Henüz bilmiyorum… 🤔', 'Biraz erken değil mi? 😅']); },
    'güven': ch => { const g = relV(ch, 'güven'); return g >= 70 ? pickOne(['Sana tamamen güveniyorum 🤝💗', 'Hem de çok 🥰']) : g >= 35 ? pickOne(['Güvenmeye başladım 😌', 'Evet… çoğu zaman 🙂']) : pickOne(['Henüz tam değil 😕', 'Bunu kazanman lazım 😏']); },
    'kıskanç': ch => { const k = relV(ch, 'kıskançlık'), t = (ch.traits || []).includes('Kıskanç'); return t || k >= 50 ? pickOne(['Hem de nasıl 😤', 'Başka kıza bakarsan görürsün 😠', 'Seni kimseyle paylaşamam 😤']) : pickOne(['Pek kıskanç değilimdir 😌', 'Biraz… belki 😏', 'Sana güveniyorum, kıskanmam 🙂']); },
    'özledin': ch => { const a = relV(ch, 'aşk'); return a >= 50 ? pickOne(['Çok özledim 🥺💗', 'Her dakika aklımdaydın 💭']) : pickOne(['Biraz 😏', 'Belki 🙈']); },
    'evlen': ch => { const a = relV(ch, 'aşk'); return a >= 80 ? pickOne(['Evet! 💍🥺', 'Bunu bekliyordum… evet 💞']) : a >= 50 ? pickOne(['Biraz erken ama… düşünürüm 🙈', 'Belki bir gün 💍😌']) : pickOne(['Daha çok erken 😅', 'Önce bir kahve içelim 😂']); },
    'sevgili': ch => (ch.traits || []).includes('Sadık') || relV(ch, 'aşk') >= 50 ? pickOne(['Sadece sen varsın 💗', 'Kimse yok, sadece sen 🥰']) : pickOne(['Şu an kimse yok… 😏', 'Neden sordun, aday mısın? 😉']),
    // 🤰 bebek / süt
    bebek: ch => (ch.fields || {}).hamile ? pickOne(['Zaten yolda 🤰💗', 'Bebeğimiz geliyor bile 🥺']) : evAllowed(ch, 'control pill') ? pickOne(['Şimdilik hap içiyorum, erken 😌', 'Bir gün… ama şimdi değil 🙈']) : evAllowed(ch, 'nothing') ? pickOne(['Seninle olsa… neden olmasın 🥺', 'Hiç korunmuyorum zaten 😏🍼']) : pickOne(['Şimdi değil, dikkatli olalım 😳', 'Henüz hazır değilim 🙈']),
    'süt': ch => { const s = relV(ch, 'süt');
      if (!(ch.fields || {}).hamile) return pickOne(['Hamile değilim ki 😅', 'Hamile kalırsam olur 😏', 'Şimdilik yok… ama beni hamile bırakırsan 🍼😈', 'Yok canım 🙈 hamile değilim', 'Daha değil… istiyor musun yoksa? 😏🍼', 'Süt mü? Önce bebek lazım 😂']);
      return s >= 70 ? pickOne(['Göğüslerim taşıyor, sütüm var 🍼🥵', 'Hem de çok… sızdırıyorum bile 😩🍼', 'Evet, dolu dolu… emersen rahatlarım 🥺', 'Tişörtüm ıslandı bak 🙈🍼', 'Sağmazsan patlayacaklar 😩'])
        : s >= 30 ? pickOne(['Evet, göğüslerim dolu 🍼', 'Sızlıyor bile… emmek ister misin? 😏', 'Var… tadına bakmak ister misin? 😈🍼', 'Geliyor, sıkınca damlıyor 😳'])
        : pickOne(['Biraz geliyor 🍼', 'Henüz az 🙈', 'Damla damla… daha yeni başladı 😳', 'Az ama tatlı 😏🍼']); },
    // 🍒 meme: emmek / yalamak / dokunmak / ısırmak / uçları. Göğüs bedeni, hamilelik ve 🍼 Süt, kişilik
    // 🙏 içine boşalmak için ısrar: korunmasına ve kaçıncı ısrar olduğuna göre (Pull-Out: önce "hayır, tut", 3. ısrarda Aşk 70+ ise yumuşar)
    'ısrar': (ch, ctx) => {
      const s = hitapOf(ch), n = ctx.israr || 1, k = (ch.fields || {}).hamile ? 'koricine' : ctx.kor, a = relV(ch, 'aşk');
      if (k === 'koricine' || k === 'korhap') return pickOne([`Boşal içime ${s}, rahatla 😩💦`, 'Tutma artık, hepsini içime ver 🥵', `Hadi rahatla ${s}, hak ettin bunu 😈`, 'İçimde rahatlamak istiyorsan hiç tutma kendini 😩', 'İzin mi? Yalvarıyorum, içime! 🥵', `Bırak kendini ${s}, ben buradayım 💗`]);
      if (k === 'korkondom') return pickOne(['Kondomun içine boşal, rahatla 😈', `Hadi ${s}, doldur o kondomu 🥵`, 'Boşal, kondom var, korkma 😏', 'Rahatla, istediğin kadar boşal 😩']);
      if (k === 'korsabah') return n >= 2 ? pickOne([`Peki… boşal ${s}, sabah hap alırım 😳`, 'Tamam tamam… içime, ama sabah eczaneye sen gidiyorsun 😩', 'Dayanamıyorsun değil mi… boşal o zaman 🥵']) : pickOne(['Emin misin? Sabah hap almam lazım… 😳', 'Biraz daha tut, sonra düşünürüz 😏', 'İçime mi? Hmm… bir kez daha iste 😈']);
      if (k === 'korpullout') {
        if (n >= 3 && a >= 70) return pickOne([`Peki ${s}… bu seferlik… içimde rahatla 😩`, 'Of… tamam, dayanamıyorum ben de, içime ver 🥵 ama bir daha yok!', 'Senin için… peki… ama sabah konuşacağız 😳']);
        if (n >= 2) return pickOne([`Lütfen ${s}… tut biraz, dışarı vereceksin 🥺`, 'Yalvarma… biliyorsun içime olmaz 😣', 'Hayır, tut içinde… sonra dışarı 😩', 'Göğüslerime ver, orada rahatla 😏💦']);
        return pickOne(['Hayır, tut! İçime değil 😣', 'İçime boşalma tamam mı, söz vermiştin 😤', `Hayır ${s}, tut… dışarı rahatlarsın 🥺`, 'Tut tut tut, sakın! 😳']);
      }
      return n >= 3 && a >= 80 ? pickOne(['Delirdin mi… peki, ama bu son 😰', 'Of… tamam, içime… ama korkuyorum 😳']) : pickOne(['Hayır! Korunmuyoruz, dışarı! 😰', 'Olmaz, hamile kalırım! Çık! 😣', `Lütfen ${s}, içime değil 🥺`, 'Hayır dedim, tut ve çık 😤']);
    },
    // 💦 "boşalıcam, az kaldı": korunmasına göre nereye
    'boşalıcam': (ch, ctx) => {
      const s = hitapOf(ch), k = (ch.fields || {}).hamile ? 'koricine' : ctx.kor;
      if (k === 'koricine' || k === 'korhap') return pickOne([`Hadi ${s}, içime boşal 😩💦`, 'Bembeyaz sütünü içime sal 🥛🥵', 'Tutma, hepsini içime ver 😈', `İçimde rahatla ${s} 😩`, 'Ben de geliyorum… birlikte, içime! 🥵', 'Doldur beni, şimdi 💦']);
      if (k === 'korkondom') return pickOne(['Bırak kendini, kondom var 😈', `Hadi ${s}, doldur o kondomu 🥵`, 'Boşal, korkma 😩', 'İçimdeyken bitir, korunuyoruz 😏']);
      if (k === 'korsabah') return pickOne(['İçime mi? Peki… sabah hap alırım 😳', `Boşal ${s}, gerisini sabah düşünürüz 😩`, 'Dışarı daha iyi ama… dayanamıyorsan içime 🥵']);
      if (k === 'korpullout') return pickOne(['Çık! Dışarı boşal 😰', `Karnıma ${s}, içime değil! 😣`, 'Çek şimdi, göğüslerime ver 😩💦', 'Söz vermiştin, dışarı! 😳', 'Çık ve sütünü üstüme akıt 🥛😈']);
      return pickOne(['Çık hemen, korunmuyoruz! 😱', 'İçime değil! Dışarı! 😰', `Lütfen ${s}, çek! 🥺`, 'Dur dur, çık! 😣']);
    },
    // 🍼 Breastfeeding: hamile ve sütü varsa süt, yoksa sadece emme
    // genel (sütlü / sütsüz) + 🍒 göğüs bedenine + 🎭 kişiliğe göre; kişilik %40, beden %30 öne geçer
    'emzir': ch => { const s = relV(ch, 'süt'), h = hitapOf(ch), milk = (ch.fields || {}).hamile && s >= 10, tr = ch.traits || [];
      const gen = milk ? ['Em beni, sütüm sana aksın 🍼😩', `İç ${h}, hepsi senin 🍼`, 'Sütüm ağzına doluyor, hissediyor musun? 😳🍼', 'Her emişinde içim titriyor 🥵🍼', 'Göğüslerim boşaldıkça rahatlıyorum… ahh 😩', 'Sıcacık sütüm dilinde 🍼😈', 'Emdikçe ıslanıyorum, durma 💦', 'Bebeğimizden önce sen içiyorsun 🙈🍼', 'Uçlarımı bırakma, süt geliyor 😩🍼', 'Ahh… emişin beni orgazma götürecek 🥵',
        'Sütüm dudaklarından taşıyor 🍼😳', 'Bir göğsüm boşaldı, öbürüne geç 😏🍼', 'Emdikçe sütüm daha çok geliyor 😩', `Doy ${h}, hepsi senin için birikti 🍼`, 'Göğsümü sıkıp ağzına sağıyorum 😈🍼', 'Sütümün tadı tatlı mı? 😏🍼', 'Ahh… sütüm akarken bacaklarım titriyor 🥵', 'Yudum yudum iç beni 🍼😩', 'Göğüslerim hafifliyor, sen doluyorsun 😈', 'Emzirirken gelmek üzereyim 😩🍼']
        : ['Emişin beni eritiyor 😩', 'Uçlarımı em, daha sert 🥵', `Ahh ${h}… dudakların göğsümde 😩`, 'Sütüm yok ama emmene bayılıyorum 😈', 'Her emişte bacaklarımın arası ıslanıyor 💦', 'Dilini uçlarımda gezdir 🥵', 'Göğüslerimi bebeğin gibi em 🙈', 'Hafif ısır… ahh 😩', 'Böyle emersen gelirim 🥵', 'Durma, uçlarım çok hassas 😳',
        'Sütüm olmasa da emzirmeye bayılıyorum 😈', 'Uçlarım ağzında dimdik oldu 🥵', 'Emdikçe göğsümden aşağı ürperti iniyor 🫠', `Başını göğsüme bastırıyorum ${h} 😩`, 'Bir gün süt de gelecek, şimdilik em 😏', 'Dilinle uçlarımı oyna, ahh 🥵', 'Öbür göğsümü de unutma 😈', 'Emişin içimi zonklatıyor 😩', 'Kucağıma uzan, emmeye devam et 🥰', 'Ahh… emerken gözlerime bak 🥵'];
      const bs = traitVal(ch, 'Boob Size'), size = /9[05]/.test(bs) ? 'big' : /8[05]/.test(bs) ? 'mid' : /7[05]/.test(bs) ? 'small' : '';
      const SIZE = {
        big: milk ? ['Bu kocaman göğüsler süt dolu, doyasıya iç 🍼😈', 'İri göğsüm ağzına sığmıyor ama sütüm akıyor 😩🍼', 'Ağır göğüslerim sütle şişti, boşalt beni 🥺🍼', 'Yüzünü dolgun göğsüme göm ve iç 🍼🥵', 'Göğsüm o kadar dolu ki sıkınca fışkırıyor 😳🍼', 'İki elinle tut, kocaman göğsümü sağ 😈🍼']
          : ['Bu kocaman göğsü ağzına sığdırabilecek misin? 😈', 'Yüzün iri göğsümde kayboldu 🥵', 'Ağır göğsümü ağzına bastırıyorum 😩', 'İki elinle tut, ancak öyle emersin 😏', 'Dolgun göğüslerim emilmeye bayılır 🥵', 'Göğsüm yüzünü kapladı, nefes alabiliyor musun? 😈'],
        mid: milk ? ['Göğsüm tam ağzına göre, sütüm akıyor 🍼😩', 'Avucunda sıkıp emdikçe süt geliyor 🍼', 'Dolgun ve sütlü, tam kıvamında 😈🍼', 'Bir yudum daha, göğsüm hâlâ dolu 🥵🍼', 'Göğsümü avuçla ve iç 😩🍼', 'Sütüm sana tam yetecek kadar 😏🍼']
          : ['Göğsüm tam ağzına göre 😏', 'Avuçlayıp em, dolgun dolgun 🥵', 'Uçlarım ağzında, göğsüm avucunda 😩', 'Tam kıvamında göğüslerim senin 😈', 'İkisi de sıra bekliyor 😏', 'Göğsümü sıkarak em 🥵'],
        small: milk ? ['Küçük ama sütle doldu, iç 🍼🥺', 'Minik göğsümden süt geliyor, inanamıyorum 😳🍼', 'Küçük göğsüm tamamen ağzında, sütüm dilinde 🍼😩', 'Hamilelikte büyüdüler, şimdi sütlüler 🍼😈', 'Az ama tatlı sütüm senin 🍼🙈', 'Minik göğsümü sağ, damla damla 🍼🥵']
          : ['Küçük göğsüm tamamen ağzında 🙈', 'Minik ama uçlarım çok hassas 😩', 'Küçük göğsümü ağzınla kapladın 🥵', 'Utanıyorum ama emmene bayılıyorum 🙈', 'Küçük olunca her emiş daha çok hissediliyor 😳', 'Minik göğsüm seni seviyor 🥺']
      };
      const PERS = {
        'Utangaç': ['B-bebek gibi emiyorsun… çok utanıyorum 🙈', 'Y-yüzüme bakma, sadece em 😳', 'B-böyle emzirmek garip ama… güzel 🥺', 'S-sesim çıkıyor, özür dilerim 🙈', 'K-kızardım ama durma 😳', 'B-başını okşayayım mı? 🥺'],
        'Flörtöz': ['Böyle emen bir bebek daha görmedim 😘', 'Uçlarımı bırakırsan seni bırakırım 😉', 'Dudakların göğsüme çok yakıştı 😏', 'Emdikçe seni daha çok istiyorum 😘', 'Biraz ısır, yaramaz 😉', 'Göğsümü sana hediye ediyorum 😏'],
        'Romantik': ['Seni göğsümde besliyorum, en özel an bu 💞', 'Başını okşarken kalbim eriyor 🌹', 'Bu kadar yakın olmak çok güzel 💗', 'Göğsümde nefesini hissediyorum 🥰', 'Seni böyle sevmek sonsuz olsun 💞', 'Bu bağ ikimize ait 🌹'],
        'Soğuk': ['Em. Konuşma.', 'Hm. Devam.', 'Daha yavaş.', 'Fena değil.', 'Isırma.', 'Tamam, öbürüne geç.'],
        'Kibirli': ['Göğsümü emmek bir ayrıcalık 💅', 'Teşekkür etmeyi unutma 💁‍♀️', 'Bu göğüsler herkese verilmez 💅', 'Doğru düzgün em, kraliçeni üzme 👑', 'Bana tapar gibi em 💁‍♀️', 'Şanslısın, biliyorsun 💅'],
        'Alaycı': ['Koca adam bebek gibi emiyor, ne tatlı 😏', 'Biberon mu getireyim? 🙄', 'Doydun mu kahraman? 😏', 'Bu kadar acıkmış mıydın? 🙄', 'Gülme beni, emmeye devam et 😏', 'Mama saati 🙄'],
        'Neşeli': ['Hihi gıdıklanıyorum 😆', 'Mama saati, yaşasın 🥳', 'Emişin çok komik ve çok güzel 😄', 'Haha, uçlarım kızardı 😂', 'Bebeğim acıkmış 😆', 'Gülerken inliyorum 😄'],
        'Duygusal': ['Seni beslemek gözlerimi doldurdu 🥺', 'Bu kadar yakınlık beni ağlatıyor 🥹', 'Göğsümde kalmanı istiyorum hep 💗', 'İçim sevgiyle doldu 😢', 'Başını göğsüme yasla, bırakma 🥺', 'Bu anı hiç unutmayacağım 🥹'],
        'Çocuksu': ['Hihi bebek oldun 🙈', 'Yaa gıdıklanıyor 😚', 'Mama yiyor musun? 🍼', 'Hihi uçlarım ıslandı 🙈', 'Sana ninni söyleyeyim mi? 🎶', 'Yaa çok tatlısın 🥺'],
        'Şımarık': ['Emdikten sonra bana masaj yapacaksın 💅', 'Sadece bana bu kadar ilgi göster 😤', 'Güzelce em, hak ediyorum 💅', 'Hmpf, yavaş ol 😤', 'Bunun karşılığında hediye isterim 🎁', 'Uçlarım kızardı, dikkat et 😤'],
        'Asi': ['Daha sert em, korkma 🔥', 'Isır, umurumda değil 😈', 'Kimse beni böyle emzirmedi 😤', 'Hayvan gibi em 🔥', 'Bırakırsan kızarım 😤', 'Göğsümü yağmala 😈'],
        'Özgüvenli': ['Göğsümü nasıl emeceğini ben göstereyim 😎', 'Tam böyle, iyi gidiyorsun 😏', 'Bu göğüsler mükemmel, biliyorum 😎', 'Ritmi ben ayarlarım 😏', 'Emdikçe seni yönetiyorum 😎', 'Böyle iyi 😏'],
        'Manipülatif': ['Em bakalım, karşılığını sonra konuşuruz 😏', 'Göğsüme bağımlı oldun, değil mi? 😈', 'Ben ne zaman dersem bırakırsın 💅', 'Her emiş bir söz demek 😏', 'Artık benimsin 😈', 'İyi çocuk, devam 💅'],
        'Gizemli': ['Sessizce em… 🌙', 'Bu sırrımız olsun 🤫', 'Göğsümün tadını kimse bilmez 🖤', 'Karanlıkta daha güzel 🌙', 'Fısıldamadan em 🤫', 'Bir sır daha paylaşıyoruz 🖤'],
        'Güvensiz': ['Göğüslerimi beğendin mi gerçekten? 🥺', 'İyi mi böyle? 😔', 'Ağzına uygun mu? 🥺', 'Beni böyle seviyor musun? 😣', 'Garip görünmüyor muyum? 🥺', 'Emdikçe kendimi güzel hissediyorum 😔'],
        'Meraklı': ['Tadı nasıl, söyle? 🤩', 'Sağ tarafla sol aynı mı? 😏', 'Böyle hissettireceğini bilmiyordum 😳', 'Bir de böyle dene 🤩', 'Her emişte ne hissediyorsun? 🤔', 'Daha önce hiç böyle denememiştim 😳']
      };
      const per = Object.keys(PERS).filter(k => tr.includes(k));
      const r = Math.random();
      if (per.length && r < .4) return pickOne(PERS[pickOne(per)]);
      if (size && r < .7) return pickOne(SIZE[size]);
      return pickOne(gen); },
    'sütiç': ch => { const s = relV(ch, 'süt');
      if (!(ch.fields || {}).hamile) return pickOne(['Önce hamile bırakman lazım 😏🍼', 'Sütüm yok ama emmene engel değil 😈', 'Hamile kalınca ilk sen içeceksin 🙈🍼', 'Şimdilik sadece hayal et 😏']);
      return s >= 50 ? pickOne(['İç… hepsi senin 😩🍼', 'Em de akıtayım ağzına 🥵🍼', 'Göğüslerim sana dolu dolu 😈🍼', 'Sağ beni, son damlasına kadar 😩', 'Tadı nasıl, tatlı mı? 😏🍼', 'Bebeğimizden önce sen 🙈🍼'])
        : pickOne(['Biraz var, sabırla em 😏🍼', 'Az geliyor, daha çok emmen lazım 😈', 'Damla damla… tadına bak 🙈🍼']); },
    memeem: ch => memeAns(ch, 'em'), memeyala: ch => memeAns(ch, 'yala'), memedokun: ch => memeAns(ch, 'dokun'), memeısır: ch => memeAns(ch, 'ısır'), memeuç: ch => memeAns(ch, 'uç'),
    // 🍑 kalça: yalamak / dokunmak (şaplak). Kalça bedeni, Anal Size, anal sevip sevmemesi
    'kalçayala': ch => kalcaAns(ch, 'yala'), 'kalçadokun': ch => kalcaAns(ch, 'dokun'),
    // 💗 onun durumu
    'azgın': ch => { const u = relV(ch, 'uyarılma'), s = relV(ch, 'şehvet'); return u >= 50 || s >= 60 ? pickOne(['Sırılsıklamım 😩', 'Seni şimdi istiyorum 🥵', 'Dokun da gör 😈']) : u >= 20 || s >= 20 ? pickOne(['Isınmaya başladım 😏', 'Biraz daha uğraş 😈']) : pickOne(['Henüz değil, ısıt beni 😏', 'Biraz yavaş başla 😌']); },
    'sertyavaş': ch => { const L = likedTitles(ch).map(t => t.toLocaleLowerCase('tr')), tr = ch.traits || [];
      if (L.some(t => /rough|brutal|assertive/.test(t)) || tr.includes('Asi') || tr.includes('Soğuk')) return pickOne(['Sert 😈', 'Hırpala beni 🔥', 'Yavaş mı? Asla 😤']);
      if (L.includes('gentle') || tr.includes('Utangaç') || tr.includes('Romantik')) return pickOne(['Yavaş ve derin 🥰', 'Nazik ol bana 💕']);
      return pickOne(['Önce yavaş, sonra sert 😏', 'Duruma göre 😈', 'Sen nasıl istersen 😉']); },
    // ✨ deneyim
    ilk: ch => { const e = traitVal(ch, 'Experience'); return e === 'Virgo' ? pickOne(['Daha olmadı… seninle olacak 🥺', 'Hiç olmadı ki 🙈']) : pickOne(['18\'imdeydim… 🙈', 'Lisede, utanç verici bir hikaye 😅', 'Bir yaz tatilinde… 😏', 'Üniversitede… anlatırım belki 😌']); },
    'geçmiş': ch => { const e = traitVal(ch, 'Experience'); return ({ Virgo: 'Hiç kimseyle 🙈', Little: 'Sadece biriyle 😳', Some: 'İki üç kişi 😌', Medium: 'Birkaç kişi, o kadar 😏', Much: 'Beş altı… saymadım 😏', 'A lot': 'Saymayı bıraktım 😈', Great: 'Sorma, çok 😏🔥' })[e] || pickOne(['Bunu söylemem 😏', 'Sır 🤫']); },
    'seks': ch => { const e = traitVal(ch, 'Experience'), s = relV(ch, 'şehvet'); return e === 'Virgo' ? pickOne(['Bilmiyorum… hiç denemedim 🙈', 'Merak ediyorum 😳']) : s >= 50 || ['Much', 'A lot', 'Great'].includes(e) ? pickOne(['Bayılırım 😈', 'Hem de nasıl 🥵']) : pickOne(['Doğru kişiyle evet 😌', 'Seninle seviyorum 🙈']); },
    hassas: ch => { const b = traitVal(ch, 'Boob Size'); return pickOne([+b >= 90 ? 'Göğüslerim… özellikle uçları 😳' : 'Boynum, öp de gör 😏', 'Kulak memem 🙈', 'Belimin altı… 😈', 'İç bacaklarım 😩', 'Boynum ve göğüslerim 😏']); },
    // 💋 sevdikleri / sevmedikleri
    anal: ch => likesTag(ch, 'anal') ? pickOne(['Bayılırım 😈🍑', 'En sevdiğim 😏']) : dislikesTag(ch, 'anal') ? pickOne(['Hiç sevmem 😣', 'Arkam yasak bölge 🙅‍♀️']) : traitVal(ch, 'Experience') === 'Virgo' ? pickOne(['Hiç denemedim… 😳']) : pickOne(['Bazen… nazik olursan 😏', 'Doğru anda olabilir 🙈']),
    oral: ch => likesTag(ch, 'oral') ? pickOne(['Ağzımın sana alışmasını istiyorum 😋', 'Çok severim 😈']) : dislikesTag(ch, 'oral') ? pickOne(['Pek sevmem 😕']) : pickOne(['Senin için yaparım 😏', 'Duruma göre 😋']),
    kondom: ch => evAllowed(ch, 'condom') ? pickOne(['Evet, kondomla rahat ederim 😌', 'Kondomsuz olmaz 😏']) : evDenied(ch, 'condom') ? pickOne(['Kondomu sevmem, hissetmek istiyorum 😈', 'Kondom mu? Hayır 😏']) : pickOne(['Sen bilirsin 😌', 'Olabilir 🙂']),
    hap: ch => evAllowed(ch, 'control pill') ? pickOne(['Evet, düzenli içiyorum 😌', 'Evet, rahat ol 😏']) : pickOne(['Hayır, içmiyorum 😳', 'Hayır… dikkatli olmalıyız 🙈']),
    // 🗂️ karakterin bilgileri
    'burç': ch => ch.zodiac ? pickOne([`${ch.zodiac} burcuyum ✨`, `${ch.zodiac}… uyumlu muyuz sence? 😏`]) : pickOne(['Tahmin et 😏', 'Burçlara inanmam 😌']),
    meslek: ch => ch.job ? pickOne([`${ch.job} olarak çalışıyorum 😊`, `${ch.job}… sıkıcı gelebilir 😅`]) : pickOne(['Şu an boştayım 😌', 'Sana ne yapacağımı düşünüyorum 😏']),
    // 👗 ne giyiyorsun: üstündekilere göre (giyim yoksa eski genel cümleler)
    'kıyafet': ch => {
      const xs = outfitItems(ch);
      if (!xs.length) return BOT_ANS['kıyafetEski'](ch);
      const nm = x => x.id === 'sutyensiz' ? 'sütyen yok' : x.id === 'icsiz' ? 'çamaşır yok' : x.name.toLocaleLowerCase('tr');
      const dis = xs.filter(x => ['elbise', 'ust', 'alt', 'corap'].includes(x.slot)), ic = xs.filter(x => ['sutyen', 'tanga'].includes(x.slot));
      const bold = xs.some(x => x.style === 'i');
      const s = dis.length ? `Üstümde ${dis.map(nm).join(', ')}${ic.length ? `; altında ${ic.map(nm).join(' ve ')}` : ''} ${bold ? '😈' : '😌'}` : ic.length ? `Sadece ${ic.map(nm).join(' ve ')}… 😏` : 'Hiçbir şey 😈';
      return Math.random() < .5 ? `${s} ${pickOne(pickOne(xs).t)}` : s;
    },
    'sütyen': ch => { const x = clItem(outfitOf(ch).sutyen); return !x ? pickOne(['Sütyen mi? Giymedim bugün 😏', 'Sütyensizim, belli olmuyor mu? 😈']) : x.id === 'sutyensiz' ? pickOne(x.t) : pickOne([`${x.name} giydim 😏`, `${x.name}… görmek ister misin? 😈`, ...x.t]); },
    'altiç': ch => { const x = clItem(outfitOf(ch).tanga); return !x ? pickOne(['Altımda hiçbir şey yok 😈', 'Bugün çamaşır giymedim 😏']) : x.id === 'icsiz' ? pickOne(x.t) : pickOne([`${x.name} giydim 😏`, `${x.name}… tahmin etmiştin değil mi? 😈`, ...x.t]); },
    'sütyençıkar': ch => slotLine(ch, 'sutyen', Math.random() < .5 ? 'off' : 'show') || pickOne(['Zaten sütyen giymedim 😈', 'Çıkaracak bir şey yok, bak 😏']),
    'tangaçıkar': ch => slotLine(ch, 'tanga', Math.random() < .5 ? 'off' : 'show') || pickOne(['Altımda bir şey yok zaten 😈', 'Çamaşırsızım, gerek yok 😏']),
    'kıyafetEski': ch => pickOne(['Sadece iç çamaşırı 😏', 'Senin tişörtün 🙈', 'Hiçbir şey… 😈', 'Pijama, ama çıkarabilirim 😏', 'Dar bir elbise 💃', 'Dantel bir gecelik… görmek ister misin? 😈',
      'Sadece bir havlu, duştan yeni çıktım 🚿', 'Kısa bir şort ve atlet 😌', 'Kırmızı iç çamaşırı, senin için 🔥', 'Üstümde sadece parfüm var 😏', (ch.fields || {}).hamile ? 'Bol bir elbise, karnım sığmıyor 🤰' : 'Dar bir kot, kalçamı saran 🍑',
      +traitVal(ch, 'Boob Size') >= 90 ? 'Sütyensiz bir tişört… belli oluyor mu? 😏' : 'Minik bir bralet 🙈']),
    // 🛡️ "içine gireyim, dışarı boşalırım" yalvarması ve "kondomsuz olur mu"
    'dışarıboşal': ch => {
      if ((ch.fields || {}).hamile) return pickOne(['Zaten hamileyim, dışarıya gerek yok 😈', 'İçime gir… içime de boşal, sorun yok 😏']);
      if (evAllowed(ch, 'nothing') || evAllowed(ch, 'control pill')) return pickOne(['Dışarı mı? İçime boşal bile 😈', 'Gir… nereye istersen bitir 😏💦']);
      if (evAllowed(ch, 'pull-out method')) return pickOne(['Peki… ama son anda çıkar, söz mü? 😳', 'Tamam, gir… ama dışarı, yemin et 🥺', 'Gir ama hissettiğin an çek 😩']);
      if (evAllowed(ch, 'condom') || evAllowed(ch, 'tight condom')) return pickOne(['Kondom tak, sonra istediğin kadar 😏', 'Kondomsuz olmaz, söz de olmaz 😣']);
      return pickOne(['Hayır, risk alamam 😣', 'O "son anda çıkarırım"ları bilirim 🙄', 'Nolur deme, olmaz 😳']);
    },
    kondomsuz: ch => {
      if ((ch.fields || {}).hamile) return pickOne(['Artık kondoma gerek yok 😏', 'Hamileyim zaten, olur 😈']);
      if (evAllowed(ch, 'nothing')) return pickOne(['Olur… seni hissetmek istiyorum 😈', 'Kondom mu? Hiç sevmem zaten 😏']);
      if (evAllowed(ch, 'control pill')) return pickOne(['Hap içiyorum, olur 😏', 'Olur, rahat ol 😌']);
      if (evAllowed(ch, 'pull-out method')) return pickOne(['Olur ama dışarı boşalacaksın 😳', 'Tamam… ama son anda çek 🥺']);
      if (evAllowed(ch, 'morning-after pill')) return pickOne(['Olur… sabah hap alırım 😳', 'Bir kereliğine olsun 🙈']);
      return pickOne(['Olmaz, kondomsuz asla 😣', 'Hayır, tak şunu 😤', 'Ya olmaz, korunmuyorum 😳']);
    },
    // 🏆 "benden daha iyisi oldu mu"
    'kıyas': ch => { const e = traitVal(ch, 'Experience'), tr = ch.traits || [];
      if (e === 'Virgo') return pickOne(['Sen ilksin zaten 🙈', 'Kıyaslayacak kimse yok ki 😳']);
      if (tr.includes('Kibirli') || tr.includes('Alaycı')) return pickOne(['Belki… sana söylemem 😏', 'Kıskandın mı? 💅', 'Daha çok çalışman lazım 🙄']);
      return relV(ch, 'aşk') >= 50 ? pickOne(['Hayır, sen en iyisisin 💗', 'Hiç kimse senin gibi değildi 😩', 'Seninle bambaşka 🥺']) : pickOne(['Hmm… sana söylemem 😏', 'Yarışma mı bu? 😂', 'Kanıtla bakalım 😈']); },
    // 📏 boyut: mesajdaki sayı (santim / cm) ya da daha önce söylediğin; karakterin darlığına ve deneyimine göre
    boy: (ch, ctx) => {
      const m = /(\d{1,2})\s*(cm|santim|santimetre|sm)?/i.exec(String(ctx.text || '')), u = S().user;
      const n = m ? +m[1] : +u.size || 0;
      if (m && n >= 5 && n <= 35) u.size = n;
      const p = traitVal(ch, 'Pussy Size'), tight = /tight/i.test(p), loose = /loose|relaxed/i.test(p), virgin = traitVal(ch, 'Experience') === 'Virgo', big = ['Much', 'A lot', 'Great'].includes(traitVal(ch, 'Experience'));
      if (!n) return pickOne(['Bakmadan bilemem 😏 göster', 'Ölçmemiz lazım 😈', 'Söyle bakalım kaç? 😏']);
      if (n >= 24) return pickOne([`${n} santim mi? Yalan söyleme 😂`, 'Bu kadar büyüğü sığmaz bana 😱', 'Abartma istersen 🙄']);
      if (n >= 18) return virgin ? pickOne([`${n} santim mi?! Bu benim için çok büyük 😳`, 'Korkutuyorsun beni… yavaş olmalıyız 🥺', 'İlk seferim için bu çok fazla değil mi? 🙈', `${n}… düşünmesi bile titretiyor beni 😳`])
        : tight ? pickOne([`${n} santim… ben çok darım, ikiye bölersin beni 😩`, 'Bunu nasıl sığdıracağız? 😳💦', 'Dar halime bu kadar büyüğü… yavaş girersen 🥵', `${n} santim, beni sonuna kadar açacak 😵‍💫`])
        : loose ? pickOne([`${n} santim, tam beni dolduracak boy 😈`, 'Ancak öyle doldurursun beni 🥵', 'İşte aradığım boy 😏', 'Sonunda beni hissettirecek biri 😈'])
        : pickOne([`${n} santim mi? Ooo 😳 hoşuma gider`, 'Şimdiden heyecanlandım 🥵', `${n}… bunu görmem lazım 😈`, 'Bu boyda biriyle hiç olmadım 😳', 'Yutkundum şu an 😏']);
      if (n >= 14) return tight ? pickOne([`${n} santim, bana tam olur 😏`, 'Dar olduğum için bana fazlasıyla yeter 😩']) : pickOne([`${n} santim, tam kıvamında 😏`, 'Mükemmel boy 😈', big ? 'Nasıl kullandığına bakarım 😏' : 'Bence harika 🥰']);
      return pickOne(['Boyut önemli değil, nasıl kullandığın önemli 😏', tight ? 'Ben darım zaten, bana yeter 😌' : 'Sen bana yetersin 🥰', `${n} santim da güzel, utanma 🙈`]);
    },
    // 📏 kaç santim seversin: darlığına ve deneyimine göre; söylediğin boyut varsa ona da değinir
    sevboy: ch => {
      const p = traitVal(ch, 'Pussy Size'), e = traitVal(ch, 'Experience'), n = +S().user.size || 0;
      const base = e === 'Virgo' ? pickOne(['Bilmiyorum… büyükleri düşününce korkuyorum 🙈', 'Çok büyük olmasın, ilk seferim 🥺'])
        : /tight/i.test(p) ? pickOne(['14-16 santim bana fazlasıyla yeter, darım 😳', 'Çok büyüğü sığmaz bana, orta boy 😏'])
        : /loose|relaxed/i.test(p) ? pickOne(['20 santimin üstü… beni doldursun 😈', 'Büyük olsun, kalın olsun 🥵'])
        : ['Much', 'A lot', 'Great'].includes(e) ? pickOne(['Boyuttan çok nasıl kullandığına bakarım 😏', '17-18 civarı, tam kıvam 😈']) : pickOne(['Orta boy, kalın olsun 😏', '16-18 arası ideal bence 🙈']);
      return n ? `${base} ${pickOne([`Seninki ${n}, ${n >= 18 ? 'beni zorlar 😩' : n >= 14 ? 'tam ideal 😈' : 'bana yeter 🥰'}`, `${n} santim… kafamda canlandırdım bile 😏`])}` : base;
    },
    // 🍒 "memenin arasına sokmak istiyorum": göğüs bedenine göre
    'memearası': ch => { const b = +traitVal(ch, 'Boob Size') || 0;
      return b >= 90 ? pickOne(['Gel, kaybol aralarında 😏🍒', 'Bu göğüsler tam bunun için 😈', 'Sıkıştırayım mı seni? 🥵']) : b && b <= 75 ? pickOne(['Küçükler ama denerim 🙈', 'Ellerimle yardım ederim 😏']) : pickOne(['Göğüslerimin arasına gel 😏', 'Hadi, bekliyorum 😈🍒']); },
    'son': ch => traitVal(ch, 'Experience') === 'Virgo' ? pickOne(['Hiç… daha olmadı 🙈']) : pickOne(['Uzun zaman oldu… özledim 😩', 'Geçen hafta… ama seninle değildi 😏', 'Hatırlamıyorum bile 😅', 'Dün gece… rüyamda seninle 😈']),
    'kaçkez': ch => relV(ch, 'şehvet') >= 50 ? pickOne(['Sen durana kadar 😈', 'Saymayı bırakırım 🥵']) : pickOne(['Bir iki kez… sonra bayılırım 😩', 'Beni bir kez doğru getir, yeter 😏']),
    yut: ch => likesTag(ch, 'oral') || (ch.traits || []).includes('Flörtöz') ? pickOne(['Hepsini yutarım 😋', 'Bir damlasını bile kaçırmam 😈']) : traitVal(ch, 'Experience') === 'Virgo' ? pickOne(['B-bilmiyorum… denerim 😳']) : pickOne(['Belki… nasıl hissettiğime bağlı 😏', 'Önce bir tadına bakayım 😋']),
    'yüz': ch => (ch.traits || []).some(t => ['Kibirli', 'Soğuk', 'Şımarık'].includes(t)) ? pickOne(['Yüzüme mi? Sakın 💅', 'Makyajım var 😤']) : pickOne(['Kızmam… hatta isterim 😈', 'Yüzüme boşal, gözlerime bakarak 😏', 'Bir kere deneriz 🙈']),
    'hamilebırak': ch => (ch.fields || {}).hamile ? pickOne(['Zaten bıraktın 🤰😏']) : evAllowed(ch, 'control pill') ? pickOne(['Hap içiyorum, boşuna uğraşma 😏', 'Deneyebilirsin ama tutmaz 😈']) : evAllowed(ch, 'nothing') && relV(ch, 'aşk') >= 50 ? pickOne(['Bırak… 🥺', 'Seninle olsa neden olmasın 💗']) : pickOne(['Delirdin mi 😳', 'Önce yüzük 💍😏', 'Daha çok erken 🙈']),
    arkadan: ch => likesTag(ch, 'anal') ? pickOne(['Gir… 😈🍑', 'Bekliyordum zaten 😏']) : dislikesTag(ch, 'anal') ? pickOne(['Hayır, orası olmaz 😣']) : /tight/i.test(traitVal(ch, 'Anal Size')) ? pickOne(['Çok yavaş olursan… 😳', 'Orası çok dar, dikkat et 🥺']) : pickOne(['Belki… nazik olursan 😏', 'Önce biraz ısıt beni 😈']),
    yer: () => pickOne(['Duşta 🚿😏', 'Mutfak tezgahında 😈', 'Arabada, gece 🚗', 'Senin yatağında 🛏️', 'Asansörde… riskli ama 😳', 'Plajda, gün batımında 🌅', 'Ofiste, masanın üstünde 💼😈']),
    mastur: ch => relV(ch, 'şehvet') >= 40 || ['Much', 'A lot', 'Great'].includes(traitVal(ch, 'Experience')) ? pickOne(['Her gece… seni düşünerek 😈', 'Sık sık 😏 itiraf ediyorum']) : pickOne(['Ç-çok nadir 🙈', 'Bunu söylemem 😳']),
    oyuncak: ch => likedTitles(ch).some(t => /toy/i.test(t)) ? pickOne(['Bayılırım, bir sürü var 😈', 'Hangisini getireyim? 😏']) : pickOne(['Hiç denemedim… merak ediyorum 😳', 'Seninle denerim 😏']),
    'bağlan': ch => likedTitles(ch).some(t => /bondage/i.test(t)) ? pickOne(['Bağla beni 😈', 'İplerimi getireyim mi? 😏']) : pickOne(['Biraz korkutucu ama… olur 😳', 'Sana güvenirsem 😌']),
    dokun: ch => relV(ch, 'güven') >= 35 ? pickOne(['Dokun… bekliyordum 😏', 'Sormana gerek yok 😈', 'Hadi, çekinme 🥰']) : pickOne(['Yavaş… önce beni tanı 😳', 'Biraz bekle 😌', 'Henüz değil 🙈']),
    neyim: () => pickOne(['Gözlerini 🥺', 'Gülüşünü 😊', 'Ellerini… ne yaptıklarını 😏', 'Sesini, hele fısıldayınca 😩', 'Beni nasıl baktığını 💗', 'Dudaklarını 💋']),
    'hamilekalırsa': ch => relV(ch, 'aşk') >= 50 ? pickOne(['Birlikte büyütürüz 💗', 'Seninle olursa korkmam 🥺', 'Baba olmaya hazır mısın? 😏🍼']) : pickOne(['Panik yapmayalım 😳', 'O yüzden dikkatli ol 😅', 'Bunu düşünmek bile istemiyorum 🙈']),
    // 🔢 bu sohbetteki sayılar (ctx)
    'orgazmsay': (ch, ctx) => ctx.orgN ? pickOne([`Bu gece ${ctx.orgN} kez 🥵`, `${ctx.orgN} kez… ve daha istiyorum 😩`]) : pickOne(['Daha hiç… sen yapmalısın 😏', 'Henüz sıfır, utan 🙄']),
    'boşalmasay': (ch, ctx) => ctx.cumN ? pickOne([`${ctx.cumN} kez 😏`, `Saydım, ${ctx.cumN} kez 😈💦`]) : pickOne(['Daha hiç 😏', 'Henüz değil, sabırsız 😈'])
  };
  const MEME_ACT = {
    em: ['Em… ahh, bekliyordum 😩', 'Gel, göğüslerime yasla başını 😈', 'Önce uçlarımı dilinle oyna 😏', 'Hmm… sert em 🥵', 'Emerken gözlerime bak 😈', 'Bebeğim gibi em beni 🥺💗', 'Dudaklarını hissetmek istiyorum oralarda 😩', 'Sırayla… önce sağ, sonra sol 😏', 'Emdikçe aşağısı ıslanıyor 🥵', 'Durmadan em, inletene kadar 😩'],
    yala: ['Yala… yavaş yavaş 😩', 'Dilinle daire çiz uçlarımda 😈', 'Islak ıslak yala, bayılırım 🥵', 'Göğüslerimin arasından boynuma kadar yala 😏', 'Dilin değince titriyorum 😳', 'Yala, sonra üfle… ahh 😩', 'Her yerini yala, hiçbir yer kalmasın 😈', 'Sıcak dilin… devam et 🥵'],
    dokun: ['Dokun… avuçlarına al 😏', 'Sık biraz… ahh evet 😩', 'Ellerin çok sıcak 🥵', 'Okşa, sonra sık 😈', 'Elini çekme, kalsın orada 🥺', 'Parmaklarınla uçlarımı sık 😩', 'Hissediyor musun ne kadar yumuşak? 😏', 'İki elinle tut, bırakma 😈'],
    'ısır': ['Hafif ısır… ahh 😩', 'Dişlerin… dikkat et ama durma 😈', 'Isır da iz kalsın 😏', 'Uçlarımı ısırınca çıldırıyorum 🥵', 'Yavaş… sonra biraz daha sert 😩', 'Of… ısırma öyle, dayanamıyorum 😵‍💫'],
    'uç': ['Sertleşti bile, dokun da gör 😏', 'Seni görünce dikleşiyorlar 😳', 'Çok hassaslar, yavaş 🥺', 'Tişörtümden belli oluyor mu? 😈', 'Dokunursan inlerim 😩', 'Pembe pembe… görmek ister misin? 🙈']
  };
  function memeAns(ch, kind) {
    const b = +traitVal(ch, 'Boob Size') || 0, tr = ch.traits || [], preg = (ch.fields || {}).hamile, s = relV(ch, 'süt');
    const pool = [...(MEME_ACT[kind] || MEME_ACT.em)];
    if (b >= 90) pool.push('İkisine birden yetişebilecek misin? 😏🍒', 'Yüzünü aralarına göm 😈', 'Bu kadar büyükleri nasıl taşıyorum sanıyorsun? Senin için 🥵', 'Avucuna sığmıyorlar değil mi? 😏', 'Kocamanlar ve hepsi senin 😈🍒');
    else if (b && b <= 75) pool.push('Küçükler ama çok hassaslar 😳', 'Ufaklar, tam ağzına göre 🙈', 'Küçük diye küçümseme, bak nasıl tepki veriyorlar 😏', 'Avucuna tam sığıyorlar 🥺');
    else if (b) pool.push('Tam avucunun içine göre 😏', 'Dolgunlar, sıkınca hissedersin 😈', 'Ne büyük ne küçük, tam senin için 🍒');
    if (preg && s >= 50) pool.push('Dikkat et, süt gelecek 🍼😏', 'Dolu dolu… emersen rahatlarım 🥺🍼', 'Sütümü içmek mi istiyorsun? Gel 😈🍼', 'Uçlarından damlıyor zaten 🥵🍼', 'Bütün sütümü sana veririm 😩🍼');
    else if (preg) pool.push('Hamileliğimden beri çok hassaslar 🥺', 'Büyüdüler, fark ettin mi? 🤰😏', 'Biraz süt gelebilir 🙈🍼');
    if (tr.includes('Utangaç')) pool.push('B-bilmem… ama istiyorsan 🙈', 'Utanıyorum ama… evet 😳', 'Işığı kapat önce 🙈');
    if (tr.includes('Kibirli') || tr.includes('Şımarık')) pool.push('Bunun bir ayrıcalık olduğunu bil 💅', 'Hak ettin mi bakalım? 😏', 'Sana izin veriyorum… bu seferlik 💅');
    if (tr.includes('Flörtöz')) pool.push('Sormana gerek yoktu ki 😘🍒', 'Ben de bunu bekliyordum 😏💋');
    if (tr.includes('Romantik') || tr.includes('Duygusal')) pool.push('Yavaşça… seni hissetmek istiyorum 💗', 'Kalbimin üstünde dur biraz 🥺');
    if (tr.includes('Asi') || tr.includes('Özgüvenli')) pool.push('Sor da sor… al artık 😈', 'Hadi, sert ol 🔥');
    return pickOne(pool);
  }
  function kalcaAns(ch, kind) {
    const z = traitVal(ch, 'Butt Size'), a = traitVal(ch, 'Anal Size'), tr = ch.traits || [], big = /^(L|XL)$/i.test(z), small = /^(XS|S)$/i.test(z);
    const pool = kind === 'yala'
      ? ['Yala… kalçamın her yerini 😈', 'Dilinle kalçamın arasında gezin 😩', 'Arkamı sana dönüyorum, yala 🍑', 'Islak ıslak yala, sonra ısır 😏', 'Kalçamı açıp yalamanı istiyorum 🥵', 'Hmm… dilin oraya gidince titriyorum 😳']
      : ['Sık… avuçlarına al 😈🍑', 'Şaplak at, iz kalsın 😏', 'Ellerini kalçamdan çekme 🥵', 'Bir şaplak daha… ahh 😩', 'Sıkınca nasıl titrediğini gör 😈', 'İki elinle aç kalçamı 😏'];
    if (big) pool.push('Bu kadar büyük kalçayı tek elle tutamazsın 😏🍑', 'Yüzünü göm aralarına 😈', 'Hepsi senin, istediğin kadar 🥵🍑');
    if (small) pool.push('Küçük ama sıkı 😏🍑', 'Avucuna tam sığıyor 🙈');
    if (kind === 'yala' && likesTag(ch, 'anal')) pool.push('Arkamı da yala… orayı çok severim 😈', 'Deliğimi yala, hazırla beni 🥵');
    if (kind === 'yala' && dislikesTag(ch, 'anal')) return pickOne(['Kalçamı yala ama içeri yok 😣', 'Sadece dışı… orası yasak 🙅‍♀️', 'Kalçam evet, arkam hayır 😳']);
    if (/tight/i.test(a)) pool.push('Orası çok dar, dilinle hazırla 🥺');
    if (tr.includes('Utangaç')) pool.push('O-oraya mı? 🙈', 'Utanıyorum ama… dur demeyeceğim 😳');
    if (tr.includes('Kibirli') || tr.includes('Şımarık')) pool.push('Kalçama tapmanı izleyeceğim 💅', 'Diz çök önce 😏');
    return pickOne(pool);
  }
  // bot cevapları için karakter bilgileri
  const relV =(ch, label) => { const p = allParams().find(x => x.who !== 'me' && String(x.label).toLocaleLowerCase('tr') === label); return p ? paramVal(ch, p) : 0; };
  const traitVal = (ch, group) => { const t = (ch.traits || []).find(x => x.startsWith(group + ':')); return t ? t.slice(t.indexOf(':') + 1).trim() : ''; };
  const evByTitle = t => allEvents().find(e => e.title.toLocaleLowerCase('tr') === t);
  const evAllowed = (ch, t) => { const e = evByTitle(t); return !!e && (ch.allows || []).includes(e.id); };
  const evDenied = (ch, t) => { const e = evByTitle(t); return !!e && (ch.denies || []).includes(e.id); };
  const likedTitles = ch => feelEvents(ch.likes || []).map(e => e.title);
  const likesTag = (ch, tag) => feelEvents(ch.likes || []).some(e => (e.tags || []).includes(tag));
  const dislikesTag = (ch, tag) => feelEvents(ch.dislikes || []).some(e => (e.tags || []).includes(tag));
  // ❤️ listesinden kategoriye göre (pozisyon: önden / arkadan / dokunuş / eat; fantezi; mode)
  const likesInCats = (ch, labels) => feelEvents(ch.likes || []).filter(e => labels.includes(String(catOfEv(e).label).toLocaleLowerCase('tr')));
  function fillTraits(s, ch, ctx = {}) {
    ch = ch || {};
    const titles = (ids, n, none) => { const evs = sample(feelEvents(ids || []), n); return evs.length ? evs.map(e => e.title).join(' ve ') : none; };
    return String(s)
      .replace(/\{ö:([^}]+)\}/g, (a, g) => {
        const k = g.trim().toLocaleLowerCase('tr') + ':', t = (ch.traits || []).find(x => x.toLocaleLowerCase('tr').startsWith(k));
        return t ? t.slice(t.indexOf(':') + 1).trim() : '?';
      })
      .replace(/\{sever\}/g, () => titles(ch.likes, 2, 'sürprizleri'))
      .replace(/\{sevmez\}/g, () => titles(ch.dislikes, 2, 'pek bir şeyi'))
      .replace(/\{izin\}/g, () => titles(ch.allows, 2, 'hiçbir şeyi'))
      .replace(/\{izinyok\}/g, () => titles(ch.denies, 2, 'hiçbir şeyi'))
      .replace(/\{olay\}/g, () => ctx.olay || 'bunu')
      .replace(/\{ad\}/g, () => (ch.memory || {}).ad || userName())
      .replace(/\{hatıra\}/g, () => hatira(ch) || pickOne(['Seni daha çok tanımak istiyorum 😏', 'Bana kendinden bahsetsene 🥺']))
      .replace(/\{pozisyon\}/g, () => { const e = sample(likesInCats(ch, ['forward', 'backward', 'outercourse', 'eat']), 2); return e.length ? e.map(x => x.title).join(' ve ') : 'sürpriz pozisyonları'; })
      .replace(/\{fantezi\}/g, () => { const e = sample(likesInCats(ch, ['fantesy']), 2); return e.length ? e.map(x => x.title).join(' ve ') : 'bunu sana söylemem'; })
      .replace(/\{mod\}/g, () => { const e = sample(likesInCats(ch, ['mode']), 1); return e.length ? e[0].title : 'duruma göre'; })
      .replace(/\{cevap:([^}]+)\}/g, (a, k) => (BOT_ANS[k.trim()] || (() => ''))(ch, ctx));
  }
  // 📊 durum kartında karakterin ❤️ sevdiği · 💔 sevmediği · ✅ izin verdiği · 🚫 izin vermediği olayları (özet, dokununca liste)
  const FEEL_ROWS = [['likes', '❤️', 'Sevdiği'], ['dislikes', '💔', 'Sevmediği'], ['allows', '✅', 'İzin verdiği'], ['denies', '🚫', 'İzin vermediği']];
  function feelBlock(ch) {
    const lists = FEEL_ROWS.map(([k, ic, lb]) => [ic, lb, feelEvents(ch[k] || [])]);
    if (!lists.some(([, , es]) => es.length)) return '';
    const open = !!(ui.stFeel && ui.stFeel.has(ch.id));
    return `<button type="button" class="st-feel${open ? ' on' : ''}" data-stfeel="${esc(ch.id)}">${lists.map(([ic, , es]) => `${ic} ${es.length}`).join(' · ')}<i>${open ? '▴' : '▾'}</i></button>`
      + (open ? `<div class="st-feels">${lists.filter(([, , es]) => es.length).map(([ic, lb, es]) => `<div class="st-fl"><small>${ic} ${lb}</small>${es.map(e => `<span class="st-fe${evCls(e)}"${evStyle(e)}>${evEmo(e)}${esc(e.title)}</span>`).join('')}</div>`).join('')}</div>` : '');
  }
  // olay mesajının metni sadece başlıksa ("🔥 Doggy") balonda tekrar yazılmaz
  const evDup = (text, title) => { const t = String(text || '').trim(), ti = String(title || '').trim(); return !!ti && (t === ti || (t.endsWith(' ' + ti) && t.length - ti.length <= 6)); };
  // 📈 değer değişimleri mesajlarda görünsün mü (⋯ Diğer → 📈, Ben → ⚙️; bu tarayıcıda)
  const chgOn = v => { try { if (v != null) localStorage.setItem('amor-stories:chg', v ? '1' : '0'); return localStorage.getItem('amor-stories:chg') === '1'; } catch (e) { return false; } };
  const ocChips = (chs, fired) => !chgOn() ? '' : ((fired || []).length ? `<div class="oc-fires">${fired.map(f => `<div class="oc-fire">${esc(f)}</div>`).join('')}</div>` : '') + ((chs || []).length ? `<div class="oc-chgs">${chs.map(c => `<span class="oc-chg ${c.up ? 'up' : 'down'}"><i>${c.up ? '▲' : '▼'}</i><span><small>${esc(c.who)}</small><b>${esc(c.label)}</b></span><span class="oc-ft"><s>${esc(c.from || '—')}</s>→<em>${esc(c.to)}</em></span></span>`).join('')}</div>` : '');

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
        <div class="sc-body"><small>${sc.ev ? `📜 Olay${sc.ev.trim() ? ' ' + esc(sc.ev) : ''}${sc.level ? ` · 📶 ${esc(sc.level)}` : ''} · ${esc(sc.icon || '')} ${esc(sc.name || '')}` : hint ? `İpucu · ${esc(sc.icon || '')} ${esc(sc.name || '')}` : '📍 Mekan'}</small>${hint ? '' : `<b>${esc(sc.name || 'Bir yerde')}</b>`}<span>${txt(m.text)}</span>${(sc.onChanges || []).length && chgOn() ? `<div class="evb-on sc-on"><small>⚡ Olunca</small>${ocChips(sc.onChanges)}</div>` : ''}${sc.outcome && (chgOn() || sc.outcome.text || sc.outcome.blocked || sc.outcome.fallback) ? `
          <div class="sc-out${sc.outcome.blocked ? ' blocked' : ''}"><div class="sc-out-h"><span class="ocb-dice">${sc.outcome.blocked ? '🛡️' : '🎲'}</span>${sc.outcome.blocked ? 'Olmadı' : sc.outcome.fallback ? 'Sonuç · ⭐ varsayılan' : 'Sonuç'}${sc.outcome.pct < 100 && !sc.outcome.fallback ? ` <em>%${+sc.outcome.pct}</em>` : ''}</div>${sc.outcome.fallback ? `<div class="oc-miss">🛡️ <s>${esc(sc.outcome.fallback.text || 'Sonuç')}</s> <small>· 🔒 ${esc(sc.outcome.fallback.why)}</small></div>` : ''}${sc.outcome.text ? (sc.outcome.blocked ? `<p class="oc-no"><s>${txt(sc.outcome.text)}</s> <small>· olmadı, değer değişmedi</small></p>` : `<p>${txt(sc.outcome.text)}</p>`) : ''}${sc.outcome.blocked ? `<div class="oc-why">🔒 Şart tutmadı: ${esc(sc.outcome.blocked)}</div>` : ''}${ocChips(sc.outcome.changes, sc.outcome.fired)}</div>` : ''}</div></div>`;
    }
    if (m.from === 'sys') return html + `<div class="sys" data-id="${m.id}">${txt(m.text)}</div>`;
    // 📈 değişimler gizliyken sadece değer değişimi olan "🎲 Sonuç" kartı görünmez
    if (m.oc && !chgOn() && !m.oc.blocked && !m.oc.fallback && (!m.text || m.text === '🎲 Sonuç')) return html;

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
    // ✨ yeni olay kartında küçük animasyon: 💦 boşalma / 🔥 sert Mode ve fanteziler / ❤️ Foreplay ve orgazm
    const efk = ev && Date.now() - (m.ts || 0) < 6000 && evFxKind(m.ev);
    const bubble = ev
      ? `<div class="bubble ev-bubble${efk ? ' evfx evfx-' + efk : ''}"${isHex(ev.color) ? ` style="--evc:${esc(ev.color)}"` : ''}>${efk ? `<span class="evfx-p" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}">${EVFX[efk]}</i>`).join('')}</span>` : ''}${ev.prev ? `<div class="evb-chain"><span>${esc(ev.prev.emo)} ${esc(ev.prev.t)}</span><i>➜</i><span>${esc(ev.emojis || '📜')} ${esc(ev.title || '')}</span></div>` : ''}<div class="evb-h"><span class="evb-ic">${esc(ev.emojis || '📜')}</span><span class="evb-ti"><small>📜 Olay${ev.sub ? ` · 🪜 ${esc(ev.sub)}` : ''}${ev.level ? ` · 📶 ${esc(ev.level)}` : ''}</small><b>${esc(ev.title || '')}</b></span></div>${evDup(m.text, ev.title) ? '' : `<div class="evb-t">${body}</div>`}${(ev.changes || []).length && chgOn() ? `<div class="evb-on"><small>⚡ Olunca</small>${ocChips(ev.changes)}</div>` : ''}${react}${fxTag}</div>`
      : oc
        ? `<div class="bubble oc-bubble${oc.blocked ? ' blocked' : ''}"><div class="ocb-h"><span class="ocb-dice">${oc.blocked ? '🛡️' : '🎲'}</span><small>${oc.blocked ? 'Olmadı' : oc.fallback ? 'Sonuç · ⭐ varsayılan' : 'Sonuç'}${oc.pct < 100 && !oc.fallback ? ` · %${+oc.pct}` : ''}${oc.fert != null ? ` · 🌱 %${oc.fert} doğurganlık` : ''}${oc.ev ? ` · ${esc(oc.ev)}` : ''}</small></div>${oc.fallback ? `<div class="oc-miss">🛡️ <s>${esc(oc.fallback.text || 'Sonuç')}</s> <small>· 🔒 ${esc(oc.fallback.why)}</small></div>` : ''}${m.text && m.text !== '🎲 Sonuç' ? (oc.blocked ? `<div class="ocb-t oc-no"><s>${body}</s> <small>· olmadı, değer değişmedi</small></div>` : `<div class="ocb-t">${body}</div>`) : ''}${oc.blocked ? `<div class="oc-why">🔒 Şart tutmadı: ${esc(oc.blocked)}</div>` : ''}${ocChips(oc.changes, oc.fired)}${react}${fxTag}</div>`
        : `<div class="bubble${m.type === 'photo' ? ' photo' : ''}${quote ? ' has-quote' : ''}">${quote}${body}${m.bsc && scoreOn() ? `<small class="bot-sc">🎯 ${esc(m.bsc.n)} · ${m.bsc.f ? 'yedek' : `${+m.bsc.s} puan${m.bsc.l ? ' · 🔓 gevşek' : ''}`}</small>` : ''}${react}${fxTag}</div>`;
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
    { id: 'korunma', icon: '🛡️', label: 'Korunma', type: 'toggle', v: 2 },
    { id: 'dogurganlik', icon: '🌱', label: 'Doğurganlık', type: 'range', min: 0, max: 100, start: 50, unit: '%', v: 3 }];
  const CF_SEED_V = 3;
  // 🌱 doğurganlık: %0 kısır … %100 çok doğurgan; hamile bırakan sonuçların yüzdesini ölçekler (fertAdjust)
  const FERT_ID = 'dogurganlik';
  const fertWord = v => { v = +v; return v <= 0 ? 'Kısır' : v < 25 ? 'Düşük' : v < 60 ? 'Normal' : v < 90 ? 'Yüksek' : 'Çok doğurgan'; };
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
    if (f.type === 'range') { const lo = f.min === '' || f.min == null ? 0 : +f.min, hi = f.max === '' || f.max == null ? 10 : +f.max, val = v == null || v === '' ? (f.start != null ? f.start : f.id === FERT_ID ? 50 : lo) : v;
      return `<label class="cf${f.id === FERT_ID ? ' cf-fert' : ''}">${head}<span class="cf-in"><input type="range" data-cf="${id}" min="${lo}" max="${hi}" value="${esc(val)}"><b data-cfv="${id}">${esc(val)}</b>${f.unit ? `<small>${esc(f.unit)}</small>` : ''}${f.id === FERT_ID ? `<em data-cffert>${fertWord(val)}</em>` : ''}</span></label>`; }
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
    if (f.id === FERT_ID) return `%${v} · ${fertWord(v)}`;
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
    // 22 yaş ve üstünde ek meslekler de karışır
    const pool = [...(ok.length ? ok : P.jobObjs).map(j => j.title), ...(a >= 22 ? P.extraJobs || [] : [])];
    return pick(pool);
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
  /* 📏 Oluştur kuralları: { id, ifs: [şartlar — hepsi tutmalı], not: [olamayacaklar] } (eski kayıtlarda tek şart: if)
   * Oluştur → 📏 Kurallar'dan düzenlenir (MO().crRules; yoksa sistem dosyasındaki).
   * not içinde küme de olabilir: '*a' diğer tüm ✅ izinler, '*d' diğer tüm 🚫 reddedişler, 'g:<grup id>' grubun diğer seçenekleri
   * ("diğer" = şartlarda olmayanlar; sonradan eklenen olay / seçenek de kümeye girer) */
  const crRules = () => (S().monia || {}).crRules || (Stories.SYSTEM || {}).crRules || [];
  const crIfs = r => r.ifs || (r.if ? [r.if] : []);
  // şartlar arası bağlaç: ops[j] = ifs[j] ile ifs[j+1] arası ('and' | 'or'). "ve"ler grup olur, gruplardan biri tutarsa kural geçerli
  const crGroups = r => { const ifs = crIfs(r), out = [[]]; ifs.forEach((x, j) => { if (j && (r.ops || [])[j - 1] === 'or') out.push([]); out[out.length - 1].push(x); }); return ifs.length ? out : []; };
  const crMatch = (r, d) => crGroups(r).some(g => g.every(x => crHas(d, x)));
  const permPool = () => tagCats(PERM_TAG).flatMap(poolOf);
  // kümeleri tek tek değerlere açar
  const crExpand = r => {
    const ifs = crIfs(r), out = [];
    (r.not || []).forEach(v => {
      if (v === '*a' || v === '*d') permPool().forEach(e => { const x = (v === '*a' ? 'a:' : 'd:') + e.id; if (!ifs.includes(x)) out.push(x); });
      else if (String(v).startsWith('g:')) { const g = T.groups.find(x => x.id === v.slice(2)); (g ? g.values : []).forEach(x => { if (!ifs.includes(x)) out.push(x); }); }
      else out.push(v);
    });
    return out;
  };
  // kuraldaki değer: özellik ('Experience: Virgo'), 'f:<aç/kapa>', ✅ 'a:<olay id>' izin verdiği, 🚫 'd:<olay id>' izin vermediği
  const CR_EV = { 'a:': { key: 'allows', icon: '✅', other: 'denies', o: 'd:' }, 'd:': { key: 'denies', icon: '🚫', other: 'allows', o: 'a:' } };
  const crEv = x => CR_EV[String(x).slice(0, 2)];
  const crHas = (d, x) => { const ev = crEv(x); if (ev) return (d[ev.key] || []).includes(x.slice(2)); return String(x).startsWith('f:') ? !!(d.fields || {})[x.slice(2)] : (d.traits || []).includes(x); };
  const crLabel = x => {
    if (x === '*a') return '✅ Diğer tüm izinler';
    if (x === '*d') return '🚫 Diğer tüm reddedişler';
    if (String(x).startsWith('g:')) { const g = T.groups.find(y => y.id === x.slice(2)); return `🧺 ${g ? g.label.replace(/^[^\p{L}\p{N}]+/u, '').trim() : x.slice(2)} (diğerleri)`; }
    const ev = crEv(x);
    if (ev) { const e = allEvents().find(y => y.id === x.slice(2)); return `${ev.icon} ${e ? e.title : '?'}`; }
    if (!String(x).startsWith('f:')) return x; const f = charFields().find(y => y.id === x.slice(2)); return `🔘 ${f ? f.label : x.slice(2)}`;
  };
  // şu an olamayacaklar: Map(değer → engelleyen şartların yazısı)
  const crText = r => crGroups(r).map(g => g.map(crLabel).join(' + ')).join(' veya ');
  /* ✅/🚫 bölümünün kendi ayarları (Oluştur → ✅ İzinler → ⚙️; MO().permCfg, yoksa sistem dosyasındaki):
   * allow / deny: 🎲 rastgelede [en az, en çok] kaç olay · rules: sadece bu bölümün kuralları (crRules biçiminde, tek şart) */
  const PERM_DEF = { allow: [1, 3], deny: [1, 3], rules: [] };
  const permCfg = () => Object.assign({}, PERM_DEF, (S().monia || {}).permCfg || (Stories.SYSTEM || {}).permCfg || {});
  // ✅/🚫 dışında bir şey içermeyen kural (genel kurallardan izin paneline taşınabilir)
  const permOnly = r => [...crIfs(r), ...(r.not || [])].every(v => /^(a:|d:|\*a$|\*d$)/.test(v));
  function crBlocked(d) {
    const m = new Map();
    [...crRules(), ...permCfg().rules].forEach(r => { if (crMatch(r, d)) crExpand(r).forEach(v => { if (!m.has(v)) m.set(v, crText(r)); }); });
    return m;
  }
  // kurala aykırıları düzeltir (repick: tek seçimli grupta yerine izinli biri gelir); ✅ olamayan olay 🚫'ye, 🚫 olamayan ✅'ye geçer
  // çıkanların yazısını döndürür
  function crFix(d, repick) {
    const bl = crBlocked(d), gone = (d.traits || []).filter(t => bl.has(t));
    d.traits = (d.traits || []).filter(t => !bl.has(t));
    if (repick) gone.forEach(t => { const g = T.groups.find(x => x.single && x.values.includes(t)), ok = g ? g.values.filter(v => !bl.has(v)) : []; if (ok.length) d.traits.push(pick(ok)); });
    return [...gone, ...crFixPerms(d)].map(crLabel);
  }
  // sadece ✅/🚫 listeleri (ör. ✅ Nothing → 🚫 hiçbiri): olamayan olay diğer listeye geçer. Değişenleri döndürür ('a:<id>' / 'd:<id>')
  function crFixPerms(d) {
    const bl = crBlocked(d), moved = [];
    Object.entries(CR_EV).forEach(([pre, ev]) => (d[ev.key] || []).filter(id => bl.has(pre + id)).forEach(id => {
      d[ev.key] = d[ev.key].filter(x => x !== id);
      if (!bl.has(ev.o + id)) d[ev.other] = [...new Set([...(d[ev.other] || []), id])];
      moved.push(pre + id);
    }));
    return moved;
  }
  // kayıtlı tüm karakterlerin ✅/🚫 listelerini kurallara uydurur (kural sonradan eklendiyse); düzelen karakter sayısı
  const crFixAllPerms = () => chars().filter(c => crFixPerms(c).length).length;
  /* ⚙️ İzin ayarları (Oluştur → ✅ İzinler): 🎲 kaç olay seçilir + bu bölümün kendi kuralları.
   * Genel 📏 kurallardaki sadece ✅/🚫 içeren kurallar ilk açılışta buraya gelir, 💾 Kaydet'te oradan taşınır. done(): kaydedince
   * Aynı panel 📏 Kurallar sayfasında "✅ İzin kuralları" sekmesi olarak da açılır (renderPermRulesPage) */
  function permCfgSheet(done) {
    const sh = sheet(`
      <div class="sheet-grip"></div>
      <h3>⚙️ İzin ayarları</h3>
      <div id="pcHost"></div>`, 'light');
    const save = permCfgUI(sh.el.querySelector('#pcHost'), () => { sh.close(); if (done) done(); });
    topSave(sh, save);
  }
  // panel host'a çizilir; dönüş: kaydet fonksiyonu
  function permCfgUI(host, done) {
    const cur = permCfg(), moved = cur.rules.length || (S().monia || {}).permCfg ? [] : crRules().filter(permOnly);
    const dr = { allow: [...cur.allow], deny: [...cur.deny], rules: JSON.parse(JSON.stringify([...cur.rules, ...moved])).map(r => ({ id: r.id, ifs: crIfs(r).slice(0, 1), not: r.not || [] })) };
    const evs = permPool(), max = evs.length;
    const evOpts = (skip, sets) => Object.entries(CR_EV).map(([pre, ev]) => `<optgroup label="${ev.icon} ${ev.key === 'allows' ? 'İzin verdiği' : 'İzin vermediği'}">${evs.filter(e => !skip.includes(pre + e.id)).map(e => `<option value="${esc(pre + e.id)}">${ev.icon} ${esc((e.emojis ? e.emojis + ' ' : '') + e.title)}</option>`).join('')}</optgroup>`).join('')
      + (sets ? `<optgroup label="🧺 Küme">${['*a', '*d'].filter(v => !skip.includes(v)).map(v => `<option value="${v}">${esc(crLabel(v))}</option>`).join('')}</optgroup>` : '');
    const range = (k, icon, label) => `<div class="pc-range"><span>${icon} ${label}</span>
      <label>en az <input type="number" min="0" max="${max}" data-pcn="${k}:0" value="${dr[k][0]}"></label>
      <label>en çok <input type="number" min="0" max="${max}" data-pcn="${k}:1" value="${dr[k][1]}"></label></div>`;
    const body = () => `
      <div class="sec-title" style="margin-top:0">🎲 Rastgelede kaç tane</div>
      ${range('allow', '✅', 'İzin verdiği')}
      ${range('deny', '🚫', 'İzin vermediği')}
      <div class="mo-vars">Havuzda ${max} olay var. Kurallar sayıdan önce gelir: kurala aykırı olacak olay seçilmez (ör. ✅ Nothing çıkarsa 🚫 boş kalır).</div>
      <div class="sec-title">📏 Bu bölümün kuralları <small>· "Eğer şu varsa → şunlar olamaz"</small></div>
      ${moved.length ? `<div class="mo-vars">📦 ${moved.length} kural genel 📏 Oluştur kurallarından buraya alındı; kaydedince oradan taşınır.</div>` : ''}
      <div class="pc-rules">${dr.rules.map((r, i) => `<div class="pc-rule" data-pr="${i}">
        <div class="pc-if"><small>Eğer</small><select data-prif>${r.ifs[0] ? '' : '<option value="">şart seç…</option>'}${evOpts([]).replace(`value="${esc(r.ifs[0] || '')}"`, `value="${esc(r.ifs[0] || '')}" selected`)}</select><button type="button" class="icon-btn" data-prrm aria-label="Sil">🗑️</button></div>
        <div class="pc-not"><small>🚫 olamaz</small>${r.not.map((v, j) => `<button type="button" class="chip mo-pick on${v[0] === '*' ? ' cr-set' : ''}" data-prnrm="${j}">${esc(crLabel(v))} ✕</button>`).join('')}
          <select data-prnot><option value="">➕ ekle…</option>${evOpts([...r.ifs, ...r.not], true)}</select></div>
      </div>`).join('') || '<div class="about">Henüz kural yok. ör. Eğer ✅ Nothing → 🚫 olamaz: 🚫 Diğer tüm reddedişler.</div>'}</div>
      <button type="button" class="btn ghost block" data-pradd style="margin-top:8px">➕ Kural ekle</button>`;
    host.innerHTML = `
      <div id="pcBody">${body()}</div>
      <button type="button" class="btn primary block" id="pcSave" style="margin-top:12px">💾 Kaydet</button>`;
    const box = host.querySelector('#pcBody'), draw = () => { box.innerHTML = body(); };
    box.onchange = e => {
      const t = e.target, row = t.closest('[data-pr]'), r = row && dr.rules[+row.dataset.pr];
      if (t.dataset.pcn) { const [k, j] = t.dataset.pcn.split(':'); dr[k][+j] = Math.max(0, Math.min(max, Math.round(+t.value || 0))); if (dr[k][0] > dr[k][1]) dr[k][+j ? 0 : 1] = dr[k][+j]; return draw(); }
      if ('prif' in t.dataset && t.value) { r.ifs = [t.value]; r.not = r.not.filter(v => v !== t.value); }
      if ('prnot' in t.dataset && t.value) r.not = [...new Set([...r.not, t.value])];
      draw();
    };
    box.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const row = b.closest('[data-pr]'), r = row && dr.rules[+row.dataset.pr];
      if ('pradd' in b.dataset) { dr.rules.push({ id: Store.uid(), ifs: [], not: [] }); return draw(); }
      if ('prrm' in b.dataset) { dr.rules.splice(+row.dataset.pr, 1); return draw(); }
      if (b.dataset.prnrm != null) { r.not.splice(+b.dataset.prnrm, 1); return draw(); }
    };
    const saveCfg = () => {
      const mo = S().monia = S().monia || {};
      mo.permCfg = { allow: dr.allow, deny: dr.deny, rules: dr.rules.filter(r => r.ifs.length && r.not.length) };
      if (moved.length) mo.crRules = crRules().filter(r => !moved.some(x => x.id === r.id));
      const fixed = crFixAllPerms();
      save();
      notify(fixed ? `İzin ayarları kaydedildi · ${fixed} karakterin izinleri düzeldi` : 'İzin ayarları kaydedildi', '⚙️');
      if (done) done();
    };
    host.querySelector('#pcSave').onclick = saveCfg;
    return saveCfg;
  }

  // 📏 Kurallar sayfasının sekmeleri: genel kurallar · ✅ izin kuralları (#/kurallar/izin)
  const crTabs = k => `<nav class="mo-tabs"><a href="#/kurallar"${k ? '' : ' class="on"'}>📏 Genel kurallar <span class="sc-badge">${crRules().length}</span></a><a href="#/kurallar/izin"${k ? ' class="on"' : ''}>✅ İzin kuralları <span class="sc-badge">${permCfg().rules.length}</span></a></nav>`;
  function renderPermRulesPage() {
    if (ui.prevPage && !ui.prevPage.startsWith('#/kurallar')) ui.crBack = ui.prevPage;
    view.onclick = view.onchange = null;
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('kurallar', '📏', 'Oluştur kuralları', [`${crRules().length + permCfg().rules.length} kural`, 'tüm karakterler için'], '', { back: ui.crBack || '#/me' })}
        ${crTabs('izin')}
        <div class="mo-top sticky pg-bar"><button type="button" class="btn primary sm" id="pcTopSave">💾 Kaydet</button></div>
        <div class="about card">✅ İzin verdiği / 🚫 vermediği olayların kendi kuralları ve 🎲 rastgelede kaç tane seçileceği. Oluştur → ✅ İzinler → ⚙️ ile de açılır.</div>
        <div class="card" id="pcHost"></div>
      </div>`;
    $('#pcTopSave').onclick = permCfgUI($('#pcHost'), () => renderPermRulesPage());
  }

  // 📏 Oluştur kuralları paneli (#/kurallar): tüm karakterler için geçerli. Taslak: ui.crDraft (💾 Kaydet'e kadar)
  function renderRulesPage() {
    const rules = ui.crDraft || (ui.crDraft = JSON.parse(JSON.stringify(crRules())));
    if (ui.prevPage && !ui.prevPage.startsWith('#/kurallar')) ui.crBack = ui.prevPage;
    // ✅ / 🚫 olaylar: 'if' etiketli kategorilerden (izin verdiği / vermediği)
    const permEvs = permPool();
    rules.forEach(r => { if (!r.ifs) { r.ifs = crIfs(r); delete r.if; } });
    const evOpts = (cur, skip) => Object.entries(CR_EV).map(([pre, ev]) => permEvs.length ? `<optgroup label="${ev.icon} ${ev.key === 'allows' ? 'İzin verdiği' : 'İzin vermediği'}">${permEvs.filter(e => !(skip || []).includes(pre + e.id)).map(e => `<option value="${esc(pre + e.id)}"${pre + e.id === cur ? ' selected' : ''}>${ev.icon} ${esc((e.emojis ? e.emojis + ' ' : '') + e.title)}</option>`).join('')}</optgroup>` : '').join('');
    const opts = (cur, skip) => T.groups.filter(g => g.items.length).map(g => `<optgroup label="${esc(g.label)}">${g.values.filter(v => !(skip || []).includes(v)).map(v => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(g.single ? g.items[g.values.indexOf(v)] : v)}</option>`).join('')}</optgroup>`).join('') + evOpts(cur, skip);
    const toggles = cur => { const fs = charFields().filter(f => f.type === 'toggle'); return fs.length ? `<optgroup label="🔘 Durumlar (açıksa)">${fs.map(f => `<option value="f:${esc(f.id)}"${'f:' + f.id === cur ? ' selected' : ''}>🔘 ${esc(f.label)}</option>`).join('')}</optgroup>` : ''; };
    // kurala şu an uymayan karakterler
    const broken = r => chars().filter(c => crMatch(r, c) && crExpand(r).some(v => crHas(c, v)));
    // 🧺 küme düğmeleri: tek tıkla bir grubun ya da izin listesinin "diğerleri"
    const sets = r => [
      ...(permEvs.length ? ['*a', '*d'] : []),
      ...T.groups.filter(g => g.single && g.items.length).map(g => 'g:' + g.id)
    ].filter(v => !(r.not || []).includes(v));
    const draw = () => { const y = window.scrollY; renderRulesPage(); window.scrollTo(0, y); };
    view.innerHTML = `
      <div class="page-pad narrow monia">
        ${pageHero('kurallar', '📏', 'Oluştur kuralları', [`${rules.length} kural`, 'tüm karakterler için'], '', { back: ui.crBack || '#/me' })}
        ${crTabs('')}
        <div class="mo-top sticky pg-bar"><button type="button" class="btn primary sm" id="crSave">💾 Kaydet</button></div>
        <div class="about card">Tüm karakterler için geçerli: bir özellik seçiliyse bazı özellikler olamaz (ör. <b>Experience: Virgo</b> → 🚫 <b>Pussy Size: Loose</b>). İzin verdiği / vermediği olaylar da olur: <b>Experience: Virgo</b> → 🚫 <b>✅ Nothing</b> (izin veremez, izin vermediklerine geçer). "Eğer"e birden çok şart ekleyebilirsin; aradaki <b>ve</b>'ye dokununca <b>veya</b> olur ("ve"ler birlikte tutmalı, "veya" ile ayrılan gruplardan biri yeter). 🧺 Küme düğmeleri bir grubun ya da izin listesinin "diğerlerini" tek seferde ekler; sonradan eklenenler de kümeye girer. Oluştur'da seçilemez, 🎲 rastgele de seçmez. ✅/🚫 izinlerin kendi kuralları ve 🎲 sayıları <a href="#/kurallar/izin"><b>✅ İzin kuralları</b></a> sekmesinde.</div>
        <div class="cr-grid">${rules.map((r, i) => { const bad = broken(r); return `<div class="card cr-row" data-ri="${i}">
          <div class="cr-if"><span class="cr-n">${i + 1}</span><small>Eğer</small>${r.ifs.map((v, j) => `${j ? `<button type="button" class="cr-and${(r.ops || [])[j - 1] === 'or' ? ' or' : ''}" data-crop="${j - 1}" title="Dokun: ve ⇄ veya">${(r.ops || [])[j - 1] === 'or' ? 'veya' : 've'}</button>` : ''}<button type="button" class="chip mo-pick on cr-ifc" data-crirm="${j}">${esc(crLabel(v))} ✕</button>`).join('')}
            <select data-crif><option value="">${r.ifs.length ? '➕ ve…' : '➕ şart seç…'}</option>${toggles('')}${opts('', r.ifs)}</select><button type="button" class="icon-btn" data-crrm aria-label="Sil">🗑️</button></div>
          <div class="cr-not"><small>🚫 olamaz</small>${(r.not || []).map((v, j) => `<button type="button" class="chip mo-pick on${/^(\*|g:)/.test(v) ? ' cr-set' : ''}" data-crnrm="${j}">${esc(crLabel(v))} ✕</button>`).join('')}
            <select data-crnot><option value="">➕ ekle…</option>${opts('', [...r.ifs, ...(r.not || [])])}</select></div>
          ${sets(r).length ? `<div class="cr-sets"><small>🧺 Küme</small>${sets(r).map(v => `<button type="button" class="chip cr-setb" data-crset="${esc(v)}">${esc(crLabel(v))}</button>`).join('')}${(r.not || []).length ? '<button type="button" class="chip cr-clear" data-crclr>✕ Temizle</button>' : ''}</div>` : ''}
          ${bad.length ? `<div class="cr-bad">⚠️ Uymayan: ${bad.map(c => esc(c.name)).join(', ')}</div>` : ''}</div>`; }).join('')
          || '<div class="empty"><span class="big">📏</span>Henüz kural yok.<br>➕ Kural ekle ile başla.</div>'}</div>
        <button type="button" class="btn ghost block" id="crAdd" style="margin-top:10px">➕ Kural ekle</button>
      </div>`;
    view.onchange = e => {
      const row = e.target.closest('[data-ri]');
      if (!row) return;
      const r = rules[+row.dataset.ri];
      if ('crif' in e.target.dataset && e.target.value && !r.ifs.includes(e.target.value)) { r.ifs = [...r.ifs, e.target.value]; r.ops = [...(r.ops || []), 'and'].slice(0, r.ifs.length - 1); r.not = (r.not || []).filter(v => !r.ifs.includes(v)); }
      if ('crnot' in e.target.dataset && e.target.value) r.not = [...new Set([...(r.not || []), e.target.value])];
      draw();
    };
    view.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const row = b.closest('[data-ri]'), r = row && rules[+row.dataset.ri];
      if (b.id === 'crAdd') { rules.push({ id: Store.uid(), ifs: [T.all.find(v => v.endsWith(': ' + VIRGIN_ITEM)) || T.all[0]].filter(Boolean), not: [] }); return draw(); }
      if ('crrm' in b.dataset) { rules.splice(+row.dataset.ri, 1); return draw(); }
      if (b.dataset.crirm != null) { const j = +b.dataset.crirm; r.ifs.splice(j, 1); if (r.ops) r.ops.splice(Math.max(0, j - 1), 1); return draw(); }
      if (b.dataset.crop != null) { r.ops = r.ops || []; r.ops[+b.dataset.crop] = r.ops[+b.dataset.crop] === 'or' ? 'and' : 'or'; return draw(); }
      if (b.dataset.crnrm != null) { r.not.splice(+b.dataset.crnrm, 1); return draw(); }
      if (b.dataset.crset) { r.not = [...(r.not || []), b.dataset.crset]; return draw(); }
      if ('crclr' in b.dataset) { r.not = []; return draw(); }
      if (b.id === 'crSave') {
        MO().crRules = rules.filter(x => x.ifs.length && (x.not || []).length).map(x => ({ id: x.id, ifs: x.ifs, ...((x.ops || []).includes('or') ? { ops: x.ops.slice(0, x.ifs.length - 1) } : {}), not: x.not }));
        ui.crDraft = null;
        const fixed = crFixAllPerms();
        save(); notify(fixed ? `Kurallar kaydedildi · ${fixed} karakterin izinleri düzeldi` : 'Kurallar kaydedildi', '📏'); draw();
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
    // ❤️ 5–8 sevdiği, 💔 3–5 sevmediği (havuz yetmezse ikisi de küçülür)
    if (k === 'all' || k === 'feel') {
      const nl = 5 + Math.floor(Math.random() * 4), nd = 3 + Math.floor(Math.random() * 3);
      const pool = sample(feelPool().map(e => e.id), nl + nd);
      const n = Math.min(nl, Math.ceil(pool.length * nl / (nl + nd)));
      d.likes = pool.slice(0, n);
      d.dislikes = pool.slice(n);
      // 🦄 0–2 fantezi, çoğu ❤️
      sample(fantPool().map(e => e.id), Math.floor(Math.random() * 3)).forEach(id => (Math.random() < .7 ? d.likes : d.dislikes).push(id));
    }
    // 👗 genelde giydikleri (kişiliğe göre günlük / iddialı) ve şu anki kombin
    if (k === 'all' || k === 'wear') randWear(d);
    // ✅/🚫 sadece 'if' etiketli kategorilerden; sayılar ⚙️ İzin ayarlarından, kurala aykırı olacak olay atlanır (kural sayıdan önce gelir)
    if (k === 'all' || k === 'perm') {
      const pc = permCfg(), ids = permPool().map(e => e.id);
      const count = ([a, b]) => { a = Math.max(0, +a || 0); b = Math.max(a, +b || 0); return a + Math.floor(Math.random() * (b - a + 1)); };
      const na = count(pc.allow), nd = count(pc.deny);
      d.allows = []; d.denies = [];
      const fits = () => { const bl = crBlocked(d); return !d.allows.some(x => bl.has('a:' + x)) && !d.denies.some(x => bl.has('d:' + x)); };
      const tryAdd = (key, id) => { d[key].push(id); if (fits()) return true; d[key].pop(); return false; };
      sample(ids, ids.length).forEach(id => { if (d.allows.length < na && tryAdd('allows', id)) return; if (d.denies.length < nd) tryAdd('denies', id); });
    }
    // 🌱 doğurganlık: çoğu normal civarı, uçlar seyrek
    if ((k === 'all' || k === 'fert') && charFields().some(f => f.id === FERT_ID)) {
      const v = Math.round((Math.random() + Math.random() + Math.random()) / 3 * 20) * 5;
      d.fields = { ...(d.fields || {}), [FERT_ID]: v };
    }
    // 📏 izin kuralları (ör. Virgo → ✅ X olamaz) seçilen olaylara da uygulanır
    if (d.traits) crFix(d, true);
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

        <div class="sec-title" style="margin:12px 16px 8px" data-nav="👀 Önizleme">Önizleme</div>
        <div class="preview" id="pv">${previewHtml(d)}</div>

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

        <div class="ctrl cr-fold feel-box" id="permBox" data-fold="perm" data-nav="✅ İzinler">
          <div class="row2"><span>✅ İzin verdiği / 🚫 vermediği olaylar <small>"${PERM_TAG}" etiketli kategorilerden · 🎲 ✅ ${permCfg().allow.join('–')} · 🚫 ${permCfg().deny.join('–')} · 📏 ${permCfg().rules.length} kural</small></span><button type="button" class="dice-btn" id="permCfgBtn" aria-label="İzin ayarları">⚙️</button>${dice('perm')}</div>
          ${PERMS.map(f => `<div class="mo-sub">${f.icon} ${f.label}</div>
            <div class="presets">${feelEvents(d[f.key]).map(e => `<button type="button" class="on x" data-feelrm="${f.key}" data-id="${esc(e.id)}">${evEmo(e)}${esc(e.title)}</button>`).join('')}
              <button type="button" class="chip" data-feeladd="${f.key}">➕ Seç</button></div>`).join('')}
        </div>

        <div class="ctrl cr-fold" data-fold="wear" data-nav="👗 Giyim">
          <div class="row2"><span>👗 Giyim <small>genelde giydikleri · profilde istediğin gibi giydirirsin</small></span><button type="button" class="dice-btn" id="wearEdit" aria-label="Düzenle">✏️</button>${dice('wear')}</div>
          ${CL.slots.map(s => { const its = (d.wardrobe || []).map(clItem).filter(x => x && x.slot === s.id); return `<div class="mo-sub">${s.icon} ${esc(s.label)}</div>
            <div class="presets">${its.map(x => `<button type="button" class="on x${x.style === 'i' ? ' bold' : ''}" data-wrm="${esc(x.id)}">${x.emoji} ${esc(x.name)}${x.style === 'i' ? ' 🔥' : ''}</button>`).join('') || '<small class="mo-empty">—</small>'}</div>`; }).join('')}
        </div>

        <div class="ctrl" data-nav="📝 Hakkında">
          <div class="row2"><span>📝 Hakkında</span><small>geçmişi, sırları, ilişkileri</small></div>
          <textarea id="cAbout" rows="4" maxlength="2000" placeholder="Nasıl konuşur, neyi sever, kimden hoşlanır...">${esc(d.about)}</textarea>
        </div>

        <div class="ctrl">
          <div class="row2"><span>🎨 Renk <small>fotoğraf yoksa avatar ve kapak</small></span>${dice('color')}</div>
          <div class="swatches">${T.colors.map((p, i) => `<button type="button" class="sw ${p.join() === (d.colors || []).join() ? 'on' : ''}" data-color="${i}" style="background:linear-gradient(135deg,${p[0]},${p[1]})" aria-label="Renk ${i + 1}"></button>`).join('')}</div>
        </div>

        <div class="actions" style="padding-bottom:calc(20px + var(--safe-b))">
          ${id ? '<button class="btn ghost" id="delBtn" style="color:#ff2d55">🗑️ Sil</button>' : '<button class="btn ghost" id="clearBtn">Temizle</button>'}
          <button class="btn primary" id="saveBtn">${id ? '💾 Kaydet' : '✨ Oluştur'}</button>
        </div>
      </div>`;


    const redraw = () => { const y = window.scrollY; renderCreate(id); window.scrollTo(0, y); };
    polishCreate();
    // 👗 gardırop: ✕ ile çıkar, ✏️ ile seç (genelde giydikleri); kombin gardıroptan kurulur
    view.querySelectorAll('[data-wrm]').forEach(b => b.onclick = () => { d.wardrobe = (d.wardrobe || []).filter(x => x !== b.dataset.wrm); d.outfit = randOutfit(d); redraw(); });
    $('#wearEdit').onclick = () => dressSheet(d, () => { d.outfit = randOutfit(d); redraw(); }, true);
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
      if (!was && bl0.has(t)) { notify(`📏 ${bl0.get(t)} varken ${t} olamaz`, '📏'); return; }
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
    // ❤️/💔 ve ✅/🚫 listeleri: bir olay çiftin ya birinde ya diğerinde olur
    $('#feelBox').onclick = $('#permBox').onclick = e => {
      const rm = e.target.closest('[data-feelrm]'), add = e.target.closest('[data-feeladd]');
      if (rm) { d[rm.dataset.feelrm] = (d[rm.dataset.feelrm] || []).filter(x => x !== rm.dataset.id); redraw(); }
      if (!add) return;
      const key = add.dataset.feeladd, set = feelSet(key), f = set.list.find(x => x.key === key), other = set.list.find(x => x.key !== key).key;
      const fcats = [...tagCats(set.tag), ...(set.tag === CHAT_TOP_TAG ? tagCats(FANT_TAG) : [])];
      if (!fcats.flatMap(poolOf).length) { notify(`Önce bir kategoriye "${set.tag}" etiketi ver (Monia → 🗂️ Kategoriler)`, '🗂️'); return; }
      poolPicker({ title: `${f.icon} ${f.label}`, noGroups: true, cats: fcats.map(c => c.id),
        skip: feelEvents([...(d[key] || []), ...(d[other] || [])]).map(x => x.title) }, evs => {
        // 📏 kural: bu listeye giremeyen olaylar eklenmez
        const pre = Object.keys(CR_EV).find(p => CR_EV[p].key === key), bl = crBlocked(d);
        const no = pre ? evs.filter(x => bl.has(pre + x.id)) : [], ids = evs.filter(x => !no.includes(x)).map(x => x.id);
        if (no.length) notify(`📏 ${bl.get(pre + no[0].id)} varken ${no.map(x => x.title).join(', ')} ${key === 'allows' ? 'izinli' : 'izinsiz'} olamaz`, '📏');
        d[key] = [...new Set([...(d[key] || []), ...ids])];
        d[other] = (d[other] || []).filter(x => !ids.includes(x));
        const gone = crFix(d);
        if (gone.length) notify(`📏 Kurala göre değişti: ${gone.join(', ')}`, '📏');
        redraw();
      });
    };
    $('#permCfgBtn').onclick = e => { e.stopPropagation(); permCfgSheet(() => { crFixPerms(d); redraw(); }); };
    const cfBox = $('#cfBox');
    cfBox.oninput = e => {
      const t = e.target, fid = t.dataset.cf;
      if (!fid) return;
      d.fields[fid] = t.type === 'number' || t.type === 'range' ? (t.value === '' ? '' : +t.value) : t.value;
      const out = cfBox.querySelector(`[data-cfv="${CSS.escape(fid)}"]`);
      if (out) out.textContent = t.value;
      const fw = fid === FERT_ID && cfBox.querySelector('[data-cffert]');
      if (fw) fw.textContent = fertWord(t.value);
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
      const moved = crFixPerms(d);
      if (moved.length) notify(`📏 Kurala göre değişti: ${moved.map(crLabel).join(', ')}`, '📏');
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
  // 🦄 fanteziler ('fantesy' etiketli kategoriler) de ❤️/💔 listelerine girer; rastgelede en fazla 2 tane
  const FANT_TAG = 'fantesy';
  const fantPool = () => tagCats(FANT_TAG).flatMap(poolOf);
  // bot sorgusunda süren fantezi bir anahtarla gider ("fant fxkopek"): adındaki "Doggy" gibi kelimeler pozisyon kurallarını tutmasın
  const FANT_KEYS = [['cat girl', 'fxkedi'], ['bunny girl', 'fxtavsan'], ['fox girl', 'fxtilki'], ['doggy girl', 'fxkopek'], ['unicorn girl', 'fxunikorn'],
    ['bondage', 'fxbag'], ['cheating', 'fxgizli'], ['sex toys', 'fxtoy'], ['belly bulge', 'fxkarin'], ['cumflation', 'fxdolum'],
    ['kadın hoca', 'fxrpprof'], ['patron', 'fxrpofis'], ['hoca', 'fxrpkampus'], ['doktor', 'fxrpmuayene'], ['polis', 'fxrpsorgu'], ['yeni komşu', 'fxrpkapi'], ['hizmetçi', 'fxrpev'], ['masöz', 'fxrpmasaj']];
  const fantKey = e => (FANT_KEYS.find(([t]) => String(e.title || '').toLocaleLowerCase('tr').startsWith(t)) || [, 'fxdiger'])[1];
  const isFant = e => !!e &&((catOfEv(e).tags || []).includes(FANT_TAG) || String(catOfEv(e).label || '').toLocaleLowerCase('tr') === FANT_TAG);
  // ✅/🚫 karakterin izin verdiği / vermediği olaylar: 'if' etiketli kategorilerden (c.allows / c.denies)
  const PERM_TAG = 'if';
  const PERMS = [{ key: 'allows', icon: '✅', label: 'İzin verdiği olaylar' }, { key: 'denies', icon: '🚫', label: 'İzin vermediği olaylar' }];
  const feelSet = key => FEELS.some(f => f.key === key) ? { list: FEELS, tag: CHAT_TOP_TAG } : { list: PERMS, tag: PERM_TAG };
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
    const grpOfEv = e => dr.grps.find(g => (g.evs || []).some(x => [e.id, e.src, e.base].includes(x))) || ((e.outcomes || []).length ? null : dr.grps.find(g => sharedByTag(g, e)));
    const evTagOpts = allEvTags(), catTagOpts = [...new Set(moCats().flatMap(c => c.tags || []))];
    // 🏷️ ortak sonucun etiketleri: olay etiketi / kategori etiketi; eşleşen (kendi sonucu olmayan) olay sayısı
    const grpTags = g => { const has = (g.tags || []).length || (g.ctags || []).length, n = has ? evs.filter(x => !(x.outcomes || []).length && sharedByTag(g, x)).length : 0;
      return `<div class="cs-grp-evs cs-grp-tags"><small>🏷️ Etikete göre · olayın ya da kategorisinin etiketi tutarsa (kendi sonucu olmayan olaylar)</small>
        ${(g.tags || []).map((t, k) => `<button type="button" class="mo-chip" data-csgtrm="${k}" title="Çıkar">🏷️ ${esc(t)} ✕</button>`).join('')}${(g.ctags || []).map((t, k) => `<button type="button" class="mo-chip" data-csgctrm="${k}" title="Çıkar">🗂️ ${esc(t)} ✕</button>`).join('')}
        <select data-csgtag><option value="">🏷️ Olay etiketi…</option>${evTagOpts.filter(t => !(g.tags || []).includes(t)).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
        <select data-csgctag><option value="">🗂️ Kategori etiketi…</option>${catTagOpts.filter(t => !(g.ctags || []).includes(t)).map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}</select>
        ${has ? `<em class="cs-tagn">${n} olay eşleşiyor</em>` : ''}</div>`; };
    const evById = id => evs.find(x => x.id === id);
    // olayların sonuçlarının düzenleme taslağı (💾 Kaydet'te olaylara yazılır)
    const draftOuts = e => {
      const list = (dr.outs[e.id] || (dr.outs[e.id] = { list: JSON.parse(JSON.stringify(e.outcomes || [])) })).list;
      list.forEach(o => { if (!o.id) o.id = Store.uid(); });
      return list;
    };
    // sonucun ⋯ seçenekleri (etki, sonraki olay, şart, ⭐/⧉/📋/✕) sadece açılınca görünür
    const csOpen = ui.csOpen || (ui.csOpen = new Set()), trOpen = ui.trOpen || (ui.trOpen = new Set());
    // 🕰️ saat ayarları taslağı ve saat kurallarının değiştirebileceği sayısal parametreler
    dr.clock = dr.clock || JSON.parse(JSON.stringify(clockCfg()));
    dr.clock.rules = dr.clock.rules || [];
    const ckParams = evParams().filter(p => !p.bool);
    // 🎚️ değere göre olay taslağı (sadece 📊 parametreler)
    dr.bands = dr.bands || JSON.parse(JSON.stringify(bandRules()));
    const bandParams = evParams().filter(p => p.prm);
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
            <button type="button" class="chip" data-csgadd>➕ Olay</button><input class="hs-in cs-gin" placeholder="# ekle"></div>${grpTags(e.grp)}`
        : `<button type="button" class="cs-ev mo-chip${evCls(e)}"${evStyle(e)} data-csed="${esc(e.id)}">${evEmo(e)}${esc(e.title)} <small>${e.bot ? esc((e.bot.when || []).join(' · ') || 'yedek') : '✏️'}</small></button>
          ${e.bot ? '' : sg ? `<div class="cs-note">🔗 <b>${esc(sg.title || 'Ortak sonuç')}</b> kullanıyor · aşağıdaki kendi sonuçları kullanılmaz</div>` : '<button type="button" class="chip cs-share" data-csshare title="Bu sonuçları başka olaylarla paylaş">🔗 Paylaş</button>'}`}
        ${(e.onEffects || []).length ? `<div class="cs-on"><small>⚡ olunca</small>${e.onEffects.map(ef => `<em class="cs-eff ${+ef.d > 0 ? 'up' : 'down'}">${esc(effLabel(ef))}</em>`).join('')}</div>` : ''}
        <div class="cs-outs">${outs.map((o, j) => { const ck = o._ck || 'not', open = csOpen.has(o.id), nx = o.next && evById(o.next); return `<div class="cs-out${open ? ' open' : ''}" data-oj="${j}" data-oid="${esc(o.id)}">
          <label class="cs-bar"><i style="width:${Math.min(100, +o.pct || 0)}%"></i><input type="number" min="0" max="100" data-csp value="${+o.pct || 0}"><b>%</b></label>
          <div class="cs-body">
            <div class="cs-line"><input class="cs-t" data-cst maxlength="200" value="${esc(o.text || '')}" placeholder="Sonuç (ör. {ben} hamile kaldı) · # ile sonraki olay">
              <button type="button" class="cs-more" data-csmore title="${open ? 'Seçenekleri kapat' : 'Etki, şart, sonraki olay…'}" aria-expanded="${open}">${open ? '▴' : '⋯'}</button></div>
            ${o.def || (o.effects || []).length || (o.conds || []).length || nx ? `<div class="cs-tags">${o.def ? '<em class="cs-defb" title="Şart tutmazsa bu olur">⭐ varsayılan</em>' : ''}${(o.effects || []).map((ef, k) => `<button type="button" class="cs-eff ${+ef.d > 0 ? 'up' : 'down'}" data-cserm="${k}" title="Kaldır">${esc(effLabel(ef))} ✕</button>`).join('')}${(o.conds || []).map((cd, k) => `<button type="button" class="cs-cond" data-cscrm="${k}" title="Kaldır">${esc(condText(cd))} ✕</button>`).join('')}${nx ? `<em class="cs-nxb">↪ ${evEmo(nx)}${esc(nx.title)}</em>` : ''}</div>` : ''}
            ${open ? `<div class="cs-tools">
            <div class="cs-acts">
              <button type="button" class="${o.def ? 'on' : ''}" data-csdef title="Şart tutmazsa bu olur">⭐ Varsayılan</button>
              <button type="button" data-csdup>⧉ Çoğalt</button>
              <button type="button" data-cscopy title="Başka olaya yapıştırmak için">📋 Kopyala</button>
              <button type="button" class="danger" data-csorm>✕ Sil</button></div>
            ${evParams().length ? `<div class="cs-add"><span class="cs-lbl">📈 Etki</span>${effSel('data-csesel')}<input type="number" data-csedl value="1" step="1" title="Miktar"><button type="button" class="chip" data-cseadd>Ekle</button></div>` : ''}
            <div class="cs-add"><span class="cs-lbl">↪ Sonra</span><select data-csnx class="cs-nx"><option value="">sonraki olay yok</option>${evOptions(CHAT_TOP_TAG, o.next || '', skip)}</select></div>
            <div class="cs-add cs-conds"><span class="cs-lbl">🔒 Şart</span>
              <select data-csck title="Şart türü"><option value="not"${ck === 'not' ? ' selected' : ''}>🚫 olmadıysa</option><option value="had"${ck === 'had' ? ' selected' : ''}>📜 olduysa</option>${condParams().length ? `<option value="p"${ck === 'p' ? ' selected' : ''}>📊 parametre</option>` : ''}${condBools().length ? `<option value="b"${ck === 'b' ? ' selected' : ''}>🔘 durum</option>` : ''}</select>
              ${ck === 'p' ? `<select data-cscp>${condParams().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-cscop><option value=">=">≥</option><option value="<=">≤</option></select><input type="number" data-cscv value="50">`
                : ck === 'b' ? `<select data-cscb>${condBools().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-cscbv><option value="1">ise (Evet)</option><option value="0">değilse (Hayır)</option></select>`
                : `<select data-csce class="cond-ev">${evOptions('if', '', skip)}</select>`}
              <button type="button" class="chip" data-cscadd>Ekle</button></div>
            </div>` : ''}
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
          <div class="sec-title" style="margin-top:0">⚡ Eşik olayları <small>· bir değer sınırı geçince 📜 olay olur, ya da olay olmadan 🎲 olayın sonuçları, 🔗 ortak sonuç veya 🎯 tek bir sonuç tetiklenir</small></div>
          <div class="tr-list">${dr.triggers.map((t, i) => {
            if (!t.id) t.id = Store.uid();
            const open = trOpen.has(t.id), has = t.text || (t.effects || []).length || (t.conds || []).length;
            let tk = t._ck || (condParams().length ? 'p' : 'b');
            if (tk === 'p' && !condParams().length) tk = 'b';
            return `<div class="tr-row${open ? ' open' : ''}" data-ti="${i}">
            <select data-tf="p">${numParams.map(p => opt(p.id, t.p, p.label)).join('')}</select>
            <select data-tf="op">${opt('>=', t.op || '>=', '≥ yükselince')}${opt('<=', t.op, '≤ düşünce')}</select>
            <input type="number" data-tf="v" value="${num(t.v)}">
            <span class="tr-arrow">→</span>
            <select data-tf="ev" class="tr-ev"><option value="">— hedef yok (sadece mesaj / etki)</option>${trOptions(t.ev)}</select>
            <button type="button" class="cs-more" data-trmore title="${open ? 'Seçenekleri kapat' : 'Mesaj, etki, şart'}" aria-expanded="${open}">${open ? '▴' : '⋯'}</button>
            <button type="button" data-trm aria-label="Sil">✕</button>
            ${has ? `<div class="tr-sum">${(t.conds || []).map((cd, k) => `<button type="button" class="cs-cond" data-trcrm="${k}" title="Kaldır">${esc(condText(cd))} ✕</button>`).join('')}${t.text ? `<em class="tr-msg">💬 ${esc(t.text)}</em>` : ''}${(t.effects || []).map((ef, k) => `<button type="button" class="cs-eff ${+ef.d > 0 ? 'up' : 'down'}" data-trerm="${k}" title="Kaldır">${esc(effLabel(ef))} ✕</button>`).join('')}</div>` : ''}
            ${open ? `<div class="cs-tools tr-tools">
              <div class="cs-add"><span class="cs-lbl">💬 Mesaj</span><input class="tr-text" data-tf="text" maxlength="200" value="${esc(t.text || '')}" placeholder="Karakterden gelir (ör. {ben} sana bağlandı)"></div>
              ${evParams().length ? `<div class="cs-add"><span class="cs-lbl">📈 Etki</span>${effSel('data-tresel')}<input type="number" data-tredl value="1" step="1" title="Miktar"><button type="button" class="chip" data-treadd>Ekle</button></div>` : ''}
              ${condParams().length || condBools().length ? `<div class="cs-add"><span class="cs-lbl">🔒 Şart</span>
                <select data-trck>${condParams().length ? `<option value="p"${tk === 'p' ? ' selected' : ''}>📊 parametre</option>` : ''}${condBools().length ? `<option value="b"${tk === 'b' ? ' selected' : ''}>🔘 durum</option>` : ''}</select>
                ${tk === 'p' ? `<select data-trcp>${condParams().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-trcop><option value=">=">≥</option><option value="<=">≤</option></select><input type="number" data-trcv value="50">`
                  : `<select data-trcb>${condBools().map(p => `<option value="${esc(p.id)}">${esc(p.label)}</option>`).join('')}</select><select data-trcbv><option value="1">ise (Evet)</option><option value="0">değilse (Hayır)</option></select>`}
                <button type="button" class="chip" data-trcadd>Ekle</button></div>` : ''}
            </div>` : ''}</div>`; }).join('') || '<small class="mo-empty">Henüz yok. Ör. ❤️ Aşk ≥ 80 → İtiraf</small>'}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="trAdd"${numParams.length && evs.length ? '' : ' disabled'}>➕ Eşik olayı ekle</button></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🕰️ Saat <small>· sohbet başlangıç saatinde başlar, her mesajda ilerler; saate göre parametreler artar / azalır (⚡ eşikleri de tetikler)</small></div>
          <div class="ck-set">
            <label class="ck-on"><input type="checkbox" data-ckf="on"${dr.clock.on !== false ? ' checked' : ''}> Açık</label>
            <label>Başlangıç <input type="time" data-ckf="start" value="${esc(dr.clock.start || '20:00')}"></label>
            <label>Mesaj başına <input type="number" min="0" max="240" data-ckf="step" value="${num(dr.clock.step)}"> dk</label>
          </div>
          <div class="tr-list">${dr.clock.rules.map((r, i) => `<div class="tr-row ck-row" data-ci="${i}">
            <select data-ckr="every">${opt('msg', r.every || 'msg', 'her mesajda')}${opt('hour', r.every, 'her saat başı')}${opt('at', r.every, 'saat gelince')}</select>
            <input type="time" data-ckr="from" value="${esc(r.from || '22:00')}">${r.every === 'at' ? '' : `<span class="tr-arrow">–</span><input type="time" data-ckr="to" value="${esc(r.to || '02:00')}">`}
            <span class="tr-arrow">→</span>
            <select data-ckr="p" class="ck-p">${ckParams.map(p => opt(p.id, r.p, p.label)).join('')}</select>
            <input type="number" data-ckr="d" value="${num(r.d)}" step="1" title="Miktar (− azaltır)">
            <button type="button" data-ckrm aria-label="Sil">✕</button></div>`).join('') || '<small class="mo-empty">Henüz kural yok. Ör. her mesajda 22:00 – 02:00 → 🔥 Şehvet +1 · her saat başı 00:00 – 06:00 → 💦 Cum +10 · saat gelince 03:00 → 🤝 Güven −5</small>'}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="ckAdd"${ckParams.length ? '' : ' disabled'}>➕ Saat kuralı ekle</button></div>
          <div class="mo-vars">Sohbette sol üstteki saate dokunarak o sohbetin saatini ve hızını değiştirebilirsin.</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🎚️ Değere göre olay <small>· bir kategoriden olay olunca, parametrenin o anki değerine göre aralığı tutan olay ardından gelir (ör. Cumming → 💦 Cum'a göre miktar)</small></div>
          <div class="bd-list">${dr.bands.map((r, i) => `<div class="bd-rule" data-bi="${i}">
            <div class="bd-h"><select data-bdf="when"><optgroup label="🗂️ Kategoriden olay olunca">${moCats().map(c => opt(c.id, r.when, `${c.icon} ${c.label} olunca`)).join('')}</optgroup>
              <optgroup label="🏷️ Bu etiketli olay olunca">${evTagOpts.map(t => opt('tag:' + t, r.when, `🏷️ ${t} olunca`)).join('')}</optgroup></select>
              <select data-bdf="p">${bandParams.map(p => opt(p.id, r.p, `${p.label} değerine göre`)).join('')}</select>
              <select data-bdf="if" title="Şart"><option value="">şart yok</option>${charFields().filter(f => f.type === 'toggle').map(f => opt('f:' + f.id, r.if || '', `🔘 ${f.label} ise`)).join('')}</select>
              <button type="button" class="icon-btn" data-bdrm aria-label="Kuralı sil">🗑️</button></div>
            <div class="bd-bands">${(r.bands || []).map((b, j) => `<div class="bd-band" data-bj="${j}">
              <input type="number" data-bdb="min" value="${num(b.min)}" title="en az"><span>–</span><input type="number" data-bdb="max" value="${num(b.max)}" title="en çok">
              <span class="tr-arrow">→</span><select data-bdb="ev" class="ck-p">${evs.map(e => opt(e.id, b.ev, (e.emojis ? e.emojis + ' ' : '') + e.title)).join('')}</select>
              <button type="button" data-bdbrm aria-label="Aralığı sil">✕</button></div>`).join('')}</div>
            <button type="button" class="chip" data-bdbadd>➕ Aralık</button></div>`).join('') || '<small class="mo-empty">Henüz kural yok. Ör. Cumming olunca · 💦 Cum: 0–14 → Watery, 90–100 → High Sperm</small>'}</div>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="bdAdd"${bandParams.length && evs.length ? '' : ' disabled'}>➕ Kural ekle</button></div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🎲 Sebep → Sonuç <small>(${withOut.filter(e => !e.bot && !e.grp).length} olay)</small></div>
          <div class="mo-ev-btns" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="csAdd">➕ Bir olaya sonuç ekle</button></div>
          <input class="pk-search" id="csHash" placeholder="# yaz, olaya sonuç ekle…" autocomplete="off" style="margin-bottom:8px">
          <div class="mo-vars" style="margin:0 0 8px">Yüzdeleri, metni, 📈 parametre / 🔘 durum etkilerini ve 🔒 şartları burada değiştirip üstteki <b>💾 Kaydet</b>'e bas. ⧉ çoğaltır, 📋 kopyalar; kopyaladığını başka bir olaya 📥 yapıştırabilirsin.</div>
          <div class="cs-list">${withOut.map((e, ei) => e.bot || e.grp ? '' : csItem(e, ei)).join('') || '<div class="about">Henüz sonucu olan olay yok. ➕ ile bir olay seç; olay editöründe 🎲 Sonuçlar kartından ekle.</div>'}</div>
        </div>

        <div class="card">
          <div class="sec-title" style="margin-top:0">🔗 Ortak sonuçlar <small>· birden çok olay aynı sonuçları paylaşır; burada bir kez düzenlersin, hepsinde geçerli olur. Olayları tek tek seçebilir ya da 🏷️ olay / 🗂️ kategori etiketine bağlayabilirsin</small></div>
          <div class="mo-ev-btns" style="margin-bottom:6px"><button type="button" class="btn ghost sm" id="csGrpAdd">➕ Ortak sonuç</button><button type="button" class="btn ghost sm" id="csTagAdd">🏷️ Etikete göre sonuç</button></div>
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
    view.querySelectorAll('[data-cst]').forEach(i => {
      i.oninput = () => { at(i).o.text = i.value; touch(i); };
      // "#olay" yazınca seçilen olay ↪ sonraki olay olur (yazıdan silinir)
      hashSuggest(i, ev => { const { o } = at(i); o.text = i.value; o.next = ev.id; touch(i); draw(); }, { noSubs: true });
    });
    // seçilen olaylara boş bir sonuç ekler (sonuçları yoksa listeye gelirler)
    const addOutsTo = list => {
      let last = '';
      list.forEach(e => { const ent = dr.outs[e.id] || (dr.outs[e.id] = { list: JSON.parse(JSON.stringify(e.outcomes || [])) }); const o = { id: Store.uid(), text: '', pct: Math.max(0, 100 - ent.list.reduce((n, x) => n + (+x.pct || 0), 0)) }; ent.list.push(o); ent.dirty = true; last = o.id; });
      draw();
      // yeni sonuca kay, metnini yazmaya başla
      const row = last && view.querySelector(`[data-oid="${last}"]`);
      if (row) { row.scrollIntoView({ behavior: 'smooth', block: 'center' }); row.querySelector('.cs-t').focus({ preventScroll: true }); }
    };
    hashSuggest($('#csHash'), ev => addOutsTo([ev]), { whole: true, noSubs: true });
    view.querySelectorAll('[data-csp]').forEach(i => i.oninput = () => { at(i).o.pct = Math.max(0, Math.min(100, +i.value || 0)); touch(i); i.parentNode.querySelector('i').style.width = `${at(i).o.pct}%`; });
    view.querySelectorAll('[data-csnx]').forEach(i => i.onchange = () => { at(i).o.next = i.value; touch(i); });
    view.querySelectorAll('[data-csck]').forEach(i => i.onchange = () => { at(i).o._ck = i.value; draw(); });
    view.querySelectorAll('[data-ckf]').forEach(i => i.onchange = () => { const f = i.dataset.ckf; dr.clock[f] = f === 'on' ? i.checked : f === 'step' ? (i.value === '' ? '' : +i.value) : i.value; });
    view.querySelectorAll('[data-ckr]').forEach(i => i.onchange = () => {
      const r = dr.clock.rules[+i.closest('[data-ci]').dataset.ci], f = i.dataset.ckr;
      r[f] = f === 'd' ? +i.value || 0 : i.value;
      if (f === 'every') draw();
    });
    view.querySelectorAll('[data-bdf], [data-bdb]').forEach(i => i.onchange = () => {
      const r = dr.bands[+i.closest('[data-bi]').dataset.bi];
      if (i.dataset.bdf) { r[i.dataset.bdf] = i.value; return; }
      const b = r.bands[+i.closest('[data-bj]').dataset.bj], f = i.dataset.bdb;
      b[f] = f === 'ev' ? i.value : +i.value || 0;
    });
    view.querySelectorAll('[data-trck]').forEach(i => i.onchange = () => { dr.triggers[+i.closest('[data-ti]').dataset.ti]._ck = i.value; draw(); });
    hashSelects(view);
    // 🔗 ortak sonuca olay ekle (bir olay tek bir ortak sonuçta olur)
    const grpAdd = (g, ids) => {
      dr.grps.forEach(x => { if (x !== g) x.evs = (x.evs || []).filter(id => !ids.includes(id)); });
      g.evs = [...new Set([...(g.evs || []), ...ids])];
      dr.grpDirty = true;
    };
    view.querySelectorAll('[data-csgt]').forEach(i => i.oninput = () => { at(i).e.grp.title = i.value; dr.grpDirty = true; });
    view.querySelectorAll('[data-csgtag], [data-csgctag]').forEach(s => s.onchange = () => {
      if (!s.value) return;
      const g = at(s).e.grp, k = 'csgtag' in s.dataset ? 'tags' : 'ctags';
      g[k] = [...new Set([...(g[k] || []), s.value])]; dr.grpDirty = true; draw();
    });
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
      if (b.id === 'bdAdd') { dr.bands.push({ id: Store.uid(), when: (moCats()[0] || {}).id, p: bandParams[0].id, bands: [{ ev: evs[0].id, min: 0, max: 100 }] }); return draw(); }
      const bdr = b.closest('[data-bi]');
      if (bdr) {
        const r = dr.bands[+bdr.dataset.bi];
        if ('bdrm' in ds) { dr.bands.splice(+bdr.dataset.bi, 1); return draw(); }
        if ('bdbrm' in ds) { r.bands.splice(+b.closest('[data-bj]').dataset.bj, 1); return draw(); }
        if ('bdbadd' in ds) { const last = r.bands[r.bands.length - 1], lo = last ? +last.max + 1 : 0; r.bands.push({ ev: evs[0].id, min: lo, max: lo + 19 }); return draw(); }
      }
      if (b.id === 'ckAdd') { dr.clock.rules.push({ id: Store.uid(), every: 'msg', from: '22:00', to: '02:00', p: ckParams[0].id, d: 1 }); return draw(); }
      if ('ckrm' in ds) { dr.clock.rules.splice(+b.closest('[data-ci]').dataset.ci, 1); return draw(); }
      if (tr) {
        const t = dr.triggers[+tr.dataset.ti];
        if ('trmore' in ds) { trOpen.has(t.id) ? trOpen.delete(t.id) : trOpen.add(t.id); return draw(); }
        if (ds.trerm != null) { t.effects.splice(+ds.trerm, 1); return draw(); }
        if (ds.trcrm != null) { t.conds.splice(+ds.trcrm, 1); return draw(); }
        if ('treadd' in ds) { const box = b.closest('.cs-add'); addEff(t, box.querySelector('[data-tresel]').value, +box.querySelector('[data-tredl]').value || 0); return draw(); }
        if ('trcadd' in ds) {
          const box = b.closest('.cs-add'), q = s => box.querySelector(`[${s}]`), k = q('data-trck').value;
          (t.conds = t.conds || []).push(k === 'p' ? { k, p: q('data-trcp').value, op: q('data-trcop').value, v: +q('data-trcv').value || 0 } : { k, p: q('data-trcb').value, v: q('data-trcbv').value === '1' });
          return draw();
        }
      }
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
      if (b.id === 'csAdd') return poolPicker({ title: '🎲 Sonuç eklenecek olay', noGroups: true, top: 'if' }, addOutsTo);
      if (b.id === 'csGrpAdd') return poolPicker({ title: '🔗 Aynı sonucu paylaşacak olaylar', noGroups: true }, list => {
        if (!list.length) return;
        const g = { id: Store.uid(), title: list.length > 1 ? list.map(x => x.title).slice(0, 3).join(' / ') : `${list[0].title} sonuçları`, evs: [], outs: [] };
        dr.grps.push(g);
        grpAdd(g, list.map(x => x.id));
        dr.outs['grp:' + g.id] = { list: [{ id: Store.uid(), text: '', pct: 100 }], dirty: true };
        draw();
      });
      if (b.id === 'csTagAdd') {
        const g = { id: Store.uid(), title: 'Etiket sonuçları', evs: [], tags: [], ctags: [], outs: [] };
        dr.grps.push(g); dr.grpDirty = true;
        dr.outs['grp:' + g.id] = { list: [{ id: Store.uid(), text: '', pct: 100 }], dirty: true };
        notify('🏷️ Olay ya da 🗂️ kategori etiketi seç, sonuçları yaz', '🏷️');
        return draw();
      }
      if (b.closest('[data-ei]') && (ds.csgtrm != null || ds.csgctrm != null)) {
        const g = at(b).e.grp, k = ds.csgtrm != null ? 'tags' : 'ctags';
        g[k].splice(+(ds.csgtrm != null ? ds.csgtrm : ds.csgctrm), 1); dr.grpDirty = true;
        return draw();
      }
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
        if ('csmore' in ds) { csOpen.has(o.id) ? csOpen.delete(o.id) : csOpen.add(o.id); return draw(); }
        if ('csnew' in ds) ent.list.push({ id: Store.uid(), text: '', pct: Math.max(0, 100 - ent.list.reduce((n, x) => n + (+x.pct || 0), 0)) });
        else if ('csorm' in ds) ent.list.splice(j, 1);
        else if ('csdup' in ds) { const cp = JSON.parse(JSON.stringify(o)); cp.id = Store.uid(); delete cp.def; ent.list.splice(j + 1, 0, cp); csOpen.add(cp.id); }
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
        MO().bandRules = dr.bands.filter(r => r.when && r.p && (r.bands || []).length)
          .map(r => ({ id: r.id || Store.uid(), when: r.when, p: r.p, ...(r.if ? { if: r.if } : {}), bands: r.bands.filter(x => x.ev).map(x => ({ ev: x.ev, min: +x.min || 0, max: +x.max || 0 })).sort((x, y) => x.min - y.min) }));
        const ck = dr.clock;
        MO().clock = { on: ck.on !== false, start: ck.start || '20:00', step: ck.step === '' || ck.step == null ? 5 : Math.max(0, +ck.step || 0),
          rules: ck.rules.filter(r => r.p && +r.d).map(r => ({ id: r.id || Store.uid(), every: r.every || 'msg', from: r.from || '00:00', ...(r.every === 'at' ? {} : { to: r.to || '00:00' }), p: r.p, d: +r.d })) };
        MO().triggers = dr.triggers.filter(t => t.p && (t.ev || String(t.text || '').trim() || (t.effects || []).length) && !isNaN(+t.v)).map(t => {
          const x = { id: t.id, p: t.p, op: t.op || '>=', v: +t.v, ev: t.ev || '' };
          if (String(t.text || '').trim()) x.text = String(t.text).trim();
          if ((t.effects || []).length) x.effects = t.effects;
          if ((t.conds || []).length) x.conds = t.conds;
          return x;
        });
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
        if (dr.grpDirty) MO().sharedOuts = dr.grps.filter(g => (g.evs || []).length || (g.tags || []).length || (g.ctags || []).length)
          .map(g => ({ id: g.id, title: String(g.title || '').trim() || 'Ortak sonuç', evs: g.evs || [], ...((g.tags || []).length ? { tags: g.tags } : {}), ...((g.ctags || []).length ? { ctags: g.ctags } : {}), outs: g.outs || [] }));
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
    if (sc) return renderScenario(sc, extra);
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
    const back = ui.moReturn && MO().scenarios.some(s => s.id === ui.moReturn) ? `#/monia/${ui.moReturn}/olaylar` : ui.moBack || '#/monia';
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
      location.hash = sc ? `#/monia/${sc.id}/olaylar` : ui.moBack || '#/monia';
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

  // Senaryo sayfası: 📋 Senaryo (kapak, zaman, mekan…) · 📜 Olaylar (#/monia/<id>/olaylar, zaman çizelgesi)
  function renderScenario(sc, extra) {
    const evTab = extra === 'olaylar', base = `#/monia/${sc.id}`;
    const draw = () => renderScenario(sc, extra);
    const autoTitle = () => `${scPlaceIcon(sc)} ${scPlaceName(sc)}`;
    // ad hâlâ mekandan geliyorsa mekanla birlikte değişir
    const set = patch => { const auto = sc.title === autoTitle(); Object.assign(sc, patch); if (auto && scPlaceName(sc)) sc.title = autoTitle(); save(); draw(); };
    const chip = (attr, val, label, on) => `<button type="button" class="chip mo-pick${on ? ' on' : ''}" ${attr}="${esc(val)}">${label}</button>`;
    // Zaman / Mekan panelleri açılıp kapanır (tercih bu cihazda hatırlanır)
    const fold = moFold();
    const foldHead = (k, title, sum) => `<button type="button" class="mo-fold${fold[k] ? ' closed' : ''}" data-fold="${k}">
      <span class="sec-title">${title}</span><small>${esc(sum)}</small><i>${fold[k] ? '▸' : '▾'}</i></button>`;
    const ms = scChars(sc);
    view.innerHTML = `
      <div class="page-pad narrow monia sc-page">
        <div class="mo-top"><a class="icon-btn" href="#/monia" aria-label="Geri">${ICON.arrowLeft}</a>
          <input id="scTitle" maxlength="50" value="${esc(sc.title)}" placeholder="Senaryo adı">
          <button type="button" class="btn pink sm" data-start>▶️ Başlat</button></div>
        <div class="sc-sum">
          <button type="button" data-goto="time"><i>🕰️</i><span>${esc(timeLabel(sc) || 'Zaman seçilmedi')}</span></button>
          <button type="button" data-goto="place"><i>${esc(scPlaceName(sc) ? scPlaceIcon(sc) : '📍')}</i><span>${esc(scPlaceName(sc) || 'Mekan seçilmedi')}</span></button>
          <button type="button" data-goto="chars"><i>${ms.length ? ms.slice(0, 3).map(c => avatar(c, 22)).join('') : '👥'}</i><span>${ms.length ? esc(ms.map(c => c.name.split(' ')[0]).join(', ')) : 'Başlatırken seçilir'}</span></button>
        </div>
        <nav class="mo-tabs sc-tabs"><a href="${base}"${evTab ? '' : ' class="on"'}>📋 Senaryo</a><a href="${base}/olaylar"${evTab ? ' class="on"' : ''}>📜 Olaylar <span class="sc-badge">${sc.events.length}</span></a></nav>
        ${evTab ? eventsPanel() : infoPanel()}
        <button class="btn pink block" data-start style="margin-top:14px">▶️ Hikayeyi başlat</button>
        ${evTab ? '' : `<div class="mo-ev-btns" style="margin-top:8px">
          <button class="btn ghost sm" id="scReroll">🎲 Hepsini yeniden üret</button>
          <button class="btn ghost sm" id="scCopy">📄 Kopyasını al</button>
          <button class="btn ghost sm" id="scExport">📤 Dışa aktar</button>
          <button class="btn ghost sm" id="scDel" style="color:#ff2d55">🗑️ Sil</button>
        </div>`}
      </div>`;

    function infoPanel() {
      return `
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

        <div class="card" id="scGo-chars">
          <div class="sec-title" style="margin-top:0">👥 Karakterler <small>· isteğe bağlı; seçmezsen başlatırken sorulur</small></div>
          ${chars().length ? `<div class="g-pick">${chars().map(c => `<button type="button" data-ch="${c.id}" class="${sc.chars.includes(c.id) ? 'on' : ''}">${avatar(c, 46)}<b>${esc(c.name)}</b></button>`).join('')}</div>`
            : '<div class="about">Önce <a href="#/create"><b>Oluştur</b></a> sekmesinden bir karakter oluştur.</div>'}
        </div>

        <div class="card" id="scGo-time">
          ${foldHead('time', '🕰️ Zaman', timeLabel(sc) || 'seçilmedi')}
          <div class="mo-fold-body"${fold.time ? ' hidden' : ''}>
          <div class="chips">${MD.parts.map(p => chip('data-part', p.id, `${p.icon} ${esc(p.label)}`, sc.part === p.id)).join('')}</div>
          <div class="chips">${MD.days.map(d => chip('data-day', d, esc(d), sc.day === d)).join('')}</div>
          <div class="chips">${MD.seasons.map(d => chip('data-season', d, esc(d), sc.season === d)).join('')}</div>
          <div class="field"><input id="scTime" maxlength="60" value="${esc(sc.timeNote || '')}" placeholder="Ek zaman notu (ör. 3 yıl sonra, ilk buluşmadan bir hafta önce)"></div>
          </div>
        </div>

        <div class="card" id="scGo-place">
          ${foldHead('place', '📍 Mekan', scPlaceName(sc) ? `${scPlaceIcon(sc)} ${scPlaceName(sc)}` : 'seçilmedi')}
          <div class="mo-fold-body"${fold.place ? ' hidden' : ''}>
          <div class="mo-ev-btns"><button type="button" class="btn ghost sm" id="scPlRoll">🎲 Rastgele mekan</button><button type="button" class="btn ghost sm" id="scPlAdd">➕ Mekan ekle</button></div>
          ${allGroups().map(g => { const ps = allPlaces().filter(p => inGroup(p, g)); return ps.length ? `<div class="mo-sub">${g.icon} ${esc(g.name)}</div>
            <div class="pl-grid">${ps.map(p => `<button type="button" data-pl="${p.id}" class="${p.id === sc.place && !sc.placeName ? 'on' : ''}${p.id.startsWith('u:') ? ' mine' : ''}"><span>${p.icon}</span><small>${esc(p.name)}</small></button>`).join('')}</div>` : ''; }).join('')}
          ${MO().places.length ? '<div class="mo-vars">Eklediğin bir mekanı düzenlemek için seçiliyken bir kez daha dokun.</div>' : ''}
          <div class="pl-own" style="margin-top:10px"><input id="scPlIcon" maxlength="4" placeholder="📍" value="${esc(sc.placeIcon || '')}"><input id="scPlName" maxlength="40" placeholder="Sadece bu senaryoya özel mekan (kaydedilmez)" value="${esc(sc.placeName || '')}"></div>
          </div>
        </div>`;
    }

    // 📜 Olaylar paneli: dikey zaman çizelgesi; karta dokun → ayrıntı, ⠿ sürükle → sırala, ＋ → araya ekle
    function eventsPanel() {
      const evs = sc.events.map(evLive), n = evs.length, open = ui.scOpen || (ui.scOpen = new Set()), fresh = ui.scNew || new Set();
      ui.scNew = null;
      const scPl = scPlaceName(sc) ? `${scPlaceIcon(sc)} ${scPlaceName(sc)}` : '';
      let curPl = scPl;
      const ins = i => `<div class="tl-ins"><button type="button" data-ins="${i}" aria-label="Buraya olay ekle">＋</button></div>`;
      const ocName = o => o.text || '↪ ' + ((allEvents().find(x => x.id === o.next) || {}).title || '');
      const rows = evs.map((e, i) => {
        const raw = sc.events[i], look = e.sub && e.sub !== '§rnd' ? withSub(e, e.sub) : e;
        const p = evPlace(e), pl = p ? `${p.icon} ${p.name}` : '', t = evTime(e), lv = levelOf(look);
        const subs = (e.subs || []).filter(s => s.title), ocs = e.outcomes || [], isOpen = open.has(raw.id);
        const moved = pl && pl !== curPl;
        if (moved) curPl = pl;
        // kart metni: başlıkla ve zaman etiketiyle aynı olan satırlar tekrar edilmez
        const lines = evText(look, sc).split('\n');
        if (t && lines[0] === `🕰️ ${t}`) lines.shift();
        if (!look.text && !(look.mix || []).length) lines.shift();
        const body = lines.join('\n').trim();
        return `${ins(i)}${moved ? `<div class="tl-move"><span>📍 ${esc(pl)}</span></div>` : ''}
          <div class="tl-ev${evCls(look)}${isOpen ? ' open' : ''}${fresh.has(raw.id) ? ' fresh' : ''}"${evStyle(look)} data-i="${i}">
            <div class="tl-node">${look.emojis ? esc(look.emojis) : i + 1}</div>
            <div class="tl-card" data-tog>
              <div class="tl-head"><span class="tl-n">${i + 1}</span><b>${esc(look.title || 'Olay')}</b>${raw.sub === '§rnd' ? '<em class="tl-rnd" title="Alt derece rastgele">🎲</em>' : ''}
                <button type="button" class="tl-grip" data-drag aria-label="Sürükleyerek sırala">⠿</button></div>
              ${t || p || lv || subs.length || ocs.length ? `<div class="tl-meta">${t ? `<em>🕰️ ${esc(t)}</em>` : ''}${p ? `<em>${esc(pl)}</em>` : ''}${lv ? `<em>📶 ${esc(lv.label)}</em>` : ''}${subs.length ? `<em>🪜 ${subs.length}</em>` : ''}${ocs.length ? `<em>🎲 ${ocs.length} sonuç</em>` : ''}</div>` : ''}
              ${body ? `<div class="tl-text">${esc(body)}</div>` : ''}
              ${isOpen ? `<div class="tl-more">
                ${e.desc ? `<div class="tl-desc">📝 ${esc(e.desc)}</div>` : ''}
                ${ocs.length ? `<div class="tl-ocs">${ocs.map(o => `<div class="tl-oc"><i style="width:${Math.max(0, Math.min(100, +o.pct || 0))}%"></i><span>${esc(ocName(o))}</span><b>%${esc(o.pct)}</b></div>`).join('')}</div>` : ''}
                ${subs.length ? `<label class="tl-subrow">🪜 Alt derece <select class="mo-subsel" data-subsel="${i}"><option value="">Varsayılan</option><option value="§rnd"${raw.sub === '§rnd' ? ' selected' : ''}>🎲 Rastgele</option>${subs.map(s => `<option value="${esc(s.id)}"${raw.sub === s.id ? ' selected' : ''}>${esc(s.title)}</option>`).join('')}</select></label>` : ''}
                <div class="tl-acts">
                  ${i > 0 ? '<button type="button" data-up>⬆️ Yukarı</button>' : ''}${i < n - 1 ? '<button type="button" data-down>⬇️ Aşağı</button>' : ''}
                  <button type="button" data-edit>✏️ Düzenle</button><button type="button" data-dup>⧉ Çoğalt</button><button type="button" data-swap>🎲 Değiştir</button><button type="button" data-rm class="danger">✕ Kaldır</button>
                </div></div>` : ''}
            </div>
          </div>`;
      }).join('');
      const count = f => evs.filter(f).length;
      return `
        <div class="tl-stats">
          <div><b>${n}</b><small>olay</small></div>
          <div><b>${count(e => evPlace(e))}</b><small>mekanlı</small></div>
          <div><b>${count(e => (e.outcomes || []).length)}</b><small>sonuçlu</small></div>
          <div><b>${count(e => (e.subs || []).some(s => s.title))}</b><small>alt dereceli</small></div>
        </div>
        <div class="tl-add">
          <button type="button" id="scPool"><i>➕</i><b>Havuzdan</b><small>bir ya da birkaç</small></button>
          <button type="button" id="scWrite"><i>✍️</i><b>Kendin yaz</b><small>bu senaryoya özel</small></button>
          <button type="button" id="scRand"><i>🎲</i><b>Rastgele</b><small>havuzdan bir olay</small></button>
        </div>
        <input class="pk-search" id="scHash" placeholder="# yaz, olay ekle…" autocomplete="off">
        <div class="tl${n ? '' : ' empty'}" id="scTl">
          <div class="tl-cap"><i>🎬</i><span><b>Başlangıç</b><small>${esc([timeLabel(sc), scPl].filter(Boolean).join(' · ') || 'zaman ve mekan 📋 Senaryo sekmesinde')}</small></span></div>
          ${rows || `<div class="tl-empty"><b>Henüz olay yok</b><small>Olaylar sohbette sırayla 📜 kart olarak gelir. Yukarıdan ekle.</small></div>`}
          ${n ? ins(n) : ''}
          <div class="tl-cap end"><i>🏁</i><span><b>Son</b><small>sonra sohbet serbestçe sürer</small></span></div>
        </div>
        ${n ? `<div class="tl-tools"><small>Karta dokun: ayrıntılar · ⠿ sürükle: sırala · ＋ araya ekle</small>
          <button type="button" class="chip" id="scOpenAll">${open.size && evs.every((e, i) => open.has(sc.events[i].id)) ? '▴ Hepsini kapat' : '▾ Hepsini aç'}</button>
          <button type="button" class="chip" id="scClear">🧹 Hepsini kaldır</button></div>` : ''}`;
    }

    $('#scTitle').onchange = e => { sc.title = e.target.value.trim() || 'Adsız senaryo'; save(); };
    view.querySelectorAll('[data-start]').forEach(b => { b.onclick = () => startScenario(sc); });
    if (evTab) return bindEvents();
    // 🕰️ / 📍 / 👥 özetine dokununca o bölüm açılır ve ona kayar
    if (ui.scGoto) {
      const el = $(`#scGo-${ui.scGoto}`);
      ui.scGoto = null;
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
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
      if (d.goto) { ui.scGoto = d.goto; if (fold[d.goto]) { fold[d.goto] = false; moFold(fold); } return draw(); }
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

    // 📜 Olaylar panelinin düğmeleri; at: araya ekleme sırası (yoksa sona)
    function bindEvents() {
      const addAt = (list, at) => {
        if (!list.length) return;
        sc.events.splice(at == null ? sc.events.length : at, 0, ...list);
        ui.scNew = new Set(list.map(x => x.id));
        save(); draw();
      };
      const randomEv = () => {
        const pool = allEvents().filter(e => !sc.events.some(x => x.title === e.title));
        if (!pool.length) { notify('Havuzda eklenmemiş olay kalmadı', '🎲'); return null; }
        return evCopy(pickOne(pool));
      };
      // havuzdan: ayrı ayrı olay olarak ya da 🧩 tek satırda birleşik (açıklaması sonra yazılır)
      const fromPool = at => poolPicker({ title: '➕ Havuzdan olay ekle', merge: true }, (evs, merged) => {
        if (merged && evs.length > 1) {
          const ev = { id: Store.uid(), title: evs.map(e => e.title).join(' + '), text: '', cat: 'mine', mix: evs.map(e => e.title) };
          addAt([ev], at); writeEvent(ev);
          return;
        }
        addAt(evs.map(evCopy), at);
      });
      const addRandom = at => { const x = randomEv(); if (x) addAt([x], at); };
      $('#scPool').onclick = () => fromPool();
      $('#scWrite').onclick = () => writeEvent(null);
      $('#scRand').onclick = () => addRandom();
      hashSuggest($('#scHash'), (e, sub) => {
        const x = evCopy(e);
        if (sub) x.sub = sub;
        useEvents([e.id]);
        addAt([x]);
        $('#scHash').focus();
      }, { whole: true });
      view.querySelectorAll('[data-subsel]').forEach(s => { s.onclick = e => e.stopPropagation(); s.onchange = () => { const ev = sc.events[+s.dataset.subsel]; if (s.value) ev.sub = s.value; else delete ev.sub; save(); draw(); }; });
      const open = ui.scOpen;
      if ($('#scOpenAll')) $('#scOpenAll').onclick = () => {
        const all = sc.events.every(e => open.has(e.id));
        sc.events.forEach(e => all ? open.delete(e.id) : open.add(e.id));
        draw();
      };
      if ($('#scClear')) $('#scClear').onclick = () => {
        if (!confirm(`${sc.events.length} olayın hepsi bu senaryodan kaldırılsın mı?`)) return;
        sc.events = []; save(); draw();
      };
      view.onclick = e => {
        const b = e.target.closest('button'), d = b ? b.dataset : {};
        if (d.goto) { ui.scGoto = d.goto; if (fold[d.goto]) { fold[d.goto] = false; moFold(fold); } location.hash = base; return; }
        if (d.ins != null) return insertSheet(+d.ins);
        const row = e.target.closest('.tl-ev');
        if (!row || 'drag' in d) return;
        const i = +row.dataset.i, ev = sc.events[i];
        if (!b) { if (e.target.closest('[data-tog]') && !e.target.closest('.tl-more')) { open.has(ev.id) ? open.delete(ev.id) : open.add(ev.id); draw(); } return; }
        if ('up' in d || 'down' in d) { const j = 'up' in d ? i - 1 : i + 1; [sc.events[i], sc.events[j]] = [sc.events[j], sc.events[i]]; ui.scNew = new Set([ev.id]); save(); draw(); }
        if ('edit' in d) writeEvent(ev);
        if ('dup' in d) { const x = { ...JSON.parse(JSON.stringify(ev)), id: Store.uid() }; open.add(x.id); addAt([x], i + 1); }
        if ('swap' in d) { const x = randomEv(); if (x) { sc.events.splice(i, 1); open.add(x.id); addAt([x], i); } }
        if ('rm' in d) {
          row.classList.add('gone');
          setTimeout(() => { sc.events.splice(sc.events.indexOf(ev), 1); open.delete(ev.id); save(); draw(); }, 220);
        }
      };
      // ＋ araya ekle: aynı üç yol, o sıraya
      function insertSheet(at) {
        const sh = sheet(`
          <div class="sheet-grip"></div>
          <h3>＋ ${at + 1}. sıraya olay ekle</h3>
          <div class="tl-add">
            <button type="button" data-insk="pool"><i>➕</i><b>Havuzdan</b></button>
            <button type="button" data-insk="write"><i>✍️</i><b>Kendin yaz</b></button>
            <button type="button" data-insk="rand"><i>🎲</i><b>Rastgele</b></button>
          </div>`, 'light');
        sh.el.onclick = e => {
          const b = e.target.closest('[data-insk]');
          if (!b) return;
          sh.close();
          const k = b.dataset.insk;
          if (k === 'pool') fromPool(at); else if (k === 'write') writeEvent(null, at); else addRandom(at);
        };
      }
      // ⠿ sürükle-bırak sıralama (fare ve dokunma)
      const tl = $('#scTl');
      tl.addEventListener('pointerdown', e => {
        const g = e.target.closest('[data-drag]');
        if (!g) return;
        e.preventDefault();
        const row = g.closest('.tl-ev'), from = +row.dataset.i, top0 = row.getBoundingClientRect().top;
        tl.classList.add('drag-on');
        const rows = [...tl.querySelectorAll('.tl-ev')], mids = rows.map(r => { const r0 = r.getBoundingClientRect(); return r0.top + r0.height / 2; });
        const fix = top0 - row.getBoundingClientRect().top, y0 = e.clientY;
        tl.style.setProperty('--sh', `${row.offsetHeight + 10}px`);
        row.classList.add('dragging');
        let to = from;
        g.setPointerCapture(e.pointerId);
        const move = ev => {
          const y = ev.clientY;
          row.style.transform = `translateY(${y - y0 + fix}px)`;
          to = from;
          mids.forEach((m, j) => { if (j < from && y < m) to = Math.min(to, j); if (j > from && y > m) to = Math.max(to, j); });
          rows.forEach((r, j) => { r.classList.toggle('shift-down', j >= to && j < from); r.classList.toggle('shift-up', j > from && j <= to); });
        };
        const end = () => {
          g.removeEventListener('pointermove', move);
          if (to !== from) { const [x] = sc.events.splice(from, 1); sc.events.splice(to, 0, x); ui.scNew = new Set([x.id]); save(); }
          draw();
        };
        g.addEventListener('pointermove', move);
        g.addEventListener('pointerup', end, { once: true });
        g.addEventListener('pointercancel', end, { once: true });
      });
    }

    // tek seferlik olay yaz / düzenle (kalıp olarak da kaydedilebilir); at: yeni olayın sırası
    function writeEvent(ev, at) {
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
        else { const x = { id: Store.uid(), title, text, cat: keep || 'mine', ...wt }; sc.events.splice(at == null ? sc.events.length : at, 0, x); ui.scNew = new Set([x.id]); }
        if (keep) MO().events.push({ ...evCopy(ev || { title, text, ...wt }), cat: keep });
        save(); sh.close(); draw();
      };
    }
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
    const FEEL_SAY = { likes: 'bunu sever', dislikes: 'bunu sevmez', allows: 'buna izin verir', denies: 'buna izin vermez' };
    const feel = scChars(sc).flatMap(m => [...FEELS, ...PERMS].filter(f => (m[f.key] || []).some(x => ids.includes(x))).map(f => `${f.icon} ${m.name.split(' ')[0]} ${FEEL_SAY[f.key]}`));
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
    outs = fertAdjust(outs, ctx.chars);
    const out = rollOutcome(outs);
    if (!out) return null;
    const block = outcomeBlock(out, ctx);
    if (!block) return { out };
    const miss = { text: String(out.text || '').replace(PARAM_WORD, '').trim(), why: condText(block), pct: out.pct };
    const def = (outs || []).find(o => o.def && o !== out && !outcomeBlock(o, ctx));
    return def ? { out: def, fallback: miss } : { blocked: miss };
  }

  /* 🌱 doğurganlık: hamile bırakan sonuçların (🔘 Hamile → Evet ya da {+Hamile}) yüzdesi karakterin doğurganlığıyla ölçeklenir:
   * %50 olduğu gibi, %0 kısır = hiç, %100 = iki katı. Aradaki fark diğer sonuçlara oranla dağılır (toplam aynı kalır).
   * Değer girilmemişse %50 sayılır; grupta karakterlerin ortalaması */
  const isPreg = o => (o.effects || []).some(ef => ef.p === 'f:hamile' && +ef.d > 0) || /\{\+\d*\s*hamile\}/i.test(o.text || '');
  /* 🩸 döngü takvimi ve 🤰 hamilelik zaman çizelgesi: karakterin "yaşadığı" sohbet dakikaları (c.life; 🕰️ saat ilerledikçe artar).
   * 28 günlük döngü: 1–5 regl, 11–16 riskli (doğurganlık ×1,8), gerisi düşük. Hamilelikte bir hafta = 2 saat sohbet zamanı, 40. haftada doğum */
  const PREG_WEEK = 120;
  const cycleDay = c => Math.floor((c.life || 0) / 1440 + (c.cycleOff != null ? +c.cycleOff : +sysHash('cyc' + (c.id || c.name)) % 28)) % 28 + 1;
  const cyclePhase = c => { const d = cycleDay(c); return d <= 5 ? 'regl' : d >= 11 && d <= 16 ? 'riskli' : d <= 10 ? 'erken' : 'gec'; };
  const CYCLE = { regl: { mul: .15, icon: '🩸', label: 'regl' }, erken: { mul: .7, icon: '🌸', label: 'düşük risk' }, riskli: { mul: 1.8, icon: '🔥', label: 'riskli gün' }, gec: { mul: .5, icon: '🌙', label: 'düşük risk' } };
  const pregWeek = c => (c.fields || {}).hamile && c.pregAt != null ? Math.floor(((c.life || 0) - c.pregAt) / PREG_WEEK) + 1 : 0;
  // saat ilerleyince (dt dakika): hamilelik haftası, 🍼 Süt artışı, üç ay geçişleri ve doğum; note(metin) sohbete not yazar
  function bodyTick(c, dt, note) {
    c.life = (c.life || 0) + dt;
    const f = c.fields || (c.fields = {}), first = String(c.name || '').split(' ')[0];
    if (f.hamile && c.pregAt == null) { c.pregAt = c.life; c.pregW = 1; sfx('preg'); }
    if (!f.hamile) { delete c.pregAt; delete c.pregW; return; }
    const w = pregWeek(c), was = c.pregW || 1;
    if (w <= was) return;
    c.pregW = w;
    const sut = allParams().find(p => p.who !== 'me' && String(p.label).toLocaleLowerCase('tr') === 'süt');
    if (sut && w >= 12) applyOutcome({ text: '', effects: [{ p: 'p:' + sut.id, d: 2 * (w - Math.max(was, 11)) }] }, [c.id]);
    if (w >= 40) { f.hamile = false; delete c.pregAt; delete c.pregW; c.births = (c.births || 0) + 1; note(`👶 ${first} doğum yaptı! Bebeğiniz dünyaya geldi 💗`); sfx('baby'); return; }
    [[13, '🤰 İkinci üç ay başladı'], [27, '🤰 Son üç ay başladı, karnı iyice büyüdü'], [36, '🤰 Doğum yaklaşıyor']].forEach(([k, t]) => { if (was < k && w >= k) note(`${t} · ${first} ${w}. haftada`); });
  }
  /* 👤 karakter menüsü (sohbette avatara uzun bas): profil, günlük, klonla, paylaş */
  function charMenu(c) {
    const sh = sheet(`<div class="sheet-grip"></div><h3>${avatar(c, 32)} ${esc(c.name)}</h3>
      <button class="act" data-cm="p">👤 Profil</button><button class="act" data-cm="diary">📔 Günlük</button>
      <button class="act" data-cm="clone">🧬 Klonla / varyant</button><button class="act" data-cm="share">📤 Paylaş (dosya / kod)</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-cm]');
      if (!b) return;
      sh.close();
      const a = b.dataset.cm;
      if (a === 'p' || a === 'diary') { ui.profileTab = a === 'diary' ? 'diary' : 'profile'; location.hash = `#/p/${c.id}`; }
      if (a === 'clone') cloneSheet(c);
      if (a === 'share') shareChar(c);
    };
  }
  /* 📤 karakter kartı: dosya (.carmen.json, fotoğraflar dahil) ya da kod (metin; cihazdan eklenmiş fotoğraflar hariç).
   * ❤️/💔/✅/🚫 olayları adlarıyla da taşınır, öbür cihazda kimlik yoksa adından bulunur */
  const CHAR_KIND = 'carmen-char';
  function charPack(c, lite) {
    const d = JSON.parse(JSON.stringify(c));
    ['id', 'life', 'pregAt', 'pregW', 'created'].forEach(k => delete d[k]);
    if (lite) { if (/^data:/.test(d.photo || '')) d.photo = ''; d.album = (d.album || []).filter(u => !/^data:/.test(u)); }
    const names = {};
    ['likes', 'dislikes', 'allows', 'denies'].forEach(k => { names[k] = feelEvents(d[k] || []).map(e => e.title); });
    return { kind: CHAR_KIND, v: 1, char: d, names };
  }
  const b64 = s => btoa(unescape(encodeURIComponent(s)));
  const unb64 = s => decodeURIComponent(escape(atob(s)));
  function shareChar(c) {
    const code = 'CARMEN:' + b64(JSON.stringify(charPack(c, true)));
    const sh = sheet(`<div class="sheet-grip"></div><h3>📤 ${esc(c.name)} paylaş</h3>
      <button class="act" data-sh="file">💾 Dosya olarak indir <small>(fotoğraflar dahil)</small></button>
      <button class="act" data-sh="code">📋 Kodu kopyala <small>(${Math.round(code.length / 1024)} KB · cihazdan eklenen fotoğraflar hariç)</small></button>
      <textarea class="share-code" readonly rows="3">${esc(code)}</textarea>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-sh]');
      if (!b) return;
      if (b.dataset.sh === 'file') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(charPack(c, false))], { type: 'application/json' }));
        a.download = `${(c.name || 'karakter').replace(/[^\p{L}\p{N}]+/gu, '_')}.carmen.json`;
        a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        notify('Dosya indirildi', '💾');
      }
      if (b.dataset.sh === 'code') {
        const ta = sh.el.querySelector('.share-code');
        (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => notify('Kod kopyalandı', '📋'), () => { ta.select(); document.execCommand('copy'); notify('Kod kopyalandı', '📋'); });
      }
    };
  }
  // 📥 içe aktar: dosya ya da kod → yeni karakter (yeni kimlikle)
  function importChar(raw) {
    let p;
    try { const s = String(raw || '').trim(); p = JSON.parse(s.startsWith('CARMEN:') ? unb64(s.slice(7)) : s); } catch (e) { p = null; }
    if (!p || p.kind !== CHAR_KIND || !p.char) { notify('Geçerli bir karakter kartı değil', '⚠️'); return null; }
    const c = Object.assign(blankChar(), p.char, { id: Store.uid(), created: Date.now() });
    const all = allEvents(), low = s => String(s || '').toLocaleLowerCase('tr');
    ['likes', 'dislikes', 'allows', 'denies'].forEach(k => {
      const ids = (c[k] || []).filter(id => all.some(e => e.id === id));
      const byName = ((p.names || {})[k] || []).map(t => (all.find(e => low(e.title) === low(t)) || {}).id).filter(Boolean);
      c[k] = [...new Set([...ids, ...byName])];
    });
    c.album = c.album || []; c.traits = c.traits || [];
    if (chars().some(x => x.name === c.name)) c.name += ' (yeni)';
    chars().push(c);
    save();
    notify(`${c.name} eklendi`, '📥');
    return c;
  }
  function importSheet() {
    const sh = sheet(`<div class="sheet-grip"></div><h3>📥 Karakter içe aktar</h3>
      <button class="act" data-im="file">📂 Dosya seç (.carmen.json)</button>
      <textarea class="share-code" id="imCode" rows="4" placeholder="ya da CARMEN:… kodunu yapıştır"></textarea>
      <button class="btn primary block" data-im="code">📥 Kodu içe aktar</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-im]');
      if (!b) return;
      const done = c => { if (c) { sh.close(); location.hash = `#/p/${c.id}`; } };
      if (b.dataset.im === 'code') done(importChar(sh.el.querySelector('#imCode').value));
      if (b.dataset.im === 'file') {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.json,application/json';
        inp.onchange = () => { const f = inp.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => done(importChar(rd.result)); rd.readAsText(f); };
        inp.click();
      }
    };
  }
  /* 🧬 klonla: aynısı, farklı kişilik ya da farklı beden (Pussy / Anal / Boob / Butt Size); sohbetler kopyalanmaz */
  function cloneSheet(c) {
    const sh = sheet(`<div class="sheet-grip"></div><h3>🧬 ${esc(c.name)} klonla</h3>
      <button class="act" data-cl="same">👯 Aynısı</button>
      <button class="act" data-cl="pers">🎭 Farklı kişilik</button>
      <button class="act" data-cl="body">📏 Farklı beden</button>
      <button class="act" data-cl="feel">❤️ Farklı sevdikleri</button>`, 'light');
    sh.el.onclick = e => {
      const b = e.target.closest('[data-cl]');
      if (!b) return;
      sh.close();
      const d = JSON.parse(JSON.stringify(c)), k = b.dataset.cl, mod = ui.createMod;
      ['life', 'pregAt', 'pregW', 'births'].forEach(x => delete d[x]);
      Object.assign(d, { id: Store.uid(), created: Date.now() });
      ui.createMod = 'amor';
      if (k === 'pers') randomize(d, 'personality');
      if (k === 'body') ['pussy', 'anal', 'boob', 'butt'].forEach(g => randomize(d, g));
      if (k === 'feel') randomize(d, 'feel');
      ui.createMod = mod;
      d.name = `${c.name} ${{ same: '✦', pers: '🎭', body: '📏', feel: '❤️' }[k]}`;
      chars().push(d);
      save();
      notify(`${d.name} oluşturuldu`, '🧬');
      location.hash = `#/p/${d.id}`;
    };
  }
  const EVFX = { drop: '💦', fire: '🔥', heart: '❤️' };
  function evFxKind(id) {
    const e = id && allEvents().find(x => x.id === id);
    if (!e) return '';
    const low = s => String(s || '').toLocaleLowerCase('tr'), cat = low(catOfEv(e).label), t = low(e.title);
    if ((e.tags || []).some(x => low(x) === 'boşalma') || cat === 'cumming size' || cat === 'lactation') return 'drop';
    if (t === 'orgazm' || cat === 'foreplay') return 'heart';
    if ((cat === 'mode' && /rough|brutal|passionate|assertive/.test(t)) || isFant(e)) return 'fire';
    return '';
  }
  /* 🔒 uygulama kilidi (bu cihazda, localStorage amor-stories:lock): 4–6 haneli PIN ve isteğe bağlı yüz / parmak izi (WebAuthn, cihazın kendi doğrulaması).
   * Açılışta ve uygulama 30 sn'den uzun arka planda kaldıktan sonra sorulur */
  const lockCfg = v => { try { if (v !== undefined) { if (v) localStorage.setItem('amor-stories:lock', JSON.stringify(v)); else localStorage.removeItem('amor-stories:lock'); } return JSON.parse(localStorage.getItem('amor-stories:lock') || 'null'); } catch (e) { return null; } };
  const pinHash = p => sysHash('carmen-pin:' + p);
  const bioOk = () => !!(window.PublicKeyCredential && window.isSecureContext && navigator.credentials);
  const toB64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const fromB64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
  async function bioAdd() {
    const cfg = lockCfg();
    if (!cfg || !bioOk()) return false;
    try {
      const cr = await navigator.credentials.create({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), rp: { name: 'Carmen' }, user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'carmen', displayName: 'Carmen' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }], authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' }, timeout: 60000 } });
      lockCfg({ ...cfg, bio: toB64(cr.rawId) });
      return true;
    } catch (e) { return false; }
  }
  async function bioCheck() {
    const cfg = lockCfg();
    if (!cfg || !cfg.bio || !bioOk()) return false;
    try { await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: fromB64(cfg.bio) }], userVerification: 'required', timeout: 60000 } }); return true; } catch (e) { return false; }
  }
  function showLock(then) {
    const cfg = lockCfg();
    if (!cfg || document.getElementById('lockScreen')) { if (!cfg && then) then(); return; }
    const el = document.createElement('div');
    el.id = 'lockScreen';
    el.className = 'lock-scr';
    let pin = '';
    const draw = (bad) => {
      el.innerHTML = `<div class="lk-box${bad ? ' bad' : ''}"><div class="lk-logo">🔒</div><h2>Carmen</h2><small>PIN'ini gir</small>
        <div class="lk-dots">${Array.from({ length: cfg.len || 4 }, (_, i) => `<i class="${i < pin.length ? 'on' : ''}"></i>`).join('')}</div>
        <div class="lk-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}
          ${cfg.bio && bioOk() ? '<button type="button" data-k="bio" aria-label="Yüz / parmak izi">🫆</button>' : '<span></span>'}<button type="button" data-k="0">0</button><button type="button" data-k="del" aria-label="Sil">⌫</button></div></div>`;
    };
    const open = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); if (then) then(); };
    el.onclick = async e => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'bio') { if (await bioCheck()) open(); return; }
      if (k === 'del') pin = pin.slice(0, -1); else if (pin.length < (cfg.len || 4)) pin += k;
      sfx('lock');
      if (pin.length === (cfg.len || 4)) {
        if (pinHash(pin) === cfg.h) return open();
        pin = ''; draw(true); if (navigator.vibrate) navigator.vibrate([40, 40, 40]); return;
      }
      draw();
    };
    draw();
    document.body.appendChild(el);
    if (cfg.bio && bioOk()) setTimeout(async () => { if (el.isConnected && await bioCheck()) open(); }, 300);
  }
  let hiddenAt = 0;
  function initLock() {
    if (lockCfg()) showLock();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (lockCfg() && hiddenAt && Date.now() - hiddenAt > 30000) showLock();
    });
    // ⎋ Esc iki kez (0,6 sn içinde) → 🙈 patron geldi
    let escAt = 0;
    document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; if (Date.now() - escAt < 600) { escAt = 0; bossKey(); } else escAt = Date.now(); });
  }
  function lockSheet(done) {
    const cfg = lockCfg();
    const sh = sheet(`<div class="sheet-grip"></div><h3>🔒 Uygulama kilidi</h3>
      <p class="kw-help">${cfg ? `Kilit açık (${cfg.len || 4} haneli PIN${cfg.bio ? ' · 🫆 yüz / parmak izi' : ''}).` : 'Açılışta ve uygulama 30 sn arka planda kaldıktan sonra PIN sorulur.'} PIN'i unutursan uygulamayı bu cihazda açamazsın; yedeğin olsun.</p>
      <input type="password" inputmode="numeric" maxlength="6" id="lkPin" placeholder="Yeni PIN (4–6 rakam)" class="share-code">
      <input type="password" inputmode="numeric" maxlength="6" id="lkPin2" placeholder="Yeni PIN tekrar" class="share-code">
      <button class="btn primary block" data-lk="set">${cfg ? '🔁 PIN\'i değiştir' : '🔒 Kilidi aç'}</button>
      ${cfg && bioOk() ? `<button class="act" data-lk="bio">🫆 ${cfg.bio ? 'Yüz / parmak izini yenile' : 'Yüz / parmak izi ekle'}</button>` : ''}
      ${cfg ? '<button class="act danger" data-lk="off">🔓 Kilidi kaldır</button>' : ''}`, 'light');
    sh.el.onclick = async e => {
      const b = e.target.closest('[data-lk]');
      if (!b) return;
      const a = b.dataset.lk;
      if (a === 'set') {
        const p1 = sh.el.querySelector('#lkPin').value.trim(), p2 = sh.el.querySelector('#lkPin2').value.trim();
        if (!/^\d{4,6}$/.test(p1)) return notify('PIN 4–6 rakam olmalı', '⚠️');
        if (p1 !== p2) return notify('PIN\'ler aynı değil', '⚠️');
        lockCfg({ ...(cfg || {}), h: pinHash(p1), len: p1.length });
        notify('🔒 Kilit açık', '🔒');
      }
      if (a === 'bio') notify(await bioAdd() ? '🫆 Yüz / parmak izi eklendi' : 'Eklenemedi (cihaz desteklemiyor ya da iptal edildi)', '🫆');
      if (a === 'off') { if (!confirm('Kilit kaldırılsın mı?')) return; lockCfg(null); notify('🔓 Kilit kaldırıldı', '🔓'); }
      sh.close();
      if (done) done();
    };
  }
  /* 🙈 Patron geldi: tek dokunuşla masum bir hesap makinesi; müzik durur, sekme adı değişir. "=" tuşuna uzun basınca geri döner (kilit varsa PIN sorulur) */
  function bossKey() {
    if (document.getElementById('bossScreen')) return;
    if (MU && MU.playing()) MU.stop(true);
    const title = document.title, el = document.createElement('div');
    el.id = 'bossScreen';
    el.className = 'boss-scr';
    document.title = 'Hesap Makinesi';
    let cur = '0', acc = null, op = null, fresh = true;
    const keys = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', ',', '='];
    const draw = () => { el.innerHTML = `<div class="bs-calc"><div class="bs-out">${esc(cur.replace('.', ','))}</div><div class="bs-keys">${keys.map(k => `<button type="button" data-c="${k}" class="${/[÷×−+=]/.test(k) ? 'op' : /[C±%]/.test(k) ? 'fn' : ''}${k === '0' ? ' zero' : ''}">${k}</button>`).join('')}</div></div>`; };
    const calc = (a, b, o) => ({ '+': a + b, '−': a - b, '×': a * b, '÷': b ? a / b : 0 })[o];
    el.onclick = e => {
      const b = e.target.closest('[data-c]');
      if (!b) return;
      const k = b.dataset.c, v = parseFloat(cur);
      if (/\d/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; }
      else if (k === ',') { if (!cur.includes('.')) cur += '.'; fresh = false; }
      else if (k === 'C') { cur = '0'; acc = null; op = null; fresh = true; }
      else if (k === '±') cur = String(-v);
      else if (k === '%') cur = String(v / 100);
      else if (k === '=') { if (op != null && acc != null) { cur = String(+calc(acc, v, op).toFixed(10)); acc = null; op = null; fresh = true; } }
      else { if (op != null && acc != null && !fresh) cur = String(+calc(acc, v, op).toFixed(10)); acc = parseFloat(cur); op = k; fresh = true; }
      draw();
    };
    // "=" uzun bas → çık
    let t = null;
    el.addEventListener('pointerdown', e => { if (e.target.closest('[data-c="="]')) t = setTimeout(() => { el.remove(); document.title = title; showLock(); }, 800); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(x => el.addEventListener(x, () => clearTimeout(t)));
    draw();
    document.body.appendChild(el);
  }
  /* 👗 giyim (js/data/clothes.js): c.wardrobe = genelde giydikleri (kıyafet kimlikleri), c.outfit = { ust, alt, elbise, sutyen, tanga, corap } şu an üstündekiler.
   * Elbise giyilince üst ve alt boşalır. Rastgelede kişiliğe göre iddialı parça oranı değişir (Flörtöz / Özgüvenli daha çok, Utangaç daha az) */
  const CL = Stories.CLOTHES || { slots: [], items: [] };
  const clItem = id => id && CL.items.find(x => x.id === id);
  const WEAR_ORDER = ['elbise', 'ust', 'alt', 'sutyen', 'tanga', 'corap'];
  const boldOf = c => {
    const tr = c.traits || [];
    let p = .35;
    if (tr.some(t => ['Flörtöz', 'Özgüvenli', 'Asi', 'Şımarık', 'Kibirli', 'Manipülatif'].includes(t))) p += .3;
    if (tr.some(t => ['Utangaç', 'Ciddi', 'Olgun', 'Güvensiz', 'Alçakgönüllü'].includes(t))) p -= .2;
    return Math.max(.05, Math.min(.9, p));
  };
  function randWear(d) {
    const p = boldOf(d), w = [];
    CL.slots.forEach(s => {
      const n = s.id === 'corap' ? (Math.random() < .6 ? 1 : 0) : 2, pool = CL.items.filter(x => x.slot === s.id && x.style !== 'k');
      for (let i = 0; i < n; i++) {
        const st = Math.random() < p ? 'i' : 'g', free = pool.filter(x => !w.includes(x.id)), pref = free.filter(x => x.style === st);
        const x = pickOne(pref.length ? pref : free);
        if (x) w.push(x.id);
      }
    });
    // 🎭 sevdiği fantezilerin kostümleri de gardıroba girer
    feelEvents(d.likes || []).filter(isFant).forEach(e => CL.items.filter(x => x.fant === fantKey(e)).forEach(x => { if (!w.includes(x.id)) w.push(x.id); }));
    d.wardrobe = w;
    d.outfit = randOutfit(d);
  }
  // rastgele kombin: gardıroptan (kostümler hariç)
  function randOutfit(c) {
    const w = (c.wardrobe || []).map(clItem).filter(x => x && x.style !== 'k'), of = s => { const xs = w.filter(x => x.slot === s); return xs.length ? pickOne(xs).id : ''; };
    const dress = !!of('elbise') && Math.random() < .35;
    return { ust: dress ? '' : of('ust'), alt: dress ? '' : of('alt'), elbise: dress ? of('elbise') : '', sutyen: of('sutyen'), tanga: of('tanga'), corap: Math.random() < .5 ? of('corap') : '' };
  }
  const outfitOf = c => c.outfit || {};
  const outfitItems = c => WEAR_ORDER.map(s => clItem(outfitOf(c)[s])).filter(Boolean);
  // bölgeye göre giydiği bir parçanın cümlesi: gogus (elbise / üst / sütyen), kalca (elbise / alt / tanga / çorap), any; çoğu zaman dış katman
  function wearLine(c, kind, zone) {
    const o = outfitOf(c), order = zone === 'gogus' ? ['elbise', 'ust', 'sutyen'] : zone === 'kalca' ? ['elbise', 'alt', 'tanga', 'corap'] : WEAR_ORDER;
    const xs = order.map(s => clItem(o[s])).filter(Boolean);
    if (!xs.length) return '';
    const x = Math.random() < .7 ? xs[0] : pickOne(xs);
    return pickOne(x[kind] || x.t) || '';
  }
  const slotLine = (c, slot, kind) => { const x = clItem(outfitOf(c)[slot]); return x ? pickOne(x[kind]) : ''; };
  // 👗 giydir: her yuva için parça seç (⭐ genelde giydikleri önde); ⭐ düğmesiyle gardırop düzenlenir. done() değişince çağrılır
  function dressSheet(c, done, wardrobeOnly) {
    let wmode = !!wardrobeOnly;
    const sh = sheet(`<div class="sheet-grip"></div><h3>👗 ${esc(String(c.name || 'Karakter').split(' ')[0])} · ${wardrobeOnly ? 'genelde giydikleri' : 'giydir'}</h3>
      <div class="row-btns">${wardrobeOnly ? '<button class="btn ghost" data-dr="rndw">🎲 Rastgele gardırop</button>' : '<button class="btn ghost" data-dr="rnd">🎲 Kombin</button><button class="btn ghost" data-dr="naked">🫣 Hepsini çıkar</button><button class="btn ghost" data-dr="wmode">⭐ Gardırop</button>'}</div>
      <p class="kw-help dr-help"></p>
      <div class="dr-h" style="margin-top:6px">🧥 Hazır kombinler</div><div class="dr-items dr-combos">${(CL.combos || []).map(k => `<button type="button" class="dr-it" data-dc="${k.id}">${k.emoji} ${esc(k.name)}${k.fant ? ' 🎭' : ''}</button>`).join('')}</div>
      <div class="dr-body"></div>`, 'light');
    const draw = () => {
      const o = outfitOf(c), w = new Set(c.wardrobe || []);
      sh.el.querySelector('.dr-help').textContent = wmode ? 'Dokun: genelde giydiklerine ekle / çıkar (⭐). 🔥 iddialı parçalar.' : 'Dokun: giydir. ⭐ genelde giydikleri önde, 🔥 iddialı. Elbise giyince üst ve alt çıkar.';
      const wb = sh.el.querySelector('[data-dr="wmode"]');
      if (wb) wb.classList.toggle('primary', wmode);
      sh.el.querySelector('.dr-body').innerHTML = CL.slots.map(s => {
        const cur = clItem(o[s.id]), its = CL.items.filter(x => x.slot === s.id).sort((a, b) => w.has(b.id) - w.has(a.id));
        return `<div class="dr-slot"><div class="dr-h">${s.icon} ${esc(s.label)}${!wmode && cur ? ` · <b>${esc(cur.name)}</b>` : ''}</div><div class="dr-items">
          ${wmode ? '' : `<button type="button" class="dr-it${cur ? '' : ' on'}" data-ds="${s.id}" data-di="">🚫 Yok</button>`}
          ${its.map(x => `<button type="button" class="dr-it${(wmode ? w.has(x.id) : cur === x) ? ' on' : ''}${x.style === 'i' ? ' bold' : ''}${x.style === 'k' ? ' kost' : ''}" data-ds="${s.id}" data-di="${x.id}">${x.emoji} ${esc(x.name)}${w.has(x.id) ? ' ⭐' : ''}${x.style === 'i' ? ' 🔥' : x.style === 'k' ? ' 🎭' : ''}</button>`).join('')}</div></div>`;
      }).join('');
    };
    sh.el.onclick = e => {
      const b = e.target.closest('[data-ds],[data-dr],[data-dc]');
      if (!b) return;
      const a = b.dataset.dr;
      // 🧥 hazır kombin: giydirir (gardırop modunda parçalarını genelde giydiklerine ekler)
      const cb = b.dataset.dc && (CL.combos || []).find(k => k.id === b.dataset.dc);
      if (cb) {
        if (wmode) c.wardrobe = [...new Set([...(c.wardrobe || []), ...Object.values(cb.parts)])];
        else c.outfit = { ust: '', alt: '', elbise: '', sutyen: '', tanga: '', corap: '', ...cb.parts };
      }
      if (a === 'wmode') { wmode = !wmode; return draw(); }
      if (a === 'rnd') c.outfit = randOutfit((c.wardrobe || []).length ? c : { wardrobe: CL.items.map(x => x.id) });
      if (a === 'rndw') randWear(c);
      if (a === 'naked') c.outfit = { ust: '', alt: '', elbise: '', sutyen: '', tanga: '', corap: '' };
      if (b.dataset.ds) {
        const s = b.dataset.ds, id = b.dataset.di;
        if (wmode) { const w = c.wardrobe || []; c.wardrobe = w.includes(id) ? w.filter(x => x !== id) : [...w, id]; }
        else {
          const o = c.outfit = { ...outfitOf(c), [s]: id };
          if (s === 'elbise' && id) { o.ust = ''; o.alt = ''; }
          if ((s === 'ust' || s === 'alt') && id) o.elbise = '';
        }
      }
      if (!wardrobeOnly) save();
      draw();
      if (done) done();
    };
    draw();
  }
  /* 🔤 özel isme Türkçe ek (ünlü uyumu ve sertleşme): trEk('Paris', 'de') → "Paris'te", trEk('Ankara', 'li') → "Ankara'lı", 'den' → "İzmir'den" */
  function trEk(word, kind) {
    const w = String(word || '').trim(), lw = w.toLocaleLowerCase('tr').split(/\s+/).pop(), v = (lw.match(/[aeıioöuü]/g) || ['e']).pop();
    const back = 'aıou'.includes(v), hard = /[çfhkpsşt]$/.test(lw);
    const ek = kind === 'li' ? 'l' + ({ a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' })[v]
      : (hard ? 't' : 'd') + (back ? 'a' : 'e') + (kind === 'den' ? 'n' : '');
    return `${w}'${ek}`;
  }
  // 📭 eksik cevap raporu: bot modunda hiçbir kural tutmayıp yedek cevaba düşen mesajlar (S().botMiss, en fazla 300; aynı mesaj sayılır)
  function botMiss(text, ch) {
    const k = Stories.Bot.norm(text).trim();
    if (!k) return;
    const L = S().botMiss = S().botMiss || [], x = L.find(m => m.k === k);
    if (x) Object.assign(x, { n: x.n + 1, at: Date.now(), ch: ch.name });
    else L.unshift({ k, t: String(text).slice(0, 200), n: 1, at: Date.now(), ch: ch.name });
    if (L.length > 300) L.length = 300;
  }
  // pozisyon: 🗂️ event etiketli kategorideki olay
  const isPosEv = e => !!e && (catOfEv(e).tags || []).includes(CHAT_TOP_TAG);
  /* 😣 acı / rahatlık (karakter parametresi "Acı"): dar karakterde büyük boyut (söylediğin santim ≥ 18), anal, Virgo ve sert Mode artırır;
   * Gentle, Foreplay ve Eat azaltır; 🕰️ her saat başı −10 */
  const painParam = () => (allParams().find(p => p.who !== 'me' && String(p.label).toLocaleLowerCase('tr') === 'acı') || {}).id;
  function painDelta(e, ch) {
    const low = s => String(s || '').toLocaleLowerCase('tr'), t = low(e.title), cat = low(catOfEv(e).label), tags = (e.tags || []).map(low), n = +S().user.size || 0;
    if (cat === 'cumming' || cat === 'cumming size' || cat === 'lactation') return 0;
    let d = 0;
    if (cat === 'mode') d += /rough|brutal/.test(t) ? 10 : /assertive|ağlatmalı/.test(t) ? 6 : /gentle/.test(t) ? -14 : /passionate/.test(t) ? -4 : 0;
    if (cat === 'foreplay') d -= 6;
    if (cat === 'eat') d -= 4;
    if (tags.includes('vajinal')) {
      const p = low(traitVal(ch, 'Pussy Size'));
      if (/tight/.test(p)) d += 4 + (n >= 18 ? 6 : 0) + (/very|extremely/.test(p) ? 3 : 0);
      if (traitVal(ch, 'Experience') === 'Virgo') d += 6;
    }
    if (tags.includes('anal')) d += 4 + (/tight/.test(low(traitVal(ch, 'Anal Size'))) ? 5 + (n >= 18 ? 4 : 0) : 0) + (/rough/.test(t) ? 5 : 0);
    return d;
  }
  /* 📍 mekana göre: sohbetin son mekan kartından (araba, duş, sinema…) bot cevapları ve pozisyon kısıtları.
   * block: olamayacak pozisyonlar · allow: sadece bunlar olabilir (kalabalık yerler) */
  const PLACE_KEY = { araba: 'araba', garaj: 'araba', banyo: 'dus', mutfak: 'mutfak', yatak: 'yatak', 'onun-evi': 'yatak', 'senin-evin': 'yatak', misafir: 'yatak', 'cati-kati': 'yatak',
    salon: 'koltuk', 'ev-sinema': 'koltuk', somine: 'somine', 'dag-evi': 'somine', balkon: 'balkon', teras: 'balkon', cati: 'balkon', sahil: 'sahil', tatil: 'sahil', yazlik: 'sahil',
    sinema: 'sinema', bar: 'bar', konser: 'bar', dans: 'bar', 'ev-partisi': 'parti', kamp: 'kamp', piknik: 'kamp', park: 'kamp', vapur: 'vapur', kampus: 'ofis', is: 'ofis', calisma: 'ofis',
    kafe: 'kafe', restoran: 'kafe', kitapci: 'kafe', alisveris: 'kabin', giyinme: 'kabin' };
  const PLACE_RULES = {
    araba: { icon: '🚗', block: ['standing', 'full nelson', 'standing doggy', 'standing anal', 'ondesk'], why: 'Arabada ayağa kalkacak yer yok' },
    dus: { icon: '🚿', block: ['missionary', 'spooning', 'spooning anal', 'ondesk', 'lap sex', '69', 'facesitting'], why: 'Duşta uzanacak yer yok' },
    kabin: { icon: '👗', block: ['missionary', 'spooning', 'spooning anal', 'full nelson', 'ondesk', '69', 'facesitting'], why: 'Kabin çok dar' },
    bar: { icon: '🍸', block: ['missionary', 'spooning', 'spooning anal', '69', 'facesitting', 'full nelson'], why: 'Barın tuvaletinde yatacak yer yok' },
    sinema: { icon: '🎬', allow: ['kissing', 'lap kissing', 'front hugging', 'back hugging', 'show tits', 'handjob', 'blowjob', 'masturbation'], why: 'Sinemada herkes var, ancak gizlice' },
    kafe: { icon: '☕', allow: ['kissing', 'front hugging', 'back hugging', 'show tits', 'footjob', 'handjob'], why: 'Kafede ancak masanın altından' },
    vapur: { icon: '⛴️', allow: ['kissing', 'lap kissing', 'front hugging', 'back hugging', 'handjob'], why: 'Vapurda insanlar var' }
  };
  const placeBlock = (key, e) => {
    const r = PLACE_RULES[key];
    if (!r || !isPosEv(e)) return '';
    const t = String(e.title).toLocaleLowerCase('tr');
    return (r.allow ? !r.allow.includes(t) : r.block.includes(t)) ? `${r.icon} ${r.why}` : '';
  };
  // 🔔 kısa efekt sesleri (Web Audio, dosya yok): eşleşme, orgazm, hamilelik, doğum; 📖 sayfa çevirme ayrıca açılır
  const sfxOn = v => { try { if (v != null) localStorage.setItem('amor-stories:sfx', v ? '1' : '0'); return localStorage.getItem('amor-stories:sfx') !== '0'; } catch (e) { return true; } };
  const pageSfxOn = v => { try { if (v != null) localStorage.setItem('amor-stories:booksfx', v ? '1' : '0'); return localStorage.getItem('amor-stories:booksfx') === '1'; } catch (e) { return false; } };
  let sfxCtx = null;
  function sfx(kind) {
    if (kind === 'page' ? !pageSfxOn() : !sfxOn()) return;
    try {
      sfxCtx = sfxCtx || new (window.AudioContext || window.webkitAudioContext)();
      const a = sfxCtx, t = a.currentTime;
      if (a.state !== 'running') a.resume();
      if (kind === 'page') {
        // kağıt hışırtısı: süzülmüş, sönen gürültü
        const n = Math.floor(a.sampleRate * .32), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6) * (.4 + .6 * Math.abs(Math.sin(i / n * 9)));
        const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
        fl.type = 'bandpass'; fl.frequency.value = 2600; fl.Q.value = .7; g.gain.value = .5;
        s.buffer = buf; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start();
        return;
      }
      const tone = (f, s, d, type = 'sine', vol = .16) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t + s);
        g.gain.setValueAtTime(.0001, t + s); g.gain.exponentialRampToValueAtTime(vol, t + s + .02); g.gain.exponentialRampToValueAtTime(.0001, t + s + d);
        o.connect(g); g.connect(a.destination); o.start(t + s); o.stop(t + s + d + .05);
      };
      ({ match: [[660, 0, .18], [880, .12, .22], [1320, .24, .4]], orgasm: [[523, 0, .3], [659, .1, .3], [784, .2, .35], [1047, .32, .6]],
        preg: [[784, 0, .35, 'triangle'], [988, .18, .35, 'triangle'], [1175, .36, .7, 'triangle']], baby: [[1047, 0, .2], [1319, .15, .2], [1568, .3, .2], [2093, .45, .7]],
        lock: [[440, 0, .1, 'square', .05]] }[kind] || []).forEach(x => tone(...x));
    } catch (e) { /* ses yok */ }
  }
  function fertAdjust(outs, chars) {
    const pr = (outs || []).filter(isPreg);
    if (!pr.length || !charFields().some(f => f.id === FERT_ID)) return outs;
    // 🩸 döngüdeki gün doğurganlığı çarpar (riskli gün ×1,8, regl ×0,15)
    const vals = (chars || []).map(c => { const v = (c.fields || {})[FERT_ID]; return Math.min(100, (v === '' || v == null ? 50 : +v) * CYCLE[cyclePhase(c)].mul); });
    const fert = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 50;
    const adj = new Map(pr.map(o => [o, Math.min(100, (+o.pct || 0) * fert / 50)]));
    let after = [...adj.values()].reduce((a, b) => a + b, 0);
    if (after > 100) { const k = 100 / after; adj.forEach((v, o) => adj.set(o, v * k)); after = 100; }
    const before = pr.reduce((n, o) => n + (+o.pct || 0), 0), rest = outs.filter(o => !adj.has(o)), restSum = rest.reduce((n, o) => n + (+o.pct || 0), 0);
    const restTarget = Math.max(0, Math.min(100, before + restSum) - after), r1 = x => Math.round(x * 10) / 10;
    return outs.map(o => adj.has(o) ? { ...o, pct: r1(adj.get(o)), fert: Math.round(fert) } : restSum ? { ...o, pct: r1((+o.pct || 0) * restTarget / restSum) } : o);
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
  // 🏷️ etikete göre ortak sonuç: g.tags olayın kendi etiketiyle, g.ctags kategorisinin etiketiyle eşleşir (büyük/küçük harf fark etmez)
  const lowTag = x => String(x).toLocaleLowerCase('tr');
  const sharedByTag = (g, e) => {
    const et = (e.tags || []).map(lowTag), cat = moCats().find(c => c.id === (e.cat || 'mine')) || {}, ct = (cat.tags || []).map(lowTag);
    return (g.tags || []).some(t => et.includes(lowTag(t))) || (g.ctags || []).some(t => ct.includes(lowTag(t)));
  };
  // sıra: olayı adıyla seçmiş ortak sonuç → olayın kendi sonuçları → etiketiyle eşleşen ortak sonuç
  const sharedOf = e => {
    const ids = [e.id, e.src, e.base].filter(Boolean);
    return sharedOuts().find(g => (g.evs || []).some(x => ids.includes(x))) || ((e.outcomes || []).length ? null : sharedOuts().find(g => sharedByTag(g, e))) || null;
  };
  // ⚡ eşik olayları: { id, p: parametre, op: '>=' | '<=', v: sınır, ev: olay } — değer sınırı geçince olay sıraya girer
  const allTriggers = () => MO().triggers || (Stories.SYSTEM || {}).triggers || [];
  /* 🎚️ Değere göre olay (Sebep-sonuç → 🎚️; MO().bandRules): bir kategorideki olay olunca, parametrenin o anki değerine göre
   * aralığı tutan olay ardından gelir. { id, when: kategori id | 'tag:<olay etiketi>', p: parametre, bands: [{ ev, min, max }] }
   * Değer olay olmadan önceki haliyle okunur (ör. Cumming'den önceki 💦 Cum → miktar) */
  const bandRules = () => (S().monia || {}).bandRules || (Stories.SYSTEM || {}).bandRules || [];
  function bandPicks(e, charIds) {
    if (!e) return [];
    const ps = evParams(), all = allEvents(), out = [];
    bandRules().forEach(r => {
      const w = String(r.when || '');
      if (w.startsWith('tag:') ? !(e.tags || []).some(t => lowTag(t) === lowTag(w.slice(4))) : w !== (e.cat || 'mine')) return;
      const p = ps.find(x => x.id === r.p);
      if (!p || !p.prm) return;
      const ch = isMine(p) ? S().user : byId(charIds[0]);
      if (!ch) return;
      // 🔘 şart: karakterin aç/kapa durumu açıksa (ör. Hamile ise süt)
      if (r.if) { const who = byId(charIds[0]); if (!who || !(who.fields || {})[String(r.if).slice(2)]) return; }
      const v = paramVal(ch, p.prm), b = (r.bands || []).find(x => v >= +x.min && v <= +x.max), ev = b && all.find(x => x.id === b.ev);
      if (ev) out.push(ev);
    });
    return out;
  }
  /* 🕰️ Sohbet saati (Sebep-sonuç → 🕰️ Saat; MO().clock): sohbet başlangıç saatinde başlar, her mesajda step dakika ilerler.
   * rules: [{ id, every: 'msg' | 'hour' | 'at', from: 'SS:DD', to: 'SS:DD', p: parametre, d }] — msg: aralıktaki her mesajda,
   * hour: aralıktaki her saat başında, at: saat "from" olunca (günde bir kez) */
  const CLOCK_DEF = { on: true, start: '20:00', step: 5, rules: [] };
  const clockCfg = () => Object.assign({}, CLOCK_DEF, (S().monia || {}).clock || (Stories.SYSTEM || {}).clock || {});
  const hm = s => { const m = /^(\d{1,2}):(\d{2})/.exec(String(s || '')); return m ? (+m[1] % 24) * 60 + Math.min(59, +m[2]) : 0; };
  const hmText = min => { const d = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(d / 60)).padStart(2, '0')}:${String(d % 60).padStart(2, '0')}`; };
  // aralık gece yarısını geçebilir (22:00 – 02:00); başı ve sonu aynıysa bütün gün
  const inWin = (min, from, to) => { const x = ((min % 1440) + 1440) % 1440, a = hm(from), b = hm(to); return a === b || (a < b ? x >= a && x < b : x >= a || x < b); };
  const clockIcon = min => { const h = Math.floor((((min % 1440) + 1440) % 1440) / 60); return h < 6 || h >= 22 ? '🌙' : h < 11 ? '🌅' : h < 18 ? '☀️' : '🌆'; };
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
  /* ⚡ eşiğin hedefi (tr.ev): olay id → olay olur · 'oc:<olay id>' → olay olmadan 🎲 sonuçları seçilir ·
   * 'grp:<id>' → 🔗 ortak sonuç · 'one:<olay id | grp:id>|<sonuç id>' → 🎯 tek bir sonuç kesin olur.
   * Sonuç hedefleri sohbete olay gibi giden geçici bir olaya çevrilir (sonuçları, şartları, ↪ / ⚡ zinciriyle) */
  function trSource(src) {
    if (src.startsWith('grp:')) { const g = sharedOuts().find(x => x.id === src.slice(4)); return g ? { title: g.title || 'Ortak sonuç', icon: '🔗', outs: g.outs || [] } : null; }
    const e = allEvents().find(x => x.id === src);
    if (!e) return null;
    const sg = sharedOf(e);
    return { title: e.title, icon: '🎲', emojis: e.emojis || '', color: e.color, outs: sg ? sg.outs : e.outcomes || [] };
  }
  // 🎯 'match:<kategori id>': o kategoriden, şu anki pozisyonla (trPos) ortak olay etiketi taşıyan bir olay (ör. anal → Anal Creampie)
  let trPos = null;
  function trTarget(id) {
    id = String(id || '');
    if (id.startsWith('match:')) {
      const tags = ((trPos || {}).tags || []).map(lowTag);
      const hits = tags.length ? allEvents().filter(e => (e.cat || 'mine') === id.slice(6) && (e.tags || []).some(t => tags.includes(lowTag(t)))) : [];
      return hits.length ? pickOne(hits) : null;
    }
    const fake = (s, title, outs) => ({ id: 'tr:' + id, title, text: `⚡ ${title}`, cat: 'mine', emojis: s.emojis || '', ...(s.color ? { color: s.color } : {}), outcomes: outs });
    if (id.startsWith('oc:') || id.startsWith('grp:')) { const s = trSource(id.startsWith('oc:') ? id.slice(3) : id); return s && s.outs.length ? fake(s, `${s.icon} ${s.title}`, s.outs) : null; }
    if (id.startsWith('one:')) {
      const k = id.lastIndexOf('|'), s = trSource(id.slice(4, k)), o = s && s.outs.find(x => x.id === id.slice(k + 1));
      return o ? fake(s, `🎯 ${s.title}`, [{ ...o, pct: 100 }]) : null;
    }
    return allEvents().find(e => e.id === id) || null;
  }
  /* 🎯 Pozisyon → bitiş kurulumu (bir kez, S().posSetup): pozisyonlara ve Cumming olaylarına "bitiş yeri" etiketi,
   * "event" kategorileri için 🥴 Zevk artıran ortak sonuç, Zevk eşiği → şu anki pozisyona uyan Cumming olayı + Zevk sıfırlanır.
   * Var olanı silmez; bulamadığını atlar */
  const POS_TAGS = {
    vajinal: ['Missionary', 'Cowgirl', 'Ondesk', 'Full Nelson', 'Doggy', 'Spooning', 'Standing', 'Lap Sex', 'Vaginal Creampie'],
    anal: ['Cowgirl Anal', 'Standing Anal', 'Rough Anal', 'Spooning Anal', 'Standing doggy', 'Anal Creampie'],
    oral: ['Blowjob', 'Deepthroat', 'Oral Sex', '69', 'Oral Creampie', 'Mouth Cumming', 'Face Cumming'],
    'göğüs': ['Titfuck', 'Reverse Titfuck', 'Tit Cumshot'],
    bacak: ['Footjob', 'Legjob', 'Leg Cumshot', 'Legs Creampie'],
    'kalça': ['Buttjob', 'Hotdogging', 'Ass Cumshot'],
    el: ['Handjob', 'Masturbation', 'Face Cumming']
  };
  // her "olay|etiket" çifti bir kez verilir (S().posTagged): sonradan eklenen olay da etiketlenir, sonradan sildiğin etiket geri gelmez
  function tagPositions() {
    const mo = S().monia, low = s => String(s || '').toLocaleLowerCase('tr').trim();
    if (!mo || !(mo.events || []).length) return 0;
    const done = new Set(S().posTagged || []);
    let n = 0;
    Object.entries(POS_TAGS).forEach(([tag, titles]) => titles.forEach(t => {
      const key = low(t) + '|' + tag, evs = mo.events.filter(e => low(e.title) === low(t));
      if (done.has(key) || !evs.length) return;
      evs.forEach(e => { if (!(e.tags || []).some(x => low(x) === tag)) { e.tags = [...(e.tags || []), tag]; n++; } });
      done.add(key);
    }));
    S().posTagged = [...done];
    return n;
  }
  function setupPositions() {
    const mo = S().monia;
    if (!mo) return;
    const low = s => String(s || '').toLocaleLowerCase('tr').trim();
    // ilk kurulumda verilmiş çiftler (sonradan eklenenler hariç) yapılmış sayılır
    if (S().posSetup && !S().posTagged) S().posTagged = Object.entries(POS_TAGS).flatMap(([tag, ts]) => ts.filter(t => !['Mouth Cumming', 'Face Cumming', 'Handjob', 'Masturbation'].includes(t)).map(t => low(t) + '|' + tag));
    if (S().posSetup) { const n = tagPositions(); if (n) { save(); setTimeout(() => notify(`🎯 ${n} olaya bitiş etiketi verildi`, '🎯'), 800); } return; }
    const zevk = allParams().find(p => low(p.label) === 'zevk'), cum = moCats().find(c => low(c.label) === 'cumming');
    if (!zevk || !cum || !(mo.events || []).length) return;
    const tagged = tagPositions();
    const pid = 'p:' + zevk.id;
    // 🔗 pozisyonlar Zevk'i artırır (kendi sonucu olmayan "event" kategorisi olayları)
    if (!sharedOuts().some(g => (g.ctags || []).includes(CHAT_TOP_TAG) && (g.outs || []).some(o => (o.effects || []).some(f => f.p === pid)))) {
      mo.sharedOuts = [...sharedOuts(), { id: Store.uid(), title: 'Pozisyon zevki', evs: [], ctags: [CHAT_TOP_TAG], outs: [
        { id: Store.uid(), text: '', pct: 60, effects: [{ p: pid, d: 4 }] },
        { id: Store.uid(), text: '', pct: 30, effects: [{ p: pid, d: 7 }] },
        { id: Store.uid(), text: '', pct: 10, effects: [{ p: pid, d: 10 }] }] }];
    }
    // ⚡ Zevk ≥ 80 → şu anki pozisyona uyan Cumming olayı, Zevk −100
    const trs = JSON.parse(JSON.stringify(allTriggers())), tr = trs.find(x => x.p === pid && (x.op || '>=') === '>=');
    const fx = [{ p: pid, d: -100 }];
    if (tr) { tr.ev = 'match:' + cum.id; tr.effects = [...(tr.effects || []).filter(f => f.p !== pid && !(f.p === 'p:' + ((allParams().find(p => low(p.label) === 'cum') || {}).id) && +f.d <= -100)), ...fx]; }
    else trs.push({ id: Store.uid(), p: pid, op: '>=', v: 80, ev: 'match:' + cum.id, effects: fx });
    mo.triggers = trs;
    S().posSetup = 1;
    save();
    setTimeout(() => notify(`🎯 Pozisyon → bitiş kuruldu · ${tagged} olaya etiket, Zevk eşiği güncellendi`, '🎯'), 800);
  }
  /* 💦 Cumming → miktar + meni yoğunluğu kurulumu (bir kez, S().cumSetup):
   * gerçekten boşalan Cumming olaylarına "boşalma" etiketi ve ⚡ olunca 🔁 Cumming sayısı +1 (kendi sonucu olana 💦 Cum −30),
   * Cumming ortak sonucundaki rastgele miktar olayı kaldırılır; 🎚️ miktar 💦 Cum'a, yoğunluk 🔁 Cumming sayısına göre gelir;
   * 🕰️ her saat başı 💦 Cum +10 ve 🔁 Cumming sayısı −1 (toparlanma). Var olanı silmez, bulamadığını atlar */
  const CUM_HOLD = ['Holding', 'Cock Ring', 'Hard Holding'];
  const CUM_VOLUME = [['Watery Cumming', 0, 14], ['Low-volume Cumming', 15, 39], ['Normal Cumming', 40, 69], ['Thick White Cumming', 70, 89], ['High Sperm Cumming', 90, 100]];
  const CUM_SPERM = [['Hyper-concentrated (4/4)', 0, 0], ['Polyzoospermia (3/4)', 1, 1], ['Normozoospermia (2/4)', 2, 2], ['Oligospermia (1/4)', 3, 4], ['Azoospermia (0/4)', 5, 20]];
  function setupCumming() {
    const mo = S().monia;
    if (!mo || S().cumSetup || !(mo.events || []).length) return;
    const low = s => String(s || '').toLocaleLowerCase('tr').trim();
    const cumCat = moCats().find(c => low(c.label) === 'cumming'), cumP = allParams().find(p => low(p.label) === 'cum');
    if (!cumCat || !cumP) return;
    const byTitle = t => mo.events.find(e => low(e.title) === low(t));
    let cnt = allParams().find(p => low(p.label) === 'cumming sayısı');
    if (!cnt) { cnt = { id: 'u' + Store.uid(), icon: '🔁', label: 'Cumming sayısı', min: 0, max: 20, start: 0, who: 'me' }; mo.params = [...allParams(), cnt]; }
    const cid = 'p:' + cnt.id, cumId = 'p:' + cumP.id, TAG = 'boşalma';
    // gerçekten boşalan olaylar: etiket + sayaç (kendi sonucu varsa ortak sonuç uygulanmaz, 💦 Cum burada düşer)
    mo.events.filter(e => e.cat === cumCat.id && !CUM_HOLD.some(t => low(t) === low(e.title))).forEach(e => {
      if (!(e.tags || []).some(t => low(t) === TAG)) e.tags = [...(e.tags || []), TAG];
      const on = (e.onEffects || []).filter(f => f.p !== cid);
      on.push({ p: cid, d: 1 });
      if ((e.outcomes || []).length && !on.some(f => f.p === cumId)) on.push({ p: cumId, d: -30 });
      e.onEffects = on;
    });
    // Cumming ortak sonucu: miktar olayı artık 🎚️ ile seçilir
    const sizeIds = new Set([...CUM_VOLUME, ...CUM_SPERM].map(([t]) => (byTitle(t) || {}).id).filter(Boolean));
    mo.sharedOuts = sharedOuts().map(g => (g.ctags || []).includes('result') ? { ...g, outs: (g.outs || []).map(o => sizeIds.has(o.next) ? { ...o, next: '' } : o) } : g);
    const bands = list => list.map(([t, min, max]) => ({ ev: (byTitle(t) || {}).id, min, max })).filter(b => b.ev);
    const vol = bands(CUM_VOLUME), sperm = bands(CUM_SPERM);
    mo.bandRules = [...bandRules(),
      ...(vol.length ? [{ id: Store.uid(), when: 'tag:' + TAG, p: cumId, bands: vol }] : []),
      ...(sperm.length ? [{ id: Store.uid(), when: 'tag:' + TAG, p: cid, bands: sperm }] : [])];
    const ck = clockCfg();
    mo.clock = { ...ck, rules: [...(ck.rules || []),
      { id: Store.uid(), every: 'hour', from: '00:00', to: '00:00', p: cumId, d: 10 },
      { id: Store.uid(), every: 'hour', from: '00:00', to: '00:00', p: cid, d: -1 }] };
    S().cumSetup = 1;
    save();
    setTimeout(() => notify('💦 Cumming → miktar ve meni yoğunluğu kuruldu (Sebep-Sonuç → 🎚️)', '💦'), 1600);
  }
  /* 💗 Eat → karakterin orgazmı (bir kez, S().eatSetup): 👤 💗 Uyarılma ve 🍼 Süt parametreleri; Eat olayları ⚡ olunca Uyarılma ve 🔥 Şehvet artırır;
   * ⚡ Uyarılma ≥ 80 → "Orgazm" olayı (Lactation, 🏷️ orgazm), Uyarılma sıfırlanır; 🎚️ Woter şiddeti 🔥 Şehvet'e, Milk 🍼 Süt'e göre (🔘 Hamile ise);
   * 🕰️ her saat başı 🍼 Süt +5, 🔥 Şehvet −5. Var olanı silmez, bulamadığını atlar */
  const EAT_FX = { 'Cunnilingus': 25, 'Facesitting': 20, 'On Mouth': 15, 'Squirt': 40 };
  const EAT_WOTER = [['Drops Woter', 0, 19], ['Low-volume Woter', 20, 44], ['Normal Woter', 45, 69], ['High-volume Woter', 70, 89], ['Squirt Woter', 90, 100]];
  const EAT_MILK = [['Drops Milk', 10, 29], ['Low-volume Milk', 30, 49], ['Normal Milk', 50, 69], ['High-volume Milk', 70, 89], ['Squirt Milk', 90, 100]];
  function setupEat() {
    const mo = S().monia;
    if (!mo || S().eatSetup || !(mo.events || []).length) return;
    const low = s => String(s || '').toLocaleLowerCase('tr').trim();
    const eat = moCats().find(c => low(c.label) === 'eat'), lac = moCats().find(c => low(c.label) === 'lactation');
    const sehvet = allParams().find(p => low(p.label) === 'şehvet' && p.who !== 'me');
    if (!eat || !lac || !sehvet) return;
    const byTitle = t => mo.events.find(e => low(e.title) === low(t));
    const param = (label, icon, start) => {
      let p = allParams().find(x => low(x.label) === low(label) && x.who !== 'me');
      if (!p) { p = { id: 'u' + Store.uid(), icon, label, min: 0, max: 100, start }; mo.params = [...allParams(), p]; }
      return 'p:' + p.id;
    };
    const ua = param('Uyarılma', '💗', 0), sut = param('Süt', '🍼', 30), sh = 'p:' + sehvet.id;
    // Eat olayları: Uyarılma + Şehvet
    mo.events.filter(e => e.cat === eat.id).forEach(e => {
      const k = Object.keys(EAT_FX).find(t => low(t) === low(e.title)), on = (e.onEffects || []).filter(f => f.p !== ua && f.p !== sh);
      e.onEffects = [...on, { p: ua, d: k ? EAT_FX[k] : 20 }, { p: sh, d: 10 }];
    });
    // Orgazm olayı (kategorisi "event" etiketli olmayan Lactation: pozisyon sayılmaz)
    let org = byTitle('Orgazm');
    if (!org) { org = { id: Store.uid(), title: 'Orgazm', text: '', cat: lac.id, emojis: '💗', tags: ['orgazm'], desc: 'Karşı tarafın orgazmı (💗 Uyarılma eşiğinden gelir)' }; mo.events.push(org); }
    else if (!(org.tags || []).some(t => low(t) === 'orgazm')) org.tags = [...(org.tags || []), 'orgazm'];
    org.onEffects = [...(org.onEffects || []).filter(f => f.p !== sut), { p: sut, d: -30 }];
    const trs = JSON.parse(JSON.stringify(allTriggers()));
    if (!trs.some(t => t.p === ua)) trs.push({ id: Store.uid(), p: ua, op: '>=', v: 80, ev: org.id, effects: [{ p: ua, d: -100 }] });
    mo.triggers = trs;
    const bands = list => list.map(([t, min, max]) => ({ ev: (byTitle(t) || {}).id, min, max })).filter(b => b.ev);
    const woter = bands(EAT_WOTER), milk = bands(EAT_MILK);
    mo.bandRules = [...bandRules(),
      ...(woter.length ? [{ id: Store.uid(), when: 'tag:orgazm', p: sh, bands: woter }] : []),
      ...(milk.length ? [{ id: Store.uid(), when: 'tag:orgazm', p: sut, if: charFields().some(f => f.id === 'hamile') ? 'f:hamile' : '', bands: milk }].map(r => { if (!r.if) delete r.if; return r; }) : [])];
    const ck = clockCfg();
    mo.clock = { ...ck, rules: [...(ck.rules || []),
      { id: Store.uid(), every: 'hour', from: '00:00', to: '00:00', p: sut, d: 5 },
      { id: Store.uid(), every: 'hour', from: '00:00', to: '00:00', p: sh, d: -5 }] };
    S().eatSetup = 1;
    save();
    setTimeout(() => notify('💗 Eat → orgazm, Woter ve Milk kuruldu (Sebep-Sonuç)', '💗'), 2400);
  }
  /* 💞 İlişki kurulumu (bir kez, S().bondSetup): pozisyonlar (event kategorileri) ⚡ olunca 🫂 Samimiyet +1 ve 🤝 Güven +1,
   * Foreplay ayrıca ❤️ Aşk +2 ve Samimiyet +3, onun Orgazm'ı Aşk +5 ve Güven +2; 🕰️ her saat başı 😤 Kıskançlık −2 (söner).
   * 💔 sevmediği olay her seferinde Güven −3, Aşk −1 (eventMessages). Var olanı silmez */
  function setupBond() {
    const mo = S().monia;
    if (!mo || S().bondSetup || !(mo.events || []).length) return;
    const low = s => String(s || '').toLocaleLowerCase('tr').trim(), P = l => { const p = allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? 'p:' + p.id : ''; };
    const ask = P('aşk'), guv = P('güven'), sam = P('samimiyet'), kis = P('kıskançlık');
    if (!ask || !guv || !sam) return;
    const add = (e, fx) => { const on = (e.onEffects || []).filter(f => !fx.some(x => x.p === f.p)); e.onEffects = [...on, ...fx]; };
    mo.events.forEach(e => {
      const cat = moCats().find(c => c.id === e.cat);
      if (!cat || !(cat.tags || []).includes(CHAT_TOP_TAG)) return;
      add(e, low(cat.label) === 'foreplay' ? [{ p: sam, d: 3 }, { p: guv, d: 1 }, { p: ask, d: 2 }] : [{ p: sam, d: 1 }, { p: guv, d: 1 }]);
    });
    const org = mo.events.find(e => low(e.title) === 'orgazm');
    if (org) add(org, [{ p: ask, d: 5 }, { p: guv, d: 2 }]);
    if (kis) { const ck = clockCfg(); if (!(ck.rules || []).some(r => r.p === kis)) mo.clock = { ...ck, rules: [...(ck.rules || []), { id: Store.uid(), every: 'hour', from: '00:00', to: '00:00', p: kis, d: -2 }] }; }
    S().bondSetup = 1;
    save();
  }
  /* bir kez (S().evFix1): Missionary → Forward, Kissing → Foreplay (eski "Ekstra"dan; ilişki etkileri de eklenir);
   * Kondomlu Anal, Kondomlu Önden, Kondomsuz Önden silinir ve karakterlerin listelerinden çıkar */
  function fixEvents1() {
    const mo = S().monia;
    if (!mo || S().evFix1 || !(mo.events || []).length) return;
    const low = s => String(s || '').toLocaleLowerCase('tr').trim(), cat = l => (moCats().find(c => low(c.label) === l) || {}).id;
    const P = l => { const p = allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? 'p:' + p.id : ''; };
    const fwd = cat('forward'), fore = cat('foreplay');
    if (!fwd || !fore) return;
    const fx = (e, list) => { list = list.filter(f => f.p); e.onEffects = [...(e.onEffects || []).filter(f => !list.some(x => x.p === f.p)), ...list]; };
    mo.events.forEach(e => {
      if (low(e.title) === 'missionary' && e.cat !== fwd) { e.cat = fwd; fx(e, [{ p: P('samimiyet'), d: 1 }, { p: P('güven'), d: 1 }]); }
      if (low(e.title) === 'kissing' && e.cat !== fore) { e.cat = fore; fx(e, [{ p: P('samimiyet'), d: 3 }, { p: P('güven'), d: 1 }, { p: P('aşk'), d: 2 }]); }
    });
    const DEL = ['kondomlu anal', 'kondomlu önden', 'kondomsuz önden'], gone = mo.events.filter(e => DEL.includes(low(e.title))).map(e => e.id);
    mo.events = mo.events.filter(e => !gone.includes(e.id));
    chars().forEach(c => ['likes', 'dislikes', 'allows', 'denies'].forEach(k => { if (c[k]) c[k] = c[k].filter(x => !gone.includes(x)); }));
    S().evFix1 = 1;
    save();
  }
  /* 💐 iltifat / 💢 kabalık → 🎲 bot sonucu (Sebep-sonuç → 🤖, bir kez: S().botOutSetup1): r_cmp_* ❤️ Aşk +2 🫂 Samimiyet +1 ·
   * r_love* Aşk +3 · r_rude* 🤝 Güven −3, Aşk −1. Sonradan eklenen aynı önekli kurallar da açılışta alır; var olan sonuca dokunmaz */
  function setupBotOuts() {
    const mo = S().monia;
    if (!mo) return;
    const low = s => String(s || '').toLocaleLowerCase('tr'), P = l => { const p = allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? 'p:' + p.id : ''; };
    const ask = P('aşk'), sam = P('samimiyet'), guv = P('güven');
    if (!ask || !guv) return;
    // önek: genel kural (r_cmp) ve kişilik varyantları (r_cmp_flörtöz …)
    const FX = { r_cmp: [{ p: ask, d: 2 }, { p: sam, d: 1 }], r_love: [{ p: ask, d: 3 }], r_rude: [{ p: guv, d: -3 }, { p: ask, d: -1 }], r_hurt: [{ p: ask, d: -3 }, { p: guv, d: -1 }] };
    // eski "seni seviyorum" ve "özledim" kuralları; "Beni seviyor musun?" karşı sorusuna evet / hayır
    const AS = { r_seni_seviyorum: 'r_love', r_seviyorum_seni: 'r_love', r_seni_seviyorum_soguk: 'r_love', r_ozledim: 'r_cmp',
      r_ans_k_sevgi_evet: 'r_love', r_ans_k_sevgi_hayir: 'r_hurt',
      // 🍒 göğüs övgüleri de iltifat
      r_q3_meme_sev: 'r_cmp', r_q3_meme_sev_big: 'r_cmp', r_q3_meme_sev_mid: 'r_cmp', r_q3_meme_sev_small: 'r_cmp' };
    const outs = { ...(mo.botOuts || (Stories.SYSTEM || {}).botOuts || {}) };
    let n = 0;
    ((Stories.BOT_RULES || {}).rules || []).forEach(r => {
      const pre = AS[r.id] || Object.keys(FX).find(k => String(r.id).startsWith(k));
      if (!pre || (outs[r.id] || []).length) return;
      outs[r.id] = [{ id: Store.uid(), text: '', pct: 100, effects: FX[pre].filter(f => f.p) }];
      n++;
    });
    if (n) { mo.botOuts = outs; save(); }
  }
  /* 🥴 Zevk dengesi (bir kez, S().zevkFix1): pozisyonların ortak Zevk artışı azalır (+20 → +8; +10/20/30 → +4/7/10);
   * 💋 Foreplay Zevk'i çok az artırır (ortak sonuç "Foreplay ısınma": +1 / +2 / +3, kendi sonucu olanda en fazla +2),
   * karşılığında ❤️ Aşk +5 ve 🫂 Samimiyet +4 verir: öpüşerek boşalınmaz */
  function fixZevk1() {
    const mo = S().monia;
    if (!mo || S().zevkFix1 || !(mo.events || []).length) return;
    const low = s => String(s || '').toLocaleLowerCase('tr').trim();
    const zp = allParams().find(p => p.who === 'me' && low(p.label) === 'zevk');
    if (!zp) return;
    const pid = 'p:' + zp.id, P = l => { const p = allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? 'p:' + p.id : ''; };
    const zfx = (o, fn) => ({ ...o, effects: (o.effects || []).map(f => f.p === pid && +f.d > 0 ? { ...f, d: fn(+f.d) } : f) });
    mo.sharedOuts = sharedOuts().map(g => {
      if (!(g.ctags || []).includes(CHAT_TOP_TAG)) return g;
      const ds = (g.outs || []).flatMap(o => (o.effects || []).filter(f => f.p === pid && +f.d > 0).map(f => +f.d)).sort((a, b) => a - b);
      const map = ds.join() === '10,20,30' ? { 10: 4, 20: 7, 30: 10 } : null;
      return { ...g, outs: (g.outs || []).map(o => zfx(o, d => (map ? map[d] : d > 12 ? Math.round(d * .4) : d))) };
    });
    const fore = moCats().find(c => low(c.label) === 'foreplay');
    if (fore) {
      const evs = mo.events.filter(e => e.cat === fore.id), ask = P('aşk'), sam = P('samimiyet');
      const fx = [{ p: ask, d: 5 }, { p: sam, d: 4 }].filter(f => f.p);
      evs.forEach(e => {
        e.onEffects = [...(e.onEffects || []).filter(f => !fx.some(x => x.p === f.p)), ...fx];
        if ((e.outcomes || []).length) e.outcomes = e.outcomes.map(o => zfx(o, d => Math.min(d, 2)));
      });
      const free = evs.filter(e => !(e.outcomes || []).length).map(e => e.id);
      if (free.length && !mo.sharedOuts.some(g => g.title === 'Foreplay ısınma')) mo.sharedOuts = [{ id: Store.uid(), title: 'Foreplay ısınma', evs: free, ctags: [], outs: [
        { id: Store.uid(), text: '', pct: 60, effects: [{ p: pid, d: 1 }] },
        { id: Store.uid(), text: '', pct: 30, effects: [{ p: pid, d: 2 }] },
        { id: Store.uid(), text: '', pct: 10, effects: [{ p: pid, d: 3 }] }] }, ...mo.sharedOuts];
    }
    S().zevkFix1 = 1;
    save();
  }
  /* 🎭 rol yapma fantezileri (🏷️ roleplay) Fantesy kategorisine; her sürüm (S().roleV) sadece kendi yenilerini ekler,
   * aynı adlı olay varsa eklenmez. Sürüm 2: Kadın Hoca – Öğrenci (o hoca, sen öğrenci) */
  const ROLEPLAY2 = [['Kadın Hoca – Öğrenci (Üniversite)', '👩‍🏫', '#7e57c2', 'Kampüste, ofis saatinde: o hoca, sen öğrenci']];
  const ROLEPLAY = [['Patron – Sekreter', '💼', '#5c6bc0', 'Ofiste, mesai sonrası: o sekreter, sen patron'], ['Hoca – Öğrenci (Üniversite)', '🎓', '#8d6e63', 'Kampüste, ofis saatinde: o öğrenci, sen hoca'],
    ['Doktor – Hasta', '🩺', '#26a69a', 'Muayenehanede: o hasta, sen doktor'], ['Polis – Şüpheli', '🚓', '#1e88e5', 'Sorgu odasında: o şüpheli, sen polis'],
    ['Yeni Komşu', '🏠', '#ef6c00', 'Kapıya şeker istemeye gelen yeni komşu'], ['Hizmetçi – Ev Sahibi', '🧹', '#6d4c41', 'O hizmetçi, sen ev sahibi'], ['Masöz – Müşteri', '💆', '#ab47bc', 'Masaj salonunda: o masöz, sen müşteri']];
  function fixRole1() {
    const mo = S().monia, low = s => String(s || '').toLocaleLowerCase('tr').trim();
    const v = S().roleV || (S().roleSetup1 ? 1 : 0);
    if (!mo || v >= 2 || !(mo.events || []).length) return;
    const cat = moCats().find(c => low(c.label) === FANT_TAG);
    if (!cat) return;
    [...(v < 1 ? ROLEPLAY : []), ...ROLEPLAY2].forEach(([title, emojis, color, desc]) => {
      if (mo.events.some(e => low(e.title) === low(title))) return;
      mo.events.push({ id: Store.uid(), title, cat: cat.id, text: '', steps: [], opener: '', starter: '', tones: [], note: '', part: '', when: '', place: '', mix: [], tags: ['roleplay'], desc, color, emojis });
    });
    S().roleV = 2;
    save();
  }
  /* ✋ bir kez (S().holdSetup1): Holding / Hard Holding / Cock Ring kendi sonuçlarını alır ("Cumming" ortak sonucu artık uygulanmaz, Cum düşmez):
   * çoğu zaman tutarsın → 🥴 Zevk düşer, 💦 Cum artar, bazen 🔁 Cumming sayısı −1 (döl yoğunlaşır); az ihtimalle tutamazsın → Zevk +100 (eşik → pozisyona uyan boşalma) */
  const HOLD_OUTS = {
    'holding': [[55, '{ben} seni durdurdu, biraz daha biriktiriyorsun 😈', -20, 10, 0], [25, 'Son anda tuttun, dölün birikiyor 💦', -30, 15, -1], [20, 'Tutamadın… 😩', 100, 0, 0]],
    'hard holding': [[50, '{ben} seni sıkıca tuttu; geri çekildin, birikiyor 😈', -35, 20, -1], [35, 'Zor tuttun ama tuttun, döl yoğunlaşıyor 🥵', -30, 25, -1], [15, 'Bu kadar sıkıya dayanamadın… 😩', 100, 0, 0]],
    'cock ring': [[60, 'Halka seni tutuyor, boşalamıyorsun 😈', -25, 15, 0], [30, 'Halka sıkıyor, her şey içinde birikiyor 💦', -20, 20, -1], [10, 'Halkaya rağmen taştın… 😩', 100, 0, 0]]
  };
  function fixHold1() {
    const mo = S().monia;
    if (!mo || S().holdSetup1 || !(mo.events || []).length) return;
    const low = s => String(s || '').toLocaleLowerCase('tr'), P = l => (allParams().find(p => p.who === 'me' && low(p.label) === l) || {}).id;
    const zp = P('zevk'), cp = P('cum'), np = P('cumming sayısı');
    if (!zp || !cp) return;
    mo.events.forEach(e => {
      const outs = HOLD_OUTS[low(e.title)];
      if (!outs) return;
      e.outcomes = outs.map(([pct, text, z, cum, n]) => ({ id: Store.uid(), text, pct, next: '', effects: [{ p: 'p:' + zp, d: z }, ...(cum ? [{ p: 'p:' + cp, d: cum }] : []), ...(n && np ? [{ p: 'p:' + np, d: n }] : [])] }));
      // Cum düşüren "olunca" etkileri kalkar
      e.onEffects = (e.onEffects || []).filter(f => f.p !== 'p:' + cp);
    });
    S().holdSetup1 = 1;
    save();
  }
  // 🌭 bir kez (S().hotdogSetup1): yeni pozisyon "Hotdogging" (kalçanın iki yanağı arasında sürtme) Outercourse'a; 🏷️ kalça → bitişte Ass Cumshot
  function fixHotdog1() {
    const mo = S().monia, low = s => String(s || '').toLocaleLowerCase('tr');
    if (!mo || S().hotdogSetup1 || !(mo.events || []).length) return;
    const cat = moCats().find(c => low(c.label) === 'outercourse');
    if (!cat) return;
    if (!mo.events.some(e => low(e.title) === 'hotdogging'))
      mo.events.push({ id: Store.uid(), title: 'Hotdogging', cat: cat.id, text: '', steps: [], opener: '', starter: '', tones: [], note: '', part: '', when: '', place: '', mix: [], tags: ['kalça'],
        desc: 'Kalçanın iki yanağı arasında sürtme (🌭 sosisli gibi): içeri girmeden, kalçaların arasında', color: '#ff8a65', emojis: '🍑🌭' });
    S().hotdogSetup1 = 1;
    save();
  }
  // 🍼 bir kez (S().breastSetup1): Eat'e "Breastfeeding" (göğüslerini emersin): Uyarılma +30 → orgazma götürür; 🍼 Süt −10
  function fixBreast1() {
    const mo = S().monia, low = s => String(s || '').toLocaleLowerCase('tr');
    if (!mo || S().breastSetup1 || !(mo.events || []).length) return;
    const cat = moCats().find(c => low(c.label) === 'eat');
    if (!cat) return;
    if (!mo.events.some(e => low(e.title) === 'breastfeeding')) {
      const P = l => (allParams().find(p => p.who !== 'me' && low(p.label) === l) || {}).id;
      const fx = [['uyarılma', 30], ['şehvet', 10], ['aşk', 3], ['samimiyet', 2], ['güven', 1], ['süt', -10]].map(([l, d]) => P(l) && { p: 'p:' + P(l), d }).filter(Boolean);
      mo.events.push({ id: Store.uid(), title: 'Breastfeeding', cat: cat.id, text: '', steps: [], opener: '', starter: '', tones: [], note: '', part: '', when: '', place: '', mix: [], tags: [],
        onEffects: fx, desc: 'Göğüslerini emersin (hamileyse sütünü içersin): Uyarılma +30, onu orgazma götürür', color: '#f8a5c2', emojis: '🍼' });
    }
    S().breastSetup1 = 1;
    save();
  }
  // 👗 bir kez (S().wearSetup1): gardırobu olmayan kayıtlı karakterlere kişiliğine göre rastgele "genelde giydikleri" ve bir kombin
  function fixWear1() {
    if (S().wearSetup1 || !CL.items.length) return;
    chars().forEach(c => { if (!(c.wardrobe || []).length) randWear(c); });
    S().wearSetup1 = 1;
    save();
  }
  // 😣 bir kez (S().painSetup1): karakter parametresi "Acı" ve 🕰️ her saat başı −10
  function fixPain1() {
    const mo = S().monia;
    if (!mo || S().painSetup1) return;
    let p = allParams().find(x => x.who !== 'me' && String(x.label).toLocaleLowerCase('tr') === 'acı');
    if (!p) { p = { id: 'u' + Store.uid(), icon: '😣', label: 'Acı', min: 0, max: 100, start: 0 }; mo.params = [...allParams(), p]; }
    const ck = clockCfg(), pid = 'p:' + p.id;
    if (!(ck.rules || []).some(r => r.p === pid)) mo.clock = { ...ck, rules: [...(ck.rules || []), { id: Store.uid(), every: 'hour', from: '00:00', to: '00:00', p: pid, d: -10 }] };
    S().painSetup1 = 1;
    save();
  }
  // 🦄 bir kez (S().fantTag1): "Fantesy" kategorisine 'fantesy' etiketi (❤️/💔 listelerine girer, rastgelede en fazla 2)
  function fixFant1() {
    const mo = S().monia;
    if (!mo || S().fantTag1 || !Array.isArray(mo.cats)) return;
    mo.cats = mo.cats.map(c => String(c.label || '').toLocaleLowerCase('tr').trim() === FANT_TAG && !(c.tags || []).includes(FANT_TAG) ? { ...c, tags: [...(c.tags || []), FANT_TAG] } : c);
    S().fantTag1 = 1;
    save();
  }
  // yeni cihazda kurulumlar sistem dosyasından gelen kuralların üstüne bir daha eklenebilir: aynı 🎚️ ve 🕰️ kurallar bir kez kalır
  function dedupeAuto() {
    const mo = S().monia;
    if (!mo) return;
    let changed = false;
    const uniq = (arr, key) => {
      const seen = new Set(), out = arr.filter(x => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; });
      if (out.length !== arr.length) changed = true;
      return out;
    };
    if (Array.isArray(mo.bandRules)) mo.bandRules = uniq(mo.bandRules, r => [r.when, r.p, r.if || ''].join('|'));
    if (mo.clock && Array.isArray(mo.clock.rules)) mo.clock = { ...mo.clock, rules: uniq(mo.clock.rules, r => [r.every, r.from, r.to || '', r.p, r.d].join('|')) };
    if (changed) save();
  }
  // ⚡ eşik tetiklenince: kendi 💬 mesajı / 📈 etkileri (varsa, geçici olay olarak) + hedefi. 🔒 şartları (📊 / 🔘) sınırı geçen karaktere bakar
  const trCondsOk = (tr, ch) => (tr.conds || []).every(cd => condOk(cd, { done: new Set(), chars: ch === S().user ? [] : [ch] }));
  function trFire(tr, label) {
    const out = [], t = tr.ev ? trTarget(tr.ev) : null;
    if (tr.text || (tr.effects || []).length) out.push({ id: 'trg:' + (tr.id || ''), title: `⚡ ${label}`, text: `⚡ ${label}`, cat: 'mine', outcomes: [{ id: 'trg', text: tr.text || '', effects: tr.effects || [], pct: 100 }] });
    if (t) out.push(t);
    return out;
  }
  // ⚡ eşik hedefi seçenekleri (Sebep-sonuç paneli): olaylar, olayların sonuçları, ortak sonuçlar, tek sonuçlar
  function trOptions(cur) {
    const opt = (v, l) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`, evs = allEvents();
    const srcs = [...evs.filter(e => !sharedOf(e) && (e.outcomes || []).length).map(e => ({ k: e.id, s: trSource(e.id) })), ...sharedOuts().map(g => ({ k: 'grp:' + g.id, s: trSource('grp:' + g.id) }))].filter(x => x.s && x.s.outs.length);
    const short = t => { t = String(t || '').trim(); return t.length > 40 ? t.slice(0, 39) + '…' : t; };
    return `<optgroup label="🎯 Şu anki pozisyona uyan olay (aynı etiket)">${moCats().map(c => opt('match:' + c.id, `🎯 ${c.icon} ${c.label} · pozisyonla aynı etiketli`)).join('')}</optgroup>`
      + `<optgroup label="📜 Olay olur">${evs.map(e => opt(e.id, (e.emojis ? e.emojis + ' ' : '') + e.title)).join('')}</optgroup>`
      + (srcs.length ? `<optgroup label="🎲 Sebep → Sonuç (olay olmadan sonucu)">${srcs.map(x => opt(x.k.startsWith('grp:') ? x.k : 'oc:' + x.k, `${x.s.icon} ${x.s.title}`)).join('')}</optgroup>
        <optgroup label="🎯 Tek sonuç (kesin olur)">${srcs.flatMap(x => x.s.outs.filter(o => o.id).map(o => opt(`one:${x.k}|${o.id}`, `🎯 ${x.s.title} → ${short(o.text || (o.next ? '↪ sonraki olay' : 'etki'))} %${+o.pct || 0}`))).join('')}</optgroup>` : '');
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
        const [a, b] = paramStep(ch, p, dlt), stuck = a === b;
        if (!stuck) {
          lines.push(`${dlt > 0 ? '📈' : '📉'} ${nm} · ${p.label}: ${a || '—'} → ${b}`);
          changes.push({ who: nm, label: p.label, from: a, to: b, up: dlt > 0 });
        }
        // ⚡ sınırı bu değişimle geçtiyse eşik olayı; değer sınırda takılıysa (ör. Zevk 100'deyken +10) o yöne itmek de tetikler
        const x = +a || 0, y = +b;
        allTriggers().forEach(tr => {
          if (tr.p !== p.id || isNaN(y)) return;
          const v = +tr.v, hit = tr.op === '<=' ? (x > v && y <= v) || (stuck && dlt < 0 && y <= v) : (x < v && y >= v) || (stuck && dlt > 0 && y >= v);
          if (!hit || !trCondsOk(tr, ch)) return;
          const label = `${p.label} ${tr.op === '<=' ? '≤' : '≥'} ${v}`;
          trFire(tr, label).forEach(ev => fired.push({ ev, who: nm, text: `⚡ ${nm} · ${label} → ${ev.title}` }));
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

  // 📖 kitaptaki örnek sohbet: [kim, metin] → me: sen · her: karakter · ev: 📜 olay kartı · note: açıklama
  // senin mesajlarında ▶ dene: Bot deneyini o mesajla açar
  const bkChat = (title, rows) => `<div class="bk-chat"><div class="bk-chat-h">${title}</div>${rows.map(([k, t]) => k === 'note' ? `<div class="bk-cn">✒️ ${t}</div>` : k === 'ev' ? `<div class="bk-cev">${t}</div>`
    : k === 'me' ? `<div class="bk-cb me">${t}<button type="button" class="bk-try" data-bktry="${esc(t)}" title="Bot deneyinde dene">▶ dene</button></div>` : `<div class="bk-cb ${k}">${t}</div>`).join('')}</div>`;
  // 💁‍♀️ Lia'nın kitaptaki kenar notları (bölüm adına göre)
  const BOOK_LIA = {
    'Sohbetin temelleri': '# yazmayı unutma, en hızlı yol o! Bir de alttaki ⚡ kısayollar var 😉',
    'Olaylar ve sonuçlar': 'Yüzdeleri toplam 100\'ü geçirme, yoksa bazıları hiç çıkmaz 🙈',
    'Parametreler ve durumlar': 'Barlar sağ üstte; artınca küçük "+5" uçar, izle 👀',
    'Ortak sonuçlar ve etiketler': 'Bir kez yaz, her yerde geçsin. Tembellerin en iyi dostu 😌',
    'Eşik olayları': 'Eşik tetiklenmiyorsa önce değerin gerçekten arttığına bak!',
    'Pozisyonlar ve bitiş': 'Yeni pozisyona bir bitiş etiketi ver, gerisi kendiliğinden 🎯',
    'Cumming: miktar ve meni': 'Arka arkaya ikinci tur? Cum düşük, döl sulu olur 😏',
    'Onun orgazmı': 'Önce onu ısıt. Lia\'nın sırrı: Eat → Eat → Orgazm 💗',
    'Sohbet saati': 'Gece yarısından sonra karakterler uykulu ama durmaz 🌙',
    'Korunma ve hamilelik': 'Riskli günlerde 🩸 kartta 🔥 görünür; dikkat!',
    'İzinler ve kurallar': 'Nothing\'e izin veren, hiçbir korunmayı reddetmez. Kural kural 📏',
    'İdeal bir seans': 'Acele etme; öpüşerek başla, sonra yavaş yavaş… 💋',
    'Bot modu: karakter nasıl cevap verir': 'Karakter anlamadıysa 🧪 Bot deneyinde 📭 Eksik cevaplar\'a bak!',
    'Bir seans, baştan sona': 'Bunu bir kere baştan sona dene, her şey yerine oturur ✨',
    'Örnek mesajlaşmalar': '▶ dene\'ye bas, cevapların hepsini gör 🧪',
    'Daha çok örnek': 'Aynı soruyu farklı karakterlere sor; kişilik her şeyi değiştirir 🎭',
    'Puan sistemi': 'Puan biriktirilmez! Sadece hangi cevabın kazandığını söyler 🎯',
    'Yeni dinamikler': 'Acı yükselirse Gentle\'a geç, rahatlar 💕',
    'Bot modu nedir?': 'Kurallar senin elinde; ne kadar çok yazarsan karakter o kadar canlı 🤖',
    'Kurallar nasıl eşleşir?': '"ahhhh" ile "ah" aynı sayılır, uzatmaktan korkma 😄',
    'Cevap yolları': 'Karakter soru sorduysa önce senin evet / hayır\'ına bakar!',
    'Durum baloncukları': 'Barları izle: Zevk 70\'i geçince "boşal" demeye başlar 😏',
    'Kural yazma rehberi': 'Önce 📭 eksik cevaplara bak; en çok tekrar edeni yaz ✍️',
    'Seans nedir?': 'Boşalmayı sen yazmazsın; değerler dolunca kendiliğinden gelir 💦',
    'Seans türleri': 'Bir türü tasarımcıda aç, sonra kendine göre değiştir 🧪',
    'Akıcı geçişler': 'Cowgirl\'den Missionary\'ye yuvarlanmak benim favorim 💞',
    'Kendi seansını tasarla': 'Puanı 80\'in üstüne çıkarabilir misin? 😉',
    'Değerleri okumak': 'Acı 30\'u geçtiyse Gentle; ben söylemiş olayım 💕',
    'Kayıt ve kurulumlar': 'Arada bir 💾 yedek al, içim rahat etsin 🙏',
    'Sohbetin dışındaki dünya': 'Bir otel ayarla, bir oyuncak sipariş et… gerisi sohbette 😏',
    'Seansı siteyle hazırla': 'Jakuzili süit + masaj yağı = benim favori seansım 🛁',
    'İnternet nedir?': 'İlan kızlarından biri gözüne çarptıysa bir mesaj yeter, artık senin karakterin 💌',
    'Carmen.com': 'Kondom şartını ilandan oku, sohbette sürpriz yaşama 🛡️',
    'CarmenFans': 'Haftanın kostümünü kaçırma; her pazartesi değişiyor 📢',
    'CarmenStay': 'Gece 22:00 rezervasyonu en romantiği 🌙',
    'CarmenFlix': 'Sadakatsiz Kalpler\'i 3x hızda izleme, tadını çıkar 🍿',
    'CarmenLive': 'Hedefi doldur, sürprizi gör 🎯',
    'CarmenShop': 'Ekspres kargo bir dakika; sabırsızlara göre 📦',
    'CarmenJobs': 'Mülakatta ⚡ kısayoldaki rol olayına dokun, gerisi akar 💼',
    'CarmenKlinik': 'Riskli günlere bak, sonra karar ver 🩸',
    'Gizli İtiraf': 'Maç itirafını okudun mu? Her gol sesinde… 😂⚽',
    'Nerede saklanır?': 'İlan kızları tarayıcıda; sevdiğini kaybetme, mesaj at 💾'
  };
  // bölüm adları ve takma adları kitapta bağlantı olur (her biri sayfada ilk geçtiği yerde)
  const BOOK_ALIAS = { 'Eşik olayları': ['eşikler', 'Eşik'], 'Puan sistemi': ['puan'], 'Sohbet saati': ['🕰️ saat'], 'Ortak sonuçlar ve etiketler': ['Ortak sonuç'], 'İdeal bir seans': ['ideal seans'],
    'Onun orgazmı': ['Uyarılma'], 'Korunma ve hamilelik': ['Condom'], 'İzinler ve kurallar': ['📏 Kurallar'], 'Cumming: miktar ve meni': ['döl miktarı'], 'Yeni dinamikler': ['Acı', 'döngü'] };
  /* 📘 sözlük: kitapta terime dokununca baloncuk (bölümde ilk geçtiği yer). ch: ayrıntılı bölüm */
  const GLOSS = [
    ['Zevk', '🥴 Senin boşalma isteğin. Pozisyonlar +8, Foreplay +1–3 artırır; 80\'i geçince pozisyona uyan boşalma gelir.', 'Pozisyonlar ve bitiş'],
    ['Uyarılma', '💗 Onun orgazma yakınlığı. Eat olayları artırır (Squirt +40); 80\'de Orgazm gelir ve sıfırlanır.', 'Onun orgazmı'],
    ['Şehvet', '🔥 Onun birikmiş arzusu. Her Eat +10; orgazmın ıslaklığını (Drops … Squirt Woter) belirler, saatte −5 söner.', 'Onun orgazmı'],
    ['Cumming sayısı', '🔁 Bu turda kaç kez boşaldığın. Döl yoğunluğunu belirler (0 → Hyper-concentrated, 5+ → Azoospermia); Holding −1 yapabilir.', 'Cumming: miktar ve meni'],
    ['Cum', '💦 Ne kadar boşalabileceğin (döl rezervi). Boşalma 10–50 düşürür, saat başı +10 dolar; miktarı (Watery … High Sperm) belirler.', 'Cumming: miktar ve meni'],
    ['boşalma', '🏷️ Gerçekten boşalan Cumming olaylarının etiketi. Holding, Hard Holding ve Cock Ring\'de yoktur; miktar ve yoğunluk olayları bunu bekler.', 'Boşalma olayları'],
    ['ortak sonuç', '🔗 Birçok olayın paylaştığı tek sonuç listesi (ör. "Etiket sonuçları": her pozisyonda Zevk +8). Bir kez yazılır, hepsinde geçer.', 'Ortak sonuçlar ve etiketler'],
    ['eşik', '⚡ Bir değer sınırı geçince kendiliğinden olan olay (Zevk ≥ 80 → boşalma, Uyarılma ≥ 80 → orgazm).', 'Eşik olayları'],
    ['Acı', '😣 Onun canının yanması. Dar + büyük, anal, Rough artırır; Gentle (−14), Foreplay ve Eat azaltır; 60+ "dur, acıtıyor".', 'Pozisyonlar'],
    ['Aşk', '❤️ Sana olan sevgisi. Foreplay, iltifat ve orgazm artırır; hitabı ("aşkım") ve ısrara razı olmasını belirler.', 'Parametreler ve durumlar'],
    ['Güven', '🤝 Sana güveni. 15 ve altında özel sorulara kaçamak cevap verir; izinsiz korunma düşürür.', 'Parametreler ve durumlar'],
    ['Samimiyet', '🫂 Yakınlık. Her pozisyon ve Foreplay artırır; cevapların sıcaklığını etkiler.', 'Parametreler ve durumlar'],
    ['Süt', '🍼 Hamileyken göğüslerindeki süt. Saat başı +5 dolar, orgazmda Milk olayı gelir ve −30.', 'Onun orgazmı'],
    ['Holding', '✋ Boşalmayı erteler: Zevk düşer, Cum birikir, bazen döl yoğunlaşır; %20 tutamazsın.', 'Boşalma olayları'],
    ['Woter', '💧 Onun orgazmındaki ıslaklık: Drops, Low-volume, Normal, High-volume, Squirt.', 'Orgazm olayları'],
    ['doğurganlık', '🌱 Karakterin hamile kalma yatkınlığı (0–100). Hamilelik yüzdesini ölçekler; döngü günü çarpar (riskli gün ×1,8).', 'Korunma ve hamilelik'],
    ['riskli gün', '🔥 Döngünün 11–16. günleri: hamilelik ihtimali ×1,8. Regl günlerinde ×0,15.', 'Yeni dinamikler'],
    ['Mode', '💥 Pozisyonun şiddeti: Gentle, Passionate, Assertive, Rough, Brutal, inletmeli, bağırtmalı, ağlatmalı. Acı\'yı ve cevapların tonunu değiştirir.', 'Pozisyonlar'],
    ['Outercourse', '🍌 İçeri girmeden pozisyonlar (oral, göğüs, kalça, bacak, el). Acı ve hamilelik yok.', 'Pozisyonlar'],
    ['Foreplay', '💋 Isınma: Kissing, Hugging, Show… Zevk az, Aşk ve Samimiyet çok artar; Acı −6.', 'Pozisyonlar'],
    ['etiket', '🏷️ Olaya verilen anahtar kelime (vajinal, anal, oral, göğüs…). Pozisyonun bitişini ve ortak sonuçları eşler.', 'Ortak sonuçlar ve etiketler'],
    ['durum baloncuğu', '📊 Ana cevabın altına gelen ek mesaj: Zevk, Acı, korunma, saat, ilişki gibi o anki duruma göre.', 'Durum baloncukları'],
    ['gevşek eşleşme', '🔓 Senin mesajında kelimeler başka sırada ya da biri eksik olsa da kuralın düşük puanla yarışa girmesi.', 'Kurallar nasıl eşleşir?'],
    ['ilan kızı', '🌹 Carmen.com\'daki rastgele kızlar. Mesaj, rezervasyon, sipariş ya da başvuru yapınca karakterlerine eklenir.', 'İnternet nedir?'],
    ['VIP', '👑 Carmen.com\'da seçkin ilanlar: fiyatlar 2,5 kat, puan yüksek; Fans aboneliği de pahalı.', 'Carmen.com'],
    ['kondom şartı', '🛡️ İlandaki kural: ✅ izinlerinde Nothing, hap, sabah hapı ya da dışarı boşalma yoksa kondomsuz görüşmez.', 'Carmen.com'],
    ['haftanın kostümü', '📢 CarmenFans\'ta her hafta değişen kostüm; sevdiği fanteziye uyan önce gelir.', 'CarmenFans'],
    ['bahşiş', '💸 CarmenLive\'da gönderdiğin para; tutara göre dans, Show, kostüm, oyuncak ya da özel yayın.', 'CarmenLive'],
    ['kargo', '📦 CarmenShop siparişi; süre dolunca teslim edilir, oyuncak ⚡ olay olur, giyim gardıroba girer.', 'CarmenShop']
  ];
  const glossOf = w => GLOSS.find(g => g[0].toLocaleLowerCase('tr') === String(w).toLocaleLowerCase('tr'));
  // ❓ bu ekranın kitap bölümü (sayfa başlıklarındaki düğme)
  const CTX_BOOK = { home: 'Sohbetin temelleri', messages: 'Sohbetin temelleri', chat: 'Sohbetin temelleri', esles: 'Sohbetin temelleri', create: 'İzinler ve kurallar', p: 'Parametreler ve durumlar',
    hikayeler: 'Olaylar ve sonuçlar', monia: 'Olaylar ve sonuçlar', senaryo: 'Olaylar ve sonuçlar', olay: 'Olaylar ve sonuçlar', sonuc: 'Olaylar ve sonuçlar', gruplar: 'Ortak sonuçlar ve etiketler', kategoriler: 'Ortak sonuçlar ve etiketler',
    kurallar: 'İzinler ve kurallar', izin: 'İzinler ve kurallar', bot: 'Kural yazma rehberi', deney: 'Bot deneyi ve eksik cevaplar', me: 'Kayıt ve kurulumlar',
    internet: 'İnternet nedir?', carmen: 'Carmen.com', fans: 'CarmenFans', otel: 'CarmenStay', canli: 'CarmenLive', shop: 'CarmenShop', is: 'CarmenJobs', klinik: 'CarmenKlinik', itiraf: 'Gizli İtiraf', flix: 'CarmenFlix' };
  const ctxKey = () => { const r = ui.route || {}; if (r.name === 'monia') return ['sonuc', 'gruplar', 'kategoriler', 'olay'].includes(r.id) ? r.id : r.id ? 'senaryo' : 'monia'; if (r.name === 'kurallar' && r.id === 'izin') return 'izin'; return r.name || 'home'; };
  const ctxHelp = (cls = 'icon-btn') => `<button type="button" class="${cls} ctx-help" data-ctxhelp aria-label="Bu ekranın kitap bölümü" title="❓ ${esc(CTX_BOOK[ctxKey()] || 'Sohbetin temelleri')}">❓</button>`;
  document.addEventListener('click', e => {
    if (!e.target.closest('[data-ctxhelp]')) return;
    e.preventDefault();
    const [id, i] = bookIdx(CTX_BOOK[ctxKey()] || 'Sohbetin temelleri');
    openBook(id, i);
  });
  /* 👤 "Senin karakterin" kutusu: bölümün konusuna göre seçili karakterin değerleri (karakter bu tarayıcıda hatırlanır) */
  const bookCharId = v => { try { if (v != null) localStorage.setItem('amor-stories:bookchar', v); return localStorage.getItem('amor-stories:bookchar') || ''; } catch (e) { return v || ''; } };
  const BOOK_ME = {
    'Pozisyonlar ve bitiş': ['body', 'love'], 'Pozisyonlar': ['body', 'love'], 'Akıcı geçişler': ['body', 'love'], 'Yeni dinamikler': ['perm', 'body'],
    'Cumming: miktar ve meni': ['cum', 'perm'], 'Boşalma olayları': ['cum', 'perm'], 'Onun orgazmı': ['org'], 'Orgazm olayları': ['org'],
    'Korunma ve hamilelik': ['perm'], 'İzinler ve kurallar': ['perm'], 'İzinlere göre tepkiler': ['perm'],
    'Parametreler ve durumlar': ['vals', 'cum'], 'Değerleri okumak': ['vals', 'cum'], 'Seans nedir?': ['vals', 'cum'], 'Durum baloncukları': ['vals', 'cum'], 'Eşik olayları': ['vals', 'cum'],
    'İdeal bir seans': ['love', 'body'], 'Seans türleri': ['love', 'body'], 'Bir seans, baştan sona': ['love', 'body'],
    'Kişilik, ton ve yazım': ['pers', 'love'], 'Sorular ve karşı sorular': ['pers', 'love'], 'Canlı karakter': ['pers', 'love'],
    'Carmen.com': ['perm', 'love'], 'CarmenKlinik': ['perm'], 'CarmenLive': ['vals'], 'CarmenFans': ['love']
  };
  function bookMeFacts(ch, kinds) {
    const low = s => String(s || '').toLocaleLowerCase('tr'), nm = esc(ch.name || 'Karakter'), out = [];
    const cp = l => { const p = allParams().find(x => x.who !== 'me' && low(x.label) === l); return p ? paramVal(ch, p) : null; };
    const mp = l => { const p = allParams().find(x => x.who === 'me' && low(x.label) === l); return p ? paramVal(S().user || {}, p) : null; };
    const band = (v, list) => list.find(([n]) => v <= n)[1];
    const titles = ids => feelEvents(ids || []).map(e => esc(e.title)).join(', ');
    const sg = n => (n > 0 ? '+' : '') + n;
    kinds.forEach(k => {
      if (k === 'body') {
        const tv = ['Pussy Size', 'Anal Size', 'Boob Size', 'Butt Size', 'Experience'].map(g => traitVal(ch, g) && `${g}: <b>${esc(traitVal(ch, g))}</b>`).filter(Boolean);
        if (tv.length) out.push(`🧬 ${tv.join(' · ')}`);
        const pains = ['Missionary', 'Doggy', 'Spooning Anal', 'Rough Anal'].map(t => { const e = evByT(t); return e && `${t} ${sg(painDelta(e, ch))}`; }).filter(Boolean);
        if (pains.length) out.push(`😣 ${nm}'in her pozisyonda Acı'sı${(S().user || {}).size ? ` (senin ${+S().user.size} cm ile)` : ''}: <b>${pains.join(' · ')}</b>; Gentle −14, Foreplay −6`);
      }
      if (k === 'love') {
        if ((ch.likes || []).length) out.push(`❤️ Sevdikleri: ${titles(ch.likes)}`);
        if ((ch.dislikes || []).length) out.push(`💔 Sevmedikleri: ${titles(ch.dislikes)}`);
      }
      if (k === 'perm') {
        out.push(`✅ İzin verdikleri: ${titles(ch.allows) || '—'} · 🚫 Vermedikleri: ${titles(ch.denies) || '—'}`);
        if ((ch.fields || {}).hamile) out.push(`🤰 ${nm} hamile${pregWeek(ch) ? ` (${pregWeek(ch)}. hafta)` : ''}: içine boşalmak risk değil`);
        else {
          const ph = CYCLE[cyclePhase(ch)], f0 = (ch.fields || {})[FERT_ID], fert = Math.min(100, (f0 === '' || f0 == null ? 50 : +f0) * ph.mul);
          out.push(`🩸 Döngünün ${cycleDay(ch)}. günü: ${ph.icon} ${ph.label} · 🌱 doğurganlık ${f0 === '' || f0 == null ? 50 : +f0} → Vaginal Creampie'de korunmasız hamile kalma ihtimali <b>%${Math.round(Math.min(100, 50 * fert / 50))}</b> (Condom olursa %0)`);
        }
      }
      if (k === 'cum') {
        const z = mp('zevk'), c = mp('cum'), n = mp('cumming sayısı');
        if (z != null) out.push(`🥴 Senin Zevk'in <b>${z}</b>${z >= 80 ? ': boşalma eşiğinde' : `: boşalmaya ${80 - z} kaldı (~${Math.ceil((80 - z) / 8)} pozisyon)`}`);
        if (c != null) out.push(`💦 Cum <b>${c}</b> → şimdi boşalırsan <b>${band(c, [[14, 'Watery'], [39, 'Low-volume'], [69, 'Normal'], [89, 'Thick White'], [100, 'High Sperm']])}</b>`);
        if (n != null) out.push(`🔁 Cumming sayısı <b>${n}</b> → yoğunluk <b>${band(n, [[0, 'Hyper-concentrated'], [1, 'Polyzoospermia'], [2, 'Normozoospermia'], [4, 'Oligospermia'], [999, 'Azoospermia']])}</b>`);
      }
      if (k === 'org') {
        const u = cp('uyarılma'), s = cp('şehvet'), m = cp('süt');
        if (u != null) out.push(`💗 ${nm}'in Uyarılma'sı <b>${u}</b>${u >= 80 ? ': orgazm eşiğinde' : `: ${80 - u} kaldı (bir Cunnilingus +25, Squirt +40)`}`);
        if (s != null) out.push(`🔥 Şehvet <b>${s}</b> → şimdi orgazm olursa <b>${band(s, [[19, 'Drops'], [44, 'Low-volume'], [69, 'Normal'], [89, 'High-volume'], [100, 'Squirt']])} Woter</b>`);
        if (m != null && (ch.fields || {}).hamile) out.push(`🍼 Süt <b>${m}</b>${m < 10 ? ': süt gelmez' : ' → orgazmda Milk da gelir'}`);
      }
      if (k === 'vals') {
        const vs = allParams().filter(p => p.who !== 'me').map(p => `${p.icon || ''} ${esc(p.label)} <b>${paramVal(ch, p)}</b>`);
        if (vs.length) out.push(`📊 ${vs.join(' · ')}`);
      }
      if (k === 'pers') {
        const pers = (ch.traits || []).filter(t => !t.includes(':'));
        out.push(`🎭 Kişilik: ${pers.length ? pers.map(esc).join(', ') : '—'} · ❤️ Aşk <b>${cp('aşk') ?? 0}</b> · 🤝 Güven <b>${cp('güven') ?? 0}</b>${(cp('güven') ?? 0) <= 15 ? ' (özel sorulara kaçamak cevap verir)' : ''}`);
      }
    });
    return out;
  }
  /* 📖 Carmen Kitabı (Ben → ❓ Yardım): her bölüm bir sayfa; kaldığın bölüm bu tarayıcıda hatırlanır (amor-stories:book) */
  const BOOK = [
    { icon: '💬', title: 'Sohbetin temelleri', sub: 'kim yazar, olaylar nasıl girer', body: `
      <p>Carmen'de yapay zeka yok: hikayeyi sen yazarsın. Sohbette alttaki avatara ya da 🔁 Taraf'a dokunarak <b>kimin yazdığını</b> seçersin; ⇄ Sırayla açıksa taraf her mesajdan sonra kendiliğinden değişir. 📝 Not ortada bir anlatım satırıdır.</p>
      <p>Hikayeye üç yoldan <b>olay</b> girer:</p>
      <ul><li><b># ile</b>: mesaj kutusuna <code>#doggy</code> gibi yazıp olayı seç. Olay mesaj kutusunun üstünde 📜 bekler: istersen yanına metin yaz ("#Missionary aşkım sana köklüyorum şu an") ve gönder; metin senin mesajın olur, ardından olay yazılır (karakter olaya cevap verir). Kutu boşken Enter olayı hemen yazar, ✕ ile çıkarırsın. 🎲 sonucu karakterden gelir.</li>
        <li><b>🎬 Senaryo</b>: senaryonun olayları sırayla 📜 kart olarak gelir.</li>
        <li><b>Tetiklenme</b>: bir sonucun ↪ sonraki olayı, ⚡ eşikler, 🎚️ değere göre olaylar ve 🕰️ saat kendiliğinden olay getirir.</li></ul>
      <p>Bir olay olunca sırasıyla: 🎲 sonucu seçilir → 📈 etkileri uygulanır → ⚡ "olunca" etkileri uygulanır → zincirdeki olaylar (↪, ⚡, 🎚️) ardından gelir. Zincir en fazla <b>3 adım</b> derine iner (sonsuz döngü olmasın).</p>` },
    { icon: '🎲', title: 'Olaylar ve sonuçlar', sub: 'yüzdeler, şartlar, etkiler', body: `
      <p>Her olayın 🎲 <b>sonuçları</b> vardır (Monia → 🎲 Sebep-Sonuç ya da olay editörü). Olay olunca yüzdelere göre <b>bir</b> sonuç seçilir; toplam %100'den azsa kalan yüzde "sonuç yok"tur.</p>
      <ul><li><b>📈 Etki</b>: parametreyi artırır / azaltır ya da 🔘 durumu Evet / Hayır yapar. Sonuç metnine <code>{+Aşk}</code>, <code>{-10 Güven}</code> yazmak da etki ekler.</li>
        <li><b>🔒 Şart</b>: 📜 olduysa / 🚫 olmadıysa, 📊 parametre ≥ / ≤, 🔘 durum. Şart tutmazsa sonuç 🛡️ <b>olmadı</b> olarak görünür.</li>
        <li><b>⭐ Varsayılan</b>: seçilen sonucun şartı tutmazsa onun yerine bu olur.</li>
        <li><b>↪ Sonraki olay</b>: bu sonuç çıkarsa ardından gelecek olay (sonuç metnine <code>#</code> yazarak da seçilir).</li>
        <li><b>⚡ Olunca etkileri</b> (olay editörü): sonuç ne çıkarsa çıksın, olay olduğu için uygulanır.</li></ul>
      <p><b>"Olduysa" şartları harcanır:</b> Condom bir ilişkiyi korur. Şartta kullanılınca harcanır; sonraki ilişkiyi korumak için Condom yeniden olmalı.</p>` },
    { icon: '📊', title: 'Parametreler ve durumlar', sub: 'karakterin ve senin değerlerin', body: `
      <p>📊 <b>Parametreler</b> (Sebep-Sonuç → 📊) iki çeşittir:</p>
      <ul><li><b>👤 Karakterin</b>: her karakterin kendi değeri (Güven, Aşk, 🔥 Şehvet, 💗 Uyarılma, 🍼 Süt…). Sohbette 📊 durum kartında görünür.</li>
        <li><b>🙋 Senin</b>: bir tane, sende (🥴 Zevk, 💦 Cum, 🔁 Cumming sayısı). Sağ üstteki dikey barlarda görünür.</li></ul>
      <p>🔘 <b>Durumlar</b> (Hamile, Bakire, Korunma…) karakterin aç / kapa alanlarıdır; 📊 kartta dokunarak da değiştirebilirsin.</p>
      <p>Parametreler elle değişmez; sadece sonuçlar, ⚡ olunca etkileri, ⚡ eşikler ve 🕰️ saat kuralları değiştirir. Her parametrenin en az / en çok sınırı vardır, değer bu aralıkta kalır.</p>
      <p>🌱 <b>Doğurganlık</b>: hamile bırakan sonuçların yüzdesi karakterin doğurganlığıyla ölçeklenir: %50 olduğu gibi, %0 hiç, %100 iki katı.</p>` },
    { icon: '🔗', title: 'Ortak sonuçlar ve etiketler', sub: 'bir kez yaz, birçok olayda geçsin', body: `
      <p>🔗 <b>Ortak sonuç</b>: birden çok olay aynı sonuç listesini kullanır. Olayları tek tek seçebilir ya da <b>🏷️ olay etiketine</b> / <b>🗂️ kategori etiketine</b> bağlayabilirsin.</p>
      <p>Bir olayda hangi sonuçların geçerli olduğu şu sırayla belirlenir:</p>
      <ol><li>Olayı <b>adıyla</b> seçmiş ortak sonuç,</li><li>olayın <b>kendi</b> sonuçları,</li><li><b>etiketi</b> tutan ortak sonuç.</li></ol>
      <p>Örnek: "Etiket sonuçları" 🗂️ <code>event</code> kategorilerindeki her pozisyonda 🥴 Zevk +8 verir (💋 Foreplay'de "Foreplay ısınma" ile sadece +1–3); ama Vaginal Creampie gibi kendi sonucu olan olayda devre dışı kalır.</p>
      <p>Kategori etiketlerinin özel anlamları: <code>event</code> = pozisyon / sohbette üstte, sevdiği-sevmediği listeleri; <code>if</code> = ✅ izin verdiği / 🚫 vermediği; <code>result</code> = Cumming sonuçları.</p>` },
    { icon: '⚡', title: 'Eşik olayları', sub: 'bir değer sınırı geçince', body: `
      <p>⚡ <b>Eşik</b>: bir parametre sınırı geçince tetiklenir: <i>≥ yükselince</i> ya da <i>≤ düşünce</i>. Değer sınırda takılıysa (ör. Zevk 100'deyken +10) o yöne itmek de tetikler.</p>
      <p><b>Hedef</b> şunlardan biri olabilir:</p>
      <ul><li>🎯 <b>Şu anki pozisyona uyan olay</b>: seçilen kategoriden, en son olan pozisyonla <b>aynı etiketi</b> taşıyan olay.</li>
        <li>📜 bir <b>olay</b> olur,</li>
        <li>🎲 bir olayın <b>sonuçları</b> (olay olmadan), 🔗 bir <b>ortak sonuç</b> ya da 🎯 <b>tek bir sonuç</b> (kesin),</li>
        <li>— hedef yok: sadece eşiğin kendi mesajı / etkileri.</li></ul>
      <p><b>⋯</b> ile eşiğe 💬 mesaj, 📈 etki (ör. 🥴 Zevk −100) ve 🔒 şart (📊 / 🔘) eklenir. Sohbette önce eşiğin kendi mesajı ve etkileri, sonra hedefi gelir.</p>` },
    { icon: '🎯', title: 'Pozisyonlar ve bitiş', sub: 'Zevk yükselince hangi Cumming?', body: `
      <p>"Şu anki pozisyon" sohbette en son olan, 🗂️ <code>event</code> etiketli kategorideki olaydır (Forward, Backward, Foreplay, Outercourse, Eat). Pozisyonlar <b>bitiş yeri</b> etiketi taşır; Cumming olayları da aynısını:</p>
      <table class="bk-t"><tr><th>Etiket</th><th>Pozisyonlar</th><th>Bitiş</th></tr>
        <tr><td>vajinal</td><td>Missionary, Cowgirl, Doggy, Spooning, Standing, Lap Sex…</td><td>Vaginal Creampie</td></tr>
        <tr><td>anal</td><td>Cowgirl / Standing / Rough / Spooning Anal, Standing doggy</td><td>Anal Creampie</td></tr>
        <tr><td>oral</td><td>Blowjob, Deepthroat, Oral Sex, 69</td><td>Oral Creampie, Mouth / Face Cumming</td></tr>
        <tr><td>göğüs</td><td>Titfuck, Reverse Titfuck</td><td>Tit Cumshot</td></tr>
        <tr><td>bacak</td><td>Footjob, Legjob</td><td>Leg Cumshot, Legs Creampie</td></tr>
        <tr><td>kalça</td><td>Buttjob, Hotdogging</td><td>Ass Cumshot</td></tr>
        <tr><td>el</td><td>Handjob, Masturbation</td><td>Face Cumming</td></tr></table>
      <p><b>Akış:</b> her pozisyon 🥴 Zevk'i artırır → <b>Zevk ≥ 80</b> → 🎯 Cumming kategorisinden pozisyonla aynı etiketli olay (birden çok uyan varsa rastgele) → Zevk −100.</p>
      <p>Yeni pozisyon eklediğinde ona bir bitiş etiketi vermen yeter.</p>` },
    { icon: '💦', title: 'Cumming: miktar ve meni', sub: 'Cum rezervi ve Cumming sayısı', body: `
      <p>Gerçekten boşalan Cumming olayları 🏷️ <code>boşalma</code> taşır (Holding, Cock Ring, Hard Holding hariç). Böyle bir olay olunca ardından iki olay gelir; ikisi de <b>boşalmadan önceki</b> değere bakar:</p>
      <table class="bk-t"><tr><th>💦 Cum</th><th>Miktar</th></tr>
        <tr><td>0–14</td><td>Watery</td></tr><tr><td>15–39</td><td>Low-volume</td></tr><tr><td>40–69</td><td>Normal</td></tr><tr><td>70–89</td><td>Thick White</td></tr><tr><td>90–100</td><td>High Sperm</td></tr></table>
      <table class="bk-t"><tr><th>🔁 Cumming sayısı</th><th>Meni yoğunluğu</th></tr>
        <tr><td>0</td><td>Hyper-concentrated (4/4)</td></tr><tr><td>1</td><td>Polyzoospermia (3/4)</td></tr><tr><td>2</td><td>Normozoospermia (2/4)</td></tr><tr><td>3–4</td><td>Oligospermia (1/4)</td></tr><tr><td>5+</td><td>Azoospermia (0/4)</td></tr></table>
      <p>Her boşalma 🔁 Cumming sayısını +1 yapar, "Cumming" ortak sonucu 💦 Cum'u 10–50 düşürür (Vaginal Creampie'de −30). 🕰️ her saat başı Cum +10 ve sayı −1 ile toparlanırsın.</p>
      <p>Aralıklar Sebep-Sonuç → 🎚️ <b>Değere göre olay</b>'da değişir.</p>` },
    { icon: '💗', title: 'Onun orgazmı', sub: 'Eat, Woter ve Milk', body: `
      <p>Eat olayları karakterin <b>💗 Uyarılma</b>'sını (Cunnilingus +25, Breastfeeding +30, Facesitting +20, On Mouth +15, Squirt +40) ve <b>🔥 Şehvet</b>'ini (+10) artırır. 🍼 <b>Breastfeeding</b>: göğüslerini emersin; hamileyse sütünü içersin (Süt −10), Aşk +3.</p>
      <p><b>Uyarılma ≥ 80</b> → 💗 <b>Orgazm</b> olayı, Uyarılma sıfırlanır. Ardından:</p>
      <table class="bk-t"><tr><th>🔥 Şehvet</th><th>Şiddet</th></tr>
        <tr><td>0–19</td><td>Drops Woter</td></tr><tr><td>20–44</td><td>Low-volume Woter</td></tr><tr><td>45–69</td><td>Normal Woter</td></tr><tr><td>70–89</td><td>High-volume Woter</td></tr><tr><td>90–100</td><td>Squirt Woter</td></tr></table>
      <p>🔘 <b>Hamile ise</b> ayrıca 🍼 Süt'e göre Milk gelir (10–29 Drops … 90–100 Squirt Milk; 10'un altında süt yok). Orgazm Süt'ü 30 azaltır.</p>
      <p>Şehvet her Eat'te birikir: aynı seansta orgazmlar güçlenir. 🕰️ her saat başı Süt +5 dolar, Şehvet −5 söner.</p>` },
    { icon: '🕰️', title: 'Sohbet saati', sub: 'mesaj başına ilerleyen zaman', body: `
      <p>Her sohbetin bir saati vardır (sol üstte, ör. 🌙 23:35 · 2. gün). Sohbet <b>başlangıç saatinde</b> başlar, her mesajda (senin ya da onun) <b>mesaj başına dakika</b> kadar ilerler. Saate dokunarak o sohbetin saatini, hızını değiştirebilir ya da kapatabilirsin.</p>
      <p>Saat kuralları (Sebep-Sonuç → 🕰️ Saat):</p>
      <ul><li><b>her mesajda</b>: aralıktaki her mesajda (ör. 22:00 – 02:00 → 🔥 Şehvet +1). Sessizdir, barlarda görünür.</li>
        <li><b>her saat başı</b>: aralıktaki her saat başında (ör. 00:00 – 00:00 = bütün gün → 💦 Cum +10).</li>
        <li><b>saat gelince</b>: günde bir kez (ör. 03:00 → 🤝 Güven −5).</li></ul>
      <p>Aralıklar gece yarısını geçebilir. Saatin değiştirdiği değerler de ⚡ eşikleri tetikler.</p>` },
    { icon: '🛡️', title: 'Korunma ve hamilelik', sub: 'Condom, Vaginal Creampie', body: `
      <p><b>Vaginal Creampie</b>'nin kendi sonucu: %50 "{ben} hamile kaldı" (🔘 Hamile → Evet), şartı <b>🚫 Condom olmadıysa</b>. Condom olduysa 🛡️ olmadı görünür ve Condom harcanır.</p>
      <p>Yüzde 🌱 doğurganlığa göre ölçeklenir. Hamile olunca 📊 kartta parlayan bir çip ve kutlama efekti çıkar; Hamile iken orgazmda süt de gelir.</p>
      <p>Bir olayın ⚡ olunca etkileri sonuç belirlendikten <b>sonra</b> uygulanır: şartlar olaydan önceki değere bakar.</p>` },
    { icon: '✅', title: 'İzinler ve kurallar', sub: 'Oluştur kuralları, ✅/🚫', body: `
      <p>Karakterin ✅ <b>izin verdiği</b> / 🚫 <b>vermediği</b> olaylar <code>if</code> etiketli kategorilerden (Protection) seçilir. Bir olay ya bir listede ya ötekinde olur.</p>
      <p><b>📏 Kurallar</b> (Oluştur → 📏, iki sekme): <i>"Eğer şu varsa → şunlar olamaz"</i>. Örn. ✅ Nothing → 🚫 hiçbir şey olamaz: Nothing'e izin veren hiçbir korunmayı reddetmez. Kurala aykırı seçenek seçilemez, 🎲 rastgele de seçmez; kayıtlı karakterlerin izinleri açılışta ve kayıtta kendiliğinden düzelir.</p>
      <p>✅ İzin kuralları sekmesinde (ya da Oluştur → ✅ İzinler → ⚙️) 🎲 rastgelede kaç ✅ / 🚫 seçileceğini de belirlersin.</p>` },
    { icon: '💞', title: 'İdeal bir seans', sub: 'hangi sırayla, neden', body: `
      <p>Lia sohbette bu sırayı izler; her aşamada o kategoriden (önce karakterin ❤️ sevdiklerinden, 💔 sevmediklerini atlayarak) öneri verir.</p>
      <table class="bk-t"><tr><th>Aşama</th><th>Kategori</th><th>Neden</th></tr>
        <tr><td>💋 Isınma</td><td>Foreplay</td><td>Öpüşme, sarılma; yakınlık kurulur</td></tr>
        <tr><td>👅 Onu ısıt</td><td>Eat</td><td>💗 Uyarılma ve 🔥 Şehvet birikir; ilk orgazmı gelir</td></tr>
        <tr><td>🤲 Dokunuş</td><td>Outercourse</td><td>🥴 Zevk'in yavaş yavaş artar</td></tr>
        <tr><td>🛡️ Korunma</td><td>Protection</td><td>Condom bir ilişkiyi korur, sonra harcanır</td></tr>
        <tr><td>❤️ Önden</td><td>Forward</td><td>Vajinal pozisyonlar</td></tr>
        <tr><td>🍑 Arkadan</td><td>Backward</td><td>İstersen anal pozisyonlar</td></tr>
        <tr><td>💦 Bitiş</td><td>Cumming</td><td>Zevk 80 → pozisyona uyan bitiş kendiliğinden gelir</td></tr>
        <tr><td>🤗 Sonrası</td><td>Foreplay</td><td>Sarılma; 🕰️ saat ilerledikçe Cum ve Süt toparlanır</td></tr></table>
      <p><b>Lia'nın anlık önerileri</b> sıradaki aşamanın önüne geçer:</p>
      <ul><li>💗 Uyarılma 55'i geçtiyse: bir Eat daha onu bitirir.</li>
        <li>🥴 Zevk 60'ı geçtiyse: uzatmak istersen Holding / Cock Ring.</li>
        <li>Önden ya da arkadan geçmeden: korunma yoksa Condom (Nothing'e izin veriyorsa önermez).</li>
        <li>Onun orgazmından ya da senin bitişinden sonra: sarılma ve dinlenme.</li></ul>
      <p>Tempo için Mode olaylarını (Gentle → Passionate → Rough) araya serpiştirebilirsin.</p>` },
    { icon: '🤖', title: 'Bot modu: karakter nasıl cevap verir', sub: 'olaylar, komutlar, sorular, durumlar', body: `
      <p>Bot modu her sohbette varsayılan açıktır (⋯ menüsünden kapatılır). Karakter senin mesajına ve yazdığın olaylara kurallardan (Ben → 💾 Veri → 🤖 Bot editörü) cevap verir.</p>
      <ul><li><b>Olaylara</b>: olayın adına, etiketine ve kategorisine göre. Zincirde boşalma ya da onun orgazmı varsa ona cevap verir; boşalmada pozisyona ve 💧 döl miktarına, orgazmda 💦 Woter / Milk şiddetine göre. Cumming Size ve Lactation olaylarının her birinin elle yazıldığında da kendi cevabı var.</li>
        <li><b>Özelliklerine göre</b>: Pussy / Anal / Boob / Butt Size ve Experience cevabı değiştirir; ❤️ sevdiği olayda daha zevkli, 💔 sevmediğinde isteksizdir.</li>
        <li><b>🗣️ Komutlar</b>: "daha sert", "yavaş", "dön", "üstüme gel", "gel buraya", "beni öp", "sarıl", "ağzına al", "bacaklarını aç", "arkadan", "soyun", "yüzüme otur", "memelerinle", "aç memeni", "kalçanı göster / kaldır", "diz çök", "ağzını aç", "yat", "içine girmek istiyorum", "memenin arasına sokmak istiyorum" → cevap verir ve uygun olay kendiliğinden olur (🚫 izin vermediği seçilmez, ❤️ sevdiği öne çıkar).</li>
        <li><b>❓ Sorular</b>: "memelerin kaç beden", "dar mısın", "arkan dar mı", "kalçan kaç beden", "daha önce hiç yaptın mı", "bakire misin", "ne seversin", "neyi sevmezsin", "korunuyor musun", "hamile misin", "kaç yaşındasın", "nerelisin" → kendi bilgileriyle. Ayrıca: en sevdiğin pozisyon, fantezin, nereye boşalayım (korunmasına göre), beni seviyor musun / güveniyor musun / özledin mi / evlenir misin (Aşk, Güven), kıskanır mısın, sevgilin var mı, bebek ister misin, hamile kalırsan, sütün var mı, ıslandın mı, sert mi yavaş mı, ilk seferin, kaç kişiyle oldun, seks / anal / oral sever misin, kondom, hap, en hassas yerin, burcun, mesleğin, ne giyiyorsun, kaç kez geldin / boşaldım (bu sohbette), adın ne, dokunabilir miyim, en çok neyimi seviyorsun, canın ne istiyor, "içine gireyim, dışarı boşalırım" (korunmasına göre), kondomsuz olur mu, benden iyisi oldu mu, boyutun ("18 santim…": sayıyı okur, darlığına ve deneyimine göre cevaplar, hatırlar), en son ne zaman, kaç kez gelebilirsin, yutar mısın, yüzüne boşalsam, hamile bırakayım mı, arkadan girebilir miyim, nerede yapmak istersin, mastürbasyon, oyuncak, bağlanma, tahrik ediyor muyum, nasıldı. Aynı soru farklı söylenişlerle ve Türkçe karakter olmadan da tanınır. 🤝 Güven 15 ve altındaysa özel sorulara kaçamak cevap verir; kişiliğine göre cevabı çerçeveler (Utangaç "S-söylemem gerekiyor mu? 🙈 …", Kibirli "… kıskandın mı? 💅"). Cevaptan sonra bazen karşı soru sorar ("Peki sen beni seviyor musun? 🥺"); evet / hayır'ın dinlenir.</li></ul>
      <p><b>📊 Ek baloncuk</b> (bir tane, öncelik sırasıyla): bitişte hamile kaldı / kondom korudu / hap / "hani çıkaracaktın" · aşama geçişi ("Artık hazırım… gir içime") · ilk kez / yine / hep bunu · önden pozisyonda Zevk 50+ iken korunmasına göre ("çıkar dışarı boşal", "merak etme hap alırım") · senin Zevk / Cum / Cumming sayın · onun Uyarılma 60+, 3+ orgazm, süt, Şehvet 80+ · 💞 ilişki · hamileyse.</p>
      <p><b>💞 İlişki</b>: karakterin ❤️ Aşk (40+ "sana karşı bir şeyler hissediyorum", 70+ "seni seviyorum"), 🤝 Güven (15 ve altı "sana güvenebilir miyim?", 70+ "sana tamamen güveniyorum"), 🫂 Samimiyet 60+ ve 😤 Kıskançlık 60+ değerleri. Normal sohbet mesajlarında en önde gelir. Pozisyonlar Samimiyet ve Güven'i +1, Foreplay ayrıca Aşk'ı +2, onun orgazmı Aşk'ı +5 artırır; 💔 sevmediği olay Güven −3, Aşk −1; Kıskançlık saatte −2 söner.</p>
      <p><b>🔁 Tekrar yok</b>: bir kuralın son seçilen cevapları (en fazla 10) bir daha seçilmez.</p>
      <p><b>❔ "Beğendin mi?"</b>: sevişirken karakter onay sorar ("Böyle iyi mi?", "Hoşuna gidiyor mu?"); "evet / çok / harika / devam…" dersen aynı pozisyonla devam edilir, "hayır / beğenmedim / başka…" dersen başka bir pozisyona (önce ❤️ sevdiklerine) geçilir.</p>
      <p><b>🧪 Bot deneyi</b> (ayrı sayfa: Ben → ❓ Yardım → Deney sayfasına git): kendi deney karakterini kur (şablondan, 🎲 rastgele ya da boş; özellikler, ❤️ / 💔, ✅ / 🚫, değerler); 💬 bir mesaj yaz, 📜 bir olay seç (boşalmada pozisyonu da) ya da 📊 bir durum seç. Uyan bütün kurallar puanıyla, 🏆 kazananı ve o karakter için doldurulmuş bütün cevaplarıyla listelenir; ❤️ sever / 💔 sevmez ile o yolları da görürsün. Sohbete bir şey yazılmaz.</p>
      <p><b>❔ Karakterin soruları</b>: olaydan sonra bazen soru sorar ("Daha sert mi istiyorsun?", "Devam edelim mi?", "Ağzıma almamı ister misin?", "Arkadan denemek ister misin?", "Beni yalar mısın?", "İçime mi boşalacaksın?", bitişten sonra "Bir daha mı?"). Sonraki mesajın "evet / tamam / hadi…" ya da "hayır / istemem / olmaz…" ise ona göre cevap verir ve uygun olay olur (ör. evet → Rough, hayır → Gentle). "İçime mi?" sorusunun cevabı korunmasına göre değişir.</p>
      <p><b>💐 İltifat / 💢 kabalık</b>: "güzelsin, harikasın, tatlısın…" → ❤️ Aşk +2, 🫂 Samimiyet +1; "seni seviyorum" → Aşk +3; kaba söz → 🤝 Güven −3, Aşk −1 (Sebep-Sonuç → 🤖'den değiştirilir).</p>
      <p><b>💬 Hitap</b>: <code>{sen}</code> Aşk'a göre değişir: 30'un altında adın, 30–69 adın / canım / tatlım, 70+ aşkım / bebeğim. Soğuk ve Resmi konuşur karakterler hep adınla seslenir; adın için <code>{ad}</code>.</p>
      <p><b>🕰️ Saat</b>: normal sohbette gece (22–04) "gece yarısı konuşmaları en güzeli", sabah (05–10) "günaydın… dün gece harikaydı", akşam (18–21) selamı; sevişirken 01–05 arası "uykum geldi ama durma".</p>
      <p><b>🎭 Kişilik ve ⌨️ yazım tarzı</b>: kişilik cevaba bazen kendi ekini yapar (Flörtöz 😘, Kibirli "tabii ki 💅", Çocuksu "hihi 🙈", Gizemli "…belki 🤫"…); iltifat, "seni seviyorum" ve kabalığa kişiliğe göre ayrı cevaplar vardır. Utangaç, Flörtöz, Romantik, Soğuk, Kibirli, Alaycı, Neşeli, Duygusal, Çocuksu, Şımarık, Asi ve Özgüvenli karakterlerin sevişirken, boşalınca, orgazm olunca, hamileyken ve korunma anlarında kendi konuşmaları var ("🎭 Kişilik" kuralları; olaylarda yarı yarıya, durumlarda çoğu zaman öne geçer). Yazım tarzı her cevabı dönüştürür: hep küçük harf, emoji kullanmaz (Soğuk da), emoji sever, harf uzatır, noktalama kullanmaz, çok güler (sjsjsj), kısa yazar (tek baloncuk), argo, sesli mesaj 🎤, geç cevap verir (daha uzun "yazıyor…").</p>
      <p><b>🎭 Ton</b>: son Mode (Gentle 💕 … Brutal "*soluk soluğa*") ve son 30 mesajdaki fanteziler (Cat Girl "miyav", Bondage "*ellerim bağlı*", Cheating "*fısıldayarak*") cevaplara eklenir.</p>
      <p><b>🦄 Fanteziler</b> (🏷️ <code>fantesy</code> kategorisi): her fantezinin kendi cevapları var; fantezi son 30 mesajda olduysa pozisyonlar, ön sevişme ve boşalma çoğu zaman o fanteziyle cevaplanır (Doggy Girl + arkadan "Dört ayak üstünde, efendim"), kişiliğe göre de değişir. Rastgele karakterde ❤️ / 💔 listelerine en fazla 2 fantezi girer.</p>
      <p>Cevaplarda yer tutucular: <code>{sen}</code> <code>{ben}</code> <code>{ö:Boob Size}</code> <code>{sever}</code> <code>{sevmez}</code> <code>{izin}</code> <code>{izinyok}</code> <code>{olay}</code> <code>{cevap:yaş}</code> <code>{cevap:şehir}</code> <code>{cevap:hamile}</code>.</p>` },
    { icon: '🧭', title: 'Bir seans, baştan sona', sub: 'tetiklenmeler nasıl zincirlenir', body: `
      <ol><li>Saat 22:00. <code>#kissing</code> → 💋 Foreplay: ❤️ Aşk +5, 🫂 Samimiyet +4, 🥴 Zevk sadece +1–3 (öpüşerek boşalınmaz).</li>
        <li><code>#cunnilingus</code> → 💗 Uyarılma 25, 🔥 Şehvet 10; senin 🥴 Zevk'in +8.</li>
        <li>Birkaç Eat daha → Uyarılma 80'i geçer → ⚡ <b>Orgazm</b> → Şehvet 40 → <b>Low-volume Woter</b>; Hamile değilse süt yok.</li>
        <li>🥴 Zevk <b>boşalma isteğidir</b>, 💦 Cum <b>ne kadar boşalabileceğin</b>: Zevk yükseldikçe "boşal" der, Cum doluysa "çok birikmiş" der.</li>
        <li>Pozisyonlar Zevk +8 → yaklaşık 10 pozisyonda <code>#rough anal</code> 80'i geçer → ⚡ 🎯 <b>Anal Creampie</b> (anal etiketi) → Zevk −100.</li>
        <li>Anal Creampie 🏷️ boşalma → 💦 Cum 100 → <b>High Sperm</b>, 🔁 sayı 0 → <b>Hyper-concentrated</b>; sonra Cum düşer, sayı 1 olur.</li>
        <li>Saat ilerler; her saat başı Cum +10, sayı −1, Süt +5, Şehvet −5.</li>
        <li>Hemen ikinci tur: Cum düşük → Low-volume; sayı 1 → Polyzoospermia.</li></ol>
      <p>Bir şey tetiklenmiyorsa bak: değer gerçekten artıyor mu (barlar), eşik doğru parametrede mi, olayın etiketi var mı, 🔒 şart tutuyor mu?</p>` },
    { icon: '💌', title: 'Örnek mesajlaşmalar', sub: 'bot modunda neye nasıl cevap gelir', body: `
      <p>Aşağıdaki sohbetler bot modu açıkken gerçekten olabilecek akışlar. Cevaplar havuzdan rastgele seçilir; senin sohbetinde başka cümleler gelebilir.</p>
      ${bkChat('🍒 Soru sormak', [['me', 'memelerin kaç beden?'], ['her', '95… elin yeter mi bakalım? 😏🍒'], ['note', 'Boob Size: 95 olan bir karakter. 🤝 Güven 15 ve altındaysa kaçamak cevap verirdi.'], ['me', 'memeni emebilir miyim'], ['her', 'İkisine birden yetişebilecek misin? 😏🍒'], ['her', 'Peki sen benim neyimi seviyorsun? 👀'], ['note', 'Cevaptan sonra bazen karşı soru sorar; "evet / hayır"ın dinlenir.']])}
      ${bkChat('🗣️ Komut vermek', [['me', 'dön'], ['ev', '📜 🍑 Doggy'], ['her', 'Kalçamı kaldırdım, gel 😈'], ['note', 'Komut uygun olayı kendiliğinden yazar; 🚫 izin vermediği seçilmez, ❤️ sevdiği öne çıkar.']])}
      ${bkChat('💋 Isınma → onun orgazmı', [['ev', '📜 💋 Kissing'], ['her', 'Dudakların çok yumuşak 💗'], ['note', 'Foreplay ❤️ Aşk +5, 🫂 Samimiyet +4 verir; 🥴 Zevk sadece +1–3.'], ['ev', '📜 👅 Cunnilingus'], ['ev', '📜 💗 Orgazm · Normal Woter'], ['her', 'Ahhh! Geliyorum… geldim… 😵‍💫💦'], ['note', '💗 Uyarılma 80\'i geçti → Orgazm; 🔥 Şehvet\'e göre Woter.']])}
      ${bkChat('❔ Onay sorusu', [['ev', '📜 ❤️ Missionary'], ['her', 'Üstümde ağırlığını hissetmek çok güzel 💗'], ['her', 'Böyle iyi mi? 🥺'], ['me', 'evet çok'], ['ev', '📜 ❤️ Missionary'], ['note', '"Evet" → aynı pozisyonla devam; "hayır / başka" → önce ❤️ sevdiklerinden başka bir pozisyon.']])}
      ${bkChat('💦 Bitiş ve korunma', [['note', 'Pull-Out Method\'a ✅ izin veren karakter, 🥴 Zevk 50\'yi geçince:'], ['her', 'Hadi çıkar dışarı boşal… sakın içime 😳'], ['ev', '📜 💦 Vaginal Creampie · Thick White Cumming'], ['her', 'Gözlerimin içine bakarak içime boşaldın 😩💦'], ['her', 'Hani çıkaracaktın?! 😳'], ['note', 'Pozisyona göre bitiş cümlesi, 💦 Cum\'a göre döl miktarı, korunmasına göre ek baloncuk.']])}
      ${bkChat('🦄 Fantezi', [['ev', '📜 🐱 Cat Girl'], ['her', 'Miyav… bugün senin kedinim 🐱'], ['ev', '📜 🍑 Doggy'], ['her', 'Kuyruğumu kaldırdım, miyav 😼'], ['note', 'Fantezi son 30 mesajda olduysa pozisyonlar o fanteziyle cevaplanır.']])}
      ${bkChat('🎭 Rol yapma', [['ev', '📜 👩‍🏫 Kadın Hoca – Öğrenci (Üniversite)'], ['her', 'Öğrencim, ofis saatimde ne işin var? 😏🎓'], ['ev', '📜 ❤️ Cowgirl'], ['her', 'Öğrencim… Gözlerime bak, kim hoca kim öğrenci? 😈'], ['note', 'Rol sürerken sana rolüne göre hitap eder: Patronum, Hocam, Memur bey, Öğrencim…']])}
      ${bkChat('🎭 Kişilik farkı', [['me', 'güzelsin'], ['her', 'G-gerçekten mi? 🙈💗'], ['note', 'Utangaç bir karakter. Kibirli olsaydı:'], ['her', 'Biliyorum 💅 ama söylemen hoş'], ['note', 'İltifat ❤️ Aşk +2, 🫂 Samimiyet +1; kabalık 🤝 Güven −3.']])}
      <p>Devamı bir sonraki sayfada. Kendi denemelerin için Ben → ❓ Yardım → 🧪 <b>Bot deneyi</b>: deney karakterini kur, mesajı yaz, bütün olası cevapları gör.</p>` },
    { icon: '💬', title: 'Daha çok örnek', sub: 'sorular, ilişki, hamilelik, roller', body: `
      <p>Aynı karakter, farklı anlar. Her örnekte cevabı neyin seçtirdiği ✒️ notunda yazıyor.</p>
      ${bkChat('📏 Boyut sormak', [['me', '18 santim aletim var, hoşuna gider mi?'], ['her', '18 santim… ben çok darım, ikiye bölersin beni 😩'], ['note', 'Pussy Size: Tight. Sayıyı mesajdan okur ve hatırlar.'], ['me', 'kaç santim seversin'], ['her', '14-16 santim bana fazlasıyla yeter, darım 😳 Seninki 18, beni zorlar 😩']])}
      ${bkChat('🛡️ Kondomsuz olur mu?', [['me', 'kondom takmasak olur mu ya'], ['her', 'Hap içiyorum, olur 😏'], ['note', 'Control Pill\'e ✅ izin veriyor. Pull-Out\'a izin verseydi: "Olur ama dışarı boşalacaksın 😳"; hiçbirine vermeseydi: "Olmaz, kondomsuz asla 😣".']])}
      ${bkChat('🍼 Süt', [['me', 'sütün var mı?'], ['her', 'Göğüslerim taşıyor, sütüm var 🍼🥵'], ['me', 'sütünü içmek istiyorum'], ['her', 'Em de akıtayım ağzına 🥵🍼'], ['note', '🔘 Hamile ve 🍼 Süt 70. Hamile değilse: "Önce hamile bırakman lazım 😏🍼".']])}
      ${bkChat('🍑 Kalça', [['me', 'kalçanı yalamak istiyorum'], ['her', 'Kalçamı yala ama içeri yok 😣'], ['note', 'Anal\'i 💔 sevmiyor. Seviyor olsaydı: "Deliğimi yala, hazırla beni 🥵".']])}
      ${bkChat('💞 İlişki ilerledikçe', [['me', 'beni seviyor musun?'], ['her', 'Henüz bilmiyorum… 🤔'], ['note', '❤️ Aşk 10. Birkaç Foreplay ve iltifattan sonra Aşk 75:'], ['me', 'beni seviyor musun?'], ['her', 'Deli gibi seviyorum 💞'], ['note', 'Hitap da değişir: Aşk 70+ iken {sen} → "aşkım", "bebeğim".']])}
      ${bkChat('🔒 Güven düşükken', [['me', 'memelerin kaç beden'], ['her', 'Bunu sana söylemek için biraz erken 😏'], ['note', '🤝 Güven 15 ve altı: özel sorulara kaçamak cevap. Güven yükselince açıkça söyler.']])}
      ${bkChat('❔ Karakterin sorusu', [['ev', '📜 🍑 Doggy'], ['her', 'Arkadan çok derinsin 🥵'], ['her', 'Daha sert mi istiyorsun? 😈'], ['me', 'evet'], ['ev', '📜 💥 Rough'], ['her', 'Hırpala beni 🔥'], ['note', '"Hayır" deseydin 💥 Gentle olurdu.']])}
      ${bkChat('🤰 Hamile kaldı', [['ev', '📜 💦 Vaginal Creampie'], ['ev', '🎲 Sonuç · Ayla hamile kaldı · 🔘 Hamile: Evet'], ['her', 'Yoğun spermin yumurtama girdi sonunda… 🥺💗'], ['note', 'Korunması yoksa ve 🚫 Condom olmadıysa; yüzde 🌱 doğurganlığa göre.']])}
      ${bkChat('🔥 Zevk ve Cum', [['note', '🥴 Zevk 75, 💦 Cum 95:'], ['her', 'Boşalmak üzeresin ve çok dolusun… hepsini ver 🥵💦'], ['note', 'Zevk = boşalma isteği, Cum = ne kadar boşalabileceğin. Cum 15 olsaydı:'], ['her', 'Bu kadar istiyorsun ama sende pek bir şey kalmadı 😏']])}
      ${bkChat('💼 Patron – Sekreter', [['ev', '📜 💼 Patron – Sekreter'], ['her', 'Patronum, mesai bitti ama… işim bitmedi 😏💼'], ['ev', '📜 ❤️ Ondesk'], ['her', 'Patronum… Masanıza bastırın beni 🥵'], ['ev', '📜 💦 Vaginal Creampie'], ['her', 'Bonusumu aldım 😈💼']])}
      ${bkChat('🕰️ Saat', [['note', 'Sohbet saati 02:30, sevişirken:'], ['her', 'Uykum geldi ama… durma 🥱😩'], ['note', 'Normal sohbette 07:00 olsaydı: "Dün gece harikaydı… günaydın ☀️💗".']])}
      ${bkChat('👥 Grup sohbeti', [['me', 'azgın mısın?'], ['her', 'Sırılsıklamım 😩'], ['note', 'Cevap 💗 Uyarılma ve 🔥 Şehvet\'e göre. Grupta mesaja en yüksek puanlı kuralı tutan üye cevap verir; eşitse rastgele biri.']])}` },
    { icon: '🎯', title: 'Puan sistemi', sub: 'hangi cevap neden kazanır', body: `
      <p>Bir mesaja birden çok kural uyabilir. Kazananı <b>puan</b> belirler: puan, kuralın ne kadar özel olduğudur; biriktirilmez, tek mesaj yeter.</p>
      <table class="bk-t"><tr><th>Kuralda</th><th>Puan</th></tr>
        <tr><td>Her kelime şartı</td><td>+100</td></tr>
        <tr><td>Her özellik şartı (Utangaç, Boob Size: 95…)</td><td>+10</td></tr>
        <tr><td>Belirli karaktere bağlı</td><td>+20</td></tr>
        <tr><td>🔓 Kelimeler başka sırada</td><td>−30</td></tr>
        <tr><td>🔓 3+ kelimelik kuralda bir kelime eksik</td><td>eksik kelime sayılmaz, −60</td></tr></table>
      <p>Örnek: <code>meme · beden</code> (200) ile <code>meme · beden</code> + <i>Boob Size: 95</i> (210) aynı mesaja uyar; karakterin göğsü 95 ise 210 kazanır, değilse o kural hiç uymaz. En yüksek puanlılar eşitse aralarından <b>rastgele</b> biri seçilir.</p>
      ${bkChat('🎯 Sohbette puanı görmek', [['me', 'boşalayım mı içine'], ['her', 'İçime… hepsini istiyorum 🥵<br><small>🎯 Nereye boşalayım · 170 puan · 🔓 gevşek</small>'], ['note', 'Kuralın sırası "içine … boşal"; sen tersini yazdın → 200 − 30 = 170. Hiçbir kural tutmasaydı "yedek" yazardı.']])}
      <p><b>🎯 Bot puanları</b>: ⋯ Diğer → 🎯 ile açılır; her bot cevabının ilk baloncuğunun altında kazanan kuralın adı ve puanı görünür.</p>
      <p><b>Sıra</b>: puan yarışından önce bazı yollar öne geçer:</p>
      <ol><li>Karakter bir soru sorduysa ve sen <b>evet / hayır</b> dediysen önce o sorunun cevap kuralları.</li>
        <li>Olayı <b>❤️ seviyor / 💔 sevmiyorsa</b> önce sever / sevmez kuralları.</li>
        <li>Yarı yarıya <b>🎭 kişilik</b> kuralları (Utangaç, Kibirli…).</li>
        <li>Sonra bütün kurallar arasında en yüksek puan.</li>
        <li>Hiçbiri tutmazsa <b>yedek cevap</b> (olaylarda yedek yoktur, karakter sessiz kalır).</li></ol>
      <p><b>🔓 Gevşek eşleşme</b> sadece senin yazdığın mesajlarda geçerlidir; olaylar ve durumlar kesin eşleşir. Tam tutan bir kural varsa genelde o kazanır.</p>
      <p><b>Olaylarda</b> karaktere giden metin şuna benzer: <code>evt anal Backward Rough Anal fant fxkopek poz …</code>. Bu yüzden "Doggy Girl + arkadan" kuralı (4 kelime, 400) düz "arkadan" kuralını (2–3 kelime) geçer; fantezi anahtarı (<code>fxkopek</code>) pozisyon adlarına karışmasın diye özel yazılır.</p>
      <p>🧪 <b>Bot deneyi</b> sayfası her kuralı puanıyla, gruplarına ayrılmış hâlde (❤️/💔, 🎭 kişilik, normal, 🔓 gevşek) ve 🏆 kazananla gösterir.</p>` },
    { icon: '🌗', title: 'Yeni dinamikler', sub: 'acı, döngü, hamilelik, kesintiler, mekan', body: `
      <p><b>😣 Acı</b> karakterin bir değeri (📊 kartta). Dar karakterde büyük boyut (söylediğin santim 18+), anal, Virgo ve Rough / Brutal Mode artırır; Gentle, Foreplay ve Eat azaltır; her saat başı −10. Acı 30'u geçince "biraz yavaş…", 60'ı geçince "dur, acıtıyor 😣" der.</p>
      <p><b>🩸 Döngü takvimi</b>: her karakterin 28 günlük döngüsü 🕰️ sohbet saatiyle ilerler. 1–5 regl (doğurganlık ×0,15), 11–16 <b>riskli gün</b> (×1,8). 📊 kartta "🔥 13. gün · riskli gün" görünür; riskli günde korunmasız önden pozisyonda karakter uyarır, Lia da hatırlatır.</p>
      <p><b>🤰 Hamilelik zaman çizelgesi</b>: hamile kalınca haftalar sayılır (bir hafta = 2 saat sohbet zamanı). 12. haftadan sonra 🍼 Süt her hafta artar; 13. ve 27. haftada üç ay geçişi, 40. haftada 👶 doğum olur. Cevaplar üç aya göre değişir.</p>
      <p><b>📱 Rastgele kesintiler</b>: pozisyondan sonra bazen telefon çalar, kapı çalınır, komşu duvara vurur, mesaj gelir (%6). Cheating fantezisi sürüyorsa daha sık (%22) ve "Sevgilim arıyor", "biri eve geliyor!" gibi yakalanma anları gelir. Karakter ona göre panikler ya da güler.</p>
      <p><b>📍 Mekan</b>: son mekan kartına göre (🚗 araba, 🚿 duş, 🎬 sinema, ☕ kafe…) bazı pozisyonlar olmaz ("Arabada ayağa kalkacak yer yok") ve karakter mekana özel konuşur. Lia o mekanda olamayacakları önermez.</p>
      <p><b>👗 Giyim</b>: karakterin "genelde giydikleri" (üst, alt, elbise, sütyen, tanga / külot, çorap / jartiyer; günlük ve 🔥 iddialı) Oluştur'da rastgele gelir. Profil → 👗 Giyim ya da sohbetteki 📊 kartta 👗 çipiyle istediğin gibi giydirirsin. Karakter giydiğine göre konuşur: "ne giyiyorsun?" sorusuna, Show Tits / Show Ass'te ("Gömleğimin üst düğmelerini açtım…"), ilk sevişmede soyunurken ("Mini eteğimi belime kadar sıyırdım"), "sütyenini çıkar", "tanga mı giydin" gibi mesajlarda.</p>
      <p><b>🎼 Moda göre müzik</b>: Mode olayı olunca uygun parça çalar (Gentle → Pembe Rüya, Rough → Tutku…). <b>🔔 Efekt sesleri</b>: eşleşme, orgazm, hamilelik ve doğumda kısa sesler. İkisi de ⋯ Diğer'den kapatılır.</p>
      <p><b>👆 Uzun bas</b>: olay kartında 🔁 bir daha / 📌 kısayola sabitle / ✏️ düzenle; karakterin avatarında profil, 📔 günlük, 🧬 klonla, 📤 paylaş; diğer mesajlarda hızlı tepki.</p>
      <p><b>📭 Eksik cevaplar</b>: bot modunda karakterin anlamadığı mesajlar 🧪 Bot deneyinde listelenir; en çok tekrarlananı yazarak başla.</p>
      <p><b>🔒 Kilit ve 🙈 Patron geldi</b>: Ben → ⚙️ Ayarlar'dan PIN (varsa yüz / parmak izi) kilidi; 🙈 düğmesi ya da <code>Esc</code> iki kez tek dokunuşla masum bir hesap makinesi ekranı açar, geri dönmek için "=" tuşuna uzun bas.</p>` },
    { icon: '🌐', title: 'Sohbetin dışındaki dünya', sub: 'İnternet siteleri sohbete nasıl bağlanır', body: `
      <p>Ana sayfadaki <b>🌐 İnternet</b> kartı dokuz site açar. Siteler sohbetin yerine geçmez, sohbeti besler:</p>
      <ul><li><b>Yeni sohbet açanlar</b>: 🌹 Carmen.com (Mesaj at), 🏨 CarmenStay (rezervasyon: 📍 mekan + 🕰️ saat), 💼 CarmenJobs (mülakat + 🎭 rol), 🫦 Fans ve 🎥 Live (sexting, özel yayın), 🍿 CarmenFlix (💬 Rolü oyna). İlk mesajı hep karakter atar.</li>
        <li><b>⚡ kısayola olay ekleyenler</b>: 🛍️ CarmenShop oyuncakları (kargo gelince) ve CarmenJobs rol olayı.</li>
        <li><b>👗 Gardırop</b>: Shop'tan iç çamaşırı / kostüm, Fans foto setleri, Live'da kostüm bahşişi.</li>
        <li><b>📊 Değerler</b>: Live bahşişleri ❤️ Aşk ve 🔥 Şehvet.</li>
        <li><b>Görünür yapan</b>: 🩺 CarmenKlinik döngü ve hamilelik zamanını gösterir.</li></ul>
      <p>Ayrıntılar 🌐 <b>İnternet Kitabı</b>'nda.</p>` },
    { icon: '💾', title: 'Kayıt ve kurulumlar', sub: 'sistem dosyası, cihazlar', body: `
      <p>Verilerin bu tarayıcıda saklanır. <b>Sistem kaydı</b> (Ben → 💾 Veri) açıkken ve uygulama <code>yerel-duzenleme.bat</code> ile açıldığında olaylar, sonuçlar, eşikler, saat, 🎚️ kurallar <code>js/data/system.js</code>'e yazılır; diğer cihazlar oradan alır.</p>
      <p>Pozisyon etiketleri, Cumming ve orgazm düzenleri uygulama açılınca <b>bir kez</b> kuruldu; var olan hiçbir şeyi silmez. Sonradan değiştirdiklerin korunur, sildiğin bir etiket geri gelmez. Listedeki adla yeni bir olay eklersen (ör. Mouth Cumming) etiketi kendiliğinden verilir.</p>` }
  ];
  /* 💞 seans türleri: sıra (olay adları; boşalma ve orgazm kendiliğinden gelir) */
  const SEANS_TYPES = [
    { id: 'romantik', icon: '🌹', name: 'Romantik ve yavaş', desc: 'Uzun ısınma, göz göze pozisyonlar, bol sarılma. ❤️ Aşk ve 🫂 Samimiyet en çok bu seansta artar; Acı neredeyse hiç olmaz.', seq: ['Kissing', 'Front Hugging', 'Gentle', 'Lap Kissing', 'Cunnilingus', 'Condom', 'Missionary', 'Spooning', 'Lap Sex', 'Cowgirl', 'Missionary', 'Full Nelson', 'Spooning', 'Missionary', 'Back Hugging'], tip: 'Ondesk ya da Full Nelson ile bitirirsen boşalma daha derinden gelir.' },
    { id: 'tutkulu', icon: '🔥', name: 'Tutkulu', desc: 'Hızlı ısınma, Passionate mod, karşılıklı oral, sonra pozisyonlar hızla değişir.', seq: ['Kissing', 'Show Tits', 'Passionate', 'Blowjob', 'Cunnilingus', 'Facesitting', 'Condom', 'Cowgirl', 'Missionary', 'Doggy', 'Standing', 'Standing doggy', 'Ondesk', 'Missionary', 'Back Hugging'], tip: 'Cowgirl\'den Missionary\'ye yuvarlanarak geçmek akışı bozmaz.' },
    { id: 'sert', icon: '⚡', name: 'Sert ve vahşi', desc: 'Rough / Brutal mod, arkadan ve ayakta pozisyonlar. Dar karakterde 😣 Acı yükselir: arada Gentle düşün.', seq: ['Kissing', 'Show Ass', 'Passionate', 'Deepthroat', 'Cunnilingus', 'Condom', 'Rough', 'Doggy', 'Standing doggy', 'Standing', 'Full Nelson', 'Ondesk', 'Missionary', 'Doggy', 'Standing', 'Back Hugging'], tip: 'Kişiliği Utangaç ya da Güvensiz ise önce Passionate ile başla.' },
    { id: 'oral', icon: '👅', name: 'Oral ağırlıklı', desc: 'Neredeyse hiç penetrasyon yok; ağız, dil ve el. Bitiş genelde Oral Creampie / Mouth Cumming olur.', seq: ['Kissing', 'Show Tits', 'Handjob', 'Blowjob', 'Cunnilingus', '69', 'Titfuck', 'Facesitting', 'Deepthroat', 'Oral Sex', 'Squirt', 'Blowjob', 'Deepthroat', 'Front Hugging'], tip: 'Eat olayları onun Uyarılma\'sını hızla 80\'e taşır; önce onu getir.' },
    { id: 'anal', icon: '🍑', name: 'Anal seansı', desc: 'Uzun hazırlık şart: ısınma, onu ısıtma, Gentle. Önce yan ve üstte pozisyonlar, sert olanlar en son.', seq: ['Kissing', 'Front Hugging', 'Gentle', 'Cunnilingus', 'Facesitting', 'Show Ass', 'Spooning Anal', 'Cowgirl Anal', 'Standing Anal', 'Standing doggy', 'Spooning Anal', 'Cowgirl Anal', 'Rough Anal', 'Standing Anal', 'Back Hugging'], tip: 'Anal\'den sonra önden\'e geçme; önden yapacaksan önce yap.' },
    { id: 'onu', icon: '💗', name: 'Onu memnun et', desc: 'Önce onun orgazmı (hatta iki kez), sonra sen. 🔥 Şehvet birikir, ikinci orgazmı daha güçlü gelir (Squirt Woter).', seq: ['Kissing', 'Lap Kissing', 'Cunnilingus', 'Facesitting', 'Front Hugging', 'On Mouth', 'Squirt', 'Condom', 'Missionary', 'Cowgirl', 'Lap Sex', 'Missionary', 'Spooning', 'Doggy', 'Back Hugging'], tip: 'İki Eat arasında bir sarılma koymak Aşk\'ı da artırır.' },
    { id: 'fantezi', icon: '🐱', name: 'Fantezi gecesi', desc: 'Fanteziyi başa koy: karakter kostümünü giyer ve bütün pozisyonları o fantezinin ağzından cevaplar.', seq: ['Cat Girl', 'Kissing', 'Show Ass', 'Blowjob', 'Cunnilingus', 'Condom', 'Doggy', 'Cowgirl', 'Missionary', 'Spooning', 'Doggy', 'Standing doggy', 'Cowgirl', 'Missionary', 'Back Hugging'], tip: 'Sevdiği fanteziyi seç: daha hevesli konuşur.' },
    { id: 'rol', icon: '💼', name: 'Rol yapma: ofiste', desc: 'Patron – Sekreter: sekreter kombini (saten gömlek, deri kalem etek, jartiyer), masa ve ayakta pozisyonlar.', seq: ['Patron – Sekreter', 'Kissing', 'Show Tits', 'Blowjob', 'Cunnilingus', 'Condom', 'Ondesk', 'Standing', 'Doggy', 'Standing doggy', 'Missionary', 'Full Nelson', 'Ondesk', 'Blowjob', 'Front Hugging'], tip: 'Ofis mekan kartı seçersen karakter mekana göre de konuşur.' },
    { id: 'sabah', icon: '☀️', name: 'Sabah seksi', desc: 'Yarı uykulu, yan yana. Saat 05–10 arasıysa karakter "günaydın" diye başlar.', seq: ['Back Hugging', 'Kissing', 'Gentle', 'Cunnilingus', 'Condom', 'Spooning', 'Missionary', 'Spooning', 'Cowgirl', 'Lap Sex', 'Missionary', 'Spooning', 'Doggy', 'Missionary', 'Front Hugging'], tip: 'Gece seansından sonra Cum toparlanmış olur.' },
    { id: 'gizli', icon: '🐍', name: 'Gizli / yasak', desc: 'Cheating fantezisi: 📱 kesintiler %22 olur (sevgilisi arar, biri eve gelir). Hızlı ve sessiz pozisyonlar.', seq: ['Cheating', 'Kissing', 'Handjob', 'Blowjob', 'Cunnilingus', 'Condom', 'Standing', 'Doggy', 'Standing doggy', 'Ondesk', 'Standing', 'Doggy', 'Missionary', 'Standing doggy', 'Front Hugging'], tip: 'Kesinti geldiğinde bir sonraki pozisyonda karakter paniğini anlatır.' },
    { id: 'hizli', icon: '⏱️', name: 'Hızlı (quickie)', desc: 'Az ısınma, ayakta ve hızlı. Boşalma için yine de 10 civarı pozisyon gerekir; arka arkaya hızlı pozisyonlarla gelir.', seq: ['Kissing', 'Condom', 'Rough', 'Standing', 'Doggy', 'Standing doggy', 'Ondesk', 'Full Nelson', 'Doggy', 'Standing', 'Standing doggy', 'Missionary', 'Doggy'], tip: 'Bitirmek istiyorsan Rough ekle ya da sayıyı artır.' },
    { id: 'hamile', icon: '🤰', name: 'Hamileyken', desc: 'Karın büyüdükçe yan ve üstte pozisyonlar; göğüsler hassas, süt gelebilir.', seq: ['Gentle', 'Kissing', 'Show Tits', 'Cunnilingus', 'Spooning', 'Cowgirl', 'Lap Sex', 'Spooning', 'Cowgirl', 'Doggy', 'Spooning', 'Lap Sex', 'Cowgirl', 'Back Hugging'], tip: '3. üç ayda Missionary yerine Spooning.' }
  ];
  // 🔀 akıcı geçişler: pozisyon → iyi devam edenler (küçük harfle karşılaştırılır)
  const SEANS_FLOW = {
    'Kissing': { next: ['Lap Kissing', 'Front Hugging', 'Show Tits', 'Cunnilingus'], why: 'öpüşme her şeyi açar' },
    'Lap Kissing': { next: ['Lap Sex', 'Cowgirl', 'Show Tits'], why: 'zaten kucağında' },
    'Cowgirl': { next: ['Missionary', 'Cowgirl Anal', 'Lap Sex', 'Spooning'], why: 'üstünden alta yuvarlanırsınız' },
    'Missionary': { next: ['Full Nelson', 'Ondesk', 'Spooning', 'Cowgirl'], why: 'bacakları kaldırmak ya da yana dönmek yeter' },
    'Doggy': { next: ['Standing doggy', 'Rough Anal', 'Spooning', 'Standing'], why: 'arkasında kalırsın' },
    'Spooning': { next: ['Spooning Anal', 'Doggy', 'Missionary'], why: 'yan yatıştan kalçasını kaldırması yeter' },
    'Standing': { next: ['Standing doggy', 'Standing Anal', 'Ondesk'], why: 'ayakta kalırsınız' },
    'Lap Sex': { next: ['Cowgirl', 'Missionary'], why: 'kucaktan geriye yaslanma' },
    'Blowjob': { next: ['Deepthroat', '69', 'Titfuck'], why: 'ağız zaten orada' },
    'Titfuck': { next: ['Blowjob', 'Reverse Titfuck'], why: 'göğüslerden ağza bir eğilme' },
    'Cunnilingus': { next: ['Facesitting', 'Squirt', '69', 'Missionary'], why: 'onu ısıttın, ya devam ya içine' },
    'Full Nelson': { next: ['Ondesk', 'Missionary'], why: 'bacaklar zaten yukarıda' },
    'Handjob': { next: ['Blowjob', 'Titfuck'], why: 'elden ağza' },
    'Buttjob': { next: ['Hotdogging', 'Standing doggy', 'Doggy'], why: 'kalçasının üstünden arasına kaymak yeter' },
    'Hotdogging': { next: ['Doggy', 'Standing doggy', 'Spooning Anal'], why: 'zaten kalçalarının arasındasın' },
    'Reverse Titfuck': { next: ['69', 'Cowgirl', 'Titfuck'], why: 'ters üstünde; ağzına ya da kucağına bir kayma' }
  };
  const evByT = t => allEvents().find(e => e.title.toLocaleLowerCase('tr') === String(t).toLocaleLowerCase('tr'));
  // tasarımcı taslağı: S().seansDraft { ch, evs: [olay id] }, kayıtlılar S().seansSaved
  const seansDraft = () => (S().seansDraft = S().seansDraft || { ch: (chars()[0] || {}).id || '', evs: [] });
  function seansLoad(typeId) { const t = SEANS_TYPES.find(x => x.id === typeId); if (t) { seansDraft().evs = t.seq.map(evByT).filter(Boolean).map(e => e.id); save(); } }
  /* 💡 seansı değerlendir: Zevk / Uyarılma tahmini, ısınma, korunma, anal hazırlığı, sert başlangıç, tekrar, geçişler, karakterin sevdikleri.
   * Dönüş: { score 0–100, notes: [{ k: 'ok' | 'warn' | 'tip' | 'info', t }] } */
  function evalSeans(ids, ch) {
    const all = allEvents(), evs = ids.map(id => all.find(e => e.id === id)).filter(Boolean), low = s => String(s || '').toLocaleLowerCase('tr');
    const notes = [], add = (k, t) => notes.push({ k, t }), cat = e => low(catOfEv(e).label), tags = e => (e.tags || []).map(low);
    if (!evs.length) return { score: 0, notes: [{ k: 'info', t: 'Olay ekleyerek başla ya da bir seans türünden yükle.' }] };
    const isSex = e => isPosEv(e) && cat(e) !== 'foreplay', isVaj = e => tags(e).includes('vajinal'), isAnal = e => tags(e).includes('anal');
    const nFore = evs.filter(e => cat(e) === 'foreplay').length, firstSex = evs.findIndex(isSex);
    // ısınma
    if (!nFore) add('warn', 'Foreplay eksik kalmış: başa Kissing ya da sarılma ekle (❤️ Aşk +5, 🫂 Samimiyet +4). Isınmadan başlamak karakteri soğutur.');
    else if (firstSex >= 0 && !evs.slice(0, firstSex).some(e => cat(e) === 'foreplay')) add('warn', `Isınmadan ${evs[firstSex].title} ile başlamışsın; önüne bir Foreplay koy.`);
    else add('ok', `Isınma var (${nFore} Foreplay).`);
    const den = t => trEk(t, 'den');
    // Zevk: boşalma ne zaman, hangi pozisyonda
    let z = 0, climax = -1;
    evs.forEach((e, i) => { if (cat(e) === 'foreplay') z += 2; else if (isPosEv(e)) z += 8; if (climax < 0 && z >= 80) climax = i; });
    if (climax < 0) add('warn', `🥴 Zevk ~${z}: bu sırayla boşalma gelmez; ${Math.ceil((80 - z) / 8)} pozisyon daha ekle (ya da sohbette Rough ile hızlandır).`);
    else { const at = evs[climax], fin = POS_TAGS && Object.entries(POS_TAGS).find(([tg]) => tags(at).includes(tg)); add('ok', `🥴 Zevk ${climax + 1}. adımda (${at.title}) 80'i geçer → boşalma${fin ? ` (${fin[0]} bitiş)` : ''}.`); if (climax < evs.length - 3) add('info', `Boşalmadan sonra ${evs.length - climax - 1} adım daha var: ikinci tur Cum düşük olur, sona sarılma iyi gider.`); }
    // Uyarılma: onun orgazmı
    const EAT = { cunnilingus: 25, facesitting: 20, 'on mouth': 15, squirt: 40 };
    let u = 0; evs.forEach(e => { if (cat(e) === 'eat') u += EAT[low(e.title)] || 20; });
    if (!u) add('warn', 'Onu ısıtmamışsın: bir Eat ekle (Cunnilingus, Facesitting…). 💗 Uyarılma 80\'i geçince orgazm olur.');
    else if (u >= 80) add('ok', `💗 Uyarılma ~${u}: onun orgazmı gelir${u >= 160 ? ' (iki kez!)' : ''}.`);
    else add('tip', `💗 Uyarılma ~${u}: orgazm için ${u >= 55 ? 'bir Eat daha yeter' : 'iki Eat daha ekle'}.`);
    // korunma
    const fv = evs.findIndex(isVaj), prot = i => evs.slice(0, i).some(e => cat(e) === 'protection');
    if (fv >= 0 && ch && !(ch.fields || {}).hamile) {
      const okP = t => { const e = evByT(t); return e && (ch.allows || []).includes(e.id); };
      if (prot(fv)) add('ok', 'Önden pozisyondan önce korunma var.');
      else if (okP('control pill')) add('ok', 'Hap içiyor; korunma şart değil.');
      else if (okP('nothing')) add('info', 'Korunmasız istiyor (Nothing): hamile kalabilir.');
      else add('warn', `${den(evs[fv].title)} önce Condom ekle (karakter korunmuyor).`);
    }
    // anal
    const fa = evs.findIndex(isAnal);
    if (fa >= 0) {
      if (!evs.slice(0, fa).some(e => cat(e) === 'eat' || low(e.title) === 'gentle')) add('warn', `${den(evs[fa].title)} önce ısınma ve Gentle iyi olur; dar karakterde 😣 Acı artar.`);
      if (evs.slice(fa + 1).some(isVaj)) add('tip', 'Arkadan sonra önden\'e geçmek yerine önce önden, sonra arkadan daha iyi.');
    }
    // sert başlangıç, mod
    const rough = evs.findIndex(e => cat(e) === 'mode' && /rough|brutal/.test(low(e.title)));
    if (rough >= 0 && rough < 2) add('warn', 'Sert modla başlamak Acı\'yı artırır; önce Gentle ya da Passionate.');
    if (!evs.some(e => cat(e) === 'mode')) add('tip', 'Tempo için bir Mode ekle (Gentle → Passionate → Rough).');
    // tekrar ve çeşit
    evs.forEach((e, i) => { if (i && evs[i - 1].id === e.id) add('warn', `${e.title} arka arkaya iki kez.`); });
    const sex = evs.filter(isSex);
    if (sex.length >= 4 && new Set(sex.map(e => e.id)).size < 3) add('tip', 'Hep aynı pozisyonlar; çeşit ekle.');
    // geçişler
    let fl = 0;
    evs.forEach((e, i) => {
      // sadece pozisyondan pozisyona (önden / arkadan / dokunuş); en fazla 2 öneri
      const nx = evs[i + 1], f = nx && Object.entries(SEANS_FLOW).find(([k]) => low(k) === low(e.title));
      if (!f || fl >= 2 || !['forward', 'backward', 'outercourse'].includes(cat(nx)) || f[1].next.some(t => low(t) === low(nx.title))) return;
      const better = f[1].next.find(t => { const x = evByT(t); return x && ['forward', 'backward', 'outercourse'].includes(cat(x)); });
      if (better && low(better) !== low(nx.title)) { add('tip', `${den(e.title)} sonra ${nx.title} yerine ${better} daha akıcı olabilir (${f[1].why}).`); fl++; }
    });
    // kapanış, gereksiz bitiş olayları, fantezi yeri
    const last = evs[evs.length - 1];
    if (cat(last) !== 'foreplay') add('tip', 'Sonuna sarılma (Back Hugging / Front Hugging) ekle: Aşk ve Samimiyet artar.');
    if (evs.some(e => cat(e) === 'cumming' || low(e.title) === 'orgazm')) add('info', 'Cumming / Orgazm olaylarını eklemene gerek yok; değer sınırı geçince kendiliğinden gelir.');
    const ff = evs.findIndex(isFant);
    if (ff > 1) add('tip', `${evs[ff].title} fantezisini başa al: kostümünü giyer, sonraki pozisyonları o fantezinin ağzından cevaplar.`);
    else if (ff >= 0) add('ok', `${evs[ff].title} başta: kostüm ve ton seans boyunca sürer.`);
    // karaktere göre
    if (ch) {
      const hate = evs.filter(e => (ch.dislikes || []).includes(e.id)), likes = feelEvents(ch.likes || []).filter(e => !evs.includes(e));
      hate.forEach(e => add('warn', `${ch.name.split(' ')[0]} ${e.title} sevmiyor (🤝 Güven −3, ❤️ Aşk −1).`));
      if (likes.length) add('tip', `Sevdiği ${likes.slice(0, 2).map(e => e.title).join(' ve ')} yok; eklersen daha hevesli konuşur.`);
      const denied = evs.filter(e => (ch.denies || []).includes(e.id));
      denied.forEach(e => add('warn', `${e.title}: izin vermiyor (🚫).`));
      // her adım ~10 dakika: Acı saatte −10 söner (adım başı −2)
      let pain = 0, peak = 0; evs.forEach(e => { pain = Math.max(0, pain + painDelta(e, ch) - 2); peak = Math.max(peak, pain); });
      pain = peak;
      if (pain >= 60) add('warn', `😣 Acı ~${pain}: "dur, acıtıyor" der; araya Gentle ya da Foreplay koy.`);
    }
    const score = Math.max(0, Math.min(100, 100 - notes.filter(n => n.k === 'warn').length * 12 - notes.filter(n => n.k === 'tip').length * 4));
    return { score, notes };
  }
  // 🛠️ tasarımcı (Seans Kitabı'nın etkileşimli bölümü): sıra, ekleme, değerlendirme, kaydetme, ⚡ kısayollara koyma
  function seansDesigner(body) {
    const box = body.querySelector('.sn-designer');
    if (!box) return;
    const d = seansDraft(), all = allEvents(), cats = moCats().filter(c => (c.tags || []).includes(CHAT_TOP_TAG) || (c.tags || []).includes(PERM_TAG) || (c.tags || []).includes(FANT_TAG) || String(c.label).toLocaleLowerCase('tr') === 'mode').filter(c => poolOf(c).length);
    let curCat = ui.snCat || (cats[0] || {}).id;
    const draw = () => {
      const ch = byId(d.ch), r = evalSeans(d.evs, ch), evs = d.evs.map(id => all.find(e => e.id === id)).filter(Boolean), saved = S().seansSaved || [];
      const stars = '★★★★★'.slice(0, Math.round(r.score / 20)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r.score / 20));
      box.innerHTML = `<div class="sn-row"><select class="sn-ch">${chars().map(c => `<option value="${esc(c.id)}"${c.id === d.ch ? ' selected' : ''}>${esc(c.name)}</option>`).join('') || '<option value="">(karakter yok)</option>'}</select>
          <select class="sn-type-pick"><option value="">🗂️ Türden yükle…</option>${SEANS_TYPES.map(t => `<option value="${t.id}">${t.icon} ${esc(t.name)}</option>`).join('')}</select></div>
        <div class="sn-seqbox">${evs.length ? evs.map((e, i) => `<span class="sn-step${evCls(e)}"${evStyle(e)}><b>${i + 1}</b>${evEmo(e)}${esc(e.title)}${i ? `<button type="button" data-snup="${i}" title="Öne al">‹</button>` : ''}<button type="button" data-snrm="${i}" title="Çıkar">✕</button></span>`).join('<i class="sn-arr">›</i>') : '<small class="mo-empty">Henüz olay yok. Aşağıdan ekle ya da bir türden yükle.</small>'}</div>
        <div class="sn-cats">${cats.map(c => `<button type="button" data-sncat="${esc(c.id)}" class="${c.id === curCat ? 'on' : ''}">${c.icon || ''} ${esc(c.label)}</button>`).join('')}</div>
        <div class="sn-pool">${(cats.find(c => c.id === curCat) ? poolOf(cats.find(c => c.id === curCat)) : []).map(e => `<button type="button" class="mo-chip${evCls(e)}"${evStyle(e)} data-snadd="${esc(e.id)}">${evEmo(e)}${esc(e.title)}</button>`).join('')}</div>
        <div class="sn-eval"><div class="sn-score"><b>${r.score}</b><span>${stars}</span><small>Lia'nın puanı</small></div>
          <ul>${r.notes.map(n => `<li class="sn-${n.k}">${{ ok: '✅', warn: '⚠️', tip: '💡', info: 'ℹ️' }[n.k]} ${esc(n.t)}</li>`).join('')}</ul></div>
        <div class="row-btns"><button type="button" class="btn ghost" data-sn="save">💾 Kaydet</button><button type="button" class="btn ghost" data-sn="pin">📌 Kısayollara koy</button><button type="button" class="btn ghost" data-sn="clear">🧹 Temizle</button></div>
        ${saved.length ? `<div class="sn-saved"><small>💾 Kayıtlı seansların</small>${saved.map((s, i) => `<span><button type="button" data-snload="${i}">${esc(s.name)} · ${s.evs.length}</button><button type="button" data-sndel="${i}" aria-label="Sil">✕</button></span>`).join('')}</div>` : ''}`;
    };
    box.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      const ds = b.dataset;
      if (ds.sncat) { curCat = ui.snCat = ds.sncat; return draw(); }
      if (ds.snadd) d.evs.push(ds.snadd);
      if (ds.snrm != null) d.evs.splice(+ds.snrm, 1);
      if (ds.snup != null) { const i = +ds.snup; [d.evs[i - 1], d.evs[i]] = [d.evs[i], d.evs[i - 1]]; }
      if (ds.sn === 'clear') d.evs = [];
      if (ds.sn === 'save' && d.evs.length) { const name = prompt('Seansın adı?', `Seansım ${(S().seansSaved || []).length + 1}`); if (name) { S().seansSaved = [...(S().seansSaved || []), { name: name.slice(0, 40), evs: d.evs.slice(), ch: d.ch }]; notify('💾 Seans kaydedildi', '💞'); } }
      if (ds.sn === 'pin' && d.evs.length) { MO().quickPins = [...new Set(d.evs)].slice(0, 12); notify('📌 Seans sohbetteki ⚡ kısayollarda, sırayla', '⚡'); }
      if (ds.snload != null) { const s = (S().seansSaved || [])[+ds.snload]; if (s) { d.evs = s.evs.slice(); if (s.ch) d.ch = s.ch; } }
      if (ds.sndel != null && confirm('Bu seans silinsin mi?')) S().seansSaved.splice(+ds.sndel, 1);
      save();
      draw();
    };
    box.onchange = e => {
      if (e.target.matches('.sn-ch')) d.ch = e.target.value;
      if (e.target.matches('.sn-type-pick') && e.target.value) seansLoad(e.target.value);
      save();
      draw();
    };
    draw();
  }
  /* 📚 kitaplık: 📖 Carmen Kitabı (uygulama), 🤖 Bot Konuşma Kitabı, 💞 Seans Kitabı. Bot ve seans bölümleri Carmen'den kendi kitaplarına taşındı */
  const BOT_MOVE = ['Bot modu: karakter nasıl cevap verir', 'Puan sistemi', 'Örnek mesajlaşmalar', 'Daha çok örnek'];
  const SEANS_MOVE = ['İdeal bir seans', 'Bir seans, baştan sona'];
  const chapterOf = t => BOOK.find(c => c.title === t);
  const BOOKS = [
    { id: 'carmen', icon: '📖', title: 'Carmen Kitabı', sub: 'olaylar, sonuçlar, değerler, tetiklenmeler', chips: ['uygulamanın el kitabı'], chapters: BOOK.filter(c => ![...BOT_MOVE, ...SEANS_MOVE].includes(c.title)) },
    { id: 'bot', icon: '🤖', title: 'Bot Konuşma Kitabı', sub: 'karakter neyi neden söyler, kural nasıl yazılır', chips: ['bot modu', 'kurallar', 'örnekler'], chapters: [] },
    { id: 'seans', icon: '💞', title: 'Seans Kitabı', sub: 'seans türleri, sıralar ve kendi seansını tasarla', chips: ['seans türleri', 'tasarımcı'], chapters: [] }
  ];
  BOOKS[0].chapters.push({ icon: '📘', title: 'Sözlük', sub: 'terimler kısaca', glossary: true, body: `
      <p>Kitaplarda altı noktalı bir terime dokununca bu açıklamalar baloncukla çıkar; baloncuktaki 📖 ile ayrıntılı bölüme geçersin.</p>
      <table class="bk-t"><tr><th>Terim</th><th>Anlamı</th></tr>
        ${GLOSS.slice().sort((a, b) => a[0].localeCompare(b[0], 'tr')).map(([w, d, c]) => `<tr><td><b>${esc(w)}</b></td><td>${esc(d)}${c ? `<br><small>📖 ${esc(c)}</small>` : ''}</td></tr>`).join('')}</table>` });
  // 🤖 Bot Konuşma Kitabı
  BOOKS[1].chapters = [
    { icon: '🤖', title: 'Bot modu nedir?', sub: 'karakterin kendi kendine konuşması', body: `
      <p>Carmen'de yapay zeka yok; <b>bot modu</b> açıkken karakterin cevapları senin önceden yazdığın (ve uygulamayla gelen) <b>kurallardan</b> seçilir. Her kural iki şeyden oluşur: <i>ne zaman</i> (mesajda geçen kelimeler, karakterin özellikleri) ve <i>ne der</i> (cevap havuzu). Bot modu her sohbette varsayılan açıktır; ⋯ Diğer menüsünden kapatılır.</p>
      <p>Karakter üç şeye cevap verir:</p>
      <ul><li><b>Senin mesajına</b>: "memelerin kaç beden?", "dön", "ahh harikasın"…</li>
        <li><b>Yazdığın olaylara</b>: #doggy, #kissing, boşalma, onun orgazmı, fanteziler…</li>
        <li><b>Kendi durumuna</b>: senin Zevk'in, onun Acı'sı, saat, ilişki, hamilelik… Bu cevaplar ana cevabın altına <b>ek baloncuk</b> olarak gelir.</li></ul>
      <p>Bir cevap birkaç parçadan kurulur: ana cevap → (varsa) 👗 kıyafet baloncuğu → 📊 durum baloncuğu → (bazen) ❔ karakterin sorusu. Sonra ton ekleri uygulanır: fantezi tonu ("miyav"), kişilik eki, sevişirken inleme, yazım tarzı (hep küçük harf, emoji…).</p>
      <p>Kurallar <code>js/data/bot-rules.js</code> dosyasındadır; Ben → 💾 Veri → 🤖 <b>Bot editörü</b> ile (yerel düzenlemede) düzenlenir. Şu an ${(Stories.BOT_RULES || { rules: [] }).rules.length} kural var.</p>` },
    { icon: '🔤', title: 'Kurallar nasıl eşleşir?', sub: 'kelime türleri, sıra, yazım', body: `
      <p>Kuralın <b>kelimeleri</b> (when) mesajda <b>sırayla</b> geçmelidir. Her kelime şunlardan biri olabilir; <code>|</code> ile alternatif yazılır:</p>
      <table class="bk-t"><tr><th>Yazım</th><th>Anlamı</th><th>Örnek</th></tr>
        <tr><td><code>kahve</code></td><td>mesajın içinde geçsin (ekli hâli de olur)</td><td>"kahveyi" ✔</td></tr>
        <tr><td><code>yap-</code></td><td>kelime bu kökle başlasın</td><td>"yapalım", "yaptın" ✔</td></tr>
        <tr><td><code>=sa</code></td><td>tam kelime</td><td>"sa" ✔, "saat" ✘</td></tr>
        <tr><td><code>+sevmek</code></td><td>fiil listesindeki kökler</td><td>"seviyorum", "sevdim"</td></tr>
        <tr><td><code>@selam</code></td><td>kelime grubu</td><td>selam, merhaba, slm…</td></tr></table>
      <p>Mesaj önce <b>sadeleşir</b>: küçük harfe çevrilir, noktalama atılır, uzatılmış harfler teke iner ("ahhhh" → "ah", "selaaam" → "selam"). Bu yüzden "ahhhh harikasın" da "ah harikasın" da aynı kurala gider. Türkçe karaktersiz yazımlar için kurallara iki yazım birden konur (<code>göğüs-|gogus-</code>).</p>
      <p><b>Özellik şartı</b> (traits): kural sadece o özelliklere sahip karakterde çalışır, ör. <i>Boob Size: 90|Boob Size: 95</i> ya da <i>Utangaç</i>. <b>Karakter şartı</b>: sadece belirli bir karakter.</p>
      <p><b>🔓 Gevşek eşleşme</b>: senin yazdığın mesajlarda kelimeler başka sırada olsa da (−30 puan) ya da 3+ kelimelik kuralda biri eksik olsa da (−60) kural yarışa girer. "boşalayım mı içine" ↔ "içine boşalayım mı" ikisi de tutar.</p>` },
    { icon: '🧭', title: 'Cevap yolları', sub: 'hangi kural önce bakılır', body: `
      <p>Bir mesaja cevap seçilirken kurallar sırayla şu yollardan geçer; bir yolda tutan kural varsa orada durur:</p>
      <ol><li><b>❔ Evet / hayır</b>: karakter az önce soru sorduysa ("Daha sert mi?") ve sen evet / hayır dediysen o sorunun cevap kuralları. Cevaba göre olay da olur (evet → Rough).</li>
        <li><b>❤️ / 💔</b>: olay karakterin sevdiği / sevmediği listesindeyse önce "sever" / "sevmez" kuralları.</li>
        <li><b>🔥 Sevişme anı</b>: son 12 mesajda bir pozisyon, Mode ya da fantezi olduysa "ahh", "devam et", "harikasın", "ben de inliyorum" gibi mesajlar sevişme kurallarına gider; boşalmadan sonra "sonra" kurallarına.</li>
        <li><b>🎭 Kişilik</b>: yarı yarıya kişilik kuralları (Utangaç, Kibirli…).</li>
        <li><b>Bütün kurallar</b> arasında en yüksek puanlı (bkz. 🎯 Puan sistemi).</li>
        <li><b>Yedek cevap</b>: hiçbiri tutmazsa. Bu mesaj 📭 eksik cevaplar listesine düşer. Olaylarda yedek yoktur, karakter susar.</li></ol>
      <p>Grup sohbetinde mesaja en yüksek puanlı kuralı tutan üye cevap verir; eşitse rastgele biri.</p>` },
    { icon: '📜', title: 'Olaylara cevap', sub: 'karaktere giden gizli cümle', body: `
      <p>Bir olay yazıldığında karaktere şu biçimde gizli bir cümle gider ve kurallar bu cümleye göre seçilir:</p>
      <p><code>evt &lt;etiketler&gt; &lt;kategori&gt; &lt;olay&gt; [fant &lt;fantezi&gt;] [mekan &lt;yer&gt;] [poz &lt;pozisyon&gt;] [miktar …] [sivi …]</code></p>
      <ul><li><code>evt vajinal Forward Missionary</code> → Missionary kuralları.</li>
        <li><code>evt anal Backward Rough Anal fant fxkopek</code> → Doggy Girl fantezisi sürerken arkadan (%60).</li>
        <li><code>evt vajinal Forward Doggy mekan araba</code> → arabada (%40).</li>
        <li><code>evt boşalma Cumming Vaginal Creampie poz Missionary Forward miktar Thick White Cumming</code> → hangi pozisyonda ve ne kadar boşaldığına göre.</li>
        <li><code>evt orgazm Lactation Orgazm sivi Squirt Woter</code> → onun orgazmı ve şiddeti.</li></ul>
      <p>Zincirde bir boşalma ya da onun orgazmı varsa cevap ona verilir; yoksa ilk olaya. Ardından olaydan gelen durum (hamile kaldı, kondom korudu, aşama geçişi, ilk kez / yine…) ek baloncuk olur.</p>` },
    { icon: '📊', title: 'Durum baloncukları', sub: 'Zevk, Acı, saat, ilişki…', body: `
      <p>Ana cevabın altına çoğu zaman (%65) bir <b>durum baloncuğu</b> eklenir. Öncelik sırasıyla:</p>
      <table class="bk-t"><tr><th>Durum</th><th>Ne zaman</th><th>Örnek</th></tr>
        <tr><td>riskligun</td><td>🩸 riskli gün, korunmasız önden</td><td>"Bugün riskli günüm… dikkat et 😳"</td></tr>
        <tr><td>korunma</td><td>önden pozisyon, Zevk 50+</td><td>"Hadi çıkar, dışarı boşal" / "Merak etme hap alırım"</td></tr>
        <tr><td>acili</td><td>😣 Acı 60+</td><td>"Ah… dur, acıtıyor 😣"</td></tr>
        <tr><td>zevkyuksek / zevkdolu / zevkbos</td><td>🥴 Zevk 70+ (Cum'a göre)</td><td>"Boşalmak üzeresin ve çok dolusun…"</td></tr>
        <tr><td>onugeliyor</td><td>💗 Uyarılma 60+</td><td>"Durma! Sakın durma! 😩💦"</td></tr>
        <tr><td>cumcok / onyorgun</td><td>3+ boşalma / 3+ orgazm</td><td>"Bugün kaç kez oldu bu? 😳"</td></tr>
        <tr><td>cumdolu / cumbos</td><td>💦 Cum 80+ / 20-</td><td>"Hmm… doldun mu sen? 😏"</td></tr>
        <tr><td>zevkorta</td><td>Zevk 40+</td><td>"Isınıyorsun bakıyorum 😏"</td></tr>
        <tr><td>destek</td><td>sevişirken (%40)</td><td>"Ahhh… harikasın 😩"</td></tr>
        <tr><td>aciorta</td><td>Acı 30+</td><td>"Hafif acıtıyor ama güzel"</td></tr>
        <tr><td>saat / ilişki</td><td>normal sohbette</td><td>"Günaydın…", "Seni seviyorum 💗"</td></tr>
        <tr><td>hamile1/2/3, regl</td><td>🤰 üç ay, 🩸 regl</td><td>"Bebeğin tekmelediğini hissettim! 🥺"</td></tr>
        <tr><td>kes_…</td><td>📱 kesinti</td><td>"Şşş! O arıyor… 🤫"</td></tr></table>
      <p>Sevişirken saat ve ilişki baloncukları gelmez; yerine sevişme durumları gelir. Bot deneyinde 📊 Durum sekmesinden hepsinin cevaplarını görebilirsin.</p>` },
    { icon: '🎭', title: 'Kişilik, ton ve yazım', sub: 'aynı cümle, farklı karakter', body: `
      <p><b>🎭 Kişilik kuralları</b>: Utangaç, Flörtöz, Kibirli, Romantik, Asi, Soğuk, Neşeli, Çocuksu, Manipülatif, Özgüvenli, Güvensiz, Gizemli, Duygusal… sevişirken, boşalınca, orgazmda, fantezide ve korunma anlarında kendi cümlelerini söyler. Olaylarda yarı yarıya öne geçerler.</p>
      <p><b>Soru cevaplarında çerçeve</b>: Utangaç "S-söylemem gerekiyor mu? 🙈 …", Kibirli "… kıskandın mı? 💅".</p>
      <p><b>Kişilik eki</b>: bazen cevabın sonuna (Flörtöz 😘, Çocuksu "hihi 🙈", Gizemli "…belki 🤫").</p>
      <p><b>🎭 Ton</b>: son Mode (Gentle 💕 … Brutal "*soluk soluğa*") ve son 30 mesajdaki fantezi (Cat Girl "miyav", Bondage "*ellerim bağlı*", rol yapmada "Patronum…", "Hocam…").</p>
      <p><b>⌨️ Yazım tarzı</b> her cevabı dönüştürür: hep küçük harf, emoji kullanmaz / sever, harf uzatır (canımmm), noktalama kullanmaz, çok güler (sjsjsj), kısa yazar, argo, resmi, sesli mesaj 🎤, geç cevap verir.</p>
      <p><b>💬 Hitap</b> <code>{sen}</code>: ❤️ Aşk 30'un altında adın, 30–69 adın / canım / tatlım, 70+ aşkım / bebeğim. Soğuk ve resmi karakterler hep adınla seslenir.</p>` },
    { icon: '❓', title: 'Sorular ve karşı sorular', sub: 'kendi bilgileriyle cevap', body: `
      <p>Karakter sorulara <b>kendi bilgileriyle</b> cevap verir: yaşı, şehri ("Paris'teyim"), mesleği, burcu, beden ölçüleri, deneyimi, sevdikleri, izinleri, korunması, hamileliği, sütü, ilişki değerleri, giydikleri…</p>
      <ul><li><b>Boyut</b>: "18 santim aletim var" → sayıyı okur, darlığına ve deneyimine göre cevaplar ve <b>hatırlar</b>; "kaç santim seversin"de ona da değinir.</li>
        <li><b>🤝 Güven 15 ve altı</b>: özel sorulara kaçamak cevap ("Bunu sana söylemek için biraz erken 😏").</li>
        <li><b>Karşı soru</b> (%40): "Peki sen beni seviyor musun? 🥺" — evet / hayır cevabın dinlenir.</li>
        <li><b>Karakterin soruları</b>: olaydan sonra bazen sorar ("Daha sert mi istiyorsun?", "Beğendin mi?"). "Evet" → aynı pozisyon devam / Rough, "hayır" → başka pozisyon / Gentle.</li></ul>` },
    { icon: '🗣️', title: 'Komutlar', sub: 'söylediğin olay olur', body: `
      <p>Bazı mesajlar <b>komut</b>tur: cevap gelir ve uygun olay kendiliğinden yazılır. 🚫 izin vermediği seçilmez, ❤️ sevdiği öne çıkar.</p>
      <table class="bk-t"><tr><th>Sen</th><th>Olay</th></tr>
        <tr><td>dön · kalçanı kaldır</td><td>Doggy / Standing doggy</td></tr><tr><td>üstüme gel</td><td>Cowgirl</td></tr>
        <tr><td>ağzına al · diz çök</td><td>Blowjob / Deepthroat</td></tr><tr><td>bacaklarını aç · seni yalayayım</td><td>Cunnilingus</td></tr>
        <tr><td>arkadan</td><td>Standing / Spooning / Cowgirl Anal</td></tr><tr><td>aç memeni · memelerini göster</td><td>Show Tits</td></tr>
        <tr><td>yüzüme otur</td><td>Facesitting</td></tr><tr><td>memelerinle · memenin arasına</td><td>Titfuck</td></tr>
        <tr><td>kalçalarının arasına</td><td>Hotdogging</td></tr><tr><td>emzir beni · sütünü içeyim</td><td>Breastfeeding</td></tr><tr><td>ters dön memelerinle · reverse titfuck</td><td>Reverse Titfuck</td></tr>
        <tr><td>beni öp · sarıl</td><td>Kissing / Hugging</td></tr><tr><td>daha sert · yavaş</td><td>Rough / Gentle</td></tr></table>
      <p>"Soyun", "sütyenini çıkar", "tangını çıkar" gibi komutlarda karakter <b>giydiğine göre</b> soyunur ("Gömleğimin üst düğmelerini açtım…").</p>` },
    { icon: '😩', title: 'Sevişirken konuşma', sub: 'inleme, destek, boşalma', body: `
      <p>Sevişme anında (son 12 mesajda bir pozisyon / Mode / fantezi):</p>
      <ul><li>Senin <b>"ahh", "off", "mmm", "devam et", "durma", "harikasın", "ben de inliyorum"</b> mesajlarına sevişme cevapları gelir: "Ahhh… inlemen beni çıldırtıyor 🥵", "Durmuyorum… ahhh".</li>
        <li>Yaptığını yazdığında da cevap verir: <b>"emiyorum seni", "memelerini emiyorum", "sana sürtüyorum", "seni tüm gücümle beceriyorum", "köklüyorum", "kalçanı sıkıyorum", "memelerini sıkıyorum", "saçını çekiyorum", "boynunu öpüyorum", "parmağımı sokuyorum"</b>.</li>
        <li><b>"Boşalıcam, az kaldı"</b>: korunmasına göre cevap verir: hap / izin varsa "Hadi, içime boşal 😩", kondomda "Bırak kendini", Pull-Out'ta "Çık! Dışarı boşal 😰", korunmasızsa "Çık hemen!".</li>
        <li>Bütün cevaplara bazen başına <b>"Ahhh… / Off… / Mmmh…"</b>, sonuna <b>"… devam et ahhh 😩 / Harikasın 🥵"</b> eklenir.</li>
        <li>%40 ihtimalle ayrı bir <b>destek baloncuğu</b> ("Evet… evet, tam böyle 😩").</li>
        <li>Boşalmadan sonra: "Harikaydın… ahhh 😩", "Hâlâ titriyorum".</li></ul>
      <p>Bütün pozisyon ve boşalma havuzlarında bu tarzda cümleler vardır; ayrıca pozisyona, döl miktarına, korunmaya ve kişiliğe göre ayrı cümleler.</p>
      <p><b>🥛 Süt benzetmesi</b>: karakter senin dölünü sık sık <i>süt</i> diye anar: "Seni sağayım canım", "Sütünü yutacağım, ver ağzıma", "Bembeyaz sütünü götüme sal", "Memelerimin arasında yoğun sütünü istiyorum". Oral, Titfuck, Handjob ve bütün boşalma havuzlarında; fantezide de ("Kedine sıcak sütünü verdin 🐱🥛").</p>` },
    { icon: '🦄', title: 'Fanteziler, roller ve kıyafet', sub: 'tonu değiştiren her şey', body: `
      <p><b>🦄 Fantezi / 🎭 rol</b> olayı olunca karakter uygun <b>kostümü</b> giyer ("Kedi kostümümü giydim…", Sekreter kombini) ve son 30 mesaj boyunca pozisyonlar, ön sevişme ve boşalma çoğu zaman o fantezinin ağzından cevaplanır (%60): Doggy Girl + arkadan → "Dört ayak üstünde, efendim". Rolde sana rolüne göre seslenir.</p>
      <p><b>👗 Kıyafet</b>: "ne giyiyorsun?" giydiklerini anlatır; Show Tits / Show Ass, "aç memeni", "soyun" ve sohbetteki ilk sevişmede giydiği parçanın cümlesi gelir (göğüs ve kalça bir sohbette birer kez). Profilde ya da 📊 kartta 👗 ile giydirilir.</p>
      <p><b>📍 Mekan</b>: son mekan kartına göre (araba, duş, sinema…) özel cümleler (%40) ve olamayacak pozisyonlar.</p>` },
    { icon: '🛡️', title: 'İzinlere göre tepkiler', sub: 'korunma, giriş, hamilelik', body: `
      <p>Karakterin ✅ izin verdiği / 🚫 vermediği korunmalar konuşmasını baştan sona değiştirir:</p>
      <table class="bk-t"><tr><th>An</th><th>Tepki</th></tr>
        <tr><td>🛡️ Korunma olayı (Condom, Control Pill, Pull-Out, Nothing…)</td><td>izin verdiyse rahat ("Kondom takman çok iyi 😌"), vermediyse itiraz ("Kondom mu? Hissetmek istiyorum ama 😒", 🤝 Güven −3)</td></tr>
        <tr><td>🚪 Turdaki ilk önden giriş</td><td>Pull-Out: "Kondomsuz giriyorsun… dışarı boşal tamam mı canım? 🥺" · izinsiz: "Kondom takmadın! Dur… 😣" (Güven −3) · hap: "Hap içiyorum, rahat ol 😏" · Nothing: "Kondomsuz, tam istediğim gibi 😈" · kondomlu: "Kondomu taktın, iyi çocuk 😏"</td></tr>
        <tr><td>🥴 Zevk 30 / 55 / 75 (içine istemeyen)</td><td>giderek ısrarcı: "Unutma… içime değil 😳" → "Sakın içime boşalma 😰" → "Çıkar! Şimdi çıkar! 😱" (55 ve 75'te her zaman)</td></tr>
        <tr><td>🙏 Israr ("lütfen içine boşalayım", "rahatlamak istiyorum")</td><td>Pull-Out: 1. "Hayır, tut! İçime değil 😣" → 2. "Lütfen… tut biraz, dışarı vereceksin 🥺" → 3. Aşk 70+ ise "Peki… bu seferlik… içimde rahatla 😩" (razı olursa o tur kızmaz) · sabah hapı 2. ısrarda razı · hap / Nothing: "Hadi rahatla, hak ettin bunu 😌"</td></tr>
        <tr><td>💦 İçine boşaldın, Pull-Out sözü vardı</td><td>"Hani çıkaracaktın?! 😡" (Güven −5)</td></tr>
        <tr><td>🤰 Hamile kaldı</td><td>Nothing'e izin verdiyse sevinir; vermediyse panik / kızgınlık: "Hamile mi kaldım?! Sana dışarı boşal demiştim! 😰" (Güven −8, Aşk −3); Romantik "Korkuyorum ama… seninle olursa belki 🥺"</td></tr></table>
      <p>Bir tur boşalmayla biter; sonraki ilk girişte tepki yeniden gelir.</p>` },
    { icon: '🧠', title: 'Canlı karakter', sub: 'hafıza, kıskançlık, kendiliğinden mesaj', body: `
      <p><b>🧠 Hafıza</b>: karakter senin mesajlarından öğrenir ve unutmaz: "adım Tolga", "27 yaşındayım", "İzmir'de yaşıyorum", "mimar olarak çalışıyorum", "kedim var", "en sevdiğim yemek mantı", "kahveyi çok severim", "soğanı sevmem". Yeni bir şey öğrenince bazen "İzmir'de… not ettim 📍" der. Adını öğrendiyse sana o adla seslenir. Kurallarda <code>{hatıra}</code> bunlardan birini anar: "Kahveyi sevdiğini unutmadım 😏". "Beni hatırlıyor musun?" sorusu da böyle cevaplanır.</p>
      <p><b>😤 Kıskançlık</b>: <i>Kıskanç</i> karakter (ya da 😤 Kıskançlık 50+ olan) başka bir karakterin adını ya da "eski sevgilim", "başka bir kız" gibi sözleri duyunca alınır: "Selin mi? O kim oluyor şimdi? 😤". Her seferinde Kıskançlık +6 (saatte −2 söner). Utangaç ve Kibirli kıskançlar kendi tarzında.</p>
      <p><b>💭 Kendiliğinden mesaj</b>: bot modu açıkken bir süre yazmazsan karakter yazar: ❤️ Aşk 70+ iken 1,5 dakikada ("Aşkım neredesin? Özledim bile 🥺💗"), 40+ iken 3, yoksa 5 dakikada ("Neredesin? 🥺"). Sohbet saati 23–06 arasıysa "Uyudun mu? 🌙". Bir sessizlikte bir kez; grup sohbetinde yok.</p>
      <p><b>🌙 Saat</b>: sabah "günaydın", gece "uyuyamadın mı?", akşam selamı; sevişirken 01–05 arası "uykum geldi ama durma".</p>
      <p><b>🎭 Kişilik ekleri</b>: Kıskanç ("…sadece benimsin 😠"), Sakin ("*sakince*"), Mantıklı ("Mantıklı düşünürsek…"), Ciddi ("Ciddiyim."), Alçakgönüllü ("…abartma ama 😅"), Olgun, Dürüst. ⌨️ <b>Uzun yazar</b> cevabına bir cümle daha ekler.</p>` },
    { icon: '🏷️', title: 'Yer tutucular', sub: 'cevabın içinde değişen kelimeler', body: `
      <table class="bk-t"><tr><th>Yazım</th><th>Yerine gelen</th></tr>
        <tr><td><code>{sen}</code></td><td>sana hitabı (adın / canım / aşkım)</td></tr><tr><td><code>{ben}</code> · <code>{ad}</code></td><td>karakterin adı · senin adın (öğrendiyse onu)</td></tr>
        <tr><td><code>{hatıra}</code></td><td>🧠 senin hakkında hatırladığı bir şey</td></tr><tr><td><code>{diger}</code></td><td>😤 kıskançlık kuralında anılan ad</td></tr>
        <tr><td><code>{ö:Boob Size}</code></td><td>özelliğin değeri (95)</td></tr><tr><td><code>{sever}</code> · <code>{sevmez}</code></td><td>❤️ / 💔 listesinden 1-2 olay</td></tr>
        <tr><td><code>{izin}</code> · <code>{izinyok}</code></td><td>✅ / 🚫 olayları</td></tr><tr><td><code>{olay}</code></td><td>cevap verilen olayın adı</td></tr>
        <tr><td><code>{pozisyon}</code> · <code>{fantezi}</code> · <code>{mod}</code></td><td>sevdiği pozisyon / fantezi / mod</td></tr>
        <tr><td><code>{cevap:…}</code></td><td>hazır cevap: yaş, şehir, hamile, boşal, sevgi, güven, kıskanç, bebek, süt, sütiç, azgın, sertyavaş, ilk, geçmiş, seks, hassas, anal, oral, kondom, hap, burç, meslek, kıyafet, sütyen, altiç, boy, sevboy, memearası, memeem, memeyala, memedokun, memeısır, memeuç, kalçayala, kalçadokun, orgazmsay, boşalmasay…</td></tr></table>
      <p>Bir cevaba <code>||</code> yazınca ayrı baloncuk olur: <code>Ahh…||Durma 😩</code>.</p>` },
    { icon: '✍️', title: 'Kural yazma rehberi', sub: 'adım adım yeni kural', body: `
      <ol><li>🧪 <b>Bot deneyi</b>nde mesajı yaz; hangi kuralların tuttuğunu ve puanlarını gör. 📭 Eksik cevaplar listesi nereden başlayacağını söyler.</li>
        <li>🤖 <b>Bot editörü</b>nde yeni kural aç; kelimeleri sırayla yaz. Kök için <code>-</code>, tam kelime için <code>=</code>, alternatif için <code>|</code>.</li>
        <li>Cevaplara <b>20'ye yakın cümle</b> yaz (uygulamayla gelen her havuzda en az 20 var); tekrar olmasın diye son seçilenler bir süre gelmez.</li>
        <li>Belirli karakterlere özel olsun istiyorsan <b>özellik şartı</b> ekle (+10 puan, genel kuralı geçer).</li>
        <li>Deneyde tekrar dene: senin kuralın 🏆 olmalı. Başka kural geçiyorsa bir kelime daha ekle (+100) ya da kelimeyi daralt (<code>=tam</code>).</li>
        <li>Kurala 🎲 sonuç bağlamak istersen Sebep-Sonuç → 🤖 (ör. iltifat → Aşk +2).</li></ol>
      <p><b>İpuçları</b>: kısa kelimeleri (<code>em-</code>, <code>ah-</code>) dikkatli kullan, başka kelimelerin içinde de geçebilir. Olay kurallarında <code>=evt</code> ile başla; durum kurallarında <code>=durum</code>.</p>` },
    { icon: '🧪', title: 'Bot deneyi ve eksik cevaplar', sub: 'sohbete dokunmadan dene', body: `
      <p>Ben → ❓ Yardım → 🧪 <b>Bot deneyi</b>: kendi <b>deney karakterini</b> kurarsın (kayıtlı birinden kopyala, 🎲 rastgele ya da boş): 🧬 özellikler, ❤️/💔, ✅/🚫, 👗 giyim, 📊 değerler.</p>
      <ul><li><b>💬 Mesaj</b>: yaz, uyan bütün kurallar puanıyla, gruplarına ayrılmış (❤️/💔, 🎭 kişilik, normal, 🔓 gevşek) ve 🏆 kazananla görünür; cevaplar karakter için doldurulmuş hâlde.</li>
        <li><b>📜 Olay</b>: seç; boşalmada hangi pozisyondayken, olaylarda hangi fanteziyken. 👗 kıyafet baloncuğunun bütün ihtimalleri de listelenir.</li>
        <li><b>📊 Durum</b>: bir durumun bütün cevapları.</li>
        <li><b>📭 Eksik cevaplar</b>: sohbette karakterin anlamadığı mesajlar, en çok tekrarlanan başta; dokununca deneyde açılır.</li></ul>
      <p>Kitaplardaki örnek sohbetlerde <b>▶ dene</b> o mesajı deneyde açar.</p>` },
    ...BOT_MOVE.map(chapterOf).filter(Boolean)
  ];
  // 💞 Seans Kitabı: seans türleri (SEANS_TYPES) ve tasarımcı
  BOOKS[2].chapters = [
    { icon: '💞', title: 'Seans nedir?', sub: 'aşamalar ve değerler', body: `
      <p>Bir <b>seans</b>, sohbette arka arkaya yazdığın olayların bütünüdür: ısınma, onu ısıtma, dokunuş, pozisyonlar, bitiş ve sonrası. İyi bir seansta değerler dengeli yükselir:</p>
      <table class="bk-t"><tr><th>Değer</th><th>Ne yükseltir</th><th>Ne olur</th></tr>
        <tr><td>🥴 Zevk (sen)</td><td>pozisyonlar +8, Foreplay +1–3</td><td>80'de pozisyona uyan boşalma</td></tr>
        <tr><td>💦 Cum (sen)</td><td>saat başı +10</td><td>döl miktarı (Watery … High Sperm)</td></tr>
        <tr><td>💗 Uyarılma (o)</td><td>Eat (+15 … +40)</td><td>80'de onun orgazmı</td></tr>
        <tr><td>🔥 Şehvet (o)</td><td>Eat +10</td><td>orgazmın şiddeti (Woter)</td></tr>
        <tr><td>❤️ Aşk · 🫂 Samimiyet</td><td>Foreplay, iltifat, orgazm</td><td>hitap ve cevapların sıcaklığı</td></tr>
        <tr><td>😣 Acı (o)</td><td>dar + büyük, anal, Rough</td><td>"dur, acıtıyor"; Gentle azaltır</td></tr></table>
      <p>Boşalma ve orgazm olaylarını yazmana gerek yok: değer sınırı geçince <b>kendiliğinden</b> gelirler. Senin işin sırayı kurmak.</p>` },
    ...SEANS_MOVE.map(chapterOf).filter(Boolean),
    { icon: '🗂️', title: 'Seans türleri', sub: 'romantikten serte, oraldan role', body: `
      <p>Her türün bir havası, bir sırası ve bir nedeni var. <b>🧪 Tasarımcıda aç</b> ile sırayı tasarımcıya alıp kendine göre değiştirebilirsin.</p>
      ${SEANS_TYPES.map(t => `<div class="sn-type"><div class="sn-th"><b>${t.icon} ${esc(t.name)}</b><button type="button" class="bk-try sn-open" data-bkseans="${t.id}">🧪 Tasarımcıda aç</button></div><p>${t.desc}</p><div class="sn-seq">${t.seq.map(x => `<span>${esc(x)}</span>`).join('<i>›</i>')}</div>${t.tip ? `<small>💡 ${t.tip}</small>` : ''}</div>`).join('')}` },
    { icon: '🔀', title: 'Akıcı geçişler', sub: 'hangi pozisyondan hangisine', body: `
      <p>Bedenler bir pozisyondan ötekine kopmadan geçebiliyorsa seans akar. Önerilen geçişler:</p>
      <table class="bk-t"><tr><th>Şundan sonra</th><th>Akıcı</th><th>Neden</th></tr>
        ${Object.entries(SEANS_FLOW).map(([a, f]) => `<tr><td>${esc(a)}</td><td>${f.next.map(esc).join(', ')}</td><td>${esc(f.why)}</td></tr>`).join('')}</table>
      <p>Önden → arkadan → önden yerine <b>önce önden, sonra arkadan</b> daha iyidir. Anal'den önce ısınma ve Gentle, dar karakterde Acı'yı düşük tutar.</p>` },
    { icon: '🛏️', title: 'Pozisyonlar', sub: 'her kategori ne yapar, nerede biter', body: `
      <p>Pozisyonlar 🗂️ <code>event</code> etiketli kategorilerdedir. Her pozisyon <b>🥴 Zevk +8</b> verir (Foreplay hariç), 🫂 Samimiyet ve 🤝 Güven'i +1 artırır. Etiketi, Zevk 80'i geçince <b>hangi boşalmanın</b> geleceğini belirler.</p>
      <h4>🔥 Forward · önden (vajinal)</h4>
      <table class="bk-t"><tr><th>Pozisyon</th><th>Nasıl</th><th>Not</th></tr>
        <tr><td>Missionary</td><td>o altta, sen üstte, yüz yüze</td><td>en romantik; Romantik karakter sever</td></tr>
        <tr><td>Cowgirl</td><td>o üstte, ritmi o tutar</td><td>Özgüvenli / Flörtöz kontrolü sever</td></tr>
        <tr><td>Doggy</td><td>dört ayak, sen arkasında</td><td>büyük kalçada ayrı cümleler; Doggy Girl ile "efendim"</td></tr>
        <tr><td>Spooning</td><td>yan yatmış, arkadan sarılarak</td><td>yavaş ve sıcak; hamileyken rahat</td></tr>
        <tr><td>Standing</td><td>ayakta, duvara yaslı</td><td>duş, kabin, balkonda olur</td></tr>
        <tr><td>Lap Sex</td><td>kucağında, oturarak</td><td>Lap Kissing'den doğal geçiş</td></tr>
        <tr><td>Full Nelson · Ondesk</td><td>bacakları yukarıda kilitli · masanın üstünde</td><td>derin; ofis rolünde Ondesk</td></tr></table>
      <p><b>Bitiş:</b> Vaginal Creampie. Dar amda ve 18 cm+'da 😣 Acı artar (+4…+13), Virgo'da +6.</p>
      <h4>🍑 Backward · arkadan (anal)</h4>
      <table class="bk-t"><tr><th>Pozisyon</th><th>Not</th></tr>
        <tr><td>Standing doggy</td><td>ayakta eğilmiş; Doggy'den geçiş</td></tr>
        <tr><td>Spooning Anal</td><td>en nazik anal başlangıç</td></tr>
        <tr><td>Cowgirl Anal</td><td>derinliği o ayarlar</td></tr>
        <tr><td>Standing Anal</td><td>ayakta, duvara</td></tr>
        <tr><td>Rough Anal</td><td>en sert; Acı +5 fazladan</td></tr></table>
      <p><b>Bitiş:</b> Anal Creampie. Her anal Acı +4, dar arkada +5 (+4 büyükte). Önce Foreplay / Eat ve Gentle.</p>
      <h4>🍌 Outercourse · içeri girmeden</h4>
      <table class="bk-t"><tr><th>Pozisyon</th><th>Etiket</th><th>Bitiş</th></tr>
        <tr><td>Blowjob · Deepthroat · Oral Sex · 69</td><td>oral</td><td>Oral Creampie, Mouth / Face Cumming</td></tr>
        <tr><td>Titfuck</td><td>göğüs</td><td>Tit Cumshot</td></tr>
        <tr><td>Reverse Titfuck</td><td>göğüs</td><td>Tit Cumshot · 69 gibi ters, penis göğüslerinin arasında, kalçası yüzünde</td></tr>
        <tr><td>Buttjob</td><td>kalça</td><td>Ass Cumshot · kalçasının üstünde sürtme</td></tr>
        <tr><td>Hotdogging</td><td>kalça</td><td>Ass Cumshot · kalçasının iki yanağı arasında kayma</td></tr>
        <tr><td>Footjob · Legjob</td><td>bacak</td><td>Leg Cumshot, Legs Creampie</td></tr>
        <tr><td>Handjob · Masturbation</td><td>el</td><td>Face Cumming</td></tr></table>
      <p>Acı vermez, hamilelik riski yoktur. Boyuta göre (iri / küçük göğüs, dolgun / küçük kalça) ayrı cümleler gelir.</p>
      <h4>💋 Foreplay · 👅 Eat · 💥 Mode</h4>
      <ul><li><b>Foreplay</b> (Kissing, Lap Kissing, Hugging, Show Tits / Ass): Zevk sadece +1–3; ❤️ Aşk +5, 🫂 Samimiyet +4, Acı −6. Isınma ve mola içindir, kimse boşalmaz.</li>
        <li><b>Eat</b> (Cunnilingus +25, Breastfeeding +30, Facesitting +20, On Mouth +15, Squirt +40 💗 Uyarılma; hepsi 🔥 Şehvet +10, Acı −4): onu orgazma götüren yol. 🍼 Breastfeeding'de göğüslerini emersin; hamileyse sütünü içersin.</li>
        <li><b>Mode</b> pozisyonun şiddetini söyler: Gentle (Acı −14), Passionate (−4), Assertive (+6), Rough / Brutal (+10); inletmeli, bağırtmalı, ağlatmalı (+6) karakterin sesini değiştirir. Sohbette son Mode, sonraki pozisyon cevaplarının tonudur.</li></ul>` },
    { icon: '💦', title: 'Boşalma olayları', sub: 'Cumming: nerede, ne kadar, ne olur', body: `
      <p>Boşalmayı yazmana gerek yok: <b>🥴 Zevk 80</b>'i geçince 💦 Cumming kategorisinden <b>şu anki pozisyonla aynı etiketli</b> olay kendiliğinden gelir (birden çok uyan varsa rastgele), Zevk −100.</p>
      <table class="bk-t"><tr><th>Olay</th><th>Hangi pozisyondan</th><th>Ne olur</th></tr>
        <tr><td>Vaginal Creampie</td><td>Forward</td><td>Cum −30; 🚫 Condom yoksa %50 🤰 hamile (🌱 doğurganlık ve döngü gününe göre); Pull-Out sözü varsa karakter kızar</td></tr>
        <tr><td>Anal Creampie</td><td>Backward</td><td>hamilelik yok; "götüme sal" cümleleri</td></tr>
        <tr><td>Oral Creampie · Mouth Cumming</td><td>oral</td><td>yutar ya da ağzında tutar; 💗 sevdiyse "sütünü yuttum"</td></tr>
        <tr><td>Face Cumming</td><td>oral, el</td><td>yüzüne</td></tr>
        <tr><td>Tit Cumshot</td><td>Titfuck, Reverse Titfuck</td><td>göğüslerine; iri göğüste ayrı cümle</td></tr>
        <tr><td>Ass Cumshot</td><td>Buttjob, Hotdogging</td><td>kalçasına / kalçalarının arasına</td></tr>
        <tr><td>Leg Cumshot · Legs Creampie</td><td>Footjob, Legjob</td><td>bacaklarına / uylukların arasına</td></tr></table>
      <p>Her boşalma: 🔁 Cumming sayısı +1, "Cumming" ortak sonucu 💦 Cum −10…−50. Ardından iki bilgi olayı gelir, boşalmadan <b>önceki</b> değerlere bakar:</p>
      <ul><li><b>Miktar</b> (💦 Cum): Watery · Low-volume · Normal · Thick White · High Sperm.</li>
        <li><b>Yoğunluk</b> (🔁 sayı): Hyper-concentrated (ilk) → Polyzoospermia → Normozoospermia → Oligospermia → Azoospermia (5+).</li></ul>
      <p><b>✋ Tutmak</b>: Zevk yükselirken bu üçünden biri boşalmayı erteler; Cum düşmez, aksine birikir:</p>
      <table class="bk-t"><tr><th>Olay</th><th>Tutarsın</th><th>Tutamazsın</th></tr>
        <tr><td>Holding</td><td>%55 Zevk −20, Cum +10 · %25 Zevk −30, Cum +15, sayı −1</td><td>%20 Zevk +100 → boşalma</td></tr>
        <tr><td>Hard Holding</td><td>%50 Zevk −35, Cum +20, sayı −1 · %35 Zevk −30, Cum +25, sayı −1</td><td>%15</td></tr>
        <tr><td>Cock Ring</td><td>%60 Zevk −25, Cum +15 · %30 Zevk −20, Cum +20, sayı −1</td><td>%10</td></tr></table>
      <p>"Sayı −1" dölü yoğunlaştırır: tutup biriktirdiğin boşalma hem daha bol (Thick White, High Sperm) hem daha yoğun gelir. Karakter tutarken kişiliğine ve korunmasına göre konuşur ("Tut, sonra hepsini içime 😈" / "Tut ve gelince çık 😰").</p>
      <p><b>Bot:</b> karakter boşalmaya pozisyona, miktara, korunmaya, kişiliğe ve fanteziye göre cevap verir; dölün çoğu zaman <i>süt</i>tür ("Bembeyaz sütünü içime saldın 🥛"). Sonra bazen yeni bir pozisyon ister ("İstersen bu kez arkama gir 😈").</p>
      <p>💡 Bitişi seçmek istiyorsan Zevk 60–70'teyken pozisyonu değiştir: 80'i hangi pozisyonda geçersen orada biter.</p>` },
    { icon: '💗', title: 'Orgazm olayları', sub: 'onun orgazmı, ıslaklık ve süt', body: `
      <p>Onun orgazmı da kendiliğinden gelir: <b>💗 Uyarılma 80</b>'i geçince 🍒 Lactation kategorisinden <b>Orgazm</b> olur, Uyarılma sıfırlanır. Uyarılma'yı en hızlı Eat olayları yükseltir (Squirt +40, Breastfeeding +30, Cunnilingus +25, Facesitting +20, On Mouth +15). Üç Breastfeeding onu tek başına orgazma götürür; hamileyse emdikçe sütü de gelir ("Em beni, sütüm sana aksın 🍼").</p>
      <p><b>Orgazm</b>: ❤️ Aşk +5, 🤝 Güven +2, 🍼 Süt −30. Ardından şiddeti gelir:</p>
      <table class="bk-t"><tr><th>🔥 Şehvet</th><th>Islaklık</th><th>Karakter</th></tr>
        <tr><td>0–19</td><td>Drops Woter</td><td>"Birkaç damla ama içim titredi 🫠"</td></tr>
        <tr><td>20–44</td><td>Low-volume Woter</td><td>"Bacaklarımın arası ıslandı 😩"</td></tr>
        <tr><td>45–69</td><td>Normal Woter</td><td>"Sırılsıklamım, senin yüzünden 💦"</td></tr>
        <tr><td>70–89</td><td>High-volume Woter</td><td>"Çarşaflar sırılsıklam 😵‍💫"</td></tr>
        <tr><td>90–100</td><td>Squirt Woter</td><td>"Fışkırdım! 😳💦"</td></tr></table>
      <p><b>🍼 Süt</b>: karakter 🔘 hamileyse ayrıca 🍼 Süt değerine göre Drops … Squirt Milk gelir (10'un altında süt yok): "Göğüslerimden süt fışkırdı 🍼". Süt her saat başı +5 dolar.</p>
      <ul><li><b>Şehvet</b> her Eat'te +10 birikir, saat başı −5 söner: aynı seansta ikinci orgazm birinciden güçlü olur.</li>
        <li><b>Birlikte gelmek</b>: onun Uyarılma'sı ve senin Zevk'in aynı anda 80'e yaklaşırsa ikisi aynı zincirde gelebilir; karakter o zincirdeki boşalmaya ya da orgazma cevap verir. Uyarılma 60+ iken "Durma! Sakın durma! 😩" baloncuğu çıkar.</li>
        <li><b>Yorgunluk</b>: bir sohbette 3+ orgazmdan sonra "Beni tükettin 😩" der.</li>
        <li><b>Kişilik</b>: Utangaç "S-sesli miydim? 🙈", Asi "Bağırdım, kim duyarsa duysun 😤", Duygusal "Gözyaşlarım aktı 😢"; Mode ağlatmalıysa gözyaşları, bağırtmalıysa çığlık.</li></ul>
      <p>💡 İdeal sıra: önce onu bir Eat ile 55–60'a getir, sonra pozisyona geç; böylece onun orgazmı pozisyonun ortasında, seninki sonunda gelir.</p>` },
    { icon: '🛠️', title: 'Kendi seansını tasarla', sub: 'sırala, Lia değerlendirsin', interactive: 'designer', body: `
      <p>Olayları sırayla ekle; Lia her değişiklikte seansını değerlendirir: Zevk ve Uyarılma ne zaman sınırı geçer, boşalma hangi pozisyonda gelir, korunma, ısınma, geçişler, karakterin sevdikleri… Beğendiğin seansı 💾 kaydet ya da 📌 sohbetteki ⚡ kısayollara koy.</p>
      <div class="sn-designer"></div>` },
    { icon: '📈', title: 'Değerleri okumak', sub: 'sohbette ne zaman ne yapmalı', body: `
      <ul><li><b>Zevk 60+</b>: boşalma yaklaşıyor. Uzatmak istersen <b>Holding</b> (Zevk −20…−30, Cum +10–15), <b>Hard Holding</b> (Zevk −30…−35, Cum +20–25, döl yoğunlaşır) ya da <b>Cock Ring</b>; Cum düşmez, biriktirirsin. Ama %10–20 tutamazsın ve pozisyona uyan boşalma gelir. Bitirmek istersen sevdiği bir pozisyon.</li>
        <li><b>Uyarılma 55+</b>: bir Eat daha onu getirir.</li>
        <li><b>Acı 30+</b>: Gentle ya da Foreplay araya; 60+ ise mutlaka.</li>
        <li><b>Cum 20-</b>: bu tur az olur; saat ilerlesin (her saat +10).</li>
        <li><b>🔥 Riskli gün</b> (📊 kart): önden pozisyondan önce Condom; hap içiyorsa gerek yok.</li>
        <li><b>❤️ Aşk düşük</b>: Foreplay ve iltifat; karakter daha sıcak konuşur, kaçamak cevapları biter (Güven).</li>
        <li><b>📱 Kesinti</b> geldiyse: bir sonraki pozisyonda karakter ona göre konuşur; Cheating'de daha sık.</li></ul>
      <p>Lia'nın sohbetteki önerileri (💁‍♀️) bu kurallara göre çalışır; ⋯ Diğer → 💡 ile aç / kapa.</p>` },
    { icon: '🏨', title: 'Seansı siteyle hazırla', sub: 'mekan, oyuncak, kostüm', body: `
      <p>Seansa başlamadan önce 🌐 İnternet'teki siteler sahneyi kurar:</p>
      <ul><li><b>🏨 CarmenStay</b>: jakuzili süit, kral dairesi, VIP loca… Rezervasyon sohbeti 📍 mekan kartı ve seçtiğin 🕰️ saatle açar. Saat 22:00 seçersen gece cevapları gelir.</li>
        <li><b>🛍️ CarmenShop</b>: vibratör, kelepçe, masaj yağı gibi oyuncaklar kargo gelince ⚡ kısayola olay olarak eklenir; seans sırasına tek dokunuşla koyarsın. Kayganlaştırıcı Acı'yı azaltır, masaj yağı Samimiyet'i artırır.</li>
        <li><b>🫦 CarmenFans</b> / <b>🎥 CarmenLive</b>: kostüm seti ya da bahşişle kostüm giydirirsen karakter fantezi tonunda konuşur; Fantezi gecesi seansıyla birlikte dene.</li>
        <li><b>💼 CarmenJobs</b>: mülakat Patron – Sekreter, Doktor, Hoca gibi rol olaylarıyla başlar; Rol yapma seansının hazır girişi.</li></ul>` }
  ];
  /* 🌐 İnternet Kitabı: ana sayfadaki 🌐 İnternet kartındaki dokuz site */
  BOOKS.push({ id: 'internet', icon: '🌐', title: 'İnternet Kitabı', sub: 'Carmen.com, Fans, Flix, Stay, Live, Shop, Jobs, Klinik, İtiraf', chips: ['9 site', 'sohbete bağlanır'], chapters: [
    { icon: '🌐', title: 'İnternet nedir?', sub: 'siteler ve karakterler', body: `
      <p>Ana sayfadaki <b>🌐 İnternet</b> kartı dokuz siteyi açar. Sitelerdeki her şey senin dünyana bağlıdır: kızlar senin karakterlerin ya da Carmen.com ilanlarıdır, sitede yaptığın şey sohbete, değerlere, gardıroba ve ⚡ kısayollara yansır.</p>
      <table class="bk-t"><tr><th>Site</th><th>Ne işe yarar</th><th>Sohbete etkisi</th></tr>
        <tr><td>🌹 Carmen.com</td><td>ilanlar, seanslar, kurallar, yorumlar</td><td>Mesaj at → yeni sohbet</td></tr>
        <tr><td>🫦 CarmenFans</td><td>abonelik, kilitli gönderiler, özel içerik</td><td>kostüm giydirir, sexting sohbeti</td></tr>
        <tr><td>🍿 CarmenFlix</td><td>film ve diziler, yazışma olarak</td><td>💬 Rolü oyna → başrolle sohbet</td></tr>
        <tr><td>🏨 CarmenStay</td><td>otel, süit, kulüp rezervasyonu</td><td>📍 mekan kartı + 🕰️ saat</td></tr>
        <tr><td>🎥 CarmenLive</td><td>canlı yayın, bahşiş</td><td>❤️ Aşk, 🔥 Şehvet, kostüm, özel yayın</td></tr>
        <tr><td>🛍️ CarmenShop</td><td>oyuncak, iç çamaşırı, kostüm</td><td>⚡ yeni olay, 👗 gardırop, kargo mesajı</td></tr>
        <tr><td>💼 CarmenJobs</td><td>onun iş yerine başvuru</td><td>🎭 rol olayı + iş yeri kartı</td></tr>
        <tr><td>🩺 CarmenKlinik</td><td>döngü, hamilelik takibi</td><td>sadece gösterir</td></tr>
        <tr><td>🎭 Gizli İtiraf</td><td>isimsiz aldatma itirafları</td><td>sadece okunur (ilham için)</td></tr></table>
      <p><b>İlan kızları</b>: Carmen.com'da kayıtlı karakterlerinin yanında 36 rastgele ilan kızı vardır (her birinin kendi fotoğraf seti; aynı fotoğrafta iki kişi olmaz). Bir ilan kızına mesaj atınca, rezervasyon, sipariş, başvuru yapınca ya da kostüm giydirince <b>karakterlerine eklenir</b>; ilandaki ücretleri, puanı ve yorumları aynı kalır.</p>` },
    { icon: '🌹', title: 'Carmen.com', sub: 'ilanlar, VIP, kondom şartı, seanslar', body: `
      <p>İlan sitesi. Kartlarda fotoğraf, yaş, şehir, ⭐ puan, boy / kilo / göğüs / kalça ve sevdiği ilk üç olay görünür. Üstte <b>👑 VIP Vitrin</b>; sekmeler Hepsi · ● Çevrimiçi · 👑 VIP · ✨ Yeni. 🔄 Yeni ilanlar bütün ilan kızlarını yeniden üretir (kayıtlı karakterlerin kalır).</p>
      <p><b>Profil sayfası</b>: 💌 Hakkımda (flörtöz tanıtım, kişiliğe göre), 📏 Fiziksel özellikler, 🫦 Bunları çok iyi yaparım (sevdikleri), 🛡️ Kondom ve kurallarım, 💔 Pek sevmediklerim, 📸 Fotoğraflar, 💎 Seanslar, 💬 Yorumlar.</p>
      <table class="bk-t"><tr><th>✅ İzinleri</th><th>İlanda yazan</th></tr>
        <tr><td>Nothing / Control Pill / Morning-After / Pull-Out yok</td><td>🛡️ "Kondom şartım vardır"</td></tr>
        <tr><td>bunlardan biri var</td><td>🔥 "Kondom şartım yoktur" (+ hap, sabah hapı ya da dışarı boşalma şartı)</td></tr>
        <tr><td>Nothing / hap / sabah hapı</td><td>💦 "İçime boşalabilirsin"</td></tr>
        <tr><td>yoksa</td><td>🚫 "İçe boşalmaya izin vermiyorum, ısrar etmeyin"</td></tr></table>
      <p><b>💎 Seanslar</b>: kısa (30 dk), standart (1 saat), uzun (2 saat), sevdiklerine uyan seans türleri (1,5 saat) ve gece. Kondom şartı yoksa kondomsuz fiyat da çıkar (%40 fazla). <b>VIP</b> fiyatları 2,5 katıdır.</p>
      <p><b>💬 Yorumlar</b> kondom kuralına uyar: içe izin verende "Gerçekten içine boşalmama izin verdi 😳", vermeyende "Ne kadar ısrar etsem de içine boşalttırmadı" ya da "Yanlışlıkla içine boşaldım, kızdı bana". Kendi yorumunu da yazabilirsin.</p>` },
    { icon: '🫦', title: 'CarmenFans', sub: 'abonelik, haftanın kostümü, özel içerik', body: `
      <p>İçerik üreticisi sayfaları. Abone olmadan yalnızca ilk gönderi açıktır; diğerleri 🔒 bulanık. Abonelik aylık ücretlidir (VIP'lerde daha pahalı).</p>
      <ul><li><b>📢 Bu hafta</b>: her hafta değişen kostüm; karakterin sevdiği fanteziye uyan kostüm (Kedi, Tavşan, Sekreter, Profesör…) önce gelir. Aboneysen <b>💬 Bu kostümle yaz</b> kostümü giydirip sohbeti açar.</li>
        <li><b>💎 Özel içerik</b>: sevdiklerinden 🎥 videolar, 📸 kostüm foto setleri (alınca kostüm <b>gardırobuna girer</b>, "Giydir" ile üstüne), 🎙️ sesli mesaj, 💬 sexting seansı ve 📹 isteğe özel video (ikisi sohbeti açar).</li></ul>` },
    { icon: '🍿', title: 'CarmenFlix', sub: 'film ve diziler, yazışma olarak', body: `
      <p>Netflix gibi: ${FX_TITLES.filter(t => t.k === 'film').length} film ve ${FX_TITLES.filter(t => t.k === 'dizi').length} dizi. Her yapımın başrolünde ilanlardan ya da karakterlerinden bir kadın (fotoğrafıyla) ve bir erkek var. Hikaye yazışma olarak sırayla akar: mesajlar "yazıyor…" ile gelir, aralara 📜 olay kartları ve anlatım satırları girer. Ortada onun 💗 <b>Orgazm</b>'ı, sonda son pozisyona göre 💦 <b>boşalma</b> (Vaginal Creampie, Face Cumming, Oral Creampie, Tit / Ass / Leg Cumshot) ve miktarı (Thick White, High Sperm…) pembe parlayan kartlarla görünür.</p>
      <ul><li><b>Ana sayfa</b>: günün öne çıkanı, ▶️ İzlemeye devam et, ➕ Listem, 🔥 Bugün Top 10, Diziler, Filmler ve türler (💔 Aldatma, 💼 İş yerinde, 🎭 Fantezi, 🌹 Romantik, 🏠 Komşular, 🌙 Yabancılar).</li>
        <li><b>Oynatıcı</b>: ⏸ duraklat, 1x / 2x / 3x hız, ⏮ baştan, ⏭ hepsini göster. Dizide bölüm bitince 6 saniye sonra sonraki bölüm başlar; çoğu bölüm bir merakla biter (telefon çalar, kapı vurulur…).</li>
        <li><b>💬 Rolü oyna</b>: başroldeki kızla o hikayenin sohbetini açar; oradan sen devam edersin.</li></ul>
      <p>Aynı bölüm her açılışta aynı senaryodur; izlediklerin ve listen bu tarayıcıda saklanır.</p>` },
    { icon: '🏨', title: 'CarmenStay', sub: 'rezervasyon = mekan + saat', body: `
      <p>12 mekan: standart oda, deniz manzaralı oda, jakuzili süit, kral dairesi, aynalı butik oda, tematik oda (pole direği, kostüm dolabı), hamam & spa, VIP loca, lounge bar, dağ bungalovu, havuzlu villa, kiralık yat.</p>
      <p>Rezervasyonda <b>kiminle</b>, <b>saat</b> ve <b>süre</b> seçersin. Yeni sohbet açılır: 📍 mekan kartı (her mekan bir hazır mekana bağlıdır, ör. jakuzi → banyo, loca → dans pisti; karakter mekana göre konuşur, olamayacak pozisyonları reddeder), 🕰️ saat seçtiğin saatten başlar ve ilk mesajı o atar ("Jakuziye girdim bile 🛁…"). 🗓️ Rezervasyonlarım listesi o sohbetlere götürür.</p>` },
    { icon: '🎥', title: 'CarmenLive', sub: 'bahşiş menüsü ve hedef', body: `
      <p>Çevrimiçi kızlar yayında. Yayında izleyici sayısı, akan sohbet ve değişen fotoğraflar var.</p>
      <table class="bk-t"><tr><th>Bahşiş</th><th>Ne olur</th></tr>
        <tr><td>50 ₺</td><td>👋 selam</td></tr><tr><td>100 ₺</td><td>💃 dans</td></tr>
        <tr><td>200 ₺</td><td>🍒 Show Tits (Şehvet +5)</td></tr><tr><td>250 ₺</td><td>🍑 Show Ass (Şehvet +5)</td></tr>
        <tr><td>400 ₺</td><td>👗 kostüm değiştirir (gerçekten giyer, gardırobuna girer)</td></tr>
        <tr><td>600 ₺</td><td>🍆 oyuncakla oynar</td></tr><tr><td>1000 ₺</td><td>🔒 özel yayın: sohbet açılır</td></tr></table>
      <p>200 ₺ ve üstü her bahşiş ❤️ Aşk +1. 🎯 <b>Hedef</b> 2.000 ₺: dolunca sürpriz mesajı gelir.</p>` },
    { icon: '🛍️', title: 'CarmenShop', sub: 'oyuncak olur, giyim gardıroba', body: `
      <p>🪄 Oyuncaklar, 👙 iç çamaşırı ve 🐰 kostümler. Sepete ekle → <b>Siparişi tamamla</b>: kime gideceğini ve kargoyu (standart 3 dk, ekspres 1 dk) seç.</p>
      <p>Kargo süresi dolunca (uygulama kapalıysa bir sonraki açılışta) teslim edilir: sohbete 📦 teslimat notu gelir, karakter "<b>Paketin geldi, açayım mı? 😏</b>" der.</p>
      <ul><li><b>Oyuncak</b> → olay olur ve ⚡ kısayola sabitlenir. Hazır olayı varsa o (Bondage, Condom, Sex toys, Cock Ring), yoksa Monia'da <b>🛍️ Oyuncaklar</b> kategorisinde yeni olay açılır; etkileri gelir (Vibratör: Uyarılma +20, Şehvet +5 · Kayganlaştırıcı: Acı −10 · Kırbaç: Acı +8, Şehvet +8…). Olayı Monia'da istediğin gibi düzenleyebilirsin.</li>
        <li><b>İç çamaşırı / kostüm</b> → karakterin gardırobuna girer; 👗 Giyim'den giydirirsin.</li></ul>` },
    { icon: '💼', title: 'CarmenJobs', sub: 'başvuru = rol fantezisi', body: `
      <p>Karakterlerin mesleklerinden iş ilanları: şirket, maaş, iş tanımı ve işe alım sorumlusu olarak kendisi. <b>Başvur</b> → "📩 Mülakata çağrıldın!" → yeni sohbet: iş yeri kartı, 🕰️ 10:00, başvuru notun ve onun ilk mesajı.</p>
      <table class="bk-t"><tr><th>Meslek</th><th>🎭 Rol olayı</th><th>👗 Giydiği</th></tr>
        <tr><td>hemşire, doktor, eczacı…</td><td>Doktor – Hasta</td><td>Hemşire kostümü</td></tr>
        <tr><td>öğretmen, akademisyen…</td><td>Kadın Hoca – Öğrenci</td><td>Profesör kombini</td></tr>
        <tr><td>öğrenci, stajyer</td><td>Hoca – Öğrenci</td><td>Öğrenci üniforması</td></tr>
        <tr><td>polis, güvenlik</td><td>Polis – Şüpheli</td><td>Polis kostümü</td></tr>
        <tr><td>masöz, spa, güzellik</td><td>Masöz – Müşteri</td><td>Masöz önlüğü</td></tr>
        <tr><td>temizlik, garson, otel</td><td>Hizmetçi – Ev Sahibi</td><td>Hizmetçi kostümü</td></tr>
        <tr><td>diğerleri</td><td>Patron – Sekreter</td><td>Sekreter kombini</td></tr></table>
      <p>Rol olayı ⚡ kısayola sabitlenir; mülakatın ortasında tek dokunuşla fanteziye geçersin.</p>` },
    { icon: '🩺', title: 'CarmenKlinik', sub: 'döngü takvimi, hamilelik haftası', body: `
      <p>Sohbetin içinde işleyen beden zamanını görünür yapar. Zaman 🕰️ sohbet saatiyle ilerler (bir gün = 24 saat sohbet zamanı, bir hamilelik haftası = 2 saat).</p>
      <ul><li><b>🩸 Döngü takvimi</b>: 28 gün; 1–5 regl (hamilelik ihtimali ×0,15), 11–16 riskli (×1,8), bugün işaretli, riskli günlere kalan süre.</li>
        <li><b>🌱 Doğurganlık</b>: karakterin değeri ve bugünkü çarpanla etkin yüzdesi.</li>
        <li><b>🤰 Hamilelik</b>: 40 haftalık çubuk, üç ay, bebeğin boyu (haşhaş tanesinden karpuza), ultrason notu, doğuma kalan süre.</li>
        <li><b>🧪 Gebelik testi</b> ve 💬 Ona yaz.</li></ul>` },
    { icon: '🎭', title: 'Gizli İtiraf', sub: 'aldatma itirafları, isimsiz', body: `
      <p>Kadın ve erkek, isimsiz ${CF_POOL.length} itiraf; hepsi <b>aldatma</b> üstüne ve fantezi dozu yüksek: kocası maç izlerken üst katta olanlar, düğünden önceki gece, balayında spa'da, yerçekimsiz simülatörde, aynı otelde yan yana odalarda yakalananlar… Kimi bir satır, kimi küçük bir hikaye.</p>
      <ul><li>Sıra her açılışta karışık; <b>🎲 Karıştır</b> yeniden karıştırır, ⬇️ Daha fazla 20'şer açar.</li>
        <li>Süz: 👩 Kadınlar · 👨 Erkekler · 📜 Uzun · ⚡ Kısa.</li>
        <li>🔥 😂 😳 ile tepki ver (bu açılışlık).</li></ul>
      <p>İtiraflar karakterlerine bağlı değildir; sohbette fikir arıyorsan ilham için oku 😏</p>` },
    { icon: '🗄️', title: 'Nerede saklanır?', sub: 'kayıt ve yedek', body: `
      <table class="bk-t"><tr><th>Ne</th><th>Nerede</th></tr>
        <tr><td>Karakterler, sohbetler, gardırop, Güven / Aşk, CarmenShop siparişleri, oyuncak olayları</td><td>normal kayıt (💾 yedeğe girer)</td></tr>
        <tr><td>İlan kızları, yorumların, Fans abonelik ve alınanlar, Stay rezervasyon listesi, Flix izlediklerin ve listen</td><td>sadece bu tarayıcı</td></tr></table>
      <p>Ücretler gösterim içindir; cüzdan ya da bakiye yok.</p>` }
  ] });
  const bookBy =id => BOOKS.find(b => b.id === id) || BOOKS[0];
  const bookAt = (id, v) => { const n = bookBy(id).chapters.length, k = 'amor-stories:book' + (id && id !== 'carmen' ? ':' + id : ''); try { if (v != null) localStorage.setItem(k, String(v)); return Math.max(0, Math.min(n - 1, +localStorage.getItem(k) || 0)); } catch (e) { return v || 0; } };
  // 📖 kitap ayrı bir sayfa (#/kitap/<kitap>/<bölüm>); geri düğmesi kitabı açtığın sayfaya döner
  function openBook(id, i) {
    if (typeof id === 'number') { i = id; id = 'carmen'; }
    const n = bookBy(id).chapters.length;
    if (!String(location.hash).startsWith('#/kitap')) ui.bookBack = location.hash || '#/me';
    location.hash = `#/kitap/${bookBy(id).id}/${Math.max(0, Math.min(n - 1, i == null ? bookAt(id) : i))}`;
  }
  function renderBook(bid, i) {
    const bk = bookBy(bid), BOOK = bk.chapters;
    let at = Math.max(0, Math.min(BOOK.length - 1, isNaN(i) ? bookAt(bk.id) : i));
    let hl = '';
    view.innerHTML = `<div class="page-pad narrow book-page" data-book="${bk.id}">${pageHero('kitap-' + bk.id, bk.icon, bk.title, [`${BOOK.length} bölüm`, ...bk.chips], `<button type="button" class="btn ghost sm pg-act" id="bkSnd" title="Sayfa çevirme sesi">${pageSfxOn() ? '🔊' : '🔇'}</button>`, { back: ui.bookBack || '#/me' })}
      <div class="bk-shelf-mini">${BOOKS.map(b => `<a class="${b === bk ? 'on' : ''}" href="#/kitap/${b.id}/${bookAt(b.id)}">${b.icon} ${esc(b.title)}</a>`).join('')}</div>
      <div class="bk-search"><input id="bkQ" type="search" placeholder="🔍 Kitapta ara… (ör. eşik, kondom, puan)" autocomplete="off"><div id="bkRes" class="bk-res" hidden></div></div>
      <div class="bk-nav" id="bkNav"></div>
      <div class="card book" id="bookPg"></div></div>`;
    const pg = $('#bookPg'), nav = $('#bkNav'), q = $('#bkQ'), res = $('#bkRes');
    const go = nx => { const d = nx > at ? 'next' : nx < at ? 'prev' : ''; at = nx; show(d); };
    nav.onclick = e => { const b = e.target.closest('[data-bkgo]'); if (b) go(+b.dataset.bkgo); };
    $('#bkSnd').onclick = e => { pageSfxOn(!pageSfxOn()); e.currentTarget.textContent = pageSfxOn() ? '🔊' : '🔇'; if (pageSfxOn()) sfx('page'); };
    // 🔍 arama: bölüm adları ve metinleri; sonuca dokununca bölüm açılır, kelime işaretlenir
    const plain = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' '); };
    const texts = BOOK.map(c => plain(c.body));
    q.oninput = () => {
      const s = q.value.trim().toLocaleLowerCase('tr');
      if (s.length < 2) { res.hidden = true; return; }
      const hits = BOOK.map((c, j) => { const t = texts[j], k = t.toLocaleLowerCase('tr').indexOf(s), inT = c.title.toLocaleLowerCase('tr').includes(s); return (k >= 0 || inT) && { j, c, snip: k >= 0 ? t.slice(Math.max(0, k - 40), k + s.length + 60) : c.sub, n: t.toLocaleLowerCase('tr').split(s).length - 1 }; }).filter(Boolean);
      res.hidden = false;
      const mark = t => esc(t).replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`);
      res.innerHTML = hits.length ? hits.map(h => `<button type="button" data-bkhit="${h.j}"><b>${h.c.icon} ${esc(h.c.title)}</b><small>…${mark(h.snip)}…${h.n > 1 ? ` <em>(${h.n})</em>` : ''}</small></button>`).join('') : '<div class="bk-none">Bulunamadı</div>';
    };
    res.onclick = e => { const b = e.target.closest('[data-bkhit]'); if (!b) return; hl = q.value.trim(); res.hidden = true; go(+b.dataset.bkhit); };
    // 🔗 bölüm adları (ve takma adları) metinde bağlantı olur; 🔍 aranan kelime işaretlenir
    const decorate = body => {
      const walk = (fn, skip = 'A,CODE,MARK,BUTTON') => {
        const tw = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement.closest(skip.split(',').map(x => x.toLowerCase()).join(',')) || n.parentElement.closest('.bk-chat') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        const nodes = []; while (tw.nextNode()) nodes.push(tw.currentNode);
        nodes.forEach(fn);
      };
      // önce 🔍 işaret (işaretli kelime bağlantı olmaz), sonra 🔗 bağlantılar
      if (hl) {
        const s = hl.toLocaleLowerCase('tr');
        walk(n => {
          const k = n.data.toLocaleLowerCase('tr').indexOf(s);
          if (k < 0) return;
          const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + s.length);
          r.surroundContents(document.createElement('mark'));
        });
        const first = body.querySelector('mark');
        if (first) setTimeout(() => first.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
        hl = '';
      }
      BOOK.forEach((c, j) => {
        if (j === at) return;
        const words = [c.title, ...(BOOK_ALIAS[c.title] || [])];
        let done = false;
        walk(n => {
          if (done) return;
          for (const w of words) {
            const k = n.data.indexOf(w);
            if (k < 0) continue;
            const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + w.length);
            const a = document.createElement('a'); a.className = 'bk-link'; a.dataset.bkgo = j; a.title = `${c.icon} ${c.title}`;
            r.surroundContents(a); done = true; return;
          }
        });
      });
    };
    // 👤 seçili karakterin bu bölümle ilgili değerleri
    const meBox = ch => {
      const kinds = BOOK_ME[ch.title], cs = chars();
      if (!kinds || !cs.length) return '';
      const c = byId(bookCharId()) || cs[0], facts = bookMeFacts(c, kinds);
      if (!facts.length) return '';
      return `<aside class="bk-me"><div class="bk-me-h">${avatar(c, 28)}<b>Senin karakterin</b><select data-bkchar aria-label="Karakter">${cs.map(x => `<option value="${x.id}"${x === c ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
        <ul>${facts.map(f => `<li>${f}</li>`).join('')}</ul></aside>`;
    };
    // 📘 sözlük terimleri: bölümde ilk geçtiği yer altı noktalı olur
    const glossify = body => {
      const used = new Set(), skip = 'a,code,mark,button,.bk-term,.bk-chat,.bk-me,h4,th';
      GLOSS.forEach(([w]) => {
        const re = new RegExp(`(^|[^\\p{L}])(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}])`, w === 'Cum' || w === 'Mode' ? 'u' : 'iu');
        const tw = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
        while (!used.has(w) && tw.nextNode()) {
          const n = tw.currentNode, m = re.exec(n.data);
          if (!m) continue;
          const k = m.index + m[1].length, r = document.createRange();
          r.setStart(n, k); r.setEnd(n, k + m[2].length);
          const s = document.createElement('span'); s.className = 'bk-term'; s.dataset.term = w; s.tabIndex = 0;
          r.surroundContents(s); used.add(w);
        }
      });
    };
    const closeTip = () => document.querySelectorAll('.bk-tip').forEach(x => x.remove());
    const openTip = t => {
      closeTip();
      const g = glossOf(t.dataset.term);
      if (!g) return;
      const d = document.createElement('div');
      d.className = 'bk-tip';
      d.innerHTML = `<b>${esc(g[0])}</b><p>${esc(g[1])}</p>${g[2] && g[2] !== BOOK[at].title ? `<button type="button" data-tipgo="${esc(g[2])}">📖 ${esc(g[2])} ›</button>` : ''}`;
      document.body.appendChild(d);
      const r = t.getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight;
      d.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
      d.style.top = (r.bottom + h + 12 < innerHeight ? r.bottom + 8 : Math.max(8, r.top - h - 8)) + 'px';
      d.onclick = e => {
        const b = e.target.closest('[data-tipgo]');
        if (!b) return;
        closeTip();
        const [id, j] = bookIdx(b.dataset.tipgo);
        if (id === bk.id) go(j); else openBook(id, j);
      };
    };
    if (!ui.bkTipWired) {
      ui.bkTipWired = true;
      document.addEventListener('click', e => { if (!e.target.closest('.bk-tip, .bk-term')) closeTip(); });
      window.addEventListener('scroll', closeTip, { passive: true });
      window.addEventListener('hashchange', closeTip);
    }
    const show = dir => {
      closeTip();
      bookAt(bk.id, at);
      if (dir) sfx('page');
      history.replaceState(null, '', `#/kitap/${bk.id}/${at}`);
      nav.innerHTML = BOOK.map((c, j) => `<button type="button" data-bkgo="${j}" class="${j === at ? 'on' : ''}" title="${esc(c.title)}"><span>${c.icon}</span><small>${j + 1}</small></button>`).join('');
      const on = nav.querySelector('.on');
      if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
      const ch = BOOK[at];
      pg.innerHTML = `<span class="bk-ribbon" aria-hidden="true"></span>
        <div class="bk-leaf${dir ? ' turn-' + dir : ''}">
        <div class="bk-head"><span class="bk-ic">${ch.icon}</span><div><small>${at + 1}. bölüm · ${BOOK.length}</small><h3>${esc(ch.title)}</h3><em class="bk-sub">${esc(ch.sub)}</em></div></div>
        <div class="bk-body">${ch.body}</div>
        ${meBox(ch)}
        ${BOOK_LIA[ch.title] ? `<aside class="bk-lia"><span class="bk-lia-ava">${liaAva()}</span><p>${esc(BOOK_LIA[ch.title])}</p></aside>` : ''}
        <div class="bk-pno">— ${at + 1} —</div></div>
        <div class="bk-foot">
          <button type="button" data-bk="-1"${at ? '' : ' disabled'}>‹ ${at ? esc(BOOK[at - 1].title) : ''}</button>
          <button type="button" data-bk="toc" title="İçindekiler">📑</button>
          <button type="button" data-bk="1"${at < BOOK.length - 1 ? '' : ' disabled'}>${at < BOOK.length - 1 ? esc(BOOK[at + 1].title) : ''} ›</button>
        </div>`;
      decorate(pg.querySelector('.bk-body'));
      if (!ch.glossary) glossify(pg.querySelector('.bk-body'));
      const sel = pg.querySelector('[data-bkchar]');
      if (sel) sel.onchange = () => { bookCharId(sel.value); show(''); };
      // 🧩 etkileşimli bölüm (💞 seans tasarımcısı)
      if (ch.interactive === 'designer') seansDesigner(pg.querySelector('.bk-body'));
      if (dir) window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pg.onclick = e => {
      const tm = e.target.closest('.bk-term');
      if (tm) { openTip(tm); return; }
      const tr = e.target.closest('[data-bktry]'), lk = e.target.closest('.bk-body [data-bkgo]'), sz = e.target.closest('[data-bkseans]');
      if (tr) { ui.botLabText = tr.dataset.bktry; location.hash = '#/deney'; return; }
      // 💞 seans türünü tasarımcıda aç
      if (sz) { seansLoad(sz.dataset.bkseans); go(BOOK.findIndex(c => c.interactive === 'designer')); return; }
      if (lk) { e.preventDefault(); go(+lk.dataset.bkgo); return; }
      const b = e.target.closest('[data-bk]');
      if (!b) return;
      if (b.dataset.bk === 'toc') {
        pg.innerHTML = `<span class="bk-ribbon" aria-hidden="true"></span><div class="bk-leaf turn-prev"><div class="bk-head"><span class="bk-ic">📑</span><div><small>${esc(bk.title)}</small><h3>İçindekiler</h3></div></div><div class="book-toc">${BOOK.map((ch, j) => `<button type="button" data-bkgo="${j}" class="${j === at ? 'on' : ''}"><span class="bk-n">${j + 1}</span><span class="bk-ic">${ch.icon}</span><b>${esc(ch.title)}</b><small>${esc(ch.sub)}</small></button>`).join('')}</div></div>`;
        pg.querySelectorAll('[data-bkgo]').forEach(x => x.onclick = ev => { ev.stopPropagation(); at = +x.dataset.bkgo; show(''); });
        return;
      }
      const d = +b.dataset.bk;
      at = Math.max(0, Math.min(BOOK.length - 1, at + d));
      show(d > 0 ? 'next' : 'prev');
    };
    // kaydırarak sayfa çevir
    let x0 = null;
    pg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    pg.addEventListener('touchend', e => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 60) return;
      const d = dx < 0 ? 1 : -1, nx = at + d;
      if (nx < 0 || nx >= BOOK.length || !pg.querySelector('.bk-body')) return;
      at = nx; show(d > 0 ? 'next' : 'prev');
    });
    show('');
  }
  /* 🧪 Bot deneyi sayfası (#/deney, Ben → ❓ Yardım'dan): seçilen karaktere bir mesaj, olay ya da durum verilir; uyan bütün kurallar
   * puanıyla ve karakter için doldurulmuş bütün cevaplarıyla listelenir. Sohbete hiçbir şey yazılmaz, değerler değişmez */
  function renderBotLab() {
    const D = Stories.BOT_RULES || { rules: [] }, B = Stories.Bot, low = s => String(s || '').toLocaleLowerCase('tr');
    const states = [...new Set(D.rules.map(r => r.when || []).filter(w => w[0] === '=durum' && w[1]).map(w => w[1].slice(1)))].sort();
    const evs = allEvents().slice().sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    const lab = ui.botLab || (ui.botLab = { mode: 'msg', text: '', ev: '', st: states[0] || '', mood: '', poz: '', sec: 'tr' });
    // 🧪 deney karakteri: kayıtlı karakterlere dokunmadan burada kurulur (şablondan, rastgele ya da boş)
    const labFrom = c => JSON.parse(JSON.stringify({ name: c.name || 'Deney', traits: c.traits || [], likes: c.likes || [], dislikes: c.dislikes || [], allows: c.allows || [], denies: c.denies || [], fields: c.fields || {}, params: c.params || {}, wardrobe: c.wardrobe || [], outfit: c.outfit || {} }));
    const labRandom = () => { const d = blankChar(), mod = ui.createMod; ui.createMod = 'amor'; randomize(d, 'all'); ui.createMod = mod; return labFrom(d); };
    if (!lab.fake) lab.fake = chars()[0] ? labFrom(chars()[0]) : labRandom();
    view.innerHTML = `<div class="page-pad narrow monia">${pageHero('deney', '🧪', 'Bot deneyi', [`${D.rules.length} kural`, 'kendi deney karakterin'], '', { back: '#/me' })}
      <div class="about card">Deney karakterini kendin kur (özellikler, ❤️ / 💔, ✅ / 🚫, değerler); sonra 💬 mesaj yaz, 📜 olay ya da 📊 durum seç. Uyan bütün kurallar puanıyla, 🏆 kazananıyla ve bütün cevaplarıyla listelenir. Kayıtlı karakterler ve sohbetler değişmez.</div>
      <div class="card lab-char" id="labChar"></div>
      <div class="card" id="labBody"></div>
      <div class="card lab-miss" id="labMiss"></div></div>`;
    const body = $('#labBody'), cbox = $('#labChar'), mbox = $('#labMiss');
    // 📖 kitaptaki "▶ dene" bu mesajla gelir
    if (ui.botLabText) { lab.mode = 'msg'; lab.text = ui.botLabText; ui.botLabText = null; }
    // 📭 eksik cevap raporu: sohbette yedek cevaba düşen mesajlar, en çok tekrarlanan başta
    const drawMiss = () => {
      const L = (S().botMiss || []).slice().sort((a, b) => b.n - a.n || b.at - a.at);
      mbox.innerHTML = `<div class="sec-title" style="margin-top:0">📭 Eksik cevaplar <small>· sohbette hiçbir kural tutmayıp yedek cevaba düşen mesajlar (${L.length})</small></div>
        ${L.length ? `<div class="lab-mlist">${L.map(x => `<div class="lab-mrow"><button type="button" class="lab-mtx" data-mtry="${esc(x.k)}"><b>${esc(x.t)}</b><small>×${x.n} · ${esc(x.ch || '')} · ${esc(fmtTime(x.at))}</small></button><button type="button" class="lab-mx" data-mdel="${esc(x.k)}" aria-label="Sil">✕</button></div>`).join('')}</div>
          <button type="button" class="btn ghost block sm" data-mclear="1" style="margin-top:8px">🧹 Listeyi temizle</button>`
        : '<div class="about">Henüz yok. Bot modunda karakterin anlamadığı (yedek cevap verdiği) mesajlar burada toplanır; dokununca burada denersin, sonra Bot editöründe kuralını yazarsın.</div>'}`;
    };
    mbox.onclick = e => {
      const tr = e.target.closest('[data-mtry]'), dl = e.target.closest('[data-mdel]'), cl = e.target.closest('[data-mclear]');
      if (tr) { const x = (S().botMiss || []).find(m => m.k === tr.dataset.mtry); lab.mode = 'msg'; lab.text = x ? x.t : tr.dataset.mtry; draw(); window.scrollTo({ top: body.offsetTop - 80, behavior: 'smooth' }); return; }
      if (dl) { S().botMiss = (S().botMiss || []).filter(m => m.k !== dl.dataset.mdel); save(); drawMiss(); }
      if (cl && confirm('Eksik cevap listesi temizlensin mi?')) { S().botMiss = []; save(); drawMiss(); }
    };
    const opt = (v, cur, l) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`;
    const drawChar = () => {
      const f = lab.fake, has = v => f.traits.includes(v), hamile = charFields().some(x => x.id === 'hamile');
      const feelIc = id => f.likes.includes(id) ? '❤️' : f.dislikes.includes(id) ? '💔' : '', permIc = id => f.allows.includes(id) ? '✅' : f.denies.includes(id) ? '🚫' : '';
      const chips = (evs, ic, attr) => evs.map(e => { const s = ic(e.id); return `<button type="button" class="lab-chip${s ? ' on' : ''}" ${attr}="${esc(e.id)}">${s ? s + ' ' : ''}${esc(e.title)}</button>`; }).join('');
      const SECS = [['tr', '🧬 Özellikler'], ['fe', '❤️ Sever / 💔'], ['pm', '✅ İzin / 🚫'], ['wr', '👗 Giyim'], ['pv', '📊 Değerler']];
      const o = f.outfit || {};
      const wearHtml = () => `<div class="lab-chips" style="margin:6px 0 10px"><button type="button" class="lab-chip" data-labw="rnd">🎲 Kombin</button><button type="button" class="lab-chip" data-labw="naked">🫣 Hepsini çıkar</button>
          ${(CL.combos || []).map(k => `<button type="button" class="lab-chip" data-labw="${k.id}">${k.emoji} ${esc(k.name)}${k.fant ? ' 🎭' : ''}</button>`).join('')}</div>
        ${CL.slots.map(s => `<div class="lab-row"><small>${s.icon} ${esc(s.label)}</small><select data-labwear="${s.id}"><option value="">🚫 Yok</option>${CL.items.filter(x => x.slot === s.id).map(x => opt(x.id, o[s.id] || '', `${x.emoji} ${x.name}${x.style === 'i' ? ' 🔥' : x.style === 'k' ? ' 🎭' : ''}`)).join('')}</select></div>`).join('')}`;
      cbox.innerHTML = `<div class="lab-ch-h"><input id="labName" maxlength="40" value="${esc(f.name)}" aria-label="Ad">
          <button type="button" class="btn ghost sm" data-labc="rnd">🎲 Rastgele</button><button type="button" class="btn ghost sm" data-labc="blank">↺ Boş</button></div>
        <div class="field"><select id="labTpl"><option value="">📋 Kayıtlı karakterden kopyala…</option>${chars().map(c => opt(c.id, '', c.name)).join('')}</select></div>
        <div class="lab-seg sm">${SECS.map(([k, l]) => `<button type="button" data-labsec="${k}" class="${lab.sec === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        <div class="lab-sec">${lab.sec === 'tr' ? T.groups.map(g => g.single
          ? `<div class="lab-row"><small>${esc(g.label)}</small><select data-labtr="${esc(g.id)}"><option value="">(yok)</option>${g.values.map((v, i) => opt(v, f.traits.find(x => g.values.includes(x)) || '', g.items[i])).join('')}</select></div>`
          : `<div class="lab-row"><small>${esc(g.label)}</small><div class="lab-chips">${g.values.map(v => `<button type="button" class="lab-chip${has(v) ? ' on' : ''}" data-labtg="${esc(v)}">${esc(v)}</button>`).join('')}</div></div>`).join('')
          + (hamile ? `<label class="flt-row"><span><b>🤰 Hamile</b></span><input type="checkbox" id="labPreg"${f.fields.hamile ? ' checked' : ''}></label>` : '')
        : lab.sec === 'fe' ? `<small class="lab-hint">Dokun: ❤️ → 💔 → hiçbiri</small><div class="lab-chips">${chips([...feelPool(), ...fantPool()], feelIc, 'data-labfe')}</div>`
        : lab.sec === 'pm' ? `<small class="lab-hint">Dokun: ✅ → 🚫 → hiçbiri</small><div class="lab-chips">${chips(permPool(), permIc, 'data-labpm')}</div>`
        : lab.sec === 'wr' ? wearHtml()
        : allParams().filter(p => p.who !== 'me').map(p => `<div class="lab-row"><small>${esc(p.icon || '')} ${esc(p.label)} <b data-labpv="${esc(p.id)}">${paramVal(f, p)}</b></small><input type="range" min="${+p.min || 0}" max="${p.max == null ? 100 : +p.max}" value="${paramVal(f, p)}" data-labp="${esc(p.id)}"></div>`).join('')}</div>`;
    };
    const refresh = () => { drawChar(); draw(); };
    cbox.onclick = e => {
      const f = lab.fake, b = e.target.closest('[data-labc],[data-labsec],[data-labtg],[data-labfe],[data-labpm],[data-labw]');
      if (!b) return;
      // 👗 kombin / hepsini çıkar / hazır kombin
      const lw = b.dataset.labw, cb = lw && (CL.combos || []).find(k => k.id === lw);
      if (lw === 'rnd') f.outfit = randOutfit((f.wardrobe || []).length ? f : { wardrobe: CL.items.map(x => x.id) });
      if (lw === 'naked') f.outfit = {};
      if (cb) f.outfit = { ...cb.parts };
      const cyc = (id, a, z) => { if (f[a].includes(id)) { f[a] = f[a].filter(x => x !== id); f[z].push(id); } else if (f[z].includes(id)) f[z] = f[z].filter(x => x !== id); else f[a].push(id); };
      if (b.dataset.labc === 'rnd') lab.fake = labRandom();
      if (b.dataset.labc === 'blank') lab.fake = labFrom({ name: 'Deney' });
      if (b.dataset.labsec) { lab.sec = b.dataset.labsec; return drawChar(); }
      if (b.dataset.labtg) { const v = b.dataset.labtg; f.traits = f.traits.includes(v) ? f.traits.filter(x => x !== v) : [...f.traits, v]; }
      if (b.dataset.labfe) cyc(b.dataset.labfe, 'likes', 'dislikes');
      if (b.dataset.labpm) cyc(b.dataset.labpm, 'allows', 'denies');
      refresh();
    };
    cbox.onchange = e => {
      const t = e.target, f = lab.fake;
      if (t.id === 'labName') f.name = t.value.trim() || 'Deney';
      if (t.id === 'labTpl' && t.value) lab.fake = labFrom(byId(t.value));
      if (t.id === 'labPreg') f.fields.hamile = t.checked;
      if (t.dataset.labtr) { const g = T.groups.find(x => x.id === t.dataset.labtr); f.traits = [...f.traits.filter(x => !g.values.includes(x)), ...(t.value ? [t.value] : [])]; }
      if (t.dataset.labp) f.params[t.dataset.labp] = +t.value;
      if (t.dataset.labwear) {
        const s = t.dataset.labwear, o2 = f.outfit = { ...(f.outfit || {}), [s]: t.value };
        if (s === 'elbise' && t.value) { o2.ust = ''; o2.alt = ''; }
        if ((s === 'ust' || s === 'alt') && t.value) o2.elbise = '';
      }
      refresh();
    };
    cbox.oninput = e => { const t = e.target; if (t.dataset.labp) { const o = cbox.querySelector(`[data-labpv="${CSS.escape(t.dataset.labp)}"]`); if (o) o.textContent = t.value; } };
    // mesaj / olay / durum için sorgu ve aday kurallar
    const query = () => {
      if (lab.mode === 'msg') return lab.text;
      if (lab.mode === 'st') return `durum ${lab.st}`;
      const e = evs.find(x => x.id === lab.ev);
      if (!e) return '';
      const pos = lab.poz && evs.find(x => x.id === lab.poz), fn = !isFant(e) && lab.fant && evs.find(x => x.id === lab.fant);
      return `evt ${(e.tags || []).join(' ')} ${catOfEv(e).label || ''} ${e.title}${fn ? ` fant ${fantKey(fn)}` : ''}${pos ? ` poz ${pos.title} ${catOfEv(pos).label || ''}` : ''}`;
    };
    // 👗 kıyafet baloncuğu: bu mesaj / olayda karakterin giydiklerine göre söyleyebileceği bütün cümleler (sohbette biri rastgele)
    const wearLab = (ch, hit) => {
      const o = ch.outfit || {};
      const zone = z => (z === 'gogus' ? ['elbise', 'ust', 'sutyen'] : z === 'kalca' ? ['elbise', 'alt', 'tanga', 'corap'] : WEAR_ORDER).map(s => clItem(o[s])).filter(Boolean);
      const list = (z, k) => zone(z).flatMap(x => (x[k] || []).map(l => `${x.emoji} ${l}`));
      let title = '', lines = [];
      if (lab.mode === 'msg') {
        const ids = hit.map(r => String(r.id));
        if (ids.some(i => /^r_cmd_meme/.test(i))) { title = 'göster (göğüs)'; lines = list('gogus', 'show'); }
        else if (ids.some(i => /^r_cmd_(kalca|kaldir)/.test(i))) { title = 'göster (kalça)'; lines = list('kalca', 'show'); }
        else if (ids.includes('r_cmd_goster')) { title = 'soyun'; lines = [...list('gogus', 'off'), ...list('kalca', 'off')]; }
      } else if (lab.mode === 'ev') {
        const e = evs.find(x => x.id === lab.ev);
        if (!e) return '';
        const t = low(e.title), cat = low(catOfEv(e).label), tags = (e.tags || []).map(low);
        if (isFant(e)) {
          const key = fantKey(e), cos = CL.items.filter(x => x.fant === key), cb = (CL.combos || []).find(k => k.fant === key);
          title = 'fantezi: kostümünü giyer';
          lines = cos.length ? cos.flatMap(x => x.t.map(l => `${x.emoji} ${l}`)) : cb ? cb.say.map(l => `${cb.emoji} ${l}`) : [];
        } else if (t === 'show tits') { title = 'Show Tits'; lines = list('gogus', 'show'); }
        else if (t === 'show ass') { title = 'Show Ass'; lines = list('kalca', 'show'); }
        else if (isPosEv(e) && cat === 'foreplay') { title = 'ön sevişmede bahseder (%30)'; lines = list('any', 't'); }
        else if (isPosEv(e) && tags.includes('göğüs')) { title = 'sohbette ilk kez soyunur (göğüs)'; lines = list('gogus', 'off'); }
        else if (isPosEv(e) && (tags.includes('vajinal') || tags.includes('anal') || tags.includes('kalça') || cat === 'eat')) { title = 'sohbette ilk kez soyunur (kalça)'; lines = list('kalca', 'off'); }
      }
      if (!title) return '';
      return `<div class="sec-title">👗 Kıyafet baloncuğu · ${esc(title)} <small>(${lines.length})</small></div><div class="lab-rule"><ol>${lines.map(l => `<li>${esc(l)}</li>`).join('') || '<li>Üstünde bu bölgede bir şey yok (👗 Giyim\'den giydir)</li>'}</ol><small class="lab-w">sohbette biri rastgele gelir (çoğu zaman dış katman); her bölge bir sohbette bir kez</small></div>`;
    };
    const run = () => {
      const ch = lab.fake, q = query(), msg = B.norm(lab.mood ? `${q} ${lab.mood}` : q);
      const hit = q ? D.rules.filter(r => (r.reply || []).length && B.fits(r, ch) && (r.when || []).length && B.inOrder(msg, r.when, D)) : [];
      // sohbetteki yolları ayrı göster: ❤️/💔 kuralları, 🎭 kişilik (olaylarda yarı yarıya), sonra normal
      const groups = [
        ['❤️ / 💔 önce bunlara bakılır', hit.filter(r => lab.mood && r.when.includes('=' + lab.mood))],
        ['🎭 kişilik (olaylarda yarı yarıya önce)', lab.mode !== 'st' ? hit.filter(r => String(r.id).startsWith('r_pk_') && !r.when.includes('=durum')) : []],
        ['Normal (en yüksek puan kazanır, eşitse rastgele)', hit.filter(r => !(lab.mood && r.when.includes('=' + lab.mood)) && !(lab.mode !== 'st' && String(r.id).startsWith('r_pk_')))]
      ];
      const fill = s => fillTraits(String(s).replace(/\{sen\}/gi, hitapOf(ch)).replace(/\{ben\}/gi, (ch.name || '').split(' ')[0]), ch, { olay: (evs.find(x => x.id === lab.ev) || {}).title, text: lab.text, orgN: 0, cumN: 0 });
      // 🔓 mesajda gevşek eşleşenler (sırası farklı / bir kelimesi eksik), düşük puanla
      const lsc = new Map(lab.mode === 'msg' && q ? D.rules.filter(r => (r.reply || []).length && B.fits(r, ch) && (r.when || []).length && !hit.includes(r)).map(r => [r, B.looseScore(msg, r, D)]).filter(([, s]) => s > 0) : []);
      groups.push(['🔓 Gevşek eşleşme (sırası farklı ya da bir kelimesi eksik)', [...lsc.keys()]]);
      const scOf = r => (lsc.has(r) ? lsc.get(r) : B.score(r));
      const card = (r, top) => `<div class="lab-rule${top ? ' win' : ''}"><div class="lab-h"><b>${esc(r.name || r.id)}</b><small>${esc(r.category || '')} · ${scOf(r)} puan${(r.traits || []).length ? ' · ' + esc(r.traits.join(', ')) : ''}${top ? ' · 🏆' : ''}</small></div>
        <ol>${r.reply.map(x => `<li>${esc(fill(x)).replace(/\|\|/g, '<i> ‖ </i>')}</li>`).join('')}</ol><small class="lab-w">when: ${esc((r.when || []).join(' , '))}</small></div>`;
      const out = groups.filter(([, rs]) => rs.length).map(([t, rs]) => { const top = Math.max(...rs.map(scOf)), sorted = rs.slice().sort((a, b) => scOf(b) - scOf(a));
        return `<div class="sec-title">${esc(t)} <small>(${rs.length})</small></div>${sorted.map(r => card(r, scOf(r) === top)).join('')}`; }).join('');
      const fb = lab.mode === 'msg' && !hit.length && !lsc.size ? D.rules.filter(r => !(r.when || []).length && (r.reply || []).length && B.fits(r, ch)) : [];
      const wl = wearLab(ch, hit);
      if (out) return out + wl;
      return wl + (fb.length ? `<div class="sec-title">Hiçbir kural tutmadı → yedek cevap</div>${fb.map(r => card(r, true)).join('')}` : `<div class="about">${q ? (lab.mode === 'ev' ? 'Bu olaya cevap veren kural yok: karakter sessiz kalır.' : 'Uyan kural yok.') : 'Bir şey yaz ya da seç.'}</div>`);
    };
    const draw = () => {
      const posEvs = evs.filter(e => (catOfEv(e).tags || []).includes(CHAT_TOP_TAG)), cur = evs.find(x => x.id === lab.ev), cum = cur && (cur.tags || []).some(t => low(t) === 'boşalma');
      body.innerHTML = `
        <div class="lab-seg" style="margin-top:0">${[['msg', '💬 Mesaj'], ['ev', '📜 Olay'], ['st', '📊 Durum']].map(([k, l]) => `<button type="button" data-labm="${k}" class="${lab.mode === k ? 'on' : ''}">${l}</button>`).join('')}</div>
        ${lab.mode === 'msg' ? `<div class="field"><input id="labText" maxlength="200" value="${esc(lab.text)}" placeholder="ör. memelerin kaç beden · aç memeni · 18 santim aletim var"></div>` : ''}
        ${lab.mode === 'ev' ? `<div class="field"><select id="labEv"><option value="">Olay seç…</option>${evs.map(e => opt(e.id, lab.ev, `${e.title} · ${catOfEv(e).label || ''}`)).join('')}</select></div>
          ${cum || isFant(cur) ? `<div class="field"><label>Hangi pozisyondayken?</label><select id="labPoz"><option value="">(yok)</option>${posEvs.map(e => opt(e.id, lab.poz, e.title)).join('')}</select></div>` : ''}
          ${cur && !isFant(cur) ? `<div class="field"><label>🦄 Hangi fantezideyken?</label><select id="labFant"><option value="">(yok)</option>${evs.filter(isFant).map(e => opt(e.id, lab.fant, e.title)).join('')}</select></div>` : ''}` : ''}
        ${lab.mode === 'st' ? `<div class="field"><select id="labSt">${states.map(s => opt(s, lab.st, s)).join('')}</select></div>` : ''}
        ${lab.mode !== 'st' ? `<div class="lab-seg sm">${[['', 'Normal'], ['sever', '❤️ sever'], ['sevmez', '💔 sevmez']].map(([k, l]) => `<button type="button" data-labmood="${k}" class="${lab.mood === k ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}
        <div class="lab-out">${run()}</div>`;
      const on = (sel, ev, fn) => { const el = body.querySelector(sel); if (el) el[ev] = fn; };
      on('#labEv', 'onchange', e => { lab.ev = e.target.value; lab.poz = ''; draw(); });
      on('#labPoz', 'onchange', e => { lab.poz = e.target.value; draw(); });
      on('#labFant', 'onchange', e => { lab.fant = e.target.value; draw(); });
      on('#labSt', 'onchange', e => { lab.st = e.target.value; draw(); });
      on('#labText', 'onchange', e => { lab.text = e.target.value; draw(); });
      const t = body.querySelector('#labText');
      if (t) t.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); lab.text = t.value; draw(); setTimeout(() => { const n = body.querySelector('#labText'); if (n) { n.focus(); n.selectionStart = n.selectionEnd = n.value.length; } }, 0); } };
    };
    body.onclick = e => {
      const m = e.target.closest('[data-labm]'), md = e.target.closest('[data-labmood]');
      if (m) { lab.mode = m.dataset.labm; draw(); }
      if (md) { lab.mood = md.dataset.labmood; draw(); }
    };
    drawChar();
    draw();
    drawMiss();
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
        <button type="button" class="mu-bg mu-dl${ui.muDl === t.id ? ' busy' : ''}" data-mudl title="${t.file ? 'İndir (mp3)' : 'İndir (wav)'}">${ui.muDl === t.id ? '⏳' : '⬇️'}</button>
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
      // ⬇️ indir: üretilen parça önce dosyaya işlenir (birkaç saniye)
      if (e.target.closest('[data-mudl]') && !ui.muDl) {
        const t = MU.byId(id);
        ui.muDl = id; draw();
        if (!t.file) notify(`${t.icon} ${t.name} hazırlanıyor…`, '⬇️');
        MU.exportTrack(id).then(r => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(r.blob); a.download = r.name;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          notify(`İndirildi: ${r.name}`, '⬇️');
        }, err => notify(err.message || 'İndirilemedi', '⚠️')).finally(() => { ui.muDl = null; if (alive()) draw(); });
      }
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
            <div class="sec-title" style="margin-top:0">🌙 Tema</div>
            <div class="theme-pick" id="themePick">${[['light', '☀️ Açık'], ['dark', '🌙 Koyu'], ['auto', '📱 Sistem']].map(([k, l]) => `<button type="button" data-theme-set="${k}" class="${themePref() === k ? 'on' : ''}">${l}</button>`).join('')}</div>
            <div class="sec-title">💬 Sohbet</div>
            <label class="flt-row"><span><b>💡 Lia önerileri</b> <small>sohbette sıradaki adımı ve tetiklenen olaylara göre öneriler</small></span><input type="checkbox" id="liaOn"${liaOn() ? ' checked' : ''}></label>
            <label class="flt-row"><span><b>🗺️ Mekan kartları</b> <small>sohbette otomatik mekan ve ipucu kartları · kapalıyken de senaryo olayları gelir</small></span><input type="checkbox" id="placesOn"${placesOn() ? ' checked' : ''}></label>
            <label class="flt-row"><span><b>📈 Değer değişimleri</b> <small>olay ve sonuç kartlarında ▲▼ değişimler (kapalıyken barlar ve 📊 kart yine gösterir)</small></span><input type="checkbox" id="chgOn"${chgOn() ? ' checked' : ''}></label>
            <label class="flt-row"><span><b>🔔 Efekt sesleri</b> <small>eşleşme, orgazm, hamilelik ve doğumda kısa sesler</small></span><input type="checkbox" id="sfxOn"${sfxOn() ? ' checked' : ''}></label>
            <label class="flt-row"><span><b>🎼 Moda göre müzik</b> <small>Mode olayı olunca uygun parça kendiliğinden çalar</small></span><input type="checkbox" id="modeMuOn"${modeMusicOn() ? ' checked' : ''}></label>
            <div class="sec-title">🔒 Gizlilik</div>
            <button type="button" class="btn ghost block" id="lockBtn">🔒 Uygulama kilidi${lockCfg() ? ' · açık' : ''}</button>
            <button type="button" class="btn ghost block" id="bossBtn" style="margin-top:8px">🙈 Patron geldi ekranını dene <small>(Esc iki kez · çıkmak için = tuşuna uzun bas)</small></button>
          </div>
        </section>

        <section class="me-sec" data-sec="veri">
          <div class="me-menu card">
            <a role="button" data-act="backup"><span class="mi">💾</span>Yedekle</a>
            <a role="button" data-act="restore"><span class="mi">📂</span>Yedekten yükle</a>
            <a role="button" data-act="charimport"><span class="mi">📥</span>Karakter içe aktar</a>
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
          ${crRules().length ? `<div class="cr-list">${crRules().map(r => `<span class="cr-rule"><b>${esc(crText(r))}</b> → 🚫 ${esc((r.not || []).map(crLabel).join(', '))}</span>`).join('')}</div>` : '<div class="about">Henüz kural yok. ör. Experience: Virgo → 🚫 Pussy Size: Loose. Oluştur\'da seçilemez, 🎲 rastgele de seçmez.</div>'}
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
        <div class="card book-card">
          <div class="sec-title" style="margin-top:0">📚 Kitaplık <small>· dokun, kaldığın yerden açılır</small></div>
          <div class="shelf">${BOOKS.map(b => { const at = bookAt(b.id); return `<button type="button" class="bk-cover c-${b.id}" data-bookopen="${b.id}">
            <span class="bc-spine"></span><span class="bc-ic">${b.icon}</span><b>${esc(b.title)}</b><small>${esc(b.sub)}</small>
            <em>${b.chapters.length} bölüm${at ? ` · ${at + 1}. bölümde` : ''}</em></button>`; }).join('')}</div>
          <div class="shelf-plank"></div>
        </div>
        <div class="card">
          <div class="sec-title" style="margin-top:0">🧪 Bot deneyi <small>· bir mesaj, olay ya da durum dene; karaktere uyan bütün cevapları ve hangisinin kazandığını gör</small></div>
          <button type="button" class="btn ghost block" id="botLabBtn">🧪 Deney sayfasına git</button>
        </div>
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
    $('#chgOn').onchange = e => chgOn(e.target.checked);
    $('#sfxOn').onchange = e => { sfxOn(e.target.checked); if (e.target.checked) sfx('match'); };
    $('#modeMuOn').onchange = e => modeMusicOn(e.target.checked);
    $('#lockBtn').onclick = () => lockSheet(() => { const b = $('#lockBtn'); if (b) b.textContent = `🔒 Uygulama kilidi${lockCfg() ? ' · açık' : ''}`; });
    $('#bossBtn').onclick = () => bossKey();
    $('#liaOn').onchange = e => liaOn(e.target.checked);
    $('#themePick').onclick = e => { const b = e.target.closest('[data-theme-set]'); if (!b) return; themePref(b.dataset.themeSet); applyTheme(); $('#themePick').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
    $('#sysCats').onclick = () => catSheet();
    $('#sysPull').onclick = () => sysPull().then(r => { if (!r) notify('Yerel sunucu yok: yerel-duzenleme.bat ile aç', '⚠️'); }, () => notify('Sistem dosyası okunamadı', '⚠️'));
    $('#moAllOut').onclick = exportAllMonia;
    $('#moAllIn').onclick = importScenarios;
    $('#moDedupe').onclick = () => { const n = dedupeMonia(); save(); notify(n ? `${n} kopya silindi` : 'Kopya bulunamadı', '🧹'); };
    $('#sysNow').onclick = () => sysPush(true).then(ok => { if (!ok) notify('Yerel sunucu yok: yerel-duzenleme.bat ile aç', '⚠️'); }, () => notify('Sistem kaydı yapılamadı', '⚠️'));
    view.querySelectorAll('[data-bookopen]').forEach(b => b.onclick = () => openBook(b.dataset.bookopen));
    $('#botLabBtn').onclick = () => { location.hash = '#/deney'; };
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
    $('[data-act=charimport]').onclick = () => importSheet();
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
  // iOS dokunmada pointerdown ses izni vermez, touchend verir
  const unlockMusic = e => {
    if (musicUnlocked || (e.type === 'pointerdown' && e.pointerType !== 'mouse')) return;
    musicUnlocked = true; syncMusic(true);
  };
  ['pointerdown', 'touchend', 'keydown'].forEach(t => document.addEventListener(t, unlockMusic, true));

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
  setupPositions();
  setupCumming();
  setupEat();
  setupBond();
  fixEvents1();
  fixZevk1();
  fixFant1();
  fixRole1();
  fixPain1();
  fixWear1();
  fixHold1();
  fixHotdog1();
  fixBreast1();
  setupBotOuts();
  initLock();
  dedupeAuto();
  // 📏 kural sonradan eklendiyse kayıtlı karakterlerin ✅/🚫 listeleri de uysun
  if (crFixAllPerms()) save();
  window.addEventListener('hashchange', render);
  // 📦 CarmenShop kargoları zamanı gelince teslim edilir
  shopTick();
  setInterval(shopTick, 15000);
  document.addEventListener('keydown', e => { if (ui.chatKeys) ui.chatKeys(e); });
  wideMQ.addEventListener('change', () => { if (['messages', 'chat'].includes(ui.route.name)) render(); });
  render();
  setTimeout(() => $('#splash').classList.add('hide'), 700);
})();
