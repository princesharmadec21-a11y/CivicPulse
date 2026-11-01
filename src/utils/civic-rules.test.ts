import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceMeters,
  findPotentialDuplicates,
  computePriorityScore,
  calculateGamificationTier,
  filterAndSortComplaints,
  aggregateCivicStats,
  BaseCivicComplaint,
  validateAdminCredentials,
  categorizeRaisedVsSolved,
} from './civic-rules';

test('calculateDistanceMeters accurately computes small geographic distances', () => {
  // Coordinates around Gomti Nagar, Lucknow
  // Point A: 26.8500, 80.9500
  // Point B: 26.8500, 80.9510 (~100m east)
  const dist = calculateDistanceMeters(26.85, 80.95, 26.85, 80.951);
  assert.ok(dist > 90 && dist < 110, `Expected ~100m, got ${dist}`);

  // Same coordinates should be 0 meters
  assert.equal(calculateDistanceMeters(26.85, 80.95, 26.85, 80.95), 0);
});

test('findPotentialDuplicates flags complaints in close proximity with matching category', () => {
  const existing: BaseCivicComplaint[] = [
    {
      id: '1',
      ticketNumber: 'CIV-1001',
      category: 'Road Damage',
      title: 'Deep pothole on main road',
      description: 'Vehicles swerving',
      location: { lat: 26.8502, lng: 80.9503, ward: 'Gomti Nagar' },
      status: 'Submitted',
      priority: 'High',
      votes: 3,
      department: 'Roads & PWD',
      createdAt: '2026-10-30T10:00:00Z',
    },
    {
      id: '2',
      ticketNumber: 'CIV-1002',
      category: 'Waste Issue',
      title: 'Garbage dump near park',
      description: 'Bins overflowing',
      location: { lat: 26.8501, lng: 80.9502, ward: 'Gomti Nagar' },
      status: 'Submitted',
      priority: 'Medium',
      votes: 1,
      department: 'Waste Management',
      createdAt: '2026-10-30T11:00:00Z',
    },
    {
      id: '3',
      ticketNumber: 'CIV-1003',
      category: 'Road Damage',
      title: 'Faraway pothole',
      description: 'In another city district',
      location: { lat: 26.89, lng: 80.99, ward: 'Alambagh' },
      status: 'Submitted',
      priority: 'High',
      votes: 5,
      department: 'Roads & PWD',
      createdAt: '2026-10-30T09:00:00Z',
    },
  ];

  // User reports another Road Damage at 26.85025, 80.95032 (~10m from CIV-1001)
  const duplicates = findPotentialDuplicates(
    { lat: 26.85025, lng: 80.95032 },
    'Road Damage',
    existing,
    250
  );

  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].complaint.ticketNumber, 'CIV-1001');
  assert.ok(duplicates[0].distance < 30);
});

test('computePriorityScore evaluates urgency, hazard risk and community votes', () => {
  // Electrical hazard risk -> Critical
  const crit = computePriorityScore({
    category: 'Electrical & Street Light',
    hasHazardRisk: true,
  });
  assert.equal(crit, 'Critical');

  // High community votes (>20) -> Critical
  const highVotes = computePriorityScore({
    category: 'Waste Issue',
    votes: 25,
  });
  assert.equal(highVotes, 'Critical');

  // Road damage with standard votes -> High
  const high = computePriorityScore({
    category: 'Road Damage',
    votes: 2,
  });
  assert.equal(high, 'High');

  // Standard waste issue -> Medium
  const med = computePriorityScore({
    category: 'Waste Issue',
    votes: 1,
  });
  assert.equal(med, 'Medium');
});

test('calculateGamificationTier maps points to appropriate civic rank & badges', () => {
  const rookie = calculateGamificationTier(40);
  assert.equal(rookie.level, 1);
  assert.equal(rookie.title, 'Community Helper');

  const watcher = calculateGamificationTier(150);
  assert.equal(watcher.level, 2);
  assert.equal(watcher.title, 'City Watcher');

  const solver = calculateGamificationTier(350);
  assert.equal(solver.level, 3);
  assert.equal(solver.title, 'Problem Solver');

  const hero = calculateGamificationTier(600);
  assert.equal(hero.level, 4);
  assert.equal(hero.title, 'City Hero');
});

