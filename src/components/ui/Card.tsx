interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
