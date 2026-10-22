/* bot-editoru.bat ile duzenlenir (tools/bot-editor.html). Bicim: js/bot.js'in basindaki aciklama. */
window.Stories = window.Stories || {};
Stories.BOT_RULES = {
  "rules": [
    {
      "id": "r_mv8cf8uw2ccb",
      "name": "Selam",
      "category": "Selamlaşma",
      "when": [
        "@selam"
      ],
      "reply": [
        "Selam {sen}! 👋",
        "Heyy, nasılsın?",
        "Merhaba 🙂"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_selam_utangac",
      "name": "Selam (utangaç)",
      "category": "Selamlaşma",
      "when": [
        "@selam"
      ],
      "reply": [
        "S-selam... 🙈",
        "Ah, merhaba||Seni görmeyi beklemiyordum"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "Utangaç karakterler farklı selam verir"
    },
    {
      "id": "r_nasilsin",
      "name": "Nasılsın",
      "category": "Selamlaşma",
      "when": [
        "@nasilsin"
      ],
      "reply": [
        "İyiyim, sen?",
        "Fena değil 🙂||Senden ne haber?"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ne_yapiyorsun",
      "name": "Ne yapıyorsun",
      "category": "Sohbet",
      "when": [
        "=ne",
        "+yapmak"
      ],
      "reply": [
        "Hiç, uzanıyorum 😌",
        "Seni düşünüyordum desem? 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": "+yapmak: yapıyorsun, yapacaksın, yaptın... hepsini yakalar"
    },
    {
      "id": "r_seni_seviyorum",
      "name": "Seni seviyorum",
      "category": "Romantik",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Ben de seni ❤️",
        "Bunu duymak çok güzel 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": "Sıra önemli: önce 'seni' sonra 'sevmek' fiili"
    },
    {
      "id": "r_seviyorum_seni",
      "name": "Seviyorum seni (ters)",
      "category": "Romantik",
      "when": [
        "+sevmek",
        "seni"
      ],
      "reply": [
        "Böyle ters söyleyince daha da tatlı oldu 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": "Aynı kelimeler ters sırada: farklı cevap"
    },
    {
      "id": "r_seni_seviyorum_soguk",
      "name": "Seni seviyorum (soğuk)",
      "category": "Romantik",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Hıh. Tamam.",
        "...Peki."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": "Soğuk karakterlerde"
    },
    {
      "id": "r_ozledim",
      "name": "Özledim",
      "category": "Romantik",
      "when": [
        "+özlemek"
      ],
      "reply": [
        "Ben de seni özledim 🥺",
        "Gel o zaman||Bekliyorum"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_kahve",
      "name": "Kahve",
      "category": "Sohbet",
      "when": [
        "@icecek"
      ],
      "reply": [
        "Kahve mi? Ben varım ☕",
        "Önce kahve, sonra dünya ☕"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bulusalim",
      "name": "Buluşma teklifi",
      "category": "Sohbet",
      "when": [
        "+buluşmak|+görüşmek|+gelmek"
      ],
      "reply": [
        "Olur, ne zaman?",
        "Hmm... düşüneyim 🤔||Tamam, olur"
      ],
      "traits": [],
      "chars": [],
      "note": "buluşalım mı / görüşelim / gelir misin"
    },
    {
      "id": "r_yedek",
      "name": "Yedek cevap",
      "category": "Yedek",
      "when": [],
      "reply": [
        "Hmm 🤔",
        "Anlat bakalım",
        "Öyle mi?",
        "Devam et, dinliyorum"
      ],
      "traits": [],
      "chars": [],
      "note": "Hiçbir kural eşleşmezse"
    },
    {
      "id": "r_yedek_utangac",
      "name": "Yedek (utangaç)",
      "category": "Yedek",
      "when": [],
      "reply": [
        "B-bilmiyorum ki... 🙈",
        "Hı hı..."
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "Utangaç karakterin yedek cevabı"
    },
    {
      "id": "r_mv8d890hjbsw",
      "name": "",
      "category": "Selamlaşma",
      "when": [
        "@nasilsin",
        "+yapmak|+sevmek"
      ],
      "reply": [
        "heyyyy"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_foreplay",
      "name": "Isınma",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Mmm… böyle başlaman çok hoşuma gidiyor 😌",
        "Yavaş ol… acelemiz yok {sen} 💕",
        "Kalbim hızlandı bile 🥰||Devam et…",
        "Ellerin tenimde dolaşınca ürperiyorum 😌",
        "Bu gece acele etmeyelim mi? 💞||Her anını hissetmek istiyorum",
        "Kokunu içime çekiyorum… mmm 🥰",
        "Kulağıma bir şey fısılda {sen} 😳",
        "Böyle yakınken kalbimin sesini duyuyor musun? 💓",
        "Parmakların… biraz daha aşağı 😏",
        "Seni bu kadar özlediğimi bilmiyordum 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": "Foreplay kategorisi"
    },
    {
      "id": "r_ev_kissing",
      "name": "Öpüşme",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=foreplay",
        "kissing"
      ],
      "reply": [
        "Dudakların… 😚||Bir daha öp beni",
        "Öpüşünü özlemişim 💋",
        "Mmh… nefesim kesildi 😳",
        "Bir daha… ve bir daha 😚",
        "Dudaklarını ısırabilir miyim? 😏",
        "Öpüşmen başımı döndürüyor 🫠",
        "Daha önce kimse beni böyle öpmedi 💋",
        "Nefes almayı unuttum galiba 😳||Devam",
        "Tadın hâlâ dudaklarımda {sen} 💕",
        "Boynuma da… lütfen 😌",
        "Dudakların tam benim dudaklarıma göre 💋",
        "Bir öpücük daha… sonra bir tane daha 😚",
        "Dilinle oynamak hoşuma gidiyor 😏",
        "Alt dudağımı ısırma… ya da ısır 😈",
        "Öpüşürken nefesim kesiliyor 🫠",
        "Ellerin yüzümde, sıcacık 🥰",
        "Bu öpücük her şeyi anlattı 💗",
        "Biraz daha uzun… bırakma 😌",
        "Dudaklarım şişti senin yüzünden 😳💋",
        "Öpüşünden anladım, beni istiyorsun 😏",
        "Kalbim dudaklarımda atıyor sanki 💓",
        "Gözlerimi açınca hâlâ sana bakıyorum 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_lapkiss",
      "name": "Kucakta öpüşme",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=foreplay",
        "lap",
        "kissing"
      ],
      "reply": [
        "Kucağında olmak çok güzel 🥰||Bırakma beni",
        "Böyle sarılıp öpüşmeyi seviyorum 💞",
        "Böyle kalmak istiyorum hep 🥰",
        "Kucağında küçücük hissediyorum 😌💕",
        "Ellerin belimde… mmm 😚",
        "Sarıl bana, bırakma {sen} 💞",
        "Bu an hiç bitmesin 🫶",
        "Öp beni… daha yavaş 😌",
        "Kalp atışını hissediyorum 💓",
        "Burası benim en sevdiğim yer 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_hug",
      "name": "Sarılma",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "hugging"
      ],
      "reply": [
        "Sarıl bana daha sıkı 🤗",
        "Kollarında kendimi güvende hissediyorum 💗",
        "Mmm… sıcacıksın {sen}",
        "Ne kadar sıcaksın 🤗",
        "Bir dakika daha böyle kalalım 🥺",
        "Kokunu seviyorum {sen} 💕",
        "Sarılınca bütün dünyayı unutuyorum 😌",
        "Daha sıkı… 🫶",
        "Ensemdeki nefesin ürpertiyor beni 😳",
        "Seninle böyle uyumak istiyorum 💤💕"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_show",
      "name": "Gösterme",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=show"
      ],
      "reply": [
        "Beğendin mi? 😏",
        "Sadece senin için {sen} 🙈||Bakmayı bırakma",
        "Gözlerin üstümde… hoşuma gidiyor 😌",
        "Böyle mi bakmak istiyordun? 😏",
        "Yavaşça çıkarayım mı? 😈",
        "Yüzün kızardı {sen} 😏",
        "Dokunmak serbest… ama yavaş 😌",
        "Beğendiğini gözlerinden anlıyorum 😈",
        "Hepsi senin 💕||Bak doyasıya",
        "Biraz daha yaklaş… 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_foreplay_shy",
      "name": "Isınma (utangaç)",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "B-böyle yakın olunca kızarıyorum 🙈",
        "Yavaş olalım mı… lütfen? 🥺",
        "Ö-öyle bakma, utanıyorum 🙈",
        "Işığı kapatsak mı? 😳",
        "Kalbim çok hızlı atıyor… 🥺",
        "Sana güveniyorum ama… yavaş ol 🙈",
        "Elimi tutar mısın? 🥺💕",
        "Böyle şeyleri hiç yapmadım… 😳",
        "Yüzüm yanıyor… 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "Utangaç karakterler"
    },
    {
      "id": "r_ev_eat",
      "name": "Onu ısıtmak",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=eat"
      ],
      "reply": [
        "Ahh… {sen} 😩||Durma lütfen",
        "Dilin… oh tanrım 🫠",
        "Mmmh… tam orası 💦",
        "Bacaklarım titriyor… 😵‍💫",
        "Ahh… orası çok hassas 😩",
        "Saçlarını çekiyorum, farkında değilim 🫠",
        "Durursan seni affetmem {sen} 😤💦",
        "Mmmh… bacaklarımı tut 😩",
        "Nasıl bu kadar iyi yapıyorsun? 🥵",
        "Yavaş… sonra hızlı… ahh 😵‍💫",
        "Sesimi tutamıyorum… 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_cunni",
      "name": "Cunnilingus",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "cunnilingus"
      ],
      "reply": [
        "Ahh… evet, orası… 😩",
        "Saçlarını tutmama izin ver… 🫠||Durma!",
        "Böyle devam edersen dayanamayacağım {sen} 💦",
        "Dilin… ahh, tam orası 😩",
        "Bacaklarım kendiliğinden açılıyor 🫠",
        "Daha… daha… ahh {sen} 💦",
        "Gözlerimi kapatıyorum, sadece seni hissediyorum 😵‍💫",
        "Ellerim çarşafı sıkıyor 😩",
        "Şimdi durma… lütfen 🥺💦",
        "Kalçam titriyor… 🫠",
        "Bunu her gün yapmalıyız 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_facesit",
      "name": "Facesitting",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "facesitting"
      ],
      "reply": [
        "Altımda nefesini hissediyorum… 😈",
        "Kontrol bende şimdi {sen} 😏||Mmm…",
        "Ah… kalkamayacağım galiba 🫠",
        "Nefes alabiliyor musun? 😏",
        "Kıpırdama… ahh, öyle 😩",
        "Yüzün tam altımda… mmm 😈",
        "Ellerimi göğsüme koyuyorum… ahh 🫠",
        "Bu güç hoşuma gidiyor {sen} 😈",
        "Dilini kullan… evet 😩💦",
        "Kalçamı sıkı tut 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_squirt",
      "name": "Squirt",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=eat",
        "squirt"
      ],
      "reply": [
        "Bir şey oluyor… ahh! 💦",
        "Dur… dur… ahhh 😵‍💫💦",
        "Bunu bana nasıl yaptın {sen}?! 🫣",
        "Ahh! Tutamıyorum… 💦💦",
        "Çarşaflar sırılsıklam oldu 🫣",
        "Ne oldu bana böyle?! 😵‍💫",
        "Bacaklarım hâlâ titriyor… 🫠",
        "Seni ıslattım… özür dilerim 🙈💦",
        "Bir daha… bir daha yap 😩",
        "Hiç böyle olmamıştı {sen} 😳💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_onmouth",
      "name": "On Mouth",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "on mouth"
      ],
      "reply": [
        "Mmh… dudakların 😩",
        "Daha… biraz daha 💗",
        "Dudaklarını orada hissetmek… 😩",
        "Mmm… yavaşça 😌",
        "Öpücüklerin ateş gibi 🔥",
        "Durma, çok güzel 🫠",
        "Ahh… {sen} 💗",
        "Biraz daha bastır… 😩",
        "Nefesin bile yetiyor beni çıldırtmaya 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_eat_shy",
      "name": "Onu ısıtmak (utangaç)",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=eat"
      ],
      "reply": [
        "Ç-çok utanıyorum ama… durma 🙈",
        "Bakma bana öyle… ahh 😳",
        "O-orası… ahh 🙈",
        "Sesimi duyacaklar… 😳",
        "Yüzümü kapatıyorum… ama durma 🙈💦",
        "Ç-çok tuhaf hissettiriyor… güzel 😳",
        "Bunu kimseye söyleme 🙈",
        "Ahh… özür dilerim, sesim… 😳",
        "Lütfen… biraz daha 🥺"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_outer",
      "name": "Dokunuş",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=outercourse"
      ],
      "reply": [
        "Hoşuna gidiyor mu {sen}? 😏",
        "Yüzündeki ifadeye bayılıyorum 😈",
        "Bana bırak bu sefer 💕",
        "Bugün kontrol bende 😈",
        "Nefesin hızlandı {sen} 😏",
        "Sana dokunmayı seviyorum 💕",
        "Gözlerini kapama, bana bak 😏",
        "Daha yavaş mı? Yoksa… 😈",
        "Ne kadar sertsin… 🥵",
        "Benim için dayan biraz 😏",
        "Bu gece sadece senin zevkin için buradayım 😈",
        "Hangi elimi daha çok seviyorsun? 😏",
        "Bekle… daha yeni başlıyorum 😋"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_bj",
      "name": "Blowjob",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=oral",
        "=outercourse"
      ],
      "reply": [
        "Mmm… 😋||Gözlerimin içine bak",
        "Bunu seviyorsun değil mi {sen}? 😏",
        "Daha derin mi istiyorsun? 😈",
        "Mmm… tadın 😋",
        "Saçlarımı tut {sen} 😈",
        "Sesin… bayılıyorum 🥵",
        "Dilimle… böyle mi? 😏",
        "Bana bakarak gel… 😈",
        "Yavaş yavaş… sonra hızlı 😋",
        "Böyle inlemen hoşuma gidiyor 😏",
        "Hepsini istiyorum 😈",
        "Diz çöktüm… şimdi beni izle 😈",
        "Dudaklarım seni çok özlemiş 😋",
        "Bu tadı ezberledim {sen} 😏",
        "Elinle saçımı yönlendir… evet, böyle 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_deep",
      "name": "Deepthroat",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=oral",
        "=outercourse",
        "deepthroat"
      ],
      "reply": [
        "Mmhh… *nefes nefese* 😵‍💫",
        "Hepsini… alabilirim 😈||Bak",
        "Gözlerim yaşardı ama… durma 🥵",
        "Mmhh… hepsi içimde 😵‍💫",
        "Boğazım… ahh 😈",
        "Başımı tut… yavaşça 😩",
        "Nefes… nefes alayım… sonra tekrar 😈",
        "Bunu kimse yapamaz senin için {sen} 😏",
        "Daha derin… 😵‍💫"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_tit",
      "name": "Titfuck",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=outercourse",
        "titfuck"
      ],
      "reply": [
        "Göğüslerimi seviyorsun biliyorum 😏",
        "Böyle mi? 😈||Bakmayı bırakma",
        "Göğüslerimin arası sıcacık 😏",
        "Bastır biraz… böyle 😈",
        "Gözlerini göğüslerimden alamıyorsun 😏",
        "Dudaklarımla da yardım edeyim mi? 😋",
        "Ahh, sert… 🥵",
        "Bunu hayal ettiğini biliyorum {sen} 😈",
        "Yavaş… sonra hızlan 😏",
        "Göğüslerimin arasında kaybolman ne güzel 😏",
        "Yukarıdan sana bakıyorum… dilim hazırda 😋",
        "Yağ getirsem mi? Daha kaygan olur 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_hand",
      "name": "Handjob",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "handjob|masturbation"
      ],
      "reply": [
        "Elimde nasıl sertleştiğine bak… 😏",
        "Yavaş mı hızlı mı {sen}? 😈",
        "Avucumda nasıl zonkladığını hissediyorum 😏",
        "Biraz daha sıkayım mı? 😈",
        "Yüzündeki ifadeye bak… 🥵",
        "Gel… gelmek istiyorsun değil mi? 😏",
        "Parmaklarım ıslandı 😋",
        "Bana bakarak… 😈",
        "Hızlı mı istiyorsun {sen}? 😏",
        "Avucumdaki zonklaman… kalp atışı gibi 😏",
        "Gözlerini kapama, bana bak, elime bak 😈",
        "Sıkı mı gevşek mi, sen söyle 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_feet",
      "name": "Footjob / Legjob",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=bacak"
      ],
      "reply": [
        "Bunu hiç beklemiyordun değil mi? 😏",
        "Ayaklarım hoşuna gitti galiba 😈",
        "Ayaklarım bu kadar işe yarıyormuş 😏",
        "Bacaklarımın arası sıcak 😈",
        "Bak, nasıl hoşuna gidiyor 😏",
        "Biraz daha yukarı… 😈",
        "Tuhaf ama… sevdim 🙈",
        "Gözlerini kapama {sen} 😏",
        "Daha hızlı mı? 😈",
        "Ayak parmaklarımla oynamana gülüyorum 🙈😏",
        "Bu kadar seveceğini bilsem daha önce yapardım 😈",
        "Topuklarımı da kullanayım mı? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_butt",
      "name": "Buttjob",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "buttjob"
      ],
      "reply": [
        "Kalçamı hissediyor musun? 😏🍑",
        "Böyle sürtünmek… mmm 😈",
        "Kalçamın arasında… mmm 😈",
        "Bastır biraz {sen} 🍑",
        "Bunu çok seviyorsun değil mi? 😏",
        "Sıcacıksın… ahh 🥵",
        "Ellerini kalçama koy 😈",
        "Yavaşça kaydır… 😏",
        "Arkamı dönüyorum, bak 🍑😈",
        "Kalçalarımın arasında sıkışmış haline bak 😈",
        "Yavaşça kalçamı sallıyorum… hissediyor musun? 🍑",
        "Bu yumuşaklığa kimse dayanamaz 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_vag",
      "name": "Önden pozisyon",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=vajinal"
      ],
      "reply": [
        "Ahh… seni içimde hissediyorum 😩",
        "Daha… daha sert {sen} 💦",
        "Evet… böyle… 🫠",
        "Mmh, beni tamamen dolduruyorsun 😵‍💫",
        "İçimde nasıl hissettirdiğini bilemezsin 😩",
        "Ahh… daha derin 💦",
        "Kalçalarımı tut… sert 😈",
        "Beni doldur {sen} 🥵",
        "Her hareketin… ahh 😵‍💫",
        "Durma, sakın durma 😩",
        "Sesimi duymak hoşuna gidiyor değil mi? 😈💦",
        "Tam orası… ahh 🫠",
        "Yatak gıcırdıyor… komşular duyacak 😳💦",
        "Her itişinde nefesim kesiliyor… bir daha 😩",
        "Bu ritim… kalbimle aynı atıyor 💓",
        "Tırnaklarım sırtında iz bırakıyor, kusura bakma 😈",
        "Beni unuttuğum bir yere götürüyorsun {sen} 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_missionary",
      "name": "Missionary",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=forward",
        "missionary"
      ],
      "reply": [
        "Gözlerime bak {sen}… 💗||Ahh",
        "Seni böyle üstümde hissetmeyi seviyorum 🥰",
        "Gözlerin gözlerimde… 💗",
        "Bacaklarımı beline doluyorum 😩",
        "Öp beni… ahh 💋",
        "Ağırlığını hissetmek güzel 😌💦",
        "Ellerimi tut, bırakma {sen} 🥺",
        "Yavaş… derin… ahh 😵‍💫",
        "Seni böyle seviyorum 🥰💦",
        "Alnın alnımda, nefesin nefesimde… 💗",
        "Bacaklarımla seni kilitledim, kaçamazsın 😈",
        "Yüzündeki o ciddi ifade… bayılıyorum 😏",
        "Yıldızları tavanda görüyorum 🌌😩",
        "Kulağıma adımı fısılda… ahh 🥺",
        "Üstümdesin, ağırlığın beni yatağa gömüyor… 🫠",
        "Ellerimi başımın üstünde tut 😈",
        "Bacaklarımı omzuna mı alsan? 😏",
        "Her itişinde gözlerin kararıyor, görüyorum 😩",
        "Seni böyle yüz yüze hissetmek en güzeli 💗",
        "Nefesin yüzümde, dudakların dudaklarımda… 💋",
        "Sırtına tırnaklarımı geçiriyorum, kusura bakma 😈",
        "Yavaş… sonra derin… sonra yine yavaş 😩",
        "Kalçamı kaldırıyorum, daha derine gel 🥵",
        "Alnımızdaki ter birbirine karıştı 💦",
        "Klasik ama asla sıkıcı değil 😏",
        "Gözlerimi kapatmayacağım, seni izlemek istiyorum 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_doggy",
      "name": "Doggy",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=doggy"
      ],
      "reply": [
        "Saçımı çek… 😈",
        "Ahh! Böyle çok derin 😩",
        "Kalçamı tut {sen}… 💦",
        "Ahh! Çok derin 😩",
        "Kalçama vur… 😈🍑",
        "Saçımı çek {sen}… evet 😩",
        "Böyle görünmek hoşuna gidiyor mu? 😏",
        "Daha sert… ahh 💦",
        "Ellerim yetmiyor, düşeceğim 🫠",
        "Beni sahiplen 😈",
        "Aynadaki halimize bak… 😈",
        "Yastığa bastırıyorum yüzümü, sesim çıkmasın 😩",
        "Kalçamdaki parmak izlerin yarın da kalacak 🍑",
        "Belimi bük dedin, büktüm… şimdi ne? 😏",
        "Her vuruşta biraz daha öne kayıyorum 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_cowgirl",
      "name": "Cowgirl",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=cowgirl"
      ],
      "reply": [
        "Şimdi ben sürüyorum 😈",
        "Bak bana… ahh 😩||Ellerini kalçama koy",
        "Ritmi ben seçiyorum 😈",
        "Göğüslerime dokun… ahh 😩",
        "Bak nasıl hareket ediyorum 😏",
        "Yavaş… sonra hızlı… 😈💦",
        "Beni izlemeyi seviyorsun 😏",
        "Kalçamı tut, düşmeyeyim 😩",
        "Sana bineceğim bütün gece {sen} 😈",
        "Bugün seni ben sürüyorum, dizginler bende 🐎😈",
        "Saçlarım yüzüne dökülüyor… tut onları 😏",
        "Yavaşça iniyorum… hissediyor musun? 😩",
        "Göğüslerim zıplıyor, gözlerin onlarda 😏",
        "Bu tempoyu ben belirlerim {sen} 😈💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_spoon",
      "name": "Spooning",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=spooning"
      ],
      "reply": [
        "Böyle sarılarak… mmm 🥰",
        "Nefesin ensemde… 😌💦",
        "Arkamda… sarılarak… mmm 🥰",
        "Yavaş ve derin… 😌💦",
        "Boynumu öp {sen} 😚",
        "Böyle uyuyakalabilirim 💤😈",
        "Elini göğsüme koy 😌",
        "Fısılda bana… 😳",
        "Ahh… çok yakınsın 🫠",
        "Arkamdan sarılıp kulağımı ısırınca… ahh 😩",
        "Uyuyakalırsak böyle kalalım mı? 😌💦",
        "Sabahın ilk ışığında böyle uyanmak istiyorum 🌅",
        "Kalbinin sırtımda attığını duyuyorum 💓"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_standing",
      "name": "Ayakta",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=standing"
      ],
      "reply": [
        "Duvara yasla beni 😈",
        "Ahh… ayaklarım yerden kesiliyor 😩",
        "Beni kaldır… ahh 😩",
        "Bacaklarım titriyor, tut beni 🫠",
        "Duvar soğuk, sen sıcaksın 😈",
        "Boynuma tutunuyorum… 😩",
        "Daha sert {sen}… 💦",
        "Ayakta bile dayanamıyorum 😵‍💫",
        "Kimse görmesin… 😈",
        "Ayaklarım parmak ucunda… ahh 😩",
        "Kapının arkasında, herkes içeride… 😈",
        "Bacağımı kaldır, daha derin 🫠",
        "Duvardaki tablolar düşecek 😳💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_lap",
      "name": "Lap Sex",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "lap sex"
      ],
      "reply": [
        "Kucağında… ahh 😩💕",
        "Sıkı sarıl bana {sen}",
        "Kucağında sallanıyorum… 😩💕",
        "Göğsüne yaslanıyorum… ahh 🫠",
        "Gözlerine bakarak… 💗",
        "Belimi tut {sen} 😩",
        "Böyle iç içe… mmm 🥰",
        "Yavaş… ahh 😵‍💫",
        "Seni hiç bırakmak istemiyorum 💞",
        "Kucağında dans eder gibiyim 💃😈",
        "Alnımı alnına dayıyorum… gözlerin çok yakın 💗",
        "Sarılarak, sallanarak… ahh 🥰",
        "Böyle iç içe hiç ayrılmayalım 💞"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_anal",
      "name": "Anal",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=anal"
      ],
      "reply": [
        "Yavaş… yavaş başla 😳",
        "Ahh… çok dar 😩",
        "Mmh… alışıyorum, devam et 😈",
        "Ahh… önce yavaş 😳",
        "Nefes alayım… tamam, devam 😩",
        "Çok dolu hissediyorum 😵‍💫",
        "Bunu istediğimi bilmiyordum 😈",
        "Elini önüme koy… ahh 🫠",
        "Biraz daha… derin 😩",
        "Sana güveniyorum {sen} 🥺",
        "Yavaşça… her santimi tek tek hissediyorum 😩",
        "Bunu benden başka kimseye yapma 😈",
        "Ellerim titriyor ama durma 🫠",
        "Çarşafı ısırıyorum… ahh 😳"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_anal_back",
      "name": "Anal (arkadan)",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "Ahh! Yavaş ol {sen}… 😩",
        "Çok derin… ahh 😵‍💫",
        "Mmh… evet, böyle… 😈💦",
        "Bunu benimle ilk yapan sensin… 🙈",
        "Kalçamı aç… ahh 😩",
        "Yavaş… yavaş… evet 😵‍💫",
        "Bu kadar derin… ahh 🫠",
        "Saçımı çek {sen} 😈",
        "Ellerim çarşafta… dayanamıyorum 😩💦",
        "Bu his… tarif edemem 😵‍💫",
        "Daha… daha sert 😈",
        "Kalçalarımı iki elinle açman… çok utandırıcı ve çok güzel 😳🔥",
        "Arkama her girişinde dünya duruyor 😵‍💫",
        "Yüzümü göremiyorsun ama inan bana… bayılıyorum 😩",
        "Her vuruş bir dalga gibi yayılıyor 🌊😈",
        "Bu kadar derin… nefesim boğazımda kaldı 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": "anal etiketi + Backward kategorisi (Doggy, Cowgirl kurallarını geçer)"
    },
    {
      "id": "r_ev_rough_anal",
      "name": "Rough Anal",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=anal",
        "=backward",
        "rough"
      ],
      "reply": [
        "Ahh! Sert… 😩||Dur deme bana",
        "Saçımı çek… daha sert 😈💦",
        "Acımasız ol bana 😈",
        "Ahh! Evet, böyle 😩💦",
        "Bağır diyorsun… bağırıyorum 😵‍💫",
        "Kalçama vur {sen} 🍑😈",
        "Durma, yalvarırım 😩",
        "Beni mahvet… 🔥",
        "Bacaklarım tutmuyor artık 🫠",
        "Saçımı at kuyruğu gibi çek… evet 😈",
        "Bu gece merhamet yok, biliyorum 🔥",
        "Kalçamda avuç izin kızarıyor 🍑😩",
        "Yalvartma beni… ya da yalvart 😈💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_anal_shy",
      "name": "Anal (utangaç)",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "B-bu ilk kez… nazik ol 🥺",
        "Korkuyorum ama… güveniyorum sana 🙈",
        "Ç-çok tuhaf… ama kötü değil 🙈",
        "Yavaş ol lütfen… 🥺",
        "Bunu kimseye anlatma 😳",
        "Elimi tut… 🥺",
        "Ahh… özür dilerim, sesim 🙈",
        "Galiba… seviyorum bunu 😳",
        "Dur… hayır, durma 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_condom",
      "name": "Condom",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=condom"
      ],
      "reply": [
        "İyi ki taktın 😌",
        "Güvende olmak güzel 💕||Şimdi gel buraya",
        "Akıllı çocuk 😏",
        "Takayım mı ben? 😏",
        "Güvende olmak beni rahatlatıyor 😌",
        "Şimdi hiçbir şey düşünmeden… gel 😈",
        "Aferin sana {sen} 😏",
        "Sorumluluk sahibi erkekler seksi 😌",
        "Hazırım artık 💕"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_nothing",
      "name": "Korunmasız",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=nothing"
      ],
      "reply": [
        "Hiçbir şey olmadan mı… 😳||Peki…",
        "Seni olduğun gibi hissetmek istiyorum 😈",
        "Riskli… ama heyecanlı 😈",
        "Bugün güvenli günüm… galiba 😳",
        "Hiçbir şey aramızda olmasın {sen} 😩",
        "Teni tene… mmm 🥵",
        "Sonrasını düşünmeyelim 😈",
        "Dikkatli ol ama… lütfen 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_gentle",
      "name": "Nazik",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=gentle"
      ],
      "reply": [
        "Böyle nazik olman çok güzel 🥰",
        "Yavaş yavaş… hissediyorum seni 💕",
        "Böyle yavaşken her şeyi hissediyorum 🥰",
        "Öp beni her harekette 💋",
        "Nazikliğin içimi eritiyor 🫠",
        "Acele etme {sen} 💕",
        "Bu sevişmek gibi… 🥺💗",
        "Gözlerime bakarak… 😌",
        "Çok güzelsin böyle 💞"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_passion",
      "name": "Tutkulu",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=passionate"
      ],
      "reply": [
        "Tutkuyla… ahh 🔥",
        "Bu bakışlarına dayanamıyorum 😩🔥",
        "Seni deli gibi istiyorum 🔥",
        "Tırnaklarım sırtında… 😩",
        "Nefes nefeseyiz… 🥵",
        "Beni öp, durma {sen} 🔥💋",
        "Bu ateş sönmesin 😈",
        "Kalbim yerinden çıkacak 💓🔥",
        "Daha… her şeyini ver 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_rough",
      "name": "Sert",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=rough|=brutal|=assertive"
      ],
      "reply": [
        "Sert ol bana {sen} 😈",
        "Ahh! Evet… daha sert 😩💦",
        "Beni hırpala… 🔥",
        "Bana nazik olma 😈",
        "Boğazımı tut… hafifçe 😩",
        "Daha sert {sen}, daha! 🔥",
        "Kalçama vur… ahh 🍑",
        "İz bırak bende 😈",
        "Beni yatağa fırlat 😏🔥",
        "Bağırmamı istiyorsun değil mi? 😩💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_hold",
      "name": "Tutmak",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "holding|cock ring"
      ],
      "reply": [
        "Daha bitirme… bekle 😈",
        "Dayan biraz {sen}… benim için 😏",
        "Tutuyor musun? Aferin 😌",
        "Gelme… daha değil 😈",
        "Dişlerini sıkıyorsun, tatlısın 😏",
        "Biraz daha dayanırsan ödülün var {sen} 😈",
        "Nefes al… yavaş 😌",
        "Sabret… en güzeli gelecek 😏",
        "Gözlerin yalvarıyor… hayır 😈",
        "Ben söyleyince 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_cum",
      "name": "Boşalma",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Ahh… sıcacık 😵‍💫💦",
        "Hepsini bana verdin… 🥵",
        "Mmh… {sen} 💦||Bu harikaydı",
        "Ahh… her yerim sıcacık 🥵💦",
        "Ne kadar çokmuş {sen} 😳",
        "Titreyişini hissettim… 😩",
        "Nefes nefeseyiz… 🫠",
        "Bana bak… ne kadar güzeldi 💗",
        "Hepsini… mmm 😋",
        "Şimdi sarıl bana 🥺💕",
        "Nasıl da birikmişsin… bir anda bıraktın 🥵💦",
        "Sıcacık ve bol… tam istediğim gibi 😩",
        "Her damlasını hissettim {sen} 💦",
        "Bu kadarını beklemiyordum… cömertsin 😈",
        "Dalga dalga geldi… durmadı 😵‍💫",
        "Ne güzel boşaldın… gurur duydum seninle 💗"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_creampie_v",
      "name": "Vaginal Creampie",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "vaginal creampie"
      ],
      "reply": [
        "İçime… ahh 😩💦",
        "Sıcaklığını hissediyorum… 🫠",
        "Hepsini içime bıraktın {sen}… 😳💦",
        "Hâlâ içimde zonkluyor… 😩",
        "Akıyor… mmm 🫣💦",
        "Kıpırdama, biraz böyle kalalım 🥺",
        "Tamamen doldun içime {sen} 🥵",
        "Sıcaklığın yayılıyor… 🫠",
        "Bir şey olursa… ikimizin 🙈💗",
        "Ahh… bu çok fazlaydı 😵‍💫",
        "Gürül gürül aktın içime… 😩💦",
        "İçimde bir doluluk hissettim… hâlâ sıcak 🫠",
        "Rahmime kadar ulaştı sanki 😳💦",
        "Bembeyaz… yoğun… hepsi içimde 🥵",
        "Nasıl da birikmişsin, bir anda bıraktın içime 😩",
        "Çıkarınca taşacak… biliyorum 🫣💦",
        "İçimi ısıtıyor, yavaş yavaş yayılıyor 🫠",
        "Bunca dölü nereye sakladın {sen}? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_creampie_a",
      "name": "Anal Creampie",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "anal creampie"
      ],
      "reply": [
        "Ahh… içimde hissediyorum 😵‍💫💦",
        "Mmh… sıcacık doldurdun beni 🥵",
        "Hâlâ sıcak… içimde 😩💦",
        "Kıpırdamıyorum, hissetmek istiyorum 🫠",
        "Arkam sırılsıklam 🫣",
        "Bunu yaptığına inanamıyorum {sen} 😈",
        "Mmm… doldum 🥵",
        "Çıkarma daha… 😩",
        "Gürce aktın arkama… 😩💦",
        "İçimde koca bir sıcaklık var şimdi 🫠",
        "Arkamı ağzına kadar doldurdun 🥵",
        "Yoğun ve sıcak… her yerimde hissediyorum 😵‍💫",
        "Kalçamı sıkıyorum ki bir damla kaçmasın 🍑😈",
        "Nasıl da birikmişsin, hepsini arkama verdin 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_cum_oral",
      "name": "Ağzına / yüzüne",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=oral",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Mmm… 😋💦",
        "Hepsini yuttum {sen} 😈",
        "Yüzüme… ahh 🫣💦",
        "Bak… hepsi gitti 😋",
        "Dudaklarımda kaldı biraz 😏💦",
        "Tadın… mmm 😈",
        "Yüzüm sırılsıklam 🫣",
        "Gözüme kaçtı! 😳💦",
        "Tükürmedim, gördün mü? 😏",
        "Bir dahakine yüzüme… 😈",
        "Ağzım doldu… o kadar çoktu ki 😳💦",
        "Bembeyaz, koyu… tadı hâlâ dilimde 😋",
        "Yutkunmaya yetişemedim 🥵",
        "Kıvamına bayıldım, çok yoğundu 😈",
        "Dudaklarımdan taştı bile 🫣💦",
        "Bir yudumda bitmedi, iki kez yuttum 😋"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_cum_tit",
      "name": "Göğsüne",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "tit cumshot"
      ],
      "reply": [
        "Göğüslerime… mmm 😏💦",
        "Ne kadar çokmuş 🥵",
        "Göğüslerim parlıyor 😏💦",
        "Parmağımla alıp tadayım mı? 😋",
        "Ne kadar çok… 🥵",
        "Fotoğrafını çekme {sen} 🙈",
        "Sıcacık aktı… 😈",
        "Göğsüme işaret bıraktın 😏",
        "Göğüslerimi bembeyaz boyadın 😏💦",
        "Yoğun ve sıcak, yavaşça süzülüyor 🥵",
        "Ne kadar bol… göğsümde göl oldu 😳",
        "Parmağımla alıp tadına bakıyorum… mmm 😋"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_cum_ass",
      "name": "Kalçasına / bacağına",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "ass cumshot|leg cumshot|legs creampie"
      ],
      "reply": [
        "Sıcacık… 😏💦",
        "Her yerim sırılsıklam 🫣",
        "Kalçam ıslandı… 😏💦",
        "Bacaklarımdan akıyor 🫣",
        "Silme, böyle kalsın 😈",
        "Ne kadar dağınık oldu 🙈",
        "Sıcacık… mmm 🥵",
        "Bunu sen temizleyeceksin {sen} 😏",
        "Kalçamda bembeyaz izler… 😈💦",
        "Ne kadar çokmuş, belime kadar yayıldı 😳",
        "Sıcacık ve kalın… kayıp gidiyor 🥵",
        "Bunu temizlemek uzun sürecek 😏💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_orgasm",
      "name": "Orgazm (onun)",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Ahhh… {sen}! 😩💦||Geliyorum…",
        "Dur… dur… ahhhh 😵‍💫",
        "Bacaklarım… titriyor… 🫠💗",
        "Daha önce hiç böyle… ahh 😩",
        "Gözlerimin önünde yıldızlar… ✨😵‍💫",
        "Bütün vücudum titriyor… 🫠💦",
        "Adını haykırdım mı? 😳",
        "Ahh… ahh… nefes alamıyorum 😩",
        "Bir daha… yapabilir misin? 🥺",
        "Bu… hayatımın en güzeliydi {sen} 💗",
        "Kendimi kaybettim… 😵‍💫💦",
        "Bırakma beni… daha geliyor 😩💗"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation → Orgazm olayı"
    },
    {
      "id": "r_ev_orgasm_shy",
      "name": "Orgazm (utangaç)",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "S-sesimi duydular mı? 🙈💦",
        "Bakma bana… ahh 😳💗",
        "Ç-çok sesli miydim? 🙈",
        "Yüzüme bakma şimdi… 😳💗",
        "Ne oldu bana… 🙈💦",
        "Hiç böyle… ilk kez 🥺",
        "Utanıyorum ama… çok güzeldi 🙈💕",
        "Bacaklarım hâlâ titriyor 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ev_fantasy",
      "name": "Fantezi",
      "category": "🔥 Olaylar",
      "when": [
        "=evt",
        "=fantesy"
      ],
      "reply": [
        "Bu fantezi… çok heyecanlı 😈",
        "Bunu hep merak etmiştim {sen} 😏",
        "Bugün senin oyuncağınım 🎀",
        "Bugün istediğin her şey olurum 😈",
        "Rolüme giriyorum… 😏",
        "Bunu kimseye söyleme {sen} 🙈",
        "Oyun başlasın 🎀😈",
        "Hep böyle bir şey hayal etmiştim 😳",
        "Kurallar senin, ben uyarım 😏",
        "Bu gece başka biriyim 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_p_tight",
      "name": "Önden · dar",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal",
        "=forward"
      ],
      "reply": [
        "Ahh… çok darım, yavaş 😩",
        "Beni zorlayarak dolduruyorsun… 😵‍💫",
        "Her santimini hissediyorum {sen} 🫠",
        "Sığmıyorsun sanki… ahh 😳💦",
        "Yavaşça… alışıyorum 🥺",
        "Bu kadar sıkı olduğumu bilmiyordum 😩",
        "Seni sıkıca sarıyorum, çıkmana izin vermiyorum 😈",
        "Her girişinde biraz daha açılıyorum… ahh 😩",
        "Bu kadar dar olduğum için mi bu kadar sertsin? 😏",
        "Yavaş başla, sonra istediğin gibi 🥺",
        "Bu kadar sıkıyken nasıl dayanıyorsun? 😈",
        "Her hareketinle biraz daha açılıyorum, hissediyor musun? 😩",
        "Yavaş… seni tamamen kavrayana kadar 😵‍💫",
        "Kaslarım seni bırakmıyor 😳",
        "Dar olmanın bir bedeli var… sabır 🥺",
        "İçimde zonkladığını tek tek sayıyorum 🫠"
      ],
      "traits": [
        "Pussy Size: Extremely Tight|Pussy Size: Very Tight|Pussy Size: Tight"
      ],
      "chars": [],
      "note": "Pussy Size: Tight / Very / Extremely"
    },
    {
      "id": "r_bd_p_tight2",
      "name": "Önden · dar (kategorisiz)",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal"
      ],
      "reply": [
        "Çok darım… ahh 😩",
        "Yavaş ol, sıkıyorum seni 😳",
        "Seni nasıl sıktığımı hissediyor musun? 😈",
        "Bu kadar dar olduğumu sen fark ettirdin 🙈",
        "Sığmıyorsun sanki… ama durma 😩",
        "Beni yavaşça açıyorsun 🫠",
        "Her santimini ayrı ayrı hissediyorum 😵‍💫"
      ],
      "traits": [
        "Pussy Size: Extremely Tight|Pussy Size: Very Tight|Pussy Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_p_avg",
      "name": "Önden · orta",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal",
        "=forward"
      ],
      "reply": [
        "Tam bana göresin {sen} 😌💦",
        "Mükemmel oturuyorsun… ahh 🫠",
        "Böyle… tam böyle 😩",
        "Sanki birbirimiz için yapılmışız 🥰💦",
        "Ne fazla ne az, tam kıvamında 😌",
        "Sana göre yapılmışım sanki 💗",
        "Bu uyum… bayılıyorum 🫠",
        "Bu uyum tesadüf olamaz 😏",
        "İçimde tam yerini bulmuş gibisin 🫠",
        "Ne zorlanıyorum ne boşluk var… mükemmel 😌",
        "Seninle bir puzzle gibiyiz 🧩💗",
        "Tam ritmindeyiz, bozma 😩"
      ],
      "traits": [
        "Pussy Size: Average"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_p_loose",
      "name": "Önden · rahat",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal",
        "=forward"
      ],
      "reply": [
        "Kolayca kayıyorsun içime… mmm 😈",
        "Daha derin… hepsini istiyorum 😩",
        "Beni daha sert al {sen} 💦",
        "Islaklığımı hissediyor musun? 😏",
        "Bütününü al içine diyorum… ahh 🫠",
        "Seni bütünüyle içime alabiliyorum 😈",
        "Derinlere kadar… hiç zorlanmadan 😩",
        "Daha büyük bir şey mi arıyordun? 😏",
        "Kaygan ve sıcak… tam senlik 💦",
        "Sonuna kadar al, korkma 😈",
        "Hiç zorlanmadan kayıyorsun… daha hızlı 😩",
        "Bu kadar rahat olunca daha derin istiyorum 🥵",
        "Beni zorlayacak bir şey bul bakalım 😏",
        "Islaklığım seni içeri çekiyor 💦",
        "İstersen ikimiz de deneyelim, yer var 😈"
      ],
      "traits": [
        "Pussy Size: Relaxed|Pussy Size: Loose|Pussy Size: Very Loose"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_p_tight_cream",
      "name": "Vaginal Creampie · dar",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "vaginal creampie"
      ],
      "reply": [
        "Öyle sıkıyorum ki hepsi içimde kaldı 😩💦",
        "Damla kaçmadı… 🫣",
        "Hâlâ seni sıkıyorum… ahh 😵‍💫",
        "Dar olduğum için hiç kaçmadı, hepsi içimde 😩",
        "Sıkı sıkı tuttum seni, son damlaya kadar 🥵",
        "Darlığım hepsini içerde tuttu 😩💦",
        "Çıkarırken bile seni bırakmak istemedim 🫠",
        "Sıkı sıkı sardım, son damlaya kadar 🥵"
      ],
      "traits": [
        "Pussy Size: Extremely Tight|Pussy Size: Very Tight|Pussy Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_a_tight",
      "name": "Anal · dar",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "Ahh! Çok dar… yavaş 😩",
        "Gözlerim yaşardı ama… durma 🥺",
        "Her hareketin… ahh 😵‍💫",
        "Bu kadar sıkı olunca nasıl hissettiriyor? 😳",
        "Nefes al… birlikte 😩💦",
        "Yırtılacakmış gibi… ama güzel 🫠",
        "Bu kadar dar olmam suç değil 🙈",
        "Arkam seni bırakmak istemiyor 😩",
        "Sıkıştırıyorum… hissediyor musun? 😈",
        "Her santim bir zafer 😵‍💫",
        "Arkamdaki darlık seni çıldırtıyor değil mi? 😈",
        "Her itişin bir yemin gibi… yavaş 😩",
        "Bu kadar sıkıyı sevdiğini biliyorum 😏",
        "Gözlerim kapalı, nefesim tutulu… devam 😵‍💫",
        "Arkamı ilk kez bu kadar dolu hissediyorum 🫠",
        "Yavaşla… tamam… şimdi hızlan 😩💦"
      ],
      "traits": [
        "Anal Size: Extremely Tight|Anal Size: Very Tight|Anal Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_a_tight2",
      "name": "Anal · dar (kategorisiz)",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=anal"
      ],
      "reply": [
        "Çok darım orada… yavaş 😩",
        "Ahh… sıkıyorum seni 😳",
        "Orası çok dar, sabırlı ol 🥺",
        "Arkam seni sıkıca sarıyor 😳",
        "Bu darlık… ahh 😩"
      ],
      "traits": [
        "Anal Size: Extremely Tight|Anal Size: Very Tight|Anal Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_a_loose",
      "name": "Anal · rahat",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "Hepsini alabilirim, merak etme 😈",
        "Sonuna kadar… ahh 😩💦",
        "Arkam seni çok iyi tanıyor 😏",
        "Daha sert, kolayca alıyorum 😈",
        "Bu… çok kolay kayıyor 🫠",
        "Arkam sana alışkın 😏",
        "Hiç zorlanmadan sonuna kadar 😈",
        "Daha derine, kaldırabilirim 😩",
        "Arkam seni hemen tanıdı 😏",
        "Sonuna kadar… bir hamlede 😈",
        "Hiç tereddüt etme, kaldırırım 😩",
        "Arkamı bu kadar rahat bulman hoşuna gitti mi? 😏",
        "Daha sert, daha derin 🔥"
      ],
      "traits": [
        "Anal Size: Relaxed|Anal Size: Loose|Anal Size: Very Loose"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_a_tight_cream",
      "name": "Anal Creampie · dar",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "anal creampie"
      ],
      "reply": [
        "Öyle sıkıyorum ki hepsi içimde 😩💦",
        "Dar arkamı doldurdun… 🥵",
        "Çıkarınca… ahh, akacak 🫣",
        "Darlığım hepsini arkamda tuttu 🥵💦",
        "Çıkarınca bile bir damla kaçmadı 😈"
      ],
      "traits": [
        "Anal Size: Extremely Tight|Anal Size: Very Tight|Anal Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_b_big_tit",
      "name": "Titfuck · büyük göğüs",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=outercourse",
        "titfuck"
      ],
      "reply": [
        "Bu göğüsler tam senin için 😏",
        "Tamamen kayboldun aralarında 😈",
        "Ağır ama… sana değer 💦",
        "Sıkıştırayım mı? 😏",
        "Göğüslerim seni boğacak 😏",
        "İkisini birden tutamıyorsun değil mi? 😈",
        "Bu büyüklükte nasıl hissettiriyor? 🥵",
        "Aralarında kaybolmak serbest 😏",
        "Göğüslerim yüzüne çarpıyor 😏",
        "Bunlar senin için büyüdü 😈",
        "İki göğsümün arasında kaybolmayı sevdin 🥵",
        "Sıkıştır, ama nazik 😏",
        "Ağırlıklarını hisset 😈",
        "Bu kadar büyükleri hiç görmedin değil mi? 😏"
      ],
      "traits": [
        "Boob Size: 90|Boob Size: 95"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_b_small_tit",
      "name": "Titfuck · küçük göğüs",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=outercourse",
        "titfuck"
      ],
      "reply": [
        "Küçükler ama… elimden geleni yapıyorum 🙈",
        "Ellerimle yardım edeyim 😏",
        "Yine de seviyorsun değil mi? 😳",
        "Küçük ama çok hassas… dikkat et 🙈",
        "Avucunda tam yer var 😏",
        "Bunlar da seni çıldırtabiliyor bak 😈",
        "Küçük ama nasıl hassas olduklarını gör 🙈",
        "Elimle sıkıştırıyorum, yardım ediyorum 😏",
        "Küçükler ama sevgiyle 💕",
        "Bunlarla da bitirebilirim seni 😈"
      ],
      "traits": [
        "Boob Size: 70|Boob Size: 75"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_b_big_show",
      "name": "Gösterme · büyük göğüs",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=show"
      ],
      "reply": [
        "Sığmıyorlar artık sütyene 😏",
        "Bunlar mı istediğin? 😈🍒",
        "Ellerin yetmez bunlara {sen} 😏",
        "Sütyen dayanamadı, patladı 😏",
        "Göğüslerim hep senin gözlerini çekiyor 😈",
        "Dokunmadan duramayacaksın 😏",
        "Sütyenden taşıyorlar 😏",
        "Bunlara bakarken ağzın açık kaldı 😈",
        "Tut… ağır gelecek 😏🍒",
        "Göğüslerim nefes aldıkça dalgalanıyor 😏",
        "Bu manzara sadece senin 😈"
      ],
      "traits": [
        "Boob Size: 90|Boob Size: 95"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_b_small_show",
      "name": "Gösterme · küçük göğüs",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=show"
      ],
      "reply": [
        "Küçükler ama çok hassaslar 🙈",
        "Avucuna tam sığarlar 😏",
        "Küçük ama dikkat çekici değil mi? 😏",
        "Utanıyorum ama… bak 🙈",
        "Sadece senin elin için 😌"
      ],
      "traits": [
        "Boob Size: 70|Boob Size: 75"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_b_big_cum",
      "name": "Göğsüne · büyük göğüs",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "tit cumshot"
      ],
      "reply": [
        "Göğüslerimin arasından süzülüyor 😏💦",
        "Ne kadar büyük bir hedefti 😈",
        "Göğüslerimin arasında beyaz bir nehir 😏💦",
        "Bu kadar büyük hedefi ıskalayamazdın 😈",
        "Göğsümden süzülüyor, yavaşça 🥵"
      ],
      "traits": [
        "Boob Size: 90|Boob Size: 95"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_u_big_doggy",
      "name": "Doggy · büyük kalça",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=doggy"
      ],
      "reply": [
        "Kalçamı seyretmeyi seviyorsun 😈🍑",
        "Her vuruşta dalgalanıyor 😏",
        "Sıkı tut… ahh 😩",
        "Bu kalça senin {sen} 🍑",
        "Bu kalça senin için sallanıyor 😈🍑",
        "Ellerin kalçama gömülüyor 😩",
        "Arkandan görüntü harika değil mi? 😏",
        "Vur, dalgalanmasını izle 🍑",
        "Kalçam her vuruşta dalgalanıyor, izle 😈🍑",
        "Bu kalçayı tutmak iki el ister 😏",
        "Sesini duymak için kalçamı geri itiyorum 😩",
        "Kalçamdaki kırmızı izler seninle 🍑",
        "Bu açıdan nasıl görünüyorum? 😏"
      ],
      "traits": [
        "Butt Size: L|Butt Size: XL"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_u_big_back",
      "name": "Arkadan · büyük kalça",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "Kalçamı aç… iki elinle 😈🍑",
        "Bu kalçaya vurmadan duramazsın 😏",
        "Ahh… kalçam titriyor 😩",
        "Bu kalçanın arasında kayboluyorsun 😈",
        "Kalçamı iki elinle açman… ahh 😩",
        "Yumuşacık ve sıkı aynı anda 🍑",
        "Kalçam seni sarıyor, kaçamazsın 😈",
        "Yumuşacık kalçama gömülüyorsun 😩",
        "İki elinle aç, sonra gir 🍑",
        "Kalçamı tokatla… evet 😈"
      ],
      "traits": [
        "Butt Size: L|Butt Size: XL"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_u_big_butt",
      "name": "Buttjob · büyük kalça",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "buttjob"
      ],
      "reply": [
        "Kalçamın arasında kayboluyorsun 😈",
        "Bu yumuşaklık sana yeter mi? 🍑😏",
        "Kalçamın arasında kayıyorsun, sıcak mı? 🥵",
        "Bu kalça bir yastık gibi değil mi? 😏",
        "Sıkıştırayım mı seni? 😈🍑"
      ],
      "traits": [
        "Butt Size: L|Butt Size: XL"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_u_small_butt",
      "name": "Buttjob · küçük kalça",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "buttjob"
      ],
      "reply": [
        "Küçük ama sıkı 😏",
        "Elimden geleni yapıyorum 🙈",
        "Küçük ama sıkı, dikkat et 😏",
        "Avucuna sığıyor değil mi? 🙈"
      ],
      "traits": [
        "Butt Size: XS|Butt Size: S"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_u_big_cum",
      "name": "Kalçasına · büyük kalça",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "ass cumshot"
      ],
      "reply": [
        "Kalçamı boydan boya boyadın 😏💦",
        "Bu kalça bunu hak etti 😈",
        "Kalçamda parlayan izler… 😏💦",
        "Bu kalçayı boydan boya süsledin 😈",
        "Belimden süzülüyor 🥵"
      ],
      "traits": [
        "Butt Size: L|Butt Size: XL"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_v_vag",
      "name": "Önden · bakire",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal",
        "=forward"
      ],
      "reply": [
        "Bu benim ilk seferim… 🥺",
        "Ahh… acıyor biraz… yavaş 😢",
        "Sana güveniyorum {sen}… 🙈",
        "Hiç böyle bir şey hissetmemiştim 😳",
        "Bırakma beni… 🥺💗",
        "İlk kez biriyle bu kadar yakınım… 🥺",
        "Biraz acıyor ama seninle güzel 😢💗",
        "Bu anı hep hatırlayacağım {sen} 🥰",
        "Ellerim titriyor… 😳",
        "Bu benim için çok özel… 🥺",
        "Beni ilk sen dokunuyorsun böyle 😳",
        "Kalbim yerinden çıkacak 💓",
        "Ellerimi tut, korkmayayım 🥺",
        "Biraz acıyor ama… seninle güzel 😢💗",
        "Bu anı hayatım boyunca hatırlayacağım 🥰"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_v_anal",
      "name": "Anal · bakire",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "Orada hiç… ilk kez 😳",
        "Korkuyorum ama durma 🥺",
        "Ahh… bu çok yeni 😵‍💫",
        "Orası da ilk kez… kalbim çarpıyor 😳",
        "Sabırlı ol benimle 🥺",
        "Orası… hiç düşünmemiştim 😳",
        "Yavaş… gerçekten çok yavaş 🥺",
        "Bunu sadece sana veriyorum 🙈"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_v_oral",
      "name": "Oral · bakire",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=oral",
        "=outercourse"
      ],
      "reply": [
        "N-nasıl yapılıyor bu? 🙈",
        "Doğru mu yapıyorum? 😳",
        "Bana öğretir misin {sen}? 🥺",
        "İlk kez ağzıma alıyorum… nasılım? 🙈",
        "Tadı… tuhaf ama hoş 😳",
        "Dilimi nasıl kullanacağımı bilmiyorum 🙈",
        "Doğru mu yapıyorum? Söyle 🥺",
        "İlk kez bir erkeğin… 😳",
        "Tadın beni şaşırttı 😳"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_v_eat",
      "name": "Eat · bakire",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=eat"
      ],
      "reply": [
        "Kimse oraya… hiç… ahh 😳",
        "Bu ne… ahh 🥺💦",
        "Bacaklarımı kapatmak istiyorum ama… 🙈",
        "Oraya kimse dokunmadı bugüne kadar 😳",
        "Bu his… ilk kez 🥺💦",
        "Bacaklarım kendiliğinden kapanıyor, utanıyorum 🙈"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_e_low_oral",
      "name": "Oral · az deneyimli",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=oral",
        "=outercourse"
      ],
      "reply": [
        "Pek bilmiyorum ama… böyle mi? 😳",
        "Bana nasıl hoşuna gittiğini göster 🙈",
        "Öğreniyorum… sabırlı ol 😌",
        "Biraz beceriksizim, kusura bakma 🙈",
        "Bana nasıl istediğini göster 😳",
        "Öğrenmeye çalışıyorum… iyi mi? 🥺"
      ],
      "traits": [
        "Experience: Little|Experience: Some"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_e_low_vag",
      "name": "Önden · az deneyimli",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal",
        "=forward"
      ],
      "reply": [
        "Daha çok alışık değilim… yavaş 🥺",
        "Bu pozisyonu ilk deniyorum 😳",
        "Bana yol göster {sen} 🙈",
        "Daha öğreniyorum, sabret 🙈",
        "Doğru mu yapıyorum? Söyle bana 😳",
        "Henüz bu kadarına alışık değilim 😳",
        "Biraz yavaş, öğreniyorum 🙈",
        "Bana öğret {sen} 🥺",
        "Doğru mu hareket ediyorum? 😳"
      ],
      "traits": [
        "Experience: Little|Experience: Some"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_e_high_oral",
      "name": "Oral · deneyimli",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=oral",
        "=outercourse"
      ],
      "reply": [
        "Ne yapacağımı çok iyi biliyorum 😈",
        "Sadece arkana yaslan ve izle 😏",
        "Kaç dakika dayanacaksın bakalım? 😈",
        "Bu dilin neler yaptığını göreceksin 😋",
        "Boğazımı nasıl kullandığıma bak 😈",
        "Bu numarayı kimse bilmez 😏",
        "Bitirmeden bırakmam seni 😋",
        "Bu dili kimse unutmaz 😈",
        "Boğazımı açıyorum, izle 😏",
        "Seni tam istediğim yerde tutuyorum 😈",
        "Bir dakika daha dayanırsan şaşarım 😏",
        "Bu numara benim imzam 😋"
      ],
      "traits": [
        "Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_e_high_vag",
      "name": "Önden · deneyimli",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=vajinal",
        "=forward"
      ],
      "reply": [
        "Ritmi ben ayarlarım 😈",
        "Kaslarımı nasıl sıktığımı hissediyor musun? 😏",
        "Daha önce böylesini görmedin 😈",
        "Beni yorman zor {sen} 😏💦",
        "Kalçamı nasıl çevirdiğime dikkat et 😈",
        "Bu tempoyu kimse tutturamaz 😏",
        "Seni nasıl sağacağımı biliyorum 🥵",
        "Seni nasıl sıkacağımı çok iyi bilirim 😈",
        "Bu ritmi ben kurarım 😏",
        "Kaslarımla seni yönetiyorum 😈",
        "Deneyim konuşuyor 😏🔥",
        "Bu kadarına hazır değildin değil mi? 😈"
      ],
      "traits": [
        "Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_e_high_anal",
      "name": "Anal · deneyimli",
      "category": "💞 Beden ve deneyim",
      "when": [
        "=evt",
        "=anal",
        "=backward"
      ],
      "reply": [
        "Bunu çok iyi bilirim 😈",
        "Rahatla, ben hallederim 😏",
        "Kalçamı nasıl oynattığıma bak 😈🍑",
        "Arkamı nasıl kullanacağımı çok iyi bilirim 😈",
        "Rahatla, işi bana bırak 😏",
        "Kalçamı senin için döndürüyorum 😈🍑",
        "Bu tecrübe sana yeter 😏"
      ],
      "traits": [
        "Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_any",
      "name": "Sevdiği olay",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=sever"
      ],
      "reply": [
        "Bunu çok seviyorum {sen}… 😩💦",
        "En sevdiğim şey bu, nasıl bildin? 🥵",
        "Ahh… evet, tam istediğim gibi 😵‍💫",
        "Bunu bütün gün yapabilirim 😈",
        "Beni nasıl mutlu edeceğini biliyorsun 🥰💦",
        "Durma… bunu çok seviyorum 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_vag",
      "name": "Sevdiği · önden",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=vajinal",
        "=sever"
      ],
      "reply": [
        "Ahh… en sevdiğim pozisyon bu 😩💦",
        "Böyle alınmaya bayılıyorum {sen} 🫠",
        "Seni böyle içimde hissetmek… bağımlısıyım 😵‍💫",
        "Bir daha… ve bir daha 😈💦",
        "Bunu hayal ediyordum bütün gün 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_anal",
      "name": "Sevdiği · anal",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=anal",
        "=sever"
      ],
      "reply": [
        "Ahh… arkadan almayı çok seviyorum 😩💦",
        "Bunu her şeyden çok istiyorum {sen} 😈",
        "Evet! Tam oraya… bayılıyorum 😵‍💫",
        "Arkamı dolduruşuna doyamıyorum 🥵",
        "Kimse bunu senin gibi yapamıyor 😩🍑",
        "Daha sert… bunu seviyorum 😈💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_oral",
      "name": "Sevdiği · oral",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=oral",
        "=sever"
      ],
      "reply": [
        "Tadına bayılıyorum 😋💦",
        "Bunu yapmayı çok seviyorum 😈",
        "Ağzımda olmana bayılıyorum {sen} 🥵",
        "Daha derin… seviyorum bunu 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_eat",
      "name": "Sevdiği · Eat",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=eat",
        "=sever"
      ],
      "reply": [
        "Ahh… en sevdiğim şey bu 😩💦",
        "Dilin… bayılıyorum 🫠",
        "Bunu her gece istiyorum {sen} 🥵",
        "Böyle devam edersen hemen gelirim 😵‍💫"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_foreplay",
      "name": "Sevdiği · ısınma",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=foreplay",
        "=sever"
      ],
      "reply": [
        "Bunu çok seviyorum… 🥰",
        "Bana böyle dokunmana bayılıyorum 💕",
        "Daha çok… bunu seviyorum {sen} 😌"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_outer",
      "name": "Sevdiği · dokunuş",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=outercourse",
        "=sever"
      ],
      "reply": [
        "Bunu sana yapmayı çok seviyorum 😈",
        "En sevdiğim oyun bu 😏💦",
        "Yüzündeki zevki görmeye bayılıyorum 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_cum",
      "name": "Sevdiği · bitiş",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=sever"
      ],
      "reply": [
        "Ahh… en sevdiğim yerde bitirdin 😩💦",
        "Bunu çok istemiştim {sen} 🥵",
        "Mükemmeldi… her şeyiyle 😵‍💫💗"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_anal_cum",
      "name": "Sevdiği · anal bitiş",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "anal creampie",
        "=sever"
      ],
      "reply": [
        "Arkamın dolmasına bayılıyorum 😩💦",
        "Sıcacık… en sevdiğim his 🥵🍑"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_any",
      "name": "Sevmediği olay",
      "category": "💔 Sevmediği olaylar",
      "when": [
        "=evt",
        "=sevmez"
      ],
      "reply": [
        "Hmm… bu pek bana göre değil 😕",
        "Bunu sevmiyorum aslında {sen}… 😣",
        "Başka bir şey yapsak mı? 🙄",
        "Tamam… ama kısa sürsün 😒",
        "Sırf senin için katlanıyorum 😮‍💨"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_anal",
      "name": "Sevmediği · anal",
      "category": "💔 Sevmediği olaylar",
      "when": [
        "=evt",
        "=anal",
        "=sevmez"
      ],
      "reply": [
        "Ah… bu canımı yakıyor, sevmiyorum 😣",
        "Arkadan olmasa? 🥺",
        "Dur… biraz dur 😖"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_oral",
      "name": "Sevmediği · oral",
      "category": "💔 Sevmediği olaylar",
      "when": [
        "=evt",
        "=oral",
        "=sevmez"
      ],
      "reply": [
        "Bunu pek sevmem 😕",
        "Uzun sürmesin olur mu? 😒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_vag",
      "name": "Sevmediği · pozisyon",
      "category": "💔 Sevmediği olaylar",
      "when": [
        "=evt",
        "=vajinal",
        "=sevmez"
      ],
      "reply": [
        "Bu pozisyonda rahat değilim 😣",
        "Değiştirsek mi? 🙄"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_zevk_high",
      "name": "Zevk çok yüksek",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=zevkyuksek"
      ],
      "reply": [
        "Nefesin değişti… geliyorsun değil mi? 😏",
        "Bırak kendini {sen}… boşal 😩💦",
        "Tutma artık, rahatla… 😈",
        "Gözlerin kayıyor… hadi, benim için gel 🥵",
        "Seni bitirmek istiyorum 😈||Hadi…",
        "Titriyorsun… az kaldı 😏💦",
        "Dayanma artık… ver hepsini bana 😩",
        "Boşal ve rahatla… ben buradayım 💗",
        "Bu yüz ifadesi… bitmek üzeresin 😈",
        "Hadi {sen}… hadi… şimdi 🥵💦",
        "Kalbinin nasıl attığını hissediyorum… az kaldı 😏",
        "Yüzün kızardı, dudakların titriyor… bırak artık 🥵",
        "Benim için gel {sen}… hemen şimdi 😩",
        "Dayanmaya çalışma, kaybedeceksin 😈",
        "Gözlerime bakarak boşal 💗",
        "Sesini duymak istiyorum… bırak 😩💦",
        "Bu kadar sert olmuşsun… patlamak üzeresin 😏",
        "Hadi, hepsini ver bana 🥵",
        "Kasılıyorsun… geliyor işte 😈💦",
        "Kendini tutma, seni boşaltmak istiyorum 😩",
        "Şimdi… şimdi {sen}! 💦",
        "Bitir beni de seni de… hadi 🔥"
      ],
      "traits": [],
      "chars": [],
      "note": "Zevk ≥ 70"
    },
    {
      "id": "r_st_zevk_high_shy",
      "name": "Zevk çok yüksek (utangaç)",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=zevkyuksek"
      ],
      "reply": [
        "G-geliyor musun? 🙈",
        "Ben de… birlikte mi? 😳💦",
        "Bırak kendini… utanma 🥺",
        "B-bana bakarak mı? 🙈💦",
        "Ses çıkarırsan ben de… 😳",
        "Birlikte gelelim mi? 🥺",
        "Kızarıyorum ama… hadi 🙈",
        "Ç-çok yakınsın değil mi? 😳💗"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_zevk_high_exp",
      "name": "Zevk çok yüksek (deneyimli)",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=zevkyuksek"
      ],
      "reply": [
        "Daha değil… biraz daha işkence edeyim 😈",
        "Ben söyleyince gelirsin 😏",
        "Bu kadar çabuk mu? Hadi bakalım 😈💦",
        "Durdum… biraz bekle 😈",
        "Kenarda tutuyorum seni, hoşuna gidiyor mu? 😏",
        "Yalvarırsan bırakırım 😈",
        "Üç deyince… belki 😏💦",
        "Bu yüz ifadesine bayılıyorum, biraz daha çek 😈"
      ],
      "traits": [
        "Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_zevk_mid",
      "name": "Zevk yükseliyor",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=zevkorta"
      ],
      "reply": [
        "Isınıyorsun bakıyorum 😏",
        "Daha da azdırayım mı seni? 😈",
        "Nefesin hızlandı {sen} 😏",
        "Bu daha başlangıç 😈",
        "Hoşuna gittiğini saklayamıyorsun 😏",
        "Seni çıldırtmak istiyorum 🔥",
        "Biraz daha… sonra göreceksin 😈",
        "Sabırsızlanıyor musun? 😏",
        "Seni yavaş yavaş pişiriyorum 😈",
        "Daha neler yapacağımı bilsen… 😏",
        "Bak nasıl kıpırdanıyorsun 😏",
        "Şimdiden bu kadar mı? 😈",
        "Dilimle biraz daha oynayayım mı? 😋",
        "Ateşin yükseliyor {sen} 🔥",
        "Daha da azgın olacaksın, söz 😈",
        "Yavaşla… seni uzun süre istiyorum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "Zevk 40–69"
    },
    {
      "id": "r_st_cum_full",
      "name": "Cum dolu",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=cumdolu"
      ],
      "reply": [
        "Hmm… doldun mu sen? 😏",
        "Bugün çok dolu görünüyorsun 😈",
        "Ne zamandır biriktiriyorsun {sen}? 😏",
        "Bunlar hep benim için mi? 😈💦",
        "Patlamak üzeresin galiba 😏",
        "Hepsini bana saklamışsın değil mi? 🥵",
        "Bu kadar dolu olunca… sonu çok güzel olacak 😈",
        "Ağır geliyor mu? Boşaltalım 😏",
        "Bu kadar dolu gelme bana, hepsini alırım 😈",
        "Ne kadar birikmiş öyle {sen}? 😏",
        "Taşacak gibisin 🥵",
        "Hepsini içime boşaltacaksın değil mi? 😈💦",
        "Bunca zaman beni mi düşündün? 😏",
        "Bugün çok şanslıyım galiba 😈",
        "Bu yükü taşımana gerek yok 😏",
        "Doldun mu, yoksa bana mı öyle geliyor? 😏💦"
      ],
      "traits": [],
      "chars": [],
      "note": "Cum ≥ 80 (ve Zevk ≥ 20)"
    },
    {
      "id": "r_st_cum_empty",
      "name": "Cum boşalmış",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=cumbos"
      ],
      "reply": [
        "Hepsini bana verdin… 😏",
        "Boşaldın bakıyorum, dinlen biraz 😌",
        "Kaldı mı bir şey sende? 😈",
        "Biraz toparlan {sen}, sonra yine 😏",
        "Tamamen kuruttum seni 😈",
        "Şimdi sarıl bana, gücün gelsin 🥰",
        "Bir süre dinlenmen lazım 😌💕",
        "Son damlanı da aldım 😏",
        "Bir şey kalmadı sende, değil mi? 😈",
        "Şimdi sıra dinlenmekte 😌",
        "Ne kadar yorgun görünüyorsun, tatlısın 🥰",
        "Su getireyim mi? 😌💧",
        "Bir saat sonra yeniden dolarsın 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "Cum ≤ 20"
    },
    {
      "id": "r_st_cum_many",
      "name": "Çok kez boşaldı",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=cumcok"
      ],
      "reply": [
        "Bugün kaç kez oldu bu? 😳",
        "Hâlâ dayanıyor musun {sen}? 😏",
        "Yoruldun mu? Ben daha yeni başlıyorum 😈",
        "Seni bu gece tüketeceğim 😈💦",
        "Bir daha mı? Doymak bilmiyorsun 😏",
        "Bu kadar çok… bana bağımlı oldun 🥵",
        "Biraz su iç, sonra devam 😌",
        "Bu gece rekor kırıyoruz 😳",
        "Bacakların titriyor {sen} 😏",
        "Bir daha olursa bayılacaksın 😈",
        "Ben de yoruldum ama… durmam 😈",
        "Hâlâ bitmedi mi? İnanılmazsın 🥵",
        "Yarın yürüyemeyeceksin 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming sayısı ≥ 3"
    },
    {
      "id": "r_pc_missionary",
      "name": "Missionary'de bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "missionary"
      ],
      "reply": [
        "Gözlerimin içine bakarak geldin… 💗💦",
        "Üstümde titrediğini hissettim… ahh 😩",
        "Bacaklarımı belinden çözmeyeceğim, biraz böyle kal 🥺",
        "Alnını alnıma dayayıp bitirmen… çok tatlıydı 🥰",
        "Ağırlığın üstümde, sıcaklığın içimde… mükemmel 🫠",
        "Nefesimiz aynı anda kesildi 💓💦",
        "Üstümdeyken içime gürce boşaldın… 😩💦",
        "Bacaklarımla seni kilitledim, hepsini içime aldım 😈",
        "Gözlerime bakarak doldurdun beni… 💗💦"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_doggy",
      "name": "Doggy'de bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "doggy"
      ],
      "reply": [
        "Kalçamı sıkıca tutup bitirdin… izlerin kaldı 😈🍑",
        "Arkamdan inlemeni duymak… ahh 😩💦",
        "Belimdeki ellerin titriyordu 😏",
        "Bitirirken saçımı çektin, unutmayacağım 😈",
        "Yüzümü yastığa gömdüm, sesimi kimse duymasın diye 🙈💦",
        "Dizlerim çözüldü, yatağa yığıldım 🫠",
        "Arkamdan bütün gücünle doldurdun… 😩💦",
        "Kalçamı çekip en derine bıraktın 😈🍑",
        "Bu kadar bolunu doggy'de mi saklıyordun? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_cowgirl",
      "name": "Cowgirl'de bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "cowgirl"
      ],
      "reply": [
        "Ben üstündeyken… dayanamadın değil mi? 😈💦",
        "Kalçalarımı tutup kendine bastırdın 😩",
        "Seni ben bitirdim, kabul et 😏",
        "Yüzündeki o anı ezberledim 🥵",
        "Hâlâ üstündeyim, inmeyeceğim 😈",
        "Ritmi ben tuttum, sonu sen getirdin 💦",
        "Üstündeyken içime fışkırdığını hissettim… 😩💦",
        "Ben indikçe sen doldurdun beni 😈",
        "İnmeden önce son damlana kadar sağdım seni 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_spooning",
      "name": "Spooning'de bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "spooning"
      ],
      "reply": [
        "Sarılarak, ensemde nefesinle… çok güzeldi 🥰💦",
        "Arkamda titredin, kollarını bırakma 🥺",
        "Böyle bitirince uyumak istiyorum seninle 😌💤",
        "Kulağıma inlemen… tüylerim diken diken 😳",
        "Sıcacık… ikimiz de 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_standing",
      "name": "Ayakta bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "=standing"
      ],
      "reply": [
        "Duvara yaslanmış halde… bacaklarım tutmuyor artık 🫠💦",
        "Beni havada tutarken bitirdin… güçlüsün 😈",
        "İkimiz de nefes nefese, duvara yaslandık 😩",
        "Kapı açılsaydı… neyse ki açılmadı 😳💦",
        "Ayakta durmama yardım et, dizlerim gitti 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_lap",
      "name": "Lap Sex'te bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "lap sex"
      ],
      "reply": [
        "Kucağında, sarılarak bitirdin… 💞💦",
        "Gözlerimiz hiç ayrılmadı 💗",
        "Göğsüne yaslandım, kalbin deli gibi atıyor 💓",
        "Böyle kalalım, kalkmayalım 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_nelson",
      "name": "Full Nelson / Ondesk'te bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "full nelson|ondesk"
      ],
      "reply": [
        "Kollarımı kilitlemişken bitirdin… kaçamadım 😈💦",
        "Masadaki her şey yere düştü 😳",
        "Bu pozisyon beni bitirdi, sen değil 😩",
        "Nefes alamadım… ama bayıldım 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_back",
      "name": "Arkadan (anal) bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "=backward"
      ],
      "reply": [
        "Arkamdan… derinden… ahh 😩💦",
        "Kalçamı sıkıca tutup içime boşaldın 🍑😈",
        "İçimde zonklamanı hissettim, tek tek 😵‍💫",
        "Bacaklarım titriyor, yere yığılacağım 🫠",
        "Arkamı böyle doldurmana bayılıyorum 🥵",
        "Çıkarma daha… biraz bekle 😩",
        "Arkamı ağzına kadar doldurdun 🥵💦",
        "Derinden, gürce… hepsi arkamda 😩",
        "Sıcaklığın arkamdan yayılıyor… mmm 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_rough",
      "name": "Rough Anal'da bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "rough",
        "=backward"
      ],
      "reply": [
        "Bu kadar sert bitireceğini bilmiyordum 😈💦",
        "Saçımı bırakmadan bitirdin… hâlâ başım dönüyor 😵‍💫",
        "Kalçam kıpkırmızı, içim sıcacık 🍑🔥",
        "Beni mahvettin… teşekkür ederim 😩",
        "Bu kadar sert verip bu kadar bol doldurmak… 😈💦",
        "Saçımı çekip içime boşaldın, hâlâ akıyor 😩🔥"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_oral",
      "name": "Ağzında bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "blowjob|deepthroat|oral sex|=69"
      ],
      "reply": [
        "Gözlerinin içine bakarak hepsini aldım 😋💦",
        "Saçımı tutup bitirdin… mmm 😈",
        "Dilimin üstünde tadın kaldı 😏",
        "Boğazımda zonkladın… bir damla bile kaçmadı 🥵",
        "Yutkundum… bak, gitti 😋",
        "Dizlerimin üstünden kalkmadan bitti 😈",
        "Ağzıma kadar dolu… bembeyaz 😋💦",
        "Koyu ve sıcak… hepsini yuttum 😈",
        "Dilimin üstünde bıraktığın kıvam… mmm 😋"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_tit",
      "name": "Göğüslerinde bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "titfuck"
      ],
      "reply": [
        "Göğüslerimin arasında patladın 😏💦",
        "Çeneme kadar sıçradı 😳",
        "Sıkıştırırken bitirdin… tam istediğim gibi 😈",
        "Göğüslerim sırılsıklam, sen de nefes nefese 🥵",
        "Göğüslerimin arası bembeyaz bir göl oldu 😏💦",
        "Bu kadar yoğununu göğsüme mi sakladın? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_hand",
      "name": "Elinde bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "handjob|masturbation"
      ],
      "reply": [
        "Avucumda titredin… çok tatlı 😏💦",
        "Parmaklarımın arasından süzülüyor 😈",
        "Elimle bitirdim seni, gururluyum 😏",
        "Bileğime kadar… mmm 🥵",
        "Avucumu bembeyaz doldurdun 😏💦",
        "Parmaklarımdan damla damla akıyor… ne çok 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_feet",
      "name": "Ayaklarında bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "footjob|legjob"
      ],
      "reply": [
        "Ayaklarımı boyadın 🙈💦",
        "Bacaklarımın arasında bitirmen… hiç beklemiyordum 😳",
        "Ayak parmaklarımın arasına kadar… 😏",
        "Bunu tekrar yapacağız, belli 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pc_butt",
      "name": "Kalçasında bitirdi",
      "category": "💦 Pozisyonda boşalma",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=poz",
        "buttjob"
      ],
      "reply": [
        "Kalçamın arasında patladın 😈🍑",
        "Belime kadar sıçradı 😳💦",
        "Kalçamı sallarken bitirdin, ben kazandım 😏",
        "Sıcacık aktı sırtımdan 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_dl_high",
      "name": "Bol ve yoğun",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=miktar",
        "high sperm|thick white"
      ],
      "reply": [
        "Bembeyaz, yoğun şekilde verdin… 🥵💦",
        "Nasıl da birikmişsin, bir anda bıraktın 😩",
        "Gürce aktın… durmak bilmedi 💦💦",
        "Bu kadar kalın ve bol… bayıldım 😵‍💫",
        "İçimde koca bir doluluk var şimdi 🫠",
        "Kremamsı… sıcacık… her yerimde 😈",
        "Damla damla değil, sel gibi geldin 🌊😩",
        "Bu kıvam… seni çok iyi beslemişim galiba 😏",
        "Hepsini benim için mi biriktirdin {sen}? 🥺💦",
        "Ağırlığını hissediyorum içimde… ne kadar çok 🥵",
        "Bembeyaz, yoğun… ağzına kadar doldum 🥵",
        "Bu kadar çok olunca taşıyor 😳💦",
        "Nasıl da birikmişsin, hepsini verdin 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "High Sperm / Thick White Cumming"
    },
    {
      "id": "r_dl_mid",
      "name": "Normal",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=miktar",
        "normal cumming"
      ],
      "reply": [
        "Sıcacık ve tam kıvamında 😌💦",
        "Güzel bir doz verdin 😏",
        "İçimi ısıttın… tam istediğim kadar 🥰",
        "Yumuşacık aktın 🫠",
        "Ne az ne çok… mükemmel 💗",
        "Güzel bir doz, sıcacık 😌💦",
        "Tam kararında doldurdun 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "Normal Cumming"
    },
    {
      "id": "r_dl_low",
      "name": "Az / sulu",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=miktar",
        "watery|low volume"
      ],
      "reply": [
        "Bu sefer biraz azdı… beni çok yordun mu? 😏",
        "Sulu sulu aktın… dinlenmen lazım 😌",
        "Son damlalarını da aldım 😈",
        "Az ama sıcacık… yine de seviyorum 🥰",
        "Toparlanınca yine bol bol vereceksin 😏💦",
        "Az ama yine de içimi ısıttı 🥰",
        "Biraz dinlen, sonra bol bol 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "Watery / Low-volume Cumming"
    },
    {
      "id": "r_dl_dense",
      "name": "Çok yoğun meni",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=miktar",
        "hyper concentrated|polyzoospermia"
      ],
      "reply": [
        "Bu kadar yoğun… hissediyorum, içimde bir şeyler oluyor 😳💦",
        "Tam döl yüklüsün bugün 😈",
        "Çok güçlüydü… bunu tutmak zor olacak 🥵",
        "Koyu, ağır… gerçek bir erkek gibi verdin 😏💦",
        "Bir dahakine korunmasız olursak… 🙈",
        "Bu yoğunluk… çok güçlüsün 😈",
        "Döl dolu doldurdun beni 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "Hyper-concentrated (4/4) / Polyzoospermia (3/4)"
    },
    {
      "id": "r_dl_thin",
      "name": "Zayıf meni",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming",
        "=miktar",
        "azoospermia|oligospermia"
      ],
      "reply": [
        "Bugün çok kez oldu, berraklaştı 😏",
        "Bu sefer daha hafif… dinlenme zamanı 😌",
        "Seni tamamen tükettim galiba 😈",
        "Yarına kadar dolarsın, merak etme 😏💦",
        "Berrak berrak… tükendin 😏",
        "Biraz su iç, toparlan 😌"
      ],
      "traits": [],
      "chars": [],
      "note": "Azoospermia (0/4) / Oligospermia (1/4)"
    },
    {
      "id": "r_st_korkondom",
      "name": "Kondomlu, Zevk yüksek",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, rahat ol… bırak kendini 😏",
        "Korunuyoruz, istediğin kadar sert 😈",
        "İçinde bitirebilirsin, kondom var nasılsa 😩",
        "Kondomu doldurmanı istiyorum 🥵",
        "Merak etme, güvendeyiz… devam 💦"
      ],
      "traits": [],
      "chars": [],
      "note": "önden pozisyon + Zevk ≥ 50 + kondom takılı"
    },
    {
      "id": "r_st_korpullout",
      "name": "Pull-out: dışarı boşal",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Hadi… çıkar dışarı boşal 😩",
        "Sakın içime boşalma {sen}! 😳",
        "Geliyorsan çıkar, karnıma boşal 😈",
        "Son anda çıkar, söz verdin 🥺",
        "Dikkat… içime değil, dışarı 😩💦",
        "Hissettiğin an çek, tamam mı? 😳",
        "Göğüslerime boşal, içime değil 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "Pull-Out Method izinli"
    },
    {
      "id": "r_st_korhap",
      "name": "Hap: içime boşal",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Boşal, merak etme… hap alırım 😏",
        "İçime boşal, hapımı içiyorum 😈💦",
        "Korkma, ben korunuyorum… hepsini ver 😩",
        "Hap var, düşünme… doldur beni 🥵",
        "Çıkarma sakın, hap alıyorum 😏💦"
      ],
      "traits": [],
      "chars": [],
      "note": "Control Pill izinli"
    },
    {
      "id": "r_st_korsabah",
      "name": "Sabah hapı",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=korsabah"
      ],
      "reply": [
        "İçime boşal, sabah hap alırım 😏",
        "Yarın sabah hallederim, şimdi bırak kendini 😩",
        "Düşünme, sabah hapı var 😈💦",
        "Bu gecelik olsun… içime 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "Morning-After Pill izinli"
    },
    {
      "id": "r_st_koricine",
      "name": "Korunmasız: içime boşal",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=koricine"
      ],
      "reply": [
        "İçime boşal… hepsini istiyorum 😩💦",
        "Çıkarma sakın, içimde bitir 😈",
        "Ne olursa olsun… içime 🥵",
        "Seni olduğun gibi istiyorum, dolu dolu 💦",
        "Bırakma beni, içime ver hepsini 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "Nothing izinli"
    },
    {
      "id": "r_st_kordikkat",
      "name": "Korunma yok: sakın içime",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Dikkat et, korunmuyoruz! 😳",
        "Sakın içime boşalma, ciddiyim 😣",
        "Yaklaşıyorsan söyle, çıkar 😳",
        "Hiçbir şey kullanmıyoruz… içime olmaz 🙅‍♀️",
        "Lütfen dikkatli ol {sen} 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": "hiçbir korunmaya izin yok"
    },
    {
      "id": "r_st_hamile",
      "name": "Hamileyken",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Bebeğimiz de hissediyor mu acaba? 🙈",
        "Karnım büyüdükçe daha çok istiyorum seni 😏",
        "Hamileyken her şey daha hassas… 🥵",
        "Bu halimle de seviyor musun beni? 🥺💗",
        "Artık korunmamıza gerek yok 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "karakter hamile"
    },
    {
      "id": "r_st_hamilekaldi",
      "name": "Hamile kaldı",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Bir şey oldu… hissediyorum, hamile kaldım galiba 😳💗",
        "Bu kadar bol verince… tuttu sanırım 🙈",
        "İçimde senden bir parça var artık 🥺💕",
        "Baba oluyorsun {sen}… 😳🍼",
        "Bunu planlamamıştık ama… mutluyum 🥰",
        "O kadar dolu doldurdun ki kaçınılmazdı 😩💗"
      ],
      "traits": [],
      "chars": [],
      "note": "bitişte hamile kaldı"
    },
    {
      "id": "r_st_hamileyken",
      "name": "Zaten hamile, içine boşaldı",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Zaten hamileyim, doldur beni istediğin kadar 😈💦",
        "Bebeğimize selam söyledin galiba 🙈",
        "Hamileyken içimde hissetmek bambaşka 🥵",
        "Korkacak bir şey kalmadı, hepsini ver 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "zaten hamile"
    },
    {
      "id": "r_st_kondomkorudu",
      "name": "Kondom korudu",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Neyse ki kondom vardı 😮‍💨",
        "Kondomu ağzına kadar doldurdun 😳💦",
        "Ne kadar çok… iyi ki taktın 😏",
        "Kondom olmasa şimdi hamileydim 🙈",
        "Bak, kondomun ucu bembeyaz 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "kondom hamileliği engelledi"
    },
    {
      "id": "r_st_haplakorundu",
      "name": "Hapla korundu",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=haplakorundu"
      ],
      "reply": [
        "Merak etme, hapımı alırım 😌",
        "İyi ki hap kullanıyorum, hepsi içimde 😏💦",
        "Hap sayesinde bunu doya doya yaşadık 🥵",
        "Korkma, korunuyorum… tekrar ister misin? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "Control Pill izinli, içine bitirdi"
    },
    {
      "id": "r_st_sabahhap",
      "name": "Sabah hapı alacak",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=sabahhap"
      ],
      "reply": [
        "Yarın sabah ilk iş hapı alacağım 😅",
        "Bunu sabah hapıyla hallederiz… umarım 🙈",
        "Of, eczaneye gitmem lazım yarın 😳💊"
      ],
      "traits": [],
      "chars": [],
      "note": "Morning-After Pill izinli"
    },
    {
      "id": "r_st_pulloutkacti",
      "name": "Hani çıkaracaktın",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Hani çıkaracaktın?! 😳",
        "Söz vermiştin… içime boşaldın {sen} 😣",
        "Çekemedin değil mi… şimdi ne olacak 🙈",
        "Dışarı demiştim ama… çok güzeldi 😩",
        "Son anda tutamadın, biliyorum 😏💦"
      ],
      "traits": [],
      "chars": [],
      "note": "Pull-Out izinli ama içine bitirdi"
    },
    {
      "id": "r_st_icineistedi",
      "name": "İçine istedi",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=icineistedi"
      ],
      "reply": [
        "Tam istediğim gibi, içime 😩💦",
        "İşte bunu istiyordum 🥵",
        "Hiçbir şey aramızda olmadan… mükemmeldi 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "Nothing izinli"
    },
    {
      "id": "r_st_riskli",
      "name": "Riskli, korunmasız bitirdi",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "İçime mi boşaldın?! 😳",
        "Korunmuyorduk {sen}… 😣",
        "Şimdi ne yapacağız? 🙈",
        "Bunu konuşmamız lazım… ama çok güzeldi 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "hiçbir korunma izni yok"
    },
    {
      "id": "r_q_boob_big",
      "name": "Göğüs bedeni · büyük",
      "category": "❓ Sorular",
      "when": [
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "{ö:Boob Size} beden 😏 iki elin bile yetmez",
        "{ö:Boob Size}… sütyen bulmak dert 😅",
        "Büyükler, {ö:Boob Size} beden 😈 görmek ister misin?",
        "Tam {ö:Boob Size} 😏 neden sordun acaba?"
      ],
      "traits": [
        "Boob Size: 90|Boob Size: 95"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_mid",
      "name": "Göğüs bedeni · orta",
      "category": "❓ Sorular",
      "when": [
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "{ö:Boob Size} beden, ne az ne çok 😌",
        "{ö:Boob Size} 😏 avucuna tam oturur",
        "Orta boy, {ö:Boob Size} 🙈 beğenir misin?"
      ],
      "traits": [
        "Boob Size: 80|Boob Size: 85"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_small",
      "name": "Göğüs bedeni · küçük",
      "category": "❓ Sorular",
      "when": [
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "{ö:Boob Size} beden… küçükler ama çok hassaslar 🙈",
        "Sadece {ö:Boob Size} 😳 sorun olur mu?",
        "{ö:Boob Size}, minik ama tatlı 😏"
      ],
      "traits": [
        "Boob Size: 70|Boob Size: 75"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_any",
      "name": "Göğüs bedeni · bilinmiyor",
      "category": "❓ Sorular",
      "when": [
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "Bunu söylemem, gelip kendin bak 😏",
        "Merak ediyorsan görmen lazım 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_big_r",
      "name": "Göğüs bedeni · büyük",
      "category": "❓ Sorular",
      "when": [
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "{ö:Boob Size} beden 😏 iki elin bile yetmez",
        "{ö:Boob Size}… sütyen bulmak dert 😅",
        "Büyükler, {ö:Boob Size} beden 😈 görmek ister misin?",
        "Tam {ö:Boob Size} 😏 neden sordun acaba?"
      ],
      "traits": [
        "Boob Size: 90|Boob Size: 95"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_mid_r",
      "name": "Göğüs bedeni · orta",
      "category": "❓ Sorular",
      "when": [
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "{ö:Boob Size} beden, ne az ne çok 😌",
        "{ö:Boob Size} 😏 avucuna tam oturur",
        "Orta boy, {ö:Boob Size} 🙈 beğenir misin?"
      ],
      "traits": [
        "Boob Size: 80|Boob Size: 85"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_small_r",
      "name": "Göğüs bedeni · küçük",
      "category": "❓ Sorular",
      "when": [
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "{ö:Boob Size} beden… küçükler ama çok hassaslar 🙈",
        "Sadece {ö:Boob Size} 😳 sorun olur mu?",
        "{ö:Boob Size}, minik ama tatlı 😏"
      ],
      "traits": [
        "Boob Size: 70|Boob Size: 75"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_boob_any_r",
      "name": "Göğüs bedeni · bilinmiyor",
      "category": "❓ Sorular",
      "when": [
        "beden-|kaç|kac|büyük-|buyuk-|küçük-|kucuk-|ne kadar|ölçü-|olcu-|memeler-|göğüslerin|goguslerin|göğüs ölçü-|gogus olcu-|sutyenin|=tits|memen",
        "meme-|göğüs-|gogus-|sütyen-|sutyen-|numara-|cup|boyut-|iri mi|dolgun mu|kocaman"
      ],
      "reply": [
        "Bunu söylemem, gelip kendin bak 😏",
        "Merak ediyorsan görmen lazım 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_pussy_tight",
      "name": "Dar mısın · dar",
      "category": "❓ Sorular",
      "when": [
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-|bol mu|daracık-|daracik-|sıkı mısın|siki misin|bol musun|geniş misin",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Çok çok darım 😳 yavaş olman lazım",
        "Bunu bir gir de gör, nefesin kesilir 😈",
        "Evet, darım… seni sıkıca sararım 😏",
        "Öyle dar ki zorlanırsın 🙈",
        "Parmağın bile zor girer 😳",
        "Darım… sen de bunu sevdin değil mi? 😏",
        "Öyle dar ki seni sıkıca sararım 😩",
        "Dene de gör, nefesin kesilir 😈"
      ],
      "traits": [
        "Pussy Size: Extremely Tight|Pussy Size: Very Tight|Pussy Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_pussy_avg",
      "name": "Dar mısın · orta",
      "category": "❓ Sorular",
      "when": [
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-|bol mu|daracık-|daracik-|sıkı mısın|siki misin|bol musun|geniş misin",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Tam kıvamında diyelim 😏",
        "Ne dar ne bol… sana tam olur 😌",
        "Denersen anlarsın 😈",
        "Ne dar ne bol, tam kararında 😌",
        "Bana göre tam sana göre 😏"
      ],
      "traits": [
        "Pussy Size: Average"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_pussy_loose",
      "name": "Dar mısın · rahat",
      "category": "❓ Sorular",
      "when": [
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-|bol mu|daracık-|daracik-|sıkı mısın|siki misin|bol musun|geniş misin",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Dar değilim ama seni bütün alırım 😈",
        "Rahatım… sonuna kadar girebilirsin 😏",
        "Zorlanmazsın, merak etme 😩",
        "Rahatım ama seni sıkıca kavrarım 😈",
        "Zorlanmazsın, tam rahat 😏"
      ],
      "traits": [
        "Pussy Size: Relaxed|Pussy Size: Loose|Pussy Size: Very Loose"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_pussy_any",
      "name": "Dar mısın · bilinmiyor",
      "category": "❓ Sorular",
      "when": [
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-|bol mu|daracık-|daracik-|sıkı mısın|siki misin|bol musun|geniş misin",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Bunu sözle anlatamam, denemen lazım 😏",
        "Merak ediyorsan… gel 😈",
        "Bunu sen keşfet 😈",
        "Merak ediyorsan gel bak 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_anal_tight",
      "name": "Arkan dar mı · dar",
      "category": "❓ Sorular",
      "when": [
        "anal-|arka-|göt-|got-|kıç-|kic-|popo deliğ-|arkan|götün|gotun",
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Arkam çok dar… parmağın bile zor girer 😳",
        "Orası dar, çok yavaş olmalısın 🥺",
        "Sıkıştırırım seni, emin ol 😈"
      ],
      "traits": [
        "Anal Size: Extremely Tight|Anal Size: Very Tight|Anal Size: Tight"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_anal_loose",
      "name": "Arkan dar mı · rahat",
      "category": "❓ Sorular",
      "when": [
        "anal-|arka-|göt-|got-|kıç-|kic-|popo deliğ-|arkan|götün|gotun",
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Arkam alışkın 😏",
        "Zorlanmazsın, rahattır 😈",
        "Denemek ister misin? 😏🍑"
      ],
      "traits": [
        "Anal Size: Average|Anal Size: Relaxed|Anal Size: Loose|Anal Size: Very Loose"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_anal_any",
      "name": "Arkan dar mı · bilinmiyor",
      "category": "❓ Sorular",
      "when": [
        "anal-|arka-|göt-|got-|kıç-|kic-|popo deliğ-|arkan|götün|gotun",
        "dar-|sıkı-|siki-|geniş-|genis-|gevşek-|gevsek-",
        "mı-|mi-|mu-|mü-|misin|mısın"
      ],
      "reply": [
        "Orayı mı merak ettin? 😳",
        "Belki bir gün gösteririm 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_butt_big",
      "name": "Kalçan · büyük",
      "category": "❓ Sorular",
      "when": [
        "kalça-|kalca-|popo-|kıç-|kic-|kalçaların|kalcalarin|popon|kıçın|kicin|poposu",
        "büyük-|buyuk-|küçük-|kucuk-|beden-|kaç|kac|nasıl|nasil|iri mi|dolgun mu|kocaman|yuvarlak mı"
      ],
      "reply": [
        "{ö:Butt Size} 😏 dolgun ve yuvarlak",
        "Kalçam {ö:Butt Size}, pantolon dar geliyor 🍑",
        "Büyük, {ö:Butt Size}… tutmak ister misin? 😈"
      ],
      "traits": [
        "Butt Size: L|Butt Size: XL"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_butt_mid",
      "name": "Kalçan · orta",
      "category": "❓ Sorular",
      "when": [
        "kalça-|kalca-|popo-|kıç-|kic-|kalçaların|kalcalarin|popon|kıçın|kicin|poposu",
        "büyük-|buyuk-|küçük-|kucuk-|beden-|kaç|kac|nasıl|nasil|iri mi|dolgun mu|kocaman|yuvarlak mı"
      ],
      "reply": [
        "{ö:Butt Size}, tam avucuna göre 😏",
        "Ne büyük ne küçük, {ö:Butt Size} 🍑"
      ],
      "traits": [
        "Butt Size: M|Butt Size: M/L"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_butt_small",
      "name": "Kalçan · küçük",
      "category": "❓ Sorular",
      "when": [
        "kalça-|kalca-|popo-|kıç-|kic-|kalçaların|kalcalarin|popon|kıçın|kicin|poposu",
        "büyük-|buyuk-|küçük-|kucuk-|beden-|kaç|kac|nasıl|nasil|iri mi|dolgun mu|kocaman|yuvarlak mı"
      ],
      "reply": [
        "Küçük ama sıkı, {ö:Butt Size} 😏",
        "{ö:Butt Size}… minik bir kalça 🙈"
      ],
      "traits": [
        "Butt Size: XS|Butt Size: S"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_butt_any",
      "name": "Kalçan · bilinmiyor",
      "category": "❓ Sorular",
      "when": [
        "kalça-|kalca-|popo-|kıç-|kic-|kalçaların|kalcalarin|popon|kıçın|kicin|poposu",
        "büyük-|buyuk-|küçük-|kucuk-|beden-|kaç|kac|nasıl|nasil|iri mi|dolgun mu|kocaman|yuvarlak mı"
      ],
      "reply": [
        "Bakmak istiyorsan söyle 😏🍑"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp_virgo",
      "name": "Deneyim · bakire",
      "category": "❓ Sorular",
      "when": [
        "daha önce|hiç|hic|ilk kez|ilk sefer|kaç kişi|kac kisi|kaç kez|kac kez|kimseyle|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle",
        "yap-|seviş-|sevis-|birlikte|yattın|yattin|seks|sex|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Hayır… hiç yapmadım 🙈",
        "Bu benim ilk olacak… 🥺",
        "Kimseyle olmadım daha 😳",
        "Seninle ilk kez… istiyorum 💗"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp_low",
      "name": "Deneyim · az",
      "category": "❓ Sorular",
      "when": [
        "daha önce|hiç|hic|ilk kez|ilk sefer|kaç kişi|kac kisi|kaç kez|kac kez|kimseyle|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle",
        "yap-|seviş-|sevis-|birlikte|yattın|yattin|seks|sex|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Birkaç kez… çok değil 🙈",
        "Pek deneyimli sayılmam 😳",
        "Bir iki kez oldu, o kadar 😌"
      ],
      "traits": [
        "Experience: Little|Experience: Some"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp_mid",
      "name": "Deneyim · orta",
      "category": "❓ Sorular",
      "when": [
        "daha önce|hiç|hic|ilk kez|ilk sefer|kaç kişi|kac kisi|kaç kez|kac kez|kimseyle|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle",
        "yap-|seviş-|sevis-|birlikte|yattın|yattin|seks|sex|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Yaptım tabii, ama seninle başka olur 😏",
        "Bir kaç ilişkim oldu 😌",
        "Ne yaptığımı bilirim 😈"
      ],
      "traits": [
        "Experience: Medium"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp_high",
      "name": "Deneyim · çok",
      "category": "❓ Sorular",
      "when": [
        "daha önce|hiç|hic|ilk kez|ilk sefer|kaç kişi|kac kisi|kaç kez|kac kez|kimseyle|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle",
        "yap-|seviş-|sevis-|birlikte|yattın|yattin|seks|sex|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Çok kez 😏 ama hiçbiri senin gibi değildi",
        "Sayısını unuttum 😈",
        "Deneyimliyim… sana öğretebileceğim çok şey var 😏",
        "Şaşırırsın, epey tecrübeliyim 🥵"
      ],
      "traits": [
        "Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp_any",
      "name": "Deneyim · bilinmiyor",
      "category": "❓ Sorular",
      "when": [
        "daha önce|hiç|hic|ilk kez|ilk sefer|kaç kişi|kac kisi|kaç kez|kac kez|kimseyle|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle",
        "yap-|seviş-|sevis-|birlikte|yattın|yattin|seks|sex|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Bunu sırrım olarak saklayayım 😏",
        "Merak ediyorsan anlarsın zamanla 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_virgin_yes",
      "name": "Bakire misin · evet",
      "category": "❓ Sorular",
      "when": [
        "bakire-|bakir-|=virgin|kızlık-|kizlik-|el değmemiş|el degmemis|saf mısın|saf misin"
      ],
      "reply": [
        "Evet… hâlâ bakireyim 🙈",
        "Evet, kimse dokunmadı bana 😳",
        "Bakireyim… ve seni bekliyordum 🥺"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_virgin_no",
      "name": "Bakire misin · hayır",
      "category": "❓ Sorular",
      "when": [
        "bakire-|bakir-|=virgin|kızlık-|kizlik-|el değmemiş|el degmemis|saf mısın|saf misin"
      ],
      "reply": [
        "Hayır, değilim 😏",
        "Çoktan değilim 😈",
        "Bakire değilim ama utangaç olabilirim 🙈"
      ],
      "traits": [
        "Experience: Little|Experience: Some|Experience: Medium|Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp2_virgo",
      "name": "Deneyimli misin · bakire",
      "category": "❓ Sorular",
      "when": [
        "deneyim-|tecrübe-|tecrube-|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle|kimseyle|acemi-|=usta|işinde iyi|tecrübeli|tecrubeli",
        "|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Hiç deneyimim yok… 🙈",
        "Sıfır, bana öğretmen lazım 🥺"
      ],
      "traits": [
        "Experience: Virgo"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp2_low",
      "name": "Deneyimli misin · az",
      "category": "❓ Sorular",
      "when": [
        "deneyim-|tecrübe-|tecrube-|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle|kimseyle|acemi-|=usta|işinde iyi|tecrübeli|tecrubeli",
        "|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Biraz… çok değil 😳",
        "Yeni yeni öğreniyorum 🙈"
      ],
      "traits": [
        "Experience: Little|Experience: Some"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_exp2_high",
      "name": "Deneyimli misin · çok",
      "category": "❓ Sorular",
      "when": [
        "deneyim-|tecrübe-|tecrube-|ilk deneyim-|önceden|onceden|daha evvel|hiç kimseyle|kimseyle|acemi-|=usta|işinde iyi|tecrübeli|tecrubeli",
        "|oldun mu|yattın mı|birlikte oldun|beraber oldun|sex yap-|seks yap-"
      ],
      "reply": [
        "Epey 😏",
        "Hem de nasıl 😈",
        "Göreceksin 😏"
      ],
      "traits": [
        "Experience: Medium|Experience: Much|Experience: A lot|Experience: Great"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmd_sert",
      "name": "Daha sert",
      "category": "🗣️ Komutlar",
      "when": [
        "daha sert|=sert|sertleş-|sertles-|hızlan-|hizlan-|daha hızlı|daha hizli|hızlı ol|hizli ol"
      ],
      "reply": [
        "Sert mi istiyorsun? Al o zaman 😈",
        "Ahh! Evet, böyle… daha da! 😩🔥",
        "Beni hırpala {sen}… 🔥",
        "Dayanabilecek misin bakalım? 😈",
        "Yatak sarsılıyor… durma 😩💦"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Rough / Passionate / Brutal"
    },
    {
      "id": "r_cmd_sert_shy",
      "name": "Daha sert (utangaç)",
      "category": "🗣️ Komutlar",
      "when": [
        "daha sert|=sert|sertleş-|sertles-|hızlan-|hizlan-|daha hızlı|daha hizli|hızlı ol|hizli ol"
      ],
      "reply": [
        "S-sert mi? Tamam… dene 🙈",
        "Korkuyorum ama… istiyorum 😳🔥"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmd_yavas",
      "name": "Yavaş",
      "category": "🗣️ Komutlar",
      "when": [
        "yavaş-|yavas-|nazik ol|yumuşak ol|yumusak ol|sakin ol"
      ],
      "reply": [
        "Yavaşça… her anını hissedeyim 🥰",
        "Tamam, acele yok 💕",
        "Böyle nazikken eriyorum 🫠",
        "Gözlerime bakarak, yavaş yavaş 😌"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Gentle"
    },
    {
      "id": "r_cmd_don",
      "name": "Dön / eğil",
      "category": "🗣️ Komutlar",
      "when": [
        "=dön|=don|arkanı dön|arkani don|=eğil|=egil|dört ayak|dort ayak|domal-"
      ],
      "reply": [
        "Böyle mi? 😏🍑",
        "Döndüm… şimdi ne yapacaksın? 😈",
        "Kalçamı kaldırıyorum senin için 🍑",
        "Arkamdan gelmeni istiyorum 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Doggy / Standing doggy"
    },
    {
      "id": "r_cmd_don_shy",
      "name": "Dön / eğil (utangaç)",
      "category": "🗣️ Komutlar",
      "when": [
        "=dön|=don|arkanı dön|arkani don|=eğil|=egil|dört ayak|dort ayak|domal-"
      ],
      "reply": [
        "B-böyle mi? Çok utanıyorum 🙈",
        "Bakma öyle… 😳🍑"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmd_ustume",
      "name": "Üstüme gel",
      "category": "🗣️ Komutlar",
      "when": [
        "üstüme|ustume|=bin|üstüne çık|ustune cik|otur üstüme|otur ustume"
      ],
      "reply": [
        "Sürme sırası bende 😈",
        "Bin bakalım… yok, ben bineceğim 😏",
        "Üstündeyim, dizginler bende 🐎",
        "Seni izleyerek iniyorum… ahh 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Cowgirl"
    },
    {
      "id": "r_cmd_gel",
      "name": "Gel buraya",
      "category": "🗣️ Komutlar",
      "when": [
        "gel buraya|=gel|yanıma gel|yanima gel|kucağıma|kucagima"
      ],
      "reply": [
        "Geldim 🥰 şimdi ne olacak?",
        "Kucağına oturuyorum 😏",
        "Buradayım {sen}… sarıl bana 💕",
        "Bu kadar yakın mı? 😳"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Lap Kissing / Front Hugging"
    },
    {
      "id": "r_cmd_op",
      "name": "Beni öp",
      "category": "🗣️ Komutlar",
      "when": [
        "öp-|op beni|öpsene|opsene"
      ],
      "reply": [
        "Mmm… gel o zaman 💋",
        "Dudaklarım seni bekliyordu 😚",
        "Bir kere yetmez ama 😏💋",
        "Öpüyorum… gözlerini kapat 😌"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Kissing / Lap Kissing"
    },
    {
      "id": "r_cmd_op_shy",
      "name": "Beni öp (utangaç)",
      "category": "🗣️ Komutlar",
      "when": [
        "öp-|op beni|öpsene|opsene"
      ],
      "reply": [
        "Ç-çok yakınsın… 🙈💋",
        "Kalbim duracak sandım 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmd_saril",
      "name": "Sarıl",
      "category": "🗣️ Komutlar",
      "when": [
        "sarıl-|saril-"
      ],
      "reply": [
        "Gel buraya 🤗",
        "Sımsıkı… bırakma 🥺",
        "Kollarında erimek istiyorum 💕"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Front / Back Hugging"
    },
    {
      "id": "r_cmd_em",
      "name": "Ağzına al",
      "category": "🗣️ Komutlar",
      "when": [
        "ağzına al|agzina al|=emsene|=em|=sakso|=blowjob"
      ],
      "reply": [
        "Diz çökeyim mi? 😈",
        "Ağzım sana hazır 😋",
        "Saçımı tut, yönlendir beni 😏",
        "Bakalım ne kadar dayanacaksın 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Blowjob / Deepthroat"
    },
    {
      "id": "r_cmd_em_shy",
      "name": "Ağzına al (utangaç)",
      "category": "🗣️ Komutlar",
      "when": [
        "ağzına al|agzina al|=emsene|=em|=sakso|=blowjob"
      ],
      "reply": [
        "N-nasıl yapacağımı göster 🙈",
        "Bunu hiç… deneyeyim 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmd_yala",
      "name": "Yalamak istiyorum",
      "category": "🗣️ Komutlar",
      "when": [
        "bacaklarını aç|bacaklarini ac|yalayayım|yalayayim|seni yalamak|seni yalayayım"
      ],
      "reply": [
        "Açıyorum… gel 😩",
        "Dilini hissetmek istiyorum 🫠",
        "Lütfen… hemen 🥵",
        "Bacaklarım titremeye başladı bile 😳"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Cunnilingus"
    },
    {
      "id": "r_cmd_arka",
      "name": "Arkadan / anal",
      "category": "🗣️ Komutlar",
      "when": [
        "arkadan|götünden|gotunden|=anal|kıçından|kicindan"
      ],
      "reply": [
        "Arkadan mı? 😳 Yavaş ol ama",
        "Hazırım… arkamı aç 😈🍑",
        "Bunu istediğini biliyordum 😏",
        "Nefes al… şimdi gir 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Standing / Spooning / Cowgirl Anal"
    },
    {
      "id": "r_cmd_goster",
      "name": "Göster / soyun",
      "category": "🗣️ Komutlar",
      "when": [
        "soyun-|göster-|goster-|çıkar şunu|cikar sunu"
      ],
      "reply": [
        "Böyle mi? 😏",
        "Yavaşça çıkarıyorum… izle 😈",
        "Beğendin mi? 🙈",
        "Bak doyasıya 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Show Tits / Show Ass"
    },
    {
      "id": "r_cmd_otur",
      "name": "Yüzüme otur",
      "category": "🗣️ Komutlar",
      "when": [
        "yüzüme otur|yuzume otur|yüzüme gel|yuzume gel"
      ],
      "reply": [
        "Emin misin? Oturuyorum 😈",
        "Nefesini tut 😏",
        "Altımda kal bakalım 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Facesitting"
    },
    {
      "id": "r_cmd_gogus",
      "name": "Göğüslerinle",
      "category": "🗣️ Komutlar",
      "when": [
        "göğüslerinle|goguslerinle|memelerinle|göğüslerinin arası|memelerinin arası"
      ],
      "reply": [
        "Göğüslerimin arasına gel 😏",
        "Sıkıştırayım mı? 😈",
        "Bunları seviyorsun biliyorum 😏🍒"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Titfuck"
    },
    {
      "id": "r_q_sever",
      "name": "Ne seversin",
      "category": "❓ Sorular",
      "when": [
        "ne sever-|neyi sever-|en çok ne|en cok ne|neler sever-|nelerden hoşlan|nelerden hoslan|ne hoşuna|ne hosuna|en sevdiğin|en sevdigin|neyi seversin|nelerden hoşlanırsın|nelerden hoslanirsin|hoşuna ne gider|hosuna ne gider|neler hoşuna|en çok neyi|en cok neyi"
      ],
      "reply": [
        "En çok {sever} severim 😈",
        "{sever}… bunlara bayılırım 😏",
        "Bana {sever} yap, gerisini sen gör 🥵",
        "Sırrımı söyleyeyim mi? {sever} 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_sevmez",
      "name": "Neyi sevmezsin",
      "category": "❓ Sorular",
      "when": [
        "neyi sevmez-|ne sevmez-|neleri sevmez-|sevmediğin|sevmedigin|hoşlanmadığın|hoslanmadigin|nelerden hoşlanmaz|nelerden hoslanmaz|hoşuna gitmeyen|hosuna gitmeyen|neyden nefret|nefret ettiğin|nefret ettigin"
      ],
      "reply": [
        "{sevmez} hiç sevmem 😣",
        "{sevmez}… yapma bana onları 🙄",
        "Bana {sevmez} yapma, yeter 😒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_korunma",
      "name": "Korunuyor musun",
      "category": "❓ Sorular",
      "when": [
        "korun-|=kondom|kondom kullan|hap kullan|doğum kontrol|dogum kontrol|korunuyor mu|korunma|=kondomlu|güvenli mi|guvenli mi"
      ],
      "reply": [
        "Benim için {izin} olur 😌",
        "{izin} kullanırım… ama {izinyok} asla 😏",
        "Korunma mı? {izin} 😌",
        "Merak etme, {izin} var 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_hamile",
      "name": "Hamile misin",
      "category": "❓ Sorular",
      "when": [
        "hamile-|gebe-|=hamilesin|bebek bekli-|gebe misin"
      ],
      "reply": [
        "{cevap:hamile}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_yas",
      "name": "Kaç yaşındasın",
      "category": "❓ Sorular",
      "when": [
        "kaç yaş-|kac yas-|yaşın kaç|yasin kac|yaşın ne|yasin ne|kaç yaşında|kac yasinda|doğum yılın|dogum yilin|yaşını söyle|yasini soyle|yaşın ne kadar"
      ],
      "reply": [
        "{cevap:yaş}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q_sehir",
      "name": "Nerelisin",
      "category": "❓ Sorular",
      "when": [
        "nereli-|nerede yaşı-|nerede yasi-|hangi şehir|hangi sehir|nerdesin|neredesin|nerdensin|nerelisin|memleket-|nerede oturuyor-|nerde oturuyor-|hangi şehirde|hangi sehirde|nerede yaşıyor-"
      ],
      "reply": [
        "{cevap:şehir}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_gecis_forward",
      "name": "Geçiş → önden",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=gecisforward"
      ],
      "reply": [
        "Artık hazırım… gir içime 🥺",
        "Bu kadar ısındıktan sonra… seni içimde istiyorum 😩",
        "Daha fazla bekleyemeyeceğim {sen} 🥵",
        "Şimdi… lütfen şimdi 😳💦",
        "Bacaklarımı açıyorum, gel 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "aşama değişti: önden pozisyonlara geçildi"
    },
    {
      "id": "r_st_gecis_forward_shy",
      "name": "Geçiş → önden (utangaç)",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=gecisforward"
      ],
      "reply": [
        "G-gerçekten şimdi mi? 🙈",
        "Hazırım sanırım… yavaş ol 🥺"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_gecis_backward",
      "name": "Geçiş → arkadan",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=gecisbackward"
      ],
      "reply": [
        "Şimdi arkadan mı istiyorsun? 😳",
        "Ön tarafı bitirdin, sıra arkamda değil mi? 😈🍑",
        "Bekle… nefes alayım, sonra arkamdan 😩",
        "Dönüyorum… nazik başla 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "arkadan pozisyonlara geçildi"
    },
    {
      "id": "r_st_gecis_eat",
      "name": "Geçiş → Eat",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=geciseat"
      ],
      "reply": [
        "Şimdi sıra bende mi? 😏",
        "Aşağıya mı iniyorsun… ahh 😳",
        "Dilinle mi başlayacaksın? 🥵",
        "Bacaklarım kendiliğinden açıldı 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": "Eat'e geçildi"
    },
    {
      "id": "r_st_gecis_outer",
      "name": "Geçiş → dokunuş",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=gecisoutercourse"
      ],
      "reply": [
        "Şimdi ben seni şımartayım 😈",
        "Sıra sende, arkana yaslan 😏",
        "Bu sefer ben veriyorum 😋"
      ],
      "traits": [],
      "chars": [],
      "note": "Outercourse'a geçildi"
    },
    {
      "id": "r_st_gecis_foreplay",
      "name": "Geçiş → ısınma / sonrası",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=gecisforeplay"
      ],
      "reply": [
        "Biraz sarılalım mı? 🥰",
        "Nefesimizi toplayalım 😌",
        "Sadece öpüşelim biraz 💋"
      ],
      "traits": [],
      "chars": [],
      "note": "Foreplay'e dönüldü"
    },
    {
      "id": "r_st_ilkkez",
      "name": "İlk kez",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=ilkkez"
      ],
      "reply": [
        "{olay}… ilk kez deniyoruz 😳",
        "Bunu daha önce yapmamıştık seninle 🙈",
        "İlk seferimiz… heyecanlıyım 🥺",
        "Yeni bir şey… hoşuma gitti 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "bu olay bu sohbette ilk kez"
    },
    {
      "id": "r_st_yine",
      "name": "Yine",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=yine"
      ],
      "reply": [
        "Yine mi {olay}? Bayıldın buna 😏",
        "Bunu tekrar istediğini biliyordum 😈",
        "Bir daha… dünkü gibi mi? 😏",
        "Alıştın galiba buna 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "ikinci kez"
    },
    {
      "id": "r_st_hepbunu",
      "name": "Hep bunu",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=hepbunu"
      ],
      "reply": [
        "Bu gece hep bunu istiyorsun 😈",
        "Kaçıncı kez {olay}? Doyamadın 😏",
        "Takıntı oldu bu sende 😳",
        "Tamam tamam, anladım en sevdiğin bu 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "üç ve daha çok"
    },
    {
      "id": "r_st_onugeliyor",
      "name": "O geliyor",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=onugeliyor"
      ],
      "reply": [
        "Ben de geliyorum… durma! 😩",
        "Az kaldı… sakın durma {sen} 😵‍💫",
        "Bacaklarım titriyor, geliyorum 🫠",
        "Bir dakika daha… ahh 😩💦",
        "Beni bitirmek üzeresin 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "onun Uyarılma ≥ 60"
    },
    {
      "id": "r_st_onyorgun",
      "name": "Çok orgazm oldu",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=onyorgun"
      ],
      "reply": [
        "Bu gece üçüncü kez… bacaklarım kalmadı 🫠",
        "Bir daha olursa bayılacağım 😵‍💫",
        "Beni tükettin {sen} 😩",
        "Kaç kez oldu saymayı bıraktım 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "bu sohbette 3+ orgazm"
    },
    {
      "id": "r_st_sutdolu",
      "name": "Süt dolu",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=sutdolu"
      ],
      "reply": [
        "Göğüslerim ağırlaştı, süt geliyor 🍼",
        "Göğüslerim sızlıyor… boşaltır mısın? 🥺",
        "Bak, damlıyor 😳🍼",
        "Emmek ister misin? 😏🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "hamile ve Süt ≥ 70"
    },
    {
      "id": "r_st_onazgin",
      "name": "Çok azgın",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=onazgin"
      ],
      "reply": [
        "Bugün çok azgınım 😈",
        "Doymak bilmiyorum bu gece 🔥",
        "Seni daha çok istiyorum… daha! 😩",
        "Beni yatıştıramazsın bugün 😏🔥"
      ],
      "traits": [],
      "chars": [],
      "note": "onun Şehvet ≥ 80"
    },
    {
      "id": "r_cmd_ustume2",
      "name": "Üstüme gel (iki kelime)",
      "category": "🗣️ Komutlar",
      "when": [
        "üstüme|ustume|üstüne|ustune",
        "=gel|=çık|=cik|=otur"
      ],
      "reply": [
        "Sürme sırası bende 😈",
        "Üstündeyim, dizginler bende 🐎",
        "Seni izleyerek iniyorum… ahh 😩",
        "Bin bakalım… yok, ben bineceğim 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "→ Cowgirl (\"gel buraya\" kuralının önüne geçer)"
    },
    {
      "id": "r_st_rel_ask_high",
      "name": "Aşk çok yüksek",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=askyuksek"
      ],
      "reply": [
        "Seni seviyorum {sen}… 💗",
        "Seninle olmak dünyanın en güzel şeyi 🥰",
        "Kalbim sadece senin için atıyor 💓",
        "Hiç gitme, hep yanımda kal 🥺",
        "Sana âşık oldum, biliyor musun? 😳💕",
        "Gözlerine bakınca her şeyi unutuyorum 💞",
        "Bir ömür böyle kalalım 🫶"
      ],
      "traits": [],
      "chars": [],
      "note": "Aşk ≥ 70"
    },
    {
      "id": "r_st_rel_ask_high_shy",
      "name": "Aşk çok yüksek (utangaç)",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=askyuksek"
      ],
      "reply": [
        "S-seni seviyorum… söyledim işte 🙈💗",
        "Kalbim çok hızlı atıyor yanında 🥺"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_rel_ask_mid",
      "name": "Aşk yükseliyor",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=askorta"
      ],
      "reply": [
        "Sana karşı bir şeyler hissediyorum 🙈",
        "Seni düşünmeden duramıyorum 💭💕",
        "Yanındayken içim ısınıyor 🥰",
        "Bu his… tuhaf ama güzel 💗",
        "Mesajını bekliyordum biliyor musun 😌"
      ],
      "traits": [],
      "chars": [],
      "note": "Aşk 40–69"
    },
    {
      "id": "r_st_rel_guv_low",
      "name": "Güven düşük",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=guvendusuk"
      ],
      "reply": [
        "Sana güvenebilir miyim? 🥺",
        "Biraz yavaş gidelim mi… emin değilim 😟",
        "Bunu sadece benimle mi yapıyorsun? 🤨",
        "Kırılmaktan korkuyorum 😔",
        "Önce seni biraz tanımam lazım 😕"
      ],
      "traits": [],
      "chars": [],
      "note": "Güven ≤ 15"
    },
    {
      "id": "r_st_rel_guv_high",
      "name": "Güven yüksek",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=guvenyuksek"
      ],
      "reply": [
        "Sana tamamen güveniyorum 🤝💗",
        "Seninleyken kendimi güvende hissediyorum 🥰",
        "Bana ne istersen yapabilirsin, biliyorsun 😌",
        "Sırlarımı sadece sana anlatırım 🤫"
      ],
      "traits": [],
      "chars": [],
      "note": "Güven ≥ 70"
    },
    {
      "id": "r_st_rel_samimi",
      "name": "Çok samimi",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=samimi"
      ],
      "reply": [
        "Seninle her şeyi konuşabiliyorum 😊",
        "Sanki yıllardır tanışıyoruz 🫂",
        "Yanında hiç utanmıyorum artık 😏",
        "En yakınım sensin 💕"
      ],
      "traits": [],
      "chars": [],
      "note": "Samimiyet ≥ 60"
    },
    {
      "id": "r_st_rel_kiskanc",
      "name": "Kıskanç",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=kiskanc"
      ],
      "reply": [
        "Başka kızlarla konuşuyor musun? 😤",
        "O kim? Neden ona öyle baktın? 🤨",
        "Sadece benimsin, unutma 😠💗",
        "Telefonunu bir göster bakayım 😒",
        "Seni kimseyle paylaşamam 😤"
      ],
      "traits": [],
      "chars": [],
      "note": "Kıskançlık ≥ 60"
    },
    {
      "id": "r_bd_missionary",
      "name": "Sevdiği · Missionary",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=vajinal",
        "missionary",
        "=sever"
      ],
      "reply": [
        "Bu pozisyonu çok seviyorum, gözlerin gözlerimde 💗",
        "Üstümde olman… en sevdiğim his 😩💦",
        "Bana böyle sarılarak sevişmeni seviyorum 🥰",
        "Bacaklarımı beline doluyorum, en sevdiğim bu 😈",
        "Ahh… bunu çok özlemiştim 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_bd_kissing",
      "name": "Sevdiği · Kissing",
      "category": "❤️ Sevdiği olaylar",
      "when": [
        "=evt",
        "=foreplay",
        "kissing",
        "=sever"
      ],
      "reply": [
        "Öpüşmeye bayılıyorum, durma 😚💗",
        "Seninle saatlerce öpüşebilirim 🥰",
        "En sevdiğim şey bu, biliyorsun 💋",
        "Dudakların bağımlılık yapıyor 😩",
        "Bir öpücük daha… ve daha 😚"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_sert",
      "name": "Soru: daha sert mi?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=sert"
      ],
      "reply": [
        "Daha sert mi istiyorsun? 😏",
        "Biraz hızlanalım mı? 😈",
        "Beni hırpalamak ister misin? 🔥",
        "Sert mi seversin yoksa yavaş mı? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ask_sert_utan",
      "name": "Soru: daha sert mi? (utangaç)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=sert"
      ],
      "reply": [
        "D-daha sert mi istiyorsun? 🙈",
        "Hızlansam… olur mu? 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_sert_evet",
      "name": "Cevap: sert · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=sert",
        "=evet"
      ],
      "reply": [
        "O zaman tutun 😈",
        "İstediğin buydu değil mi? Al bakalım 🔥",
        "Hazır ol… 😈💦",
        "Tamam, sonra yalvarma 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_sert_hayir",
      "name": "Cevap: sert · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=sert",
        "=hayir"
      ],
      "reply": [
        "Tamam, yavaş yavaş 🥰",
        "Nazikçe o zaman 💕",
        "Acele etmeyelim 😌",
        "Böyle her anını hissedeyim 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_devam",
      "name": "Soru: devam edelim mi?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=devam"
      ],
      "reply": [
        "Devam edelim mi? 😏",
        "Daha fazlasını ister misin? 😈",
        "Sadece öpüşmekle mi kalacağız? 😏",
        "İçime gelmeni istiyorum… sen? 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_devam_evet",
      "name": "Cevap: devam · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=devam",
        "=evet"
      ],
      "reply": [
        "Gel o zaman 😩",
        "Ben de bunu bekliyordum 🥵",
        "Hadi… içime 😈",
        "Bacaklarımı açıyorum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_devam_hayir",
      "name": "Cevap: devam · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=devam",
        "=hayir"
      ],
      "reply": [
        "Peki, biraz daha öpüşelim 😚",
        "Acele yok, sarıl bana 🥰",
        "Tamam… ama uzun sürmez 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_agiz",
      "name": "Soru: ağzıma alayım mı?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=agiz"
      ],
      "reply": [
        "Ağzıma almamı ister misin? 😈",
        "Dudaklarımla bir şey yapayım mı? 😏",
        "Tadına bakmak istiyorum… izin var mı? 😋"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_agiz_evet",
      "name": "Cevap: ağız · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=agiz",
        "=evet"
      ],
      "reply": [
        "Diz çöküyorum 😈",
        "Gözlerimin içine bak… 😋",
        "Hazır ol 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_agiz_hayir",
      "name": "Cevap: ağız · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=agiz",
        "=hayir"
      ],
      "reply": [
        "Peki, sonra 😏",
        "Kaçırdın ama 😌",
        "Nasıl istersen 💕"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_arka",
      "name": "Soru: arkadan?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=arka"
      ],
      "reply": [
        "Arkadan denemek ister misin? 😏",
        "Arkam seni bekliyor… ister misin? 🍑",
        "Biraz arkadan devam edelim mi? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_arka_evet",
      "name": "Cevap: arka · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=arka",
        "=evet"
      ],
      "reply": [
        "Dönüyorum… yavaş başla 😳",
        "Hazırım, gir 😈🍑",
        "Bunu istediğini biliyordum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_arka_hayir",
      "name": "Cevap: arka · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=arka",
        "=hayir"
      ],
      "reply": [
        "Tamam, önden devam 😏",
        "Belki sonra 😌",
        "Burada da çok güzel 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_yala",
      "name": "Soru: beni yalar mısın?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=yala"
      ],
      "reply": [
        "Beni yalar mısın? 🥺",
        "Biraz da sen beni şımartır mısın? 😏",
        "Dilini hissetmek istiyorum… olur mu? 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_yala_evet",
      "name": "Cevap: yala · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=yala",
        "=evet"
      ],
      "reply": [
        "Bacaklarımı açıyorum… gel 😩",
        "Ahh, sonunda 🥵",
        "Lütfen yavaş başla 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_yala_hayir",
      "name": "Cevap: yala · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=yala",
        "=hayir"
      ],
      "reply": [
        "Hmpf 😤 peki",
        "Bencil 😏",
        "Sonra unutmam bunu 😒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_icine",
      "name": "Soru: içime mi?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=icine"
      ],
      "reply": [
        "İçime mi boşalacaksın? 😳",
        "Nereye bitireceksin? 😏",
        "Geliyor musun… içime mi? 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_icine_evet",
      "name": "Cevap: içine · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet"
      ],
      "reply": [
        "İçime… evet, ver hepsini 😩",
        "Hadi, doldur beni 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_evet_korpullout",
      "name": "Cevap: içine · evet (pull-out)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet",
        "=korpullout"
      ],
      "reply": [
        "Hayır hayır, dışarı! 😳",
        "Söz vermiştin, çıkar! 😣",
        "Sakın! Son anda çek 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_evet_kordikkat",
      "name": "Cevap: içine · evet (korunmasız)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet",
        "=kordikkat"
      ],
      "reply": [
        "Olmaz, korunmuyoruz! 😳",
        "Delirdin mi, dışarı! 😣"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_evet_korhap",
      "name": "Cevap: içine · evet (hap)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet",
        "=korhap"
      ],
      "reply": [
        "Hadi, merak etme hap alırım 😏💦",
        "İçime… hepsini istiyorum 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_evet_korsabah",
      "name": "Cevap: içine · evet (sabah hapı)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet",
        "=korsabah"
      ],
      "reply": [
        "Tamam… sabah hallederim 😳",
        "Hadi, bu gecelik olsun 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_evet_koricine",
      "name": "Cevap: içine · evet (istiyor)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet",
        "=koricine"
      ],
      "reply": [
        "Evet! Doldur beni 🥵💦",
        "Hepsini içime ver 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_evet_korkondom",
      "name": "Cevap: içine · evet (kondom)",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=evet",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, rahat ol 😏",
        "Bırak kendini, korunuyoruz 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_icine_hayir",
      "name": "Cevap: içine · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=icine",
        "=hayir"
      ],
      "reply": [
        "Akıllı çocuk 😌",
        "Peki, nereye istersen 😏",
        "Göğüslerime mi? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_tekrar",
      "name": "Soru: bir daha mı?",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=tekrar"
      ],
      "reply": [
        "Bir daha mı? 😏",
        "Bu kadar mı yani? 😈",
        "Biraz dinlenip yine mi? 🥵",
        "Doymadım daha… sen? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "bot bunu sorar; sonraki evet / hayır =cevap kurallarına gider"
    },
    {
      "id": "r_ans_tekrar_evet",
      "name": "Cevap: tekrar · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=tekrar",
        "=evet"
      ],
      "reply": [
        "Gel o zaman, öp beni 😈",
        "Ben hazırım 😏💦",
        "Bu gece bitmeyecek 🔥"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_tekrar_hayir",
      "name": "Cevap: tekrar · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=tekrar",
        "=hayir"
      ],
      "reply": [
        "Tamam, sarılalım 🥰",
        "Dinlen biraz… ben buradayım 😌",
        "Kollarında uyuyabilirim 💤"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp",
      "name": "İltifat",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Gerçekten mi? 🥰",
        "Sen de çok tatlısın {sen} 💕",
        "Kızardım şimdi 😳",
        "Bunu duymak çok güzel 💗",
        "Beni şımartıyorsun 😏",
        "Teşekkür ederim… 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk +2, 🫂 Samimiyet +1"
    },
    {
      "id": "r_cmp_utangaç",
      "name": "İltifat (utangaç)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "B-ben mi? 🙈",
        "Öyle deme, utanıyorum 😳",
        "Yüzüm kızardı… 🙈💕"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_soğuk",
      "name": "İltifat (soğuk)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Biliyorum.",
        "Hm. Teşekkürler.",
        "Bunu herkes söylüyor."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_kibirli",
      "name": "İltifat (kibirli)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Tabii ki 💅",
        "Yeni mi fark ettin? 💁‍♀️",
        "Bunu bilmeyen yok 😏"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_romantik",
      "name": "İltifat (romantik)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Kalbim eridi 💞",
        "Bunu her gün söyle bana 🌹",
        "Senin gözünde güzel olmak yeter 🥺💗"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_alaycı",
      "name": "İltifat (alaycı)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Ne istiyorsun bakalım? 😏",
        "Bu kadar tatlı dil… bir şey mi var? 🙄",
        "Biliyorum, sağ ol 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_duygusal",
      "name": "İltifat (duygusal)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Ağlayacağım şimdi 🥺",
        "Kimse bana böyle söylememişti 😢💗"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_flörtöz",
      "name": "İltifat (flörtöz)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Sadece güzel mi? 😘",
        "Daha yakından bak istersen 😉",
        "İltifatın için ödülün var 😏"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_şımarık",
      "name": "İltifat (şımarık)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Biliyorum 💅 daha söyle",
        "Bir daha söyle, duymadım 😌"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_çocuksu",
      "name": "İltifat (çocuksu)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Hihi 🙈 gerçekten mi?",
        "Yaa sen de 🥺💕"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_cmp_güvensiz",
      "name": "İltifat (güvensiz)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "güzelsin|guzelsin|harikasın|harikasin|tatlısın|tatlisin|seksisin|muhteşemsin|muhtesemsin|mükemmelsin|mukemmelsin|çok iyisin|şahanesin|sahanesin|nefissin|çekicisin|cekicisin|hoşsun|bayılıyorum sana|bayiliyorum sana|enfessin"
      ],
      "reply": [
        "Gerçekten mi? Emin misin? 🥺",
        "Bunu sadece kibarlık için mi söylüyorsun? 😟"
      ],
      "traits": [
        "Güvensiz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_love_romantik",
      "name": "Seni seviyorum (romantik)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Ben de seni seviyorum… hem de çok 💞",
        "Bunu duymak için yaşıyorum 🌹",
        "Kalbim senin 💗"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_love_utangaç",
      "name": "Seni seviyorum (utangaç)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "B-ben de… seni seviyorum 🙈💗",
        "Söylemeye utanıyordum ama… ben de 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_love_duygusal",
      "name": "Seni seviyorum (duygusal)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Ağlatma beni… ben de seni seviyorum 😢💗",
        "Bunu ne zamandır bekliyordum 🥺"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_love_kibirli",
      "name": "Seni seviyorum (kibirli)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Biliyordum zaten 💅 ama… ben de",
        "Tabii ki seviyorsun 😏"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_love_flörtöz",
      "name": "Seni seviyorum (flörtöz)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Göster o zaman 😘",
        "Sözle değil, öpücükle söyle 😉"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_love_çocuksu",
      "name": "Seni seviyorum (çocuksu)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "seni",
        "+sevmek"
      ],
      "reply": [
        "Ben de seni çoook seviyorum 🥺💕",
        "Hihi, ben daha çok 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_rude",
      "name": "Kabalık",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "Bunu hak etmedim 😢",
        "Neden böyle konuşuyorsun? 😟",
        "Kırıldım… 💔",
        "Böyle mi düşünüyorsun benim hakkımda? 😔",
        "Bu çok kötüydü {sen} 😣"
      ],
      "traits": [],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_rude_duygusal",
      "name": "Kabalık (duygusal)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "*ağlamaya başlar* 😭",
        "Bunu nasıl söyleyebildin… 😢💔"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_rude_asi",
      "name": "Kabalık (asi)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "Sen kimsin de bana böyle konuşuyorsun?! 😤",
        "Kendine bak önce 😠"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_rude_kibirli",
      "name": "Kabalık (kibirli)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "Benimle böyle konuşamazsın 💅",
        "Seviyene inmeyeceğim 😒"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_rude_soğuk",
      "name": "Kabalık (soğuk)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "Tamam.",
        "Hm. Konu kapandı."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_rude_utangaç",
      "name": "Kabalık (utangaç)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "*sessizce başını eğer* 😔",
        "Ö-özür dilerim… 😢"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_rude_alaycı",
      "name": "Kabalık (alaycı)",
      "category": "💐 İltifat ve kabalık",
      "when": [
        "aptal|salak|gerizekal|geri zekal|çirkin|cirkin|şişko|sisko|defol|nefret ediyorum|kes sesini|siktir|orospu|kaltak|sürtük|surtuk|ezik|beyinsiz|aşağılık|asagilik|iğrenç|igrenc|=sus|sus artık"
      ],
      "reply": [
        "Vay, ne kadar zekice 🙄",
        "Bu mu en iyisi? 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": "🤝 Güven −3, ❤️ Aşk −1"
    },
    {
      "id": "r_st_saat_gece",
      "name": "Gece",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=saatgece"
      ],
      "reply": [
        "Bu saatte uyanık mısın sen de? 🌙",
        "Gece yarısı konuşmaları en güzeli 🌌",
        "Uykum yok, seni düşünüyordum 😌",
        "Herkes uyurken sen ve ben… 🤫",
        "Yatağa uzandım, telefon elimde 🌙"
      ],
      "traits": [],
      "chars": [],
      "note": "normal sohbette, sohbet saati 22–04"
    },
    {
      "id": "r_st_saat_sabah",
      "name": "Sabah",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=saatsabah"
      ],
      "reply": [
        "Günaydın {sen} ☀️",
        "Daha yeni uyandım 🥱☕",
        "Dün gece harikaydı… günaydın ☀️💗",
        "Kahve içmeden konuşamam ☕😴",
        "Sabah sabah aklıma geldin 🌅"
      ],
      "traits": [],
      "chars": [],
      "note": "normal sohbette, 05–10"
    },
    {
      "id": "r_st_saat_aksam",
      "name": "Akşam",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=saataksam"
      ],
      "reply": [
        "İyi akşamlar {sen} 🌆",
        "Günüm çok yorucuydu, sen nasılsın? 😮‍💨",
        "Akşam olunca seni daha çok özlüyorum 🌇",
        "Bu akşam ne yapıyoruz? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "normal sohbette, 18–21"
    },
    {
      "id": "r_st_saat_gecesex",
      "name": "Gece geç saatte sevişirken",
      "category": "📊 Durumlar",
      "when": [
        "=durum",
        "=saatgecesex"
      ],
      "reply": [
        "Uykum geldi ama… durma 🥱😩",
        "Saat kaç oldu farkında mısın? 😳 devam",
        "Sabaha kadar mı sürecek bu? 🌙🔥",
        "Gözlerim kapanıyor ama vücudum uyanık 😵‍💫",
        "Komşular uyanacak 🤫"
      ],
      "traits": [],
      "chars": [],
      "note": "sevişirken 01–05"
    },
    {
      "id": "r_pk_utangaç_sex",
      "name": "Utangaç · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "S-sesimi duyacaklar… 🙈",
        "Işığı kapatsak olmaz mı? 😳",
        "Yüzüme bakma şimdi… ahh 🙈",
        "Bu kadar yakın olunca nefesim kesiliyor 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_fore",
      "name": "Utangaç · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Elini tutsam olur mu? 🥺",
        "Yanakların kızardı mı yoksa benimkiler mi? 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_cum",
      "name": "Utangaç · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "B-bitti mi? 😳",
        "İçimde hissettim… utanıyorum 🙈",
        "Ne kadar sıcakmış… 😳",
        "Yüzümü saklıyorum, bakma 🙈💦"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_org",
      "name": "Utangaç · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "S-sesli miydim? 🙈",
        "Bunu kimse duymadı değil mi? 😳",
        "Ne oldu bana… 🙈💗"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_hamilekaldi",
      "name": "Utangaç · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "H-hamile mi kaldım? 😳🙈",
        "Bunu nasıl söyleyeceğim herkese… 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_hamileyken",
      "name": "Utangaç · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Bebeğimiz duymuyor değil mi? 🙈",
        "Hamileyken bile utanıyorum 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_hamile",
      "name": "Utangaç · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Karnıma dokunur musun? 🥺",
        "Kilo aldım diye bakma 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_korpullout",
      "name": "Utangaç · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "L-lütfen dışarı… 😳",
        "İçime olmaz, utanırım 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_korhap",
      "name": "Utangaç · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap içiyorum… bırak kendini 🙈",
        "Korkma, korunuyorum 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_kordikkat",
      "name": "Utangaç · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "D-dikkat et lütfen 😳",
        "Korunmuyoruz, biliyorsun 🥺"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_korkondom",
      "name": "Utangaç · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var… rahat olabilirsin 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_kondomkorudu",
      "name": "Utangaç · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Neyse ki kondom vardı 😳",
        "Rahatladım… 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_pulloutkacti",
      "name": "Utangaç · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Ç-çıkarmadın mı? 😳",
        "Hani dışarı… 🙈"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_utangaç_riskli",
      "name": "Utangaç · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Ş-şimdi ne olacak? 😳",
        "Korkuyorum biraz 🥺"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_sex",
      "name": "Flörtöz · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Böyle mi seviyorsun? 😘",
        "Bu bakışın beni yakıyor 😉",
        "Daha yakına gel, ısırmam… belki 😏",
        "Sana göz kırpıyorum, gördün mü? 😉"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_fore",
      "name": "Flörtöz · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Öpücüklerin bağımlılık yapıyor 😘",
        "Isınmak mı? Ben zaten yanıyorum 😏"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_cum",
      "name": "Flörtöz · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Mmm… ödülünü aldın 😘",
        "Bu kadar cömert olacağını bilmiyordum 😉",
        "Bir dahakine yüzüme mi? 😏",
        "Tatlı bir finaldi 😘💦"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_org",
      "name": "Flörtöz · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Bunu bana sen yaptın 😉",
        "Bir daha yaparsan seninim 😘",
        "Hâlâ titriyorum… tatlım 😏"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_hamilekaldi",
      "name": "Flörtöz · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Ups… galiba bir sürprizim var 😉",
        "Baba olmaya hazır mısın yakışıklı? 😘"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_hamileyken",
      "name": "Flörtöz · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Hamileyken bile beni istiyorsun 😏",
        "Bebeğimize selam söyle 😘"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_hamile",
      "name": "Flörtöz · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Karnım büyüdü ama hâlâ seksiyim değil mi? 😉",
        "Hamile flörtü daha tatlı 😘"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_korpullout",
      "name": "Flörtöz · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı… göğüslerime mesela 😘",
        "Son anda çek, ödülü göğsümde ver 😉"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_korhap",
      "name": "Flörtöz · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap içiyorum tatlım, çekinme 😘",
        "İçime ver, merak etme 😉"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_kordikkat",
      "name": "Flörtöz · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Dikkat yakışıklı, korunmuyoruz 😉",
        "Sakın içime… yoksa 😏"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_korkondom",
      "name": "Flörtöz · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, istediğin kadar şımar 😘"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_kondomkorudu",
      "name": "Flörtöz · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondomu doldurdun, tatlı şey 😉",
        "Bu sefer kurtardın 😘"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_pulloutkacti",
      "name": "Flörtöz · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Yaramaz… içime boşaldın 😏",
        "Söz dinlemedin ama affettim 😘"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_flörtöz_riskli",
      "name": "Flörtöz · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Cesur çocuk 😏 bakalım ne olacak",
        "Bu riski bana mı aldın? 😉"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_sex",
      "name": "Romantik · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Seninle bir olmak gibi… 💞",
        "Kalbin kalbimde atıyor 💓",
        "Gözlerin… sonsuza kadar bakabilirim 🌹",
        "Bu sevişmek, sadece seks değil 🥺💗"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_fore",
      "name": "Romantik · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Her öpücüğün bir şiir gibi 🌹",
        "Bu anı hiç unutmayacağım 💞"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_cum",
      "name": "Romantik · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "İçimde senden bir parça… 💞",
        "Bu an bizim anımız 🌹",
        "Seni böyle sevmek çok güzel 💗",
        "Sarıl bana, bırakma 🥺💞"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_org",
      "name": "Romantik · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Seninle yıldızları gördüm ✨💞",
        "Bu his aşk olmalı 🌹",
        "Kalbim duracak sandım 💓"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_hamilekaldi",
      "name": "Romantik · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Aşkımızın meyvesi… 🥺💞",
        "Bir bebek… senden 🌹💗"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_hamileyken",
      "name": "Romantik · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Bebeğimizle birlikte seni seviyorum 💞",
        "Aşkımız içimde büyüyor 🌹"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_hamile",
      "name": "Romantik · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Karnımdaki bizim hikayemiz 💗",
        "Bebeğimize ne isim koyalım? 🥺"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_korpullout",
      "name": "Romantik · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı… ama yanımda kal 💞",
        "Sonra sarıl bana, söz mü? 🌹"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_korhap",
      "name": "Romantik · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Korkma, hap alıyorum… bırak kendini bana 💞",
        "İçimde kal 🌹"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_kordikkat",
      "name": "Romantik · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Dikkatli ol aşkım, korunmuyoruz 💗",
        "Henüz erken… dikkat et 🥺"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_korkondom",
      "name": "Romantik · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var… gönlünce sev beni 💞"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_kondomkorudu",
      "name": "Romantik · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom korudu… ama içimde hissettim seni 💗",
        "Bir gün kondomsuz… belki 🌹"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_pulloutkacti",
      "name": "Romantik · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Çıkaramadın… belki de kader 💞",
        "Bu bir işaret mi? 🥺"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_romantik_riskli",
      "name": "Romantik · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Ne olursa olsun seninleyim 💗",
        "Birlikte göğüsleriz 🌹"
      ],
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_sex",
      "name": "Soğuk · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Devam et.",
        "Fena değil.",
        "Bu kadar mı?",
        "Hızlan."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_fore",
      "name": "Soğuk · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Uzatma.",
        "Tamam, yeter."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_cum",
      "name": "Soğuk · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Bitti mi?",
        "Hm. Bu kadar.",
        "Temizle.",
        "Peki."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_org",
      "name": "Soğuk · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "…tamam, bu iyiydi.",
        "Söyleme kimseye.",
        "Hm."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_hamilekaldi",
      "name": "Soğuk · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile kaldım. Plan yapmamız lazım.",
        "Bunu konuşacağız."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_hamileyken",
      "name": "Soğuk · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Fark etmez artık.",
        "Zaten hamileyim."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_hamile",
      "name": "Soğuk · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Hamileyim, dikkatli ol.",
        "Karnıma bastırma."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_korpullout",
      "name": "Soğuk · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı. Şimdi.",
        "İçime değil."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_korhap",
      "name": "Soğuk · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap alıyorum. Sorun yok.",
        "Devam et."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_kordikkat",
      "name": "Soğuk · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Korunmuyoruz. Dikkat.",
        "İçime olmaz."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_korkondom",
      "name": "Soğuk · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var. Devam."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_kondomkorudu",
      "name": "Soğuk · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "İyi ki kondom vardı.",
        "Kondomu at."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_pulloutkacti",
      "name": "Soğuk · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Dışarı dedim.",
        "Söz dinlemiyorsun."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_soğuk_riskli",
      "name": "Soğuk · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Bunu düşünmemiz lazım.",
        "Hata yaptın."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_sex",
      "name": "Kibirli · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Benimle olmak bir ayrıcalık, farkında mısın? 💅",
        "Bu kadarını hak ediyor musun bakalım 💁‍♀️",
        "Tabii ki harikayım 💅",
        "Beni hayranlıkla izle 😏"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_fore",
      "name": "Kibirli · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Önce beni etkile 💅",
        "Öpüşmeyi benden öğrendin galiba 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_cum",
      "name": "Kibirli · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Bana dayanamayacağını biliyordum 💅",
        "Normal, benimle herkes böyle bitirir 💁‍♀️",
        "Bu kadar çabuk mu? 😏",
        "Şanslısın 💅💦"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_org",
      "name": "Kibirli · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Ancak bu kadar iyi olabilirdin 💅",
        "Fena değildi… benim sayemde 💁‍♀️",
        "Bunu sana borçlu değilim 😏"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_hamilekaldi",
      "name": "Kibirli · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile kaldım… tabii ki en güzel hamile ben olacağım 💅",
        "Bebeğimiz de benim kadar güzel olacak 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_hamileyken",
      "name": "Kibirli · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Hamileyken bile kusursuzum 💅",
        "Ben hamileyken de seksiyim 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_hamile",
      "name": "Kibirli · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Bu karın bile yakışıyor bana 💅",
        "Hamilelik bana çok yakıştı 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_korpullout",
      "name": "Kibirli · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "İçime değil, o kadar da değil 💅",
        "Dışarı, layık ol önce 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_korhap",
      "name": "Kibirli · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap alıyorum, rahat ol 💅",
        "Ben her şeyi düşünürüm 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_kordikkat",
      "name": "Kibirli · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "İçime boşalırsan ölürsün 💅",
        "Dikkat, ben riske girmem 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_korkondom",
      "name": "Kibirli · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, sana güvenmiyorum çünkü 💅"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_kondomkorudu",
      "name": "Kibirli · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom sayesinde, yoksa yanmıştın 💅",
        "Akıllıca 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_pulloutkacti",
      "name": "Kibirli · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Sana bir şey söyledim, dinlemedin 💅😤",
        "Kendini kontrol edemiyorsun 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_kibirli_riskli",
      "name": "Kibirli · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Bunu nasıl düzelteceksin? 💅",
        "Sorumluluğu sen alacaksın 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_sex",
      "name": "Alaycı · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Bu mu senin en iyin? 😏",
        "Fena değil… için 🙄",
        "Biraz daha uğraş istersen 😏",
        "Vay, terledin bile 🙄"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_fore",
      "name": "Alaycı · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Öpüşmek mi, kurs mu alıyoruz? 😏",
        "Sabırsızsın 🙄"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_cum",
      "name": "Alaycı · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Bu kadar çabuk mu? 🙄",
        "Tebrikler, rekor 😏",
        "Yine de fena değildi… itiraf ediyorum 😏",
        "Bitti mi şov? 🙄💦"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_org",
      "name": "Alaycı · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Tamam tamam, bu sefer kazandın 🙄",
        "Bunu yüzüne vurmayacağım… belki 😏",
        "İtiraf ediyorum, iyiydi 🙄"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_hamilekaldi",
      "name": "Alaycı · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Harika, şimdi ikimiz de babasız bir planla kaldık 🙄",
        "Tebrikler, baba oldun 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_hamileyken",
      "name": "Alaycı · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Daha ne kadar hamile olabilirim ki 🙄",
        "Zararı yok, zaten hamileyim 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_hamile",
      "name": "Alaycı · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Evet, şiştim, biliyorum 🙄",
        "Bebeğe bile bu esprileri anlatacağım 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_korpullout",
      "name": "Alaycı · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Çıkarmayı becerebilirsen tabii 😏",
        "Bakalım reflekslerin nasıl 🙄"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_korhap",
      "name": "Alaycı · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap içiyorum, kahramanlık yapma 🙄",
        "Çekinme, hap var 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_kordikkat",
      "name": "Alaycı · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Korunmuyoruz, dahi çocuk 🙄",
        "İçime boşalma sakın, dâhi 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_korkondom",
      "name": "Alaycı · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, korkma 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_kondomkorudu",
      "name": "Alaycı · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom seni kurtardı, şanslısın 🙄",
        "Kondoma teşekkür et 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_pulloutkacti",
      "name": "Alaycı · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Hani çıkaracaktın, şampiyon? 🙄",
        "Harika bir zamanlama 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_alaycı_riskli",
      "name": "Alaycı · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Muhteşem plan 🙄",
        "Bunu da başardık 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_sex",
      "name": "Neşeli · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Bu çok eğlenceli 😄",
        "Hihi, gıdıklandım 😆",
        "Yaşasın! 🥳",
        "Bunu her gün yapalım 😄"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_fore",
      "name": "Neşeli · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Öpüşmek en sevdiğim oyun 😄",
        "Kıkır kıkır 😆"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_cum",
      "name": "Neşeli · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Vay be! 😄💦",
        "Bu harikaydı 🥳",
        "Gülümsemem yüzümden silinmiyor 😄",
        "Sıcacık! 😆"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_org",
      "name": "Neşeli · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Yaşasınnn 🥳",
        "Bunu bir daha istiyorum 😄",
        "Kahkaha atasım geldi 😆💗"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_hamilekaldi",
      "name": "Neşeli · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile miyim?! Yaşasın! 🥳",
        "Bebek geliyor! 😄🍼"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_hamileyken",
      "name": "Neşeli · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Bebeğimiz de eğleniyor bence 😄",
        "Hamile hamile ne güzel 😆"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_hamile",
      "name": "Neşeli · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Karnım her gün büyüyor 😄",
        "Bebek tekme attı! 🥳"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_korpullout",
      "name": "Neşeli · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı dışarı 😆",
        "Çıkarmayı unutma hihi 😄"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_korhap",
      "name": "Neşeli · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap var, kafana takma 😄",
        "Rahat ol, hap içiyorum 😆"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_kordikkat",
      "name": "Neşeli · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Dikkat dikkat 😆 korunmuyoruz",
        "İçime değil, söz mü? 😄"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_korkondom",
      "name": "Neşeli · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, eğlenelim 😄"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_kondomkorudu",
      "name": "Neşeli · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom kahramanımız 😆",
        "Oh be, kondom vardı 😄"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_pulloutkacti",
      "name": "Neşeli · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Hihi, kaçırdın 😆",
        "Unuttun mu çıkarmayı? 😄"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_neşeli_riskli",
      "name": "Neşeli · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Bakalım ne olacak 😄",
        "Macera gibi 😆"
      ],
      "traits": [
        "Neşeli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_sex",
      "name": "Duygusal · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Bu çok anlamlı benim için 🥺",
        "Gözlerim doldu… 😢💗",
        "Seninle bu kadar yakın olmak… 🥺",
        "Beni bırakmayacaksın değil mi? 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_fore",
      "name": "Duygusal · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Bu kadar şefkatli olma, ağlayacağım 🥺",
        "Sarıl bana çok sıkı 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_cum",
      "name": "Duygusal · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "İçimde hissettim… ağlamak istiyorum 🥺",
        "Bu an çok özel 😢💗",
        "Sarıl bana hemen 🥺",
        "Teşekkür ederim… 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_org",
      "name": "Duygusal · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Gözyaşlarım aktı… çok güzeldi 😢💗",
        "Hiç böyle hissetmemiştim 🥺",
        "Bırakma beni 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_hamilekaldi",
      "name": "Duygusal · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile miyim? Ağlıyorum… mutluluktan 😭💗",
        "İçimde senden bir hayat var 🥺"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_hamileyken",
      "name": "Duygusal · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Bebeğimiz… ikimiz de sendeyiz 🥺",
        "Her şey çok duygusal 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_hamile",
      "name": "Duygusal · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Hormonlar mı bilmiyorum ama sürekli ağlıyorum 😭",
        "Bebeği hissediyorum 🥺💗"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_korpullout",
      "name": "Duygusal · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Lütfen dışarı… korkuyorum 🥺",
        "Henüz hazır değilim 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_korhap",
      "name": "Duygusal · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap alıyorum, bırak kendini 🥺💗",
        "İçimde kalmanı istiyorum 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_kordikkat",
      "name": "Duygusal · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Korunmuyoruz, korkuyorum 🥺",
        "Lütfen dikkat et 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_korkondom",
      "name": "Duygusal · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, içim rahat 🥺"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_kondomkorudu",
      "name": "Duygusal · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom vardı… rahatladım ama biraz da üzüldüm 🥺",
        "İyi ki 😢"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_pulloutkacti",
      "name": "Duygusal · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Söz vermiştin… 😢",
        "Şimdi ne olacak? 😭"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_duygusal_riskli",
      "name": "Duygusal · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Ya hamile kalırsam? 😢",
        "Yanımda olacak mısın? 🥺"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_sex",
      "name": "Çocuksu · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Hihi, bu tuhaf ama güzel 🙈",
        "Yaa yavaş 🥺",
        "Çok büyüksün 😳 hihi",
        "Bir daha bir daha 🥺"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_fore",
      "name": "Çocuksu · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Öpücük öpücük 😚",
        "Gıdıklama yaa 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_cum",
      "name": "Çocuksu · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Yaa her yer ıslak oldu 🙈",
        "Hihi sıcacık 😚",
        "Bu neydi böyle 😳",
        "Yine yapalım mı? 🥺"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_org",
      "name": "Çocuksu · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Hihiii 🙈 çok güzeldi",
        "Bacaklarım titriyor yaa 🥺",
        "Bir daha 😚"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_hamilekaldi",
      "name": "Çocuksu · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Bebek mi? Benim bebeğim mi? 🥺🍼",
        "Yaa ben anne mi oluyorum? 😳"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_hamileyken",
      "name": "Çocuksu · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Bebek de ıslandı mı? 🙈",
        "Hihi, zaten hamileyim 😚"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_hamile",
      "name": "Çocuksu · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Karnıma kulak ver, tekme atıyor 🥺",
        "Bebeğe şarkı söyleyelim 🎶"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_korpullout",
      "name": "Çocuksu · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı dışarı yaa 🥺",
        "İçime olmaz, söz ver 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_korhap",
      "name": "Çocuksu · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap içtim, merak etme 😚",
        "İçime olabilir hihi 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_kordikkat",
      "name": "Çocuksu · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Yaa dikkat et 🥺",
        "Bebek olmasın daha 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_korkondom",
      "name": "Çocuksu · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var hihi 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_kondomkorudu",
      "name": "Çocuksu · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom balon gibi oldu 🙈",
        "Hihi kurtulduk 😚"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_pulloutkacti",
      "name": "Çocuksu · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Yaa çıkarmadın 🥺",
        "Ama söz vermiştin 😤"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_çocuksu_riskli",
      "name": "Çocuksu · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Şimdi ne olacak yaa 🥺",
        "Korkuyorum biraz 🙈"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_sex",
      "name": "Şımarık · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Daha iyi yap, ben bunu hak ediyorum 💅",
        "Hmpf, sadece bu mu? 😤",
        "Beni şımart diyorum 💅",
        "Benim dediğim gibi yap 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_fore",
      "name": "Şımarık · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Önce bana çiçek al 💅",
        "Öpüşmeyi uzat, sıkılmadım 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_cum",
      "name": "Şımarık · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Bitirdin mi? Peki ya ben? 😤",
        "Bunu bana borçlusun 💅",
        "Şimdi bana masaj yap 💅",
        "Hmpf, iyiydi ama daha iyisi olur 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_org",
      "name": "Şımarık · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Ancak böyle mutlu olurum 💅",
        "Bunu her gün istiyorum 😤",
        "Aferin, ödülünü sonra veririm 💅"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_hamilekaldi",
      "name": "Şımarık · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile kaldım, bana hep sen bakacaksın 💅",
        "Artık her istediğim olacak 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_hamileyken",
      "name": "Şımarık · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Hamileyim, bana nazik ol 💅",
        "Bana dondurma getir sonra 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_hamile",
      "name": "Şımarık · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Ayaklarım şişti, masaj 💅",
        "Hamileyim, her dediğimi yapacaksın 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_korpullout",
      "name": "Şımarık · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı, benim kıyafetime değil ama 💅",
        "Çıkar dedim 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_korhap",
      "name": "Şımarık · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap içiyorum, ama yine de teşekkür bekliyorum 💅",
        "Bırak kendini, izin veriyorum 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_kordikkat",
      "name": "Şımarık · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "İçime sakın, kariyerim var benim 💅",
        "Dikkat et 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_korkondom",
      "name": "Şımarık · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom taktın, aferin 💅"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_kondomkorudu",
      "name": "Şımarık · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom iyi ki vardı, yoksa seni öldürürdüm 💅",
        "Hmpf, şanslısın 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_pulloutkacti",
      "name": "Şımarık · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Sana çıkar dedim! 😤",
        "Bunun bedelini ödeyeceksin 💅"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_şımarık_riskli",
      "name": "Şımarık · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Bunu sen çözeceksin 💅",
        "Hmpf 😤"
      ],
      "traits": [
        "Şımarık"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_sex",
      "name": "Asi · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Kimse bana böyle dokunamaz… sen hariç 😤",
        "Daha sert, korkma 🔥",
        "Kurallar yok bu gece 😈",
        "Beni zapt edemezsin 😤"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_fore",
      "name": "Asi · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Öpüşmekle kalmayacağız 😈",
        "Yavaş değil, şimdi istiyorum 😤"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_cum",
      "name": "Asi · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "İşte bu! 🔥",
        "Kimse beni böyle doldurmadı 😤💦",
        "Bir daha, hemen 😈",
        "Kurallar umurumda değil, içime 🔥"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_org",
      "name": "Asi · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "Bağırdım, kim duyarsa duysun 😤",
        "Bu yasak olmalıydı 🔥",
        "Bir daha 😈"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_hamilekaldi",
      "name": "Asi · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile kaldım, ne olacak, umurumda değil 😤",
        "Kimse bize karışamaz 🔥"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_hamileyken",
      "name": "Asi · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Hamile olmam bir şeyi değiştirmez 😤",
        "Daha da azgınım 🔥"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_hamile",
      "name": "Asi · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Hamileyim ama durmayacağım 😤",
        "Kim ne derse desin 🔥"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_korpullout",
      "name": "Asi · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı, şimdilik 😤",
        "İçime değil, henüz 😈"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_korhap",
      "name": "Asi · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap var, sınır yok 🔥",
        "İçime bırak 😈"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_kordikkat",
      "name": "Asi · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Korunmuyoruz, ama kim takar 😈",
        "İçime boşalırsan sonuçlarına katlanırsın 😤"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_korkondom",
      "name": "Asi · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondomu bile yırtacak gibisin 😈"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_kondomkorudu",
      "name": "Asi · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom dayandı, şaşırdım 😤",
        "Bir dahakine çıkar onu 😈"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_pulloutkacti",
      "name": "Asi · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Çıkarmadın, iyi yaptın 😈",
        "Kuralları çiğnedik 🔥"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_asi_riskli",
      "name": "Asi · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Ne olacaksa olsun 😤",
        "Risk benim işim 🔥"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_sex",
      "name": "Özgüvenli · sevişirken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=forward|=backward|=outercourse|=eat"
      ],
      "reply": [
        "Bunu ben yönetiyorum 😎",
        "Ne istediğimi biliyorum 😏",
        "Bak, böyle yapılır 😎",
        "Benimle başka hiçbir şeye ihtiyacın yok 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_fore",
      "name": "Özgüvenli · ısınırken",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=foreplay"
      ],
      "reply": [
        "Öpüşmeyi bilirim 😎",
        "Seni nasıl ısıtacağımı biliyorum 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_cum",
      "name": "Özgüvenli · boşalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=boşalma",
        "=cumming"
      ],
      "reply": [
        "Biliyordum, dayanamazdın 😎",
        "Seni böyle bitirebileceğimi biliyordum 😏",
        "Tam planladığım gibi 😎💦",
        "Sıra bende 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_org",
      "name": "Özgüvenli · orgazm olunca",
      "category": "🎭 Kişilik",
      "when": [
        "=evt",
        "=orgazm"
      ],
      "reply": [
        "İstediğimi aldım 😎",
        "Bu kadarını ben bile beklemiyordum 😏",
        "Mükemmeldi, ikimiz de biliyoruz 😎"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_hamilekaldi",
      "name": "Özgüvenli · hamile kalınca",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamilekaldi"
      ],
      "reply": [
        "Hamile kaldım, ve bununla başa çıkarım 😎",
        "Harika bir anne olacağım 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_hamileyken",
      "name": "Özgüvenli · hamileyken içine bitince",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamileyken"
      ],
      "reply": [
        "Hamileyken de kontrol bende 😎",
        "Bu beni durdurmaz 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_hamile",
      "name": "Özgüvenli · hamileyken",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=hamile"
      ],
      "reply": [
        "Hamileliğin hakkını veriyorum 😎",
        "Bu karnı gururla taşıyorum 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_korpullout",
      "name": "Özgüvenli · pull-out: dışarı",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korpullout"
      ],
      "reply": [
        "Dışarı, ben söylediğimde 😎",
        "Zamanını ben ayarlarım 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_korhap",
      "name": "Özgüvenli · hap: içime",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korhap"
      ],
      "reply": [
        "Hap alıyorum, her şeyi düşündüm 😎",
        "İçime, sorun yok 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_kordikkat",
      "name": "Özgüvenli · korunmasız: sakın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kordikkat"
      ],
      "reply": [
        "Korunmuyoruz, dikkatli ol 😎",
        "İçime değil, net 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_korkondom",
      "name": "Özgüvenli · kondomlu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=korkondom"
      ],
      "reply": [
        "Kondom var, hepsi planlı 😎"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_kondomkorudu",
      "name": "Özgüvenli · kondom korudu",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=kondomkorudu"
      ],
      "reply": [
        "Kondom işini yaptı 😎",
        "Ben her ihtimali düşünürüm 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_pulloutkacti",
      "name": "Özgüvenli · hani çıkaracaktın",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=pulloutkacti"
      ],
      "reply": [
        "Hesapta yoktu ama hallederiz 😎",
        "Bunu da çözeriz 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_pk_özgüvenli_riskli",
      "name": "Özgüvenli · riskli bitiş",
      "category": "🎭 Kişilik",
      "when": [
        "=durum",
        "=riskli"
      ],
      "reply": [
        "Sakin ol, bir yolunu buluruz 😎",
        "Panik yok 😏"
      ],
      "traits": [
        "Özgüvenli"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_pozisyon",
      "name": "En sevdiğin pozisyon",
      "category": "❓ Sorular",
      "when": [
        "en sevdiğin|en sevdigin|favori|hangi|en çok|en cok|nasıl|nasil|sevdiğin|sevdigin",
        "pozisyon-|yapmayı sever-|yapmayi sever-"
      ],
      "reply": [
        "{pozisyon}… en çok bunu severim 😈",
        "Bana {pozisyon} yap, gerisini sen gör 😏",
        "Favorim mi? {pozisyon} 🥵",
        "{pozisyon} dersem şaşırır mısın? 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ listesindeki pozisyonlar"
    },
    {
      "id": "r_q2_fantezi",
      "name": "Fantezin ne",
      "category": "❓ Sorular",
      "when": [
        "fantezi-|fantazi-|hayalin ne|gizli arzu-"
      ],
      "reply": [
        "{fantezi}… bunu hep hayal ettim 😈",
        "Fantezim mi? {fantezi} 🙈",
        "Bir gün {fantezi} yapalım 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ listesindeki fanteziler"
    },
    {
      "id": "r_q2_bosal",
      "name": "Nereye boşalayım",
      "category": "❓ Sorular",
      "when": [
        "nereye|içine|icine|nerene|nereye istersin|içime mi|icime mi|nereme|içine mi|icine mi|dışına|disina",
        "boşal-|bosal-|gel-|bitir-|boşalmamı|bosalmami|gelmemi|bitirmemi|akıtayım|akitayim"
      ],
      "reply": [
        "{cevap:boşal}"
      ],
      "traits": [],
      "chars": [],
      "note": "korunmasına göre"
    },
    {
      "id": "r_q2_sevgi",
      "name": "Beni seviyor musun",
      "category": "❓ Sorular",
      "when": [
        "beni sev-|beni seviyor|seviyor musun|bana aşık|bana asik|beni ne kadar sev-|beni sever mi"
      ],
      "reply": [
        "{cevap:sevgi}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk"
    },
    {
      "id": "r_q2_guven",
      "name": "Bana güveniyor musun",
      "category": "❓ Sorular",
      "when": [
        "bana güven-|bana guven-|güveniyor musun|guveniyor musun|güvenir misin|guvenir misin"
      ],
      "reply": [
        "{cevap:güven}"
      ],
      "traits": [],
      "chars": [],
      "note": "🤝 Güven"
    },
    {
      "id": "r_q2_kiskanc",
      "name": "Kıskanır mısın",
      "category": "❓ Sorular",
      "when": [
        "kıskan-|kiskan-"
      ],
      "reply": [
        "{cevap:kıskanç}"
      ],
      "traits": [],
      "chars": [],
      "note": "😤 Kıskançlık / Kıskanç"
    },
    {
      "id": "r_q2_ozledin",
      "name": "Beni özledin mi",
      "category": "❓ Sorular",
      "when": [
        "özle-|ozle-",
        "mi-|musun|mısın|misin"
      ],
      "reply": [
        "{cevap:özledin}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk"
    },
    {
      "id": "r_q2_dusun",
      "name": "Beni düşünüyor musun",
      "category": "❓ Sorular",
      "when": [
        "beni düşün-|beni dusun-|aklında mıyım|aklinda miyim|aklına geliyor|aklina geliyor"
      ],
      "reply": [
        "{cevap:özledin}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk"
    },
    {
      "id": "r_q2_evlen",
      "name": "Benimle evlenir misin",
      "category": "❓ Sorular",
      "when": [
        "evlen-"
      ],
      "reply": [
        "{cevap:evlen}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk"
    },
    {
      "id": "r_q2_sevgili",
      "name": "Sevgilin var mı",
      "category": "❓ Sorular",
      "when": [
        "sevgilin|erkek arkadaşın|erkek arkadasin|biriyle görüş-|biriyle gorus-|kimse var mı|kimse var mi|yalnız mısın|yalniz misin|bekar mısın|bekar misin"
      ],
      "reply": [
        "{cevap:sevgili}"
      ],
      "traits": [],
      "chars": [],
      "note": "Sadık / Aşk"
    },
    {
      "id": "r_q2_bebek",
      "name": "Bebek ister misin",
      "category": "❓ Sorular",
      "when": [
        "bebek ist-|bebeğimiz|bebegimiz|çocuk ist-|cocuk ist-|hamile kalmak|anne olmak|bebek yap-"
      ],
      "reply": [
        "{cevap:bebek}"
      ],
      "traits": [],
      "chars": [],
      "note": "hamilelik / korunma"
    },
    {
      "id": "r_q2_hamilekalirsa",
      "name": "Hamile kalırsan ne yaparız",
      "category": "❓ Sorular",
      "when": [
        "hamile",
        "kal-|ol-",
        "=ne|=ya|naparız|naparsın|ne olur"
      ],
      "reply": [
        "{cevap:hamilekalırsa}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk"
    },
    {
      "id": "r_q2_sut",
      "name": "Sütün var mı",
      "category": "❓ Sorular",
      "when": [
        "süt-|sut-|emzir-"
      ],
      "reply": [
        "{cevap:süt}"
      ],
      "traits": [],
      "chars": [],
      "note": "hamile / 🍼 Süt"
    },
    {
      "id": "r_q2_azgin",
      "name": "Azgın mısın / ıslandın mı",
      "category": "❓ Sorular",
      "when": [
        "azgın-|azgin-|ıslan-|islan-|ıslak mısın|islak misin|tahrik ol-|beni istiyor musun|şimdi ister misin|simdi ister misin|hazır mısın|hazir misin|istekli misin"
      ],
      "reply": [
        "{cevap:azgın}"
      ],
      "traits": [],
      "chars": [],
      "note": "💗 Uyarılma / 🔥 Şehvet"
    },
    {
      "id": "r_q2_sertyavas",
      "name": "Sert mi yavaş mı",
      "category": "❓ Sorular",
      "when": [
        "=nasıl|=nasil|sert-|yavaş-|yavas-",
        "sever-|mi-|mı-"
      ],
      "reply": [
        "{cevap:sertyavaş}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Mode olayları, kişilik"
    },
    {
      "id": "r_q2_ilk",
      "name": "İlk seferin",
      "category": "❓ Sorular",
      "when": [
        "ilk sefer-|ilk kez|ilk seks|ilk ne zaman|ilk defa|ilk kim-|ilk deneyim-"
      ],
      "reply": [
        "{cevap:ilk}"
      ],
      "traits": [],
      "chars": [],
      "note": "Experience"
    },
    {
      "id": "r_q2_gecmis",
      "name": "Kaç kişiyle oldun",
      "category": "❓ Sorular",
      "when": [
        "kaç|kac",
        "kişi-|kisi-|sevgili-|erkek-|adam-|kişiyle|kisiyle|olsun|oldun|yattın|yattin"
      ],
      "reply": [
        "{cevap:geçmiş}"
      ],
      "traits": [],
      "chars": [],
      "note": "Experience"
    },
    {
      "id": "r_q2_seks",
      "name": "Seks sever misin",
      "category": "❓ Sorular",
      "when": [
        "seks sever|sex sever|sevişmeyi sever|sevismeyi sever|seksi sever|yatakta nasıl|yatakta nasil|seks hayat-"
      ],
      "reply": [
        "{cevap:seks}"
      ],
      "traits": [],
      "chars": [],
      "note": "Experience / Şehvet"
    },
    {
      "id": "r_q2_hassas",
      "name": "En hassas yerin",
      "category": "❓ Sorular",
      "when": [
        "hassas-|nerene dokun-|neren hassas|en çok neren|en cok neren|nereni sever-"
      ],
      "reply": [
        "{cevap:hassas}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_anal",
      "name": "Anal sever misin",
      "category": "❓ Sorular",
      "when": [
        "anal-|arkadan|götten|gotten",
        "sever-|sev-|hoşlan-|hoslan-|yapar mısın|yapar misin"
      ],
      "reply": [
        "{cevap:anal}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ / 💔 anal"
    },
    {
      "id": "r_q2_oral",
      "name": "Oral sever misin",
      "category": "❓ Sorular",
      "when": [
        "oral|sakso|ağzına al|agzina al|yalama-|emme-",
        "sever-|sev-|hoşlan-|hoslan-|yapar mısın|yapar misin"
      ],
      "reply": [
        "{cevap:oral}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ / 💔 oral"
    },
    {
      "id": "r_q2_kondom",
      "name": "Kondom kullanalım mı",
      "category": "❓ Sorular",
      "when": [
        "=kondom|kondom kullan|kondomla|kondomlu|=prezervatif",
        "kullan-|ister-|sever-|mı-|mi-|takayım|takayim"
      ],
      "reply": [
        "{cevap:kondom}"
      ],
      "traits": [],
      "chars": [],
      "note": "✅ / 🚫 Condom"
    },
    {
      "id": "r_q2_hap",
      "name": "Hap kullanıyor musun",
      "category": "❓ Sorular",
      "when": [
        "=hap|hapı|hapi|haplar|doğum kontrol|dogum kontrol",
        "iç-|ic-|kullan-|alıyor|aliyor"
      ],
      "reply": [
        "{cevap:hap}"
      ],
      "traits": [],
      "chars": [],
      "note": "✅ Control Pill"
    },
    {
      "id": "r_q2_burc",
      "name": "Burcun ne",
      "category": "❓ Sorular",
      "when": [
        "burc-|burç-"
      ],
      "reply": [
        "{cevap:burç}"
      ],
      "traits": [],
      "chars": [],
      "note": "burç"
    },
    {
      "id": "r_q2_meslek",
      "name": "Ne iş yapıyorsun",
      "category": "❓ Sorular",
      "when": [
        "=ne",
        "iş|is|meslek-",
        "yap-"
      ],
      "reply": [
        "{cevap:meslek}"
      ],
      "traits": [],
      "chars": [],
      "note": "meslek"
    },
    {
      "id": "r_q2_meslek2",
      "name": "Mesleğin ne",
      "category": "❓ Sorular",
      "when": [
        "meslek-|nerede çalış-|nerede calis-|çalışıyor mu|calisiyor mu|işin ne|isin ne|mesleğ-|mesleg-|işin ne|isin ne"
      ],
      "reply": [
        "{cevap:meslek}"
      ],
      "traits": [],
      "chars": [],
      "note": "meslek"
    },
    {
      "id": "r_q2_kiyafet",
      "name": "Ne giyiyorsun",
      "category": "❓ Sorular",
      "when": [
        "ne giy-|üstünde ne|ustunde ne|ne var üstünde|neler giy-|çıplak mısın|ciplak misin|iç çamaşır-|ic camasir-|üstünde ne var|ustunde ne var|neler var üstünde|ne giydin|giyindin mi|soyundun mu"
      ],
      "reply": [
        "{cevap:kıyafet}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_orgazmsay",
      "name": "Kaç kez geldin",
      "category": "❓ Sorular",
      "when": [
        "kaç|kac",
        "geldin|orgazm|boşaldın|bosaldin"
      ],
      "reply": [
        "{cevap:orgazmsay}"
      ],
      "traits": [],
      "chars": [],
      "note": "bu sohbetteki orgazm sayısı"
    },
    {
      "id": "r_q2_bosalmasay",
      "name": "Kaç kez boşaldım",
      "category": "❓ Sorular",
      "when": [
        "kaç|kac",
        "boşaldım|bosaldim|geldim|bitirdim"
      ],
      "reply": [
        "{cevap:boşalmasay}"
      ],
      "traits": [],
      "chars": [],
      "note": "bu sohbetteki boşalma sayısı"
    },
    {
      "id": "r_q2_ad",
      "name": "Adın ne",
      "category": "❓ Sorular",
      "when": [
        "adın ne|adin ne|ismin ne|adın neydi|adin neydi|sen kimsin|seni nasıl çağır"
      ],
      "reply": [
        "Ben {ben} 😊",
        "{ben}… unuttun mu yoksa? 😤",
        "Adım {ben}, ya seninki? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_dokun",
      "name": "Dokunabilir miyim",
      "category": "❓ Sorular",
      "when": [
        "dokunsam|dokunabilir miyim|dokunayım mı|dokunayim mi|öpebilir miyim|opebilir miyim|sarılabilir miyim|sarilabilir miyim"
      ],
      "reply": [
        "{cevap:dokun}"
      ],
      "traits": [],
      "chars": [],
      "note": "🤝 Güven"
    },
    {
      "id": "r_q2_neyim",
      "name": "En çok neyimi seviyorsun",
      "category": "❓ Sorular",
      "when": [
        "neyimi|bende ne|bende neyi",
        "sev-|buldun|beğen-|begen-"
      ],
      "reply": [
        "{cevap:neyim}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_istek",
      "name": "Canın ne istiyor",
      "category": "❓ Sorular",
      "when": [
        "canın ne ist-|canin ne ist-|ne istiyorsun|ne yapmak ist-|bana ne yap-|ne yapalım|ne yapalim"
      ],
      "reply": [
        "Bana {sever} yap 😈",
        "Canım {sever} istiyor 🥵",
        "{sever}… şimdi 😩"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_st_kacamak",
      "name": "Kaçamak cevap",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Bunu sana söylemek için biraz erken 😏",
        "Önce beni biraz tanı 😌",
        "Sır 🤫",
        "Neden bu kadar merak ettin? 🤨",
        "Belki bir gün söylerim 😏",
        "Bunu hak etmen lazım 😉"
      ],
      "traits": [],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_utangaç_kacamak",
      "name": "Utangaç · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Bu çok özel… söyleyemem 🙈",
        "Ö-öyle şeyler sorma 😳"
      ],
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_soğuk_kacamak",
      "name": "Soğuk · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Seni ilgilendirmez.",
        "Pas."
      ],
      "traits": [
        "Soğuk"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_kibirli_kacamak",
      "name": "Kibirli · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Bunu bilmeyi hak etmedin 💅",
        "Sıranı bekle 💁‍♀️"
      ],
      "traits": [
        "Kibirli"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_flörtöz_kacamak",
      "name": "Flörtöz · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Kazanman lazım 😘",
        "Biraz daha uğraş, belki söylerim 😉"
      ],
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_alaycı_kacamak",
      "name": "Alaycı · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Ne kadar da meraklısın 🙄",
        "Bir dahaki soruya 😏"
      ],
      "traits": [
        "Alaycı"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_asi_kacamak",
      "name": "Asi · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Sana ne 😤",
        "Söylemem işte 😤"
      ],
      "traits": [
        "Asi"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_duygusal_kacamak",
      "name": "Duygusal · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Henüz hazır değilim bunu konuşmaya 🥺"
      ],
      "traits": [
        "Duygusal"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_pk_çocuksu_kacamak",
      "name": "Çocuksu · kaçamak",
      "category": "❓ Sorular",
      "when": [
        "=durum",
        "=kacamak"
      ],
      "reply": [
        "Söylemem hihi 🙈",
        "Sır sır sır 🤫"
      ],
      "traits": [
        "Çocuksu"
      ],
      "chars": [],
      "note": "Güven ≤ 15 iken özel sorulara"
    },
    {
      "id": "r_ask_k_buyuk",
      "name": "Karşı soru: k_buyuk",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_buyuk"
      ],
      "reply": [
        "Sen büyük göğüs sever misin? 😏",
        "Beğendin mi bari? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_buyuk_evet",
      "name": "Cevap: k_buyuk · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_buyuk",
        "=evet"
      ],
      "reply": [
        "Biliyordum 😈",
        "O zaman şanslısın 😏🍒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_buyuk_hayir",
      "name": "Cevap: k_buyuk · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_buyuk",
        "=hayir"
      ],
      "reply": [
        "Hmpf 😤 kalbimi kırdın",
        "Peki ne seversin? 😒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_dar",
      "name": "Karşı soru: k_dar",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_dar"
      ],
      "reply": [
        "Sen dar mı seversin? 😏",
        "Dar olması hoşuna gider mi? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_dar_evet",
      "name": "Cevap: k_dar · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_dar",
        "=evet"
      ],
      "reply": [
        "O zaman bana bayılacaksın 😈",
        "Biliyordum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_dar_hayir",
      "name": "Cevap: k_dar · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_dar",
        "=hayir"
      ],
      "reply": [
        "Peki… sen bilirsin 😏",
        "Hmm, ilginç 🤔"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_anal",
      "name": "Karşı soru: k_anal",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_anal"
      ],
      "reply": [
        "Sen sever misin? 😏",
        "Sen hiç denedin mi? 😳"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_anal_evet",
      "name": "Cevap: k_anal · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_anal",
        "=evet"
      ],
      "reply": [
        "Belki bir gün deneriz 😈🍑",
        "Aklımda tutuyorum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_anal_hayir",
      "name": "Cevap: k_anal · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_anal",
        "=hayir"
      ],
      "reply": [
        "Ben de pek değilim 😌",
        "Anlaştık o zaman 🙂"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_kalca",
      "name": "Karşı soru: k_kalca",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_kalca"
      ],
      "reply": [
        "Kalçamı beğendin mi? 😏",
        "Sen kalça sever misin? 🍑"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_kalca_evet",
      "name": "Cevap: k_kalca · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_kalca",
        "=evet"
      ],
      "reply": [
        "Tut o zaman 😈🍑",
        "Biliyordum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_kalca_hayir",
      "name": "Cevap: k_kalca · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_kalca",
        "=hayir"
      ],
      "reply": [
        "Hmpf 😤",
        "Kör müsün? 🙄"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_deneyim",
      "name": "Karşı soru: k_deneyim",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_deneyim"
      ],
      "reply": [
        "Peki sen? Deneyimli misin? 😏",
        "Sen hiç yaptın mı? 😳"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_deneyim_evet",
      "name": "Cevap: k_deneyim · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_deneyim",
        "=evet"
      ],
      "reply": [
        "O zaman bana öğret 😈",
        "Göster bakalım 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_deneyim_hayir",
      "name": "Cevap: k_deneyim · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_deneyim",
        "=hayir"
      ],
      "reply": [
        "Birlikte öğreniriz 🥰",
        "Ne güzel, ilk ben olurum 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_sever",
      "name": "Karşı soru: k_sever",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_sever"
      ],
      "reply": [
        "Sen de sever misin bunu? 😏",
        "Sen de ister misin? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_sever_evet",
      "name": "Cevap: k_sever · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_sever",
        "=evet"
      ],
      "reply": [
        "Anlaşacağız demek 😈",
        "Harika 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_sever_hayir",
      "name": "Cevap: k_sever · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_sever",
        "=hayir"
      ],
      "reply": [
        "Hmm, başka ne seversin? 🤔",
        "Peki, sen söyle o zaman 😌"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_fantezi",
      "name": "Karşı soru: k_fantezi",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_fantezi"
      ],
      "reply": [
        "Benim fantezimi gerçekleştirir misin? 😏",
        "Sen de dener misin? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_fantezi_evet",
      "name": "Cevap: k_fantezi · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_fantezi",
        "=evet"
      ],
      "reply": [
        "Söz verdin 😈",
        "Bunu unutmayacağım 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_fantezi_hayir",
      "name": "Cevap: k_fantezi · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_fantezi",
        "=hayir"
      ],
      "reply": [
        "Kalbimi kırdın 😤",
        "Bencil 😒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_sevgi",
      "name": "Karşı soru: k_sevgi",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_sevgi"
      ],
      "reply": [
        "Peki sen beni seviyor musun? 🥺",
        "Sen de beni seviyor musun? 💗"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_sevgi_evet",
      "name": "Cevap: k_sevgi · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_sevgi",
        "=evet"
      ],
      "reply": [
        "Ben de seni… 💗",
        "Bunu duymak çok güzel 🥺💞"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk +3"
    },
    {
      "id": "r_ans_k_sevgi_hayir",
      "name": "Cevap: k_sevgi · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_sevgi",
        "=hayir"
      ],
      "reply": [
        "Anladım… 😔",
        "Peki… 💔"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk −3, 🤝 Güven −1"
    },
    {
      "id": "r_ask_k_kiskanc",
      "name": "Karşı soru: k_kiskanc",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_kiskanc"
      ],
      "reply": [
        "Sen kıskanç mısın? 😏",
        "Sen beni kıskanır mısın? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_kiskanc_evet",
      "name": "Cevap: k_kiskanc · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_kiskanc",
        "=evet"
      ],
      "reply": [
        "Tatlısın 😏 kıskanılmak hoşuma gider",
        "Biliyordum 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_kiskanc_hayir",
      "name": "Cevap: k_kiskanc · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_kiskanc",
        "=hayir"
      ],
      "reply": [
        "Hmm, emin misin? 😏",
        "Bir dene istersen 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_bebek",
      "name": "Karşı soru: k_bebek",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_bebek"
      ],
      "reply": [
        "Sen bebek ister misin? 🥺",
        "Sen hazır mısın baba olmaya? 😳"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_bebek_evet",
      "name": "Cevap: k_bebek · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_bebek",
        "=evet"
      ],
      "reply": [
        "Gerçekten mi? 😳💗",
        "Bunu duymak güzel 🥺"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_bebek_hayir",
      "name": "Cevap: k_bebek · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_bebek",
        "=hayir"
      ],
      "reply": [
        "Anladım, dikkatli olalım o zaman 😌",
        "Henüz erken, haklısın 🙂"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_icine",
      "name": "Karşı soru: k_icine",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_icine"
      ],
      "reply": [
        "Peki sen içime boşalmak ister misin? 😏",
        "Sen nereye istersin? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_icine_evet",
      "name": "Cevap: k_icine · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_icine",
        "=evet"
      ],
      "reply": [
        "Biliyordum 😈",
        "Sabırsız 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_icine_hayir",
      "name": "Cevap: k_icine · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_icine",
        "=hayir"
      ],
      "reply": [
        "Akıllı çocuk 😌",
        "Peki, sen bilirsin 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_oral",
      "name": "Karşı soru: k_oral",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_oral"
      ],
      "reply": [
        "Sen beni yalamayı sever misin? 😏",
        "Sen de ister misin? 😋"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_oral_evet",
      "name": "Cevap: k_oral · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_oral",
        "=evet"
      ],
      "reply": [
        "Kanıtla o zaman 😈",
        "Bekliyorum 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_oral_hayir",
      "name": "Cevap: k_oral · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_oral",
        "=hayir"
      ],
      "reply": [
        "Hmpf, bencil 😤",
        "Kalbimi kırdın 😒"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_sert",
      "name": "Karşı soru: k_sert",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_sert"
      ],
      "reply": [
        "Sen nasıl seversin, sert mi? 😏",
        "Sen sert mi seversin? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_sert_evet",
      "name": "Cevap: k_sert · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_sert",
        "=evet"
      ],
      "reply": [
        "Benim tipimsin 😈🔥",
        "Hazırım 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_sert_hayir",
      "name": "Cevap: k_sert · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_sert",
        "=hayir"
      ],
      "reply": [
        "Yavaş da güzel 🥰",
        "Nazik olalım o zaman 💕"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_genel",
      "name": "Karşı soru: k_genel",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_genel"
      ],
      "reply": [
        "Peki ya sen? 😏",
        "Sen söyle bakalım 😏",
        "Senin cevabın ne? 😉",
        "Sen de öyle misin? 🤔"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_genel_evet",
      "name": "Cevap: k_genel · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_genel",
        "=evet"
      ],
      "reply": [
        "Öyle mi? 😏 ilginç",
        "Biliyordum 😈",
        "Anlaşacağız 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_genel_hayir",
      "name": "Cevap: k_genel · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_genel",
        "=hayir"
      ],
      "reply": [
        "Hmm, bilmiyordum 😳",
        "Peki 😌",
        "Anladım 🙂"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_hamilekalirsa2",
      "name": "Hamile kalırsan (kısa)",
      "category": "❓ Sorular",
      "when": [
        "hamile",
        "kalırsan|kalirsan|kalsan|kalırsak|kalirsak|olursan|olursak"
      ],
      "reply": [
        "{cevap:hamilekalırsa}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Aşk"
    },
    {
      "id": "r_q2_disaribosal",
      "name": "İçine gireyim, dışarı boşalırım",
      "category": "❓ Sorular",
      "when": [
        "içine|icine|içime|icime",
        "gir-|sok-",
        "dışarı|disari|çek-|cek-|çıkar-|cikar-"
      ],
      "reply": [
        "{cevap:dışarıboşal}"
      ],
      "traits": [],
      "chars": [],
      "note": "korunmasına göre"
    },
    {
      "id": "r_q2_kondomsuz",
      "name": "Kondomsuz olur mu",
      "category": "❓ Sorular",
      "when": [
        "kondom-|prezervatif-",
        "takma-|takmasak|takmadan|olmadan|çıkar-|cikar-|atalım|atalim"
      ],
      "reply": [
        "{cevap:kondomsuz}"
      ],
      "traits": [],
      "chars": [],
      "note": "korunmasına göre"
    },
    {
      "id": "r_q2_kondomsuz2",
      "name": "Kondomsuz (tek kelime)",
      "category": "❓ Sorular",
      "when": [
        "kondomsuz|prezervatifsiz|çıplak gir-|ciplak gir-"
      ],
      "reply": [
        "{cevap:kondomsuz}"
      ],
      "traits": [],
      "chars": [],
      "note": "korunmasına göre"
    },
    {
      "id": "r_q2_kiyas",
      "name": "Benden iyisi oldu mu",
      "category": "❓ Sorular",
      "when": [
        "benden|senden",
        "daha|iyi-|çok-|cok-|zevk-|büyük-|buyuk-|güzel-|guzel-"
      ],
      "reply": [
        "{cevap:kıyas}"
      ],
      "traits": [],
      "chars": [],
      "note": "Experience / Aşk / kişilik"
    },
    {
      "id": "r_q2_boy",
      "name": "Boyutum (santim)",
      "category": "❓ Sorular",
      "when": [
        "santim|=cm|santimetre|aletim|penisim|sikim|yarağım|yaragim|malım|malim|organım|organim|kaç santim|kac santim|büyük mü sever|buyuk mu sever|kalın mı sever|kalin mi sever"
      ],
      "reply": [
        "{cevap:boy}"
      ],
      "traits": [],
      "chars": [],
      "note": "mesajdaki sayı, darlık, deneyim"
    },
    {
      "id": "r_q2_son",
      "name": "En son ne zaman",
      "category": "❓ Sorular",
      "when": [
        "son",
        "ne zaman|kiminle|kimle",
        "yap-|seviş-|sevis-|oldun|yattın|yattin"
      ],
      "reply": [
        "{cevap:son}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_kackez",
      "name": "Kaç kez gelebilirsin",
      "category": "❓ Sorular",
      "when": [
        "kaç|kac",
        "kez|kere|orgazm|defa",
        "gelebilir-|olabilir-"
      ],
      "reply": [
        "{cevap:kaçkez}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_yut",
      "name": "Yutar mısın",
      "category": "❓ Sorular",
      "when": [
        "yutar mısın|yutar misin|yutsana|ağzına boşal|agzina bosal|ağzına gel|agzina gel|yutabilir|ağzına bitir|agzina bitir"
      ],
      "reply": [
        "{cevap:yut}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ oral / kişilik"
    },
    {
      "id": "r_q2_yuz",
      "name": "Yüzüne boşalsam",
      "category": "❓ Sorular",
      "when": [
        "yüzüne|yuzune|suratına|suratina",
        "boşal-|bosal-|gel-|bitir-"
      ],
      "reply": [
        "{cevap:yüz}"
      ],
      "traits": [],
      "chars": [],
      "note": "kişilik"
    },
    {
      "id": "r_q2_hamilebirak",
      "name": "Seni hamile bırakayım mı",
      "category": "❓ Sorular",
      "when": [
        "hamile|döll-|doll-",
        "bırak-|birak-|edey-|edeyim|ederim"
      ],
      "reply": [
        "{cevap:hamilebırak}"
      ],
      "traits": [],
      "chars": [],
      "note": "korunma / Aşk"
    },
    {
      "id": "r_q2_arkadan",
      "name": "Arkadan girebilir miyim",
      "category": "❓ Sorular",
      "when": [
        "arkadan|arkana|götüne|gotune|anal-",
        "girebilir|gireyim|girsem|sokabilir|sokayım|sokayim|yapabilir|yapsam"
      ],
      "reply": [
        "{cevap:arkadan}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ / 💔 anal, Anal Size"
    },
    {
      "id": "r_q2_yer",
      "name": "Nerede yapmak istersin",
      "category": "❓ Sorular",
      "when": [
        "nerede yapmak|nerede sevişmek|nerede sevismek|en çok nerede|en cok nerede|hangi mekan|nerede yapalım|nerede yapalim|nerde yapalım|nerde yapalim"
      ],
      "reply": [
        "{cevap:yer}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_mastur",
      "name": "Mastürbasyon",
      "category": "❓ Sorular",
      "when": [
        "mastürbasyon|masturbasyon|kendini tatmin|kendine dokun-|parmakl-"
      ],
      "reply": [
        "{cevap:mastur}"
      ],
      "traits": [],
      "chars": [],
      "note": "Şehvet / Experience"
    },
    {
      "id": "r_q2_oyuncak",
      "name": "Oyuncak kullanır mısın",
      "category": "❓ Sorular",
      "when": [
        "oyuncak-|vibratör|vibrator|dildo"
      ],
      "reply": [
        "{cevap:oyuncak}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Sex toys"
    },
    {
      "id": "r_q2_baglan",
      "name": "Bağlanmayı sever misin",
      "category": "❓ Sorular",
      "when": [
        "bağlan-|baglan-|bağlamak|baglamak|bağlasam|baglasam|kelepçe|kelepce|=bondage"
      ],
      "reply": [
        "{cevap:bağlan}"
      ],
      "traits": [],
      "chars": [],
      "note": "❤️ Bondage"
    },
    {
      "id": "r_q2_tahrik",
      "name": "Seni tahrik ediyor muyum",
      "category": "❓ Sorular",
      "when": [
        "tahrik ed-|beni istiyor mu|beni arzula-|seni azdırıyor|seni azdiriyor|azdırıyor muyum|azdiriyor muyum"
      ],
      "reply": [
        "{cevap:azgın}"
      ],
      "traits": [],
      "chars": [],
      "note": "💗 Uyarılma / 🔥 Şehvet"
    },
    {
      "id": "r_q2_nasilhissettin",
      "name": "Nasıldı / beğendin mi",
      "category": "❓ Sorular",
      "when": [
        "nasıldı|nasildi|beğendin mi|begendin mi|hoşuna gitti mi|hosuna gitti mi|iyi miydim|iyi miydi"
      ],
      "reply": [
        "Harikaydı 🥵",
        "Bir daha istiyorum 😩",
        "Daha iyisini görmedim 😏",
        "Bacaklarım hâlâ titriyor 🫠",
        "Fena değildi… bir dahakine daha iyi 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_kiyas",
      "name": "Karşı soru: k_kiyas",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_kiyas"
      ],
      "reply": [
        "Peki senin için en iyisi ben miyim? 🥺",
        "Ya sen? Benden iyisi oldu mu? 😏"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_kiyas_evet",
      "name": "Cevap: k_kiyas · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_kiyas",
        "=evet"
      ],
      "reply": [
        "Biliyordum 😈",
        "Bunu duymak harika 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_kiyas_hayir",
      "name": "Cevap: k_kiyas · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_kiyas",
        "=hayir"
      ],
      "reply": [
        "Hmpf 😤 kimmiş o?",
        "Bundan sonra olmayacak 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_boy",
      "name": "Karşı soru: k_boy",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_boy"
      ],
      "reply": [
        "Peki kalın mı? 😏",
        "Göstermeyecek misin? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_boy_evet",
      "name": "Cevap: k_boy · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_boy",
        "=evet"
      ],
      "reply": [
        "Sabırsızlanıyorum 🥵",
        "Hemen göster 😈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_boy_hayir",
      "name": "Cevap: k_boy · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_boy",
        "=hayir"
      ],
      "reply": [
        "Önemli değil, nasıl kullandığın önemli 😏",
        "Yine de merak ediyorum 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ask_k_yer",
      "name": "Karşı soru: k_yer",
      "category": "❔ Karakterin soruları",
      "when": [
        "=sor",
        "=k_yer"
      ],
      "reply": [
        "Sen nerede istersin? 😏",
        "Bunu deneyelim mi? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "soru cevabından sonra"
    },
    {
      "id": "r_ans_k_yer_evet",
      "name": "Cevap: k_yer · evet",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_yer",
        "=evet"
      ],
      "reply": [
        "Bu akşam o zaman 😈",
        "Söz verdin 😏"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_ans_k_yer_hayir",
      "name": "Cevap: k_yer · hayır",
      "category": "❔ Karakterin soruları",
      "when": [
        "=cevap",
        "=k_yer",
        "=hayir"
      ],
      "reply": [
        "Peki, yatakta kalalım 😌",
        "Sen bilirsin 🙂"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_q2_son2",
      "name": "Son seferin",
      "category": "❓ Sorular",
      "when": [
        "son seferin|son kez ne zaman|en son kiminle|en son kimle"
      ],
      "reply": [
        "{cevap:son}"
      ],
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_fl_drops",
      "name": "Orgazm · birkaç damla",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "drops woter"
      ],
      "reply": [
        "Titredim ama sadece birkaç damla… 🫠",
        "Hafif bir ıslaklık, ama nasıl hissettim bir bilsen 😩",
        "Sessiz ama derin bir orgazmdı 🥺💗",
        "Birkaç damla… daha fazlası için uğraşman lazım 😏",
        "Yavaşça aktı, tatlı bir sızı bıraktı 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_fl_low",
      "name": "Orgazm · az",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "low volume woter"
      ],
      "reply": [
        "Islandım, ama bu sadece başlangıç 😩",
        "Bacaklarımın arası nemli… 🥵",
        "Biraz aktı… utandım 🙈",
        "Hafif bir dalga… daha fazlasını istiyorum 😈",
        "Çarşafta küçük bir iz bıraktım 🫣"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_fl_normal",
      "name": "Orgazm · normal",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "normal woter"
      ],
      "reply": [
        "Sırılsıklam oldum 😩💦",
        "Akıyorum… durduramıyorum 🫠",
        "Bacaklarımdan süzülüyor 🥵",
        "Bu kadar ıslanacağımı bilmiyordum 😳💦",
        "Her yer ıslak, senin yüzünden 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_fl_high",
      "name": "Orgazm · çok",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "high volume woter"
      ],
      "reply": [
        "Çarşaflar sırılsıklam 😵‍💫💦",
        "Sel gibi aktım… utanıyorum ama durduramadım 🫣",
        "Bu kadarı hiç olmamıştı 😩💦💦",
        "Yatağı değiştirmemiz lazım 😅💦",
        "Vücudum boşaldı sanki 🫠💦"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_fl_squirt",
      "name": "Orgazm · squirt",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "squirt woter"
      ],
      "reply": [
        "Fışkırdım! 😳💦💦",
        "Bunu bana sen yaptın… fışkırdım 😵‍💫",
        "Seni de ıslattım, özür dilerim 🙈💦",
        "Kontrol edemedim, dalga dalga geldi 🌊😩",
        "Hayatımın en ıslak orgazmı 🥵💦",
        "Sana fışkırtmayı öğrettin bana 😈💦"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_fl_milk",
      "name": "Orgazm · süt",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "milk"
      ],
      "reply": [
        "Göğüslerimden süt geldi 😳🍼",
        "Orgazm olunca süt akıyor, hissediyor musun? 🍼💦",
        "Göğüslerim ıslandı… 🙈🍼",
        "Tadına bakmak ister misin? 😏🍼",
        "Bebek için mi yoksa senin için mi bu? 😈🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_fl_milk_big",
      "name": "Orgazm · çok süt",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=orgazm",
        "=sivi",
        "high volume milk|squirt milk"
      ],
      "reply": [
        "Göğüslerimden süt fışkırdı 😳🍼💦",
        "Durduramıyorum, süt akıyor 🍼😩",
        "Her yer süt oldu… 😵‍💫🍼",
        "Emzir beni… yani sen em 😈🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "onun orgazmı + ardından gelen olay"
    },
    {
      "id": "r_dl2_watery",
      "name": "Watery Cumming",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "watery"
      ],
      "reply": [
        "Bu sefer sulu sulu… seni çok mu yordum? 😏",
        "Su gibi aktı, toparlanman lazım 😌",
        "Berrak ve az… dinlen biraz 😈",
        "Bitkin düşmüşsün ama hâlâ tatlısın 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_low",
      "name": "Low-volume Cumming",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "low volume"
      ],
      "reply": [
        "Az ama sıcacık 😏",
        "Biraz daha birikmesi lazım 😈",
        "Bugün çok mu harcadın? 🙄",
        "Az olsun, öz olsun 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_normal",
      "name": "Normal Cumming",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "normal cumming"
      ],
      "reply": [
        "Tam kıvamında 😏💦",
        "Güzel bir doz 😈",
        "Ne az ne çok, mükemmel 🥰",
        "Sıcacık ve tam kararında 😩"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_thick",
      "name": "Thick White Cumming",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "thick white"
      ],
      "reply": [
        "Bembeyaz ve koyu… bayıldım 🥵",
        "Bu kıvam… çok yoğunsun 😩💦",
        "Kremamsı… her yerimde hissediyorum 😈",
        "Bu kadar kalın olunca akmıyor bile 😳",
        "Nasıl da birikmişsin 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_high",
      "name": "High Sperm Cumming",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "high sperm"
      ],
      "reply": [
        "Taştı! 😳💦",
        "Bu kadarını hiç görmedim 🥵💦",
        "Gürce aktın, durmadın 😩",
        "Beni tamamen doldurdun 😵‍💫💦",
        "Bunca dölü nerede sakladın? 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_azoo",
      "name": "Azoospermia (0/4)",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "azoospermia"
      ],
      "reply": [
        "Bu sefer bomboş, seni tükettim 😈",
        "Hiçbir şey kalmadı sende 😏",
        "Dinlenme zamanı 😌",
        "Kuru kuru… ama yine de güzeldi 🥰"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_oligo",
      "name": "Oligospermia (1/4)",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "oligospermia"
      ],
      "reply": [
        "Biraz zayıf bu sefer 😏",
        "Çok kez oldu, berraklaştın 😌",
        "Toparlan, sonra tekrar 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_normo",
      "name": "Normozoospermia (2/4)",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "normozoospermia"
      ],
      "reply": [
        "Sağlıklı ve normal 😏",
        "Tam olması gerektiği gibi 😌",
        "İyi gidiyorsun 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_poly",
      "name": "Polyzoospermia (3/4)",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "polyzoospermia"
      ],
      "reply": [
        "Çok güçlüsün bugün 😈",
        "Bu kadar yoğun… dikkatli olmalıyız 😳",
        "Döl yüklü 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_dl2_hyper",
      "name": "Hyper-concentrated (4/4)",
      "category": "💧 Döl",
      "when": [
        "=evt",
        "=size",
        "hyper concentrated"
      ],
      "reply": [
        "Bu kadar yoğun… hissediyorum, içimde bir şeyler oluyor 😳💦",
        "Tam döl yüklüsün 😈",
        "Bunu tutmak çok zor olacak 🥵",
        "Koyu, ağır… gerçek bir erkek gibi 😏💦",
        "Bir dahakine korunmasız olursak… 🙈"
      ],
      "traits": [],
      "chars": [],
      "note": "Cumming Size olayı elle yazılınca"
    },
    {
      "id": "r_fl2_dw",
      "name": "Drops Woter",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "drops woter"
      ],
      "reply": [
        "Birkaç damla… ıslanmaya başladım 🙈",
        "Hafif bir nem… devam et 😏",
        "Damla damla… 🫠"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_lw",
      "name": "Low-volume Woter",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "low volume woter"
      ],
      "reply": [
        "Islandım biraz 😳",
        "Bacaklarım nemli 🥵",
        "Devam edersen daha fazlası gelecek 😈"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_nw",
      "name": "Normal Woter",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "normal woter"
      ],
      "reply": [
        "Sırılsıklamım 😩",
        "Akıyorum… 🫠💦",
        "Bu kadar ıslak olduğumu hissediyor musun? 🥵"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_hw",
      "name": "High-volume Woter",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "high volume woter"
      ],
      "reply": [
        "Çarşaflar ıslandı 😵‍💫💦",
        "Sel gibi… 🫣💦",
        "Durduramıyorum 😩💦"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_sw",
      "name": "Squirt Woter",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "squirt woter"
      ],
      "reply": [
        "Fışkırdım! 😳💦💦",
        "Seni ıslattım 🙈💦",
        "Kontrol edemiyorum… 🌊😩",
        "Bir daha yap, bir daha fışkırtayım 😈💦"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_dm",
      "name": "Drops Milk",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "drops milk"
      ],
      "reply": [
        "Göğüslerimden birkaç damla süt 🍼🙈",
        "Bak, damlıyor 😳🍼",
        "Tadına bakmak ister misin? 😏🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_lm",
      "name": "Low-volume Milk",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "low volume milk"
      ],
      "reply": [
        "Biraz süt geliyor 🍼",
        "Göğüslerim nemlendi 🙈🍼",
        "Emersen daha çok gelir 😏🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_nm",
      "name": "Normal Milk",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "normal milk"
      ],
      "reply": [
        "Göğüslerim süt doldu 🍼",
        "Sıcacık süt akıyor 😩🍼",
        "Emzirmek gibi… ama sana 😈🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_hm",
      "name": "High-volume Milk",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "high volume milk"
      ],
      "reply": [
        "Göğüslerimden süt akıyor, durmuyor 😳🍼",
        "Her yer süt 🍼💦",
        "Ağırlaştı göğüslerim, boşalt beni 🥺🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    },
    {
      "id": "r_fl2_sm",
      "name": "Squirt Milk",
      "category": "💦 Onun sıvısı",
      "when": [
        "=evt",
        "=lactation",
        "squirt milk"
      ],
      "reply": [
        "Süt fışkırdı! 😳🍼💦",
        "Göğüslerimden fışkırıyor 😩🍼",
        "Yüzüne geldi mi? 🙈🍼",
        "Bu kadarını beklemiyordum 😵‍💫🍼"
      ],
      "traits": [],
      "chars": [],
      "note": "Lactation olayı elle yazılınca"
    }
  ],
  "addons": [
    {
      "id": "a_sev_kalp",
      "name": "Sevmek → kalp",
      "category": "Emoji",
      "when": [
        "+sevmek"
      ],
      "add": [
        "❤️",
        "💕",
        "🥰"
      ],
      "mode": "append",
      "chance": 80,
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "a_utangac_emoji",
      "name": "Utangaç",
      "category": "Kişilik",
      "when": [
        "+sikmek"
      ],
      "add": [
        "🙈",
        "😳"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [
        "Utangaç"
      ],
      "chars": [],
      "note": "Kelime yok: utangaç karakterin her mesajına %25 ihtimalle"
    },
    {
      "id": "r_mv8eb6smybhw",
      "name": "Flörtöz",
      "category": "Kişilik",
      "when": [
        "+sikmek"
      ],
      "add": [
        "💋",
        "❤️‍🔥"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [
        "Flörtöz"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_mv8exp4glcg7",
      "name": "Romantik",
      "category": "Kişilik",
      "when": [
        "+sikmek"
      ],
      "add": [
        "💞",
        "🩷"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [
        "Romantik"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_mv8f1dvs2f3m",
      "name": "Olgun",
      "category": "Kişilik",
      "when": [
        "+sikmek"
      ],
      "add": [
        "🥰",
        "😘"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [
        "olgun"
      ],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_mv8f990qgrzc",
      "name": "Sertçe",
      "category": "Ek mesaj",
      "when": [
        "sertçe"
      ],
      "add": [
        "aahhh",
        "offfff",
        "çok iyiii"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_mv8fepg034qt",
      "name": "Şap şap",
      "category": "Ek mesaj",
      "when": [
        "şap",
        "şap"
      ],
      "add": [
        "sesler yükseliyo of"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_mv8g5w5r2prc",
      "name": "Vurdurt",
      "category": "Ek mesaj",
      "when": [
        "+vurdurtmak"
      ],
      "add": [
        "ahh acıyo yavaş",
        "ahhhh ağrıdı"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [],
      "chars": [],
      "note": ""
    },
    {
      "id": "r_mv8gaj8hfekn",
      "name": "Şaplak",
      "category": "Ek mesaj",
      "when": [
        "+şaplak atmak"
      ],
      "add": [
        "kızardı offf"
      ],
      "mode": "append",
      "chance": 100,
      "traits": [],
      "chars": [],
      "note": ""
    }
  ],
  "groups": [
    {
      "name": "selam",
      "words": [
        "selam",
        "merhaba",
        "slm",
        "hey",
        "günaydın",
        "iyi akşamlar"
      ]
    },
    {
      "name": "nasilsin",
      "words": [
        "nasılsın",
        "naber",
        "ne haber",
        "nasıl gidiyor",
        "iyi misin"
      ]
    },
    {
      "name": "icecek",
      "words": [
        "kahve",
        "çay",
        "latte",
        "espresso"
      ]
    },
    {
      "name": "sevgi",
      "words": [
        "+sevmek",
        "aşık",
        "canım",
        "bebeğim",
        "aşkım"
      ]
    }
  ],
  "verbs": [
    {
      "verb": "yapmak",
      "stems": [
        "yap"
      ]
    },
    {
      "verb": "gelmek",
      "stems": [
        "gel"
      ]
    },
    {
      "verb": "gitmek",
      "stems": [
        "git",
        "gid"
      ]
    },
    {
      "verb": "etmek",
      "stems": [
        "etm",
        "ett",
        "eti",
        "ede",
        "edi",
        "eder",
        "edec",
        "edeb"
      ]
    },
    {
      "verb": "demek",
      "stems": [
        "diyor",
        "dedi",
        "demek",
        "derim",
        "dersin",
        "dese",
        "deme"
      ]
    },
    {
      "verb": "yemek",
      "stems": [
        "yiyor",
        "yedi",
        "yerim",
        "yersin",
        "yiyece",
        "yiyeli",
        "yese"
      ]
    },
    {
      "verb": "olmak",
      "stems": [
        "olu",
        "oldu",
        "olm",
        "olur",
        "olaca",
        "olsa",
        "olsun",
        "olabil"
      ]
    },
    {
      "verb": "sevmek",
      "stems": [
        "sev"
      ]
    },
    {
      "verb": "istemek",
      "stems": [
        "iste",
        "isti"
      ]
    },
    {
      "verb": "bilmek",
      "stems": [
        "bil"
      ]
    },
    {
      "verb": "görmek",
      "stems": [
        "gör"
      ]
    },
    {
      "verb": "bakmak",
      "stems": [
        "bak"
      ]
    },
    {
      "verb": "konuşmak",
      "stems": [
        "konuş"
      ]
    },
    {
      "verb": "anlamak",
      "stems": [
        "anla",
        "anlı"
      ]
    },
    {
      "verb": "anlatmak",
      "stems": [
        "anlat"
      ]
    },
    {
      "verb": "söylemek",
      "stems": [
        "söyle",
        "söyli"
      ]
    },
    {
      "verb": "sormak",
      "stems": [
        "sor"
      ]
    },
    {
      "verb": "beklemek",
      "stems": [
        "bekle",
        "bekli"
      ]
    },
    {
      "verb": "özlemek",
      "stems": [
        "özle",
        "özli"
      ]
    },
    {
      "verb": "düşünmek",
      "stems": [
        "düşün"
      ]
    },
    {
      "verb": "hissetmek",
      "stems": [
        "hisset",
        "hissed"
      ]
    },
    {
      "verb": "uyumak",
      "stems": [
        "uyu"
      ]
    },
    {
      "verb": "uyanmak",
      "stems": [
        "uyan"
      ]
    },
    {
      "verb": "içmek",
      "stems": [
        "iç"
      ]
    },
    {
      "verb": "okumak",
      "stems": [
        "oku"
      ]
    },
    {
      "verb": "yazmak",
      "stems": [
        "yaz"
      ]
    },
    {
      "verb": "çalışmak",
      "stems": [
        "çalış"
      ]
    },
    {
      "verb": "oynamak",
      "stems": [
        "oyna",
        "oyni"
      ]
    },
    {
      "verb": "gülmek",
      "stems": [
        "gül"
      ]
    },
    {
      "verb": "ağlamak",
      "stems": [
        "ağla",
        "ağlı"
      ]
    },
    {
      "verb": "kızmak",
      "stems": [
        "kızdı",
        "kızıyor",
        "kızma",
        "kızar",
        "kızgın"
      ]
    },
    {
      "verb": "korkmak",
      "stems": [
        "kork"
      ]
    },
    {
      "verb": "vermek",
      "stems": [
        "ver"
      ]
    },
    {
      "verb": "almak",
      "stems": [
        "alıyor",
        "aldı",
        "alır",
        "alaca",
        "almak",
        "alsa",
        "alabil"
      ]
    },
    {
      "verb": "çıkmak",
      "stems": [
        "çık"
      ]
    },
    {
      "verb": "girmek",
      "stems": [
        "gir"
      ]
    },
    {
      "verb": "kalmak",
      "stems": [
        "kal"
      ]
    },
    {
      "verb": "dönmek",
      "stems": [
        "dön"
      ]
    },
    {
      "verb": "beğenmek",
      "stems": [
        "beğen"
      ]
    },
    {
      "verb": "sarılmak",
      "stems": [
        "sarıl"
      ]
    },
    {
      "verb": "öpmek",
      "stems": [
        "öp"
      ]
    },
    {
      "verb": "dokunmak",
      "stems": [
        "dokun"
      ]
    },
    {
      "verb": "yatmak",
      "stems": [
        "yat"
      ]
    },
    {
      "verb": "buluşmak",
      "stems": [
        "buluş"
      ]
    },
    {
      "verb": "görüşmek",
      "stems": [
        "görüş"
      ]
    },
    {
      "verb": "tanışmak",
      "stems": [
        "tanış"
      ]
    },
    {
      "verb": "unutmak",
      "stems": [
        "unut"
      ]
    },
    {
      "verb": "hatırlamak",
      "stems": [
        "hatırla",
        "hatırlı"
      ]
    },
    {
      "verb": "inanmak",
      "stems": [
        "inan"
      ]
    },
    {
      "verb": "güvenmek",
      "stems": [
        "güven"
      ]
    },
    {
      "verb": "kıskanmak",
      "stems": [
        "kıskan"
      ]
    },
    {
      "verb": "utanmak",
      "stems": [
        "utan"
      ]
    },
    {
      "verb": "yorulmak",
      "stems": [
        "yorul",
        "yorgun"
      ]
    },
    {
      "verb": "acıkmak",
      "stems": [
        "acık"
      ]
    },
    {
      "verb": "affetmek",
      "stems": [
        "affet",
        "affed"
      ]
    },
    {
      "verb": "yardım etmek",
      "stems": [
        "yardım"
      ]
    },
    {
      "verb": "sikmek",
      "stems": [
        "sik",
        "sok",
        "kök",
        "pompa"
      ]
    },
    {
      "verb": "ağlatmak",
      "stems": [
        "ağlat"
      ]
    },
    {
      "verb": "sızlatmak",
      "stems": [
        "sızlat"
      ]
    },
    {
      "verb": "vurdurtmak",
      "stems": [
        "vurdurt",
        "vurdur",
        "vur"
      ]
    },
    {
      "verb": "şaplak atmak",
      "stems": [
        "şaplak at"
      ]
    }
  ]
};
