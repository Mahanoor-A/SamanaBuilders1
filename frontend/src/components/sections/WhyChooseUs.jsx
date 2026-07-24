import { useEffect, useRef } from 'react';
import { Award, Clock, BadgeDollarSign, Users } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import SectionHeading from '../ui/SectionHeading';

const features = [
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'Uncompromising quality standards in every project with premium materials and skilled craftsmanship.',
  },
  {
    icon: Clock,
    title: 'Timely Delivery',
    description: 'We respect your time. Our proven project management ensures on-time delivery, every time.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Transparent Pricing',
    description: 'No hidden costs. Clear, honest pricing with flexible payment plans tailored to your budget.',
  },
  {
    icon: Users,
    title: 'Expert Team',
    description: 'A dedicated team of architects, engineers, and consultants working to bring your vision to life.',
  },
];

export default function WhyChooseUs() {
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
    <section
      id="why-us"
      className="section-padding relative overflow-hidden"
      ref={sectionRef}
      style={{ background: theme.colors.text.DEFAULT }}
    >
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: theme.colors.primary.DEFAULT }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: theme.colors.primary.light }} />

      <div className="relative container-wide">
        <div className="animate-on-scroll visible">
          <SectionHeading
            title="Why Choose Us"
            subtitle="Trusted by thousands of families for exceptional quality and service"
            light
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {features.map(({ icon: Icon, title, description }, index) => (
            <div
              key={title}
              className="animate-on-scroll visible"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="group p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 h-full">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${theme.colors.primary.light}30` }}
                >
                  <Icon className="w-7 h-7" style={{ color: theme.colors.primary.lighter }} />
                </div>
                <h3 className="font-display font-semibold text-xl text-white mb-3">
                  {title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
