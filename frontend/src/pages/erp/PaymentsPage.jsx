import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, FileText, User, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import SearchInput from '../../components/erp/SearchInput';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/payments/', { params });
      setPayments(Array.isArray(data) ? data : data.results ?? []);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.reference_no || '').toLowerCase().includes(q) ||
      (p.customer_name || '').toLowerCase().includes(q) ||
      (p.booking_no || '').toLowerCase().includes(q)
    );
  });

  const statuses = ['', 'pending', 'partial', 'paid', 'overdue', 'cancelled'];

  const columns = [
    {
      header: 'Reference',
      accessor: 'reference_no',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-text-main">{row.reference_no || `#${row.id}`}</p>
            <p className="text-xs text-text-muted">{new Date(row.payment_date || row.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-text-muted" />
          {row.customer_name || row.customer?.full_name || '-'}
        </span>
      ),
    },
    {
      header: 'Booking',
      accessor: 'booking_no',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-text-muted" />
          {row.booking_no || row.booking || '-'}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => (
        <span className="text-sm font-medium">PKR {Number(row.amount || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Method',
      accessor: 'payment_method',
      cell: (row) => (
        <span className="text-sm text-text-muted">{row.payment_method || '-'}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status || 'pending'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Manage payment records"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Payments' }]}
        actions={
          <button
            onClick={() => navigate('/erp/payments/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm mb-6 p-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search payments..." className="w-full sm:w-72" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-text-muted">Status:</span>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary text-white'
                    : 'bg-bg text-text-muted hover:bg-border'
                }`}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchable={false}
        emptyMessage="No payments found"
        emptyIcon={CreditCard}
        onRowClick={(row) => navigate(`/erp/payments/${row.id}`)}
      />
    </div>
  );
}