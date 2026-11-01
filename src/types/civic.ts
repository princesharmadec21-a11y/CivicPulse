import { CivicCategory, CivicStatus, CivicPriority, GeoLocation } from '../utils/civic-rules';

export type { CivicCategory, CivicStatus, CivicPriority, GeoLocation };

export interface StatusTimelineEvent {
  status: CivicStatus;
  timestamp: string;
  note: string;
  updatedBy: string;
  photoUrl?: string;
}

export interface AIAnalysisResult {
  predictedCategory: CivicCategory;
  confidence: number;
  detectedIssue: string;
  priority: CivicPriority;
  priorityReason: string;
  suggestedDepartment: string;
  suggestedAction: string;
  safetyHazard: boolean;
  tags: string[];
}

export interface CivicIssue {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: CivicCategory;
  priority: CivicPriority;
  status: CivicStatus;
  image: string;
  resolutionImage?: string;
  resolutionNotes?: string;
  location: GeoLocation;
  department: string;
  assignedOfficer?: {
    name: string;
    designation: string;
    phone: string;
    zone: string;
  };
  expectedResolutionDate?: string;
  reportedBy: {
    id: string;
    name: string;
    email: string;
    badge: string;
    avatar?: string;
  };
  votes: number;
  userVoted?: boolean;
  duplicateSupportersCount?: number;
  statusHistory: StatusTimelineEvent[];
  aiAnalysis?: AIAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface CivicUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin';
  department?: string;
  points: number;
  badges: string[];
  solvedCount: number;
  reportedCount: number;
  avatar: string;
}

export interface CivicNotification {
  id: string;
  title: string;
  message: string;
  ticketNumber?: string;
  complaintId?: string;
  type: 'status' | 'vote' | 'reward' | 'assignment' | 'duplicate';
  timestamp: string;
  read: boolean;
}

export interface DepartmentInfo {
  id: string;
  name: string;
  headOfficer: string;
  activeTickets: number;
  resolvedTickets: number;
  avgResolutionDays: number;
  color: string;
  category: CivicCategory;
}
