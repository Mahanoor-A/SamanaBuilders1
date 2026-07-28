import { useState, useEffect } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'Communities', href: '#communities' },
  { name: 'About', href: '#about' },
  { name: 'Projects', href: '#projects' },
  { name: 'Services', href: '#services' },
  { name: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );
    navLinks.forEach(({ href }) => {
      const el = document.querySelector(href);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const linkClass = (href) => {
    const isActive = activeSection === href.slice(1);
    return [
      'px-4 py-2 text-sm font-medium transition-colors duration-200 border-b-2',
      isActive ? 'border-gold' : 'border-transparent',
      scrolled
        ? 'text-gray-600 hover:text-gray-900'
        : 'text-white/80 hover:text-white',
    ].join(' ');
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-gray-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <button onClick={() => scrollTo('#home')} className="flex items-center gap-2 group">
              <span className="font-serif font-bold text-xl tracking-tight">
                <span className={scrolled ? 'text-gray-900' : 'text-white'}>Samana</span>{' '}
                <span className="text-gold">Builders</span>
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollTo(link.href)}
                  className={linkClass(link.href)}
                >
                  {link.name}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <ThemeSwitcher light={!scrolled} iconOnly />
              <a
                href="tel:+923001234567"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  scrolled ? 'text-gray-600 hover:text-gray-900' : 'text-white/80 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                0800-12345
              </a>
              <button
                onClick={() => scrollTo('#contact')}
                className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors duration-200"
              >
                Book Now
              </button>
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                scrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden bg-white flex flex-col items-center justify-center">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center gap-6">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollTo(link.href)}
                className={`text-2xl font-medium transition-colors border-b-2 ${
                  activeSection === link.href.slice(1)
                    ? 'border-gold text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>
          <div className="absolute bottom-12 flex flex-col items-center gap-4">
            <ThemeSwitcher iconOnly />
            <button
              onClick={() => scrollTo('#contact')}
              className="px-8 py-3 rounded-full bg-primary text-white text-base font-semibold hover:bg-primary-light transition-colors duration-200"
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
