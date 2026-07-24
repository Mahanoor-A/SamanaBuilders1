import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ArrowRight, MapPin, Building } from 'lucide-react';
import useTheme from '../../hooks/useTheme';
import SectionHeading from '../ui/SectionHeading';
import { projectService } from '../../services/api';

const features = [
  'Prime Location',
  'Modern Amenities',
  'Gated Community',
  'Flexible Payment Plans',
];

export default function ComingSoonProjects() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const [projects, setProjects] = useState([]);

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

  useEffect(() => {
    projectService.getAll()
      .then((res) => {
        const data = res.data.results || res.data;
        if (Array.isArray(data) && data.length > 0) setProjects(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="projects" className="section-padding bg-bg" ref={sectionRef}>
      <div className="container-wide">
        <div className="animate-on-scroll visible">
          <SectionHeading
            title="Coming Soon"
            subtitle="Exciting new projects on the horizon"
          />
        </div>

        {/* Featured Project - Samana Gold City */}
        <div className="mt-12 animate-on-scroll visible" style={{ animationDelay: '0.1s' }}>
          <div className="max-w-5xl mx-auto bg-surface rounded-3xl overflow-hidden shadow-2xl border border-border">
            <div className="grid md:grid-cols-2">
              {/* Image */}
              <div className="relative min-h-[300px] md:min-h-[400px]">
                <img
                  src="/goldcity.jpeg"
                  alt="Samana Gold City"
                  className="w-full h-full object-cover absolute inset-0"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/20 md:block hidden" />
                <div
                  className="absolute top-4 left-4 px-4 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm"
                  style={{
                    background: `${theme.colors.accent.warning}20`,
                    color: theme.colors.accent.warning,
                  }}
                >
                  Coming Soon
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5" style={{ color: theme.colors.primary.DEFAULT }} />
                  <span className="text-sm font-medium uppercase tracking-wider" style={{ color: theme.colors.primary.DEFAULT }}>
                    Featured Project
                  </span>
                </div>

                <h3 className="font-display font-bold text-3xl md:text-4xl text-text-main mb-4">
                  Samana Gold City
                </h3>

                <p className="text-text-muted leading-relaxed mb-6">
                  A landmark residential community offering luxury apartments and villas with world-class amenities, lush parks, and modern infrastructure. Your dream home awaits in this meticulously planned gated community.
                </p>

                <ul className="grid grid-cols-2 gap-3 mb-8">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-main">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.accent.success }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                  <MapPin className="w-4 h-4" />
                  <span>Prime Location, Lahore</span>
                </div>

                <button
                  onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl w-fit"
                  style={{ background: theme.gradients.primary }}
                >
                  Register Interest
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* API projects or placeholder cards */}
        {projects.length > 0 && (
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <div
                key={project.id || i}
                className="animate-on-scroll visible bg-surface rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300"
                style={{ animationDelay: `${(i + 1) * 0.1}s` }}
              >
                <h4 className="font-display font-semibold text-lg text-text-main mb-2">{project.name}</h4>
                <p className="text-text-muted text-sm">{project.description || 'Details coming soon.'}</p>
              </div>
            ))}
          </div>
        )}

        {/* Placeholder future projects */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Samana Green Valley', location: 'Islamabad' },
            { name: 'Samana Sky Residences', location: 'Lahore' },
          ].map((proj, i) => (
            <div
              key={proj.name}
              className="animate-on-scroll visible rounded-2xl border border-dashed border-border p-8 text-center hover:border-primary/40 transition-all duration-300"
              style={{ animationDelay: `${(i + 2) * 0.1}s` }}
            >
              <Building className="w-10 h-10 mx-auto mb-3" style={{ color: theme.colors.primary.lighter }} />
              <h4 className="font-display font-semibold text-lg text-text-main mb-1">{proj.name}</h4>
              <p className="text-text-muted text-sm mb-3">{proj.location}</p>
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: `${theme.colors.primary.DEFAULT}10`, color: theme.colors.primary.DEFAULT }}>
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
