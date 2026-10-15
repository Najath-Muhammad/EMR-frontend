interface HeaderProps {
  title?: string;
}

const headerStyle: React.CSSProperties = {
  height: '56px',
  background: '#ffffff',
  borderBottom: '1px solid #dee2e6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 1.5rem',
  flexShrink: 0,
};

export function Header({ title }: HeaderProps) {
  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {title && (
          <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
            {title}
          </h1>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f1f3f5',
            border: '1px solid #dee2e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#495057',
            cursor: 'pointer',
          }}
          title="User menu"
        >
          U
        </div>
      </div>
    </header>
  );
}
