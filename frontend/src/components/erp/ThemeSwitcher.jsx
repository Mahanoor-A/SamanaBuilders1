import { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

export default function ErpThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-muted hover:text-text-main hover:bg-primary/5 transition-all duration-300 border border-border/50 hover:border-primary/20"
        title="Change theme"
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-white/30 shadow-sm ring-1 ring-black/5"
          style={{ background: theme.colors.primary.DEFAULT }}
        />
        <span className="hidden lg:inline whitespace-nowrap">{theme.name}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-surface rounded-2xl border border-border shadow-2xl shadow-black/5 overflow-hidden z-50 animate-scale-in origin-top-right">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5" />
              Theme
            </div>
          </div>
          <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  theme.id === t.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-main hover:bg-primary/5'
                }`}
              >
                <div className="flex gap-0.5 shrink-0">
                  <div
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
                    style={{ background: t.colors.primary.DEFAULT }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/30 shadow-sm -ml-1.5"
                    style={{ background: t.colors.primary.light }}
                  />
                </div>
                <span className="flex-1 text-left">{t.name}</span>
                {theme.id === t.id && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
                    <Check className="w-3 h-3 text-primary" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}