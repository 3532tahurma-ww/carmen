/*
 * Rastgele karakter havuzları (🎲 düğmeleri buradan seçer)
 * Kadın isimleri, şehirler, meslekler ve isim süsleri Amor'un havuzundan gelir: js/data/amor-pools.js
 * (Amor/js/data/pools.js'in kopyası; Amor'da güncellersen dosyayı tekrar kopyalaman yeterli).
 *   eras   : isim dönemi → isimler (trend, modern, klasik, olgun); eraAge: dönem → yaş aralığı
 *   jobObjs: { title, min, max } meslekler (yaşa uygun olan seçilir)
 *   decos / styles / brackets / nicknames: 🎀 süslü isim için
 * Aşağıdaki listeler Amor havuzu yoksa ya da erkek karakterler için kullanılır; kendin de ekleme yapabilirsin.
 */
window.Stories = window.Stories || {};

Stories.Pools = (() => {
  const A = window.Amor || {};
  const own = {
  names: {
    '♀': ['Elif', 'Zeynep', 'Defne', 'Ece', 'Azra', 'Duru', 'Nehir', 'Melis', 'Ceren', 'Selin', 'İpek', 'Derin',
      'Asya', 'Lara', 'Ada', 'Su', 'Buse', 'Gizem', 'Yaren', 'Damla', 'Irmak', 'Naz', 'Beren', 'Esila'],
    '♂': ['Mert', 'Emir', 'Kerem', 'Arda', 'Can', 'Deniz', 'Ege', 'Kaan', 'Alp', 'Barış', 'Efe', 'Yiğit',
      'Onur', 'Burak', 'Doruk', 'Aras', 'Tuna', 'Umut', 'Ozan', 'Batu']
  },
  age: [18, 32],
  cities: ['İstanbul', 'İzmir', 'Ankara', 'Antalya', 'Bursa', 'Eskişehir', 'Muğla', 'Trabzon', 'Mersin', 'Çanakkale',
    'Kocaeli', 'Adana', 'Samsun', 'Konya', 'Denizli', 'Tekirdağ'],
  jobs: ['Öğrenci', 'Mimar', 'Grafik tasarımcı', 'Hemşire', 'Avukat', 'Barista', 'Yazılımcı', 'Fotoğrafçı',
    'Öğretmen', 'Psikolog', 'Diş hekimi', 'DJ', 'Model', 'Kuaför', 'Muhasebeci', 'Pilot', 'Veteriner',
    'Aşçı', 'İç mimar', 'Sosyal medya uzmanı', 'Doktor', 'Mühendis'],
  bios: ['kahvesiz konuşmam ☕', 'gece kuşu 🌙', 'bir gün her şey güzel olacak', 'deniz kokusu > her şey',
    'az konuşur çok düşünür', 'playlistim ruh halimdir 🎧', 'kitap, kedi, yağmur', 'hayat kısa, tatlı ye 🍰',
    'kendi filminin başrolü 🎬', 'ne olursan ol yine gel', 'sessiz ama derin', 'bugün de güneşi bekliyorum ☀️',
    'yolculuklar ve fotoğraflar 📸', 'dramaya yer yok', 'önce kahve sonra dünya', 'kalbim kırık ama makyajım yerinde 💄',
    // +100
    'gülüşüm bedava, kalbim değil 😌', 'bugün kendimi seçiyorum 💅', 'pazartesi sendromu kronik', 'yağmurda yürümeyi seven tek kişi ☔', 'çay demlendi, sen neredesin? 🫖',
    'kedimden izin aldım, yazabilirsin 🐈', 'gün batımı koleksiyoncusu 🌅', 'ruh eşimi playlistinden tanırım', 'sabahları konuşma, akşamları susma', 'biraz kaos, biraz huzur',
    'tatlı ama acı da sever 🌶️', 'kahve + kitap + yağmur = ben', 'kalbim yolda, ben evde', 'sessiz sinema sever 🎬', 'gece 3 düşünceleri 🌌',
    'kendime not: daha çok gül', 'bir bavul hayal 🧳', 'deniz görmeden uyuyamam 🌊', 'çiçek alana kalbimi veririm 🌷', 'aşk mı? önce bir kahve içelim',
    'mutluluk küçük şeylerde ✨', 'bugün yine kendimden yanayım', 'sarılmak terapidir 🫂', 'konser kaçırmam 🎤', 'hayallerim cebimden büyük',
    'yalnızlık bazen iyidir', 'pizza her zaman cevaptır 🍕', 'bir gün Paris 🗼', 'sabır da bir yetenek', 'cümlelerimi şarkılarla kurarım 🎶',
    'aynı anda hem melek hem şeytan 😇😈', 'kahkaham yüksek, kalbim yumuşak', 'en sevdiğim renk gün batımı', 'sınırlarım net, kalbim açık', 'sana uzaktan bakıyorum 👀',
    'film önerisi bekliyorum 🍿', 'yorgunum ama mutluyum', 'yeni başlangıçlar 🌱', 'eski şarkılar, yeni hikayeler', 'mavi her şeye bayılırım 💙',
    'göründüğüm kadar masum değilim 😏', 'kitap kokusuna aşığım 📚', 'dans etmeden geçen gün kayıptır 💃', 'hayat bir kez, cesur ol', 'kimse mükemmel değil, ben hariç 💅',
    'dağ havası, kamp ateşi 🏕️', 'sevdiğim insanlar azdır ama özdür', 'bugün yine erken uyuyamadım', 'kalbimin şifresi basit: ilgi', 'romantik komedi bağımlısı 💘',
    'pembe gözlüklerle bakarım 🌸', 'çikolata krizi geçiriyorum 🍫', 'ateş burcu, dikkat 🔥', 'iyi ki varsın diyene iyi ki varım', 'yürüyüşler ve uzun sohbetler',
    'resim yaparım, ruhumu boyarım 🎨', 'kalbim tatil modunda 🏝️', 'ben buradayım, sen neredesin?', 'kafam güzel, kalbim temiz', 'gece yarısı mesajları en dürüstüdür 🌙',
    'denize sıfır, dertlere uzak', 'uçak bileti alırken mutluyum ✈️', 'herkes bir şey arıyor, ben huzur', 'kahverengi gözler, siyah kahve ☕', 'mum ışığı ve caz 🕯️',
    'bazen kaybolmak gerekir', 'sabah koşuları ve smoothie 🍓', 'sıcak bir battaniye kadar sevilmek', 'sessizliğimi de dinle', 'dünyayı gezmek istiyorum 🌍',
    'ilk adımı sen at 😌', 'gerçek dostlar, iyi şarap 🍷', 'kalbim çiçek açıyor 🌼', 'cumartesi sabahları kutsaldır', 'kuralları sevmem 😈',
    'şiir okuyan kızlardan 📖', 'bu hafta çok çalıştım, hak ettim', 'aynada her gün yeni biri', 'bir şarkı kadar kısa, bir film kadar uzun', 'tatlı tatlı kızarım 😤',
    'biraz huysuz, çokça tatlı', 'gülümse, belki birine iyi gelir', 'denemeden bilemezsin', 'sahilde kitap, elimde dondurma 🍦', 'uykumu kimse bölemez 😴',
    'dizilerin baş kızı', 'kalbin sesi her şeyden yüksek', 'telefonumda bin fotoğraf 📸', 'hayat bir macera, ben de kahramanı', 'gözlerim konuşur, dinle',
    'kahve falıma sen çıktın ☕', 'aşk şarkılarına inanırım', 'en güzel günler henüz gelmedi', 'tatlı dilli, yüreği güzel', 'hep bir adım önde 👠',
    'ruhumu besleyen müzik 🎧', 'yolum açık, kalbim de', 'bir gülümseme bin kelime', 'hem çok kibar hem çok aksi', 'masallara hâlâ inanırım 🧚'],
  // 📍 ek şehirler (+100; Amor havuzundakilere eklenir)
  moreCities: ['Afyonkarahisar', 'Amasya', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Çankırı', 'Çorum',
    'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Gaziantep', 'Giresun', 'Hatay', 'Isparta', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu',
    'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Siirt', 'Sinop',
    'Sivas', 'Şanlıurfa', 'Tokat', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak', 'Bodrum', 'Fethiye', 'Kaş', 'Alanya', 'Kuşadası', 'Çeşme', 'Marmaris', 'Ayvalık',
    'Safranbolu', 'Kapadokya', 'Datça', 'Göcek', 'Urla', 'Berlin', 'Münih', 'Hamburg', 'Köln', 'Viyana', 'Amsterdam', 'Brüksel', 'Paris', 'Lyon', 'Londra', 'Roma',
    'Milano', 'Barselona', 'Madrid', 'Lizbon', 'Prag', 'Budapeşte', 'Varşova', 'Atina', 'Selanik', 'Kopenhag', 'Stockholm', 'Oslo', 'Zürih', 'Dublin', 'Bakü', 'Tiflis',
    'Saraybosna', 'Üsküp', 'Lefkoşa', 'Girne', 'Dubai', 'New York', 'Los Angeles', 'Hakkari', 'Muş', 'Ağrı', 'Iğdır', 'Ardahan', 'Bayburt', 'Gümüşhane',
    'Tunceli', 'Kilis', 'Şırnak', 'Aksaray'],
  // 💼 ek meslekler (+100; 22 yaş ve üstü için Amor havuzuna karışır)
  moreJobs: ['Hostes', 'Pilates eğitmeni', 'Yoga hocası', 'Fitness antrenörü', 'Diyetisyen', 'Eczacı', 'Fizyoterapist', 'Ebe', 'Anestezi teknikeri', 'Radyolog',
    'Kardiyolog', 'Dermatolog', 'Plastik cerrah', 'Çocuk doktoru', 'Göz doktoru', 'Laborant', 'Moda tasarımcısı', 'Stilist', 'Makyaj artisti', 'Nail art uzmanı',
    'Estetisyen', 'Dövme sanatçısı', 'Butik sahibi', 'Mağaza müdürü', 'Satış danışmanı', 'Emlakçı', 'Bankacı', 'Finans analisti', 'Borsa danışmanı', 'Sigortacı',
    'İnsan kaynakları uzmanı', 'Pazarlama müdürü', 'Marka yöneticisi', 'Reklamcı', 'Metin yazarı', 'Editör', 'Gazeteci', 'Muhabir', 'Haber spikeri', 'Radyo programcısı',
    'Podcast yapımcısı', 'YouTuber', 'İçerik üreticisi', 'Influencer', 'Oyuncu', 'Tiyatrocu', 'Dansçı', 'Bale sanatçısı', 'Şarkıcı', 'Piyanist',
    'Kemancı', 'Müzik öğretmeni', 'Ressam', 'Heykeltıraş', 'Seramik sanatçısı', 'Kuyumcu', 'Çiçekçi', 'Pastacı', 'Şef', 'Sommelier',
    'Barmen', 'Garson', 'Otel resepsiyonisti', 'Turist rehberi', 'Seyahat acentesi', 'Kabin amiri', 'Kaptan', 'Yat kaptanı', 'Dalış eğitmeni', 'Kayak hocası',
    'Arkeolog', 'Tarihçi', 'Kütüphaneci', 'Akademisyen', 'Araştırmacı', 'Kimyager', 'Biyolog', 'Genetik mühendisi', 'Veri bilimci', 'Yapay zeka mühendisi',
    'Oyun tasarımcısı', 'UX tasarımcısı', 'Web tasarımcısı', 'Siber güvenlik uzmanı', 'Sistem yöneticisi', 'Proje yöneticisi', 'Mimar asistanı', 'Peyzaj mimarı', 'Şehir plancısı', 'İnşaat mühendisi',
    'Hakim', 'Savcı', 'Noter', 'Diplomat', 'Tercüman', 'Polis', 'Asker', 'İtfaiyeci', 'Psikiyatrist', 'Sosyolog', 'Eğitim koordinatörü', 'Kreş öğretmeni', 'Dil öğretmeni', 'Matematik öğretmeni',
    'Kitap editörü', 'Ses teknisyeni', 'Kameraman', 'Yönetmen', 'Senarist', 'Kostüm tasarımcısı', 'Sahne tasarımcısı']
  };

  const eras = A.NAMES || null;
  const allAmor = eras ? Object.values(eras).reduce((a, l) => a.concat(l), []) : [];
  return Object.assign(own, {
    names: { '♀': allAmor.length ? allAmor : own.names['♀'], '♂': own.names['♂'] },
    eras,
    eraAge: A.NAME_AGE || {},
    cities: [...new Set([...(A.CITIES ? A.CITIES.map(c => c.name) : own.cities), ...own.moreCities])],
    cityObjs: A.CITIES || [],
    jobs: [...new Set([...(A.JOBS ? A.JOBS.map(j => j.title) : []), ...own.jobs, ...own.moreJobs])],
    extraJobs: [...new Set([...own.jobs.filter(j => j !== 'Öğrenci'), ...own.moreJobs])],
    jobObjs: A.JOBS || [],
    decos: A.NAME_DECOS || [],
    styles: A.NAME_STYLES || [['', 1]],
    brackets: A.NAME_BRACKETS || [['(', ')']],
    nicknames: A.NICKNAMES || []
  });
})();
