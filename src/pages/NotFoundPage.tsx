import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';

export function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '4rem', fontWeight: 700, color: '#dee2e6', lineHeight: 1 }}>404</p>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0a0a0a' }}>Page not found</h2>
      <p style={{ color: '#6c757d', fontSize: '0.875rem', maxWidth: '320px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to={APP_ROUTES.ROOT}
        style={{
          marginTop: '0.5rem',
          padding: '8px 16px',
          background: '#0a0a0a',
          color: '#ffffff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
        }}
      >
        Go home
      </Link>
    </div>
  );
}
