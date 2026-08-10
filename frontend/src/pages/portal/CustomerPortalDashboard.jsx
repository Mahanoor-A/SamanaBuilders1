import { useEffect, useState } from 'react';
import {
  FileText, Wallet, TrendingDown, CalendarClock, AlertTriangle,
  Loader2, Briefcase, Mail, Phone, MapPin,
} from 'lucide-react';
import { portalAPI } from '../../services/api';
import StatusBadge from '../../components/erp/StatusBadge';
import DataTable from '../../components/erp/DataTable';
import { toast } from '../../utils/toast';

function StatCard({ icon: Icon, label, value, tone = 'text-text-main' }) {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
      </div>
      <p className={`text-2xl font-bold font-display ${tone}`}>{value}</p>
    </div>
  );
}

const formatRs = (v) => `Rs. ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CustomerPortalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await portalAPI.dashboard();
        setData(data);
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to load your data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24">
        <p className="text-text-muted">No customer data available for this account.</p>
      </div>
    );
  }

  const { customer, summary, bookings, payments, installments } = data;

  const bookingColumns = [
    { header: 'Booking', accessor: 'booking_id', cell: (r) => <span className="font-mono text-sm text-text-main">{r.booking_id}</span> },
    { header: 'Plot', accessor: 'plot_number', cell: (r) => <span className="text-sm text-text-main">{r.plot_number}</span> },
    { header: 'Project', accessor: 'project', cell: (r) => <span className="text-sm text-text-muted">{r.project || '-'}</span> },
    { header: 'Total', accessor: 'total_amount', cell: (r) => <span className="text-sm text-text-main">{formatRs(r.total_amount)}</span> },
    { header: 'Paid', accessor: 'advance_paid', cell: (r) => <span className="text-sm text-emerald-600 dark:text-emerald-400">{formatRs(r.advance_paid)}</span> },
    { header: 'Remaining', accessor: 'remaining_balance', cell: (r) => <span className={`text-sm font-semibold ${r.remaining_balance > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatRs(r.remaining_balance)}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const paymentColumns = [
    { header: 'Payment', accessor: 'payment_id', cell: (r) => <span className="font-mono text-sm text-text-main">{r.payment_id}</span> },
    { header: 'Booking', accessor: 'booking_id', cell: (r) => <span className="font-mono text-sm text-text-muted">{r.booking_id}</span> },
    { header: 'Amount', accessor: 'amount', cell: (r) => <span className="text-sm text-text-main">{formatRs(r.amount)}</span> },
    { header: 'Date', accessor: 'payment_date', cell: (r) => <span className="text-sm text-text-muted">{r.payment_date}</span> },
    { header: 'Method', accessor: 'payment_method', cell: (r) => <span className="text-sm text-text-muted">{r.payment_method}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
  ];

  const installmentColumns = [
    { header: 'Booking', accessor: 'booking_id', cell: (r) => <span className="font-mono text-sm text-text-main">{r.booking_id}</span> },
    { header: 'No.', accessor: 'installment_number', cell: (r) => <span className="text-sm text-text-muted">#{r.installment_number}</span> },
    { header: 'Due Date', accessor: 'due_date', cell: (r) => <span className="text-sm text-text-main">{r.due_date}</span> },
    { header: 'Amount', accessor: 'amount', cell: (r) => <span className="text-sm text-text-main">{formatRs(r.amount)}</span> },
    { header: 'Late Fee', accessor: 'late_fee', cell: (r) => <span className="text-sm text-text-muted">{formatRs(r.late_fee)}</span> },
    { header: 'Paid', accessor: 'paid_amount', cell: (r) => <span className="text-sm text-emerald-600 dark:text-emerald-400">{formatRs(r.paid_amount)}</span> },
    { header: 'Remaining', accessor: 'remaining_amount', cell: (r) => <span className={`text-sm font-medium ${r.remaining_amount > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatRs(r.remaining_amount)}</span> },
    { header: 'Status', accessor: 'status', cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome / profile */}
      <div className="bg-gradient-to-r from-primary via-primary-light to-primary/80 rounded-2xl p-6 lg:p-8 text-white shadow-lg animate-fade-in-up">
        <p className="text-sm text-white/70 mb-1">Welcome back</p>
        <h1 className="text-2xl lg:text-3xl font-bold font-display mb-4">{customer.full_name}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {customer.customer_id}</span>
          {customer.email && <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" /> {customer.email}</span>}
          {customer.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> {customer.phone}</span>}
          {customer.city && <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {customer.city}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Bookings" value={summary.total_bookings} />
        <StatCard icon={Wallet} label="Total Paid" value={formatRs(summary.total_paid)} tone="text-emerald-600 dark:text-emerald-400" />
        <StatCard icon={TrendingDown} label="Remaining Balance" value={formatRs(summary.remaining_balance)} tone={summary.remaining_balance > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'} />
        <StatCard icon={CalendarClock} label="Pending Installments" value={summary.pending_installments} />
      </div>

      {/* Next due / overdue alert */}
      {summary.next_due && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 animate-fade-in-up ${
          summary.overdue_installments > 0
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${summary.overdue_installments > 0 ? 'text-red-500' : 'text-amber-500'}`} />
          <p className={`text-sm ${summary.overdue_installments > 0 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {summary.overdue_installments > 0
              ? `You have ${summary.overdue_installments} overdue installment(s). Next due: ${formatRs(summary.next_due.remaining_amount)} on ${summary.next_due.due_date} (${summary.next_due.booking_id}).`
              : `Your next installment of ${formatRs(summary.next_due.remaining_amount)} is due on ${summary.next_due.due_date} (${summary.next_due.booking_id}).`}
          </p>
        </div>
      )}

      {/* My Bookings */}
      <div>
        <h2 className="text-lg font-semibold text-text-main font-display mb-3">My Bookings</h2>
        <DataTable columns={bookingColumns} data={bookings} searchable={false} emptyMessage="No bookings yet" />
      </div>

      {/* My Payments */}
      <div>
        <h2 className="text-lg font-semibold text-text-main font-display mb-3">My Payments</h2>
        <DataTable columns={paymentColumns} data={payments} searchable={false} emptyMessage="No payments yet" />
      </div>

      {/* Installments */}
      <div>
        <h2 className="text-lg font-semibold text-text-main font-display mb-3">Installment Schedule</h2>
        <DataTable columns={installmentColumns} data={installments} searchable={false} emptyMessage="No installments yet" />
      </div>
    </div>
  );
}