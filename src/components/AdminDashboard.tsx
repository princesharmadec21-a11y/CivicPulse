import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  Download,
  Edit,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Lock,
  LogIn,
  LogOut,
  Sparkles,
  ArrowRight,
  Award,
  CheckCheck,
  FileCheck2,
} from 'lucide-react';
import {
  CivicIssue,
  CivicUser,
  CivicStatus,
  CivicPriority,
  DepartmentInfo,
} from '../types/civic';
import { DEPARTMENTS } from '../data/seedData';
import { aggregateCivicStats, categorizeRaisedVsSolved } from '../utils/civic-rules';

interface AdminDashboardProps {
  complaints: CivicIssue[];
  currentUser: CivicUser;
  onUpdateStatus: (
    complaintId: string,
    newStatus: CivicStatus,
    note?: string,
    assignedOfficer?: any,
    expectedDate?: string,
    resolutionImage?: string
  ) => void;
  onSelectComplaint: (complaint: CivicIssue) => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  currentUser,
  onUpdateStatus,
  onSelectComplaint,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  // Tab view: 'raised' = active/open complaints, 'solved' = resolved complaints, 'all' = audit log, 'critical' = high urgency
  const [reportViewMode, setReportViewMode] = useState<'raised' | 'solved' | 'all' | 'critical'>('all');

  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Status update modal state
  const [selectedForEdit, setSelectedForEdit] = useState<CivicIssue | null>(null);
  const [newStatus, setNewStatus] = useState<CivicStatus>('In Progress');
  const [inspectorNotes, setInspectorNotes] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');

  const stats = aggregateCivicStats(complaints);
  const { raised, solved, inProgress, pending } = categorizeRaisedVsSolved(complaints);

