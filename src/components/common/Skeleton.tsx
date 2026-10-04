import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'text' | 'rect' | 'circle' | 'card';
  className?: string;
  style?: React.CSSProperties;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  variant = 'rect',
  className = '',
  style,
  animate = true,
}) => {
  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    switch (variant) {
      case 'circle':
        return 'var(--radius-full)';
      case 'text':
        return 'var(--radius-sm)';
      case 'card':
        return 'var(--radius-xl)';
      case 'rect':
      default:
        return 'var(--radius-md)';
    }
  };

  const getDefaultHeight = () => {
    if (height !== undefined) return height;
    switch (variant) {
      case 'text':
        return '14px';
      case 'circle':
        return width || '40px';
      case 'card':
        return '140px';
      case 'rect':
      default:
        return '24px';
    }
  };

  const getDefaultWidth = () => {
    if (width !== undefined) return width;
    if (variant === 'circle') return height || '40px';
    return '100%';
  };

  const finalStyle: React.CSSProperties = {
    width: getDefaultWidth(),
    height: getDefaultHeight(),
    borderRadius: getBorderRadius(),
    ...(animate
      ? {
          background: 'var(--skeleton-shimmer)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-sweep 1.8s ease-in-out infinite',
        }
      : {
          backgroundColor: 'var(--skeleton-base)',
        }),
    ...style,
  };

  return (
    <div
      className={`skeleton-item ${variant === 'card' ? 'skeleton-card-container' : ''} ${className}`}
      style={finalStyle}
      aria-hidden="true"
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: string | number;
  gap?: string | number;
  widths?: (string | number)[];
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = '14px',
  gap = '8px',
  widths,
  className = '',
  style,
}) => {
  const defaultWidths = ['100%', '92%', '65%', '85%', '45%'];

  return (
    <div
      className={`skeleton-text-group ${className}`}
      style={{ display: 'flex', flexDirection: 'column', gap, width: '100%', ...style }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }).map((_, idx) => {
        const itemWidth =
          widths && widths[idx] !== undefined
            ? widths[idx]
            : defaultWidths[idx % defaultWidths.length];

        return (
          <Skeleton
            key={idx}
            variant="text"
            height={lineHeight}
            width={itemWidth}
          />
        );
      })}
    </div>
  );
};

export interface SkeletonCardProps {
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = '160px',
  className = '',
  children,
  style,
}) => {
  return (
    <div
      className={`glass-card skeleton-card-wrapper ${className}`}
      style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        minHeight: height,
        ...style,
      }}
      aria-hidden="true"
    >
      {children || (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton variant="circle" width="38px" height="38px" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Skeleton variant="text" width="60%" height="16px" />
              <Skeleton variant="text" width="35%" height="12px" />
            </div>
          </div>
          <SkeletonText lines={2} gap="6px" style={{ marginTop: '6px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
            <Skeleton variant="text" width="25%" height="12px" />
            <Skeleton variant="text" width="20%" height="12px" />
          </div>
        </>
      )}
    </div>
  );
};

export interface SkeletonBlockProps {
  height?: string | number;
  width?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  height = '80px',
  width = '100%',
  borderRadius = 'var(--radius-md)',
  className = '',
  style,
}) => {
  return (
    <Skeleton
      variant="rect"
      height={height}
      width={width}
      borderRadius={borderRadius}
      className={className}
      style={style}
    />
  );
};

export default Skeleton;
