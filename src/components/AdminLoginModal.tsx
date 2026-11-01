import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CivicUser } from '../types/civic';
import { validateAdminCredentials } from '../utils/civic-rules';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  allUsers: CivicUser[];
  onLoginSuccess: (user: CivicUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  allUsers,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = validateAdminCredentials(email, password);

    setTimeout(() => {
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      // Find matching user object
      const targetUser = allUsers.find(
        (u) =>
          u.role === result.role ||
          u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (targetUser) {
        onLoginSuccess(targetUser);
        onClose();
      } else {
        // Fallback to first officer/admin
        const fallback = allUsers.find((u) => u.role !== 'citizen') || allUsers[1];
        onLoginSuccess(fallback);
        onClose();
      }
    }, 400);
  };

  const fillQuickDemo = (role: 'admin' | 'officer') => {
    if (role === 'admin') {
      setEmail('commissioner@civic.gov.in');
      setPassword('admin123');
    } else {
      setEmail('r.verma@civic.gov.in');
      setPassword('officer123');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-base tracking-tight">Authority Sign-In</h3>
                <span className="text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30">
                  OFFICIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Lucknow Municipal Corporation Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. commissioner@civic.gov.in"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Reports'}</span>
          </button>

          {/* 1-Click Demo Credentials */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ⚡ Quick 1-Click Authority Demo Logins:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/60 text-left transition-colors"
              >
                <p className="font-bold text-xs text-slate-800 truncate">Municipal Admin</p>
                <p className="text-[10px] text-slate-500">Commissioner Mathur</p>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('officer')}
                className="p-2 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/60 text-left transition-colors"
              >
                <p className="font-bold text-xs text-slate-800 truncate">Zonal PWD Officer</p>
                <p className="text-[10px] text-slate-500">Er. Rajiv Verma</p>
              </button>
            </div>
          </div>

          {/* Legal / Security disclaimer */}
          <p className="text-[10px] text-slate-400 text-center pt-1">
            Access strictly monitored for official municipal grievance redressal operations.
          </p>
        </form>
      </div>
    </div>
  );
};
