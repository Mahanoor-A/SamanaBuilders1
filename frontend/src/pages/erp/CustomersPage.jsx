import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Users, Phone, Mail, MapPin } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import ConfirmModal from '../../components/erp/ConfirmModal';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customers/');
      setCustomers(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/customers/${deleteTarget.id}/`);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'full_name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.image ? (
            <img
              src={row.image}
              alt={row.full_name || row.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-xs font-bold">
              {(row.full_name || row.name || '?')[0]}
            </div>
          )}
          <div>
            <p className="font-medium text-text-main">{row.full_name || row.name}</p>
            <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" /> {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      cell: (row) => (
        <span className="text-text-muted text-sm flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> {row.phone || '-'}
        </span>
      ),
    },
    {
      header: 'City',
      accessor: 'city',
      cell: (row) => (
        <span className="text-text-muted text-sm flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> {row.city || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      header: 'Created',
      accessor: 'created_at',
      cell: (row) => (
        <span className="text-text-muted text-sm">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</span>
      ),
    },
    {
      header: '',
      accessor: 'actions',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/erp/customers/${row.id}`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/erp/customers/${row.id}/edit`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Customers' }]}
        actions={
          <button
            onClick={() => navigate('/erp/customers/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchable
        searchPlaceholder="Search customers..."
        emptyMessage="No customers found"
        emptyIcon={Users}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete ${deleteTarget?.full_name || deleteTarget?.name}? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}
