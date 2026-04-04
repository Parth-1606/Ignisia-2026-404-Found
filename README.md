# 🚑 Golden-Hour Emergency Triage & Hospital Routing System

A production-grade backend for real-time emergency dispatch — predicts patient care needs from EMT vitals and routes ambulances to the **optimal hospital** based on live capacity, specialist availability, and transit time.

---

## Architecture Overview

```
EMT Reports Vitals
       │
       ▼
┌─────────────────────┐
│  Severity Predictor  │  NEWS2 clinical scoring → ICU / Ventilator / Specialist needs
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Routing Engine     │  Constraint optimization → scores every hospital (0-100)
│                     │  Weights: Care(35) + Beds(20) + Load(15) + Specialist(20) + Transit(10)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   Dispatch Service   │  Writes to PostgreSQL, caches in Redis, broadcasts via WebSocket
└─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | PostgreSQL 14+ |
| Cache | Redis 7+ |
| Real-time | WebSocket (ws) |
| Routing API | OpenRouteService (free) / Haversine fallback |
| Validation | Joi |

---

## Quick Start

### 1. Prerequisites
```bash
# Required
node >= 18.0.0
postgresql >= 14
redis >= 7
```

### 2. Clone & Install
```bash
git clone <repo>
cd emergency-triage-backend
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL and Redis credentials
```

### 4. Setup Database
```bash
# Run migrations (creates all tables)
npm run migrate

# Seed with 6 hospitals + 18 specialists
npm run seed
```

### 5. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:3000`  
WebSocket at: `ws://localhost:3000/ws`

---

## API Reference

### 🔴 Dispatch Endpoints

#### `POST /api/dispatch`
Triage + route a patient in one call. Returns optimal hospital with full rationale.

**Request Body:**
```json
{
  "incident_id": "INC-2024-001",
  "age": 34,
  "gender": "male",
  "heart_rate": 135,
  "systolic_bp": 78,
  "diastolic_bp": 50,
  "respiratory_rate": 32,
  "spo2": 86,
  "temperature": 35.1,
  "gcs_score": 8,
  "symptoms": ["major_trauma", "hemorrhage", "shock"],
  "mechanism_of_injury": "mva_high_speed",
  "chief_complaint": "Unresponsive after high-speed MVA",
  "incident_latitude": 40.7128,
  "incident_longitude": -74.0060,
  "incident_address": "I-95 Northbound, Mile 42"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "patientId": "uuid",
    "incidentId": "INC-2024-001",
    "prediction": {
      "news2Score": 16,
      "severityLevel": "critical",
      "predictedCareNeeds": {
        "icu": true,
        "ventilator": true,
        "specialist": "trauma_surgeon",
        "specialistUrgency": "immediate",
        "equipment": ["trauma_bay", "ct_scanner"]
      },
      "vitalBreakdown": [...]
    },
    "routing": {
      "optimal": {
        "hospital": { "name": "Metro General Trauma Center", ... },
        "totalScore": 74,
        "transitMinutes": 7,
        "breakdown": { "care": 35, "beds": 4, "load": 6, "specialist": 20, "transit": 9 }
      },
      "alternatives": [...]
    },
    "rationale": "ROUTING DECISION: Metro General Trauma Center\n..."
  }
}
```

---

#### `POST /api/dispatch/triage-only`
Run severity prediction only — no routing, no DB write.

**Request:** Same vitals fields as above  
**Response:** Returns `news2Score`, `severityLevel`, `predictedCareNeeds`, `vitalBreakdown`

---

#### `POST /api/dispatch/batch`
Mass Casualty Event — route up to 100 patients simultaneously with load balancing.

```json
{
  "mce_id": "MCE-2024-001",
  "description": "Highway pile-up, I-95 Mile 42",
  "patients": [
    { "incident_latitude": 40.71, "incident_longitude": -74.00, "heart_rate": 140, ... },
    { "incident_latitude": 40.71, "incident_longitude": -74.00, "heart_rate": 88, ... }
  ]
}
```

---

#### `POST /api/dispatch/:patientId/reroute`
Recalculate mid-journey (hospital reached capacity, road closure, etc.)

```json
{
  "reason": "Assigned hospital reached ICU capacity",
  "current_latitude": 40.7300,
  "current_longitude": -74.0100
}
```

---

#### `PATCH /api/dispatch/:patientId/status`
Update patient status as journey progresses.

```json
{ "status": "arrived" }
```
Valid statuses: `en_route` → `arrived` → `treated` | `cancelled`

---

### 🏥 Hospital Endpoints

