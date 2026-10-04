import React, { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/auth.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || 'Failed to sign in. Please verify your credentials.');
        } else {
          onClose();
        }
      } else {
        const { error, session } = await signUp(email.trim(), password);
        if (error) {
          setErrorMsg(error.message || 'Failed to create account.');
        } else if (session) {
          // Auto signed-in immediately (email confirmation disabled or auto-confirmed)
          onClose();
        } else {
          // Confirmation email sent
          setSuccessMsg('Account created successfully! Please check your inbox to confirm your email.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div
      className="auth-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="auth-header">
          <div className="auth-brand-block">
            <img
              src="/leclens.jpg"
              alt="LectureLens Logo"
              className="auth-brand-logo"
            />
            <div>
              <h2 id="auth-modal-title" className="auth-title">
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="auth-subtitle">
                LectureLens Academic Vault • Supabase Sync
              </p>
            </div>
          </div>
          <button
            className="auth-close-btn"
            onClick={onClose}
            aria-label="Close authentication modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => toggleMode('signin')}
            role="tab"
            aria-selected={mode === 'signin'}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => toggleMode('signup')}
            role="tab"
            aria-selected={mode === 'signup'}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-success-banner" role="status">
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="auth-email">
              Student Email
            </label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="auth-email"
                type="email"
                className="auth-input"
                placeholder="student@stanford.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="auth-password">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="auth-password"
                type="password"
                className="auth-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
            )}
          </button>

          <div className="auth-footer-prompt">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account yet?
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => toggleMode('signup')}
                >
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already have an account?
                <button
                  type="button"
                  className="auth-toggle-link"
                  onClick={() => toggleMode('signin')}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
