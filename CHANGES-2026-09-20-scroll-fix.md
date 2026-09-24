# 20 Eylül 2026 — Sinematik scroll düzeltmesi

## Ana neden
Landing sayfasında yatay taşmayı engellemek için `html, body, #root` üzerinde `overflow-x: hidden` kullanılmıştı. Bu değer, tarayıcıda `position: sticky` elemanlarının en yakın overflow kapsayıcısına bağlanmasına yol açarak sinematik ürün turundaki sticky panelin pencereye göre çalışmasını bozabiliyordu. Aynı bölümde 1750–2400 px arası sabit bir minimum yükseklik ayrıldığı için sticky davranışı bozulduğunda bu alan aşağıda büyük boşluk olarak görünüyordu.

## Düzeltmeler
- Global `overflow-x: hidden` yerine sticky davranışını bozmayan `overflow-x: clip` kullanıldı.
- Sinematik bölümün gereksiz 1750–2400 px scroll rezervi 1320–1660 px aralığına düşürüldü.
- Scroll başlangıç/bitiş hesabı viewport tahmini yerine sticky panelin gerçek `offsetHeight` değeriyle eşleştirildi.
- Sekme/adım tıklaması aynı gerçek scroll sınırlarını kullanıyor.
- Scroll ile aktif adım seçimi 5 adıma dengeli dağıtıldı.
