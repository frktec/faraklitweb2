/* GECICI — tanitim ekran goruntusu uretimi icin. Is bitince SILINECEK.
   Tauri arka ucu olmadan calisan statik sunucuda demo veriyle ekran cizer.
   Tum veriler KURGUSAL. */
(function () {
  var P = new URLSearchParams(location.search);
  var EKRAN = P.get("ekran") || "dashboard";
  var TEMA = P.get("tema") || "light";

  function iso(d) { return new Date(d).toISOString().slice(0, 10); }
  var bugun = new Date("2026-08-27T09:00:00");
  function gun(n) { var d = new Date(bugun); d.setDate(d.getDate() + n); return iso(d); }

  var MUVEKKIL = [
    { id: "c1", name: "Demir Yapı Sanayi A.Ş.", tc: "1234567890", phone: "0212 000 00 01", type: "Kurumsal", status: "Aktif", note: "İnşaat taahhüt" },
    { id: "c2", name: "Ayşe Yılmaz", tc: "1234567891", phone: "0532 000 00 02", type: "Bireysel", status: "Aktif", note: "İşçilik alacağı" },
    { id: "c3", name: "Karaca Lojistik Ltd. Şti.", tc: "1234567892", phone: "0216 000 00 03", type: "Kurumsal", status: "Aktif", note: "Nakliye sözleşmeleri" },
    { id: "c4", name: "Mehmet Aydın", tc: "1234567893", phone: "0505 000 00 04", type: "Bireysel", status: "Aktif", note: "Boşanma" },
    { id: "c5", name: "Özkan Gıda Ticaret A.Ş.", tc: "1234567894", phone: "0232 000 00 05", type: "Kurumsal", status: "Aktif", note: "Marka ihlali" },
    { id: "c6", name: "Selin Korkmaz", tc: "1234567895", phone: "0533 000 00 06", type: "Bireysel", status: "Aktif", note: "Kira uyuşmazlığı" }
  ];

  function dosya(o) {
    return Object.assign({
      officeId: "local-office", caseType: "DAVA", courtType: "HUKUK", archiveNo: "",
      status: "Aktif", responsibleUserId: "u1", uyapKey: "", lastUyapSyncAt: bugun.toISOString(),
      lastUyapSyncBy: "Av. Furkan Tunca", subject: "", description: "", openedAt: gun(-180),
      closedAt: "", lastActivityAt: gun(-2), lastActivitySummary: "UYAP üzerinden yeni evrak indirildi",
      healthScore: 92, healthLevel: "GOOD", healthUpdatedAt: gun(-1), nextDeadlineAt: gun(6),
      version: 1, createdAt: gun(-180), updatedAt: gun(-1), updatedBy: "u1"
    }, o);
  }

  var DOSYA = [
    dosya({ id: "d1", clientId: "c2", court: "İstanbul Anadolu 9. İş Mahkemesi", caseNo: "2026/1184", title: "Kıdem ve ihbar tazminatı", opponent: "Beta Tekstil San. Tic. A.Ş.", subject: "İşe iade ve işçilik alacakları", healthScore: 68, healthLevel: "WARNING", nextDeadlineAt: gun(3), lastActivitySummary: "Bilirkişi raporuna itiraz süresi işliyor" }),
    dosya({ id: "d2", clientId: "c1", court: "İstanbul 14. Asliye Ticaret Mahkemesi", caseNo: "2026/0473", title: "Eser sözleşmesinden kaynaklı alacak", opponent: "Poyraz İnşaat Ltd. Şti.", subject: "Hakediş bedelinin tahsili", healthScore: 88, nextDeadlineAt: gun(11) }),
    dosya({ id: "d3", clientId: "c5", court: "İstanbul 2. Fikri ve Sınai Haklar Hukuk Mahkemesi", caseNo: "2026/0217", title: "Marka hakkına tecavüzün önlenmesi", opponent: "Nar Gıda Ltd. Şti.", subject: "Tecavüzün tespiti, meni ve tazminat", healthScore: 95, nextDeadlineAt: gun(19) }),
    dosya({ id: "d4", clientId: "c4", court: "Ankara 7. Aile Mahkemesi", caseNo: "2025/2903", title: "Anlaşmalı boşanma", opponent: "—", subject: "Boşanma ve velayet", healthScore: 74, healthLevel: "WATCH", nextDeadlineAt: gun(8) }),
    dosya({ id: "d5", clientId: "c3", caseType: "İCRA", courtType: "İCRA", court: "İstanbul Anadolu 12. İcra Müdürlüğü", caseNo: "2026/8841", title: "İlamsız takip — 1.480.000 TL", opponent: "Vira Nakliyat Ltd. Şti.", subject: "Fatura alacağının tahsili", healthScore: 81, nextDeadlineAt: gun(5) }),
    dosya({ id: "d6", clientId: "c6", court: "İstanbul 4. Sulh Hukuk Mahkemesi", caseNo: "2026/1526", title: "Kiralananın tahliyesi", opponent: "Hakan Ersoy", subject: "İhtiyaç nedeniyle tahliye", healthScore: 90, nextDeadlineAt: gun(14) })
  ];

  var DURUSMA = [
    { id: "h1", caseId: "d1", clientId: "c2", court: "İstanbul Anadolu 9. İş Mahkemesi", caseNo: "2026/1184", opponent: "Beta Tekstil San. Tic. A.Ş.", date: gun(0), time: "09:40", status: "Planlandı", note: "Bilirkişi raporu tartışılacak" },
    { id: "h2", caseId: "d2", clientId: "c1", court: "İstanbul 14. Asliye Ticaret Mahkemesi", caseNo: "2026/0473", opponent: "Poyraz İnşaat Ltd. Şti.", date: gun(0), time: "11:20", status: "Planlandı", note: "Tanık dinlenecek" },
    { id: "h3", caseId: "d4", clientId: "c4", court: "Ankara 7. Aile Mahkemesi", caseNo: "2025/2903", opponent: "—", date: gun(1), time: "14:00", status: "Planlandı", note: "Protokol sunulacak" },
    { id: "h4", caseId: "d3", clientId: "c5", court: "İstanbul 2. Fikri ve Sınai Haklar Hukuk Mahkemesi", caseNo: "2026/0217", opponent: "Nar Gıda Ltd. Şti.", date: gun(4), time: "10:15", status: "Planlandı", note: "Ön inceleme" },
    { id: "h5", caseId: "d6", clientId: "c6", court: "İstanbul 4. Sulh Hukuk Mahkemesi", caseNo: "2026/1526", opponent: "Hakan Ersoy", date: gun(9), time: "13:30", status: "Planlandı", note: "Keşif talebi" },
    { id: "h6", caseId: "d2", clientId: "c1", court: "İstanbul 14. Asliye Ticaret Mahkemesi", caseNo: "2026/0473", opponent: "Poyraz İnşaat Ltd. Şti.", date: gun(-14), time: "10:00", status: "Yapıldı", note: "Ön inceleme tamamlandı" }
  ];

  var GOREV = [
    { id: "t1", clientId: "c2", title: "Bilirkişi raporuna itiraz dilekçesi — 2026/1184", due: gun(2), priority: "Yüksek", done: false },
    { id: "t2", clientId: "c4", title: "İstinaf başvuru harcı yatırılacak — 2025/2903", due: gun(3), priority: "Yüksek", done: false },
    { id: "t3", clientId: "c1", title: "Hakediş dökümü müvekkilden istenecek", due: gun(5), priority: "Orta", done: false },
    { id: "t4", clientId: "c5", title: "Marka tescil belgeleri dosyaya sunulacak", due: gun(7), priority: "Orta", done: false },
    { id: "t5", clientId: "c3", title: "Haciz talebi hazırlanacak — 2026/8841", due: gun(1), priority: "Yüksek", done: false },
    { id: "t6", clientId: "c6", title: "Müvekkil bilgilendirme yazısı gönderildi", due: gun(-1), priority: "Düşük", done: true }
  ];

  var ODEME = [
    { id: "p1", clientId: "c1", type: "Vekalet Ücreti", amount: 180000, paid: 120000, note: "2. taksit", date: gun(-12) },
    { id: "p2", clientId: "c2", type: "Vekalet Ücreti", amount: 45000, paid: 45000, note: "Peşin", date: gun(-40) },
    { id: "p3", clientId: "c5", type: "Danışmanlık", amount: 96000, paid: 48000, note: "Aylık", date: gun(-8) },
    { id: "p4", clientId: "c3", type: "Masraf Avansı", amount: 32000, paid: 32000, note: "İcra masrafı", date: gun(-3) },
    { id: "p5", clientId: "c6", type: "Vekalet Ücreti", amount: 60000, paid: 20000, note: "1. taksit", date: gun(-20) }
  ];

  function evrak(o) {
    return Object.assign({
      driveLink: "", fileData: "", sizeBytes: 184320, mimeType: "application/pdf",
      cloudStatus: "SYNCED", cacheStatus: "CACHED", sourceKind: "UYAP_IMPORT",
      createdAt: gun(-6) + "T09:00:00", updatedAt: gun(-1) + "T11:30:00", date: gun(-1)
    }, o);
  }

  var EVRAK = [
    evrak({ id: "e1", clientId: "c2", caseId: "d1", title: "Bilirkişi Raporu", type: "UYAP Evrakı", status: "İncelendi", fileName: "bilirkisi-raporu.pdf", updatedAt: gun(-1) + "T10:12:00", sizeBytes: 742400 }),
    evrak({ id: "e2", clientId: "c1", caseId: "d2", title: "Eser Sözleşmesi", type: "Sözleşme", status: "Onaylı", fileName: "eser-sozlesmesi.pdf", sourceKind: "USER_UPLOAD", updatedAt: gun(-3) + "T15:44:00", sizeBytes: 512000 }),
    evrak({ id: "e3", clientId: "c5", caseId: "d3", title: "Marka Tescil Belgesi", type: "Resmî Belge", status: "Onaylı", fileName: "marka-tescil.pdf", sourceKind: "USER_UPLOAD", updatedAt: gun(-5) + "T12:08:00", sizeBytes: 296960 }),
    evrak({ id: "e4", clientId: "c4", caseId: "d4", title: "Anlaşmalı Boşanma Protokolü", type: "Dilekçe", status: "Taslak", fileName: "protokol.udf", mimeType: "application/udf", sourceKind: "USER_UPLOAD", updatedAt: gun(0) + "T08:20:00", sizeBytes: 61440 }),
    evrak({ id: "e5", clientId: "c3", caseId: "d5", title: "Ödeme Emri Tebliğ Şerhi", type: "İcra Evrakı", status: "Tebliğ Edildi", fileName: "odeme-emri.pdf", updatedAt: gun(-2) + "T16:03:00", sizeBytes: 133120 }),
    evrak({ id: "e6", clientId: "c6", caseId: "d6", title: "Tahliye İhtarnamesi", type: "İhtarname", status: "Onaylı", fileName: "ihtarname.pdf", sourceKind: "USER_UPLOAD", updatedAt: gun(-7) + "T13:15:00", sizeBytes: 98304 })
  ];

  var KULLANICI = [
    { id: "u1", name: "Av. Furkan Tunca", role: "TENANT_OWNER", title: "Kurucu Avukat", email: "furkan@ornekhukuk.com", status: "Aktif" },
    { id: "u2", name: "Av. Deniz Aksoy", role: "LAWYER", title: "Avukat", email: "deniz@ornekhukuk.com", status: "Aktif" },
    { id: "u3", name: "Elif Şen", role: "PARALEGAL", title: "Hukuk Sekreteri", email: "elif@ornekhukuk.com", status: "Aktif" }
  ];

  function veriYukle() {
    var S = window.state;
    if (!S) return;
    S.user.id = "u1";
    S.user.name = "Av. Furkan Tunca";
    S.user.title = "Kurucu Avukat";
    S.user.role = "TENANT_OWNER";
    S.user.type = "Kurumsal";
    S.user.permissions = ["uets.view", "case.view_all", "finance.view_amounts",
      "document.view", "client.view", "task.view", "stats.view", "audit.view",
      "user.manage", "communication.send"];
    S.profile = { name: "Tunca Hukuk Bürosu", bar: "İstanbul Barosu · 12345" };
    S.clients = MUVEKKIL;
    S.cases = DOSYA;
    S.hearings = DURUSMA;
    S.tasks = GOREV;
    S.payments = ODEME;
    S.documents = EVRAK;
    S.users = KULLANICI;
    S.auditLogs = [
      { id: "a1", userId: "u1", userName: "Av. Furkan Tunca", action: "DOSYA_GORUNTULE", detail: "2026/1184 açıldı", createdAt: new Date(bugun.getTime() - 36e5).toISOString() },
      { id: "a2", userId: "u2", userName: "Av. Deniz Aksoy", action: "EVRAK_INDIR", detail: "Bilirkişi raporu indirildi", createdAt: new Date(bugun.getTime() - 72e5).toISOString() },
      { id: "a3", userId: "u3", userName: "Elif Şen", action: "GOREV_OLUSTUR", detail: "Haciz talebi görevi eklendi", createdAt: new Date(bugun.getTime() - 108e5).toISOString() }
    ];
    S.tab = EKRAN;
  }

  function girisiAt() {
    var a = document.getElementById("auth-screen");
    if (a) { a.style.setProperty("display", "none", "important"); a.remove(); }
    var c = document.getElementById("app-content");
    if (c) c.style.display = "block";
    var l = document.getElementById("app-layout");
    if (l) l.style.display = "";
    sessionStorage.setItem("faraklit_is_logged_in", "true");
    window.sessionPin = "DEMO";
  }

  /* UETS e-Tebligat merkezi verisini veritabanından okuyor; sahte bir
     Tauri katmanı kurup yalnızca o sorguya demo satır döndürüyoruz.
     Diğer bütün sorgular boş döner — hiçbir yan etki üretmez. */
  var TEBLIGAT = [
    { id: "n1", officeId: "local-office", sender: "İstanbul Anadolu 9. İş Mahkemesi", subject: "Bilirkişi raporu tebliği", fileNo: "2026/1184", jobType: "Tebligat", deliveryAt: gun(-1) + "T10:12:00", deadlineLabel: "Rapora itiraz — 2 hafta", deadlineAt: gun(13), linkedCaseId: "d1", status: "Aksiyon Bekliyor", createdAt: gun(-1) + "T10:12:00", createdBy: "u1", barcode: "TR2026081900001" },
    { id: "n2", officeId: "local-office", sender: "İstanbul 14. Asliye Ticaret Mahkemesi", subject: "Duruşma günü tebliği", fileNo: "2026/0473", jobType: "Tebligat", deliveryAt: gun(-2) + "T09:31:00", deadlineLabel: "", deadlineAt: "", linkedCaseId: "d2", status: "İşlendi", createdAt: gun(-2) + "T09:31:00", createdBy: "u1", barcode: "TR2026081800042" },
    { id: "n3", officeId: "local-office", sender: "İstanbul Anadolu 12. İcra Müdürlüğü", subject: "Ödeme emri tebliğ şerhi", fileNo: "2026/8841", jobType: "İcra", deliveryAt: gun(-3) + "T14:05:00", deadlineLabel: "İtiraz süresi — 7 gün", deadlineAt: gun(4), linkedCaseId: "d5", status: "Aksiyon Bekliyor", createdAt: gun(-3) + "T14:05:00", createdBy: "u1", barcode: "TR2026081700118" },
    { id: "n4", officeId: "local-office", sender: "Ankara 7. Aile Mahkemesi", subject: "Ara karar tebliği", fileNo: "2025/2903", jobType: "Tebligat", deliveryAt: gun(-4) + "T16:44:00", deadlineLabel: "İstinaf — 2 hafta", deadlineAt: gun(10), linkedCaseId: "d4", status: "Göreve Çevrildi", createdAt: gun(-4) + "T16:44:00", createdBy: "u1", barcode: "TR2026081600907" },
    { id: "n5", officeId: "local-office", sender: "İstanbul 2. Fikri ve Sınai Haklar Hukuk Mahkemesi", subject: "Ön inceleme duruşma davetiyesi", fileNo: "2026/0217", jobType: "Tebligat", deliveryAt: gun(-5) + "T11:20:00", deadlineLabel: "", deadlineAt: "", linkedCaseId: "d3", status: "Yeni", createdAt: gun(-5) + "T11:20:00", createdBy: "u1", barcode: "TR2026081500330" },
    { id: "n6", officeId: "local-office", sender: "Bölge Adliye Mahkemesi 24. Hukuk Dairesi", subject: "İstinaf başvurusu kesin süre", fileNo: "2025/2903", jobType: "Tebligat", deliveryAt: gun(-6) + "T08:55:00", deadlineLabel: "Harç yatırma — 7 gün", deadlineAt: gun(1), linkedCaseId: "", status: "Yeni", createdAt: gun(-6) + "T08:55:00", createdBy: "u1", barcode: "TR2026081400271" }
  ];

  function sahteTauriKur() {
    if (window.__TAURI__) return;
    window.__TAURI__ = {
      core: {
        invoke: async function (komut, arg) {
          var k = String(komut || "");
          if (k === "plugin:sql|select") {
            var q = String((arg && arg.query) || "");
            if (/uets_notifications/i.test(q) && /^\s*select/i.test(q)) return TEBLIGAT.slice();
            return [];
          }
          if (k === "plugin:sql|execute") return { rowsAffected: 0, lastInsertId: 0 };
          if (k === "plugin:sql|load") return "demo";
          if (k === "get_machine_name") return "DEMO-PC";
          if (k === "hava_hazir_mi") return false;
          return null;
        }
      },
      event: { listen: async function () { return function () { }; }, emit: async function () { } }
    };
  }

  function sustur() {
    sahteTauriKur();
    window.initDB = async function () { };
    window.persist = function () { };
    window.loadAll = async function () { };
    window.pushAudit = async function () { };
    window.ensureDatabaseColumns = async function () { };
    /* Yetki katmani: demoda tam yetkili kullanici. */
    window.canAccessTabV23 = function () { return true; };
    window.hasPermission = function () { return true; };
    window.isAdmin = function () { return true; };
    window.canViewFinanceAmountsV23 = function () { return true; };
    window.faraklitLisansDurumu = function () { return { durum: "aktif", kalanGun: null }; };
    try { sessionStorage.setItem("faraklit_hava_izin_soruldu", "1"); } catch (_) { }
  }

  /* ── Karşılama kartı: saatten bağımsız, tanıtıma uygun sabit görünüm ── */
  function havaCilala() {
    try {
      if (window.FaraklitHavaV103) {
        window.FaraklitHavaV103.havaAyarla("partly", {
          temperature: "24°", location: "İstanbul", label: "Parçalı bulutlu",
          high: "27°", low: "19°"
        });
      }
      var g = document.getElementById("fx103-greeting");
      if (g) g.textContent = "İyi günler";
      var kart = document.getElementById("fx103-kart");
      if (kart) {
        Array.prototype.slice.call(kart.classList)
          .filter(function (x) { return x.indexOf("daypart-") === 0; })
          .forEach(function (x) { kart.classList.remove(x); });
        kart.classList.add("daypart-afternoon");
      }
    } catch (_) { }
  }

  /* ── İçtihat ekranı: MCP'siz ortamda örnek sonuçlarla doldur ────────── */
  var KARARLAR = [
    {
      belgeId: "y9hd-2024-11842", kaynakKimligi: "yargitay", merci: "Yargıtay", daire: "9. Hukuk Dairesi",
      esasNo: "2024/11842", kararNo: "2024/14503", tarih: "18.11.2024",
      baslik: "Devamsızlık nedeniyle haklı fesih — tutanak ve savunma alma yükümlülüğü",
      puan: 91, relevanceScale: 91, pasajPuani: 93, kararPuani: 87, metinDurumu: "hazir", tamMetin: "demo",
      matchedPassage: "İşçinin işverenden izin almaksızın ardı ardına iki iş günü işe gelmemesi hâlinde dahi, feshin haklı nedene dayandığının kabulü için devamsızlığın tutanakla belgelenmesi ve işçinin savunmasının alınması gerekir.",
      snippet: "İşçinin izin almaksızın ardı ardına iki iş günü işe gelmemesi hâlinde dahi, feshin haklı nedene dayandığının kabulü için devamsızlığın tutanakla belgelenmesi ve savunmasının alınması gerekir.",
      stance: "supporting", classificationReason: "Sorgudaki devamsızlık ve haklı fesih ölçütlerini doğrudan karşılıyor."
    },
    {
      belgeId: "y9hd-2023-09117", kaynakKimligi: "yargitay", merci: "Yargıtay", daire: "9. Hukuk Dairesi",
      esasNo: "2023/9117", kararNo: "2023/12760", tarih: "04.10.2023",
      baslik: "Devamsızlık tutanağının tek taraflı düzenlenmesi — ispat yükü",
      puan: 84, pasajPuani: 86, kararPuani: 80, metinDurumu: "hazir", tamMetin: "demo",
      matchedPassage: "Yalnızca işveren tanıklarınca imzalanan devamsızlık tutanakları, işçinin aksi yöndeki puantaj ve giriş-çıkış kayıtlarıyla çeliştiğinde tek başına haklı feshi ispata elverişli değildir.",
      snippet: "Yalnızca işveren tanıklarınca imzalanan devamsızlık tutanakları, puantaj ve giriş-çıkış kayıtlarıyla çeliştiğinde tek başına haklı feshi ispata elverişli değildir.",
      stance: "supporting", classificationReason: "İspat yükü yönünden lehe."
    },
    {
      belgeId: "y9hd-2022-06304", kaynakKimligi: "yargitay", merci: "Yargıtay", daire: "9. Hukuk Dairesi",
      esasNo: "2022/6304", kararNo: "2022/09985", tarih: "21.09.2022",
      baslik: "Rapor süresinin devamsızlıktan sayılamayacağı",
      puan: 78, pasajPuani: 79, kararPuani: 76, metinDurumu: "hazir", tamMetin: "demo",
      matchedPassage: "Geçerli sağlık raporuyla belgelenen günler devamsızlık olarak değerlendirilemez; bu günler esas alınarak yapılan fesih haklı nedene dayanmaz.",
      snippet: "Geçerli sağlık raporuyla belgelenen günler devamsızlık olarak değerlendirilemez; bu günler esas alınarak yapılan fesih haklı nedene dayanmaz.",
      stance: "supporting", classificationReason: "Rapor günleri bakımından lehe."
    },
    {
      belgeId: "yhgk-2021-02418", kaynakKimligi: "yargitay", merci: "Yargıtay", daire: "Hukuk Genel Kurulu",
      esasNo: "2021/9-418", kararNo: "2021/1602", tarih: "16.12.2021",
      baslik: "Altı iş günlük hak düşürücü sürenin başlangıcı",
      puan: 72, pasajPuani: 74, kararPuani: 69, metinDurumu: "hazir", tamMetin: "demo",
      matchedPassage: "Altı iş günlük hak düşürücü süre, devamsızlığın işverence öğrenildiği tarihten değil, devamsızlığın sona erdiği tarihten itibaren işlemeye başlar.",
      snippet: "Altı iş günlük hak düşürücü süre, devamsızlığın sona erdiği tarihten itibaren işlemeye başlar.",
      stance: "distinguishing", classificationReason: "Sürenin başlangıcı yönünden farklı sonuç doğurabilir."
    },
    {
      belgeId: "y9hd-2020-04471", kaynakKimligi: "yargitay", merci: "Yargıtay", daire: "9. Hukuk Dairesi",
      esasNo: "2020/4471", kararNo: "2020/07728", tarih: "08.07.2020",
      baslik: "Devamsızlık ihtarına rağmen işe başlamama — feshin haklılığı",
      puan: 64, pasajPuani: 65, kararPuani: 62, metinDurumu: "hazir", tamMetin: "demo",
      matchedPassage: "Usulüne uygun ihtara rağmen makul sürede işe başlamayan işçinin iş sözleşmesinin feshi haklı nedene dayanır.",
      snippet: "Usulüne uygun ihtara rağmen makul sürede işe başlamayan işçinin iş sözleşmesinin feshi haklı nedene dayanır.",
      stance: "opposing", classificationReason: "İşveren lehine sonuç doğuran karşıt görüş."
    }
  ];

  function ictihatDoldur() {
    var I = window.FaraklitIctihatV91;
    if (!I || !I.durum) return;
    var d = I.durum;
    d.girdi = "İşçinin devamsızlığı nedeniyle haklı fesihte tutanak ve savunma şartı";
    d.kaynak = "yargitay";
    d.sonuclar = KARARLAR;
    d.okunan = KARARLAR.length;
    d.toplam = 4987;
    d.bankaSayisi = 128;
    d.mcpDurumu = { bagli: true, yerel: true };
    d.filtrePaneliAcik = false;
    d.filtre.daire = "H9";
    d.derlenmis = { sorgu: '+devamsızlık +savunma "haklı nedenle fesih"', daire: "H9" };
    try { window.initIctihatV91 && window.initIctihatV91(); } catch (_) { }
    /* Derleme satırı her çizimde sorgudan yeniden hesaplanıyor; tanıtımda
       yapay zekâ ile derlenmiş hâli gösteriliyor. */
    setTimeout(function () {
      var kutu = document.getElementById("fx91-derleme");
      if (kutu) {
        kutu.innerHTML = '<div class="fx91-derleme-satir">'
          + '<span class="fx91-derleme-etiket">Gönderilecek sorgu</span>'
          + '<code class="fx91-derleme-kod">+devamsızlık +savunma "haklı nedenle fesih" · birimAdi=H9</code>'
          + '<span class="fx91-derleme-kaynak">yapay zekâ derledi</span></div>';
      }
    }, 60);
  }

  async function ciz() {
    sustur();
    veriYukle();
    girisiAt();
    document.body.setAttribute("data-theme", TEMA);
    try { if (typeof window.applyTheme === "function") window.applyTheme(TEMA); } catch (_) { }
    try { if (typeof window.renderNav === "function") window.renderNav(); } catch (_) { }
    try { if (typeof window.render === "function") await window.render(); } catch (e) { console.warn("render", e); }
    [120, 700, 1800, 3200].forEach(function (ms) { setTimeout(havaCilala, ms); });
    if (EKRAN === "ictihat") { setTimeout(ictihatDoldur, 200); setTimeout(ictihatDoldur, 900); }
    document.documentElement.setAttribute("data-demo-hazir", "1");
  }

  /* Yalnizca BIR kez calisan ekran acicilar: ackapa() gibi degistirenler
     ikinci cizimde geri kapaniyordu. */
  var acildi = false;
  function ekraniAc() {
    if (acildi) return;
    acildi = true;
    if (EKRAN === "arastirma") {
      try { window.FaraklitArastirmaV122 && window.FaraklitArastirmaV122.ac(); } catch (e) { console.warn(e); }
    }
    if (EKRAN === "kup") {
      try { window.FaraklitZekaKupuV109 && window.FaraklitZekaKupuV109.ackapa(); } catch (e) { console.warn(e); }
    }
  }

  function basla() { setTimeout(ciz, 350); setTimeout(ciz, 1400); setTimeout(ekraniAc, 2000); }
  if (document.readyState === "complete") basla();
  else window.addEventListener("load", basla);
})();
