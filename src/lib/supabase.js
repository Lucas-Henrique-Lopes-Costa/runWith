
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gmgsftjcoxkdxejuwluy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZ3NmdGpjb3hrZHhlanV3bHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjU5NTAsImV4cCI6MjA2MDY0MTk1MH0.8uYoC5NHL2AogNJEx6Uty1TjzIoiv-LP1KVX1RguFz0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
