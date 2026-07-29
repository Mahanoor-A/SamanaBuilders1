import React from 'react';
import { DollarSign, BadgePercent, ArrowDownToLine, Calendar } from 'lucide-react';

export default function PaymentSummaryCard({
  propertyPrice, discount, finalPrice, downPayment,
  remainingAmount, monthlyInstallment, totalPaid, progressPercent
}) {
  const items = [
    { label: 'Property Price', value: propertyPrice, icon: DollarSign, highlight: false },
    { label: 'Discount', value: discount, icon: BadgePercent, highlight: false, negative: true },
    { label: 'Final Sale Price', value: finalPrice, icon: DollarSign, highlight: true },
    { label: 'Down Payment', value: downPayment, icon: ArrowDownToLine, highlight: false },
    { label: 'Remaining Amount', value: remainingAmount, icon: DollarSign, highlight: true },
  ];
  if (monthlyInstallment) {
    items.push({ label: 'Monthly Installment', value: monthlyInstallment, icon: Calendar, highlight: true });
  }
  if (totalPaid !== undefined) {
    items.push({ label: 'Total Paid', value: totalPaid, icon: DollarSign, highlight: false, accent: true });
  }
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
      <h3 className="text-sm font-semibold text-text-main font-display mb-4">Payment Summary</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label}
              className={`flex items-center justify-between p-2.5 rounded-xl ${
                item.highlight ? 'bg-primary/5 border border-primary/10' : ''
              } ${item.accent ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-primary' : item.accent ? 'text-emerald-600' : 'text-text-muted'}`} />
                <span className={`text-sm ${item.highlight ? 'font-semibold text-text-main' : 'text-text-muted'}`}>{item.label}</span>
              </div>
              <span className={`text-sm font-medium ${item.negative ? 'text-red-500' : item.accent ? 'text-emerald-600' : 'text-text-main'}`}>
                {item.value != null ? `PKR ${Number(item.value).toLocaleString()}` : '\u2014'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
