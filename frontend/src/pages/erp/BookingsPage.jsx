import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, User, Building2, GripHorizontal } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import SearchInput from '../../components/erp/SearchInput';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function BookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/bookings/', { params });
      setBookings(Array.isArray(data) ? data : data.results ?? []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.booking_no || '').toLowerCase().includes(q) ||
      (b.customer_name || b.customer?.full_name || '').toLowerCase().includes(q) ||
      (b.plot_no || b.plot?.plot_no || '').toLowerCase().includes(q)
    );
  });

  const statuses = ['', 'draft', 'confirmed', 'cancelled', 'completed'];

  const columns = [
    {
      header: 'Booking No',
      accessor: 'booking_no',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-text-main">{row.booking_no || `#${row.id}`}</p>
            <p className="text-xs text-text-muted">{new Date(row.created_at || row.booking_date).toLocaleDateString()}</p>
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
      header: 'Plot',
      accessor: 'plot_no',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <GripHorizontal className="w-3.5 h-3.5 text-text-muted" />
          {row.plot_no || row.plot?.plot_no || '-'}
        </span>
      ),
    },
    {
      header: 'Project',
      accessor: 'project_name',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-text-muted" />
          {row.project_name || row.project?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessor: 'total_amount',
      cell: (row) => (
        <span className="text-sm font-medium">PKR {Number(row.total_amount || 0).toLocaleString()}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status || 'draft'} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Manage property bookings and installment plans"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Bookings' }]}
        actions={
          <button
            onClick={() => navigate('/erp/bookings/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> New Booking
          </button>
        }
      />

      {/* Filters */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm mb-6 p-4 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search bookings..." className="w-full sm:w-72" />
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
        emptyMessage="No bookings found"
        emptyIcon={FileText}
        onRowClick={(row) => navigate(`/erp/bookings/${row.id}`)}
      />
    </div>
  );
}