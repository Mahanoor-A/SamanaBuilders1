import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, DollarSign, CreditCard, FileText } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import { toast } from '../../utils/toast';

const emptyForm = {
  booking: '',
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'cash',
  reference_no: '',
  status: 'paid',
  notes: '',
};

export default function PaymentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [bookings, setBookings] = useState([]);
  const [bookingTotal, setBookingTotal] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/bookings/');
        const list = Array.isArray(data) ? data : data.results ?? [];
        setBookings(list);
      } catch { /* ignore */ }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setFetching(true);
        const { data } = await api.get(`/payments/${id}/`);
        setForm({
          booking: data.booking || data.booking_id || '',
          amount: data.amount ?? '',
          payment_date: data.payment_date?.split('T')[0] || '',
          payment_method: data.payment_method || 'cash',
          reference_no: data.reference_no || '',
          status: data.status || 'paid',
          notes: data.notes || '',
        });
      } catch {
        toast.error('Failed to load payment');
        navigate('/erp/payments');
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, navigate]);

  // When booking changes, show total amount
  useEffect(() => {
    if (!form.booking) { setBookingTotal(0); return; }
    const bk = bookings.find((b) => String(b.id) === String(form.booking));
    setBookingTotal(bk?.total_amount || 0);
  }, [form.booking, bookings]);

  const validate = () => {
    const errs = {};
    if (!form.booking) errs.booking = 'Booking is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Valid amount is required';
    if (!form.payment_date) errs.payment_date = 'Payment date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = { ...form, amount: Number(form.amount) };
      if (isEdit) {
        await api.put(`/payments/${id}/`, payload);
        toast.success('Payment updated');
      } else {
        await api.post('/payments/', payload);
        toast.success('Payment recorded');
      }
      navigate('/erp/payments');
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'object' && detail) {
        const fieldErrors = {};
        Object.entries(detail).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs.join(', ') : msgs;
        });
        setErrors(fieldErrors);
      }
      toast.error(`Failed to ${isEdit ? 'update' : 'record'} payment`);
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
        title={isEdit ? 'Edit Payment' : 'Record Payment'}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Payments', to: '/erp/payments' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
      />

      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="bg-surface rounded-2xl border border-border shadow-sm">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <button onClick={() => navigate('/erp/payments')}
              className="p-2 rounded-lg hover:bg-border transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-muted" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-text-main font-display">
                {isEdit ? 'Edit Payment' : 'Record Payment'}
              </h2>
              <p className="text-sm text-text-muted">Enter payment details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Booking */}
              <div className="md:col-span-2">
                <div className="relative">
                  <select name="booking" value={form.booking} onChange={handleChange}
                    className={`w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 appearance-none ${
                      errors.booking ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  >
                    <option value="">Select booking</option>
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.booking_no || `#${b.id}`} - {b.customer_name || b.customer?.full_name || ''}
                        {' | '}PKR {Number(b.total_amount || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Booking <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.booking && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.booking}</p>}
                {bookingTotal > 0 && (
                  <p className="text-xs text-text-muted mt-1 ml-1">
                    Booking total: PKR {bookingTotal.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <div className="relative">
                  <input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder=" " min="0" step="0.01"
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.amount ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Amount (PKR) <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.amount}</p>}
              </div>

              {/* Payment Date */}
              <div>
                <div className="relative">
                  <input type="date" name="payment_date" value={form.payment_date} onChange={handleChange} placeholder=" "
                    className={`peer w-full px-4 pt-6 pb-2 bg-bg border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
                      errors.payment_date ? 'border-red-400' : 'border-border focus:border-primary'
                    }`}
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                    Payment Date <span className="text-red-400">*</span>
                  </label>
                </div>
                {errors.payment_date && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.payment_date}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <div className="relative">
                  <select name="payment_method" value={form.payment_method} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="online">Online Payment</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="absolute left-4 top-2 text-xs text-primary flex items-center gap-1.5">
                    <CreditCard className="w-3 h-3" /> Payment Method
                  </label>
                </div>
              </div>

              {/* Reference No */}
              <div>
                <div className="relative">
                  <input type="text" name="reference_no" value={form.reference_no} onChange={handleChange} placeholder=" "
                    className="peer w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main placeholder-transparent focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                  <label className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/70 peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-text-muted transition-all duration-200">
                    Reference No
                  </label>
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="relative">
                  <select name="status" value={form.status} onChange={handleChange}
                    className="w-full px-4 pt-6 pb-2 bg-bg border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
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

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate('/erp/payments')}
                className="px-5 py-2.5 text-sm font-medium text-text-main bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEdit ? 'Update Payment' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}