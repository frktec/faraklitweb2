# Faraklit — Teknoloji Demosu Web Sitesi · bolt.new Brief'i

Bu dosya bolt.new'e verilecek **tek kaynaktır**. İçinde marka kimliği, sayfa
yapısı, birebir yapıştırılacak Türkçe metinler ve hazır prompt var.
Ekran görüntüleri `ekran-goruntuleri/`, logo dosyaları `marka/` klasöründe.

> **Önemli:** Ekran görüntülerindeki bütün müvekkil adları, dosya numaraları,
> mahkeme kayıtları ve içtihat künyeleri **kurgusaldır**. Gerçek büro verisi
> kullanılmadı. Sitede "örnek veriyle hazırlanmış demo görselleri" ibaresi
> bulunmalı.

---

## 1. Ürün nedir?

**Faraklit**, Türkiye'deki hukuk büroları için geliştirilen bir **masaüstü
hukuk işletim sistemi**dir. Tarayıcı sekmesinde çalışan bir SaaS değil;
Tauri + Rust ile derlenmiş, verisi öncelikle **kendi bilgisayarınızda**
duran yerel bir uygulamadır.

Üç iş birden yapar:

1. **Büro yönetimi** — müvekkil, dosya, duruşma, görev, evrak, finans
2. **Adlî entegrasyon** — UYAP evrak akışı, UETS e-tebligat, süre takibi
3. **Hukukî yapay zekâ** — içtihat arama, emsal tarama, dilekçe taslağı

### Rakiplerden farkı (sitenin ana argümanı)

| | Klasik büro yazılımı | Faraklit |
|---|---|---|
| Veri nerede | Sağlayıcının bulutunda | Avukatın bilgisayarında, yedeği yurt içinde |
| İçtihat | Ayrı abonelik, ayrı ekran | Uygulamanın içinde, dosyaya bağlı |
| Yapay zekâ | Genel sohbet kutusu | Dosya bağlamını okuyan, kaynak gösteren katman |
| Çevrimdışı | Çalışmaz | Yerel korpus ve yerel veritabanıyla çalışır |

---

## 2. Marka kimliği

### Renkler (uygulamanın gerçek jetonları)

**Açık tema**
```
--navy            #0B163A   /* ana vurgu, logodan piksel ölçümü */
--navy-2          #16255C   /* hover, ikincil */
--bg              #EEF1F6
--bg-deep         #E3E8F0
--surface         #FFFFFF
--surface-2       #F6F8FB
--surface-3       #EAEFF6
--line            rgba(11,22,58,.14)
--text            #0F1B33
--text-soft       #2C3A53
--muted           #5A6A83
--green           #1C7A4F
--blue            #1C5F95
--red             #A32B43
--shadow          0 22px 58px rgba(11,22,58,.16)
```

**Koyu tema**
```
--vurgu           #8FB4E8
--bg              #07142B
--bg-deep         #040D1E
--surface         #0F1E39
--surface-2       #142443
--line            rgba(150,180,220,.14)
--text            #EEF3FA
--text-soft       #C3D2E6
--muted           #8B9CB5
--green           #3FAE76
--blue            #5AA2E0
--red             #E0637C
```

Sayfa arka planı düz renk değil, hafif bir ışıma:
```css
background:
  radial-gradient(circle at 52% -15%, rgba(11,22,58,.07), transparent 42%),
  linear-gradient(145deg, #f4f7fb, #e9eef5);
```

### Tipografi (üçü de Google Fonts)

- **Başlıklar:** `EB Garamond`, serif — uygulamadaki ekran başlıkları bu.
- **Logo / kurumsal vurgu:** `Cinzel`, serif — yalnızca çok kısa metinlerde.
- **Gövde ve arayüz:** `Inter`, sans-serif.

```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
```

### Logo

