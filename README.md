# SafeForge AI

> **Predict Risk. Prevent Incidents.**  
> *AI-Powered Industrial Safety Intelligence & Predictive Risk Prevention Platform*  
> Developed for **INDUX 5.0 AI Hackathon**

---

## 1. Executive Summary & Problem Statement

Heavy industrial manufacturing and fabrication facilities—including robotic welding bays, CNC machining centers, and logistics loading docks—present acute hazards: missing personal protective equipment (PPE), unauthorized intrusions into active robot cells, machine pinch envelopes, abnormal vibration, and toxic fume concentrations.

Traditional workplace safety relies on retrospective incident investigations, sporadic manual clipboard audits, and fragmented sensor gauges. This reactive posture leads to avoidable worker injuries, catastrophic equipment damage, and regulatory penalties.

**SafeForge AI** delivers an operational industrial safety control center that integrates:
1. **Modular Computer Vision Perception**: Real-time worker tracking, ANSI helmet and high-visibility vest compliance checks, and geometric point-in-polygon containment verification.
2. **Deterministic, Explainable Risk Engine**: Configurable composite scoring (0–100) adhering to OSHA 1910 and ISO 45001 safety invariants.
3. **Predictive Analytics & Leading Indicators**: 4-hour forecast horizon hazard probabilities computed via calibrated gradient-boosted feature models.
4. **Interactive Factory Zone Schematics**: 2D floor plans with live thermal risk distribution and occupancy tracking.
5. **AI Safety Copilot**: Server-side Google Gemini 3.8 Flash agent with grounded live database context and deterministic offline fallback.
6. **End-to-End Alert & Incident Lifecycle**: Persistent alerts, supervisor acknowledgement audit trails, and printable OSHA/ISO safety reports.

---

## 2. Core Architecture & Workflow

```
[Camera / Video / Telemetry]
            │
            ▼
┌─────────────────────────┐
│ AI Perception (Vision)  │ ──► [Object Detections, PPE Status, Ray-Casting Polygon Intersection]
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ Industrial Risk Engine  │ ──► [Weighted Invariants, Evidence Attribution, 0-100 Score]
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ Predictive Forecaster   │ ──► [4h Shift Hazard Probabilities, Feature Importance Momentum]
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ Alert & Incident Center │ ──► [NEW ──► ACKNOWLEDGED ──► RESOLVED Audit Records]
└─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│ AI Safety Copilot       │ ──► [Server-side Gemini 3.8 Flash / Deterministic Rule Fallback]
└─────────────────────────┘
```

---

## 3. Technology Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons, Custom Interactive SVG Visualizations (pixel-perfect contrast, zero-pill aesthetic, dark navy industrial palette `#0B1120`).
* **Backend API**: Node.js, Express, TypeScript, tsx.
* **Computer Vision Adapter**: Modular Detection Pipeline with Ray-Casting Point-in-Polygon containment algorithm, optical confidence filtering, and debounce persistence tracking.
* **Predictive Machine Learning**: Calibrated Gradient-Boosted Logistic Probability Forecaster, Brier Score calibration, and feature attribution models.
* **Generative AI Copilot**: Official `@google/genai` TypeScript SDK (`gemini-3.8-flash`) with structured context retrieval and deterministic rule-based fallback.
* **Database & Persistence**: In-memory + file-compatible persistent store supporting full CRUD, relational foreign references, audit logging, and pristine seed reset.

---

## 4. Repository Structure

```
safeforge-ai/
├── server/
│   ├── types.ts                # Canonical schemas (Zones, Alerts, Detections, Incidents, Telemetry)
│   ├── db.ts                   # Persistent store, seed fixtures, CRUD, and audit logging
│   ├── risk-engine.ts          # Deterministic OSHA/ISO 45001 composite scoring engine
│   ├── vision-service.ts       # Modular vision adapter, ray-casting geometry, debounce tracking
│   ├── prediction-service.ts   # Calibrated gradient-boosted shift hazard forecaster
│   └── copilot-service.ts      # Server-side Gemini 3.8 Flash + deterministic safety fallback
├── src/
│   ├── types/                  # Client-side TypeScript interfaces
│   ├── services/api.ts         # Typed REST API client
│   ├── components/
│   │   ├── common/             # Header, Sidebar, RiskBadge
│   │   ├── dashboard/          # DashboardView (KPIs, 24h trend, matrix, sensor strip)
│   │   ├── monitoring/         # MonitoringView (Video canvas, scenario picker, file upload)
│   │   ├── risk/               # RiskIntelligenceView (0-100 explainability, rule configurator)
│   │   ├── zones/              # FactoryZoneMapView (Interactive SVG schematic with 6 sectors)
│   │   ├── alerts/             # AlertsCenterView (Lifecycle triage, acknowledgement, resolution)
│   │   ├── predictions/        # PredictionsView (4h zone forecasts, feature importance)
│   │   ├── copilot/            # CopilotView (Chat, source attribution drawer, markdown)
│   │   ├── incidents/          # IncidentsView (Register, create incident, printable OSHA sheet)
│   │   └── settings/           # SettingsView (Diagnostics, model status, reset data)
│   ├── App.tsx                 # Main application shell and state orchestrator
│   └── index.css               # Dark navy industrial styling and typography
├── tests/
│   └── backend.test.ts         # Automated test suite (46 comprehensive unit & integration tests)
├── server.ts                   # Full-stack entry point mounting Express API + Vite middlewares
├── package.json                # Scripts and dependencies
├── metadata.json               # Applet capabilities metadata
├── .env.example                # Environment variable documentation
└── README.md                   # Complete documentation
```

