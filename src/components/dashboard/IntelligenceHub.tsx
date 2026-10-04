import React from 'react';
import {
  BookOpen,
  MessageSquare,
  HelpCircle,
  Layers,
  FileText,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import type { ActiveView } from '../../types/navigation';

interface IntelligenceHubProps {
  onNavigate: (view: ActiveView) => void;
}

interface HubItem {
  id: ActiveView;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  bgColor: string;
  badge?: string;
}

const HUB_ITEMS: HubItem[] = [
  {
    id: 'workspace',
    title: 'Smart Notes & Syntheses',
    description:
      'Auto-generated structured notes with concept hierarchies and audio timecode citations.',
    icon: BookOpen,
    iconColor: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.1)',
  },
  {
    id: 'tutor',
    title: 'AI Tutor & Query Bus',
    description:
      'Ask complex conceptual questions strictly grounded in your course slides and audio recordings.',
    icon: MessageSquare,
    iconColor: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.1)',
  },
  {
    id: 'quiz',
    title: 'Adaptive Quizzes',
    description:
      'Practice with high-yield MCQs, immediate feedback loops, and celebratory mastery scoring.',
    icon: HelpCircle,
    iconColor: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
  },
  {
    id: 'flashcards',
    title: 'Spaced Repetition Decks',
    description:
      'FSRS 4.5 active-recall flashcards with memory stability ratings and daily due decks.',
    icon: Layers,
    iconColor: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    badge: 'FSRS Spaced',
  },
  {
    id: 'pyq',
    title: 'PYQ Exam Intelligence',
    description:
      'Analyze past university exam papers to pinpoint recurring professor question patterns.',
    icon: FileText,
    iconColor: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
  },
  {
    id: 'planner',
    title: 'Study Planner & Timelines',
    description:
      'Dynamic retention schedules balancing lecture review with upcoming midterms and finals.',
    icon: Calendar,
    iconColor: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
  },
];

export const IntelligenceHub: React.FC<IntelligenceHubProps> = ({
  onNavigate,
}) => {
  return (
    <section className="intelligence-hub-section" aria-label="Intelligence Hub Modules">
      <div className="section-header-row">
        <div>
          <h2 className="section-title">Academic Intelligence Modules</h2>
          <p className="section-subtitle">
            Core AI tools powered by your personal lecture corpus
          </p>
        </div>
      </div>

      <div className="hub-grid">
        {HUB_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="hub-card"
              onClick={() => onNavigate(item.id)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${item.title}`}
            >
              <div className="hub-card-top">
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: item.bgColor,
                    color: item.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} />
                </div>
                <ArrowRight size={16} className="hub-card-arrow" />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 className="hub-card-title">{item.title}</h3>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#b45309',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="hub-card-desc">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default IntelligenceHub;
