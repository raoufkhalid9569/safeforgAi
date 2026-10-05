import React from 'react';
import { SeverityLevel } from '../../types';

interface RiskBadgeProps {
  severity: SeverityLevel;
  score?: number;
  showScore?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  severity,
  score,
  showScore = false,
  className = '',
  size = 'md',
}) => {
  const styles: Record<SeverityLevel, { text: string; bg: string; border: string; dot: string }> = {
    CRITICAL: {
      text: 'text-red-400',
      bg: 'bg-red-950/40',
      border: 'border-red-500/40',
      dot: 'bg-red-500',
    },
    HIGH: {
      text: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-500/40',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-500/40',
      dot: 'bg-amber-500',
    },
    LOW: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/40',
      dot: 'bg-emerald-500',
    },
  };

  const current = styles[severity] || styles.LOW;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 tracking-wider',
    md: 'text-xs px-2.5 py-1 tracking-wider',
    lg: 'text-sm px-3 py-1.5 font-semibold tracking-wider',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-semibold border ${current.bg} ${current.border} ${current.text} ${sizeClasses} ${className}`}
      style={{ borderRadius: '2px' }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} ${severity === 'CRITICAL' ? 'animate-ping' : ''}`} />
      <span>{severity}</span>
      {showScore && score !== undefined && (
        <span className="opacity-90 font-mono text-[11px] border-l border-current/20 pl-1.5 ml-0.5">
          {score}/100
        </span>
      )}
    </span>
  );
};
