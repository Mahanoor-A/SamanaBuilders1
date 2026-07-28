import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, FileText, Download, X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/customers/${id}/`);
        setCustomer(data);
      } catch {
        toast.error('Failed to load customer');
        navigate('/erp/customers');
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

  if (!customer) return null;

  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-text-main">{value || '-'}</p>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={customer.full_name || `${customer.first_name} ${customer.last_name}`}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Customers', to: '/erp/customers' },
          { label: customer.customer_id },
        ]}
        actions={
          <button
            onClick={() => navigate(`/erp/customers/${customer.id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 animate-fade-in-up">
          <div className="flex flex-col items-center text-center">
            {customer.image ? (
              <img
                src={customer.image}
                alt={customer.full_name}
                className="w-28 h-28 rounded-2xl object-cover border-4 border-primary/10 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {(customer.first_name || '?')[0]}
              </div>
            )}
            <h2 className="mt-4 text-xl font-bold text-text-main font-display">
              {customer.full_name}
            </h2>
            <p className="text-sm text-text-muted font-mono">{customer.customer_id}</p>
            <div className="mt-2">
              <StatusBadge status={customer.is_active ? 'active' : 'inactive'} />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-text-main">{customer.total_bookings || 0}</p>
              <p className="text-xs text-text-muted">Bookings</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-main">
                {customer.total_paid ? `PKR ${(customer.total_paid / 1000).toFixed(0)}K` : 'PKR 0'}
              </p>
              <p className="text-xs text-text-muted">Paid</p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-main">
                {customer.current_balance ? `PKR ${(customer.current_balance / 1000).toFixed(0)}K` : 'PKR 0'}
              </p>
              <p className="text-xs text-text-muted">Balance</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold text-text-main font-display uppercase tracking-wider">Customer Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoField label="First Name" value={customer.first_name} />
            <InfoField label="Last Name" value={customer.last_name} />
            <InfoField label="Email" value={customer.email} />
            <InfoField label="Phone" value={customer.phone} />
            <InfoField label="Alternate Phone" value={customer.alternate_phone} />
            <InfoField label="CNIC" value={customer.cnic} />
            <div className="md:col-span-2">
              <InfoField label="Address" value={customer.address} />
            </div>
            <InfoField label="City" value={customer.city} />
            {customer.notes && (
              <div className="md:col-span-2">
                <InfoField label="Notes" value={customer.notes} />
              </div>
            )}
            <InfoField
              label="Created"
              value={customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            />
            <InfoField
              label="Updated"
              value={customer.updated_at ? new Date(customer.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm animate-fade-in-up">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-text-main font-display uppercase tracking-wider">Uploaded Documents</h3>
        </div>
        <div className="p-5">
          {customer.document ? (
            <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-main truncate">
                  {customer.document_name || customer.document.split('/').pop()}
                </p>
                <p className="text-xs text-text-muted">Document</p>
              </div>
              <a
                href={customer.document}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            </div>
          ) : (
            <p className="text-center text-text-muted py-8">No documents uploaded</p>
          )}
        </div>
      </div>

      {lightboxOpen && customer.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={customer.image}
              alt={customer.full_name}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
