# 🏛️ CivicPulse — Smart Civic Issue Reporting Platform

> **An AI-powered, full-stack civic infrastructure grievance redressal system with real-time GPS geolocation, Gemini multimodal visual defect classification, duplicate detection, and live municipal resolution tracking.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_Vision-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet_Map-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

---

## 📌 1. Project Overview & Problem Statement

Citizens frequently encounter urban infrastructure issues such as open potholes, overflowing garbage dumps, broken streetlights, water pipeline bursts, and blocked drainage. Traditionally, reporting these issues involves visiting municipal offices, calling unresponsive helplines, or posting on social media without accountability. This causes:
- ❌ Fragmented communication and delayed field response times.
- ❌ Duplicate complaints filed by dozens of citizens for the same pothole or leak, overwhelming municipal crew dispatch.
- ❌ Zero transparency into whether an issue is under review, assigned to an engineer, or solved.

### 💡 The Solution: CivicPulse
**CivicPulse** is an end-to-end civic-tech platform that lets citizens simply snap a photo, upload it, and watch the system automatically:
1. **Detect Location via GPS** and pin it on an interactive city map.
2. **Classify the Defect Using Gemini Multimodal Vision AI** to predict the category, assess safety urgency (*Critical, High, Medium, Low*), and recommend the responsible municipal department.
3. **Filter Nearby Duplicates** (within 250m) and prompt citizens to support existing tickets instead of creating duplicate work orders.
4. **Track the Issue in Real Time** through a 5-stage milestone timeline (*Submitted ➔ Verified ➔ Assigned ➔ In Progress ➔ Resolved*), complete with officer contact details, SLA turnaround countdowns, and Before & After proof photos.

---

## 🏙️ Real-Life Municipal Scenario (Lucknow Smart City)
Suppose you are walking along **Lohia Path, Gomti Nagar** and encounter a 2-foot wide dangerous crater in the road:
1. Open the app and click **"+ Report Issue"** (or use one of the one-click real-world test samples).
2. The system scans the photo with **Gemini Vision AI**, identifying it as `Road Damage` (96% confidence) with `High Priority` and recommends routing to `Roads & Public Works Department (PWD)`.
3. The **GPS engine** captures coordinates (`26.8524° N, 80.9782° E`) and maps the location.
4. The **duplicate proximity engine** checks if a similar issue was recently reported nearby.
5. The complaint ticket `#CIV-1025` is created, awarding **+50 Civic Points** to your profile.
6. The PWD Zonal Officer logs into the **Municipal Authority Console**, dispatches a hotmix patching crew, updates progress, and uploads verified repair proof.

---

## 🎯 Main Stakeholders

| Stakeholder | Key Capabilities |
| :--- | :--- |
| **Citizen Contributor** | Report grievances with photos, auto-detect GPS, vote on affected issues, track status in real-time, earn Civic Points and Badges. |
| **Municipal Officer** | Inspect assigned tickets, dispatch field repair squads, update progress notes, and attach Before & After completion proofs. |
| **City Administrator** | Monitor citywide KPI statistics, audit raised vs. solved complaints, track department SLAs, and export CSV grievance reports. |

---

## 🛠️ Complete Tech Stack

### Frontend
- **Framework**: React 19 (Functional components, hooks, modular architecture)
- **Styling**: Tailwind CSS v4 with modern typography (`Plus Jakarta Sans` & `JetBrains Mono`)
- **Maps & Geolocation**: Leaflet.js with OpenStreetMap tiles, custom SVG markers, draggable pickers, and density heatmaps
- **Icons & Animation**: Lucide React icons & Motion
- **Tooling**: Vite 8 & TypeScript

### Backend
- **Runtime**: Node.js with Express.js REST API
- **AI / Multimodal Vision**: `@google/genai` TypeScript SDK utilizing **Gemini 3.8 Flash** (`gemini-3.8-flash`) with telemetry headers and intelligent fallback heuristic engine for offline development
- **Mathematical / Geodesic Logic**: Haversine distance formula, priority weight scoring, and gamification level calculations
- **Testing**: Node.js built-in test runner (`node:test` & `node:assert/strict`) executed via `npx tsx --test`

