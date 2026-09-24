import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-ink-400" />
        <p className="text-[15px] text-ink-400">Yükleniyor…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!session) return <Navigate to="/login" replace />;

  if (!isAdmin) return <Navigate to="/account" replace />;

  return <>{children}</>;
}
