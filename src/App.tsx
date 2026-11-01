import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CivicMap } from './components/CivicMap';
import { ComplaintsFeed } from './components/ComplaintsFeed';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ReportIssueModal } from './components/ReportIssueModal';
import { ComplaintTrackerModal } from './components/ComplaintTrackerModal';
import { GamificationModal } from './components/GamificationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  CivicIssue,
  CivicUser,
  CivicNotification,
  CivicStatus,
} from './types/civic';
import {
  INITIAL_COMPLAINTS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
} from './data/seedData';
import { Award, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'admin' | 'analytics'>('map');
  const [complaints, setComplaints] = useState<CivicIssue[]>(INITIAL_COMPLAINTS);
  const [users, setUsers] = useState<CivicUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<CivicUser>(INITIAL_USERS[0]);
  const [notifications, setNotifications] = useState<CivicNotification[]>(INITIAL_NOTIFICATIONS);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<CivicIssue | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'reward' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'reward' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync with backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintsRes, notifsRes, usersRes] = await Promise.all([
          fetch('/api/complaints'),
          fetch('/api/notifications'),
          fetch('/api/users'),
        ]);

        if (complaintsRes.ok) {
          const data = await complaintsRes.json();
          if (data.complaints) setComplaints(data.complaints);
        }
        if (notifsRes.ok) {
          const data = await notifsRes.json();
          if (data.notifications) setNotifications(data.notifications);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          if (data.users) setUsers(data.users);
        }
      } catch (err) {
        console.log('Using local state fallback for offline preview');
      }
    };

    fetchData();

    // Check URL params for tab or autostart
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['map', 'list', 'admin', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  // Handle new complaint submitted
  const handleComplaintSubmitted = (newComplaint: CivicIssue, pointsEarned: number) => {
    setComplaints((prev) => [newComplaint, ...prev]);

    // Update current user points
    setCurrentUser((prev) => ({
      ...prev,
      points: prev.points + pointsEarned,
      reportedCount: prev.reportedCount + 1,
    }));

    showToast(
      `🎉 Grievance #${newComplaint.ticketNumber} registered! +${pointsEarned} Civic Points added to your profile.`,
      'reward'
    );

    // Open tracker modal right away so citizen sees their ticket in progress
    setSelectedComplaint(newComplaint);
  };

  // Handle community upvote
  const handleVote = async (complaintId: string) => {
    try {
      // Optimistic update
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? { ...c, votes: c.votes + 1, userVoted: true }
            : c
        )
      );

      if (selectedComplaint && selectedComplaint.id === complaintId) {
        setSelectedComplaint((prev) =>
          prev ? { ...prev, votes: prev.votes + 1, userVoted: true } : null
        );
      }

      showToast('Thank you! Your citizen validation increases municipal priority.', 'success');

      await fetch(`/api/complaints/${complaintId}/vote`, { method: 'POST' });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Support duplicate complaint
  const handleSupportExisting = async (existingId: string) => {
    try {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === existingId
            ? {
                ...c,
                votes: c.votes + 1,
                duplicateSupportersCount: (c.duplicateSupportersCount || 0) + 1,
                userVoted: true,
              }
            : c
        )
      );

      setCurrentUser((prev) => ({
        ...prev,
        points: prev.points + 25,
      }));

      showToast('You supported an existing complaint! +25 Civic Points awarded.', 'reward');

      await fetch(`/api/complaints/${existingId}/support`, { method: 'POST' });
    } catch (err) {
      console.error('Support failed:', err);
    }
  };

  // Admin / Officer update status
  const handleUpdateStatus = async (
    complaintId: string,
    newStatus: CivicStatus,
    note?: string,
    assignedOfficer?: any,
    expectedDate?: string,
    resolutionImage?: string
  ) => {
    try {
      const nowIso = new Date().toISOString();
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === complaintId) {
            const history = [...c.statusHistory];
            if (newStatus !== c.status) {
              history.push({
                status: newStatus,
                timestamp: nowIso,
                note: note || `Status changed to ${newStatus}`,
                updatedBy: currentUser.name,
                photoUrl: resolutionImage,
              });
            }
            return {
              ...c,
              status: newStatus,
              assignedOfficer: assignedOfficer || c.assignedOfficer,
              expectedResolutionDate: expectedDate || c.expectedResolutionDate,
              resolutionImage: resolutionImage || c.resolutionImage,
              resolutionNotes: newStatus === 'Resolved' ? note : c.resolutionNotes,
              statusHistory: history,
              updatedAt: nowIso,
            };
          }
          return c;
        })
      );

      showToast(`Complaint status updated to "${newStatus}". Work order dispatched.`, 'success');

      await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note,
          updatedBy: currentUser.name,
          assignedOfficer,
          expectedResolutionDate: expectedDate,
          resolutionImage,
        }),
      });
    } catch (err) {
      console.error('Update status failed:', err);
    }
  };

  // Mark notifications read
  const handleMarkNotificationsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST' });
    } catch (err) {}
  };

  const handleSelectNotificationComplaint = (complaintId: string) => {
    const found = complaints.find((c) => c.id === complaintId);
    if (found) {
      setSelectedComplaint(found);
    }
  };

  const handleAdminLoginSuccess = (adminUser: CivicUser) => {
    setCurrentUser(adminUser);
    setActiveTab('admin');
    showToast(`Welcome ${adminUser.name}! Administrator session authorized.`, 'success');
  };

  const handleLogoutAdmin = () => {
    const citizenUser = users.find((u) => u.role === 'citizen') || INITIAL_USERS[0];
    setCurrentUser(citizenUser);
    showToast('Administrator session closed. Switched to Citizen mode.', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenRewardsModal={() => setIsRewardsModalOpen(true)}
        currentUser={currentUser}
        allUsers={users}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          showToast(`Switched view to ${user.name} (${user.role.toUpperCase()})`, 'info');
        }}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onSelectNotificationComplaint={handleSelectNotificationComplaint}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'map' && (
          <CivicMap
            complaints={complaints}
            selectedComplaintId={selectedComplaint?.id}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'list' && (
          <ComplaintsFeed
            complaints={complaints}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onVote={handleVote}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            complaints={complaints}
            currentUser={currentUser}
            onUpdateStatus={handleUpdateStatus}
            onSelectComplaint={(c) => setSelectedComplaint(c)}
            onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
            onLogoutAdmin={handleLogoutAdmin}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            complaints={complaints}
            users={users}
          />
        )}
      </main>

      {/* Floating Action Bar for Quick Reporting on Mobile */}
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/40 flex items-center justify-center text-xl font-bold active:scale-95 transition-all"
          aria-label="Report issue"
        >
          +
        </button>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 text-xs font-bold text-white ${
              toast.type === 'reward'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-400'
                : toast.type === 'info'
                ? 'bg-slate-900 border-slate-700'
                : 'bg-emerald-700 border-emerald-500'
            }`}
          >
            {toast.type === 'reward' ? (
              <Award className="w-5 h-5 text-amber-200 shrink-0" />
            ) : toast.type === 'info' ? (
              <Sparkles className="w-5 h-5 text-blue-300 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentUser={currentUser}
        existingComplaints={complaints}
        onComplaintSubmitted={handleComplaintSubmitted}
        onSupportExisting={handleSupportExisting}
      />

      <ComplaintTrackerModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onVote={handleVote}
        currentUserRole={currentUser.role}
      />

      <GamificationModal
        isOpen={isRewardsModalOpen}
        onClose={() => setIsRewardsModalOpen(false)}
        user={currentUser}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        allUsers={users}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