`marka/faraklit-wordmark-navy.png` — açık zeminde
`marka/faraklit-wordmark-white.png` — koyu zeminde
`marka/faraklit-logo-onyukleme.png` — terazi amblemi, kare kullanım
`marka/faraklit-adliye.webp` — adliye binası, giriş bölümü arka planı (çok
düşük opaklıkta, navy bindirmenin altında)

Slogan: **"Hukukun dijital çözüm ortağı"** · alt satır: `for legal`

### Ton

Ağırbaşlı, kurumsal, abartısız. Emoji yok. "Devrim", "çığır", "yapay zekâ
sihri" gibi ifadeler yok. Avukat, iddiayı kanıtla ister — her başlık somut
bir işi anlatsın.

---

## 3. Sayfa yapısı ve birebir metinler

Tek sayfa (one-page), yukarıdan aşağı akan bölümler. Yapışkan üst menü.

### 3.1 Üst menü (sticky)

Logo (wordmark-navy) · **Özellikler** · **Yapay Zekâ** · **Güvenlik** ·
**Ekran Görüntüleri** · **SSS** → sağda birincil düğme: **Demo Talep Et**

Kaydırınca menü zemini şeffaftan `#FFFFFF` + alt çizgiye dönüşsün.

### 3.2 Giriş bölümü (hero)

> **Üst etiket:** TÜRKİYE'DEKİ HUKUK BÜROLARI İÇİN
>
> **H1:** Büronun tamamı tek bir masaüstü uygulamasında
>
> **Alt metin:** Faraklit; dosya yönetimini, UYAP ve UETS akışını, içtihat
> araştırmasını ve dilekçe hazırlığını tek ekranda birleştirir. Veriniz
> sizin bilgisayarınızda kalır, yedeği yurt içinde durur.
>
> **Birincil düğme:** Demo Talep Et
> **İkincil düğme:** Nasıl çalıştığını gör

**Görsel:** `ekran-goruntuleri/02-genel-bakis.png` — hafif perspektifle
(`transform: perspective(1600px) rotateY(-6deg) rotateX(2deg)`), altında
büyük yumuşak gölge, üstünde ince navy çerçeve.

Hero'nun altında ince bir güven şeridi:

> Yerel veritabanı · KVKK uyumlu yurt içi yedekleme · Çevrimdışı çalışır ·
> Rol bazlı yetkilendirme · Tam denetim izi

### 3.3 Sorun bölümü — "Bugün bir avukatın günü"

Üç kolon, her biri kısa:

1. **Dört ayrı pencere**
   UYAP bir sekmede, UETS başka bir sekmede, içtihat üçüncü abonelikte,
   büro yazılımı dördüncü ekranda. Aynı dosya dört yerde ayrı ayrı aranıyor.

2. **Süreler insan hafızasında**
   Tebligat geldi, süre başladı. Takvime yazılmazsa hiçbir yerde yazmıyor.
   Kaçan bir istinaf süresi geri gelmiyor.

3. **Emsal aramak ayrı bir mesai**
   "Haklı nedenle fesih" yazınca 360 bin karar dönüyor; ilk sayfada konuyla
   ilgisi olmayan daireler var. Doğru kararı bulmak aramanın kendisinden
   uzun sürüyor.

### 3.4 Özellikler — modül modül

Her modül: sol tarafta metin, sağ tarafta ekran görüntüsü; sırayla yön
değiştirsin (zigzag).

---

**MODÜL 1 — Genel Bakış**
Görsel: `02-genel-bakis.png`

> **Başlık:** Günün ilk beş dakikası
>
> Uygulama açılır açılmaz bugünkü duruşmalar, süresi işleyen işler,
> gelen tebligatlar ve tahsilat durumu tek ekranda. Öncelik Merkezi işleri
> kalan süreye göre sıralar; en yakın süre en üstte durur.
>
> - Bugünkü duruşma akışı, saatiyle ve mahkemesiyle
> - Kritik işler ve kalan gün sayısı
> - Posta kutusu ve Resmî Gazete özeti
> - Dört tema: Aydınlık · Koyu Lacivert · Bordo · Sessiz Lüks

---