test('aggregateCivicStats computes resolution rate, counts and wards', () => {
  const list: BaseCivicComplaint[] = [
    {
      id: '1',
      ticketNumber: 'CIV-01',
      category: 'Road Damage',
      title: 'P1',
      description: '',
      location: { lat: 0, lng: 0, ward: 'Ward 1' },
      status: 'Resolved',
      priority: 'High',
      votes: 10,
      department: 'PWD',
      createdAt: '2026-10-01',
    },
    {
      id: '2',
      ticketNumber: 'CIV-02',
      category: 'Waste Issue',
      title: 'P2',
      description: '',
      location: { lat: 0, lng: 0, ward: 'Ward 1' },
      status: 'In Progress',
      priority: 'Medium',
      votes: 5,
      department: 'Waste',
      createdAt: '2026-10-02',
    },
    {
      id: '3',
      ticketNumber: 'CIV-03',
      category: 'Electrical & Street Light',
      title: 'P3',
      description: '',
      location: { lat: 0, lng: 0, ward: 'Ward 2' },
      status: 'Submitted',
      priority: 'Critical',
      votes: 2,
      department: 'Power',
      createdAt: '2026-10-03',
    },
  ];

  const stats = aggregateCivicStats(list);
  assert.equal(stats.total, 3);
  assert.equal(stats.resolved, 1);
  assert.equal(stats.inProgress, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.critical, 1);
  assert.equal(stats.resolutionRate, 33);
  assert.equal(stats.wardCounts['Ward 1'], 2);
  assert.equal(stats.wardCounts['Ward 2'], 1);
});

test('validateAdminCredentials verifies municipal admin and officer logins', () => {
  // Correct admin login
  const adminRes = validateAdminCredentials('commissioner@civic.gov.in', 'admin123');
  assert.equal(adminRes.success, true);
  assert.equal(adminRes.role, 'admin');

  // Correct officer login
  const officerRes = validateAdminCredentials('r.verma@civic.gov.in', 'officer123');
  assert.equal(officerRes.success, true);
  assert.equal(officerRes.role, 'officer');

  // Wrong password
  const badPass = validateAdminCredentials('commissioner@civic.gov.in', 'wrongpass');
  assert.equal(badPass.success, false);
  assert.ok(badPass.error?.includes('Invalid password'));

  // Unknown email
  const unknown = validateAdminCredentials('unknown@citizen.com', 'pwd');
  assert.equal(unknown.success, false);
});

test('categorizeRaisedVsSolved splits complaints into raised and solved sets', () => {
  const list: BaseCivicComplaint[] = [
    {
      id: '1',
      ticketNumber: 'CIV-01',
      category: 'Road Damage',
      title: 'P1',
      description: '',
      location: { lat: 0, lng: 0 },
      status: 'Resolved',
      priority: 'High',
      votes: 1,
      department: 'PWD',
      createdAt: '2026-10-01',
    },
    {
      id: '2',
      ticketNumber: 'CIV-02',
      category: 'Road Damage',
      title: 'P2',
      description: '',
      location: { lat: 0, lng: 0 },
      status: 'In Progress',
      priority: 'High',
      votes: 1,
      department: 'PWD',
      createdAt: '2026-10-02',
    },
    {
      id: '3',
      ticketNumber: 'CIV-03',
      category: 'Waste Issue',
      title: 'P3',
      description: '',
      location: { lat: 0, lng: 0 },
      status: 'Submitted',
      priority: 'Medium',
      votes: 1,
      department: 'Waste',
      createdAt: '2026-10-03',
    },
  ];

  const categorized = categorizeRaisedVsSolved(list);
  assert.equal(categorized.allCount, 3);
  assert.equal(categorized.solvedCount, 1);
  assert.equal(categorized.raisedCount, 2);
  assert.equal(categorized.solved[0].ticketNumber, 'CIV-01');
});

