# Faraklit Web — Dağıtım Notları

Canlıya almadan önce aşağıdaki sırayı izleyin.

## 1. Supabase migration

Mevcut migration'ların ardından şu dosyaları sırayla çalıştırın:

1. `supabase/migrations/20260918183500_security_hardening.sql`
2. `supabase/migrations/20260924100000_fix_org_rls_and_invitations.sql`
3. `supabase/migrations/20260924110000_credits_jobs_orders.sql`

`20260924100000_fix_org_rls_and_invitations.sql`:

- `organization_members` politikalarındaki sonsuz özyinelemeyi giderir (bu hata yüzünden ekip sayfası ve büro sorguları çalışmıyordu),
- davet edilen kişinin daveti başka büroya / admin rolüne çevirerek yetki yükseltmesini engeller,
- büro sahipliğinin yalnızca mevcut sahip tarafından devredilmesini sağlar,
- büro yöneticilerinin başkalarını onaysız olarak büroya eklemesini engeller.

`20260924110000_credits_jobs_orders.sql`:

- kredi sistemi (`credit_packages`, `credit_wallets`, `credit_transactions`, `plans.included_credits`),
- iş üretimi kaydı (`job_types`, `jobs`, `record_job` RPC),
- sipariş türleri: yeni lisans, süre uzatma, paket değişikliği, kredi paketi (`create_order`, `cancel_my_order`),
- admin RPC'leri (ödeme onayı/iadesi, kredi tanımlama, lisans uzatma/askıya alma/manuel lisans, cihaz yetkisi, istatistikler); her admin işlemi `admin_audit_logs` tablosuna sunucu tarafında yazılır.

Örnek kredi paketleri **pasif** olarak eklenir. Fiyatları Admin → Krediler → Kredi paketleri ekranından belirleyip satışa açın. İş türü başına kredi maliyetleri Admin → Krediler → İş maliyetleri ekranından değiştirilebilir.

İlk `security_hardening` migration'ı:

Bu migration:

- admin yetkisini `auth.users.raw_app_meta_data.role` kaynağına taşır ve mevcut `profiles.role = 'admin'` hesaplarını geriye dönük olarak eşler,
- kullanıcıların tarayıcıdan aktif abonelik/lisans/ödeme/fatura oluşturmasını engeller,
- hashtag ile kullanıcı aramasını sınırlı bir RPC'ye taşır,
- ekip katılım onayını atomik hâle getirir,
- e-posta doğrulaması açık olsa bile kayıt profilini güvenli biçimde oluşturur,
- cihaz kaydını kullanıcının kendi aktif lisansıyla sınırlar.

Migration sonrasında mevcut admin kullanıcının yeni JWT alması için çıkış/giriş yapması gerekir.

### Admin hesabı tanımlama

Supabase Dashboard > SQL Editor'da (yalnızca buradan çalışır, tarayıcıdan çağrılamaz):

```sql
SELECT grant_platform_admin('eposta@alanadiniz.com');
```

Kullanıcı çıkış yapıp tekrar giriş yaptığında `/admin` paneline erişir. Admin kullanıcılar hesap menüsünde "Admin Paneli" bağlantısını görür.

## 2. Supabase Auth URL ayarları

Supabase Dashboard > Authentication > URL Configuration altında production domainini Site URL olarak tanımlayın ve en az şu redirect URL'lerini izinli hâle getirin:

- `https://ALAN-ADINIZ/account`
- `https://ALAN-ADINIZ/reset-password`

Local geliştirme için eşdeğer localhost adreslerini de ekleyin.

## 3. Ödeme sağlayıcısı

Checkout yalnızca `pending` sipariş açar. Tarayıcı tarafı ödeme tamamlandı diyerek lisans veya kredi üretemez.

Ödeme sağlayıcısı bağlanana kadar havale/EFT ödemeleri Admin → Satışlar ekranından **Onayla** ile tamamlanabilir; lisans açılır/uzatılır, krediler yüklenir ve fatura "ödendi" olarak oluşur.

Canlı kart ödemesi için Iyzico, PayTR veya seçilecek sağlayıcının **sunucu tarafı / doğrulanmış webhook** akışını bağlayın. Sağlayıcı imzası doğrulandıktan sonra service-role ortamından:

`complete_order_after_payment(payment_id, provider, provider_payment_id)`

fonksiyonunu çağırın. Fonksiyon yalnızca `pending` siparişleri tamamlar ve tekrarlanan çağrılarda aynı sonucu döndürür. Service-role anahtarını hiçbir zaman Vite/frontend ortam değişkenine koymayın.

## 3a. Masaüstü uygulaması: iş kaydı

Masaüstü uygulaması her iş bittiğinde, kullanıcının oturumuyla şu RPC'yi çağırmalıdır:

```ts
const { data, error } = await supabase.rpc('record_job', {
  p_job_type: 'dilekce',          // job_types.key
  p_status: 'completed',          // veya 'failed' (kredi düşülmez)
  p_quantity: 1,
  p_duration_ms: 5400,
  p_app_version: '1.4.2',
  p_platform: 'windows',
});
// data[0] = { job_id, credits_used, balance }
// error.hint === 'insufficient_credits' | 'no_active_license'
```

Kredi maliyeti sunucuda `job_types.credit_cost` üzerinden hesaplanır; istemci maliyet gönderemez. `jobs` tablosunda belge içeriği, müvekkil adı veya arama metni için alan yoktur; uygulama bu bilgileri göndermemelidir.

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

Ayrıca `npm run lint` temiz geçmelidir.

## 6. Ürün ve ana sayfa

Ürün ekran görüntüleri yayın paketine girmemesi için `docs/screenshots/` altında tutulur; ana sayfa bunları kullanmaz.

Canlıya çıkmadan önce kampanya metni (Afyonkarahisar Barosu üyelerine 3 ay ücretsiz), destek e-postası ve paket fiyatlarını ticari politikanızla son kez karşılaştırın.
