import React from 'react';
import type { ActiveView } from '../types/navigation';
import type { Lecture } from '../types/lecture';
import { MOCK_LECTURES } from '../data/mockLectures';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { BentoStats } from '../components/dashboard/BentoStats';
import { IntelligenceHub } from '../components/dashboard/IntelligenceHub';
import { RecentLectures } from '../components/dashboard/RecentLectures';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

interface DashboardViewProps {
  onNavigate: (view: ActiveView) => void;
  onSelectLecture?: (lecture: Lecture) => void;
  lectures?: Lecture[];
  isLoading?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectLecture,
  lectures,
  isLoading,
}) => {
  const { user } = useAuth();
  // When authenticated, show the user's real database lectures (even if empty)
  // When unauthenticated, show mock lectures for guest preview
  const currentLectures = user
    ? (lectures || [])
    : (lectures && lectures.length > 0 ? lectures : MOCK_LECTURES);

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {isLoading && (
        <div
          className="glass-card"
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--color-primary-container)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="status-dot connected animate-pulse-subtle" />
          <span>Syncing your lectures with Supabase PostgreSQL...</span>
        </div>
      )}

      {/* 1. Welcome Greeting, Exam Preparedness & Action Stack */}
      <WelcomeBanner
        onNavigate={onNavigate}
        lectures={currentLectures}
        onResumeLecture={() => {
          if (onSelectLecture && currentLectures[0]) {
            onSelectLecture(currentLectures[0]);
          }
          onNavigate('workspace');
        }}
      />

      {/* 2. 4-Card Bento Grid with Sparkline & Retention Analytics */}
      <BentoStats lectures={currentLectures} />

      {/* 3. Academic Intelligence Hub with 6 Tool Cards */}
      <IntelligenceHub onNavigate={onNavigate} />

      {/* 4. Course Filter Pills, Dropzone & Recent Lectures Catalog */}
      <RecentLectures
        lectures={currentLectures}
        onNavigate={onNavigate}
        onSelectLecture={onSelectLecture}
        onUploadClick={() => onNavigate('ingest')}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardView;
