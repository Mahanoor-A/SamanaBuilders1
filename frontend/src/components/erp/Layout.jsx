import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErpThemeSwitcher from './ThemeSwitcher';
import {
  Bell,
  Search,
} from 'lucide-react';

function Header() {
  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6 gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-primary/5 border border-border/50 text-sm text-text-main placeholder:text-text-muted/60 focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-300"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ErpThemeSwitcher />

          <button
            className="relative w-9 h-9 rounded-xl bg-primary/5 border border-border/50 flex items-center justify-center text-text-muted hover:text-text-main hover:bg-primary/10 transition-all duration-300"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-danger text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
              3
            </span>
          </button>

          {/* Avatar */}
          <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-primary/5 transition-all duration-300">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold shadow-sm">
              A
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-sm font-medium text-text-main leading-tight">Admin</p>
              <p className="text-[10px] text-text-muted leading-tight">Super Admin</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function ErpLayout() {
  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="erp-content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}