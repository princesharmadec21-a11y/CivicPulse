export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  ward?: string;
  city?: string;
}

export type CivicCategory =
  | 'Road Damage'
  | 'Waste Issue'
  | 'Water Supply & Leakage'
  | 'Electrical & Street Light'
  | 'Sanitation & Drainage'
  | 'Public Property'
  | 'Other';

export type CivicStatus =
  | 'Submitted'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type CivicPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface BaseCivicComplaint {
  id: string;
  ticketNumber: string;
  category: CivicCategory;
  title: string;
  description: string;
  location: GeoLocation;
  status: CivicStatus;
  priority: CivicPriority;
  votes: number;
  department: string;
  createdAt: string;
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Checks for potential duplicate complaints within a distance threshold (default 250 meters)
 * and matching or related categories.
 */
export function findPotentialDuplicates<T extends BaseCivicComplaint>(
  newLoc: { lat: number; lng: number },
  category: CivicCategory,
  existingList: T[],
  radiusMeters: number = 250
): { complaint: T; distance: number }[] {
  const duplicates: { complaint: T; distance: number }[] = [];

  for (const item of existingList) {
    if (item.status === 'Resolved') continue;

    // Check category match or close category match
    const categoryMatches =
      item.category === category ||
      (category === 'Sanitation & Drainage' && item.category === 'Water Supply & Leakage') ||
      (category === 'Water Supply & Leakage' && item.category === 'Sanitation & Drainage');

    if (!categoryMatches) continue;

    const dist = calculateDistanceMeters(
      newLoc.lat,
      newLoc.lng,
      item.location.lat,
      item.location.lng
    );

    if (dist <= radiusMeters) {
      duplicates.push({ complaint: item, distance: dist });
    }
  }

  return duplicates.sort((a, b) => a.distance - b.distance);
}

/**
 * Computes priority based on issue category, community votes, and hazardous conditions.
 */
export function computePriorityScore(params: {
  category: CivicCategory;
  votes?: number;
  hasHazardRisk?: boolean;
  nearSensitiveZone?: boolean;
}): CivicPriority {
  const { category, votes = 0, hasHazardRisk = false, nearSensitiveZone = false } = params;

  // Immediate critical conditions: open manholes, live wire, or high hazard in sensitive zone
  if (hasHazardRisk && (category === 'Electrical & Street Light' || category === 'Sanitation & Drainage' || nearSensitiveZone)) {
    return 'Critical';
  }

  if (votes >= 20 || (votes >= 10 && hasHazardRisk)) {
    return 'Critical';
  }

  if (hasHazardRisk || votes >= 10 || category === 'Road Damage' || category === 'Water Supply & Leakage') {
    return 'High';
  }

  if (votes >= 4 || category === 'Waste Issue') {
    return 'Medium';
  }

  return 'Low';
}

/**
 * Returns gamification tier, title, and badge metadata based on citizen score
 */
export function calculateGamificationTier(points: number): {
  level: number;
  title: string;
  nextTierPoints: number;
  progressPercent: number;
  badges: string[];
} {
  if (points >= 500) {
    return {
      level: 4,
      title: 'City Hero',
      nextTierPoints: 1000,
      progressPercent: Math.min(100, Math.round(((points - 500) / 500) * 100)),
      badges: ['Community Helper', 'Problem Solver', 'City Watcher', 'City Hero', 'Civic Champion'],
    };
  } else if (points >= 250) {
    return {
      level: 3,
      title: 'Problem Solver',
      nextTierPoints: 500,
      progressPercent: Math.round(((points - 250) / 250) * 100),
      badges: ['Community Helper', 'City Watcher', 'Problem Solver'],
    };
  } else if (points >= 100) {
    return {
      level: 2,
      title: 'City Watcher',
      nextTierPoints: 250,
      progressPercent: Math.round(((points - 100) / 150) * 100),
      badges: ['Community Helper', 'City Watcher'],
    };
  } else {
    return {
      level: 1,
      title: 'Community Helper',
      nextTierPoints: 100,
      progressPercent: Math.round((points / 100) * 100),
      badges: ['Community Helper'],
    };
  }
}

/**
 * Filter and sort complaints
 */
export function filterAndSortComplaints<T extends BaseCivicComplaint>(
  complaints: T[],
  filters: {
    status?: string;
    category?: string;
    priority?: string;
    searchQuery?: string;
    sortBy?: 'newest' | 'mostVoted' | 'priority';
  }
): T[] {
  let list = [...complaints];

  if (filters.status && filters.status !== 'All') {
    list = list.filter((c) => c.status === filters.status);
  }

  if (filters.category && filters.category !== 'All') {
    list = list.filter((c) => c.category === filters.category);
  }

  if (filters.priority && filters.priority !== 'All') {
    list = list.filter((c) => c.priority === filters.priority);
  }

  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase();
    list = list.filter(
      (c) =>
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.location.address && c.location.address.toLowerCase().includes(q)) ||
        (c.location.ward && c.location.ward.toLowerCase().includes(q))
    );
  }

  const priorityOrder: Record<CivicPriority, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  if (filters.sortBy === 'mostVoted') {
    list.sort((a, b) => b.votes - a.votes);
  } else if (filters.sortBy === 'priority') {
    list.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  } else {
    // newest first by default
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list;
}

