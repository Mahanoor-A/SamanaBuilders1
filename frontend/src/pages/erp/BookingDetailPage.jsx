import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, FileText, User, Building2, GripHorizontal, DollarSign, Calendar, CheckCircle2, Clock, XCircle, CreditCard, Loader2 } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function BookingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('installments');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/bookings/${id}/`);
        setBooking(data);
      } catch {
        toast.error('Failed to load booking');
        navigate('/erp/bookings');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!booking) return null;

  const installments = booking.installments || [];
  const payments = booking.payments || [];

  const tabs = [
    { id: 'installments', label: 'Installments', count: installments.length, icon: Calendar },
    { id: 'payments', label: 'Payments', count: payments.length, icon: CreditCard },
  ];

  const statusIcon = {
    draft: Clock,
    confirmed: CheckCircle2,
    cancelled: XCircle,
  };
  const StatusIcon = statusIcon[booking.status] || FileText;

  return (
    <div>
      <PageHeader
        title={booking.booking_no || `Booking #${booking.id}`}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Bookings', to: '/erp/bookings' },
          { label: booking.booking_no || `#${booking.id}` },
        ]}
        actions={
          <button onClick={() => navigate(`/erp/bookings/${booking.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
            <Pencil className="w-4 h-4" /> Edit
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Customer Info */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Customer</p>
              <p className="font-semibold text-text-main">{booking.customer_name || booking.customer?.full_name || 'N/A'}</p>
            </div>
          </div>
          {booking.customer_phone && (
            <p className="text-sm text-text-muted">{booking.customer_phone}</p>
          )}
          {booking.customer_email && (
            <p className="text-sm text-text-muted">{booking.customer_email}</p>
          )}
        </div>

        {/* Plot Info */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
              <GripHorizontal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Plot</p>
              <p className="font-semibold text-text-main">{booking.plot_no || booking.plot?.plot_no || 'N/A'}</p>
            </div>
          </div>
          <p className="text-sm text-text-muted">{booking.project_name || booking.project?.name || ''}</p>
        </div>

        {/* Amount Info */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium">Total Amount</p>
              <p className="font-semibold text-text-main text-lg">PKR {Number(booking.total_amount || 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={booking.status || 'draft'} />
            <span className="text-xs text-text-muted">
              Down: PKR {Number(booking.down_payment || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
        <div className="border-b border-border">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-bg text-text-muted'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'installments' && (
            <div className="overflow-x-auto">
              {installments.length === 0 ? (
                <p className="text-center text-text-muted py-8">No installments defined</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Due Date</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {installments.map((inst, i) => {
                      const isPaid = inst.status === 'paid';
                      const isOverdue = !isPaid && inst.due_date && new Date(inst.due_date) < new Date();
                      return (
                        <tr key={i} className="hover:bg-bg/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-text-main">{inst.installment_no}</td>
                          <td className="px-4 py-3 text-sm text-text-muted">
                            {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-text-main text-right">
                            PKR {Number(inst.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={inst.status || (isOverdue ? 'overdue' : 'pending')} />
                          </td>
                          <td className="px-4 py-3 text-sm text-text-muted">
                            {inst.paid_amount ? `PKR ${Number(inst.paid_amount).toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-muted">{inst.description || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-bg/50">
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-text-main">Total</td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-main text-right">
                        PKR {installments.reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              {payments.length === 0 ? (
                <p className="text-center text-text-muted py-8">No payments recorded yet</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Reference</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {payments.map((pmt, i) => (
                      <tr key={i} className="hover:bg-bg/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-text-main">
                          {pmt.payment_date ? new Date(pmt.payment_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">{pmt.reference_no || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-text-main text-right">
                          PKR {Number(pmt.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">{pmt.payment_method || '-'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pmt.status || 'pending'} />
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">{pmt.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-bg/50">
                      <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-text-main">Total</td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-main text-right">
                        PKR {payments.reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}