---

## 🚀 Key Features

### 1. 🤖 AI Image Classification
- Multi-modal vision analysis via server endpoint `/api/ai/classify-issue`.
- Extracts:
  - **Predicted Category**: `Road Damage`, `Waste Issue`, `Water Supply & Leakage`, `Electrical & Street Light`, `Sanitation & Drainage`, `Public Property`.
  - **Confidence Score**: e.g. `96% Confidence`.
  - **Detected Defect**: Technical description of the fault.
  - **Urgency Priority**: `Critical`, `High`, `Medium`, `Low`.
  - **Safety Hazard Flag**: Electrocution hazards, deep craters, or live wire risks.
  - **Routing Department**: Suggested municipal department for dispatch.

### 2. 📍 GPS Location Detection & Interactive Map
- 1-click **"Detect My GPS"** using HTML5 Geolocation API.
- Draggable pin mini-map for adjusting exact street addresses and ward numbers.
- Full-screen city map with color-coded markers:
  - 🔴 **Red**: Road Damage / Potholes
  - 🟢 **Green**: Waste / Garbage Dumps
  - 🔵 **Cyan**: Water Pipeline Leakage
  - 🟡 **Amber**: Streetlight & Dangling Cables
  - 🟣 **Purple**: Drainage & Sewage Overflow
  - 🟩 **Green Check**: Solved & Repaired Issues
- Density **Heatmap Toggle** highlighting civic defect risk clusters.

### 3. ⚠️ Proximity Duplicate Complaint Detection
- Computes spatial distance using Haversine formula against all active complaints within a 250m radius.
- When a match is detected:
  - Displays a side-by-side alert with the existing ticket details.
  - One-click **"Support This (+25 pts)"** to consolidate community voice and escalate priority without duplicate work orders.
  - Option to override if reporting a distinct issue.

### 4. 🚚 Real-Time Complaint Status Tracking
- 5-stage milestone tracker (similar to food delivery tracking):
  `Submitted ➔ Verified ➔ Assigned ➔ In Progress ➔ Resolved`
- Displays ticket numbers (e.g. `#CIV-1025`), assigned officer name, phone number, and zone.
- Estimated resolution countdown (e.g. `Expected: 2026-11-04`).
- Status history audit log and community discussion thread.
- Printable civic receipt button.

### 5. 🔐 Official Admin Login & Authority Console
- Dedicated **Authority Sign-In** portal for municipal personnel.
- 1-click demo logins for City Commissioner & PWD Zonal Officer.
- **Segmented Dossier Views**:
  - 📌 **All Raised Grievances**: Active complaints requiring dispatch.
  - ✅ **Solved & Resolved Reports**: Complete dossier with **Before & After photo proof**, inspector certification notes, and turnaround metrics.
  - 📋 **Complete Audit Log**: Full municipal register.
  - 🚨 **Critical Only**: Emergency hazard queue.
- Inline status updater with work order dispatch and inspector note logger.
- One-click **Export Grievance Report (CSV)**.

### 6. 📊 City Civic Health & SLA Analytics Dashboard
- Most reported civic defect types (volume distribution progress bars).
- Ward & Zone vulnerability hotspot rankings.
- Municipal Department SLA scorecards (average turnaround days, active vs. resolved tickets).
- Top Citizen Guardians leaderboard.

### 7. 🏆 Gamification & Rewards
- Citizen rewards modal tracking points and badge unlocks:
  - 🤝 **Community Helper** (50 pts)
  - 👁️ **City Watcher** (100 pts)
  - 🛠️ **Problem Solver** (250 pts)
  - 🦸 **City Hero** (500 pts)
  - 🏆 **Civic Champion** (1000 pts)
- Point rewards: **+50 pts** for filing verified reports, **+25 pts** for supporting duplicates, **+100 pts** when your reported issue is resolved.

---

## 🗄️ Database Collections (Data Model)

