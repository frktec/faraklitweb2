# Faraklit Web — Dağıtım Notları

Bu sürümde ana sayfa yeniden tasarlandı ve Supabase güvenlik akışı sıkılaştırıldı. Canlıya almadan önce aşağıdaki sırayı izleyin.

## 1. Supabase migration

Mevcut migration'ların ardından şu dosyayı çalıştırın:

`supabase/migrations/20260918183500_security_hardening.sql`

Bu migration:

- admin yetkisini `auth.users.raw_app_meta_data.role` kaynağına taşır ve mevcut `profiles.role = 'admin'` hesaplarını geriye dönük olarak eşler,
- kullanıcıların tarayıcıdan aktif abonelik/lisans/ödeme/fatura oluşturmasını engeller,
- hashtag ile kullanıcı aramasını sınırlı bir RPC'ye taşır,
- ekip katılım onayını atomik hâle getirir,
- e-posta doğrulaması açık olsa bile kayıt profilini güvenli biçimde oluşturur,
- cihaz kaydını kullanıcının kendi aktif lisansıyla sınırlar.

Migration sonrasında mevcut admin kullanıcının yeni JWT alması için çıkış/giriş yapması gerekir.

## 2. Supabase Auth URL ayarları

Supabase Dashboard > Authentication > URL Configuration altında production domainini Site URL olarak tanımlayın ve en az şu redirect URL'lerini izinli hâle getirin:

- `https://ALAN-ADINIZ/account`
- `https://ALAN-ADINIZ/reset-password`

Local geliştirme için eşdeğer localhost adreslerini de ekleyin.

## 3. Ödeme sağlayıcısı

Checkout artık güvenli olarak yalnızca `pending` sipariş açar. Tarayıcı tarafı ödeme tamamlandı diyerek lisans üretemez.

Canlı ödeme için Iyzico, PayTR veya seçilecek sağlayıcının **sunucu tarafı / doğrulanmış webhook** akışını bağlayın. Sağlayıcı imzası doğrulandıktan sonra service-role ortamından:

`complete_order_after_payment(payment_id, provider, provider_payment_id)`

fonksiyonunu çağırın. Service-role anahtarını hiçbir zaman Vite/frontend ortam değişkenine koymayın.

## 4. Ortam değişkenleri

Frontend yalnızca Supabase URL ve anon key kullanmalıdır. `service_role` veya ödeme sağlayıcısının gizli anahtarları frontend'e eklenmemelidir.

## 5. Build kontrolü

Ağ erişimi olan geliştirme/CI ortamında:

```bash
npm ci
npm run typecheck
npm run build
```

komutlarını çalıştırın.

Bu çalışma ortamında npm registry DNS erişimi olmadığı için bağımlılıklar indirilemedi; buna karşılık proje içindeki tüm TS/TSX dosyaları TypeScript parser/transpile kontrolünden geçirilmiştir ve yerel `@/` import hedefleri doğrulanmıştır.

## 6. Ürün ve ana sayfa

Landing page gerçek Faraklit ekran görüntülerini optimize edilmiş WebP olarak `public/images/landing/` altında kullanır. Bu klasörü deploy paketine dahil edin.

Canlıya çıkmadan önce kampanya metni (Afyonkarahisar Barosu üyelerine 3 ay ücretsiz), destek e-postası ve paket fiyatlarını ticari politikanızla son kez karşılaştırın.
