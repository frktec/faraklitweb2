import { supabase } from '@/lib/supabase';

export type ProfileSummary = { id: string; full_name: string; email: string };

/**
 * payments/licenses/jobs/... reference auth.users, not profiles, so PostgREST cannot embed
 * profiles through them. Fetch the needed profiles separately and join on the client.
 */
export async function fetchProfileMap(ids: (string | null | undefined)[]): Promise<Record<string, ProfileSummary>> {
  const unique = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  const map: Record<string, ProfileSummary> = {};
  for (let i = 0; i < unique.length; i += 200) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', unique.slice(i, i + 200));
    for (const p of (data as ProfileSummary[]) || []) map[p.id] = p;
  }
  return map;
}
