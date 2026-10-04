import React from 'react';

export interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  badgeText?: string;
  variant?: 'default' | 'compact' | 'card' | 'inline';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  badgeText,
  variant = 'default',
  className = '',
  style,
  children,
}) => {
  const isCompact = variant === 'compact';
  const isInline = variant === 'inline';

  return (
    <div
      className={`glass-card empty-state-container ${isCompact ? 'compact' : ''} ${className}`}
      style={{
        padding: isCompact ? 'var(--space-lg) var(--space-md)' : isInline ? 'var(--space-md)' : 'var(--space-2xl) var(--space-xl)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isCompact ? 'var(--space-xs)' : 'var(--space-sm)',
        borderRadius: isCompact ? 'var(--radius-lg)' : 'var(--radius-2xl)',
        background: 'var(--color-surface-container-lowest)',
        border: '1px solid var(--color-outline-variant)',
        boxShadow: 'var(--shadow-level-1)',
        width: '100%',
        ...style,
      }}
      role="region"
      aria-label={title}
    >
      {badgeText && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(79, 70, 229, 0.08)',
            color: 'var(--color-primary)',
            marginBottom: '4px',
          }}
        >
          {badgeText}
        </span>
      )}

      {/* Tinted Apple HIG Icon Sphere */}
      <div
        style={{
          width: isCompact ? '48px' : '64px',
          height: isCompact ? '48px' : '64px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(79, 70, 229, 0.08)',
          border: '1px solid rgba(79, 70, 229, 0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary-container)',
          marginBottom: isCompact ? '4px' : '8px',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
          flexShrink: 0,
        }}
      >
        <Icon size={isCompact ? 24 : 32} color="var(--color-primary-container)" />
      </div>

      <h3
        style={{
          fontSize: isCompact ? 'var(--text-title)' : 'var(--text-headline)',
          fontWeight: 600,
          color: 'var(--color-on-surface)',
          letterSpacing: '-0.01em',
          margin: 0,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 'var(--text-body)',
          color: 'var(--color-on-surface-variant)',
          maxWidth: isCompact ? '380px' : '480px',
          lineHeight: 'var(--text-body-lh)',
          margin: 0,
        }}
      >
        {description}
      </p>

      {/* Custom Children (e.g. prompt starters, shortcuts) */}
      {children && (
        <div style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
          {children}
        </div>
      )}

      {/* Action Buttons Stack */}
      {(actionLabel || secondaryLabel) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
            marginTop: isCompact ? 'var(--space-sm)' : 'var(--space-md)',
          }}
        >
          {actionLabel && onAction && (
            <button
              type="button"
              className="btn-primary-cta"
              onClick={onAction}
            >
              {actionLabel}
            </button>
          )}

          {secondaryLabel && onSecondaryAction && (
            <button
              type="button"
              className="btn-secondary-action"
              onClick={onSecondaryAction}
              style={{
                height: '36px',
                padding: '0 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-body)',
                fontWeight: 500,
                color: 'var(--color-on-surface-variant)',
                background: 'var(--color-surface-container-low)',
                border: '1px solid var(--color-outline-variant)',
                cursor: 'pointer',
              }}
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
