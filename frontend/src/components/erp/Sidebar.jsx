import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Building2, CreditCard,
  ClipboardList, ChevronLeft, Menu, LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/erp' },
  { label: 'Customers', icon: Users, path: '/erp/customers' },
  { label: 'Bookings', icon: FileText, path: '/erp/bookings' },
  { label: 'Properties', icon: Building2, path: '/erp/properties' },
  { label: 'Payments', icon: CreditCard, path: '/erp/payments' },
  { label: 'Users', icon: ClipboardList, path: '/erp/users' },
  { label: 'Audit Logs', icon: ClipboardList, path: '/erp/audit-logs' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } bg-surface border-r border-border flex flex-col transition-all duration-300 shrink-0`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <span className="text-lg font-bold font-display text-text-main tracking-tight">
            Samana ERP
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-border transition-colors text-text-muted"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-text-muted hover:bg-primary/5 hover:text-text-main'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-primary/5 hover:text-text-main transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Exit ERP</span>}
        </button>
      </div>
    </aside>
  );
}
