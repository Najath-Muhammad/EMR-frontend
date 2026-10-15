import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { APP_ROUTES } from '../../constants/routes';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate(APP_ROUTES.LOGIN);
  };

  const getRoleBadgeVariant = (role?: string): 'neutral' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'neutral';
      case 'DOCTOR':
        return 'info';
      case 'RECEPTIONIST':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {title && (
          <h1 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
            {title}
          </h1>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{user.email}</span>
            </div>
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {user.role.replace('_', ' ')}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { void handleLogout(); }}
              aria-label="Log out"
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
