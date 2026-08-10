import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, User, Mail, Phone, Building2, MapPin, FileText } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { toast } from '../../utils/toast';

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  alternate_phone: '',
  cnic: '',
  address: '',
  city: '',
  notes: '',
  is_active: true,
};

export default function CustomerFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.cnic.trim()) errs.cnic = 'CNIC is required';
    else if (!/^\d{5}-\d{7}-\d{1}$/.test(form.cnic)) errs.cnic = 'CNIC format: XXXXX-XXXXXXX-X';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      await api.post('/customers/', form);
      toast.success('Customer created');
      navigate('/erp/customers');
    } catch (err) {
      const detail = err.response?.data;
      const fieldErrors = {};
      if (typeof detail === 'object' && detail) {
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
      }
      setErrors(fieldErrors);
      toast.error('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (err) =>
    `peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
      err ? 'border-red-400' : 'border-border focus:border-primary'
    }`;

  const labelClass = 'absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5';

  return (
    <div>
      <PageHeader
        title="Add Customer"
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Customers', to: '/erp/customers' },
          { label: 'New' },
        ]}
      />

      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button onClick={() => navigate('/erp/customers')}
              className="p-2 rounded-lg hover:bg-border transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">Add New Customer</h2>
              <p className="text-sm text-text-muted">Enter the customer details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="relative">
                  <input type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder=" "
                    className={inputClass(errors.first_name)} />
                  <label className={labelClass}><User className="w-3.5 h-3.5" /> First Name <span className="text-red-400">*</span></label>
                </div>
                {errors.first_name && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.first_name}</p>}
              </div>

              <div>
                <div className="relative">
                  <input type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder=" "
                    className={inputClass(errors.last_name)} />
                  <label className={labelClass}><User className="w-3.5 h-3.5" /> Last Name <span className="text-red-400">*</span></label>
                </div>
                {errors.last_name && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.last_name}</p>}
              </div>

              <div>
                <div className="relative">
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder=" "
                    className={inputClass(errors.email)} />
                  <label className={labelClass}><Mail className="w-3.5 h-3.5" /> Email <span className="text-red-400">*</span></label>
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email}</p>}
              </div>

              <div>
                <div className="relative">
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder=" "
                    className={inputClass(errors.phone)} />
                  <label className={labelClass}><Phone className="w-3.5 h-3.5" /> Phone <span className="text-red-400">*</span></label>
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.phone}</p>}
              </div>

              <div>
                <div className="relative">
                  <input type="text" name="alternate_phone" value={form.alternate_phone} onChange={handleChange} placeholder=" "
                    className={inputClass('')} />
                  <label className={labelClass}><Phone className="w-3.5 h-3.5" /> Alternate Phone</label>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input type="text" name="cnic" value={form.cnic} onChange={handleChange} placeholder=" "
                    className={inputClass(errors.cnic)} />
                  <label className={labelClass}><FileText className="w-3.5 h-3.5" /> CNIC <span className="text-red-400">*</span></label>
                </div>
                {errors.cnic && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.cnic}</p>}
              </div>

              <div className="md:col-span-2">
                <div className="relative">
                  <input type="text" name="address" value={form.address} onChange={handleChange} placeholder=" "
                    className={inputClass('')} />
                  <label className={labelClass}><MapPin className="w-3.5 h-3.5" /> Address</label>
                </div>
              </div>

              <div>
                <div className="relative">
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder=" "
                    className={inputClass('')} />
                  <label className={labelClass}><Building2 className="w-3.5 h-3.5" /> City</label>
                </div>
              </div>

              <div>
                <div className="relative">
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder=" "
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none" />
                  <label className={labelClass}><FileText className="w-3.5 h-3.5" /> Notes</label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                  className="sr-only peer" />
                <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
              <span className="text-sm font-medium text-text-main">Active</span>
              <span className="text-xs text-text-muted">Customer is eligible for bookings</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/erp/customers')}
                className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}