#### `GET /api/hospitals`
Returns all hospitals with live capacity and on-duty specialists.

#### `GET /api/hospitals/:id`
Single hospital with full details.

#### `PATCH /api/hospitals/:id/capacity`
Update live capacity — called by hospital management systems. Invalidates Redis cache + broadcasts WebSocket event.

```json
{
  "icu_beds_available": 10,
  "ventilators_available": 6,
  "current_load_percent": 82,
  "is_on_diversion": false
}
```

#### `PATCH /api/hospitals/:id/specialists/:specialistId`
Toggle specialist on-duty status.

```json
{ "is_on_duty": false, "on_call": true }
```

---

### 📊 Analytics Endpoints

#### `GET /api/patients/analytics/summary`
Dashboard summary — patient counts by severity, system-wide capacity, avg transit time.

#### `GET /api/hospitals/:id/capacity/history?hours=24`
Capacity trend data for a hospital over the last N hours.

---

## WebSocket Events

Connect to `ws://localhost:3000/ws`

**Events received by dashboard:**

| Event | Trigger |
|---|---|
| `DISPATCH_PROGRESS` | Triage/routing in progress |
| `DISPATCH_COMPLETE` | Patient routed, hospital assigned |
| `PATIENT_REROUTED` | Mid-journey hospital change |
| `HOSPITAL_CAPACITY_UPDATED` | Any hospital capacity change |
| `MCE_BATCH_STARTED` | Batch routing started |
| `MCE_BATCH_COMPLETE` | Batch routing finished |

**Example WebSocket payload:**
```json
{
  "type": "DISPATCH_COMPLETE",
  "patientId": "uuid",
  "severity": "critical",
  "news2Score": 16,
  "assignedHospital": {
    "name": "Metro General Trauma Center",
    "latitude": 40.7589,
    "longitude": -73.9851
  },
  "transitMinutes": 7,
  "score": 74,
  "rationale": "ROUTING DECISION: ...",
  "timestamp": "2024-01-15T14:32:00.000Z"
}
```

---

## Symptom Keywords (for `symptoms` array)

| Category | Supported Values |
|---|---|
| Neurological | `head_injury`, `stroke_symptoms`, `seizure`, `altered_consciousness`, `paralysis` |
| Cardiac | `chest_pain`, `cardiac_arrest`, `palpitations`, `stemi` |
| Respiratory | `respiratory_distress`, `shortness_of_breath`, `pneumonia` |
| Trauma | `major_trauma`, `penetrating_trauma`, `burns`, `amputation`, `hemorrhage` |
| General | `unconscious`, `shock`, `hypoglycemia`, `allergic_reaction` |

## Mechanism of Injury Keywords

`mva_high_speed`, `mva`, `fall_from_height`, `fall`, `penetrating`, `burn`, `drowning`, `electrocution`

---

## Scoring Engine Weights

| Constraint | Weight | Description |
|---|---|---|
| Care needs match | 35 pts | Equipment and capability match. Hard disqualify if ICU/ventilator unavailable |
| Bed availability | 20 pts | ICU bed ratio or general capacity percentage |
| Hospital load | 15 pts | Current occupancy %. Diversion = 0 pts |
| Specialist availability | 20 pts | On-duty = 100%, On-call = 70% (40% if immediate urgency) |
| Transit time | 10 pts | Degrades sharply beyond 20 minutes |
| MCE penalty | -8 pts/patient | Applied per assignment during mass casualty events |

---

## Project Structure

```
src/
├── server.js              # Entry point, HTTP + WebSocket init
├── app.js                 # Express app, middleware, routes
├── db/
│   ├── postgres.js        # PG pool, query helpers, transaction wrapper
│   ├── redis.js           # Redis client, hospital cache, MCE tracking
│   ├── schema.sql         # Full database schema
│   ├── migrate.js         # Migration runner
│   └── seed.js            # Seed hospitals and specialists
├── services/
│   ├── severityPredictor.js  # NEWS2 triage scoring engine
│   ├── routingEngine.js      # Constraint-based hospital optimizer
│   ├── routingService.js     # Transit time (ORS API + Haversine)
│   └── dispatchService.js    # Pipeline orchestrator
├── routes/
│   ├── dispatch.js           # Dispatch + triage endpoints
│   ├── hospitals.js          # Hospital CRUD + capacity updates
│   └── patients.js           # Patient list + analytics
├── middleware/
│   ├── validation.js         # Joi schemas + validate() factory
│   └── errorHandler.js       # Global error + 404 handlers
└── websocket/
    └── broadcaster.js        # WebSocket server + event emitter
```
