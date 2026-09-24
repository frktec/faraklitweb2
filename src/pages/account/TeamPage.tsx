import { useEffect, useState, useCallback } from 'react';
import { AccountLayout } from '@/components/account/AccountLayout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import type { OrganizationMember, OrganizationInvitation, Profile, MemberRole, JoinRequest } from '@/types';
import { Mail, Clock, Check, X, Crown, Shield, Briefcase, UserCog, Copy, Link2, Building2, Loader2, Hash, Search, UserPlus, Inbox } from 'lucide-react';

type MemberWithProfile = Omit<OrganizationMember, 'profile'> & { profile: Profile | null };
type InviteWithOrg = OrganizationInvitation & { organization?: { name: string } };
type JoinRequestWithRelations = JoinRequest & {
  organization?: { name: string };
  profile?: Profile;
  requester?: { full_name: string };
};

export function TeamPage() {
  const { profile } = useAuth();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [invitations, setInvitations] = useState<InviteWithOrg[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>('');
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('lawyer');
  const [inviteSending, setInviteSending] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [pendingIncoming, setPendingIncoming] = useState<InviteWithOrg[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithRelations[]>([]);

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', taxId: '', taxOffice: '', city: '', address: '', phone: '' });
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Hashtag-based invite state
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [hashtagRole, setHashtagRole] = useState<MemberRole>('lawyer');
  const [hashtagSending, setHashtagSending] = useState(false);
  const [searchedUser, setSearchedUser] = useState<Pick<Profile, 'id' | 'full_name' | 'hashtag' | 'account_type'> | null>(null);
  const [searching, setSearching] = useState(false);

  // Incoming join requests for individual users
  const [myJoinRequests, setMyJoinRequests] = useState<JoinRequestWithRelations[]>([]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setSuccess('');

    if (!orgForm.name.trim()) {
      setError('Büro adı zorunludur.');
      return;
    }

    setCreatingOrg(true);

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgForm.name.trim(),
        tax_id: orgForm.taxId.trim() || null,
        tax_office: orgForm.taxOffice.trim() || null,
        address: orgForm.address.trim() || null,
        city: orgForm.city.trim() || null,
        phone: orgForm.phone.trim() || null,
        email: profile.email,
        owner_id: profile.id,
      })
      .select('id, name')
      .single();

    if (orgError) {
      setCreatingOrg(false);
      setError('Hukuk bürosu oluşturulamadı: ' + orgError.message);
      return;
    }

    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: profile.id,
        role: 'admin',
      });

    if (memberError) {
      setCreatingOrg(false);
      setError('Üyelik kaydı oluşturulamadı: ' + memberError.message);
      return;
    }

    await supabase
      .from('profiles')
      .update({ account_type: 'organization' })
      .eq('id', profile.id);

    setCreatingOrg(false);
    setSuccess(`${org.name} bürosu oluşturuldu! Artık ekip üyelerinizi davet edebilirsiniz.`);
    setShowCreateOrg(false);
    setOrgForm({ name: '', taxId: '', taxOffice: '', city: '', address: '', phone: '' });
    fetchTeamData();
  };

  const buildInviteLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?invite=${token}`;
  };

  const handleCopyLink = async (token: string) => {
    const link = buildInviteLink(token);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      setError('Bağlantı kopyalanamadı. Lütfen elle kopyalayın.');
    }
  };

  const fetchTeamData = useCallback(async () => {
    if (!profile) { setLoading(false); return; }

    let currentOrgId: string | null = null;

    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (orgMember) {
      currentOrgId = orgMember.organization_id;
      setIsOrgAdmin(orgMember.role === 'admin');
    } else {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('owner_id', profile.id)
        .maybeSingle();
      currentOrgId = org?.id ?? null;
      if (org) {
        setIsOrgAdmin(true);
        setOrgName(org.name);
      }
    }

    // Always check for incoming invitations
    const { data: incomingInvites } = await supabase
      .from('organization_invitations')
      .select('*, organization:organizations!organization_invitations_organization_id_fkey(name)')
      .eq('email', profile.email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPendingIncoming((incomingInvites as InviteWithOrg[]) || []);

    // Always check for incoming join requests (for individual users)
    const { data: myRequests } = await supabase
      .from('join_requests')
      .select('*, organization:organizations!join_requests_organization_id_fkey(name), requester:profiles!join_requests_requested_by_fkey(full_name)')
      .eq('user_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setMyJoinRequests((myRequests as JoinRequestWithRelations[]) || []);

    if (!currentOrgId) {
      setLoading(false);
      return;
    }

    setOrgId(currentOrgId);

    if (!orgName) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', currentOrgId)
        .maybeSingle();
      if (org) setOrgName(org.name);
    }

    const [membersRes, invitesRes, joinReqsRes] = await Promise.all([
      supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: true }),
      supabase
        .from('organization_invitations')
        .select('*, organization:organizations!organization_invitations_organization_id_fkey(name)')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false }),
      supabase
        .from('join_requests')
        .select('*, profile:profiles!join_requests_user_id_fkey(*), requester:profiles!join_requests_requested_by_fkey(full_name)')
        .eq('organization_id', currentOrgId)
        .order('created_at', { ascending: false }),
    ]);

    // organization_members.user_id references auth.users, so profiles cannot be embedded; join here.
    const memberRows = (membersRes.data as OrganizationMember[]) || [];
    const { data: memberProfiles } = memberRows.length
      ? await supabase.from('profiles').select('*').in('id', memberRows.map((m) => m.user_id))
      : { data: [] as Profile[] };
    const profileById = new Map(((memberProfiles as Profile[]) || []).map((p) => [p.id, p]));
    setMembers(memberRows.map((m) => ({ ...m, profile: profileById.get(m.user_id) ?? null })));
    setInvitations((invitesRes.data as InviteWithOrg[]) || []);
    setJoinRequests((joinReqsRes.data as JoinRequestWithRelations[]) || []);
    setLoading(false);
  }, [profile, orgName]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  // Search user by hashtag
  const handleHashtagSearch = async () => {
    setError('');
    setSearchedUser(null);

    const tag = hashtagSearch.trim().toUpperCase();
    if (!tag) return;

    if (!tag.startsWith('#') || tag.length < 3) {
      setError('Geçerli bir hashtag girin (örn. #AB123456).');
      return;
    }

    setSearching(true);

    const { data: searchResults, error: searchError } = await supabase
      .rpc('find_profile_by_hashtag', { search_tag: tag });

    const data = Array.isArray(searchResults) ? searchResults[0] : searchResults;

    setSearching(false);

    if (searchError) {
      setError('Kullanıcı aranamadı.');
      return;
    }

    if (!data) {
      setError('Bu hashtaga sahip kullanıcı bulunamadı.');
      return;
    }

    if (data.id === profile?.id) {
      setError('Kendinizi davet edemezsiniz.');
      return;
    }

    // Check if already a member
    const alreadyMember = members.some((m) => m.user_id === data.id);
    if (alreadyMember) {
      setError('Bu kullanıcı zaten ekibin üyesi.');
      return;
    }

    // Check if already has a pending join request
    const existingRequest = joinRequests.some(
      (r) => r.user_id === data.id && r.status === 'pending'
    );
    if (existingRequest) {
      setError('Bu kullanıcıya zaten bekleyen bir katılma daveti var.');
      return;
    }

    setSearchedUser(data as Pick<Profile, 'id' | 'full_name' | 'hashtag' | 'account_type'>);
  };

  // Send join request via hashtag
  const handleSendJoinRequest = async () => {
    if (!searchedUser || !orgId || !profile) return;
    setError('');
    setSuccess('');

    setHashtagSending(true);

    const { error: reqError } = await supabase
      .from('join_requests')
      .insert({
        organization_id: orgId,
        user_id: searchedUser.id,
        requested_by: profile.id,
        role: hashtagRole,
      });

    setHashtagSending(false);

    if (reqError) {
      setError('Katılma daveti gönderilemedi: ' + reqError.message);
      return;
    }

    setSuccess(`${searchedUser.full_name || searchedUser.hashtag} kişisine katılma daveti gönderildi. Kullanıcı onayladığında ekibe eklenecektir.`);
    setSearchedUser(null);
    setHashtagSearch('');
    fetchTeamData();
  };

  // Individual user approves a join request
  const handleApproveJoinRequest = async (reqId: string) => {
    if (!profile) return;
    setError('');
    setSuccess('');

    const req = myJoinRequests.find((r) => r.id === reqId);
    if (!req) return;

    // Update request status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({
        status: 'approved',
        responded_at: new Date().toISOString(),
      })
      .eq('id', reqId)
      .eq('status', 'pending');

    if (updateError) {
      setError('Davet kabul edilemedi: ' + updateError.message);
      return;
    }

    // Membership and profile account type are updated atomically by the database trigger.

    setSuccess('Ekibe başarıyla katıldınız!');
    setMyJoinRequests([]);
    fetchTeamData();
  };

  // Individual user rejects a join request
  const handleRejectJoinRequest = async (reqId: string) => {
    setError('');
    setSuccess('');

    const { error: rejectError } = await supabase
      .from('join_requests')
      .update({
        status: 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('id', reqId)
      .eq('status', 'pending');

    if (rejectError) {
      setError('Davet reddedilemedi.');
      return;
    }

    setSuccess('Davet reddedildi.');
    setMyJoinRequests((prev) => prev.filter((r) => r.id !== reqId));
    fetchTeamData();
  };

  // Org admin cancels a join request they sent
  const handleCancelJoinRequest = async (reqId: string) => {
    setError('');

    const { error: cancelError } = await supabase
      .from('join_requests')
      .delete()
      .eq('id', reqId)
      .eq('status', 'pending');

    if (cancelError) {
      setError('Davet iptal edilemedi.');
      return;
    }
    fetchTeamData();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLastInviteLink(null);

    if (!orgId) return;

    const existingMember = members.find(
      (m) => m.profile?.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    if (existingMember) {
      setError('Bu kullanıcı zaten ekibin üyesi.');
      return;
    }

    const existingInvite = invitations.find(
      (inv) => inv.email.toLowerCase() === inviteEmail.toLowerCase() && inv.status === 'pending'
    );
    if (existingInvite) {
      setError('Bu e-posta adresine zaten bekleyen bir davet var.');
      return;
    }

    setInviteSending(true);

    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .maybeSingle();

    const { data: inviteData, error: inviteError } = await supabase
      .from('organization_invitations')
      .insert({
        organization_id: orgId,
        email: inviteEmail.toLowerCase(),
        role: inviteRole,
        invited_by: org?.owner_id || profile?.id,
      })
      .select('invite_token')
      .single();

    setInviteSending(false);

    if (inviteError) {
      setError('Davet gönderilemedi: ' + inviteError.message);
      return;
    }

    const link = buildInviteLink(inviteData.invite_token);
    setLastInviteLink(link);
    setSuccess(`${inviteEmail} adresine davet oluşturuldu. Aşağıdaki bağlantıyı paylaşabilirsiniz.`);
    setInviteEmail('');
    fetchTeamData();
  };

  const handleRevokeInvite = async (inviteId: string) => {
    setError('');
    const { error: revokeError } = await supabase
      .from('organization_invitations')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .eq('status', 'pending');

    if (revokeError) {
      setError('Davet iptal edilemedi.');
      return;
    }
    fetchTeamData();
  };

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    setError('');
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (updateError) {
      setError('Rol güncellenemedi.');
      return;
    }
    fetchTeamData();
  };

  const handleRemoveMember = async (memberId: string) => {
    setError('');
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      setError('Üye kaldırılamadı.');
      return;
    }
    fetchTeamData();
  };

  const handleAcceptIncoming = async (inviteId: string) => {
    if (!profile) return;
    setError('');

    const { error: acceptError } = await supabase
      .from('organization_invitations')
      .update({
        status: 'accepted',
        accepted_by: profile.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .eq('status', 'pending');

    if (acceptError) {
      setError('Davet kabul edilemedi: ' + acceptError.message);
      return;
    }

    setSuccess('Ekibe başarıyla katıldınız!');
    setPendingIncoming([]);
    fetchTeamData();
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="text-sm text-ink-400">Yükleniyor…</div>
      </AccountLayout>
    );
  }

  const roleLabel = (role: string) =>
    role === 'admin' ? 'Yönetici' : role === 'lawyer' ? 'Avukat' : 'Personel';

  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown size={13} className="text-amber-500" />;
    if (role === 'admin') return <Shield size={13} className="text-blue-500" />;
    if (role === 'lawyer') return <Briefcase size={13} className="text-ink-500" />;
    return <UserCog size={13} className="text-ink-400" />;
  };

  // Show incoming join requests for individual users (not yet in an org)
  if (!orgId) {
    return (
      <AccountLayout>
        <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Ekip</h1>
        <p className="mt-1 text-[16px] text-ink-500">Ekip üyelerinizi yönetmek ve davet etmek için bir hukuk bürosu oluşturun.</p>

        {error && <p className="mt-4 rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-[7px] bg-emerald-50 px-3 py-2 text-[15px] text-emerald-700">{success}</p>}

        {/* Incoming join requests from org admins */}
        {myJoinRequests.length > 0 && (
          <div className="mt-6 rounded-[8px] border border-blue-200 bg-blue-50 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-blue-800">
              <Inbox size={15} />
              Katılma Davetleri ({myJoinRequests.length})
            </h2>
            <div className="space-y-2">
              {myJoinRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between rounded-[6px] bg-white px-3 py-3">
                  <div>
                    <p className="text-[15px] font-medium text-ink-800">{req.organization?.name || 'Bilinmeyen Büro'}</p>
                    <p className="text-[13px] text-ink-400">
                      Davet eden: {req.requester?.full_name || 'Bilinmeyen'} · Rol: {roleLabel(req.role)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveJoinRequest(req.id)}
                      className="flex items-center gap-1 rounded-[6px] bg-emerald-600 px-3 py-1.5 text-[14px] font-medium text-white hover:bg-emerald-700"
                    >
                      <Check size={13} /> Kabul Et
                    </button>
                    <button
                      onClick={() => handleRejectJoinRequest(req.id)}
                      className="flex items-center gap-1 rounded-[6px] border border-red-200 px-3 py-1.5 text-[14px] font-medium text-red-600 hover:bg-red-50"
                    >
                      <X size={13} /> Reddet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email-based incoming invitations */}
        {pendingIncoming.length > 0 && (
          <div className="mt-6 rounded-[8px] border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-emerald-800">
              <Mail size={15} />
              Ekip Davetleri ({pendingIncoming.length})
            </h2>
            <div className="space-y-2">
              {pendingIncoming.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-[6px] bg-white px-3 py-2.5">
                  <div>
                    <p className="text-[15px] font-medium text-ink-800">{inv.organization?.name || 'Bilinmeyen Büro'}</p>
                    <p className="text-[13px] text-ink-400">Rol: {roleLabel(inv.role)} · Son kullanma: {formatDate(inv.expires_at)}</p>
                  </div>
                  <button
                    onClick={() => handleAcceptIncoming(inv.id)}
                    className="rounded-[6px] bg-emerald-600 px-3 py-1.5 text-[14px] font-medium text-white hover:bg-emerald-700"
                  >
                    Katıl
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showCreateOrg ? (
          <div className="mt-8 rounded-[10px] border border-ink-200 bg-white p-8 text-center">
            <Building2 className="mx-auto mb-3 text-ink-300" size={32} />
            <p className="text-[16px] font-medium text-ink-700">Henüz bir hukuk büronuz yok</p>
            <p className="mt-1 text-[15px] text-ink-400">
              Hukuk büronuzu oluşturun ve ekibinize avukat ve personel davet edin.
            </p>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="btn-primary mt-5"
            >
              <Building2 size={15} /> Hukuk Bürosu Oluştur
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateOrg} className="mt-8 card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-ink-900">
              <Building2 size={16} className="text-ink-500" />
              Hukuk Bürosu Bilgileri
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label-field">Büro Adı *</label>
                <input
                  type="text"
                  required
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                  className="input-field"
                  placeholder="Yılmaz Hukuk Bürosu"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Vergi No</label>
                  <input
                    type="text"
                    value={orgForm.taxId}
                    onChange={(e) => setOrgForm({ ...orgForm, taxId: e.target.value })}
                    className="input-field"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="label-field">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={orgForm.taxOffice}
                    onChange={(e) => setOrgForm({ ...orgForm, taxOffice: e.target.value })}
                    className="input-field"
                    placeholder="Beşiktaş V.D."
                  />
                </div>
              </div>
              <div>
                <label className="label-field">İl</label>
                <input
                  type="text"
                  value={orgForm.city}
                  onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                  className="input-field"
                  placeholder="İstanbul"
                />
              </div>
              <div>
                <label className="label-field">Adres</label>
                <input
                  type="text"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  className="input-field"
                  placeholder="Levent, İstanbul"
                />
              </div>
              <div>
                <label className="label-field">Büro Telefonu</label>
                <input
                  type="tel"
                  value={orgForm.phone}
                  onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                  className="input-field"
                  placeholder="+90 212 XXX XX XX"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="submit" disabled={creatingOrg} className="btn-primary flex-1">
                {creatingOrg ? <><Loader2 size={15} className="animate-spin" /> Oluşturuluyor…</> : 'Büroyu Oluştur'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateOrg(false)}
                className="btn-secondary"
              >
                İptal
              </button>
            </div>
          </form>
        )}
      </AccountLayout>
    );
  }

  const pendingInvites = invitations.filter((i) => i.status === 'pending');
  const pendingJoinRequests = joinRequests.filter((r) => r.status === 'pending');

  return (
    <AccountLayout>
      <h1 className="text-[24px] font-semibold tracking-tight text-ink-950">Ekip</h1>
      <p className="mt-1 text-[16px] text-ink-500">
        {orgName ? `${orgName} ekibini yönetin.` : 'Ekip üyelerinizi ve yetkilerini yönetin.'}
      </p>

      {error && <p className="mt-4 rounded-[7px] bg-red-50 px-3 py-2 text-[15px] text-red-700">{error}</p>}
      {success && <p className="mt-4 rounded-[7px] bg-emerald-50 px-3 py-2 text-[15px] text-emerald-700">{success}</p>}

      {/* Incoming invitations (for users already in an org but invited to another) */}
      {pendingIncoming.length > 0 && (
        <div className="mt-6 rounded-[8px] border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-emerald-800">
            <Mail size={15} />
            Yeni Ekip Davetleri ({pendingIncoming.length})
          </h2>
          <div className="space-y-2">
            {pendingIncoming.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-[6px] bg-white px-3 py-2.5">
                <div>
                  <p className="text-[15px] font-medium text-ink-800">{inv.organization?.name || 'Bilinmeyen Büro'}</p>
                  <p className="text-[13px] text-ink-400">Rol: {roleLabel(inv.role)} · Son kullanma: {formatDate(inv.expires_at)}</p>
                </div>
                <button
                  onClick={() => handleAcceptIncoming(inv.id)}
                  className="rounded-[6px] bg-emerald-600 px-3 py-1.5 text-[14px] font-medium text-white hover:bg-emerald-700"
                >
                  Katıl
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming join requests for users already in an org */}
      {myJoinRequests.length > 0 && (
        <div className="mt-6 rounded-[8px] border border-blue-200 bg-blue-50 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-blue-800">
            <Inbox size={15} />
            Katılma Davetleri ({myJoinRequests.length})
          </h2>
          <div className="space-y-2">
            {myJoinRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-[6px] bg-white px-3 py-3">
                <div>
                  <p className="text-[15px] font-medium text-ink-800">{req.organization?.name || 'Bilinmeyen Büro'}</p>
                  <p className="text-[13px] text-ink-400">
                    Davet eden: {req.requester?.full_name || 'Bilinmeyen'} · Rol: {roleLabel(req.role)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveJoinRequest(req.id)}
                    className="flex items-center gap-1 rounded-[6px] bg-emerald-600 px-3 py-1.5 text-[14px] font-medium text-white hover:bg-emerald-700"
                  >
                    <Check size={13} /> Kabul Et
                  </button>
                  <button
                    onClick={() => handleRejectJoinRequest(req.id)}
                    className="flex items-center gap-1 rounded-[6px] border border-red-200 px-3 py-1.5 text-[14px] font-medium text-red-600 hover:bg-red-50"
                  >
                    <X size={13} /> Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOrgAdmin && (
        <>
          {/* Hashtag-based invite */}
          <div className="mt-8 card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-ink-900">
              <Hash size={16} className="text-ink-500" />
              Hashtag ile Davet Et
            </h2>
            <p className="mb-3 text-[14px] text-ink-400">
              Kullanıcının hashtag kodunu girerek ekibe katılması için davet gönderin. Kullanıcı kendi onayını verdikten sonra ekibe eklenecektir.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={hashtagSearch}
                    onChange={(e) => setHashtagSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !searchedUser) { e.preventDefault(); handleHashtagSearch(); } }}
                    className="input-field pl-9"
                    placeholder="#AB123456"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleHashtagSearch}
                disabled={searching}
                className="btn-secondary sm:w-32"
              >
                  {searching ? <><Loader2 size={15} className="animate-spin" /> Aranıyor…</> : <><Search size={15} /> Ara</>}
              </button>
            </div>

            {/* Search result */}
            {searchedUser && (
              <div className="mt-4 rounded-[8px] border border-ink-200 bg-ink-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-200 text-[16px] font-medium text-ink-700">
                      {(searchedUser.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[16px] font-medium text-ink-800">{searchedUser.full_name || 'Bilinmeyen'}</p>
                      <p className="text-[14px] text-ink-400">Faraklit kullanıcısı</p>
                      <p className="mt-0.5 font-mono text-[13px] text-ink-500">{searchedUser.hashtag}</p>
                    </div>
                  </div>
                  <span className={`rounded-[5px] px-2 py-0.5 text-[13px] font-medium ${
                    searchedUser.account_type === 'organization'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {searchedUser.account_type === 'organization' ? 'Kurumsal' : 'Bireysel'}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={hashtagRole}
                    onChange={(e) => setHashtagRole(e.target.value as MemberRole)}
                    className="input-field sm:w-40"
                  >
                    <option value="admin">Yönetici</option>
                    <option value="lawyer">Avukat</option>
                    <option value="staff">Personel</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleSendJoinRequest}
                    disabled={hashtagSending}
                    className="btn-primary flex-1"
                  >
                    {hashtagSending ? <><Loader2 size={15} className="animate-spin" /> Gönderiliyor…</> : <><UserPlus size={15} /> Katılma Daveti Gönder</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSearchedUser(null); setHashtagSearch(''); }}
                    className="btn-secondary"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email-based invite */}
          <form onSubmit={handleInvite} className="mt-6 card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-ink-900">
              <Mail size={16} className="text-ink-500" />
              E-posta ile Davet Et
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="input-field flex-1"
                placeholder="eposta@avukat.com"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                className="input-field sm:w-40"
              >
                <option value="admin">Yönetici</option>
                <option value="lawyer">Avukat</option>
                <option value="staff">Personel</option>
              </select>
              <button type="submit" disabled={inviteSending} className="btn-primary sm:w-36">
                {inviteSending ? 'Gönderiliyor…' : 'Davet Oluştur'}
              </button>
            </div>
            <p className="mt-2 text-[14px] text-ink-400">
              Davet oluşturulduktan sonra bağlantıyı kopyalayıp e-posta veya mesajla paylaşabilirsiniz.
            </p>

            {lastInviteLink && (
              <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={14} className="text-emerald-600" />
                  <p className="text-[15px] font-medium text-emerald-800">Davet Bağlantısı Oluşturuldu</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={lastInviteLink}
                    className="flex-1 rounded-[6px] border border-emerald-200 bg-white px-3 py-2 text-[14px] text-ink-700"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(lastInviteLink.split('invite=')[1])}
                    className="flex items-center gap-1.5 rounded-[6px] bg-emerald-600 px-3 py-2 text-[14px] font-medium text-white hover:bg-emerald-700"
                  >
                    {copiedToken === lastInviteLink.split('invite=')[1] ? (
                      <><Check size={14} /> Kopyalandı</>
                    ) : (
                      <><Copy size={14} /> Kopyala</>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[13px] text-emerald-700">
                  Bu bağlantıyı gönderdiğiniz kişi, kayıt olarak otomatik olarak ekibe eklenecektir.
                </p>
              </div>
            )}
          </form>
        </>
      )}

      {/* Pending join requests (org admin view) */}
      {pendingJoinRequests.length > 0 && isOrgAdmin && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-ink-700">
            <Clock size={15} className="text-blue-500" />
            Bekleyen Katılma Davetleri ({pendingJoinRequests.length})
          </h2>
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            {pendingJoinRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-[15px] font-medium text-ink-600">
                    {(req.profile?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[16px] font-medium text-ink-800">{req.profile?.full_name || 'Bilinmeyen'}</p>
                    <p className="text-[14px] text-ink-400">
                      {req.profile?.email} · {req.profile?.hashtag} · Rol: {roleLabel(req.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelJoinRequest(req.id)}
                  className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-red-500 hover:text-red-600"
                >
                  <X size={13} /> İptal Et
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingInvites.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-ink-700">
            <Clock size={15} className="text-amber-500" />
            Bekleyen E-posta Davetleri ({pendingInvites.length})
          </h2>
          <div className="divide-y divide-ink-200 border-y border-ink-200">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium text-ink-800">{inv.email}</p>
                  <p className="text-[14px] text-ink-400">
                    Rol: {roleLabel(inv.role)} · Son kullanma: {formatDate(inv.expires_at)}
                  </p>
                  {isOrgAdmin && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={buildInviteLink(inv.invite_token)}
                        className="w-full max-w-[320px] truncate rounded-[5px] border border-ink-200 bg-ink-50 px-2 py-1 text-[13px] text-ink-500"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={() => handleCopyLink(inv.invite_token)}
                        className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-900"
                      >
                        {copiedToken === inv.invite_token ? (
                          <><Check size={12} /> Kopyalandı</>
                        ) : (
                          <><Copy size={12} /> Kopyala</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {isOrgAdmin && (
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    className="ml-3 flex shrink-0 items-center gap-1 text-[14px] font-medium text-red-500 hover:text-red-600"
                  >
                    <X size={13} /> İptal Et
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-[16px] font-semibold text-ink-700">
          Ekip Üyeleri ({members.length})
        </h2>
        <div className="divide-y divide-ink-200 border-y border-ink-200">
          {members.map((m) => {
            const isSelf = m.user_id === profile?.id;
            const canManage = isOrgAdmin && !isSelf;

            return (
              <div key={m.id} className="flex items-center justify-between py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-[15px] font-medium text-ink-600">
                    {(m.profile?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[16px] font-medium text-ink-800">
                      {m.profile?.full_name || 'Bilinmeyen'}
                      {isSelf && <span className="ml-1.5 text-[13px] text-ink-400">(siz)</span>}
                    </p>
                    <p className="text-[14px] text-ink-400">
                      {m.profile?.email}
                      {m.profile?.hashtag && <span className="ml-1.5 font-mono">{m.profile.hashtag}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 rounded-[5px] bg-ink-100 px-2 py-0.5 text-[13px] text-ink-600">
                    {roleIcon(m.role)}
                    {roleLabel(m.role)}
                  </span>
                  {canManage && (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as MemberRole)}
                      className="rounded-[5px] border border-ink-200 px-1.5 py-0.5 text-[13px] text-ink-600"
                    >
                      <option value="admin">Yönetici</option>
                      <option value="lawyer">Avukat</option>
                      <option value="staff">Personel</option>
                    </select>
                  )}
                  {canManage && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="flex items-center gap-1 text-[14px] font-medium text-red-500 hover:text-red-600"
                    >
                      <X size={13} /> Kaldır
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-[8px] bg-ink-50 p-4 text-[14px] text-ink-500">
        <Check size={14} className="mt-0.5 shrink-0 text-ink-400" />
        <div>
          <p className="font-medium text-ink-600">Roller</p>
          <p className="mt-0.5"><span className="font-medium">Yönetici:</span> Ekip üyelerini davet edebilir, rolleri değiştirebilir ve üyeleri kaldırabilir.</p>
          <p><span className="font-medium">Avukat:</span> Büro dosyalarına ve araçlara erişebilir, ekip yönetemez.</p>
          <p><span className="font-medium">Personel:</span> Sınırlı erişim, idari işlemleri yapabilir.</p>
        </div>
      </div>
    </AccountLayout>
  );
}
