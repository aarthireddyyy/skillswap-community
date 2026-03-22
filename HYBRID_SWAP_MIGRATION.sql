-- ============================================
-- HYBRID SWAP SYSTEM - DATABASE MIGRATION
-- ============================================
-- Run these commands in Supabase SQL Editor

-- 1. Add 'type' column to skills table (if not exists)
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'teaching';

-- 2. Add 'match_type' column to swaps table (if not exists)
ALTER TABLE swaps 
ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'one_way';

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type);
CREATE INDEX IF NOT EXISTS idx_swaps_match_type ON swaps(match_type);

-- 4. Update existing skills to have type 'teaching' (backward compatibility)
UPDATE skills 
SET type = 'teaching' 
WHERE type IS NULL;

-- 5. Update existing swaps to have match_type 'one_way' (backward compatibility)
UPDATE swaps 
SET match_type = 'one_way' 
WHERE match_type IS NULL;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'skills' AND column_name = 'type';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'swaps' AND column_name = 'match_type';

-- Check skills by type
SELECT type, COUNT(*) as count
FROM skills
GROUP BY type;

-- Check swaps by match type
SELECT match_type, COUNT(*) as count
FROM swaps
GROUP BY match_type;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Add sample learning skills for testing
-- Replace 'your-user-id' with actual user ID
/*
INSERT INTO skills (user_id, skill_name, category, proficiency, description, type)
VALUES 
  ('your-user-id', 'Python', 'Code', 'Beginner', 'Want to learn Python programming', 'learning'),
  ('your-user-id', 'Guitar', 'Music', 'Beginner', 'Want to learn guitar', 'learning');
*/

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- Uncomment these lines if you need to rollback

-- ALTER TABLE skills DROP COLUMN IF EXISTS type;
-- ALTER TABLE swaps DROP COLUMN IF EXISTS match_type;
-- DROP INDEX IF EXISTS idx_skills_type;
-- DROP INDEX IF EXISTS idx_swaps_match_type;
