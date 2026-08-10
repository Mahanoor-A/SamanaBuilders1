import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, User, Mail, Lock, KeyRound, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { customerProfileAPI } from '../../services/api';
import { toast } from '../../utils/toast';

const emptyForm = {
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  customer: '',
};

export default function CustomerProfileModal({ isOpen, onClose, onCreated }) {
  const overlayRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(emptyForm);
    setErrors({});
    (async () => {
      try {
        setLoadingCustomers(true);
        const { data } = await api.get('/customers/', { params: { is_active: true } });
        setCustomers(Array.isArray(data) ? data : data.results ?? []);
      } catch {
        toast.error('Failed to load customers');
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (form.username && form.username.length < 3) errs.username = 'Username must be at least 3 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    if (form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    if (!form.customer) errs.customer = 'Select a customer';

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await customerProfileAPI.create({
        username: form.username,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        customer: form.customer,
      });
      toast.success(`Profile created for ${data.full_name} (${data.customer_id})`);
      onCreated?.();
      onClose();
    } catch (err) {
      const detail = err.response?.data;
      const fieldErrors = {};
      if (typeof detail === 'object' && detail) {
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
      }
      setErrors(fieldErrors);
      toast.error('Failed to create customer profile');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (err) =>
    `peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
      err ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-primary'
    }`;

  const labelClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-main font-display">Create Customer Profile</h3>
              <p className="text-xs text-text-muted">Give a customer login access to their portal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Customer */}
          <div>
            <div className="relative">
              <select name="customer" value={form.customer} onChange={handleChange}
                className={`w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none ${
                  errors.customer ? 'border-red-400' : 'border-border focus:border-primary'
                }`}>
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_id} — {c.full_name || `${c.first_name} ${c.last_name}`}
                  </option>
                ))}
              </select>
              <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                <User className="w-3 h-3" /> Customer <span className="text-red-400">*</span>
              </label>
            </div>
            {errors.customer && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.customer}</p>}
          </div>

          {/* Username */}
          <div>
            <div className="relative">
              <input type="text" name="username" value={form.username} onChange={handleChange} placeholder=" "
                className={inputClass(errors.username)} />
              <label className={labelClass}>
                <KeyRound className="w-3.5 h-3.5" /> Username <span className="text-red-400">*</span>
              </label>
            </div>
            {errors.username && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder=" "
                className={inputClass(errors.email)} />
              <label className={labelClass}>
                <Mail className="w-3.5 h-3.5" /> Email <span className="text-red-400">*</span>
              </label>
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <div className="relative">
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder=" "
                  className={inputClass(errors.password)} />
                <label className={labelClass}>
                  <Lock className="w-3.5 h-3.5" /> Password <span className="text-red-400">*</span>
                </label>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder=" "
                  className={inputClass(errors.confirm_password)} />
                <label className={labelClass}>
                  <Lock className="w-3.5 h-3.5" /> Confirm Password <span className="text-red-400">*</span>
                </label>
              </div>
              {errors.confirm_password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.confirm_password}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || loadingCustomers}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {submitting ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}