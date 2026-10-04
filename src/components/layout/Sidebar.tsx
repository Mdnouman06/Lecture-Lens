import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  BookOpen,
  MessageSquare,
  Layers,
  HelpCircle,
  FileText,
  Calendar,
  ChevronDown,
  HardDrive,
  LogOut,
  LogIn,
} from 'lucide-react';
import type { ActiveView } from '../../types/navigation';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenAuth?: () => void;
  courseLabel?: string;
}

interface NavItemConfig {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  shortcut?: string;
  section?: 'primary' | 'study' | 'tools';
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'primary' },
  { id: 'ingest', label: 'Lecture Library', icon: UploadCloud, section: 'primary' },
  { id: 'workspace', label: 'Smart Notes', icon: BookOpen, section: 'study' },
  { id: 'tutor', label: 'AI Tutor', icon: MessageSquare, shortcut: '⌘K', section: 'study' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, section: 'study' },
  { id: 'quiz', label: 'Interactive Quizzes', icon: HelpCircle, section: 'study' },
  { id: 'pyq', label: 'PYQ Intelligence', icon: FileText, section: 'tools' },
  { id: 'planner', label: 'Study Planner', icon: Calendar, section: 'tools' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  onOpenAuth,
  courseLabel,
}) => {
  const { user, signOut } = useAuth();
  const isAuthenticated = Boolean(user);

  return (
    <aside className="app-sidebar" aria-label="Sidebar Navigation">
      {/* Brand Header */}
      <div
        className="sidebar-brand"
        onClick={() => onNavigate('dashboard')}
        style={{ cursor: 'pointer' }}
        title="LectureLens Dashboard"
      >
        <img
          src="/leclens.jpg"
          alt="LectureLens Logo"
          className="brand-logo-img"
          width="36"
          height="36"
        />
        <div className="brand-text">
          <span className="brand-title">LectureLens</span>
          <span className="brand-subtitle">AI Academic Workspace</span>
        </div>
      </div>

      {/* Active Workspace Selector */}
      <div
        className="workspace-selector"
        role="button"
        tabIndex={0}
        title={`Workspace: ${courseLabel || 'General'}`}
      >
        <div className="workspace-info">
          <span className="workspace-pill" />
          <span className="workspace-name">{courseLabel || 'General'}</span>
        </div>
        <ChevronDown size={14} color="var(--color-outline)" />
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav" aria-label="Primary Navigation">
        <div className="nav-section-label">Overview</div>
        {NAV_ITEMS.filter((item) => item.section === 'primary').map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-link-content">
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </div>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.shortcut && <span className="nav-shortcut">{item.shortcut}</span>}
            </button>
          );
        })}

        <div className="nav-section-label">Study Modules</div>
        {NAV_ITEMS.filter((item) => item.section === 'study').map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-link-content">
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </div>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.shortcut && <span className="nav-shortcut">{item.shortcut}</span>}
            </button>
          );
        })}

        <div className="nav-section-label">Preparation</div>
        {NAV_ITEMS.filter((item) => item.section === 'tools').map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="nav-link-content">
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </div>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
              {item.shortcut && <span className="nav-shortcut">{item.shortcut}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer: Storage Gauge & Student Profile */}
      <div className="sidebar-footer">
        <div className="storage-card">
          <div className="storage-meta">
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HardDrive size={12} /> Local Corpus
            </span>
            <span style={{ fontWeight: 600 }}>18.4 / 50 GB</span>
          </div>
          <div className="storage-track">
            <div className="storage-fill" style={{ width: '36.8%' }} />
          </div>
        </div>

        <div
          className="user-profile-tile"
          onClick={() => {
            if (!isAuthenticated && onOpenAuth) {
              onOpenAuth();
            }
          }}
          title={isAuthenticated ? 'Signed in with Supabase' : 'Click to Sign In with Supabase'}
        >
          <div className="user-avatar" style={{ background: isAuthenticated ? 'var(--color-primary-container)' : undefined, color: isAuthenticated ? '#ffffff' : undefined }}>
            {isAuthenticated
              ? (user?.email?.slice(0, 2).toUpperCase() || 'ST')
              : 'GS'}
          </div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <span className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isAuthenticated ? (user?.email?.split('@')[0] || 'Student') : 'Guest Student'}
            </span>
            <span className="user-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isAuthenticated ? user?.email : 'Click to Sign In'}
            </span>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                signOut();
              }}
              title="Sign Out"
              aria-label="Sign out of Supabase"
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
              <LogOut size={16} />
            </button>
          ) : (
            <LogIn size={15} color="var(--color-primary-container)" />
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
