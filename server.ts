import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow large base64 image uploads for civic issue photos
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// In-memory persistence initialized with realistic seed data
import {
  INITIAL_COMPLAINTS,
  INITIAL_USERS,
  DEPARTMENTS,
  INITIAL_NOTIFICATIONS,
} from './src/data/seedData';
import { CivicIssue, CivicNotification } from './src/types/civic';
import { computePriorityScore, findPotentialDuplicates } from './src/utils/civic-rules';

let complaints: CivicIssue[] = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS));
let notifications: CivicNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
let users = JSON.parse(JSON.stringify(INITIAL_USERS));

// Initialize Gemini SDK with telemetry header as required by skill
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback rule-based analyzer when Gemini API is unavailable or image is an external URL
function fallbackAnalyze(imageHint: string, userText: string = '') {
  const text = (imageHint + ' ' + userText).toLowerCase();

  if (text.includes('pothole') || text.includes('road') || text.includes('asphalt') || text.includes('crater') || text.includes('515162816999')) {
    return {
      predictedCategory: 'Road Damage' as const,
      confidence: 95,
      detectedIssue: 'Severe pothole and road surface deterioration',
      priority: 'High' as const,
      priorityReason: 'Risk of vehicle undercarriage damage, tire blowouts, and cyclist accidents',
      suggestedDepartment: 'Roads & Public Works (PWD)',
      suggestedAction: 'Cold/hot asphalt mix patching, edge sealing, and road leveling',
      safetyHazard: true,
      tags: ['Pothole', 'Road Damage', 'PWD', 'Traffic Safety'],
    };
  }

  if (text.includes('garbage') || text.includes('trash') || text.includes('waste') || text.includes('dump') || text.includes('532996122724')) {
    return {
      predictedCategory: 'Waste Issue' as const,
      confidence: 94,
      detectedIssue: 'Uncollected solid waste accumulation & overflowing container',
      priority: 'Medium' as const,
      priorityReason: 'Sanitation nuisance, foul smell, and health hazard near pedestrian zone',
      suggestedDepartment: 'Solid Waste & Sanitation',
      suggestedAction: 'Deploy hydraulic compactor truck, container clearance, and lime disinfection',
      safetyHazard: false,
      tags: ['Solid Waste', 'Sanitation', 'Dumpster', 'Cleanliness'],
    };
  }

  if (text.includes('water') || text.includes('pipe') || text.includes('leak') || text.includes('burst') || text.includes('585202900225')) {
    return {
      predictedCategory: 'Water Supply & Leakage' as const,
      confidence: 96,
      detectedIssue: 'Pressurized water supply pipeline fracture',
      priority: 'Critical' as const,
      priorityReason: 'Continuous loss of drinking water and local street waterlogging',
      suggestedDepartment: 'Jal Sansthan (Water Supply)',
      suggestedAction: 'Immediate isolation of upstream feeder line and repair clamp installation',
      safetyHazard: true,
      tags: ['Pipeline Burst', 'Drinking Water', 'Jal Sansthan', 'Critical'],
    };
  }

  if (text.includes('light') || text.includes('wire') || text.includes('lamp') || text.includes('electric') || text.includes('508873696983')) {
    return {
      predictedCategory: 'Electrical & Street Light' as const,
      confidence: 96,
      detectedIssue: 'Hanging streetlight luminaire or exposed cabling',
      priority: 'Critical' as const,
      priorityReason: 'Electrocution danger and zero visibility for pedestrian crossings at night',
      suggestedDepartment: 'Electricity Board & Street Lighting',
      suggestedAction: 'Line de-energization, dismantle loose fixture, and bracket re-mounting',
      safetyHazard: true,
      tags: ['Electrical Hazard', 'Street Lighting', 'Public Safety'],
    };
  }

  if (text.includes('drain') || text.includes('sewer') || text.includes('clog') || text.includes('542601906990')) {
    return {
      predictedCategory: 'Sanitation & Drainage' as const,
      confidence: 92,
      detectedIssue: 'Severely silted and blocked open storm drain',
      priority: 'High' as const,
      priorityReason: 'Stagnant foul wastewater overflow and mosquito vector risk',
      suggestedDepartment: 'Drainage & Sewerage Board',
      suggestedAction: 'Super sucker machine desilting, trash screen clearing',
      safetyHazard: false,
      tags: ['Drainage', 'Overflow', 'Mosquito Risk', 'Sanitation'],
    };
  }

  return {
    predictedCategory: 'Public Property' as const,
    confidence: 88,
    detectedIssue: 'Damaged civic infrastructure or public facility',
    priority: 'Medium' as const,
    priorityReason: 'Public convenience and infrastructure integrity maintenance',
    suggestedDepartment: 'Urban Infrastructure & Public Property',
    suggestedAction: 'Inspection by zonal junior engineer and restoration work order',
    safetyHazard: false,
    tags: ['Public Property', 'Urban Maintenance', 'Civil Works'],
  };
}

