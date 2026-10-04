/**
 * Supabase Client Configuration
 * Prepares the official @supabase/supabase-js client for future database integration.
 * Safe fallback: exports null and isSupabaseConfigured = false if keys are not provided.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Checks whether an error is caused by authentication expiry, invalid token, or 401 unauthorized.
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'object') {
    const err = error as { status?: number; code?: string; message?: string };
    if (err.status === 401 || err.status === 403) return true;
    const msg = (err.message || '').toLowerCase();
    if (
      msg.includes('jwt expired') ||
      msg.includes('token is expired') ||
      msg.includes('invalid claim') ||
      msg.includes('invalid refresh token') ||
      msg.includes('user not found') ||
      msg.includes('not authenticated')
    ) {
      return true;
    }
  }
  return false;
}
