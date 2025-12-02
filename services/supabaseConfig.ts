
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// هام جداً:
// تم إعداد الرابط والمفتاح الخاص بمشروعك.
// ------------------------------------------------------------------

const SUPABASE_URL: string = 'https://npbfjdiqntidwkrylbnc.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYmZqZGlxbnRpZHdrcnlsYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzM3MjIsImV4cCI6MjA4MDI0OTcyMn0.eRdiHO6hQTxZEBPrexubtUDFUHeOAzwUmbIrkEgiJbw';

export const isSupabaseConfigured = (): boolean => {
    // Check if the URL is configured and not the placeholder
    return SUPABASE_URL !== 'https://your-project-id.supabase.co' && 
           SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
           !SUPABASE_URL.includes('your-project-id');
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
