-- ============================================
-- DIAGNOSTIC QUERIES - Run these in Supabase SQL Editor
-- ============================================

-- 1. Check if swaps table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'swaps'
);
-- Expected: true

-- 2. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'swaps';
-- Expected: rowsecurity = true

-- 3. Check all policies on swaps table
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'swaps';
-- Expected: 3 policies (INSERT, SELECT, UPDATE)

-- 4. Get your current user ID
SELECT auth.uid() as my_user_id;
-- Copy this ID for next queries

-- 5. Check if any swaps exist in the table (as admin)
SELECT * FROM swaps ORDER BY created_at DESC LIMIT 10;
-- This shows ALL swaps (ignoring RLS)

-- 6. Check swaps you can see (with RLS)
SELECT * FROM swaps 
WHERE requester_id = auth.uid() OR receiver_id = auth.uid()
ORDER BY created_at DESC;
-- This shows only swaps YOU can see

-- 7. Count total swaps vs your swaps
SELECT 
  (SELECT COUNT(*) FROM swaps) as total_swaps,
  (SELECT COUNT(*) FROM swaps WHERE requester_id = auth.uid() OR receiver_id = auth.uid()) as my_swaps;

-- ============================================
-- If you see swaps in query 5 but NOT in query 6:
-- The problem is RLS policies - run supabase-rls-policies.sql
-- ============================================

-- ============================================
-- If you see NO swaps in query 5:
-- The inserts are failing - check Console for errors
-- ============================================
