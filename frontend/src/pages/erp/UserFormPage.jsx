import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, Mail, Shield, Lock, KeyRound } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { toast } from '../../utils/toast';

const emptyForm = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role: 'user',
  is_active: true,
};

export default function UserFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/users/${id}/`);
        setForm({
          username: data.username || '',
          email: data.email || '',
          full_name: data.full_name || '',
          password: '',
          role: data.role || (data.is_staff ? 'admin' : 'user'),
          is_active: data.is_active ?? true,
        });
      } catch {
        toast.error('Failed to load user');
        navigate('/erp/users');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.username.trim()) errs.username = 'Username is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!isEdit && !form.password) errs.password = 'Password is required';
    if (form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await api.put(`/users/${id}/`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users/', payload);
        toast.success('User created');
      }
      navigate('/erp/users');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit User' : 'New User'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Users', to: '/erp/users' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button onClick={() => navigate('/erp/users')}
              className="p-2 rounded-lg hover:bg-border transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">
                {isEdit ? 'Edit User' : 'Create User'}
              </h2>
              <p className="text-sm text-text-muted">Fill in the user details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="md:col-span-2">
                <div className="relative">
                  <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder=" "
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                </div>
              </div>

              {/* Username */}
              <div>
                <div className="relative">
                  <input type="text" name="username" value={form.username} onChange={handleChange} placeholder=" "
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.username ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Username <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.username && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <div className="relative">
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder=" "
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.email ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder=" "
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.password ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Password {!isEdit && <span className="text-red-400">*</span>}
                    {isEdit && <span className="text-xs text-text-muted/50">(leave blank to keep)</span>}
                  </label>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.password}</p>}
              </div>

              {/* Role */}
              <div>
                <div className="relative">
                  <select name="role" value={form.role} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Role
                  </label>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                  className="sr-only peer" />
                <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span className="text-sm font-medium text-text-main">Active</span>
              <span className="text-xs text-text-muted">User can access the system</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/erp/users')}
                className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}