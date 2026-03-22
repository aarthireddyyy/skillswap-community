-- Add city and country columns to profiles table if they don't exist

-- Add city column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add country column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Optional: Add index for location-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
