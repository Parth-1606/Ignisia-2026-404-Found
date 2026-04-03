# Emergency Triage Backend - Project Presentation

## 🚀 1. Project Overview
**Ignisia 2026 - Emergency Triage System**
Our project is a real-time Emergency Triage System designed to optimize the dispatching of emergency medical services and provide live updates on hospital capacity. We built a robust backend architecture that ensures high-speed data flow and real-time processing during critical emergency events.

---

## 🛠️ 2. Tech Stack Used
We chose a modern, high-performance tech stack suited for real-time data exchange:
- **Runtime:** Node.js
- **Framework:** Express.js 
- **Primary Database:** PostgreSQL (for persistent storage of patients, hospitals, and dispatch logs)
- **Caching Layer / PubSub:** Redis (for lightning-fast data retrieval and caching)
- **Real-Time Communication:** WebSockets (`ws` / Socket.IO) (to stream live hospital capacities and dispatch statuses)
- **Data Validation:** Joi (strict request payload validation via middleware)
- **Security & Utilities:** Environment-based configurations (`.env`), customized error-handling middleware.

---

## ✨ 3. Core Features & What We Did

### 🚑 Real-Time Dispatch Engine
- Built a dispatch system that dynamically allocates resources based on patient vitals and hospital capacity.
- Handled **batch dispatches** for Mass Casualty Events (MCEs) allowing multiple patients to be processed in a single payload.

### 🏥 Live Hospital Capacity Management
- Developed endpoints to update and fetch real-time Intensive Care Unit (ICU) beds and ventilator availability.
- Used **Redis** to cache hospital data so the dispatch engine doesn't hammer the database on every request.

### 🗃️ Robust Database Architecture (Postgres)
- Designed a highly structured schema:
  - `patients`: Storing vital signs (GCS, SpO2, Heart Rate) and triage categories.
  - `hospitals`: Managing capacity and geographical locations.
  - `dispatch_logs`: Maintaining an audit trail of every emergency routing decision.

### 🛡️ Middleware: Validation & Error Handling
- Created strict payload validations using **Joi** middleware to ensure zero bad data enters our pipeline (e.g., validating that latitude and longitude are within bounds, and vital signs are logical).
- Implemented a centralized **ErrorHandler** to capture unexpected crashes without bringing down the main server.

### ⚡ WebSocket Integration
- Replaced traditional HTTP polling with **WebSockets**, allowing the frontend/dispatchers to receive instantaneous updates whenever hospital loads change or new incidents are reported.

---

## 🎯 4. Why This Approach? (Judges' Talking Points)
* **Scalability:** By integrating Redis alongside PostgreSQL, our system can handle sudden spikes in requests without bottlenecks—crucial for disaster management.
* **Reliability:** Strict middleware validation ensures that edge-case emergency data doesn't break our routing algorithms.
* **Real-time:** In emergencies, seconds matter. Our WebSocket implementation guarantees zero-latency updates for responders in the field.

---

## 💡 5. Next Steps / Future Scope
- Integration with GPS modules for live ambulance tracking.
- AI-based triage prediction models based on the patient vital dataset we've built.

> **Tip for Presentation:** Keep the `db` schema and the `middleware` folders open in your code editor to show the judges your clean codebase and validation schemas!