**MODÜL 2 — Dosya Yönetim Merkezi**
Görsel: `04-dosya-yonetim-merkezi.png`

> **Başlık:** Binlerce dosya, tek liste
>
> Her dosyanın bir **sağlık puanı** var: yaklaşan süre, işlem görmeyen gün
> sayısı, sorumlu ataması ve UYAP bağlantısı birlikte değerlendirilir.
> Dikkat isteyen dosya listenin dibinde kaybolmaz.
>
> - Mahkeme, esas no, müvekkil veya karşı tarafa göre anlık arama
> - Sağlık durumu, sorumlu ve son işleme göre filtre ve gruplama
> - UYAP bağlantısı olmayan dosyaların ayrı işareti
> - Yan panelde dosya özeti: taraflar, tür, yaklaşan işlem, son hareket

---

**MODÜL 3 — UETS e-Tebligat Merkezi**
Görsel: `06-uets-tebligat-merkezi.png`

> **Başlık:** Tebligat geldiği anda süre başlar
>
> UETS listesi Excel veya CSV olarak içe aktarılır; her tebligat barkoduyla
> tekilleştirilir, ilgili dosyaya bağlanır ve süresi hesaplanıp göreve
> çevrilir. Bağlanmamış tebligat listede kırmızı durur.
>
> - Mükerrer tebligat barkod üzerinden elenir
> - Kalan gün sayacı; kritik süre ayrı renkte
> - Tebligattan tek tıkla görev üretme
> - Dosyaya bağlanmamış kayıtların ayrı sekmesi

---

**MODÜL 4 — Belge Merkezi**
Görsel: `13-belge-merkezi.png`

> **Başlık:** UDF, PDF, DOCX — hepsi aynı yerde
>
> UYAP'ın UDF dosyaları uygulamanın içinde açılır; taranmış evraklar için
> yerel OCR çalışır, metin aranabilir hâle gelir. Her evrak müvekkile ve
> dosyaya bağlıdır, aslı hiç değiştirilmez.
>
> - UDF okuma ve yazma, PDF ve DOCX önizleme
> - Cihazda çalışan OCR — belge dışarı çıkmaz
> - Bulut ve yerel kopya durumu her satırda görünür
> - Aslı korunur, düzenlenebilir çalışma kopyası ayrı tutulur

---

**MODÜL 5 — İçtihat Arama**
Görsel: `05-ictihat-arama.png`

> **Başlık:** 360 bin karar değil, işinize yarayan kırk karar
>
> Doğal dille yazdığınız soru hukukî terimlere çevrilir, ilgili daire
> seçilir ve arama daraltılır. Dönen kararların metni okunur, sorunuzu
> cevaplayan **pasaj** bulunur ve kararlar bu pasajın kalitesine göre
> sıralanır — tarihe göre değil.
>
> - On iki resmî kaynak: Yargıtay, Danıştay, Emsal, AYM, Uyuşmazlık,
>   Sayıştay, KVKK, Rekabet Kurumu, KİK, BDDK, BTK, GİB Özelge
> - Her karar için eşleşme yüzdesi ve eşleşen pasaj
> - Görüş grupları: lehe, aleyhe, ayrıştıran kararlar ayrı ayrı
> - Bulduğunuz kararı doğrudan dosyaya ve dilekçeye ekleme

---

**MODÜL 6 — Yapay Zekâ Araştırma**
Görsel: `10-ai-arastirma.png`

> **Başlık:** Soruyu sorun, kaynağıyla cevap alın
>
> Faraklit'in araştırma ekranı genel bir sohbet kutusu değildir: müvekkili
> ve dosyayı bilir, cevabını bulduğu kararlara dayandırır ve dilekçe
> taslağını o kaynaklarla üretir.
>
> - Derin araştırma: soru → emsal tarama → gerekçeli cevap
> - Dilekçe taslağı, kullandığı kararların künyesiyle birlikte
> - Cerrahi yama: taslağın yalnızca istediğiniz paragrafını değiştirir
> - Dilekçe değerlendirme: eksik unsurları ve zayıf gerekçeleri işaretler
> - Her istek için harcanan jeton ve maliyet ayrı panelde ölçülür

