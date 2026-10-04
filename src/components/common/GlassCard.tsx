import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'frosted' | 'well';
  className?: string;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'solid',
  className = '',
  hoverable = true,
  style,
  ...props
}) => {
  const variantClass =
    variant === 'frosted'
      ? 'glass-panel'
      : variant === 'well'
      ? 'glass-well'
      : 'glass-card';

  const hoverClass = hoverable ? '' : 'no-hover';

  return (
    <div
      className={`${variantClass} ${hoverClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
