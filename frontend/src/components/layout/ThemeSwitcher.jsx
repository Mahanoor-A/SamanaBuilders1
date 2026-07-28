import { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

export default function ThemeSwitcher({ light = false, iconOnly = false }) {
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

  const btnClass = iconOnly
    ? (light
      ? 'flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300'
      : 'flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text-main hover:bg-primary/10 transition-all duration-300')
    : (light
      ? 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300'
      : 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-main hover:bg-primary/10 transition-all duration-300');

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={btnClass}
        title="Change theme"
      >
        <div
          className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ background: theme.colors.primary.DEFAULT }}
        />
        {!iconOnly && (
          <>
            <span className="hidden lg:inline whitespace-nowrap">{theme.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-2xl overflow-hidden z-50 animate-fade-in">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
              <Palette className="w-3 h-3" />
              Themes
            </div>
          </div>
          <div className="p-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  theme.id === t.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text-main hover:bg-primary/5'
                }`}
              >
                <div className="flex gap-0.5">
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ background: t.colors.primary.DEFAULT }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm -ml-1.5"
                    style={{ background: t.colors.primary.light }}
                  />
                </div>
                <span className="flex-1 text-left">{t.name}</span>
                {theme.id === t.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
