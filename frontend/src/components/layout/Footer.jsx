import { MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from 'react-icons/fa';

const quickLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Contact', href: '#contact' },
];

const services = [
  'Residential',
  'Commercial',
  'Interior Design',
  'Property Management',
  'Investment Consulting',
];

const contactItems = [
  { icon: MapPin, text: 'Main Boulevard, Gulberg III, Lahore, Pakistan' },
  { icon: Phone, text: '+92 300 123 4567' },
  { icon: Mail, text: 'info@samanabuilders.com' },
  { icon: Clock, text: 'Mon - Sat: 9:00 AM - 6:00 PM' },
];

const socials = [
  { icon: FaFacebookF, href: '#' },
  { icon: FaInstagram, href: '#' },
  { icon: FaTwitter, href: '#' },
  { icon: FaLinkedinIn, href: '#' },
];

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="font-serif font-bold text-lg text-white">
                Samana <span className="text-gold">Builders</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Building dreams and delivering trust since 2011. Premium real estate development creating iconic spaces across Pakistan.
            </p>
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:-translate-y-1"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-all duration-300 group"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    <span className="group-hover:translate-x-2 transition-transform">{link.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white mb-5">Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-gray-400 text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-semibold text-white mb-5">Contact Info</h4>
            <ul className="space-y-4">
              {contactItems.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-gold" />
                  <span className="text-gray-400 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Samana Builders & Developers (Pvt.) Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-gray-500 text-sm">
            <button className="hover:text-gray-300 transition-colors">Privacy Policy</button>
            <button className="hover:text-gray-300 transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