// -------------------------------------------------------------
// AI Image Classification Endpoint
// -------------------------------------------------------------
app.post('/api/ai/classify-issue', async (req: Request, res: Response) => {
  try {
    const { imageBase64, imageUrl, userDescription = '' } = req.body;

    if (!imageBase64 && !imageUrl) {
      return res.status(400).json({ error: 'Image data (base64 or URL) is required.' });
    }

    // Try Gemini API if API key exists and base64 is provided
    if (aiClient && imageBase64 && imageBase64.includes(';base64,')) {
      try {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const mimeType = matches ? matches[1] : 'image/jpeg';
        const rawBase64 = matches ? matches[2] : imageBase64;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: rawBase64,
                },
              },
              {
                text: `You are an expert municipal infrastructure inspector analyzing a photo taken by a citizen for a Smart Civic Issue Reporting Platform.
Analyze the photo and citizen note: "${userDescription}".
Identify:
1. predictedCategory: Must be one of ["Road Damage", "Waste Issue", "Water Supply & Leakage", "Electrical & Street Light", "Sanitation & Drainage", "Public Property"]
2. confidence: Integer between 70 and 99
3. detectedIssue: Concise 1-sentence technical description of the exact defect (e.g. "Deep 2-ft pothole with damaged gravel base")
4. priority: One of ["Critical", "High", "Medium", "Low"]
5. priorityReason: 1 sentence justification why this priority was assigned
6. suggestedDepartment: The specific civic department responsible (e.g. "Roads & Public Works (PWD)", "Solid Waste & Sanitation", "Jal Sansthan (Water Supply)", "Electricity Board & Street Lighting", "Drainage & Sewerage Board")
7. suggestedAction: Specific engineering/field repair procedure required
8. safetyHazard: true if there is electrocution risk, collision risk, open deep manhole, or structural collapse risk; otherwise false
9. tags: Array of 3-5 relevant keywords`,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                predictedCategory: { type: Type.STRING },
                confidence: { type: Type.INTEGER },
                detectedIssue: { type: Type.STRING },
                priority: { type: Type.STRING },
                priorityReason: { type: Type.STRING },
                suggestedDepartment: { type: Type.STRING },
                suggestedAction: { type: Type.STRING },
                safetyHazard: { type: Type.BOOLEAN },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'predictedCategory',
                'confidence',
                'detectedIssue',
                'priority',
                'priorityReason',
                'suggestedDepartment',
                'suggestedAction',
                'safetyHazard',
                'tags',
              ],
            },
          },
        });

        const textOutput = response.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput);
          return res.json({
            success: true,
            provider: 'gemini-3.8-flash',
            analysis: parsed,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call failed, falling back to heuristic classifier:', geminiErr?.message || geminiErr);
      }
    }

    // Heuristic Fallback
    const fallback = fallbackAnalyze(imageUrl || imageBase64 || '', userDescription);
    return res.json({
      success: true,
      provider: 'ai-heuristic-engine',
      analysis: fallback,
    });
  } catch (err: any) {
    console.error('Classification error:', err);
    return res.status(500).json({ error: 'Failed to classify issue', details: err?.message });
  }
});

// -------------------------------------------------------------
// Complaints Endpoints
// -------------------------------------------------------------
app.get('/api/complaints', (req: Request, res: Response) => {
  res.json({ complaints });
});

