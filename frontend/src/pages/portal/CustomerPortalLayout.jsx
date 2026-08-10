import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Building2, LogOut, KeyRound, Loader2 } from 'lucide-react';
import { authAPI } from '../../services/api';
import { toast } from '../../utils/toast';

export default function CustomerPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authAPI.me();
        if (!data.is_customer) {
          navigate('/erp', { replace: true });
          return;
        }
        setUser(data);
      } catch {
        navigate('/erp/login', { replace: true, state: { from: location.pathname } });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      toast.success('Logged out');
    } catch { /* ignore */ }
    navigate('/erp/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-text-main font-display">Samana Builders</p>
              <p className="text-[11px] text-text-muted flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> Customer Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-xl bg-primary/5 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold">
                {(user?.full_name || 'C')[0].toUpperCase()}
              </div>
              <div className="text-left leading-tight">
                <p className="text-sm font-medium text-text-main">{user?.full_name}</p>
                <p className="text-[10px] text-text-muted">@{user?.username}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all duration-300 border border-border/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 lg:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-text-muted">
        &copy; {new Date().getFullYear()} Samana Builders &amp; Developers. All rights reserved.
      </footer>
    </div>
  );
}