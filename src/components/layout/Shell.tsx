import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Calendar,
  Menu,
} from 'lucide-react';
import type { ActiveView, LocalAiHealth } from '../../types/navigation';
import type { Lecture } from '../../types/lecture';
import { API_BASE } from '../../services/api';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AuthModal } from '../auth/AuthModal';
import { SkipLink } from '../common/SkipLink';
import '../../styles/layout.css';

interface ShellProps {
  children: (props: {
    activeView: ActiveView;
    onNavigate: (view: ActiveView) => void;
    aiHealth: LocalAiHealth;
  }) => React.ReactNode;
  onLectureUploaded?: (lecture: Lecture) => void;
  activeCourse?: string;
}

export const Shell: React.FC<ShellProps> = ({ children, onLectureUploaded, activeCourse }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [aiHealth, setAiHealth] = useState<LocalAiHealth>({
    status: 'checking',
    endpoint: API_BASE,
    model: 'qwen3:0.6b',
    whisperEngine: 'faster-whisper (CTranslate2)',
    isDemoMode: true,
  });

  const checkHealth = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const startTime = performance.now();
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        setAiHealth((prev) => ({
          ...prev,
          status: 'connected',
          latencyMs,
          model: data.model || 'qwen3:0.6b',
          whisperEngine: data.whisperEngine || 'faster-whisper',
          isDemoMode: false,
          lastChecked: new Date().toLocaleTimeString(),
          error: undefined,
        }));
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch {
      clearTimeout(timeoutId);
      setAiHealth((prev) => ({
        ...prev,
        status: 'offline',
        isDemoMode: true,
        lastChecked: new Date().toLocaleTimeString(),
        error: `FastAPI bridge on ${API_BASE} unreachable`,
      }));
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const toggleDemoMode = () => {
    setAiHealth((prev) => ({
      ...prev,
      isDemoMode: !prev.isDemoMode,
    }));
  };

  const handleLectureUploaded = (lecture: Lecture) => {
    setActiveView('workspace');
    if (onLectureUploaded) {
      onLectureUploaded(lecture);
    }
  };

  return (
    <div className="app-shell">
      {/* Accessible Skip to Content Landmark */}
      <SkipLink targetId="main-content" />

      {/* 260px Navigation Rail */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        courseLabel={activeCourse}
      />

      {/* Main Viewport Container */}
      <div className="main-viewport">
        <Header
          activeView={activeView}
          onNavigate={setActiveView}
          aiHealth={aiHealth}
          onCheckHealth={checkHealth}
          onToggleDemoMode={toggleDemoMode}
          onLectureUploaded={handleLectureUploaded}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        <main id="main-content" className="page-content" tabIndex={-1} aria-label="Main LectureLens Workspace">
          {children({ activeView, onNavigate: setActiveView, aiHealth })}
        </main>

        {/* Apple HIG Glassmorphism Mobile Bottom Navigation Bar */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
          <button
            type="button"
            className={`bottom-nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
            aria-label="Dashboard"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`bottom-nav-btn ${activeView === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveView('workspace')}
            aria-label="Smart Notes"
          >
            <BookOpen size={20} />
            <span>Notes</span>
          </button>

          <button
            type="button"
            className={`bottom-nav-btn ${activeView === 'tutor' ? 'active' : ''}`}
            onClick={() => setActiveView('tutor')}
            aria-label="AI Tutor"
          >
            <MessageSquare size={20} />
            <span>AI Tutor</span>
          </button>

          <button
            type="button"
            className={`bottom-nav-btn ${activeView === 'planner' ? 'active' : ''}`}
            onClick={() => setActiveView('planner')}
            aria-label="Study Planner"
          >
            <Calendar size={20} />
            <span>Planner</span>
          </button>

          <button
            type="button"
            className="bottom-nav-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="More navigation modules"
          >
            <Menu size={20} />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default Shell;
