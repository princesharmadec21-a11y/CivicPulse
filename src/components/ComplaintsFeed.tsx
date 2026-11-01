import React, { useState } from 'react';
import {
  Search,
  Filter,
  ThumbsUp,
  MapPin,
  Clock,
  ArrowUpDown,
  Building2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CivicIssue, CivicCategory, CivicPriority, CivicStatus } from '../types/civic';

interface ComplaintsFeedProps {
  complaints: CivicIssue[];
  onSelectComplaint: (complaint: CivicIssue) => void;
  onVote: (complaintId: string) => void;
  onOpenReportModal: () => void;
}

export const ComplaintsFeed: React.FC<ComplaintsFeedProps> = ({
  complaints,
  onSelectComplaint,
  onVote,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'mostVoted' | 'priority'>('newest');

  // Filter & Sort
  const filtered = complaints.filter((c) => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;
    if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.location.address && c.location.address.toLowerCase().includes(q)) ||
        (c.location.ward && c.location.ward.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const priorityOrder: Record<CivicPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  filtered.sort((a, b) => {
    if (sortBy === 'mostVoted') return b.votes - a.votes;
    if (sortBy === 'priority') return priorityOrder[b.priority] - priorityOrder[a.priority];
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reported Civic Grievances
          </h1>
          <p className="text-xs text-slate-500">
            Real-time public infrastructure tracker across Lucknow Municipal Zones
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="self-start md:self-auto flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Report New Grievance</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, street name, ward or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Road Damage">🚧 Road Damage</option>
            <option value="Waste Issue">🗑️ Waste Issue</option>
            <option value="Water Supply & Leakage">💧 Water Supply & Leak</option>
            <option value="Electrical & Street Light">⚡ Streetlight & Wire</option>
            <option value="Sanitation & Drainage">🌊 Drainage Overflow</option>
            <option value="Public Property">🏛️ Public Property</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Verified">Verified</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="mostVoted">Sort: Most Supported</option>
            <option value="priority">Sort: Highest Priority</option>
          </select>
        </div>
      </div>

      {/* Grid of Complaints */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <p className="text-sm font-bold text-slate-700">No civic grievances match your filters.</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing search terms or selected categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isResolved = item.status === 'Resolved';
            const isCritical = item.priority === 'Critical';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer"
                onClick={() => onSelectComplaint(item)}
              >
                {/* Photo Thumbnail */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Ticket Badge */}
                  <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs text-white font-mono text-[11px] font-black px-2.5 py-1 rounded-lg">
                    #{item.ticketNumber}
                  </div>

                  {/* Priority Badge */}
                  <div
                    className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-md text-white shadow-xs ${
                      isCritical
                        ? 'bg-rose-600 animate-pulse'
                        : item.priority === 'High'
                        ? 'bg-amber-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {item.priority}
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute bottom-3 left-3">
                    <span
                      className={`inline-flex items-center space-x-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                        isResolved
                          ? 'bg-emerald-600/90 text-white'
                          : 'bg-white/95 text-slate-800'
                      }`}
                    >
                      {isResolved && <CheckCircle2 className="w-3 h-3 text-white inline mr-0.5" />}
                      <span>{item.status}</span>
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400 mb-1">
                      <span className="text-blue-600 font-extrabold">{item.category}</span>
                      <span>•</span>
                      <span>{item.department.split('&')[0]}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-slate-600 text-xs line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Location & Meta info */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span className="truncate">{item.location.address || item.location.ward}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVote(item.id);
                        }}
                        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          item.userVoted
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{item.votes}</span>
                      </button>

                      <div className="flex items-center space-x-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Track</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
