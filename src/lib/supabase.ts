import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || supabaseUrl === 'your-supabase-url-here') {
  console.warn(
    '[SkillSwap] Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

// createClient requires valid-looking strings; provide a dummy URL if not configured
// so the app can at least render (auth calls will simply fail gracefully).
const url = supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co'
const key = supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key-here'
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const supabase = createClient(url, key)
