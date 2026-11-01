import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  UserCheck,
  Phone,
  ThumbsUp,
  AlertTriangle,
  Calendar,
  Share2,
  Printer,
  Sparkles,
  ShieldCheck,
  Send,
  MessageSquare,
} from 'lucide-react';
import { CivicIssue, CivicStatus } from '../types/civic';

interface ComplaintTrackerModalProps {
  complaint: CivicIssue | null;
  onClose: () => void;
  onVote: (complaintId: string) => void;
  currentUserRole?: string;
}

const STATUS_STEPS: { status: CivicStatus; label: string; description: string }[] = [
  {
    status: 'Submitted',
    label: 'Submitted',
    description: 'Ticket registered with GPS & photo evidence',
  },
  {
    status: 'Verified',
    label: 'Verified',
    description: 'Inspected & validated by municipal control room',
  },
  {
    status: 'Assigned',
    label: 'Assigned',
    description: 'Work order dispatched to zonal officer',
  },
  {
    status: 'In Progress',
    label: 'In Progress',
    description: 'Field repair team active on site',
  },
  {
    status: 'Resolved',
    label: 'Resolved',
    description: 'Completed, inspected & citizen verified',
  },
];

export const ComplaintTrackerModal: React.FC<ComplaintTrackerModalProps> = ({
  complaint,
  onClose,
  onVote,
  currentUserRole,
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ name: string; text: string; time: string }>>([
    {
      name: 'Rohan Verma',
      text: 'This issue is causing major traffic snarls during evening school rush. Thanks for filing!',
      time: '1 day ago',
    },
    {
      name: 'Local Resident Welfare Assn',
      text: 'We have also sent a representation to Ward Office. Hope work begins soon.',
      time: '6 hours ago',
    },
  ]);

  if (!complaint) return null;

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.status === complaint.status);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      {
        name: 'You (Citizen)',
        text: commentText.trim(),
        time: 'Just now',
      },
    ]);
    setCommentText('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-black bg-blue-600 px-2.5 py-1 rounded-lg tracking-wider">
              #{complaint.ticketNumber}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white tracking-tight">
                  Civic Resolution Tracker
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    complaint.status === 'Resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {complaint.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Reported on {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
                {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              title="Print Civic Receipt"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Issue Header Card */}
          <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <img
              src={complaint.image}
              alt={complaint.title}
              className="w-full md:w-48 h-36 rounded-xl object-cover shadow-sm shrink-0"
            />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {complaint.category}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded text-white ${
                    complaint.priority === 'Critical'
                      ? 'bg-rose-600'
                      : complaint.priority === 'High'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {complaint.priority} Urgency
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {complaint.department}
                </span>
              </div>

              <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                {complaint.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">{complaint.description}</p>

              <div className="flex items-center space-x-1.5 text-xs text-slate-500 pt-1">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>
                  {complaint.location.address || 'Lucknow City'}, {complaint.location.ward}
                </span>
              </div>
            </div>

            {/* Upvote & Engagement Action */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0 w-full md:w-36 text-center">
              <button
                type="button"
                onClick={() => onVote(complaint.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                  complaint.userVoted
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{complaint.userVoted ? 'Supported' : 'Support Issue'}</span>
              </button>
              <span className="text-[11px] font-extrabold text-slate-800 mt-2">
                {complaint.votes} Citizens Affected
              </span>
              <span className="text-[10px] text-slate-400">
                +{complaint.duplicateSupportersCount || 0} duplicate merges
              </span>
            </div>
          </div>

          {/* Stepper Timeline (Like delivery tracking) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Real-Time Status Milestones</span>
            </h4>

            <div className="relative">
              {/* Timeline connecting bar */}
              <div className="hidden sm:block absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100))}%`,
                  }}
                />
              </div>

              {/* Status Points */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                {STATUS_STEPS.map((stepItem, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={stepItem.status} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shrink-0 ${
                          isDone
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        } ${isCurrent ? 'scale-110 ring-4 ring-blue-200 bg-blue-600 text-white' : ''}`}
                      >
                        {isDone && !isCurrent ? '✓' : idx + 1}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-blue-600'
                              : isDone
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {stepItem.label}
                        </p>
                        <p className="text-[10px] text-slate-500 hidden sm:block leading-tight mt-0.5">
                          {stepItem.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Assigned Officer & SLA Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Officer Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Responsible Authority & Field Officer
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {complaint.assignedOfficer?.name || 'Zonal Field Team (Assigned on Queue)'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {complaint.assignedOfficer?.designation || complaint.department}
                  </p>
                  {complaint.assignedOfficer?.phone && (
                    <p className="text-[11px] text-blue-600 font-medium flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{complaint.assignedOfficer.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Expected Completion Date */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Resolution Timeline & SLA
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {complaint.expectedResolutionDate
                      ? `Expected: ${new Date(complaint.expectedResolutionDate).toLocaleDateString()}`
                      : 'Under Municipal Review'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Standard civic SLA: 48-72 hours for verified complaints
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Before & After Comparison if Resolved */}
          {complaint.status === 'Resolved' && complaint.resolutionImage && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Issue Resolved: Before & After Proof Verification</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Before (Citizen Report)
                  </span>
                  <img
                    src={complaint.image}
                    alt="Before"
                    className="w-full h-36 rounded-xl object-cover border border-slate-200"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                    After (Field Crew Completed)
                  </span>
                  <img
                    src={complaint.resolutionImage}
                    alt="After resolution"
                    className="w-full h-36 rounded-xl object-cover border-2 border-emerald-500"
                  />
                </div>
              </div>
              {complaint.resolutionNotes && (
                <p className="text-xs text-emerald-900 bg-white p-2.5 rounded-xl border border-emerald-200">
                  <strong>Inspector Notes:</strong> {complaint.resolutionNotes}
                </p>
              )}
            </div>
          )}

          {/* Status History Timeline Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Status Change History Log
            </h4>
            <div className="space-y-2">
              {complaint.statusHistory?.map((event, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-blue-700">{event.status}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-700">{event.updatedBy}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{event.note}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Community Discussion / Resident Feedback */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Community Remarks ({comments.length})</span>
            </h4>

            <div className="space-y-2">
              {comments.map((comm, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span>{comm.name}</span>
                    <span className="text-[10px] font-normal text-slate-400">{comm.time}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{comm.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a citizen note or update on this issue..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Official Municipal Grievance Redressal Mechanism • Lucknow Smart City
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