/**
 * Aggregate summary statistics for complaints
 */
export function aggregateCivicStats<T extends BaseCivicComplaint>(complaints: T[]) {
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved').length;
  const inProgress = complaints.filter((c) => c.status === 'In Progress').length;
  const pending = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Verified').length;
  const critical = complaints.filter((c) => c.priority === 'Critical' && c.status !== 'Resolved').length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const categoryCounts: Record<string, number> = {};
  const wardCounts: Record<string, number> = {};

  for (const c of complaints) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    const ward = c.location.ward || 'General Zone';
    wardCounts[ward] = (wardCounts[ward] || 0) + 1;
  }

  return {
    total,
    resolved,
    inProgress,
    pending,
    critical,
    resolutionRate,
    categoryCounts,
    wardCounts,
  };
}

/**
 * Validates admin credentials against official municipal staff accounts
 */
export function validateAdminCredentials(
  email: string,
  pass: string
): { success: boolean; role?: 'admin' | 'officer'; userName?: string; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  if (!cleanEmail || !cleanPass) {
    return { success: false, error: 'Email and password are required.' };
  }

  // Municipal Administrator credentials
  if (cleanEmail === 'commissioner@civic.gov.in' || cleanEmail === 'admin@civic.gov.in') {
    if (cleanPass === 'admin123' || cleanPass === 'lmc2026') {
      return { success: true, role: 'admin', userName: 'Dr. Alok Mathur (City Commissioner)' };
    }
    return { success: false, error: 'Invalid password for Municipal Administrator account.' };
  }

  // Zonal Officer credentials
  if (cleanEmail === 'r.verma@civic.gov.in' || cleanEmail === 'officer@civic.gov.in') {
    if (cleanPass === 'officer123' || cleanPass === 'pwd2026') {
      return { success: true, role: 'officer', userName: 'Er. Rajiv Verma (PWD Zonal Officer)' };
    }
    return { success: false, error: 'Invalid password for Zonal Officer account.' };
  }

  return {
    success: false,
    error: 'Access restricted to authorized Municipal Corporation personnel.',
  };
}

/**
 * Categorizes complaints into Raised, Solved, and Active buckets for admin auditing
 */
export function categorizeRaisedVsSolved<T extends BaseCivicComplaint>(complaints: T[]) {
  const solved = complaints.filter((c) => c.status === 'Resolved');
  const raised = complaints.filter((c) => c.status !== 'Resolved');
  const inProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned');
  const pending = complaints.filter((c) => c.status === 'Submitted' || c.status === 'Verified');

  return {
    allCount: complaints.length,
    raised,
    solved,
    inProgress,
    pending,
    solvedCount: solved.length,
    raisedCount: raised.length,
  };
}

