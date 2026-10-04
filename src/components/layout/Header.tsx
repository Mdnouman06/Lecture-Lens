import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  UploadCloud,
  BookOpen,
  MessageSquare,
  Layers,
  HelpCircle,
  FileText,
  Calendar,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { ActiveView, LocalAiHealth } from '../../types/navigation';
import type { Lecture } from '../../types/lecture';
import { LocalAiModal } from '../common/LocalAiModal';
import { UploadLectureModal } from '../ingestion/UploadLectureModal';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  aiHealth: LocalAiHealth;
  onCheckHealth: () => Promise<void>;
  onToggleDemoMode: () => void;
  onUploadClick?: () => void;
  onLectureUploaded?: (lecture: Lecture) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onOpenAuth?: () => void;
}

const VIEW_TITLES: Record<ActiveView, string> = {
  dashboard: 'Dashboard',
  ingest: 'Lecture Library & Ingestion Hub',
  workspace: 'Smart Notes',
  tutor: 'AI Tutor',
  flashcards: 'Flashcard Decks',
  quiz: 'Interactive Quizzes',
  pyq: 'PYQ Intelligence',
  planner: 'Study Planner',
  settings: 'Preferences',
};

const MOBILE_NAV_ITEMS: { id: ActiveView; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ingest', label: 'Lecture Library', icon: UploadCloud },
  { id: 'workspace', label: 'Smart Notes', icon: BookOpen },
  { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Interactive Quizzes', icon: HelpCircle },
  { id: 'pyq', label: 'PYQ Intelligence', icon: FileText },
  { id: 'planner', label: 'Study Planner', icon: Calendar },
];

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onNavigate,
  aiHealth,
  onCheckHealth,
  onToggleDemoMode,
  onUploadClick,
  onLectureUploaded,
  isMobileMenuOpen: externalIsMobileMenuOpen,
  onToggleMobileMenu,
  onOpenAuth,
}) => {
  const { user, signOut } = useAuth();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [internalIsMobileMenuOpen, setInternalIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isMobileMenuOpen = externalIsMobileMenuOpen !== undefined ? externalIsMobileMenuOpen : internalIsMobileMenuOpen;
  const setIsMobileMenuOpen = (open: boolean) => {
    if (onToggleMobileMenu) {
      onToggleMobileMenu();
    } else {
      setInternalIsMobileMenuOpen(open);
    }
  };

  const isConnected = aiHealth.status === 'connected';

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick();
    } else {
      setIsUploadModalOpen(true);
    }
  };

  return (
    <>
      <header className="app-header" aria-label="Main Header">
        {/* Left: Mobile Toggle & Breadcrumbs with Logo */}
        <div className="header-left">
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={isMobileMenuOpen ? 'Close mobile navigation' : 'Open mobile navigation'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <Menu size={18} />
          </button>

          <div className="breadcrumb-trail">
            <div
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => onNavigate('dashboard')}
              title="LectureLens Home"
            >
              <img
                src="/leclens.jpg"
                alt="LectureLens Logo"
                className="header-brand-logo"
                width="24"
                height="24"
              />
              <span className="breadcrumb-segment">LectureLens</span>
            </div>
            <ChevronRight size={14} color="var(--color-outline)" />
            <span className="breadcrumb-active">{VIEW_TITLES[activeView]}</span>
          </div>
        </div>

        {/* Center: Quick Search Bar with ⌘K */}
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search lectures, transcripts, concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search academic corpus"
          />
          <span className="search-shortcut-pill">⌘K</span>
        </div>

        {/* Right: Local AI Status, Notifications & Primary Upload CTA */}
        <div className="header-right">
          {/* Local AI Status Pill */}
          <button
            className={`ai-status-pill ${
              aiHealth.status === 'checking'
                ? 'checking'
                : isConnected
                ? 'connected'
                : 'demo'
            }`}
            onClick={() => setIsAiModalOpen(true)}
            title="Click to view Local AI engine status & setup guide"
            aria-haspopup="dialog"
          >
            <span
              className={`status-dot ${
                aiHealth.status === 'checking'
                  ? 'checking'
                  : isConnected
                  ? 'connected animate-pulse-subtle'
                  : 'demo'
              }`}
            />
            <span>
              {aiHealth.status === 'checking'
                ? 'Pinging Local AI...'
                : isConnected
                ? 'Local AI Ready'
                : 'Demo Mode'}
            </span>
          </button>

          {/* Notification Bell */}
          <button
            className="header-icon-btn"
            title="Notifications (2 updates)"
            aria-label="View notifications"
          >
            <Bell size={16} />
          </button>

          {/* User Auth Status / Sign In Button */}
          {user ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-container)',
                border: '1px solid var(--color-outline-variant)',
              }}
              title={`Signed in as ${user.email}`}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-container)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {user.email?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-on-surface)',
                }}
              >
                {user.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                title="Sign out of Supabase"
                aria-label="Sign out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-outline)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-secondary-action"
              onClick={onOpenAuth}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
              }}
              title="Sign In with Supabase to sync your personal vault"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* Primary Action: + Upload Lecture */}
          <button
            className="btn-primary-cta"
            onClick={handleUploadClick}
            aria-label="Upload lecture media or slides"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>+ Upload Lecture</span>
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer with Official Logo */}
      {isMobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
        >
          <div
            id="mobile-nav-drawer"
            className="mobile-nav-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-nav-header">
              <div className="mobile-nav-brand">
                <img
                  src="/leclens.jpg"
                  alt="LectureLens Logo"
                  className="brand-logo-img"
                  width="36"
                  height="36"
                />
                <div>
                  <div className="mobile-nav-brand-title">LectureLens</div>
                  <div className="mobile-nav-brand-sub">AI Academic Workspace</div>
                </div>
              </div>
              <button
                type="button"
                className="mobile-nav-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-nav-links">
              {MOBILE_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      marginBottom: '4px',
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-outline-variant)' }}>
              {user ? (
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: '10px', color: '#ef4444' }}
                >
                  <LogOut size={18} />
                  <span>Sign Out ({user.email?.split('@')[0]})</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '10px 14px', borderRadius: '10px', color: 'var(--color-primary-container)' }}
                >
                  <LogIn size={18} />
                  <span>Sign In with Supabase</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Local AI Interactive Modal */}
      <LocalAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        aiHealth={aiHealth}
        onCheckHealth={onCheckHealth}
        onToggleDemoMode={onToggleDemoMode}
      />

      {/* Quick Upload Modal Dialog */}
      <UploadLectureModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(lec) => {
          if (onLectureUploaded) onLectureUploaded(lec);
          onNavigate('workspace');
        }}
      />
    </>
  );
};

export default Header;
