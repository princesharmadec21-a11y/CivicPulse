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

---

## 💻 How to Locally Host and Run CivicPulse (Step-by-Step Guide)

Follow this complete guide to download, install, configure, and host CivicPulse locally on your machine (Windows, macOS, or Linux).

---

### 1. Prerequisites Checklist
Before starting, ensure you have the following installed on your computer:
- **Node.js**: `v18.0.0` or higher (`v20.x` or `v22.x` recommended). Verify with:
  ```bash
  node -v
  ```
- **npm**: `v9.0.0` or higher (comes bundled with Node.js). Verify with:
  ```bash
  npm -v
  ```
- **Git**: (Optional, for cloning). Verify with `git --version`.

---

### 2. Download the Source Code

#### Option A: Clone via Git
Open your terminal or command prompt:
```bash
git clone https://github.com/your-username/civicpulse.git
cd civicpulse
```

#### Option B: Download as ZIP
1. Download the repository ZIP file from GitHub or AI Studio.
2. Extract the ZIP into a folder of your choice (e.g. `C:\Projects\CivicPulse` or `~/Projects/CivicPulse`).
3. Open your terminal in that folder:
   ```bash
   cd path/to/CivicPulse
   ```

---

### 3. Install Dependencies
Run the following command to download all required frontend and backend packages:
```bash
npm install
```
*This installs React 19, Tailwind CSS v4, Express.js, Leaflet, `@google/genai`, Lucide icons, Motion, and development tools.*

---

### 4. Configure Environment Variables (`.env`)
1. Create a `.env` file in the root directory by copying the example file:
   - **On macOS / Linux**:
     ```bash
     cp .env.example .env
     ```
   - **On Windows (Command Prompt)**:
     ```cmd
     copy .env.example .env
     ```
   - **On Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```

2. Open `.env` in any text editor (VS Code, Notepad, etc.):
   ```env
   # GEMINI_API_KEY: (Optional) Your Google Gemini API Key.
   # Get a free key at: https://aistudio.google.com/
   GEMINI_API_KEY="your-gemini-api-key-here"

   # PORT: Local server port (Default: 3000)
   PORT=3000
   ```
   > 💡 **No API key? No problem!** CivicPulse includes an **intelligent fallback AI heuristic engine**. The app will run, classify photos, assign departments, and detect priorities even if `GEMINI_API_KEY` is not provided.

---

### 5. Run the Local Development Server
Start the unified full-stack server (Express API + Vite React Dev Middleware):
```bash
npm run dev
```

You will see terminal output similar to:
```text
> tsx server.ts
CivicPulse server is running on http://0.0.0.0:3000
```

Now open your web browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### 6. Test on Mobile Devices on the Same Wi-Fi Network
CivicPulse listens on `0.0.0.0:3000`, allowing you to test real-world camera photo uploads and GPS geolocation directly on your smartphone:
1. Ensure your phone and computer are connected to the **same Wi-Fi network**.
2. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` in Command Prompt (look for *IPv4 Address*, e.g. `192.168.1.45`).
   - **macOS**: Run `ipconfig getifaddr en0` or check *System Settings > Wi-Fi > Details*.
   - **Linux**: Run `hostname -I` or `ip a`.
3. On your phone's browser, navigate to:
   ```text
   http://<YOUR_COMPUTER_IP>:3000
   (Example: http://192.168.1.45:3000)
   ```

---

### 7. Run Pure Logic Unit Tests
CivicPulse includes automated unit tests verifying the Haversine distance formula, duplicate detection radius, priority weighting, and admin authentication rules:
```bash
npx tsx --test src/utils/civic-rules.test.ts
```
Expected output:
```text
✔ calculateDistanceMeters accurately computes small geographic distances
✔ findPotentialDuplicates flags complaints in close proximity with matching category
✔ computePriorityScore evaluates urgency, hazard risk and community votes
✔ calculateGamificationTier maps points to appropriate civic rank & badges
✔ aggregateCivicStats computes resolution rate, counts and wards
✔ validateAdminCredentials verifies municipal admin and officer logins
✔ categorizeRaisedVsSolved splits complaints into raised and solved sets
# tests 7
# pass 7
# fail 0
```

---

### 8. Production Build & Hosting Locally
If you want to compile an optimized static bundle and run CivicPulse in production mode:
1. **Build the production bundle**:
   ```bash
   npm run build
   ```
   *(This outputs the optimized assets to the `/dist` directory).*

2. **Start the production server**:
   ```bash
   npm start
   ```
   *(Express will serve the production `/dist` folder with minimal latency).*

---

### 9. Troubleshooting & FAQs

#### Q1: Error `EADDRINUSE: address already in use :::3000`
- **Cause**: Another program (or a previous node process) is already using port 3000.
- **Fix A (Run on a different port)**:
  ```bash
  PORT=3001 npm run dev
  ```
  *(Then open `http://localhost:3001`)*.
- **Fix B (Kill existing process)**:
  - **macOS / Linux**: `npx kill-port 3000` or `lsof -ti :3000 | xargs kill -9`
  - **Windows**: `npx kill-port 3000` or in PowerShell: `Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process`

#### Q2: `tsx: command not found`
- **Fix**: Run `npm install` again to ensure devDependencies are installed, or run with `npx`:
  ```bash
  npx tsx server.ts
  ```

#### Q3: Geolocation button says "Geolocation permission denied"
- **Fix**: Browsers restrict GPS to `http://localhost` and `https://` origins. When prompted by your browser, click **"Allow Location Access"**. If testing on an external IP without HTTPS, you can still click or drag the pin anywhere on the interactive mini-map to set coordinates manually.

#### Q4: How do I test the Admin Portal?
- Click the **"Admin Login"** button in the header.
- Use the quick 1-click **"Municipal Admin"** button (or enter `commissioner@civic.gov.in` with password `admin123`) to unlock the **Raised vs. Solved Reports Dossier**.

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
