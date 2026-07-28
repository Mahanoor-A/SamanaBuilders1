import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, User, Building2, GripHorizontal, DollarSign, Calendar } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { toast } from '../../utils/toast';

const emptyInstallment = { installment_no: 1, due_date: '', amount: '', description: '' };

const emptyForm = {
  customer: '',
  plot: '',
  project: '',
  total_amount: '',
  down_payment: '',
  status: 'draft',
  notes: '',
};

export default function BookingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [installments, setInstallments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [customers, setCustomers] = useState([]);
  const [plots, setPlots] = useState([]);
  const [projects, setProjects] = useState([]);

  // Load reference data
  useEffect(() => {
    (async () => {
      try {
        const [custRes, plotRes, projRes] = await Promise.all([
          api.get('/customers/'),
          api.get('/plots/'),
          api.get('/projects/'),
        ]);
        setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data.results ?? []);
        setPlots(Array.isArray(plotRes.data) ? plotRes.data : plotRes.data.results ?? []);
        setProjects(Array.isArray(projRes.data) ? projRes.data : projRes.data.results ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  // Load booking for edit
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/bookings/${id}/`);
        setForm({
          customer: data.customer || data.customer_id || '',
          plot: data.plot || data.plot_id || '',
          project: data.project || data.project_id || '',
          total_amount: data.total_amount ?? '',
          down_payment: data.down_payment ?? '',
          status: data.status || 'draft',
          notes: data.notes || '',
        });
        if (data.installments?.length) {
          setInstallments(data.installments.map((inst, i) => ({
            installment_no: inst.installment_no || i + 1,
            due_date: inst.due_date || '',
            amount: inst.amount ?? '',
            description: inst.description || '',
          })));
        } else {
          setInstallments([{ ...emptyInstallment }]);
        }
      } catch {
        toast.error('Failed to load booking');
        navigate('/erp/bookings');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  const validate = () => {
    const errs = {};
    if (!form.customer) errs.customer = 'Customer is required';
    if (!form.plot) errs.plot = 'Plot is required';
    if (!form.total_amount) errs.total_amount = 'Total amount is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleInstallmentChange = (idx, field, value) => {
    setInstallments((prev) =>
      prev.map((inst, i) => (i === idx ? { ...inst, [field]: value } : inst))
    );
  };

  const addInstallment = () => {
    setInstallments((prev) => [
      ...prev,
      { ...emptyInstallment, installment_no: prev.length + 1 },
    ]);
  };

  const removeInstallment = (idx) => {
    setInstallments((prev) =>
      prev.filter((_, i) => i !== idx).map((inst, i) => ({ ...inst, installment_no: i + 1 }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = {
        ...form,
        total_amount: Number(form.total_amount),
        down_payment: form.down_payment ? Number(form.down_payment) : undefined,
        installments: installments
          .filter((inst) => inst.amount && inst.due_date)
          .map((inst) => ({
            ...inst,
            amount: Number(inst.amount),
          })),
      };
      if (isEdit) {
        await api.put(`/bookings/${id}/`, payload);
        toast.success('Booking updated');
      } else {
        await api.post('/bookings/', payload);
        toast.success('Booking created');
      }
      navigate('/erp/bookings');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} booking`);
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
        title={isEdit ? 'Edit Booking' : 'New Booking'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Bookings', to: '/erp/bookings' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        {/* Main form */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button onClick={() => navigate('/erp/bookings')}
              className="p-2 rounded-lg hover:bg-border transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">
                {isEdit ? 'Edit Booking' : 'Create Booking'}
              </h2>
              <p className="text-sm text-text-muted">Booking details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer */}
              <div>
                <div className="relative">
                  <select name="customer" value={form.customer} onChange={handleChange}
                    className={`w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none ${
                      errors.customer ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name || c.name}</option>
                    ))}
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Customer <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.customer && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.customer}</p>}
              </div>

              {/* Project */}
              <div>
                <div className="relative">
                  <select name="project" value={form.project} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="">Select project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" /> Project
                  </label>
                </div>
              </div>

              {/* Plot */}
              <div>
                <div className="relative">
                  <select name="plot" value={form.plot} onChange={handleChange}
                    className={`w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none ${
                      errors.plot ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  >
                    <option value="">Select plot</option>
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.plot_no || p.name} {p.project_name ? `(${p.project_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    <GripHorizontal className="w-3 h-3" /> Plot <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.plot && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.plot}</p>}
              </div>

              {/* Total Amount */}
              <div>
                <div className="relative">
                  <input type="number" name="total_amount" value={form.total_amount} onChange={handleChange} placeholder=" " min="0"
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.total_amount ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Total Amount (PKR) <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.total_amount && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.total_amount}</p>}
              </div>

              {/* Down Payment */}
              <div>
                <div className="relative">
                  <input type="number" name="down_payment" value={form.down_payment} onChange={handleChange} placeholder=" " min="0"
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                    Down Payment (PKR)
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="relative">
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary">
                    Status
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <div className="relative">
                  <textarea name="notes" value={form.notes} onChange={handleChange} placeholder=" " rows={2}
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                  />
                  <label className="absolute left-4 top-4 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                    Notes
                  </label>
                </div>
              </div>
            </div>

            {/* Installment Plan */}
            <div className="border-t border-border pt-5 mt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-text-main font-display flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Installment Plan
                </h3>
                <button type="button" onClick={addInstallment}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Installment
                </button>
              </div>

              {installments.length === 0 && (
                <p className="text-sm text-text-muted text-center py-6">No installments added yet</p>
              )}

              <div className="space-y-3">
                {installments.map((inst, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-bg rounded-xl border border-border">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">#</label>
                        <div className="h-10 px-3 bg-surface border border-border rounded-lg flex items-center text-sm font-semibold text-text-main">
                          {inst.installment_no}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Due Date</label>
                        <input type="date" value={inst.due_date}
                          onChange={(e) => handleInstallmentChange(idx, 'due_date', e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Amount (PKR)</label>
                        <input type="number" value={inst.amount} min="0"
                          onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1">Description</label>
                        <input type="text" value={inst.description}
                          onChange={(e) => handleInstallmentChange(idx, 'description', e.target.value)}
                          placeholder="Optional"
                          className="w-full h-10 px-3 bg-surface border border-border rounded-lg text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeInstallment(idx)}
                      className="p-2 mt-6 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button type="button" onClick={() => navigate('/erp/bookings')}
                className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Update Booking' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}