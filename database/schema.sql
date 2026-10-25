-- ==============================================================================
-- NRI University Bus — Comprehensive Supabase / PostgreSQL Database Schema
-- Institution: NRI Institute of Technology (NRIIT), Pothavarappadu, Vijayawada
-- Description: Complete schema for AI Demand Forecasting, Overcrowding Detection,
--              Role-Based Access Control (RBAC), and Fleet Allocation.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Types & Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'FACULTY', 'STUDENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('SAFE', 'MODERATE', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bus_status AS ENUM ('In Transit', 'Standby in Depot', 'Allocated Support', 'Maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  department TEXT,
  roll_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Colleges Table
CREATE TABLE IF NOT EXISTS public.colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  departments JSONB NOT NULL DEFAULT '["CSE", "ECE", "IT", "AIML", "DS", "MECH", "CIVIL", "EEE"]',
  total_buses INTEGER NOT NULL DEFAULT 12,
  active_buses INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Routes Table (Route-First Architecture)
CREATE TABLE IF NOT EXISTS public.routes (
  id TEXT PRIMARY KEY,
  route_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  college_id TEXT REFERENCES public.colleges(id) ON DELETE SET NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  assigned_vehicle TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity > 0),
  current_passengers INTEGER NOT NULL DEFAULT 0 CHECK (current_passengers >= 0),
  predicted_passengers INTEGER NOT NULL DEFAULT 0 CHECK (predicted_passengers >= 0),
  predicted_occupancy INTEGER NOT NULL DEFAULT 0,
  risk_level risk_level NOT NULL DEFAULT 'SAFE',
  status TEXT NOT NULL DEFAULT 'Scheduled',
  current_location TEXT,
  next_stop TEXT,
  eta_minutes INTEGER DEFAULT 10,
  explanation TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Stops Table
CREATE TABLE IF NOT EXISTS public.stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  km_marker DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  demand INTEGER NOT NULL DEFAULT 0 CHECK (demand >= 0),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Buses Table (Fleet Inventory)
CREATE TABLE IF NOT EXISTS public.buses (
  id TEXT PRIMARY KEY,
  bus_label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Standard Campus Bus',
  total_seats INTEGER NOT NULL DEFAULT 50 CHECK (total_seats > 0),
  current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  available_seats INTEGER GENERATED ALWAYS AS (total_seats - current_occupancy) STORED,
  status bus_status NOT NULL DEFAULT 'Standby in Depot',
  assigned_route_id TEXT REFERENCES public.routes(id) ON DELETE SET NULL,
  current_location TEXT,
  driver_name TEXT,
  driver_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Bus Locations / Telemetry Table
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id TEXT NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_kmph DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  heading TEXT,
  current_location_desc TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Attendance Sessions Table (QR Dynamic Sessions)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id TEXT PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  subject TEXT NOT NULL,
  period TEXT NOT NULL,
  room TEXT,
  faculty_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  faculty_name TEXT NOT NULL,
  present_count INTEGER NOT NULL DEFAULT 0,
  total_students INTEGER NOT NULL DEFAULT 60,
  attendance_pct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN GENERATED ALWAYS AS (now() < expires_at) STORED
);

-- 10. Attendance Records Table (Student Attendance Logs)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Present',
  marked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_session_student UNIQUE (session_id, student_id)
);

-- 11. AI Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  route_id TEXT REFERENCES public.routes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Recommendations & Bus Allocations Table
CREATE TABLE IF NOT EXISTS public.bus_allocations (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  allocated_bus_id TEXT NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'STANDBY_DISPATCH',
  additional_capacity INTEGER NOT NULL DEFAULT 35,
  dispatched_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled')),
  impact_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  dispatched_at TIMESTAMPTZ
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_allocations ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Routes & Stops: Everyone can view, only Admin can modify
CREATE POLICY "Routes viewable by all"
  ON public.routes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify routes"
  ON public.routes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Stops viewable by all"
  ON public.stops FOR SELECT
  TO authenticated
  USING (true);

-- Buses: Viewable by all, editable by Admins
CREATE POLICY "Buses viewable by all"
  ON public.buses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify buses"
  ON public.buses FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Attendance Sessions: Viewable by authenticated, created by Faculty & Admin
CREATE POLICY "Attendance sessions viewable by authenticated"
  ON public.attendance_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Faculty and admin can create sessions"
  ON public.attendance_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('FACULTY', 'ADMIN'))
  );

-- Attendance Records: Students can mark attendance, faculty/admin view all
CREATE POLICY "Attendance records viewable by faculty and admin"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('FACULTY', 'ADMIN'))
    OR student_id = auth.uid()::text
  );

CREATE POLICY "Students can insert attendance record"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Bus Allocations: Viewable by authenticated, applied by Admin
CREATE POLICY "Bus allocations viewable by all"
  ON public.bus_allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can execute bus allocations"
  ON public.bus_allocations FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER (ON AUTH SIGNUP)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role public.user_role := 'STUDENT';
  req_role TEXT;
  admin_key TEXT;
