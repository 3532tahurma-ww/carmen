/*
 * 🔥 Fiery Passions: köyde geçen, sandbox öğeli görsel roman (Adult Game).
 * Karakterler, mekanlar, haftalık program, hediyeler ve hikaye sahneleri. Mantık js/app.js (renderFP).
 * Zaman: gün = 4 dilim (0 Sabah · 1 Gündüz · 2 Akşam · 3 Gece), haftanın günü 1 Pzt … 7 Paz.
 * Sahneler: { lines: [[kim, metin]], choice: [[seçenek, aff, cevap], [seçenek, aff, cevap]] }; kim = 'c' (karakter) · 'me' (sen) · 'sys' (anlatım).
 * Tüm karakterler 18+ yetişkinlerdir; akrabalık yoktur.
 */
window.Stories = window.Stories || {};

Stories.FIERY = (() => {
  const SLOTS = ['🌅 Sabah', '☀️ Gündüz', '🌇 Akşam', '🌙 Gece'];
  const DAYS = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const odd = d => d % 2 === 1, wk = d => d <= 5, lesson = d => [1, 3, 5].includes(d);

  // 📍 mekanlar: open(slot, gün) → açık mı, why: kapalıysa neden
  const LOCS = [
    { id: 'oda', name: 'Odan', icon: '🛏️', grad: ['#3a2a4a', '#1c1426'], open: () => true, acts: ['sleep', 'rest', 'laptop'], desc: 'Küçük ama sıcak bir oda. Pencereden köyün çatıları görünüyor.' },
    { id: 'salon', name: 'Oturma odası', icon: '🛋️', grad: ['#6b3a2a', '#2a160e'], open: () => true, desc: 'Yoga minderi, kitaplar ve eski bir şömine.' },
    { id: 'mutfak', name: 'Mutfak', icon: '🍳', grad: ['#7a4a1f', '#2e1a0a'], open: () => true, acts: ['cook'], desc: 'Tarçın ve kahve kokuyor.' },
    { id: 'banyo', name: 'Banyo', icon: '🛁', grad: ['#1f4a5a', '#0a1e26'], open: () => true, desc: 'Buğulu ayna, sıcak su.' },
    { id: 'roxyoda', name: 'Roxy\'nin odası', icon: '🎧', grad: ['#5a1f4a', '#22091c'], open: () => true, desc: 'Posterler, dağınık kitaplar, kapıda "GİRME" yazısı.' },
    { id: 'miaoda', name: 'Mia\'nın odası', icon: '🌸', grad: ['#7a2a4a', '#2a0e1a'], open: s => s >= 2, why: 'Gündüz Mia\'nın odasına girmek olmaz.', desc: 'Lavanta kokulu, düzenli bir oda.' },
    { id: 'market', name: 'Pazar', icon: '🧺', grad: ['#6b5a1f', '#2a220a'], open: s => s < 3, why: 'Pazar gece kapalı.', acts: ['shop', 'work', 'sell'], desc: 'Lily\'nin küçük dükkânı ve tezgâhlar.' },
    { id: 'park', name: 'Park', icon: '🌳', grad: ['#2a5a2a', '#0e220e'], open: () => true, desc: 'Gölgeli banklar, bir salıncak, uzakta bir göl.' },
    { id: 'kolej', name: 'Kolej', icon: '🏫', grad: ['#2a3a6b', '#0e142a'], open: (s, d) => wk(d) && s < 3, why: 'Kolej hafta sonu ve gece kapalı.', desc: 'Eski taş bina; koridorlarda fısıltılar.' },
    { id: 'mudur', name: 'Müdür odası', icon: '🗝️', grad: ['#4a1a1a', '#1a0808'], open: (s, d) => wk(d) && (s === 1 || s === 2), why: 'Müdür odası sadece hafta içi gündüz ve akşam açık.', desc: 'Ağır perdeler, deri koltuk, kırmızı kalem.' },
    { id: 'hastane', name: 'Hastane', icon: '🏥', grad: ['#1f5a5a', '#0a2222'], open: s => s < 3, why: 'Hastane gece kapalı.', desc: 'Bembeyaz, sessiz bir koridor.' },
    { id: 'avaev', name: 'Ava\'nın evi', icon: '🍷', grad: ['#5a1f2a', '#22090e'], open: () => true, desc: 'Modern bir ev, büyük camlar, şarap rafı.' },
    { id: 'ofis', name: 'Ofis', icon: '🗂️', grad: ['#3a3a4a', '#16161e'], open: (s, d) => wk(d) && s < 2, why: 'Ofis sadece hafta içi sabah ve gündüz açık.', desc: 'Klavye sesleri, kahve makinesi, Claire\'in masası.' },
    { id: 'avaofis', name: 'Ava\'nın ofis odası', icon: '💼', grad: ['#2a2a3a', '#0e0e16'], open: (s, d) => wk(d) && s < 2, why: 'Ofis kapalıyken giremezsin.', desc: 'Müdür koltuğu, şehir manzaralı bir tablo.' },
    { id: 'sahil', name: 'Sahil', icon: '🏖️', grad: ['#1f6b8a', '#0a2a3a'], open: s => s < 3, why: 'Gece sahil karanlık ve boş.', acts: ['fish'], desc: 'Kum, dalga sesi, iskele.' },
    { id: 'orman', name: 'Orman', icon: '🌲', grad: ['#1a3a1a', '#050e05'], open: s => s === 3, why: 'Orman sadece gece; gündüz gitmenin anlamı yok.', acts: ['mushroom'], desc: 'Ağaçların arasında ateş böcekleri. Derinlerde bir kulübe.' }
  ];

  // 👩 karakterler: where(slot, gün) → mekan id (ya da ''); gifts: { love: [], like: [], hate: [] }
  const CHARS = [
    { id: 'mia', name: 'Mia', title: 'Pansiyon sahibi · öğretmen', age: 38, color: '#ff8fab', pers: 'Sıcakkanlı, şefkatli, biraz telaşlı',
      bio: 'Yazı geçireceğin pansiyonun sahibi; kolejde öğretmen, evde yoga yapar. Herkesi aile gibi karşılar ama sınır aşılınca kızarıp şakayla azarlar.',
      where: (s, d) => s === 0 ? (lesson(d) ? 'kolej' : [2, 4, 6].includes(d) ? 'salon' : '') : s === 1 ? (d === 6 ? 'sahil' : d === 7 || d === 3 || d === 2 || d === 4 ? 'salon' : [1, 5].includes(d) ? 'market' : '') : s === 2 ? (odd(d) ? 'mutfak' : 'banyo') : 'miaoda',
      gifts: { love: ['yemek', 'cicek'], like: ['kahve', 'kitap'], hate: ['oyunkolu'] },
      intro: 'Geldiğine çok sevindim! Odanı çoktan hazırladım. Yerleş, kendini evinde hisset 🌸',
      talk: ['Kahvaltıda pankek yapayım mı? Sen sever misin?', 'Roxy sana kaba davranıyorsa söyle; aslında iyi bir kızdır.', 'Yoga yapmayı denedin mi hiç? Bel ağrısına birebir.', 'Kolejde bu dönem öğrenciler çok yaramaz… sen onlardan iyisin 😊', 'Bu evde erkek sesi duymak garip ama… güzel.', 'Şöminenin başında çay içelim mi bu akşam?'],
      flirt: [['Ah… sen beni utandırıyorsun 🙈', 'Küçük sapık! 😳 Ama… teşekkür ederim.'], ['Ben senden epey büyüğüm, biliyorsun değil mi?', 'Bunu kimse dememişti bana uzun zamandır…']],
      knock: ['Duştayım! Bekle biraz… ya da… havlumu getirir misin? 🙈', 'Kapı açık değil, merak etme 😳 …ama sesin güzel.'],
      scenes: [
        { title: 'Şömine başında', lines: [['sys', 'Akşam, şöminede çıtırtılar. Mia iki fincan çayla yanına oturuyor.'], ['c', 'Uzun zamandır bu evde kimseyle böyle oturmamıştım.'], ['c', 'Roxy hep odasında… ben de hep yalnız.']],
          choice: [['Artık yalnız değilsin', 12, 'Gözleri doluyor; başını omzuna yaslıyor 🥺'], ['Roxy\'yle konuşayım mı?', 4, 'İyi kalpli birisin… ama mesele o değil.']] },
        { title: 'Yoga dersi', lines: [['sys', 'Sabah; Mia yoga minderinde. Seni görünce el sallıyor.'], ['c', 'Gel, sana bir hareket göstereyim. Ellerini belime koy… doğru duruş için.'], ['sys', 'Teni sıcak; nefesi bir an duruyor.']],
          choice: [['Ellerimi biraz daha tut', 12, 'Fısıldıyor: "Bu yoga değil artık…" ama çekilmiyor 😳'], ['Hareketi tek başıma deneyeyim', 3, 'Gülümsüyor: "Çok terbiyelisin."']] },
        { title: 'Gece yarısı mutfak', lines: [['sys', 'Gece; mutfakta sadece buzdolabının ışığı. Mia ince bir geceliğin içinde.'], ['c', 'Uyuyamadım… sen de mi?'], ['c', 'Bir şey itiraf edeyim mi? Son günlerde hep seni düşünüyorum.']],
          choice: [['Ben de seni', 15, 'Dudakları dudaklarına değiyor; titriyor 💋'], ['Uyumamız lazım', 2, 'Başını sallıyor: "Haklısın… haklısın."']] }],
      passion: { place: 'Mia\'nın odası', lines: ['Lambayı kısıyor, geceliği omzundan kayıyor.', 'Yıllardır böyle hissetmemiştim…', 'Yavaş… her anını hatırlamak istiyorum.'], evs: ['Kissing', 'Cunnilingus', 'Missionary', 'Spooning', 'Lap Sex'] } },
    { id: 'roxy', name: 'Roxy', title: 'Ev arkadaşın · Mia\'nın kızı', age: 20, color: '#c084fc', pers: 'Tsundere: gururlu, ağzı bozuk, aslında iyi kalpli',
      bio: 'Mia\'nın kızı ve ev arkadaşın; kolejde okuyor. Yüzeyde saldırgan ve kibirli ama annesinin dediği gibi aslında "iyi bir kız". Kavgalar zamanla flörte dönüşür.',
      where: (s, d) => s === 0 ? (lesson(d) ? 'kolej' : [2, 4, 6].includes(d) ? 'park' : '') : s === 1 ? (d === 2 ? 'sahil' : 'roxyoda') : s === 2 ? (odd(d) ? 'banyo' : 'mutfak') : 'roxyoda',
      gifts: { love: ['cikolata', 'oyunkolu'], like: ['pelus'], hate: ['kitap'] },
      intro: 'Sen de kimsin? Annemin "misafiri" mi? Banyoyu kilitlemeyi unutma, yoksa öldürürüm 😤',
      talk: ['Ne bakıyorsun? Yüzümde bir şey mi var?!', 'Annem seni çok seviyor… sinir bozucu.', 'Bu kitap? Hiç. Romantik değil. Kapa çeneni 😳', 'Kolejde Liza\'dan uzak dur; yılandır o.', 'Bugün iyi görünüyorsun… YANİ hayır, öyle demek istemedim!', 'Bana çikolata almayı unutma, yoksa… hiç.'],
      flirt: [['Hı?! Sen ne diyorsun be?! 😳 …devam et.', 'Aptal… ama komik.'], ['İğrençsin. Bir daha söyle.', 'Kes şunu! …hayır, kesme.']],
      knock: ['DEFOL! Duştayım! …tamam, bekle, havlu at bari 😤', 'Kapıyı bir daha çalarsan… içeri gelmen lazım ki seni döveyim 😏'],
      scenes: [
        { title: 'Özür', lines: [['c', 'Dünkü banyo olayı için hâlâ kızgınım!'], ['c', 'Beni affetmeni istiyorsan… özür dile. Düzgünce.']],
          choice: [['Özür dilerim, gerçekten', 10, '"…Hm. Kabul. Ama bir kere daha olursa!" Yanakları kıpkırmızı.'], ['Sen de kapıyı kilitleseydin', 3, '"Seni gerizekalı!" diye bağırıyor ama gülüyor.']] },
        { title: 'Parkta koşu', lines: [['sys', 'Sabah parkı; Roxy koşudan nefes nefese.'], ['c', 'Benimle yarışır mısın? Kaybeden… kazananın dediğini yapar.']],
          choice: [['Kaybetmeye razıyım 😏', 12, 'Kazanıyor ve yanına yaklaşıp fısıldıyor: "O zaman… beni öp."'], ['Yarışırım, kazanacağım', 6, 'Kıl payı kazanıyorsun; surat asıyor ama elini tutuyor.']] },
        { title: 'Kilitli kapının ardında', lines: [['sys', 'Gece; Roxy\'nin kapısı aralık. İçeriden adını fısıldıyor.'], ['c', 'Gel buraya… kimseye söylersen ölürsün, anladın mı?'], ['c', 'Sana kızgın değilim. Hiç olmadım galiba.']],
          choice: [['Biliyorum 💕', 15, 'Yatağın kenarına çekip sarılıyor; kalbinin atışı duyuluyor.'], ['Emin misin?', 3, '"Aptal! Tabii eminim!"']] }],
      passion: { place: 'Roxy\'nin odası', lines: ['Işığı kapat… hayır, açık kalsın. Seni görmek istiyorum.', 'Bunu kimseye söylersen…', 'Sus ve öp beni 😤💕'], evs: ['Kissing', 'Blowjob', 'Cowgirl', 'Doggy', 'Standing'] } },
    { id: 'ava', name: 'Ava', title: 'Şirket müdürü · Mia\'nın arkadaşı', age: 34, color: '#f43f5e', pers: 'Cesur, flörtöz; altında kırılgan',
      bio: 'Yerel bir şirketin müdürü, Mia\'nın en yakın arkadaşı. Şehirde aldatılıp köye kaçmış; yalnızlığını cüretkâr bir flörtün arkasına saklar.',
      where: (s, d) => s === 3 ? 'avaev' : s === 1 && d === 6 ? 'sahil' : s === 1 && d === 7 ? 'salon' : s === 2 && [1, 3].includes(d) ? 'market' : s < 2 && wk(d) ? 'avaofis' : 'avaev',
      gifts: { love: ['sarap'], like: ['cicek', 'ruj'], hate: ['pelus'] },
      intro: 'Demek Mia\'nın yeni misafiri sensin… Kimse bana böyle yakışıklı biri geleceğini söylememişti 🍷',
      talk: ['Şarap mı, viski mi? Ben ikisini de seviyorum.', 'Şehirde her şeyim vardı… bir yalan hepsini aldı.', 'Mia çok iyi kalplidir; ben biraz… daha az iyiyim 😏', 'Ofiste herkes benden korkar. Sen korkmuyorsun, değil mi?', 'Bazen bu ev çok sessiz geliyor.', 'Gel otur, bacaklarım ağrıyor; topuklu ayakkabı işkence.'],
      flirt: [['İşte bu cesaret hoşuma gitti 😏', 'Devam et… bakalım nereye kadar.'], ['Daha iyisini yapabilirsin.', 'Hmm, bu geceye saklayalım.']],
      scenes: [
        { title: 'Şarap daveti', lines: [['c', 'Dinle, yarın akşam bana gel… bazen çok yalnız hissediyorum.'], ['sys', 'Ertesi akşam; kadehler doluyor, Ava kanepede bacak bacak üstüne atıyor.'], ['c', 'Bana neden geldin? Dürüst ol.']],
          choice: [['Seni merak ettim', 12, 'Kadehini bırakıp yaklaşıyor: "Merak iyidir…"'], ['Mia söyledi', 2, 'Gülüyor: "Hâlâ çocuksun."']] },
        { title: 'Ofiste mesai sonrası', lines: [['sys', 'Ofis boşalmış; Ava camın önünde, şehir ışıkları gibi köyün lambaları.'], ['c', 'Kapıyı kilitle. Claire görmesin.']],
          choice: [['Kilitliyorum 🔒', 14, 'Ceketini çıkarıyor: "İşte böyle."'], ['Burası iş yeri', 3, '"Sıkıcısın" diyor ama gülümsüyor.']] },
        { title: 'Kırılgan an', lines: [['c', 'Biliyor musun… beni aldatan adamdan sonra kimseye dokunmadım.'], ['c', 'Sana dokunmak istiyorum ama korkuyorum.']],
          choice: [['Ben buradayım, gitmiyorum', 16, 'Gözyaşı yanağından süzülüyor; seni öpüyor 💋'], ['Acele etmeyelim', 6, '"Teşekkürler…" diyor, eline sıkıca tutunuyor.']] }],
      passion: { place: 'Ava\'nın evi', lines: ['Şarap kadehleri devriliyor; umurunda değil.', 'Bu gece benimsin 😈', 'Bırakma beni…'], evs: ['Kissing', 'Show Tits', 'Blowjob', 'Ondesk', 'Standing doggy', 'Full Nelson'] } },
    { id: 'lily', name: 'Lily', title: 'Market sahibi', age: 23, color: '#facc15', pers: 'Utangaç, tatlı, çalışkan',
      bio: 'Köydeki küçük marketin sahibi. Ağır kolileri tek başına taşıyacak kadar çok çalışır; erkek görmeye alışık olmadığı için seninle konuşurken kekeler.',
      where: (s, d) => s === 2 && d === 4 ? 'sahil' : s < 3 ? 'market' : '',
      gifts: { love: ['cicek', 'pelus'], like: ['cikolata'], hate: ['sarap'] },
      intro: 'Vay canına! Gerçek bir erkek! Kusura bakma, ben sadece… burada yeni yüzleri çok nadir görüyoruz 🙈',
      talk: ['Bugün koliler çok ağırdı… yardım eder misin? 🥺', 'Ç-çok güzel bir gün, değil mi?', 'Chloe bazen bana garip siparişler veriyor 😳', 'Sana kurabiye ayırdım! Kimseye söyleme.', 'Akşamları sahilde balık tutmayı severim.', 'Ellerin çok güçlü… y-yani, koliler için!'],
      flirt: [['B-ben… ne diyeceğimi bilmiyorum 🙈', 'Yüzüm yanıyor şu an!'], ['Ş-şaka mı yapıyorsun?', 'Kimse bana böyle demedi…']],
      scenes: [
        { title: 'Teslimat', lines: [['sys', 'Lily ağır bir kolinin altında ezilmek üzere.'], ['c', 'Ah! Y-yardım eder misin? 🥺']],
          choice: [['Ver, ben taşırım', 12, 'Kolileri taşıyorsun; "Kahramanım!" diyor ve yanağına öpücük konduruyor 💋'], ['Bir el atayım', 6, 'Beraber taşıyorsunuz, elleri ellerine değiyor.']] },
        { title: 'Depoda', lines: [['sys', 'Dükkânın arkasındaki küçük depo; ışık loş.'], ['c', 'Ş-şu üst rafa uzanamıyorum… beni kaldırır mısın?']],
          choice: [['Belinden kaldırıyorum', 14, 'Raftaki kutuyu unutup sana sarılıyor 🙈'], ['Merdiveni getireyim', 3, '"Ah… evet, merdiven. Mantıklı." Biraz hayal kırıklığı.']] },
        { title: 'Sahilde gün batımı', lines: [['c', 'Hiç kimseyle gün batımı izlememiştim…'], ['c', 'Sence ben… güzel miyim?']],
          choice: [['Gördüğüm en güzel kız', 16, 'Gözlerini kapatıyor, ilk öpücüğü titrek 💕'], ['Tabii güzelsin', 6, 'Gülümsüyor, başını omzuna koyuyor.']] }],
      passion: { place: 'Market deposu', lines: ['Kapıyı kilitledim… k-kimse gelmez.', 'Bunu hiç yapmadım… nazik ol 🥺', 'Ahh… devam et lütfen…'], evs: ['Kissing', 'Front Hugging', 'Cunnilingus', 'Missionary', 'Spooning'] } },
    { id: 'ash', name: 'Ash', title: 'Roxy\'nin arkadaşı · gotik', age: 21, color: '#64748b', pers: 'Alaycı, dünyadan bıkmış, meydan okumayı sever',
      bio: 'Roxy\'nin arkadaşı; parkta tek başına oturan, kara mizahlı gotik kız. Ablası bilgisayarını kırdığından beri oyun oynayamıyor; sıkıntısı ve meydan okuma sevgisi seni ona bağlar.',
      where: (s, d) => s === 2 ? 'park' : s === 1 && d === 2 ? 'sahil' : '',
      gifts: { love: ['oyunkolu'], like: ['kahve', 'cikolata'], hate: ['cicek'] },
      intro: 'Oh, harika. Yeni biri. Konuşmak zorunda mıyız? …tamam, otur bari. Bankı ısıttım.',
      talk: ['Ablam bilgisayarımı kırdı. Hayatım bitti.', 'Taş-kağıt-makas? Kaybeden bir sır söyler.', 'Herkes "neden hep siyah giyiyorsun" diyor. Sen sormadın. Artı puan.', 'Roxy sana âşık. Söylemiş olmayayım 😏', 'Bu köyde yapacak tek şey: sıkılmak.', 'Mezarlıkta piknik yapmayı düşündün mü hiç?'],
      flirt: [['Ucuz bir replik. İşe yaradı ama.', 'Hmm. Devam et, eğleniyorum.'], ['Bu kadar mı?', 'Daha karanlık bir şey söyle 😏']],
      scenes: [
        { title: 'Taş-kağıt-makas', lines: [['c', 'Bahisli oynayalım. Kaybeden… kazananın bir dileğini yerine getirir.'], ['sys', 'Üç el… Ash kaşını kaldırıyor.']],
          choice: [['Kasten kaybet', 12, '"Dileğim: beni öp. Ve kimseye söyleme." 😏'], ['Kazanmaya oyna', 7, 'Kazanıyorsun; "Dile bakalım" diyor, meraklı.']] },
        { title: 'Oyun gecesi', lines: [['sys', 'Odanda eski bir konsol; Ash yanında bağdaş kurmuş.'], ['c', 'Bunu benim için mi buldun? …aptal. Teşekkürler.']],
          choice: [['Senin için her şey', 13, 'Kumandayı bırakıp kucağına oturuyor 🖤'], ['Beraber oynayalım', 6, 'Sabaha kadar oynuyorsunuz; omzunda uyuyakalıyor.']] },
        { title: 'Mezarlıkta yıldızlar', lines: [['c', 'Burası köyün en sessiz yeri. Kimse bizi duymaz.'], ['c', 'Bir şey söyleyeceğim ama gülersen seni gömerim: sen… iyisin.']],
          choice: [['Sen de 🖤', 16, 'Seni yakasından çekip öpüyor; dudaklarında siyah ruj izi.'], ['Gülmüyorum', 5, '"İyi." Elini tutuyor.']] }],
      passion: { place: 'Parkın karanlık köşesi', lines: ['Bunu yapacak kadar sıkıldım… yalan, seni istiyorum.', 'Isır. Hafif. …daha sert 🖤', 'Kimseye söyleme.'], evs: ['Kissing', 'Deepthroat', 'Facesitting', 'Doggy', 'Standing'] } },
    { id: 'chloe', name: 'Chloe', title: 'Hemşire', age: 29, color: '#2dd4bf', pers: 'Sakin, kuru mizahlı, pragmatik',
      bio: 'Köy hastanesinin hemşiresi; şehirdeki bir laboratuvarla gizli bir "yan iş" yürütür. En tuhaf konuları bile gülümsemeden, iş gibi konuşur.',
      where: (s, d) => s === 2 && d === 4 ? 'sahil' : s < 2 ? 'hastane' : s === 2 && d !== 3 ? 'hastane' : '',
      gifts: { love: ['kahve'], like: ['kitap', 'yemek'], hate: ['pelus'] },
      intro: 'Sessizlik. Kimse hasta olmuyor, kimse ölmüyor… Neredeyse gücenecek gibiyim. Sen hasta mısın? Lütfen de.',
      talk: ['Tansiyonun normal. Sıkıcı.', 'Şehirdeki laboratuvar sana çok para öder. Ne için mi? Sonra anlatırım.', 'Kahve getirdin mi? Hayır mı? O zaman neden buradasın.', 'Lily\'nin siparişlerini ben ayarlıyorum. Merak etme.', 'Bugün bir arı sokması vardı. Heyecan dorukta.', 'Gülümsemiyorum çünkü yüz kaslarımı biriktiriyorum.'],
      flirt: [['İlginç bir teklif. Not aldım.', 'Nabzın hızlandı. Benim değil, senin.'], ['Klinik olarak etkilenmedim.', 'Belki. Bir sonraki muayenede.']],
      scenes: [
        { title: 'Yan iş', lines: [['c', 'Sana bir iş teklifim var. Tamamen tıbbi.'], ['c', 'Bir kap, bir oda, on dakika. Ücret: iyi.']],
          choice: [['Kabul, ama sen de odada ol', 12, 'Bir an duraksıyor. "…Prosedüre aykırı değil." Kızarıyor mu?'], ['Kabul', 6, '"Harika. Sağlıklı numune." Kuru bir başparmak.']] },
        { title: 'Muayene', lines: [['c', 'Gömleğini çıkar. Stetoskop soğuk; şikayet etme.'], ['sys', 'Parmakları göğsünde biraz fazla oyalanıyor.']],
          choice: [['Elini tut', 13, '"Bu muayenenin parçası değil." Ama elini çekmiyor.'], ['Nabız nasıl?', 5, '"Yüksek. Sebebini biliyorum."']] },
        { title: 'Gece nöbeti', lines: [['c', 'Hastane boş. Ben de… sıkıldım.'], ['c', 'Hipotezim şu: bana âşıksın. Test edelim mi?']],
          choice: [['Test edelim', 16, 'Önlüğünün düğmelerini çözüyor. "Bilim için." 💉'], ['Hipotez yanlış', 2, '"Veriler aksini söylüyor." Not alıyor.']] }],
      passion: { place: 'Hastanenin boş odası', lines: ['Kapı kilitli. Kameralar kapalı. Prosedür başlıyor.', 'Bu… beklediğimden daha iyi.', 'Nabzım… dur, ölçmeyeceğim 😳'], evs: ['Handjob', 'Blowjob', 'Ondesk', 'Cowgirl', 'Standing doggy'] } },
    { id: 'liza', name: 'Liza', title: 'Kolej kraliçesi', age: 21, color: '#f472b6', pers: 'Şımarık, materyalist, sivri dilli',
      bio: 'Kolejin "küçük kraliçesi"; parası olmayanı küçümser, her şeyin peşin ödenmesini ister. Laf dalaşlarıyla yakınlaşır, becerileriyle gurur duyar.',
      where: (s, d) => s === 0 ? (lesson(d) ? 'kolej' : '') : s === 1 ? (d !== 6 ? 'park' : '') : s === 2 ? (d === 6 ? 'sahil' : '') : 'park',
      gifts: { love: ['ruj', 'sarap'], like: ['cikolata'], hate: ['kahve', 'pelus'] },
      intro: 'Sana söylemiştim, beş parasız. Cebin boşken bana yaklaşma ve konuşma 💅',
      talk: ['Bu çanta mı? Şehirden. Senin bir aylık kiran.', 'Roxy mi? Kıskanç bir kız.', 'Cebinde ne var? Göster bakalım.', 'Ben ucuz değilim. Ama pahalı da değilim… sadece değerliyim.', 'Müdür Scarlett benden nefret ediyor. Bir şey çaldım diye. Belki.', 'Bana bir ruj alsan… belki gülümserim.'],
      flirt: [['Hm. Paran yokken bile iddialısın.', 'Bu sefer affediyorum 😏'], ['Ucuz.', 'Bir dahaki sefere hediyeyle gel.']],
      scenes: [
        { title: 'Peşin ödeme', lines: [['c', 'Seninle konuşmak istiyorsam bedelini ödemelisin.'], ['c', 'Ne getirdin bana?']],
          choice: [['Bir sır', 10, '"…Bir sır mı? Pahalı bir şeymiş." Merakla yaklaşıyor.'], ['Hiçbir şey', 2, '"Sıradaki!"']] },
        { title: 'Çalınan kolye', lines: [['c', 'Scarlett\'in çekmecesindeki kolyeyi aldım. Bana geri getirirsen… seni ödüllendiririm.'], ['sys', 'Liza dudağını ısırıyor.']],
          choice: [['Senin için riske girerim', 13, '"Ooh, kahraman." Kulağına bir öpücük.'], ['Kendin getir', 4, '"Korkak." Ama gülüyor.']] },
        { title: 'Gece parkta', lines: [['c', 'Herkes beni yüzeysel sanıyor. Haklılar galiba.'], ['c', 'Ama sen bana bakınca… pahalı hissetmiyorum. Değerli hissediyorum.']],
          choice: [['Sen değerlisin', 16, 'Topuklularını çıkarıp seni çimenlere çekiyor 💋'], ['Ve pahalı', 6, '"Aynen öyle." Gülüşü ilk kez gerçek.']] }],
      passion: { place: 'Park, gece', lines: ['Bunu bedavaya yapmıyorum… sana özel indirim 😏', 'Becerilerimle gurur duyarım, izle.', 'Ahh… tamam, sen de iyisin.'], evs: ['Kissing', 'Deepthroat', 'Titfuck', 'Cowgirl', 'Standing'] } },
    { id: 'claire', name: 'Claire', title: 'Ofis sekreteri', age: 27, color: '#94a3b8', pers: 'Ciddi, disiplinli; içten içe çekingen ve meraklı',
      bio: 'Ava\'nın sekreteri; hep resmi takımla dolaşan "demir leydi". Ufak bir kışkırtmayla kızarır, savunmaya geçer ama merakına yenik düşer.',
      where: (s, d) => s === 0 && d === 7 ? 'sahil' : wk(d) && s < 2 ? 'ofis' : '',
      gifts: { love: ['kitap'], like: ['kahve', 'cicek'], hate: ['sarap'] },
      intro: 'Randevunuz yok. Ava Hanım meşgul. Lütfen bekleme alanına… neden bana öyle bakıyorsunuz?',
      talk: ['Dosyalar alfabetik değil. Bu kabul edilemez.', 'Ava Hanım çok… cesur biri. Ben öyle değilim.', 'Okuduğum kitap mı? Romantik değil. Kesinlikle değil. 📚', 'Takım elbisem kırışık mı? Söylesenize!', 'Mesai saatlerinde kişisel konuşma… beş dakika olur.', 'Bazen merak ediyorum… normal insanlar akşamları ne yapıyor?'],
      flirt: [['B-bu uygunsuz bir ifade! 😳', '…Lütfen bir daha söyleyin. Not alacağım.'], ['Mesai saatindeyiz!', 'Mesai… on dakika sonra bitiyor.']],
      scenes: [
        { title: 'Kırışık yaka', lines: [['c', 'Yakam düzgün mü? Toplantı var!'], ['sys', 'Yakasını düzeltmek için uzanıyorsun.']],
          choice: [['Düzeltiyorum, yavaşça', 12, 'Nefesini tutuyor: "T-teşekkürler… çok… dikkatlisiniz."'], ['Mükemmel görünüyor', 6, 'Kızarıyor: "Sadece yakayı sordum!"']] },
        { title: 'Gizli kitap', lines: [['sys', 'Masasının çekmecesinde aşk romanı.'], ['c', 'Bu… araştırma amaçlı! İnsan davranışı üzerine!']],
          choice: [['En sevdiğin sahneyi oku', 13, 'Titrek sesle okuyor; son cümlede gözleri sana kalkıyor.'], ['Sırrın bende güvende', 6, '"Sağ olun." Rahatlamış.']] },
        { title: 'Mesai sonrası', lines: [['c', 'Hiç… kimseyle… yani… ben tecrübesizim.'], ['c', 'Bana öğretir misiniz? Profesyonel olarak.']],
          choice: [['Profesyonel olarak 😏', 16, 'Gözlüğünü çıkarıyor, saçını açıyor. "Başlayalım."'], ['Acele etme', 6, '"Sabırlısınız. Bu… hoşuma gitti."']] }],
      passion: { place: 'Ofis, mesai sonrası', lines: ['Kapıyı kilitledim. İki kez kontrol ettim.', 'Bu… hiçbir kitapta yazmıyordu 😳', 'Lütfen… devam edin.'], evs: ['Kissing', 'Show Tits', 'Handjob', 'Ondesk', 'Missionary'] } },
    { id: 'scarlett', name: 'Scarlett', title: 'Kolej müdürü', age: 41, color: '#dc2626', pers: 'Otoriter, baskın, kurallara tapan',
      bio: 'Kolejin müdürü; disiplin ve otorite tutkunu. Liza\'nın çaldığı kolyeyi geri alırken seni yakalar ve "cezanı çekmen" için kendi asistanı yapar. Buyurgan ama karşı konulmaz.',
      where: (s, d) => s === 0 && d === 7 ? 'sahil' : wk(d) && (s === 1 || s === 2) ? 'mudur' : '',
      gifts: { love: ['sarap'], like: ['kitap'], hate: ['pelus', 'cikolata'] },
      intro: 'İzinsiz odama mı girdin? Bu okulda kuralları çiğneyenler hak ettikleri cezayı alır. Otur. Ayakta değil, yere.',
      talk: ['Ayakkabılarım tozlu. Bunu fark etmiş olmalıydın.', 'Kurallar özgürlüktür. Anlamıyorsun, normal.', 'Liza\'yı izliyorum. Seni de.', 'Bugün iyi bir asistandın. Bunu sık duymayacaksın.', 'Gözlerime bakarak konuşma izni vermedim.', 'Kırmızı kalemim nerede? Getir.'],
      flirt: [['Cüretkâr. Ceza mı istiyorsun?', '…Hm. Bunu ödüllendireceğim.'], ['Haddini bil.', 'Bunu tekrar et. Diz çökerek.']],
      scenes: [
        { title: 'Ceza', lines: [['c', 'Kolyeyi çalmak için odama girdin. Seçimin var: disiplin kurulu ya da benim asistanım olmak.']],
          choice: [['Asistanınız olurum', 12, '"Akıllıca." Masasına bir anahtar koyuyor: "Akşamları geleceksin."'], ['Liza\'nın suçu', 3, '"Ispiyoncu. Hoşuma gitmedi."']] },
        { title: 'Kurallar', lines: [['c', 'Kural bir: ben konuşurken susarsın. Kural iki: ödül benim keyfime göre.'], ['c', 'Ayakkabılarımı çıkar.']],
          choice: [['Emredersiniz', 13, 'Bir kaşını kaldırıyor: "İyi çocuk."'], ['Ya çıkarmazsam?', 7, 'Gülümsüyor: "O zaman eğlenceli olur."']] },
        { title: 'Sınavın sonu', lines: [['c', 'Kimse bana karşı koymadı. Sen ise… ilginçsin.'], ['c', 'Bu gece kuralları bir kez çiğneyeceğim. Senin için.']],
          choice: [['Ben de sizin için', 16, 'Kırmızı kalemini masaya bırakıyor; ceketi yere düşüyor 🔥'], ['Kurallara sadık kalalım', 4, '"Sıkıcı… ama doğru."']] }],
      passion: { place: 'Müdür odası', lines: ['Diz çök. Şimdi kalk. İyi.', 'Kurallar bu gece benim bedenim 😈', 'Sakın durma. Bu bir emir.'], evs: ['Facesitting', 'Blowjob', 'Cowgirl', 'Ondesk', 'Full Nelson'] } },
    { id: 'luna', name: 'Luna', title: 'Ormanın cadısı', age: 30, color: '#a855f7', pers: 'Öfkeli, gizemli, sinsi ve baştan çıkarıcı',
      bio: 'Ormanın derinliklerinde tek başına yaşayan cadı. İlk karşılaşmada seni lanetlemekle tehdit eder; işine yaradığını görünce sinsi ve baştan çıkarıcı olur. Mantar ve büyülü pazarlıklar onun dünyası.',
      where: s => s === 3 ? 'orman' : '',
      gifts: { love: ['mantar'], like: ['balik'], hate: ['cicek'] },
      intro: 'Sen de kimsin, solucan?! Davetsiz topraklarıma gelmeye nasıl cüret edersin? Çorbama malzeme mi olmak istiyorsun?',
      talk: ['Bu mantar zehirli. Bu daha zehirli. Bu… senin için 😈', 'Köylüler benden korkar. Haklılar.', 'İksirim için ay ışığı lazım. Ve senin saçından bir tel.', 'Kedim seni sevdi. Bu nadirdir.', 'Bir lanet mi istiyorsun, bir öpücük mü? Ikisi de aynı fiyat.', 'Mantar getir. Bol bol.'],
      flirt: [['Cüretli solucan… hoşuma gitti.', 'Büyüme karşı koyamıyorsun, değil mi? 😏'], ['Seni kurbağaya çeviririm.', 'Bir kez daha dene. Belki öpücüğe çeviririm.']],
      scenes: [
        { title: 'Pazarlık', lines: [['c', 'Seni lanetlemeyeceğim. Bir şartla: bana mantar toplayacaksın. Her gece.']],
          choice: [['Anlaştık, cadım', 12, '"Cadın mı? …Hm. İsim hoşuma gitti."'], ['Neden ben?', 5, '"Çünkü buradasın, solucan."']] },
        { title: 'İksir', lines: [['sys', 'Kazanda mor bir iksir kaynıyor.'], ['c', 'İç bunu. Ne yapacağını söylemeyeceğim.']],
          choice: [['İçerim', 14, 'Dünya dönüyor; Luna kucağında, gözleri parlıyor: "Etkisi bende de."'], ['Önce sen iç', 6, 'Gülüyor: "Zekisin. Az da olsa."']] },
        { title: 'Dolunay', lines: [['c', 'Dolunayda büyüm en güçlüsüdür. Ve… arzum da.'], ['c', 'Kulübemde kal bu gece.']],
          choice: [['Kalırım', 16, 'Pelerinini çözüyor; ay ışığı tenini gümüşe boyuyor 🌕'], ['Sabah dönmeliyim', 4, '"Gidersen lanetlenirsin." Şaka mı?']] }],
      passion: { place: 'Luna\'nın kulübesi', lines: ['Büyü başladı; artık geri dönüş yok 🌕', 'Seni hiç bırakmayacağım, solucanım.', 'Daha… daha… ahh!'], evs: ['Kissing', 'Cat Girl', 'Cunnilingus', 'Cowgirl', 'Doggy', 'Rough'] } },
    { id: 'maeve', name: 'Maeve', title: 'Şehirdeki patronun', age: 39, color: '#38bdf8', pers: 'Soğuk, mesafeli; altında teşhirci',
      bio: 'Şehirde çalıştığın ajansın sahibi; seni yazı Mia\'nın pansiyonunda geçirmen için köye o yolladı. Görüntülü aramaları kısa keser ama ekranın öbür ucunda saklı bir teşhircilik vardır. Sadece dizüstü bilgisayardan (akşam / gece) ulaşılır.',
      where: () => '', call: true,
      gifts: { love: [], like: [], hate: [] },
      intro: 'Bütün yazı dört duvar arasında geçirmek tuhaf olur. O yüzden hadi, orada alış, bol bol eğlen. Kartına biraz para yükledim.',
      talk: ['Toplantıdayım, kısa kes.', 'Mia iyi bir kadındır. Ona yük olma.', 'Kartını harcadın mı? Bekliyordum.', 'Ofis sensiz sessiz… bunu duymadın.', 'Kamerayı neden kapatmadım biliyor musun? Ben de bilmiyorum.', 'Gece yarısı aradın. Uyuyamıyordum zaten.'],
      flirt: [['Ekranın öbür ucundasın, cesaretin buradan.', 'Hm… bunu bir daha söyle. Kamerayı açık tutuyorum.'], ['İş ilişkisi, unutma.', 'İş… evet. Ama mesai bitti.']],
      scenes: [
        { title: 'Gece araması', lines: [['sys', 'Ekranda Maeve; ofis değil, yatak odası.'], ['c', 'Uyuyamadım. Neden seni aradım, bilmiyorum.']],
          choice: [['Ben de seni düşünüyordum', 12, 'Bir an susuyor. Kamerayı biraz daha yakına getiriyor.'], ['İş mi var?', 3, '"Evet. İş." Kapatıyor.']] },
        { title: 'Kamera', lines: [['c', 'Kocam hiç bakmıyor bana. Sen bakıyor musun?']],
          choice: [['Gözümü ayıramıyorum', 14, 'Bornozunu omzundan kaydırıyor. "O zaman bak."'], ['Bu doğru değil', 3, '"Haklısın." Ama kamerayı kapatmıyor.']] },
        { title: 'Gösteri', lines: [['c', 'Bu gece senin için bir şey yapacağım. Kimse bilmeyecek.']],
          choice: [['İzliyorum 👀', 16, 'Işıkları ayarlıyor; kameraya dönüp gülümsüyor 🔥'], ['Bunu yapmak zorunda değilsin', 6, '"Biliyorum. İstiyorum."']] }],
      passion: { place: 'Görüntülü arama', lines: ['Kamera açık… sadece sen izliyorsun.', 'Beni görüyor musun? İyi.', 'Yazın sonunda şehre dön… bunu gerçekten yaşayalım.'], evs: ['Show Tits', 'Show Ass', 'Sex toys'] } }
  ];

  // 🎁 hediyeler ve eşyalar (pazardan alınır; mantar ormandan, balık sahilden, yemek mutfaktan)
  const ITEMS = [
    { id: 'cicek', name: 'Çiçek', icon: '🌹', price: 50 }, { id: 'cikolata', name: 'Çikolata', icon: '🍫', price: 30 }, { id: 'sarap', name: 'Şarap', icon: '🍷', price: 120 },
    { id: 'kitap', name: 'Kitap', icon: '📚', price: 60 }, { id: 'oyunkolu', name: 'Eski oyun konsolu', icon: '🎮', price: 220 }, { id: 'ruj', name: 'Ruj', icon: '💄', price: 90 },
    { id: 'pelus', name: 'Peluş ayı', icon: '🧸', price: 70 }, { id: 'kahve', name: 'Kahve', icon: '☕', price: 20 },
    { id: 'mantar', name: 'Mantar', icon: '🍄', price: 0, sell: 15 }, { id: 'balik', name: 'Balık', icon: '🐟', price: 0, sell: 25 }, { id: 'yemek', name: 'Ev yemeği', icon: '🍲', price: 0 }];

  // 💞 ilişki kademeleri: aff eşiği → kademe adı
  const STAGES = [[0, 'Tanışma'], [20, 'Arkadaş'], [45, 'Flört'], [70, 'Yakın'], [90, 'Tutku']];

  return { SLOTS, DAYS, LOCS, CHARS, ITEMS, STAGES };
})();