---

**MODÜL 7 — Finans ve Cari**
Görsel: `12-finans-cari.png`

> **Başlık:** Vekâlet ücreti, masraf, tahsilat
>
> Her müvekkilin cari hesabı, dosyalarıyla birlikte. Geciken tahsilat ayrı
> renkte, açık alacak toplamı üstte.
>
> - Finans 360: tek müvekkilin bütün hareketleri tek panelde
> - Tahsilat, gider ve masraf avansı ayrı ayrı
> - Tutar görme yetkisi role bağlı — herkes rakamı görmez

---

**MODÜL 8 — Komuta Merkezi ve Raporlar**
Görseller: `07-komuta-merkezi.png`, `08-istatistik-raporlar.png`

> **Başlık:** Büro nerede duruyor?
>
> Risk ve süre haritası kritik olanı öne çıkarır; istatistik ekranı süreleri,
> dosya sağlığını, duruşma yoğunluğunu ve finansal görünümü tek merkezde
> toplar.
>
> - Kritik ve gecikmiş işler tek listede
> - Mahkeme türüne göre duruşma yoğunluğu
> - Tahsilat ve gider eğrisi
> - Kişi kıyaslaması yapmadan büro iş akışı

---

### 3.5 Güvenlik ve veri bölümü (koyu zemin)

Zemin `#07142B`, metin `#EEF3FA`, vurgu `#8FB4E8`.

> **Başlık:** Müvekkil verisi büronun dışına çıkmaz
>
> Dört madde, ikonlu:
>
> 1. **Yerel öncelikli mimari**
>    Uygulama Tauri ve Rust ile derlenir, veritabanı SQLite olarak sizin
>    diskinizde durur. İnternet olmadan da açılır ve çalışır.
>
> 2. **Yurt içi yedekleme**
>    Evrak dosyaları yurt içindeki nesne depolamada tutulur. Yurt dışına
>    veri aktarımı gerektirmeyen bir kurulum.
>
> 3. **Rol bazlı yetki ve denetim izi**
>    Kim hangi dosyayı açtı, hangi evrakı indirdi, hangi tutarı gördü —
>    hepsi kayıt altında. Yetkisi olmayan ekranı boş değil, gerekçesiyle
>    kapalı görür.
>
> 4. **Cihazda çalışan OCR ve metin işleme**
>    Taranmış evrakın metne çevrilmesi bilgisayarda olur; belge bu iş için
>    hiçbir servise gönderilmez.

Altına küçük bir not:

> Yapay zekâ özellikleri için gönderilen metin, yalnızca sorunuzun
> gerektirdiği bölümdür ve hangi bilginin gittiği kullanım panelinde
> görünür.

### 3.6 Ekran görüntüleri galerisi

Sekmeli galeri. Sekmeler: **Genel Bakış · Dosyalar · UETS · İçtihat ·
Yapay Zekâ · Finans**. Seçilen sekmenin görseli büyük gösterilsin, altında
tek satır açıklama. Tıklayınca tam ekran açılan hafif bir lightbox.

Koyu tema kanıtı için `03-genel-bakis-koyu-tema.png` ayrı bir "Aydınlık /
Koyu" ikili karşılaştırmasında kullanılsın (sürgülü karşılaştırma ya da yan
yana iki görsel).

### 3.7 Teknoloji şeridi

Küçük, sade rozetler hâlinde:

`Tauri 2` · `Rust` · `SQLite` · `Model Context Protocol` · `Yerel OCR` ·
`UDF / PDF / DOCX` · `Windows`

Yanına tek cümle:

> Faraklit bir web sitesi değil, imzalı bir Windows uygulamasıdır; arayüzü
> web teknolojileriyle çizilir, işi Rust yapar.

### 3.8 SSS