BEGIN
  req_role := NEW.raw_user_meta_data->>'role';
  admin_key := NEW.raw_user_meta_data->>'adminKey';

  -- Prevent unauthorized Admin escalation
  IF req_role = 'ADMIN' AND admin_key = 'NRIIT-ADMIN-2025' THEN
    assigned_role := 'ADMIN';
  ELSIF req_role = 'FACULTY' THEN
    assigned_role := 'FACULTY';
  ELSE
    assigned_role := 'STUDENT';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, department, roll_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'NRIIT Commuter'),
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'department', 'CSE'),
    NEW.raw_user_meta_data->>'roll_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- INITIAL NRIIT SEED DATA
-- ==============================================================================
INSERT INTO public.colleges (id, name, code, location, latitude, longitude, total_buses, active_buses)
VALUES (
  'nriit-pilot',
  'NRI Institute of Technology',
  'NRIIT',
  'Pothavarappadu, Via Nunna, Vijayawada, Andhra Pradesh - 521212',
  16.5815,
  80.7384,
  12,
  8
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.routes (id, route_number, name, slug, college_id, origin, destination, assigned_vehicle, capacity, current_passengers, predicted_passengers, predicted_occupancy, risk_level, status, current_location, next_stop, eta_minutes, explanation, recommendation)
VALUES 
(
  'route-1',
  1,
  'Route 1 — Mangalagiri to NRIIT',
  'mangalagiri-nriit',
  'nriit-pilot',
  'NRI Institute of Technology (Pothavarappadu)',
  'Mangalagiri Bus Complex',
  'Assigned Vehicle A (Demo Bus)',
  50,
  43,
  58,
  116,
  'HIGH',
  'In Transit',
  'Approaching Chinna Kakani',
  'Chinna Kakani',
  6,
  'Passenger demand is predicted at 58 (116%) based on 91% campus attendance, 136 waiting passengers across stops (peak at Kaza & Chinna Kakani), and morning peak timetable.',
  'Deploy standby Assigned Vehicle D or reallocate available 20-seat capacity from low-demand Route 3.'
),
(
  'route-2',
  2,
  'Route 2 — Vijayawada Benz Circle to NRIIT',
  'benz-circle-nriit',
  'nriit-pilot',
  'NRI Institute of Technology (Pothavarappadu)',
  'Benz Circle, Vijayawada',
  'Assigned Vehicle B (Demo Bus)',
  55,
  38,
  45,
  82,
  'MODERATE',
  'In Transit',
  'Near Gunadala Ring',
  'Ramavarappadu Ring',
  8,
  'Current occupancy is within safe operational limits (69%). Forecasted passenger influx at Ramavarappadu will bring utilization to 82%, maintaining comfortable safety margins.',
  'Maintain standard dispatch timetable; monitor Ramavarappadu boarding via simulated live telemetry.'
),
(
  'route-3',
  3,
  'Route 3 — Gannavaram Airport Corridor to NRIIT',
  'gannavaram-nriit',
  'nriit-pilot',
  'NRI Institute of Technology (Pothavarappadu)',
  'Gannavaram Bus Stand',
  'Assigned Vehicle C (Demo Bus)',
  45,
  19,
  22,
  49,
  'SAFE',
  'In Transit',
  'Enikepadu Junction',
  'Kesarapalle',
  11,
  'Route occupancy is low (42% current, 49% predicted). Ample spare capacity of 23 seats is available.',
  'Vehicle capacity can be partially reassigned or standby shuttle can be redirected to assist Route 1 if demand surges further.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buses (id, bus_label, category, total_seats, current_occupancy, status, assigned_route_id, current_location, driver_name, driver_contact)
VALUES
('veh-demo-a', 'Assigned Vehicle A', 'Standard Campus Bus', 50, 43, 'In Transit', 'route-1', 'Approaching Chinna Kakani', 'R. Venkateswara Rao', '+91 98480 12341'),
('veh-demo-b', 'Assigned Vehicle B', 'Standard Campus Bus', 55, 38, 'In Transit', 'route-2', 'Near Gunadala Ring', 'K. Samba Siva Rao', '+91 98480 12342'),
('veh-demo-c', 'Assigned Vehicle C', 'Standard Campus Bus', 45, 19, 'In Transit', 'route-3', 'Enikepadu Junction', 'P. Srinivasa Reddy', '+91 98480 12343'),
('veh-demo-d', 'Standby Vehicle D', 'Standby Feeder Shuttle', 35, 0, 'Standby in Depot', NULL, 'NRIIT Campus Depot (Nunna)', 'M. Nagaraju', '+91 98480 12344')
ON CONFLICT (id) DO NOTHING;
