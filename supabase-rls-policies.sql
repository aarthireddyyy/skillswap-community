-- ============================================
-- Supabase RLS Policies for Swaps Table
-- ============================================
-- Run these commands in your Supabase SQL Editor
-- to enable proper permissions for swap requests

-- 1. Enable Row Level Security on swaps table
ALTER TABLE swaps ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (optional, for clean setup)
DROP POLICY IF EXISTS "allow insert swaps" ON swaps;
DROP POLICY IF EXISTS "allow read swaps" ON swaps;
DROP POLICY IF EXISTS "Users can create swap requests" ON swaps;
DROP POLICY IF EXISTS "Users can view their swaps" ON swaps;
DROP POLICY IF EXISTS "Users can update their swaps" ON swaps;

-- 3. Allow authenticated users to INSERT swap requests
-- Only if they are the requester (auth.uid() = requester_id)
CREATE POLICY "allow insert swaps"
ON swaps
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- 4. Allow users to SELECT/view swaps they're involved in
-- Either as requester or receiver
CREATE POLICY "allow read swaps"
ON swaps
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = receiver_id
);

-- 5. Allow users to UPDATE swaps they're involved in
-- Both requester and receiver can update (for status changes)
CREATE POLICY "Users can update their swaps"
ON swaps
FOR UPDATE
TO authenticated
USING (
  auth.uid() = requester_id OR 
  auth.uid() = receiver_id
)
WITH CHECK (
  auth.uid() = requester_id OR 
  auth.uid() = receiver_id
);

-- ============================================
-- Verification Queries
-- ============================================

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'swaps';

-- List all policies on swaps table
SELECT * FROM pg_policies WHERE tablename = 'swaps';

-- ============================================
-- Test Insert (run as authenticated user)
-- ============================================
-- Replace UUIDs with actual user IDs from your profiles table
-- INSERT INTO swaps (requester_id, receiver_id, skill_requested, skill_offered, status)
-- VALUES (
--   'your-user-id-here',
--   'target-user-id-here',
--   'JavaScript',
--   'Python',
--   'pending'
-- );

-- ============================================
-- IMPORTANT: Ensure table structure is correct
-- ============================================
-- If the swaps table doesn't exist, create it:
/*
CREATE TABLE IF NOT EXISTS swaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_requested TEXT NOT NULL,
  skill_offered TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT different_users CHECK (requester_id != receiver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swaps_requester ON swaps(requester_id);
CREATE INDEX IF NOT EXISTS idx_swaps_receiver ON swaps(receiver_id);
CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status);
*/