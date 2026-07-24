import { useEffect, useRef } from 'react';
import { Building2, Palette, Home, TrendingUp, Shield, Briefcase, ArrowRight } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import SectionHeading from '../ui/SectionHeading';
import Card from '../ui/Card';

const services = [
  {
    icon: Home,
    title: 'Residential Construction',
    description: 'Premium housing projects designed for modern living with world-class amenities and sustainable design.',
  },
  {
    icon: Briefcase,
    title: 'Commercial Projects',
    description: 'State-of-the-art commercial spaces that drive business growth and create lasting value.',
  },
  {
    icon: Palette,
    title: 'Interior Design',
    description: 'Transform your spaces with our expert interior design team creating beautiful, functional environments.',
  },
  {
    icon: Building2,
    title: 'Property Management',
    description: 'Complete property management services ensuring your investments are well maintained and profitable.',
  },
  {
    icon: TrendingUp,
    title: 'Investment Consulting',
    description: 'Strategic real estate investment advice to maximize returns and build lasting wealth.',
  },
  {
    icon: Shield,
    title: 'Legal Advisory',
    description: 'Expert legal guidance for all real estate transactions ensuring smooth and secure deals.',
  },
];

export default function Services() {
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
    <section id="services" className="section-padding bg-surface" ref={sectionRef}>
      <div className="container-wide">
        <div className="animate-on-scroll visible">
          <SectionHeading
            title="Our Services"
            subtitle="Comprehensive real estate solutions tailored to your needs"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {services.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="animate-on-scroll visible"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card variant="elevated" hover className="p-8 h-full group cursor-pointer">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                  style={{ background: `${theme.colors.primary.DEFAULT}12` }}
                >
                  <Icon className="w-7 h-7" style={{ color: theme.colors.primary.DEFAULT }} />
                </div>
                <h3 className="font-display font-semibold text-xl text-text-main mb-3 group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed mb-4">
                  {description}
                </p>
                <div className="flex items-center gap-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0" style={{ color: theme.colors.primary.DEFAULT }}>
                  Learn More <ArrowRight className="w-4 h-4" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
