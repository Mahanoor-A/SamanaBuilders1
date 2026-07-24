import { useEffect, useRef, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import useTheme from '../../hooks/useTheme';
import SectionHeading from '../ui/SectionHeading';
import { customerService } from '../../services/api';

export default function Contact() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await customerService.create(form);
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
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

  return (
    <section id="contact" className="section-padding bg-surface" ref={sectionRef}>
      <div className="container-wide">
        <div className="animate-on-scroll visible">
          <SectionHeading
            title="Get in Touch"
            subtitle="Ready to find your dream property? Contact us today."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mt-12">
          {/* Form */}
          <div className="animate-on-scroll visible" style={{ animationDelay: '0.1s' }}>
            {submitted ? (
              <div className="text-center py-16 px-8 bg-bg rounded-2xl">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: `${theme.colors.accent.success}15` }}
                >
                  <CheckCircle2 className="w-10 h-10" style={{ color: theme.colors.accent.success }} />
                </div>
                <h3 className="font-display font-bold text-2xl text-text-main mb-3">Thank You!</h3>
                <p className="text-text-muted">We&apos;ve received your message and will get back to you within 24 hours.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
                  style={{ background: theme.gradients.primary }}
                >
                  Send Another Message
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                    required
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-main mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-main mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Tell us about your requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-bg text-text-main placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-300 resize-none"
                    required
                  />
                </div>
                {error && <p className="text-sm" style={{ color: theme.colors.accent.danger }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: theme.gradients.primary }}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info Card */}
          <div className="animate-on-scroll visible" style={{ animationDelay: '0.2s' }}>
            <div className="text-white rounded-2xl p-8 md:p-10 h-full flex flex-col" style={{ background: theme.gradients.primary }}>
              <h3 className="font-display font-bold text-2xl mb-8">Contact Information</h3>

              <ul className="space-y-6 flex-1">
                {contactInfo.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10">
                      <Icon className="w-5 h-5" style={{ color: theme.colors.primary.lighter }} />
                    </div>
                    <span className="text-white/80 text-sm mt-2.5">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 pt-8 border-t border-white/20">
                <p className="text-white/60 text-sm mb-4">Follow Us</p>
                <div className="flex gap-3">
                  {socials.map(({ icon: Icon, href }, i) => (
                    <a
                      key={i}
                      href={href}
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300 hover:-translate-y-1"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>

              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-300"
              >
                WhatsApp Us
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