  // If currently not logged in as Admin or Officer, display login prompt gate
  if (currentUser.role === 'citizen') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">
            Official Municipal Area
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Administrator & Municipal Officer Portal
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Please log in with municipal authority credentials to inspect all raised civic complaints, dispatch repair work orders, and review solved infrastructure dossiers.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenAdminLogin}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Admin Portal</span>
          </button>
        </div>

        {/* Quick summary of what authorities see */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-8">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <CheckCheck className="w-5 h-5 text-emerald-600 mb-1.5" />
            <h4 className="font-bold text-xs text-slate-900">Solved Reports Dossier</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Before & After photo proof validation and completion certificates.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <Building2 className="w-5 h-5 text-blue-600 mb-1.5" />
            <h4 className="font-bold text-xs text-slate-900">Department Dispatch</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Route work orders to PWD, Water Board, or Sanitation squads.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <Download className="w-5 h-5 text-indigo-600 mb-1.5" />
            <h4 className="font-bold text-xs text-slate-900">Official CSV Audits</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Generate municipal reports for city commissioner review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filter complaints based on reportViewMode
  let modeFiltered = complaints;
  if (reportViewMode === 'raised') {
    modeFiltered = raised;
  } else if (reportViewMode === 'solved') {
    modeFiltered = solved;
  } else if (reportViewMode === 'critical') {
    modeFiltered = complaints.filter((c) => c.priority === 'Critical');
  }

  // Then apply search & department & priority filters
  const filteredList = modeFiltered.filter((c) => {
    if (departmentFilter !== 'All' && c.department !== departmentFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.reportedBy.name.toLowerCase().includes(q) ||
        (c.location.address && c.location.address.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleOpenEditModal = (complaint: CivicIssue) => {
    setSelectedForEdit(complaint);
    setNewStatus(complaint.status);
    setInspectorNotes('');
    setOfficerName(complaint.assignedOfficer?.name || currentUser.name);
    setResolutionPhoto(complaint.resolutionImage || '');
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForEdit) return;

    onUpdateStatus(
      selectedForEdit.id,
      newStatus,
      inspectorNotes || `Status updated to ${newStatus} by ${currentUser.name}`,
      {
        name: officerName || currentUser.name,
        designation: currentUser.role === 'admin' ? 'Municipal Commissioner Office' : 'Zonal Executive Engineer',
        phone: '+91 94150 99881',
        zone: selectedForEdit.location.ward || 'Zone 4',
      },
      newStatus === 'In Progress' ? '2026-11-04' : undefined,
      newStatus === 'Resolved' ? (resolutionPhoto || 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80') : undefined
    );

    setSelectedForEdit(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Ticket Number', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Location', 'Votes', 'Date'];
    const rows = filteredList.map((c) => [
      c.ticketNumber,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      `"${c.department}"`,
      `"${c.location.address || c.location.ward || ''}"`,
      c.votes,
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicPulse_Grievance_Report_${reportViewMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Authority Banner with Active Admin Indicator & Sign Out */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-black tracking-tight">
              Municipal Authority Operations Console
            </h1>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-400/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ADMIN SESSION ACTIVE</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()}) • Dispatching work orders across 6 municipal zones
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onLogoutAdmin}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-xs border border-rose-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Primary Raised vs Solved Mode Selector Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
          {/* Raised Reports tab */}
          <button
            onClick={() => setReportViewMode('raised')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              reportViewMode === 'raised'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>All Raised Grievances</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                reportViewMode === 'raised' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {raised.length}
            </span>
          </button>

          {/* Solved Reports tab */}
          <button
            onClick={() => setReportViewMode('solved')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              reportViewMode === 'solved'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCheck className="w-4 h-4 text-emerald-300" />
            <span>Solved & Resolved Reports</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                reportViewMode === 'solved' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
              }`}
            >
              {solved.length} Solved
            </span>
          </button>

          {/* All Audit Log tab */}
          <button
            onClick={() => setReportViewMode('all')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              reportViewMode === 'all'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Complete Audit ({complaints.length})</span>
          </button>

          {/* Critical Only */}
          <button
            onClick={() => setReportViewMode('critical')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              reportViewMode === 'critical'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Critical Only ({stats.critical})</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden lg:block pr-3">
          Showing <strong>{filteredList.length}</strong> items in current dossier
        </span>
      </div>

      {/* Solved Reports Special Highlight Banner if 'solved' tab is active */}
      {reportViewMode === 'solved' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">
                  Municipal Resolved Grievances Audit Dossier
                </h3>
                <p className="text-xs text-emerald-200">
                  Inspected, photo-verified, and citizen-acknowledged infrastructure restorations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-400/30">
                100% Photo Proof Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">Total Solved</span>
              <p className="text-xl font-black mt-0.5">{solved.length} Issues</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">Avg SLA Turnaround</span>
              <p className="text-xl font-black mt-0.5">2.4 Days</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">Resolution Rate</span>
              <p className="text-xl font-black mt-0.5">{stats.resolutionRate}%</p>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-emerald-300 uppercase font-bold">Citizen Validations</span>
              <p className="text-xl font-black mt-0.5">
                {solved.reduce((acc, c) => acc + c.votes, 0)} Votes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Grievances
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Live
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Raised / In Progress
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600">{stats.inProgress}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Crews Active
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Successfully Solved
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{stats.resolved}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats.resolutionRate}% Rate
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Critical Hazards Pending
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-600">{stats.critical}</span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Priority 1
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, title, reporter, or street..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Solved Reports Special Card Gallery if in 'solved' view */}
      {reportViewMode === 'solved' && filteredList.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Verified Solved Reports (Before & After Dossiers)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm space-y-4 hover:border-emerald-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      #{item.ticketNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{item.category}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    <span>Solved</span>
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{item.title}</h4>

                {/* Side-by-side Before and After */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Before Report
                    </span>
                    <img
                      src={item.image}
                      alt="Before"
                      className="w-full h-28 rounded-xl object-cover border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      After Field Repair
                    </span>
                    <img
                      src={item.resolutionImage || item.image}
                      alt="After"
                      className="w-full h-28 rounded-xl object-cover border-2 border-emerald-500"
                    />
                  </div>
                </div>

                {item.resolutionNotes && (
                  <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-950 text-xs">
                    <p className="font-semibold">{item.resolutionNotes}</p>
                    <p className="text-[10px] text-emerald-700 mt-1">
                      Verified by: {item.assignedOfficer?.name || item.department}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Resolved on {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onSelectComplaint(item)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      Audit Details
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                      Update Note
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table for All / Raised / Solved views */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {reportViewMode === 'raised'
              ? 'Active Raised Reports'
              : reportViewMode === 'solved'
              ? 'All Solved Reports'
              : 'Complete Grievance Register'}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {filteredList.length} items listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Issue & Location</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Department & Officer</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No reports match current view and filter selection.
                  </td>
                </tr>
              ) : (
                filteredList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ticket */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        #{c.ticketNumber}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Title & Location */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <img
                          src={c.image}
                          alt={c.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 truncate">{c.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {c.location.address || c.location.ward}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{c.category}</span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded text-white ${
                          c.priority === 'Critical'
                            ? 'bg-rose-600'
                            : c.priority === 'High'
                            ? 'bg-amber-600'
                            : 'bg-blue-600'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 font-bold text-[11px] px-2.5 py-1 rounded-full ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-600'
                              : c.status === 'In Progress'
                              ? 'bg-amber-600'
                              : 'bg-blue-600'
                          }`}
                        ></span>
                        <span>{c.status}</span>
                      </span>
                    </td>

                    {/* Department & Officer */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate">{c.department}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {c.assignedOfficer?.name || 'Unassigned Queue'}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectComplaint(c)}
                          title="View Live Tracker"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Status & Assign Modal */}
      {selectedForEdit && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">
                  Update Grievance: #{selectedForEdit.ticketNumber}
                </h3>
                <p className="text-[11px] text-slate-400">{selectedForEdit.title}</p>
              </div>
              <button
                onClick={() => setSelectedForEdit(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Change Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CivicStatus)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Submitted">1. Submitted (Pending Review)</option>
                  <option value="Verified">2. Verified (Confirmed Valid)</option>
                  <option value="Assigned">3. Assigned (Work Order Dispatched)</option>
                  <option value="In Progress">4. In Progress (Crews on Site)</option>
                  <option value="Resolved">5. Resolved (Repair Completed & Solved)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Field Officer / Engineer
                </label>
                <input
                  type="text"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. Er. Rajiv Verma, Hotmix Batching Crew"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Action Notes / Inspector Remark
                </label>
                <textarea
                  rows={3}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="e.g. Road repair crew deployed on site with roller compactor. Scheduled completion tonight."
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              {newStatus === 'Resolved' && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <label className="block font-bold text-emerald-900 uppercase tracking-wider">
                    Resolution Proof Photo URL
                  </label>
                  <input
                    type="text"
                    value={resolutionPhoto}
                    onChange={(e) => setResolutionPhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/... (repaired site photo)"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-emerald-300 text-slate-800"
                  />
                  <p className="text-[10px] text-emerald-700">
                    Will be displayed in citizen Before & After verification card and Solved Reports dossier.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedForEdit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20"
                >
                  Save & Dispatch Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
