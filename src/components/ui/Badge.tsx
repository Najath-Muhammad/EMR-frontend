interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  success: { background: '#d1fae5', color: '#065f46' },
  warning: { background: '#fef3c7', color: '#92400e' },
  danger:  { background: '#fee2e2', color: '#991b1b' },
  info:    { background: '#dbeafe', color: '#1e40af' },
  neutral: { background: '#f1f3f5', color: '#495057' },
};

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  return (
    <span
      style={{
        ...variantStyles[variant],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
