import React from 'react';
import { Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function InstallmentSchedule({ installments = [], onReceivePayment }) {
  if (installments.length === 0) {
    return <div className="text-center py-8 text-text-muted text-sm">No installments scheduled yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">#</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Due Date</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Amount</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Late Fee</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Paid</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Status</th>
            {onReceivePayment && <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Action</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {installments.map((inst) => (
            <tr key={inst.installment_number || inst.id} className="hover:bg-bg/50 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-text-main">{inst.installment_number}</td>
              <td className="px-4 py-3 text-sm text-text-muted">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '-'}
                </div>
              </td>
              <td className="px-4 py-3 text-sm font-medium text-text-main text-right">
                PKR {Number(inst.amount).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted text-right">
                {Number(inst.late_fee || 0) > 0 ? `PKR ${Number(inst.late_fee).toLocaleString()}` : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted text-right">
                {Number(inst.paid_amount || 0) > 0 ? `PKR ${Number(inst.paid_amount).toLocaleString()}` : '-'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={inst.status || 'pending'} />
              </td>
              {onReceivePayment && (
                <td className="px-4 py-3">
                  {inst.status !== 'paid' && (
                    <button onClick={(e) => { e.stopPropagation(); onReceivePayment(inst); }}
                      className="text-xs font-medium text-primary hover:text-primary-light transition-colors">
                      Receive Payment
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