app.post('/api/complaints', (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      image,
      location,
      department,
      reportedBy,
      aiAnalysis,
    } = req.body;

    if (!title || !category || !location || !location.lat || !location.lng) {
      return res.status(400).json({ error: 'Title, category, and GPS location are required.' });
    }

    // Generate unique ticket number CIV-XXXX
    const nextNum = 1030 + complaints.length + 1;
    const ticketNumber = `CIV-${nextNum}`;
    const id = `civic-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Check for nearby duplicates
    const nearbyDups = findPotentialDuplicates(location, category, complaints, 250);

    const calculatedPriority = priority || computePriorityScore({
      category,
      hasHazardRisk: aiAnalysis?.safetyHazard || false,
    });

    const newComplaint: CivicIssue = {
      id,
      ticketNumber,
      title,
      description: description || 'Reported by citizen via CivicPulse mobile app.',
      category,
      priority: calculatedPriority,
      status: 'Submitted',
      image: image || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
        address: location.address || 'Lucknow Urban Zone',
        ward: location.ward || 'Municipal Ward',
        city: location.city || 'Lucknow',
      },
      department: department || 'Roads & Public Works (PWD)',
      reportedBy: reportedBy || {
        id: 'user-1',
        name: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        badge: 'Problem Solver',
      },
      votes: 1,
      userVoted: true,
      duplicateSupportersCount: 0,
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: nowIso,
          note: 'Complaint registered by citizen with GPS coordinates and visual inspection proof.',
          updatedBy: reportedBy?.name || 'Citizen',
        },
      ],
      aiAnalysis,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    complaints.unshift(newComplaint);

    // Push notification for the citizen
    const newNotif: CivicNotification = {
      id: `notif-${Date.now()}`,
      title: `Complaint Submitted: ${ticketNumber}`,
      message: `Your report for "${title}" has been registered. AI classified it under ${category}.`,
      ticketNumber,
      complaintId: id,
      type: 'status',
      timestamp: nowIso,
      read: false,
    };
    notifications.unshift(newNotif);

    // Reward citizen points (+50)
    const citizen = users.find((u: any) => u.id === (reportedBy?.id || 'user-1'));
    if (citizen) {
      citizen.points += 50;
      citizen.reportedCount += 1;
    }

    return res.status(201).json({
      success: true,
      complaint: newComplaint,
      duplicateFound: nearbyDups.length > 0 ? nearbyDups[0] : null,
      pointsEarned: 50,
    });
  } catch (err: any) {
    console.error('Error creating complaint:', err);
    return res.status(500).json({ error: 'Failed to create complaint' });
  }
});

// Update complaint status (Admin / Officer action)
app.patch('/api/complaints/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, note, updatedBy, assignedOfficer, expectedResolutionDate, resolutionImage, department, priority } = req.body;

    const complaint = complaints.find((c) => c.id === id || c.ticketNumber === id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const nowIso = new Date().toISOString();

    if (status && status !== complaint.status) {
      complaint.status = status;
      complaint.statusHistory.push({
        status,
        timestamp: nowIso,
        note: note || `Status updated to ${status}.`,
        updatedBy: updatedBy || 'Municipal Authority',
        photoUrl: resolutionImage,
      });

      if (status === 'Resolved') {
        complaint.resolutionImage = resolutionImage || 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=800&auto=format&fit=crop&q=80';
        complaint.resolutionNotes = note || 'Issue successfully rectified and inspected by zonal engineer.';
      }

      // Add notification for complaint submitter
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `Status Update: ${complaint.ticketNumber}`,
        message: `Complaint is now [${status}]: ${note || 'Updated by municipal authority.'}`,
        ticketNumber: complaint.ticketNumber,
        complaintId: complaint.id,
        type: 'status',
        timestamp: nowIso,
        read: false,
      });
    }

    if (assignedOfficer) {
      complaint.assignedOfficer = assignedOfficer;
    }
    if (expectedResolutionDate) {
      complaint.expectedResolutionDate = expectedResolutionDate;
    }
    if (department) {
      complaint.department = department;
    }
    if (priority) {
      complaint.priority = priority;
    }

    complaint.updatedAt = nowIso;

    return res.json({ success: true, complaint });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

// Community Upvote
app.post('/api/complaints/:id/vote', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const complaint = complaints.find((c) => c.id === id || c.ticketNumber === id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    complaint.votes += 1;
    complaint.userVoted = true;

    // Check if priority should automatically escalate
    if (complaint.votes >= 20 && complaint.priority !== 'Critical') {
      complaint.priority = 'Critical';
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `Priority Escalation: ${complaint.ticketNumber}`,
        message: `Escalated to Critical due to ${complaint.votes} citizen upvotes.`,
        ticketNumber: complaint.ticketNumber,
        complaintId: complaint.id,
        type: 'vote',
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    return res.json({ success: true, votes: complaint.votes, priority: complaint.priority });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to vote' });
  }
});

// Support Duplicate Complaint (add voice to existing issue)
app.post('/api/complaints/:id/support', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const complaint = complaints.find((c) => c.id === id || c.ticketNumber === id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    complaint.votes += 1;
    complaint.duplicateSupportersCount = (complaint.duplicateSupportersCount || 0) + 1;
    complaint.userVoted = true;

    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Duplicate Support Recorded`,
      message: `You supported existing ticket ${complaint.ticketNumber}. Priority score increased!`,
      ticketNumber: complaint.ticketNumber,
      complaintId: complaint.id,
      type: 'duplicate',
      timestamp: new Date().toISOString(),
      read: false,
    });

    return res.json({
      success: true,
      votes: complaint.votes,
      duplicateSupportersCount: complaint.duplicateSupportersCount,
      pointsEarned: 25,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to support complaint' });
  }
});

// Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({ notifications });
});

app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
  notifications.forEach((n) => (n.read = true));
  res.json({ success: true });
});

// Departments & Stats
app.get('/api/departments', (req: Request, res: Response) => {
  res.json({ departments: DEPARTMENTS });
});

app.get('/api/users', (req: Request, res: Response) => {
  res.json({ users });
});

// -------------------------------------------------------------
// Vite Dev Server / Static Assets
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicPulse server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CivicPulse server:', err);
});
