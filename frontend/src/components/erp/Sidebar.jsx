import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  ClipboardList,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/erp/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/erp/projects', label: 'Projects', icon: Building2 },
  { to: '/erp/customers', label: 'Customers', icon: Users },
  { to: '/erp/finance', label: 'Finance', icon: DollarSign },
  { to: '/erp/inventory', label: 'Inventory', icon: ClipboardList },
  { to: '/erp/reports', label: 'Reports', icon: FileText },
  { to: '/erp/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-primary/10 text-primary shadow-sm'
        : 'text-text-muted hover:bg-primary/5 hover:text-text-main'
    } ${collapsed ? 'justify-center px-2' : ''}`;

  const sidebarContent = (
    <div className={`flex flex-col h-full ${collapsed ? 'w-[68px]' : 'w-60'} transition-all duration-300`}>
      {/* Logo area */}
      <div className={`flex items-center h-16 px-4 border-b border-border shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
        {collapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">S</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shrink-0">
              <span className="text-white font-display font-bold text-sm">S</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-display font-bold text-text-main leading-tight truncate">
                Samana ERP
              </h1>
              <p className="text-[10px] text-text-muted leading-tight">Builders & Developers</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClass}
            title={collapsed ? item.label : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle + Logout */}
      <div className="px-2 py-3 border-t border-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-primary/5 hover:text-text-main transition-all duration-300"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
        <NavLink
          to="/"
          className={linkClass}
          title="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-surface border-r border-border h-screen sticky top-0 z-30 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-xl bg-surface border border-border shadow-lg flex items-center justify-center text-text-main hover:bg-primary/5 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full bg-surface shadow-2xl animate-fade-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}