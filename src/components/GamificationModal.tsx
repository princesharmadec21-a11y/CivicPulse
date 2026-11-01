import React from 'react';
import {
  X,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  Shield,
  Star,
  Gift,
} from 'lucide-react';
import { CivicUser } from '../types/civic';
import { calculateGamificationTier } from '../utils/civic-rules';

interface GamificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: CivicUser;
}

const ALL_BADGES = [
  {
    name: 'Community Helper',
    desc: 'Reported first verified civic issue',
    icon: '🤝',
    pointsReq: 50,
  },
  {
    name: 'City Watcher',
    desc: 'Active watchdog with 5+ reported issues & upvotes',
    icon: '👁️',
    pointsReq: 100,
  },
  {
    name: 'Problem Solver',
    desc: 'Helped city resolve 10+ civic infrastructure hazards',
    icon: '🛠️',
    pointsReq: 250,
  },
  {
    name: 'City Hero',
    desc: 'Elite citizen guardian with over 500 civic points',
    icon: '🦸',
    pointsReq: 500,
  },
  {
    name: 'Civic Champion',
    desc: 'Top 1% citizen contributor recognized by Municipal Corporation',
    icon: '🏆',
    pointsReq: 1000,
  },
];

export const GamificationModal: React.FC<GamificationModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen) return null;

  const tier = calculateGamificationTier(user.points);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg">Citizen Rewards & Badges</h3>
              <p className="text-xs text-amber-100 font-medium">
                Gamified civic participation for a better city
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Tier Level & Progress */}
          <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  Current Rank
                </span>
                <h4 className="text-xl font-black text-amber-950 flex items-center space-x-1.5">
                  <span>{tier.title}</span>
                  <span className="text-xs font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                    Level {tier.level}
                  </span>
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-900">{user.points}</span>
                <span className="text-xs text-amber-700 block font-bold">Civic Points</span>
              </div>
            </div>

            {/* Progress to next tier */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-amber-800">
                <span>Next Milestone: {tier.nextTierPoints} pts</span>
                <span>{tier.progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-amber-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${tier.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges Showcase */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Earned Badges & Unlocks
            </h4>
            <div className="space-y-2">
              {ALL_BADGES.map((b) => {
                const isUnlocked = user.points >= b.pointsReq;
                return (
                  <div
                    key={b.name}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      isUnlocked
                        ? 'bg-white border-amber-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-extrabold text-xs text-slate-900">{b.name}</h5>
                          {isUnlocked ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full flex items-center">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5 inline" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded-full flex items-center">
                              <Lock className="w-2.5 h-2.5 mr-0.5 inline" />
                              {b.pointsReq} pts required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Earn Points Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Gift className="w-4 h-4 text-blue-600" />
              <span>How to Earn More Points</span>
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li className="flex items-center justify-between">
                <span>• Report a verified civic grievance with photo</span>
                <strong className="text-emerald-600 font-extrabold">+50 pts</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>• Support an existing nearby duplicate issue</span>
                <strong className="text-emerald-600 font-extrabold">+25 pts</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>• Your reported issue gets successfully resolved</span>
                <strong className="text-emerald-600 font-extrabold">+100 pts</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
