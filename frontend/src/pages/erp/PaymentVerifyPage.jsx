import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, DollarSign, FileText, User } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/erp/PageHeader';
import StatusBadge from '../../components/erp/StatusBadge';
import { toast } from '../../utils/toast';

export default function PaymentVerifyPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/payments/${id}/`);
        setPayment(data);
      } catch {
        toast.error('Failed to load payment');
        navigate('/erp/payments');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleVerify = async (approved) => {
    try {
      setVerifying(true);
      await api.patch(`/payments/${id}/`, { status: approved ? 'paid' : 'cancelled' });
      toast.success(approved ? 'Payment verified' : 'Payment rejected');
      navigate('/erp/payments');
    } catch {
      toast.error('Failed to update payment');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div>
      <PageHeader
        title="Verify Payment"
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Payments', to: '/erp/payments' },
          { label: 'Verify' },
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
              <h2 className="text-lg font-semibold text-text-main font-display">Verify Payment</h2>
              <p className="text-sm text-text-muted">Review and approve/reject the payment</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Reference</p>
                <p className="text-sm font-semibold text-text-main">{payment.reference_no || `#${payment.id}`}</p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Date</p>
                <p className="text-sm font-semibold text-text-main">
                  {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                </p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Amount</p>
                <p className="text-sm font-semibold text-text-main flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  PKR {Number(payment.amount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Method</p>
                <p className="text-sm font-semibold text-text-main">{payment.payment_method || '-'}</p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Customer</p>
                <p className="text-sm font-semibold text-text-main flex items-center gap-1">
                  <User className="w-4 h-4 text-text-muted" />
                  {payment.customer_name || payment.customer?.full_name || '-'}
                </p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Booking</p>
                <p className="text-sm font-semibold text-text-main flex items-center gap-1">
                  <FileText className="w-4 h-4 text-text-muted" />
                  {payment.booking_no || payment.booking || '-'}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Current Status:</span>
              <StatusBadge status={payment.status || 'pending'} />
            </div>

            {payment.notes && (
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-text-muted font-medium mb-1">Notes</p>
                <p className="text-sm text-text-main">{payment.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                onClick={() => handleVerify(true)}
                disabled={verifying}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Approve Payment
              </button>
              <button
                onClick={() => handleVerify(false)}
                disabled={verifying}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <XCircle className="w-4 h-4" />
                Reject Payment
              </button>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-4">
          <button onClick={() => navigate('/erp/payments')}
            className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-main transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Payments
          </button>
        </div>
      </div>
    </div>
  );
}