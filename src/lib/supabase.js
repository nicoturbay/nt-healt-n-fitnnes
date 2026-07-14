import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gjusyswosfbrgngwjvbx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdXN5c3dvc2ZicmduZ3dqdmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDM4MTAsImV4cCI6MjA5OTYxOTgxMH0.fW0Bocfsod-qjEw5n2Kx4E_IIputn38nCWuhyWFcOfw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
