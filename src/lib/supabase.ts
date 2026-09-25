import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False when .env.local has no Supabase URL/key; the marketing pages still render. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[Faraklit] Supabase bağlantısı tanımlı değil. Giriş, hesap ve admin sayfaları için proje klasöründe ' +
      '.env.local dosyasına VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini ekleyip sunucuyu yeniden başlatın.',
  );
}

// createClient throws on an empty URL, which would blank the whole app. Without
// configuration, point at an unroutable host so requests fail with an error
// result instead of crashing at import time.
export const supabase = createClient(
  supabaseUrl || 'https://supabase-not-configured.invalid',
  supabaseAnonKey || 'not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
