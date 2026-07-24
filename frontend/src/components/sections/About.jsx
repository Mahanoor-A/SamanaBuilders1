import { useEffect, useRef } from 'react';
import { TrendingUp, Users, Calendar, CheckCircle2 } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import SectionHeading from '../ui/SectionHeading';

const stats = [
  { icon: TrendingUp, value: '150+', label: 'Projects Completed' },
  { icon: Users, value: '2,000+', label: 'Happy Families' },
  { icon: Calendar, value: '15+', label: 'Years Experience' },
];

export default function About() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" className="section-padding bg-bg" ref={sectionRef}>
      <div className="container-wide">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="animate-on-scroll visible">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-1 rounded-full" style={{ background: theme.gradients.primary }} />
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.primary.DEFAULT }}>
                About Us
              </span>
            </div>

            <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-text-main mb-6 leading-tight">
              Crafting Excellence in{' '}
              <span className="text-gradient">Real Estate</span>
            </h2>

            <p className="text-text-muted leading-relaxed mb-4">
              Since 2011, Samana Builders & Developers has been at the forefront of Pakistan&apos;s real estate revolution. We create living spaces that blend architectural innovation with uncompromising quality, setting new standards in the industry.
            </p>
            <p className="text-text-muted leading-relaxed mb-8">
              Our commitment to transparency, timely delivery, and customer satisfaction has earned the trust of over 2,000 families. Every project we undertake reflects our passion for excellence and our dedication to building communities, not just structures.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <Icon className="w-5 h-5" style={{ color: theme.colors.primary.DEFAULT }} />
                  </div>
                  <div className="text-2xl md:text-3xl font-display font-bold text-text-main">{value}</div>
                  <div className="text-sm text-text-muted mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Image Card */}
          <div className="relative animate-on-scroll visible" style={{ animationDelay: '0.2s' }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                alt="Modern residential building"
                className="w-full h-[400px] md:h-[500px] object-cover"
                loading="lazy"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${theme.colors.text.DEFAULT}80, transparent)` }}
              />
            </div>

            {/* Floating stat card */}
            <div
              className="absolute -bottom-6 -left-6 right-8 md:right-auto md:left-auto md:-right-6 p-6 rounded-2xl shadow-xl animate-float"
              style={{ backgroundColor: theme.colors.surface }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: `${theme.colors.primary.DEFAULT}15` }}
                >
                  <CheckCircle2 className="w-7 h-7" style={{ color: theme.colors.primary.DEFAULT }} />
                </div>
                <div>
                  <div className="font-display font-bold text-xl text-text-main">A+ Grade</div>
                  <div className="text-sm text-text-muted">Quality Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