1. **Verilerim nerede tutuluyor?**
   Birincil veritabanı sizin bilgisayarınızda. Yedek ve evrak dosyaları
   yurt içindeki depolamada. Yurt dışına veri aktarımı gerekmez.

2. **İnternet olmadan çalışır mı?**
   Evet. Dosya, duruşma, görev, evrak ve yerel içtihat araması çevrimdışı
   çalışır. UYAP, UETS ve yapay zekâ özellikleri bağlantı ister.

3. **UYAP ile nasıl konuşuyor?**
   Faraklit UYAP'ın yerine geçmez; evrak indirme ve dosya eşleme akışını
   düzenler, indirilen evrakı doğru dosyaya bağlar ve süresini üretir.

4. **Yapay zekâ uydurma karar üretir mi?**
   Araştırma katmanı cevabını yalnızca gerçekten getirdiği karar
   metinlerine dayandırır ve her iddianın yanında künyeyi gösterir.
   Metni gelmeyen karar için atıf yapılmaz.

5. **Kaç kullanıcı bağlanabilir?**
   Bireysel ve kurumsal iki kurulum var. Kurumsal kurulumda ekip üyeleri
   rolleriyle tanımlanır, aynı dosyada eş zamanlı çalışma kilitle yönetilir.

6. **Kurulum ne kadar sürüyor?**
   Tek kurulum dosyası. Mevcut müvekkil ve dosya listesi Excel'den içe
   aktarılabilir.

### 3.9 Kapanış çağrısı

> **Başlık:** Büronuzda görelim
>
> Faraklit'i kendi dosyalarınızla denemek için kısa bir demo planlayalım.
>
> Form alanları: Ad Soyad · Büro adı · E-posta · Telefon · Avukat sayısı
> (1 / 2–5 / 6–20 / 20+) · Mesaj
> Düğme: **Demo Talep Et**
>
> Form altı notu: Bilgileriniz yalnızca demo planlaması için kullanılır.

### 3.10 Alt bilgi

Logo · kısa tanım · bölüm bağlantıları · `© 2026 Faraklit Legal OS` ·
KVKK Aydınlatma Metni ve Gizlilik bağlantıları (şimdilik `#`).

---

## 4. Ekran görüntüsü haritası

| Dosya | Ekran | Nerede kullanılacak |
|---|---|---|
| `01-giris-ekrani.png` | Giriş / oturum açma | Güvenlik bölümü, küçük görsel |
| `02-genel-bakis.png` | Genel Bakış | **Hero** ve Modül 1 |
| `03-genel-bakis-koyu-tema.png` | Genel Bakış, koyu tema | Tema karşılaştırması |
| `04-dosya-yonetim-merkezi.png` | Dosya listesi | Modül 2 |
| `05-ictihat-arama.png` | İçtihat arama sonuçları | Modül 5 |
| `06-uets-tebligat-merkezi.png` | UETS listesi | Modül 3 |
| `07-komuta-merkezi.png` | Komuta Merkezi | Modül 9 |
| `08-istatistik-raporlar.png` | İstatistikler | Modül 9 |
| `09-durusma-listesi.png` | Duruşma listesi | Galeri |
| `10-ai-arastirma.png` | Yapay zekâ araştırma girişi | Modül 6 |
| `12-finans-cari.png` | Finans ve cari | Modül 7 |
| `13-belge-merkezi.png` | Belge Merkezi | Modül 4 |

Hepsi PNG, 3200×2000 (2× retina). Sitede `max-width` ile küçültülecek;
`loading="lazy"` ve `alt` metni Türkçe olacak.

---

## 5. Teknik kurallar (bolt.new'e)

- **Yığın:** React + Vite + TypeScript, Tailwind CSS. Ek UI kütüphanesi yok.
- **Tek sayfa**, bölüm bağlantıları `#id` ile kaydırır (`scroll-behavior: smooth`).
- **Dil:** Bütün metinler Türkçe. Türkçe karakterler doğru kullanılacak
  (İ/ı ayrımı dâhil).
