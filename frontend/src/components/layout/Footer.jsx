import { Building2, MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import useTheme from '../../hooks/useTheme';

const quickLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About Us', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Projects', href: '#projects' },
  { name: 'Contact', href: '#contact' },
];

const services = [
  'Residential Construction',
  'Commercial Projects',
  'Interior Design',
  'Property Management',
];

const socials = [
  { icon: FaFacebookF, href: '#' },
  { icon: FaInstagram, href: '#' },
  { icon: FaTwitter, href: '#' },
  { icon: FaLinkedinIn, href: '#' },
];

export default function Footer() {
  const { theme } = useTheme();

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative overflow-hidden" style={{ backgroundColor: theme.colors.text.DEFAULT }}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: theme.colors.primary.DEFAULT }} />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: theme.colors.primary.light }} />
      </div>

      <div className="relative container-wide pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: theme.gradients.primary }}
              >
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white">
                Samana <span style={{ color: theme.colors.primary.lighter }}>Builders</span>
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Building dreams and delivering trust since 2011. Premium real estate development creating iconic spaces across Pakistan.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 hover:-translate-y-1"
                  style={{ backgroundColor: `${theme.colors.primary.light}33` }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-all duration-300 group"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="group-hover:translate-x-2 transition-transform">{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-5">Our Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-white/60 text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-5">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary.lighter }} />
                <span className="text-white/60 text-sm">Main Boulevard, Gulberg III, Lahore, Pakistan</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.lighter }} />
                <span className="text-white/60 text-sm">+92 300 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.lighter }} />
                <span className="text-white/60 text-sm">info@samanabuilders.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.lighter }} />
                <span className="text-white/60 text-sm">Mon - Sat: 9:00 AM - 6:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Samana Builders & Developers (Pvt.) Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-white/40 text-sm">
            <button className="hover:text-white/70 transition-colors">Privacy Policy</button>
            <button className="hover:text-white/70 transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
