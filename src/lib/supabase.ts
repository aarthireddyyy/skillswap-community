import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("ENV CHECK:", supabaseUrl, supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl || 'https://ayqpukzfjxglorikmykv.supabase.co',
  supabaseAnonKey || 'sb_publishable_bY5qbXD3l19Vg5T-88JNpA_v9ynZ8wS'
)