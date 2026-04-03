-- ============================================================
-- EMERGENCY TRIAGE SYSTEM — DATABASE SCHEMA
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- HOSPITALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  trauma_level INTEGER CHECK (trauma_level BETWEEN 1 AND 5), -- Level 1 = highest capability
  phone VARCHAR(20),

  -- Bed capacity
  total_beds INTEGER NOT NULL DEFAULT 0,
  icu_beds_total INTEGER NOT NULL DEFAULT 0,
  icu_beds_available INTEGER NOT NULL DEFAULT 0,

  -- Equipment
  ventilators_total INTEGER NOT NULL DEFAULT 0,
  ventilators_available INTEGER NOT NULL DEFAULT 0,
  has_cath_lab BOOLEAN DEFAULT false,
  has_mri BOOLEAN DEFAULT false,
  has_ct_scanner BOOLEAN DEFAULT false,
  has_burn_unit BOOLEAN DEFAULT false,
  has_stroke_center BOOLEAN DEFAULT false,
  has_trauma_bay BOOLEAN DEFAULT false,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_on_diversion BOOLEAN DEFAULT false, -- Hospital diverting ambulances
  current_load_percent INTEGER DEFAULT 0 CHECK (current_load_percent BETWEEN 0 AND 100),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SPECIALISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS specialists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100) NOT NULL, -- 'neurosurgeon', 'cardiologist', 'trauma_surgeon', etc.
  is_on_duty BOOLEAN DEFAULT false,
  shift_start TIME,
  shift_end TIME,
  on_call BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id VARCHAR(100) UNIQUE NOT NULL, -- EMT incident number
  
  -- Demographics
  age INTEGER,
  gender VARCHAR(20),
  weight_kg DECIMAL(5,2),

  -- Vitals (EMT-reported)
  heart_rate INTEGER,           -- bpm
  systolic_bp INTEGER,          -- mmHg
  diastolic_bp INTEGER,         -- mmHg
  respiratory_rate INTEGER,     -- breaths/min
  spo2 INTEGER,                 -- Oxygen saturation %
  temperature DECIMAL(4,1),     -- Celsius
  gcs_score INTEGER CHECK (gcs_score BETWEEN 3 AND 15), -- Glasgow Coma Scale
  blood_glucose DECIMAL(5,1),   -- mg/dL

  -- Symptoms (array of strings)
  symptoms TEXT[] DEFAULT '{}',
  mechanism_of_injury VARCHAR(255), -- 'MVA', 'fall', 'penetrating trauma', etc.
  chief_complaint TEXT,

  -- Incident location
  incident_latitude DECIMAL(10, 7),
  incident_longitude DECIMAL(10, 7),
  incident_address TEXT,

  -- Triage output
  news2_score INTEGER,           -- Calculated NEWS2 score
  severity_level VARCHAR(20),    -- 'critical', 'high', 'moderate', 'low'
  predicted_care_needs JSONB,    -- { icu: true, ventilator: true, specialist: 'neurosurgeon', ... }
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, dispatched, en_route, arrived, treated
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DISPATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  assigned_hospital_id UUID REFERENCES hospitals(id),
  
  -- Routing decision
  routing_score DECIMAL(5,2),          -- Final optimization score
  estimated_transit_minutes INTEGER,
  actual_transit_minutes INTEGER,
  routing_rationale JSONB,             -- Full explanation of why this hospital was chosen
  
  -- Alternatives considered
  alternatives_evaluated JSONB,        -- Array of other hospitals and their scores
  
  -- Mass casualty
  is_mass_casualty_event BOOLEAN DEFAULT false,
  mce_incident_id VARCHAR(100),
  
  -- Timestamps
  dispatched_at TIMESTAMP DEFAULT NOW(),
  arrived_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Recalculations (mid-journey rerouting)
  recalculation_count INTEGER DEFAULT 0,
  recalculation_log JSONB DEFAULT '[]'
);

-- ============================================================
-- HOSPITAL CAPACITY LOG (for analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS hospital_capacity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  icu_beds_available INTEGER,
  ventilators_available INTEGER,
  current_load_percent INTEGER,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- MASS CASUALTY EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS mass_casualty_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  location_latitude DECIMAL(10, 7),
  location_longitude DECIMAL(10, 7),
  total_patients INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- active, resolved
  started_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_active ON hospitals(is_active, is_on_diversion);
CREATE INDEX IF NOT EXISTS idx_specialists_hospital ON specialists(hospital_id, specialty, is_on_duty);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_patient ON dispatches(patient_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_hospital ON dispatches(assigned_hospital_id);

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hospitals_updated_at BEFORE UPDATE ON hospitals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
