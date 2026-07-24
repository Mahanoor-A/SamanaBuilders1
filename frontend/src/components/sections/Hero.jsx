import { useEffect, useRef } from 'react';
import { ArrowRight, Phone, ChevronDown, Sparkles } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

export default function Hero() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
          alt="Modern skyscrapers"
          className="w-full h-full object-cover"
          loading="eager"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: theme.gradients.hero, opacity: 0.85 }} />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-white/5 animate-float" />
      <div className="absolute bottom-1/3 right-16 w-32 h-32 rounded-full bg-white/5 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-2xl rotate-45 bg-white/5 animate-float" style={{ animationDelay: '4s' }} />

      {/* Content */}
      <div className="relative z-10 container-wide text-center">
        <div className="animate-on-scroll visible">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" style={{ color: theme.colors.primary.lighter }} />
            Welcome to Samana Builders
          </div>

          {/* Heading */}
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-6 leading-tight">
            Building{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.colors.primary.lighter}, white)`,
              }}
            >
              Dreams
            </span>
            ,<br />
            Delivering{' '}
            <span
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{
                backgroundImage: `linear-gradient(135deg, white, ${theme.colors.primary.lighter})`,
              }}
            >
              Trust
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium real estate development creating iconic residential and commercial spaces across Pakistan. Where quality meets excellence.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollTo('#projects')}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: theme.gradients.primary }}
            >
              Explore Projects
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollTo('#contact')}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              <Phone className="w-5 h-5" />
              Get in Touch
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => scrollTo('#about')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce cursor-pointer"
      >
        <ChevronDown className="w-8 h-8" />
      </button>
    </section>
  );
}