```typescript
// Complaints Collection
interface CivicIssue {
  id: string;
  ticketNumber: string;               // e.g. "CIV-1025"
  title: string;
  description: string;
  category: CivicCategory;            // Road Damage | Waste Issue | Water Supply...
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Submitted' | 'Verified' | 'Assigned' | 'In Progress' | 'Resolved';
  image: string;                      // Citizen upload / photo proof URL
  resolutionImage?: string;           // Before & After field crew repair photo
  resolutionNotes?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    ward: string;
    city: string;
  };
  department: string;                 // Assigned municipal department
  assignedOfficer?: {
    name: string;
    designation: string;
    phone: string;
    zone: string;
  };
  expectedResolutionDate?: string;
  reportedBy: { id: string; name: string; email: string; badge: string };
  votes: number;                      // Community upvotes
  duplicateSupportersCount: number;
  statusHistory: Array<{ status: string; timestamp: string; note: string; updatedBy: string }>;
  aiAnalysis?: AIAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

// Users Collection
interface CivicUser {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'officer' | 'admin';
  points: number;
  badges: string[];
  solvedCount: number;
  reportedCount: number;
}
```

---

## 🔑 Demo Credentials

CivicPulse includes pre-configured municipal accounts for testing:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **City Administrator** | Dr. Alok Mathur (Commissioner) | `commissioner@civic.gov.in` | `admin123` |
| **Zonal Field Officer** | Er. Rajiv Verma (PWD Chief) | `r.verma@civic.gov.in` | `officer123` |
| **Citizen Contributor** | Priya Sharma | `priya.sharma@gmail.com` | *(Active citizen session)* |

*(The Admin Login modal also features 1-click quick-fill buttons for both administrator and officer roles).*

---

## 💻 Getting Started & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/civicpulse.git
   cd civicpulse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (optional for local testing, as the platform contains a built-in heuristic fallback engine):
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   PORT=3000
   ```

4. **Run Pure Logic Unit Tests**:
   ```bash
   npx tsx --test src/utils/civic-rules.test.ts
   ```
   *(Verifies Haversine distance, duplicate detection radius, priority weighting, admin auth, and statistical aggregation).*

5. **Start the Full-Stack Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📂 Project Structure

```text
├── server.ts                       # Express backend server & Gemini AI API proxy routes
├── index.html                      # HTML entry with Leaflet & Google Fonts
├── metadata.json                   # Applet manifest & permissions
├── package.json                    # Scripts and dependencies
├── src/
│   ├── App.tsx                     # Main application layout, view tabs, and modals
│   ├── main.tsx                    # React client entry point
│   ├── index.css                   # Tailwind v4 styles & Leaflet pin custom rules
│   ├── types/
│   │   └── civic.ts                # TypeScript interfaces for issues, users, notifs
│   ├── data/
│   │   └── seedData.ts             # Seed municipal complaints, departments & test photos
│   ├── utils/
│   │   ├── civic-rules.ts          # Pure logic (Haversine formula, duplicate check, auth)
│   │   └── civic-rules.test.ts     # Automated unit tests using node:test
│   └── components/
│       ├── Navbar.tsx              # Top navigation, notification bell, admin login button
│       ├── CivicMap.tsx            # Leaflet interactive map with category pins & heatmap
│       ├── ComplaintsFeed.tsx      # Filterable & searchable complaints card grid
│       ├── ReportIssueModal.tsx    # 4-step wizard: AI vision scan, GPS picker, duplicate check
│       ├── ComplaintTrackerModal.tsx # 5-step milestone tracking & before/after proofs
│       ├── AdminDashboard.tsx      # Raised vs. Solved dossiers, status updater, CSV export
│       ├── AdminLoginModal.tsx     # Official municipal authority login dialog
│       ├── AnalyticsDashboard.tsx  # SLA charts, ward hotspots, and leaderboard
│       └── GamificationModal.tsx   # Points balance, tier progression, and badge unlocks
```

---

## 📄 License
This project is licensed under the Apache-2.0 License.
