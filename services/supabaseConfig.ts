
import { createClient } from '@supabase/supabase-js';

/**
 * SQL SCHEMA FOR SUPABASE (Copy and run in SQL Editor):
 * 
 * -- Enable UUID extension
 * CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 * 
 * -- Users Table
 * CREATE TABLE users (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   full_name TEXT NOT NULL,
 *   badge_number TEXT,
 *   username TEXT UNIQUE NOT NULL,
 *   password TEXT NOT NULL,
 *   role TEXT DEFAULT 'employee',
 *   job_title TEXT,
 *   unit TEXT,
 *   profile_picture_url TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Reports Table
 * CREATE TABLE reports (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
 *   sequence_number INTEGER,
 *   date DATE NOT NULL,
 *   day TEXT,
 *   tasks JSONB DEFAULT '[]'::jsonb,
 *   accomplished TEXT,
 *   not_accomplished TEXT,
 *   attachments JSONB DEFAULT '[]'::jsonb,
 *   manager_comment TEXT,
 *   is_viewed_by_manager BOOLEAN DEFAULT false,
 *   is_comment_read_by_employee BOOLEAN DEFAULT false,
 *   rating INTEGER,
 *   status TEXT DEFAULT 'draft',
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- Announcements Table
 * CREATE TABLE announcements (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   content TEXT NOT NULL,
 *   date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
 *   read_by JSONB DEFAULT '[]'::jsonb
 * );
 * 
 * -- Direct Tasks Table
 * CREATE TABLE direct_tasks (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   manager_id UUID REFERENCES users(id) ON DELETE CASCADE,
 *   employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
 *   content TEXT NOT NULL,
 *   sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
 *   status TEXT DEFAULT 'pending',
 *   acknowledged_at TIMESTAMP WITH TIME ZONE,
 *   rejection_reason TEXT,
 *   is_read_by_employee BOOLEAN DEFAULT false
 * );
 * 
 * -- Enable Realtime for all tables
 * ALTER PUBLICATION supabase_realtime ADD TABLE users, reports, announcements, direct_tasks;
 */

const SUPABASE_URL: string = 'https://npbfjdiqntidwkrylbnc.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wYmZqZGlxbnRpZHdrcnlsYm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NzM3MjIsImV4cCI6MjA4MDI0OTcyMn0.eRdiHO6hQTxZEBPrexubtUDFUHeOAzwUmbIrkEgiJbw';

export const isSupabaseConfigured = (): boolean => {
    return !!SUPABASE_URL && 
           SUPABASE_URL !== 'https://your-project-id.supabase.co' && 
           !SUPABASE_URL.includes('your-project-id') &&
           !!SUPABASE_ANON_KEY &&
           SUPABASE_ANON_KEY.length > 20;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
