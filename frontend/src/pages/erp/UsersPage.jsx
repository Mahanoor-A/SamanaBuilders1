import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, Shield, Mail, ShieldOff } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/erp/DataTable';
import PageHeader from '../../components/erp/PageHeader';
import ConfirmModal from '../../components/erp/ConfirmModal';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users/');
      setUsers(Array.isArray(data) ? data : data.results ?? []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/users/${deleteTarget.id}/`);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetch();
    } catch {
      toast.error('Failed to delete user');
    } finally { setDeleting(false); }
  };

  const columns = [
    {
      header: 'User',
      accessor: 'username',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
            {(row.full_name || row.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text-main">{row.full_name || row.username}</p>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <Mail className="w-3 h-3" /> {row.email || '-'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Username',
      accessor: 'username',
      cell: (row) => <span className="text-sm text-text-muted">{row.username}</span>,
    },
    {
      header: 'Role',
      accessor: 'role',
      cell: (row) => (
        <span className="text-sm flex items-center gap-1.5">
          <Shield className={`w-3.5 h-3.5 ${row.role === 'admin' ? 'text-amber-500' : 'text-text-muted'}`} />
          {row.role || row.is_staff ? 'admin' : 'user'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => (
        row.is_active
          ? <StatusBadge status="active" />
          : <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"><ShieldOff className="w-3 h-3" /> inactive</span>
      ),
    },
    {
      header: 'Joined',
      accessor: 'date_joined',
      cell: (row) => (
        <span className="text-sm text-text-muted">
          {row.date_joined ? new Date(row.date_joined).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      header: '',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/erp/users/${row.id}/edit`)}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(row)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-muted hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users and permissions"
        breadcrumbs={[{ label: 'ERP' }, { label: 'Users' }]}
        actions={
          <button
            onClick={() => navigate('/erp/users/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchable
        searchPlaceholder="Search users..."
        emptyMessage="No users found"
        emptyIcon={Users}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.full_name || deleteTarget?.username}? This action cannot be undone.`}
        isLoading={deleting}
      />
    </div>
  );
}