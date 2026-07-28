import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Building2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      navigate('/erp/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left - Branding / Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary/80">
        {/* Abstract decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Samana Builders</h1>
              <p className="text-white/70 text-sm">Enterprise Resource Planning</p>
            </div>
          </div>

          {/* Hero text */}
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Streamline Your<br />
            Construction Operations
          </h2>
          <p className="text-lg text-white/70 max-w-md mb-10">
            Manage projects, finances, clients, and inventory — all in one powerful platform.
          </p>

          {/* Feature highlights */}
          <div className="space-y-4">
            {[
              { label: 'Project Lifecycle Management', desc: 'Track every phase from blueprint to handover' },
              { label: 'Financial Oversight', desc: 'Budgets, invoices, payments in real-time' },
              { label: 'Client Portal', desc: 'Transparent communication with stakeholders' },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{feature.label}</p>
                  <p className="text-white/60 text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-text-main">Samana ERP</h1>
            </div>
          </div>

          {/* Glass form card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-light/20 rounded-3xl blur-xl opacity-60" />
            <div className="relative bg-surface/90 backdrop-blur-xl rounded-3xl border border-border p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-text-main mb-1">Welcome Back</h2>
                <p className="text-text-muted text-sm">Sign in to your ERP dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@samana.com"
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-main mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="erp-input w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-text-muted hover:text-text-main cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-primary hover:text-primary-light font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="erp-btn-primary w-full group"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted mt-8">
            &copy; {new Date().getFullYear()} Samana Builders & Developers. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}