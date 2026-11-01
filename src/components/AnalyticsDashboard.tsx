import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Clock,
  ShieldCheck,
  Building2,
  Users,
  Award,
  AlertOctagon,
  ArrowUpRight,
} from 'lucide-react';
import { CivicIssue, CivicUser } from '../types/civic';
import { DEPARTMENTS } from '../data/seedData';
import { aggregateCivicStats } from '../utils/civic-rules';

interface AnalyticsDashboardProps {
  complaints: CivicIssue[];
  users: CivicUser[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  complaints,
  users,
}) => {
  const stats = aggregateCivicStats(complaints);

  // Category breakdown calculation
  const categoriesList = [
    'Road Damage',
    'Waste Issue',
    'Water Supply & Leakage',
    'Electrical & Street Light',
    'Sanitation & Drainage',
    'Public Property',
  ];

  const categoryData = categoriesList.map((cat) => {
    const count = complaints.filter((c) => c.category === cat).length;
    const resolvedCount = complaints.filter((c) => c.category === cat && c.status === 'Resolved').length;
    const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
    return { name: cat, count, resolvedCount, percent };
  });

  // Top wards
  const wardsList = Object.entries(stats.wardCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            City Civic Health & Resolution Intelligence
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Data-driven resource allocation, infrastructure risk hotspots, and municipal department SLAs
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolution SLA</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">2.6 Days</div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-0.5 inline" />
            <span>18% faster than previous quarter</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Resolution Rate</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.resolutionRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats.resolved} of {stats.total} total filed grievances
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Community Engagement</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {complaints.reduce((acc, c) => acc + c.votes, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Citizen affected validations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AI Vision Accuracy</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">95.4%</div>
          <p className="text-[11px] text-slate-500 mt-1">Zero misrouted municipal work orders</p>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Type Frequency Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Most Reported Civic Defect Types
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              Volume Distribution
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryData.map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{cat.name}</span>
                  <span className="text-slate-500">
                    {cat.count} reports ({cat.percent}%)
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, cat.percent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area / Ward-wise Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Zone & Ward Vulnerability Index
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Hotspots
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {wardsList.map(([wardName, count], idx) => {
              const maxCount = wardsList[0] ? wardsList[0][1] : 1;
              const barPercent = Math.round((count / maxCount) * 100);

              return (
                <div key={wardName} className="flex items-center space-x-3 text-xs">
                  <span className="w-5 text-center font-bold text-slate-400">{idx + 1}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-800">{wardName}</span>
                      <span className="text-slate-600">{count} complaints</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department SLA Scorecard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Municipal Department Resolution SLA Scorecard
            </h3>
            <p className="text-[11px] text-slate-500">
              Benchmarked against standard municipal 72-hour turnaround charter
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
            6 Active Departments
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {DEPARTMENTS.map((dept) => (
            <div
              key={dept.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  {dept.name.split('(')[0]}
                </span>
                <span className="text-[10px] font-bold text-slate-500 font-mono">
                  {dept.avgResolutionDays}d avg
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{dept.headOfficer}</p>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="text-amber-700 font-bold">{dept.activeTickets} Active</span>
                <span className="text-emerald-700 font-bold">{dept.resolvedTickets} Resolved</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Contributor Leaderboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Top Citizen Guardians Leaderboard
            </h3>
            <p className="text-[11px] text-slate-500">
              Community members actively safeguarding city infrastructure
            </p>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {users.map((u, i) => (
            <div
              key={u.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center space-x-3"
            >
              <div className="relative">
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center">
                  #{i + 1}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">{u.name}</h4>
                <p className="text-[11px] text-amber-700 font-semibold">{u.badges[0] || 'Contributor'}</p>
                <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                  <span>{u.points} pts</span>
                  <span>•</span>
                  <span>{u.reportedCount} reported</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
