import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, Users, Mail, Phone, Loader2 } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import StatusBadge from '../../components/erp/StatusBadge';
import CustomerProfileModal from '../../components/erp/CustomerProfileModal';
import { toast } from '../../utils/toast';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customers/');
      setCustomers(Array.isArray(data) ? data : data.results ?? []);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const columns = [
    {
      header: 'Customer',
      accessor: 'customer_id',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {(row.full_name || row.first_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text-main">{row.full_name || `${row.first_name} ${row.last_name}`}</p>
            <p className="text-xs text-text-muted font-mono">{row.customer_id}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      cell: (row) => (
        <span className="text-sm text-text-muted flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> {row.email || '-'}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      cell: (row) => (
        <span className="text-sm text-text-muted flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> {row.phone || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => row.is_active ? <StatusBadge status="active" /> : <StatusBadge status="inactive" />,
    },
    {
      header: 'Bookings',
      accessor: 'total_bookings',
      cell: (row) => <span className="text-sm font-medium text-text-main">{row.total_bookings ?? 0}</span>,
    },
    {
      header: 'Balance',
      accessor: 'current_balance',
      cell: (row) => (
        <span className={`text-sm font-semibold ${(row.current_balance ?? 0) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
          Rs. {Number(row.current_balance ?? 0).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customers and portal access"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Customers' }]}
        actions={
          <>
            <button
              onClick={() => navigate('/erp/customers/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
            >
              <Plus className="w-4 h-4" /> Add Customer
            </button>
            <button
              onClick={() => setProfileModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
            >
              <UserPlus className="w-4 h-4" /> Create Customer Profile
            </button>
          </>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          searchable
          searchPlaceholder="Search customers..."
          emptyMessage="No customers found"
          emptyIcon={Users}
          onRowClick={(row) => navigate(`/erp/bookings?customer=${row.id}`)}
        />
      )}

      <CustomerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onCreated={() => { fetch(); }}
      />
    </div>
  );
}