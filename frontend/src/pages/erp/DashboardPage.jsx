import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Users,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Download,
  Calendar,
} from 'lucide-react';

const stats = [
  {
    label: 'Total Revenue',
    value: 'PKR 4.52 Cr',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Active Projects',
    value: '14',
    change: '+2 this month',
    trend: 'up',
    icon: Building2,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    label: 'Total Clients',
    value: '48',
    change: '+8.3%',
    trend: 'up',
    icon: Users,
    color: 'from-violet-500 to-purple-500',
  },
  {
    label: 'Pending Tasks',
    value: '23',
    change: '-5 from last week',
    trend: 'down',
    icon: ClipboardList,
    color: 'from-amber-500 to-orange-500',
  },
];

const recentProjects = [
  { name: 'Samana Enclave Phase II', status: 'In Progress', progress: 72, budget: '2.8 Cr', spent: '2.1 Cr' },
  { name: 'Green Valley Residency', status: 'Completed', progress: 100, budget: '1.2 Cr', spent: '1.15 Cr' },
  { name: 'Skyline Tower', status: 'In Progress', progress: 45, budget: '5.5 Cr', spent: '2.4 Cr' },
  { name: 'Al-Haram Heights', status: 'Planning', progress: 15, budget: '3.1 Cr', spent: '0.4 Cr' },
  { name: 'Lakeside Villas', status: 'In Progress', progress: 60, budget: '4.2 Cr', spent: '2.6 Cr' },
];

const statusBadge = (status) => {
  const styles = {
    'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'Completed': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'Planning': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  };
  return `px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${styles[status] || 'bg-primary/10 text-primary border-primary/20'}`;
};

function StatCard({ stat, index }) {
  const Icon = stat.icon;
  return (
    <div
      className="erp-card group animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg shadow-${stat.color.split(' ')[0]}/20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg ${
          stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {stat.change}
        </span>
      </div>
      <p className="text-sm text-text-muted mb-1">{stat.label}</p>
      <p className="text-2xl font-display font-bold text-text-main">{stat.value}</p>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-primary/5 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-text-main">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Welcome back! Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="erp-btn-secondary text-sm">
            <Calendar className="w-4 h-4" />
            This Month
          </button>
          <button className="erp-btn-secondary text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart / Revenue Area */}
        <div className="lg:col-span-2 erp-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-display font-semibold text-text-main">Revenue Overview</h3>
              <p className="text-xs text-text-muted mt-0.5">Monthly revenue for the current fiscal year</p>
            </div>
            <button className="text-text-muted hover:text-text-main transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          {/* Chart placeholder - glassmorphism bar chart */}
          <div className="relative h-48 flex items-end justify-between gap-2 px-2">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((month, i) => {
              const height = 30 + Math.sin(i * 0.8) * 25 + Math.random() * 20;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1 group/chart">
                  <div className="relative w-full max-w-[32px]">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-primary to-primary-light opacity-80 group-hover/chart:opacity-100 transition-all duration-300 cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-text-main text-white text-[10px] font-medium px-2 py-1 rounded-md opacity-0 group-hover/chart:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                      PKR {(height * 0.08).toFixed(1)}L
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="erp-card">
          <h3 className="text-base font-display font-semibold text-text-main mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'New Project', desc: 'Create a new construction project' },
              { label: 'Add Client', desc: 'Register a new client' },
              { label: 'Record Payment', desc: 'Log an incoming payment' },
              { label: 'Generate Report', desc: 'Export monthly summary' },
            ].map((action, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-border/50 hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-text-main">{action.label}</p>
                  <p className="text-xs text-text-muted truncate">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="erp-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-display font-semibold text-text-main">Recent Projects</h3>
            <p className="text-xs text-text-muted mt-0.5">Overview of active and completed projects</p>
          </div>
          <button className="erp-btn-secondary text-sm">View All</button>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="erp-table w-full">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Status</th>
                <th>Progress</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Spent</th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project, i) => (
                <tr key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                  <td>
                    <span className="font-medium text-text-main">{project.name}</span>
                  </td>
                  <td>
                    <span className={statusBadge(project.status)}>{project.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3 max-w-[140px]">
                      <ProgressBar value={project.progress} />
                      <span className="text-xs text-text-muted font-medium w-8 text-right">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="text-right font-medium text-text-main">{project.budget}</td>
                  <td className="text-right font-medium text-text-main">{project.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}