- **Koyu tema:** `prefers-color-scheme` ile otomatik + üst menüde el ile
  değiştirme düğmesi. Renkler yukarıdaki iki jeton kümesinden.
- **Duyarlı:** 1440 / 1024 / 768 / 375. Mobilde menü hamburger, ekran
  görüntüleri yatay kaydırmalı şerit.
- **Hareket:** Yalnızca görünüre girince yumuşak `fade + translateY(12px)`.
  Paralaks yok, otomatik oynayan video yok, sayfa yükünü artıran süsleme yok.
  `prefers-reduced-motion` saygı görecek.
- **Erişilebilirlik:** Kontrast en az 4.5:1, klavyeyle gezinilebilir,
  görsellerde `alt`, formda `label`.
- **Performans:** Görseller `loading="lazy"`, hero görseli `fetchpriority="high"`.
- **Form:** Şimdilik yalnızca istemci tarafı doğrulama ve bir teşekkür
  mesajı; arka uç bağlanmayacak.

---

## 6. Kopyala–yapıştır prompt

Aşağıdaki metni bolt.new'e olduğu gibi yapıştır, ardından
`ekran-goruntuleri/` ve `marka/` klasörlerini yükle.

---

```
Türkiye'deki hukuk büroları için geliştirilen "Faraklit" adlı masaüstü hukuk
yazılımının tanıtım sitesini yap. React + Vite + TypeScript + Tailwind CSS
kullan, tek sayfa olsun, bütün metinler Türkçe.

MARKA
Ana renk navy #0B163A, hover #16255C. Açık tema: zemin #EEF1F6, kart #FFFFFF,
ikincil yüzey #F6F8FB, çizgi rgba(11,22,58,.14), metin #0F1B33, yumuşak metin
#2C3A53, soluk #5A6A83. Yeşil #1C7A4F, mavi #1C5F95, kırmızı #A32B43.
Koyu tema: vurgu #8FB4E8, zemin #07142B, derin zemin #040D1E, kart #0F1E39,
ikincil #142443, metin #EEF3FA, yumuşak #C3D2E6, soluk #8B9CB5, yeşil #3FAE76,
mavi #5AA2E0, kırmızı #E0637C.
Sayfa zemini düz değil: radial-gradient(circle at 52% -15%, rgba(11,22,58,.07),
transparent 42%) + linear-gradient(145deg,#f4f7fb,#e9eef5).
Gölge: 0 22px 58px rgba(11,22,58,.16).
Yazı tipleri Google Fonts: başlıklar "EB Garamond" serif, gövde "Inter",
logo vurgusu "Cinzel". Logo dosyası yüklediğim faraklit-wordmark-navy.png
(koyu zeminde faraklit-wordmark-white.png). Slogan: "Hukukun dijital çözüm
ortağı".

ÜSLUP
Ağırbaşlı, kurumsal, abartısız. Emoji yok, süslü pazarlama dili yok. Her
başlık somut bir işi anlatsın. Bol beyaz alan, ince çizgiler, yumuşak gölge.

BÖLÜMLER (sırayla)
1. Yapışkan üst menü: logo, Özellikler / Yapay Zekâ / Güvenlik / Ekran
   Görüntüleri / SSS bağlantıları, sağda "Demo Talep Et" düğmesi, tema
   değiştirme düğmesi. Kaydırınca beyaz zemin ve alt çizgi kazansın.
2. Hero: üst etiket "TÜRKİYE'DEKİ HUKUK BÜROLARI İÇİN", H1 "Büronun tamamı
   tek bir masaüstü uygulamasında", alt metin "Faraklit; dosya yönetimini,
   UYAP ve UETS akışını, içtihat araştırmasını ve dilekçe hazırlığını tek
   ekranda birleştirir. Veriniz sizin bilgisayarınızda kalır, yedeği yurt
   içinde durur." İki düğme: "Demo Talep Et" ve "Nasıl çalıştığını gör".
   Sağda 02-genel-bakis.png hafif perspektifle, büyük yumuşak gölgeyle.
   Altında ince güven şeridi: "Yerel veritabanı · KVKK uyumlu yurt içi
   yedekleme · Çevrimdışı çalışır · Rol bazlı yetkilendirme · Tam denetim izi".
3. Sorun bölümü: üç kolon — "Dört ayrı pencere", "Süreler insan hafızasında",
   "Emsal aramak ayrı bir mesai".
4. Sekiz özellik bölümü, zigzag düzende (metin solda/görsel sağda, sonra
   ters). Sırasıyla: Genel Bakış (02), Dosya Yönetim Merkezi (04), UETS
   e-Tebligat Merkezi (06), Belge Merkezi (13), İçtihat Arama (05), Yapay
   Zekâ Araştırma (10), Finans ve Cari (12), Komuta Merkezi ve Raporlar
   (07 + 08). Her bölümde başlık, iki cümlelik açıklama ve üç dört maddelik
   liste.
5. Güvenlik bölümü koyu zeminde (#07142B): dört madde — yerel öncelikli
   mimari, yurt içi yedekleme, rol bazlı yetki ve denetim izi, cihazda
   çalışan OCR.
6. Ekran görüntüsü galerisi: sekmeli (Genel Bakış / Dosyalar / UETS /
   İçtihat / Yapay Zekâ / Finans), seçilen görsel büyük, tıklayınca
   lightbox. Ayrıca aydınlık–koyu tema karşılaştırması (02 ve 03).
7. Teknoloji şeridi: Tauri 2, Rust, SQLite, Model Context Protocol, Yerel
   OCR, UDF/PDF/DOCX, Windows rozetleri.
8. SSS: altı soruluk akordeon.
9. Kapanış: "Büronuzda görelim" başlığı ve demo talep formu (ad soyad, büro
   adı, e-posta, telefon, avukat sayısı seçimi, mesaj). Yalnızca istemci
   tarafı doğrulama, gönderince teşekkür mesajı.
10. Alt bilgi: logo, kısa tanım, bağlantılar, "© 2026 Faraklit Legal OS".

TEKNİK
Koyu tema prefers-color-scheme ile otomatik, üstten el ile değiştirilebilir.
1440/1024/768/375 kırılımlarında düzgün çalışsın; mobilde menü hamburger,
görseller yatay kaydırmalı şerit olsun. Animasyon yalnızca görünüre girince
fade + translateY(12px); prefers-reduced-motion saygı görsün. Görsellerde
Türkçe alt metni ve loading="lazy" olsun, hero görselinde
fetchpriority="high". Kontrast en az 4.5:1, klavyeyle gezinilebilir olsun.

NOT
Ekran görüntülerindeki bütün isimler ve dosya numaraları kurgusaldır.
Galerinin altına küçük punto ile "Görseller örnek veriyle hazırlanmış demo
ekranlarıdır." notunu koy.
```

---

## 7. Siteye koymadan önce doğrulanması gereken iddialar

Aşağıdaki cümleler metinde geçiyor; hukukî/ticarî sorumluluk doğurabilecekleri
için yayına almadan önce senin teyidin gerekiyor:

- "KVKK uyumlu" ibaresi — barındırma kararı yurt içi yönünde, ancak uyumluluk
  bir kurulum ve sözleşme meselesi. "Yurt içinde barındırma" demek daha
  savunulabilir.
- "Çevrimdışı çalışır" — yerel veritabanı ve yerel korpus için doğru; UYAP,
  UETS ve yapay zekâ için değil. Metinde bu ayrım korunmalı.
- "On iki resmî kaynak" — Yargı MCP'nin kaynak sayısı. Yayın anında listeyi
  bir kez daha doğrula.
- "İmzalı Windows uygulaması" — kod imzalama sertifikası alındıysa doğru.
- Fiyat, kullanıcı sayısı ve müşteri referansı **hiçbir yerde geçmiyor**;
  eklenecekse gerçek rakam olmalı.
