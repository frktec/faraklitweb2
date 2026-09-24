export type AccountType = 'individual' | 'organization';
export type UserRole = 'user' | 'admin';
export type MemberRole = 'admin' | 'lawyer' | 'staff';

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_period: string;
  user_limit: number;
  device_limit: number;
  storage_gb: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  included_credits: number;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  bar_association: string;
  bar_registry_number: string;
  account_type: AccountType;
  role: UserRole;
  hashtag: string;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  tax_id: string;
  tax_office: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  owner_id: string;
  created_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  profile?: Profile;
};

export type InvitationStatus = 'pending' | 'accepted' | 'revoked';

export type OrganizationInvitation = {
  id: string;
  organization_id: string;
  email: string;
  role: MemberRole;
  invited_by: string;
  status: InvitationStatus;
  invite_token: string;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  organization_id: string | null;
  plan_id: string;
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  started_at: string;
  ends_at: string;
  auto_renew: boolean;
  cancelled_at: string | null;
  plan?: Plan;
};

export type License = {
  id: string;
  license_key: string;
  subscription_id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'expired' | 'cancelled';
  started_at: string;
  ends_at: string;
  device_count: number;
  plan?: Plan;
};

export type Device = {
  id: string;
  license_id: string;
  user_id: string;
  device_name: string;
  device_fingerprint: string;
  platform: 'windows' | 'macos' | 'linux';
  app_version: string;
  last_seen_at: string;
  is_active: boolean;
  created_at: string;
};

export type OrderType = 'new' | 'renewal' | 'plan_change' | 'credits';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export type BillingInfo = {
  name: string;
  tax_id: string;
  tax_office: string;
  address: string;
  city: string;
  phone: string;
  email: string;
};

export type Payment = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: string | null;
  order_number: string;
  order_type: OrderType;
  periods: number;
  credits: number;
  credit_package_id: string | null;
  target_subscription_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id: string;
  billing: Partial<BillingInfo>;
  paid_at: string | null;
  admin_note: string;
  created_at: string;
  plan?: Plan | null;
  credit_package?: CreditPackage | null;
};

export type CreditPackage = {
  id: string;
  slug: string;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
};

export type CreditWallet = {
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
};

export type CreditTransactionKind = 'purchase' | 'plan_grant' | 'usage' | 'admin_grant' | 'admin_deduct' | 'refund';

export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  kind: CreditTransactionKind;
  description: string;
  job_id: string | null;
  payment_id: string | null;
  created_by: string | null;
  created_at: string;
};

export type JobType = {
  key: string;
  label: string;
  credit_cost: number;
  is_active: boolean;
  sort_order: number;
};

export type Job = {
  id: string;
  user_id: string;
  organization_id: string | null;
  license_id: string | null;
  job_type: string;
  status: 'completed' | 'failed';
  quantity: number;
  credits_used: number;
  duration_ms: number | null;
  app_version: string;
  platform: string;
  created_at: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  account_type: AccountType;
  bar_association: string;
  created_at: string;
  organization_name: string | null;
  plan_name: string | null;
  license_id: string | null;
  license_status: License['status'] | null;
  license_ends_at: string | null;
  active_devices: number;
  last_activity: string | null;
  credit_balance: number;
  credits_spent: number;
  jobs_total: number;
  jobs_30d: number;
  total_paid_cents: number;
  pending_orders: number;
};

export type DashboardStats = {
  total_users: number;
  new_users_month: number;
  active_licenses: number;
  expiring_licenses: number;
  revenue_total: number;
  revenue_month: number;
  pending_orders: number;
  pending_amount: number;
  credits_outstanding: number;
  credits_used_month: number;
  jobs_month: number;
  jobs_total: number;
  revenue_by_month: { month: string; amount: number }[];
  jobs_by_day: { day: string; count: number; credits: number }[];
  jobs_by_type: { key: string; label: string; count: number; credits: number }[];
};

export type Invoice = {
  id: string;
  payment_id: string;
  user_id: string;
  invoice_number: string;
  amount_cents: number;
  currency: string;
  billing_name: string;
  billing_tax_id: string;
  billing_tax_office: string;
  billing_address: string;
  billing_city: string;
  billing_phone: string;
  billing_email: string;
  status: 'issued' | 'paid' | 'void';
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  user_id: string;
  organization_id: string | null;
  event_name: string;
  app_version: string;
  platform: string;
  created_at: string;
  profile?: Profile;
};

export type AdminAuditLog = {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: string;
  created_at: string;
};

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export type JoinRequest = {
  id: string;
  organization_id: string;
  user_id: string;
  requested_by: string;
  role: MemberRole;
  status: JoinRequestStatus;
  responded_at: string | null;
  created_at: string;
  organization?: { name: string };
  profile?: Profile;
  requester?: { full_name: string };
};

export type AppVersion = {
  id: string;
  version: string;
  platform: 'windows' | 'macos' | 'linux';
  release_date: string;
  min_supported_version: string;
  active_user_count: number;
  is_latest: boolean;
};