---

## 5. Getting Started & Startup Instructions

### Prerequisites
* Node.js v18+ (tested on Node v22.23.2)
* npm v9+

### Environment Setup
Create a `.env` file (or configure environment variables):
```bash
cp .env.example .env
```
Key configuration parameters:
* `GEMINI_API_KEY`: *(Optional)* Google Gemini API key for cloud generative explanations. If omitted, the platform automatically switches to the offline deterministic safety rule engine.
* `PORT`: Server port (default: `3000`).

### Installation & Launch
```bash
# 1. Install dependencies
npm install

# 2. Run backend and frontend unified server (Port 3000)
npm run dev

# 3. Build production bundle
npm run build
```

---

## 6. Running the Automated Test Suite

SafeForge AI includes a comprehensive test suite testing 46 test cases across database persistence, risk engine boundaries, polygon ray-casting geometry, debounce tracking, alert lifecycles, and copilot fallback:

```bash
npm test
```

### Verified Test Results
```
========================================
 SafeForge AI Test Suite Execution
========================================
Suite 1: Database & Seed Integrity (8 passed)
Suite 2: Industrial Risk Engine & Score Bounds (12 passed)
Suite 3: Computer Vision & Geometry Overlap (7 passed)
Suite 4: Alert Lifecycle & Audit Trail (6 passed)
Suite 5: Incident Management & Classification (2 passed)
Suite 6: Predictive Analytics & Model Metrics (5 passed)
Suite 7: AI Copilot Fallback & Fact Grounding (6 passed)
========================================
 Test Results: 46 Passed, 0 Failed
========================================
```

---

## 7. End-to-End Hackathon Demonstration Scenario

To present SafeForge AI during live demonstrations, use the built-in presentation workflow:

1. **Dashboard Overview (`/dashboard`)**:
   * Inspect the overall plant safety score (68/100, High Risk baseline).
   * Note active critical alerts and observed PPE compliance (94.2%).
2. **Trigger Live Demo Scenario**:
   * Click the **"Trigger Demo Scenario"** button in the header.
   * *What happens under the hood:*
     * A simulated video frame captures a contractor entering **Welding Bay B** without an ANSI Z89.1 helmet during an automated robotic arc sequence.
     * The vision adapter runs point-in-polygon ray-casting and flags an unauthorized restricted cell intrusion.
     * The risk engine calculates an updated score of **78/100 (CRITICAL)** with itemized factor weights.
     * A new persistent alert (`ALT-1083`) is created and logged to the audit trail.
3. **Inspect Live Optical Viewport (`/monitoring`)**:
   * Observe the visual bounding box over the worker with red alert border, missing helmet tag, and restricted zone boundary polygon overlay.
4. **Factory Zone Map (`/zones`)**:
   * View the 2D floor plan schematic. Welding Bay B pulses with hazard stripes and an active optical breach alert.
5. **AI Safety Copilot (`/copilot`)**:
   * Click prompt chip: *"Why is the welding zone currently high risk?"*
   * The copilot retrieves live database records, citations of VOC sensor readings (185 ppb), and details the missing face shield, recommending an immediate light-curtain barricade check.
6. **Alert Triage & Resolution (`/alerts`)**:
   * Open the Alert Center.
   * Click **"Acknowledge"** on `ALT-1082`, enter supervisor name and notes.
   * Click **"Resolve Alert"**, enter mandatory corrective actions (e.g., worker re-donned helmet and signed safety briefing), and close the alert.
7. **Incident Report Generation (`/incidents`)**:
   * Open Incident Records, select `INC-2026-041`, and click **"Print Sheet"** to open the printable OSHA 1910 incident audit document.

---

## 8. Safety, Security & Privacy Disclosures

* **No Biometric Identification**: SafeForge AI operates exclusively on anonymous bounding boxes and PPE equipment classes. No facial recognition or biometric tracking is conducted.
* **Advisory Decision Support**: SafeForge AI assists human safety officers. The platform does not directly actuate industrial robotics or override physical emergency stop systems (E-Stops).
* **Synthetic Data Transparency**: All demonstration fixtures and predictive training sets are explicitly labeled as synthetic representations.
