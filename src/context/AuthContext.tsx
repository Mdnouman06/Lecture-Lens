import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, isAuthError } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  sessionError: string | null;
  clearSessionError: () => void;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null; session: Session | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  sessionError: null,
  clearSessionError: () => {},
  refreshSession: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, user: null, session: null }),
  signOut: async () => ({ error: null }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const clearSessionError = useCallback(() => {
    setSessionError(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        if (isAuthError(error)) {
          setSessionError('Your session has expired. Please sign in again to sync your notes.');
          setUser(null);
          setSession(null);
        } else {
          console.warn('Session refresh warning:', error.message);
        }
      } else if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setSessionError(null);
      }
    } catch (err) {
      console.warn('Failed to refresh Supabase session:', err);
    }
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Fetch initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.warn('Supabase getSession error:', error.message);
        if (isAuthError(error)) {
          setSessionError('Your previous session has expired. Please sign in again.');
        }
      }
      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });

    // 2. Subscribe to auth lifecycle changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN') {
        setSessionError(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED') {
        setSessionError(null);
      } else if (event === 'USER_UPDATED') {
        setUser(currentSession?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase client not configured') as unknown as AuthError };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setSession(data.session);
      setUser(data.user);
      setSessionError(null);
    }
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Supabase client not configured') as unknown as AuthError, user: null, session: null };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setSessionError(null);
    }
    return { error, user: data?.user ?? null, session: data?.session ?? null };
  };

  const signOut = async () => {
    if (!supabase) return { error: null };
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSessionError(null);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        sessionError,
        clearSessionError,
        refreshSession,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

