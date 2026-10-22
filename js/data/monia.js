/*
 * Monia Paneli: senaryo üretmek için zamanlar ve hazır olay havuzu.
 * Mekanlar js/data/places.js'ten gelir.
 *
 * Olay metninde kullanılabilenler: {ben} = karakterin adı, {sen} = senin adın, {mekan}, {zaman}
 * cats: olay kategorileri. items: 'Başlık' ya da { title, text }. tags: kategori etiketleri.
 * Uygulamadan eklediğin kalıp olaylar tarayıcıda saklanır (Monia → Olay havuzu → ➕).
 */
window.Stories = window.Stories || {};

Stories.MONIA = {
  parts: [
    { id: 'sabah', icon: '🌅', label: 'Sabah', hour: 9 },
    { id: 'ogle', icon: '☀️', label: 'Öğle', hour: 13 },
    { id: 'aksam', icon: '🌇', label: 'Akşam', hour: 19 },
    { id: 'gece', icon: '🌙', label: 'Gece', hour: 23 },
    { id: 'geceyarisi', icon: '🌌', label: 'Gece yarısı', hour: 2 }
  ],
  days: ['Hafta içi', 'Hafta sonu', 'Tatil günü', 'Doğum günü', 'Yılbaşı', 'Sevgililer Günü'],
  seasons: ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'],
  // senaryo etiketleri (kendi etiketlerini senaryo düzenleyicide ekleyebilirsin)
  scTags: ['Romantik', 'Tutkulu', 'Komik', 'Dram', 'Gerilim', 'Gizem', 'Günlük', 'Fantastik', 'Ofis', 'Tatil'],
  // olay dereceleri: vivid = rengin canlılığı (0 sönük gri … 100 tam renk). Uygulamada 📶 Dereceler'den değiştirilebilir
  // 5 kademe, azdan çoka
  levels: [
    { id: 'vlow', label: 'Very low-volume', vivid: 20 },
    { id: 'low', label: 'Low-volume', vivid: 40 },
    { id: 'mid', label: 'Volume', vivid: 60 },
    { id: 'high', label: 'High-volume', vivid: 80 },
    { id: 'vhigh', label: 'Very high-volume', vivid: 100 }
  ],
  // 📊 parametreler: her karakterin sana karşı değerleri (0 … max). Sebep-sonuçlar artırır / azaltır;
  // ⚡ eşik olayları bir değer sınırı geçince olay tetikler. Uygulamada Monia → 🎲 Sebep-sonuç'tan değiştirilebilir
  params: [
    { id: 'guven', icon: '🤝', label: 'Güven', min: 0, max: 100, start: 20 },
    { id: 'samimiyet', icon: '🫂', label: 'Samimiyet', min: 0, max: 100, start: 10 },
    { id: 'ask', icon: '❤️', label: 'Aşk', min: 0, max: 100, start: 0 },
    { id: 'sehvet', icon: '🔥', label: 'Şehvet', min: 0, max: 100, start: 0 },
    { id: 'kiskanclik', icon: '😤', label: 'Kıskançlık', min: 0, max: 100, start: 0 }
  ],
  // olay etiketleri (olay editöründe kendi etiketini de yazabilirsin)
  evTags: ['Başlangıç', 'Doruk', 'Final', 'Sürpriz', 'Yakınlaşma', 'Kavga', 'Barışma'],
  // olay editöründeki ton seçenekleri
  tones: ['Romantik', 'Tutkulu', 'Tatlı', 'Komik', 'Utangaç', 'Gergin', 'Kıskanç', 'Dramatik', 'Gizemli', 'Cesur', 'Hüzünlü'],
  cats: [
    // tags: kategori etiketleri ('if' -> şartlarda üstte). Olayların kendi 'event' etiketi: sohbette üstte, sevdiği / sevmediği olaylarda seçilebilir
    { id: 'genel', icon: '💫', label: 'Genel', items: [
      { title: 'Yanlış numara', text: '{ben} yanlışlıkla {sen} kişisine yazıyor.' },
      { title: 'Sürpriz ziyaret', text: '{ben} haber vermeden kapıda beliriyor.' },
      { title: 'Elektrik kesintisi', text: 'Elektrikler gidiyor; ikiniz karanlıkta kalıyorsunuz.' },
      { title: 'Yağmura yakalanmak', text: 'Ani bir yağmur başlıyor, sığınacak bir yer arıyorsunuz.' },
      { title: 'Mahsur kalmak', text: '{mekan} mahsur kalıyorsunuz, bir süre çıkamayacaksınız.' },
      { title: 'Kıskançlık', text: '{ben}, {sen} kişisini başka biriyle görüp kıskanıyor.' },
      { title: 'İtiraf', text: '{ben} uzun zamandır sakladığı bir şeyi itiraf ediyor.' },
      { title: 'Tartışma', text: 'Küçük bir şey yüzünden tartışmaya başlıyorsunuz.' },
      { title: 'Barışma', text: 'Tartışmanın ardından barışıyorsunuz.' },
      { title: 'İlk öpücük', text: '{ben} ile ilk kez öpüşüyorsunuz.' },
      { title: 'Eski sevgili', text: "{ben}'in eski sevgilisi çıkageliyor." },
      { title: 'Sarhoş mesaj', text: '{ben} gece geç saatte biraz içkili yazıyor.' },
      { title: 'Hastalık', text: '{ben} hasta; {sen} ona bakıyor.' },
      { title: 'Doğruluk mu cesaret mi', text: '{ben} doğruluk mu cesaret mi oynamak istiyor.' },
      { title: 'Kayıp anahtar', text: '{ben} anahtarını kaybediyor, geceyi nerede geçireceğini bilmiyor.' },
      { title: 'Yakalanmak', text: 'Biri sizi tam en olmadık anda yakalıyor.' }
    ] },
    { id: 'extra', icon: '🌟', label: 'Ekstra', items: ['Vaginal','Anal','Oral Sex','Deepthroat','Cunnilingus','Paizuri','Titfuck','Footjob','Handjob','Buttjob','Blowjob','Huge Dick','Belly Bulge','Masturbation','Sex toys','Lactation','Creampie','Cumshot','Squirt','Cumflation','Female domination','Facesitting','Pregnant','Exhibitionism','Voyeurism','Iseme','Tutma','Virginity','Cowgirl','Missionary','Ondesk','Doggy','Full Nelson','Public','BDSM','69'] }
  ]
};
