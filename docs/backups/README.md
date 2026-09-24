# Ekran görüntülerini yeniden üretmek

`_demo-tanitim.js`, Tauri arka ucu olmadan çalışan statik sunucuda
Faraklit'i **kurgusal demo veriyle** çizen geçici bir katmandır.
Ekran görüntüleri bununla alındı.

> Bu dosya bilerek `frontend/` içinde **bırakılmadı**: girişi ve yetki
> denetimini devre dışı bırakıyor, `frontend/` ise derlemede binary'ye
> gömülüyor. Yalnızca ekran görüntüsü alırken yerine kopyalanır, iş
> bitince silinir.

## Adımlar

1. Dosyayı yerine koy ve demo sayfasını üret:

```bash
cd C:/Users/msen0/Desktop/faraklit/frontend && cp ../_tanitim-bolt/kaynak/_demo-tanitim.js js/_demo-tanitim.js && python -c "import io; s=io.open('index.html',encoding='utf-8').read(); s=s.replace('</body>','    <script src=\"js/_demo-tanitim.js?v=1\"></script>\n</body>'); io.open('_demo.html','w',encoding='utf-8').write(s)"
```

2. Statik sunucuyu başlat (port 8123):

```bash
npx --yes http-server frontend -p 8123 -c-1
```

3. Ekranları yakala (Chrome headless, 2× retina):

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1600,1000 --virtual-time-budget=16000 --screenshot="C:\Users\msen0\Desktop\faraklit\_tanitim-bolt\ekran-goruntuleri\02-genel-bakis.png" "http://localhost:8123/_demo.html?ekran=dashboard"
```

4. Bitince temizle:

```bash
rm -f C:/Users/msen0/Desktop/faraklit/frontend/_demo.html C:/Users/msen0/Desktop/faraklit/frontend/js/_demo-tanitim.js
```

## URL parametreleri

`_demo.html?ekran=<sekme>&tema=<tema>`

| `ekran` | Ne çizer |
|---|---|
| `dashboard` | Genel Bakış |
| `legaldesk` | Komuta Merkezi |
| `cases` | Dosya Yönetim Merkezi |
| `hearings` | Duruşma Listesi |
| `uets` | UETS e-Tebligat Merkezi |
| `docs` | Belge Merkezi |
| `ictihat` | İçtihat Arama (örnek sonuçlarla dolu) |
| `payments` | Finans ve Cari |
| `stats` | İstatistikler |
| `clients` | Müvekkiller |
| `calendar` | Takvim |
| `notes` | Notlar |
| `mail` | Posta Kutusu |
| `arastirma` | Yapay zekâ araştırma ekranı (tam ekran) |

`tema`: `light` (varsayılan) · `dark` · `archive` (bordo)

## Katmanın yaptıkları

- Giriş ekranını DOM'dan siler, `#app-content`i açar
- `window.state`i kurgusal müvekkil / dosya / duruşma / görev / ödeme /
  evrak / kullanıcı verisiyle doldurur
- Yetki denetimini demo için tam yetkiye sabitler
  (`canAccessTabV23`, `hasPermission`, `isAdmin`)
- Sahte bir `window.__TAURI__` kurar; yalnızca `uets_notifications`
  sorgusuna demo satır döndürür, diğer bütün SQL boş döner
- Karşılama kartını saatten bağımsız sabitler (İyi günler · İstanbul 24°)
- `ekran=ictihat` ise `FaraklitIctihatV91.durum` içine örnek karar
  sonuçları yazıp yeniden çizdirir

## Bilinen sınırlar

- `workspace.html` (çalışma alanı / dilekçe editörü) bu yolla
  açılamıyor: `calisma_alani_baglami_al` Tauri komutunu ve tam şemayı
  istiyor. Onun görüntüsü ancak gerçek uygulamadan alınabilir.
- Yapay zekâ araştırma ekranı **boş giriş** hâlinde yakalanıyor; sohbet
  dolu bir görüntü için gerçek model çağrısı gerekiyor.
