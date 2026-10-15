import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { APP_ROUTES } from '../constants/routes';
import { ROLES, Role } from '../types/auth.types';

export function UnauthorizedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getDashboardRoute = (role?: Role): string => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return APP_ROUTES.ADMIN_DASHBOARD;
      case ROLES.RECEPTIONIST:
        return APP_ROUTES.RECEPTIONIST_DASHBOARD;
      case ROLES.DOCTOR:
        return APP_ROUTES.DOCTOR_DASHBOARD;
      default:
        return APP_ROUTES.LOGIN;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '1.5rem',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <Card style={{ textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              fontSize: '3rem',
              color: '#dc3545',
              lineHeight: 1,
              marginBottom: '1rem',
            }}
          >
            ⊘
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.5rem' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1.5rem' }}>
            Your account ({user?.role.replace('_', ' ') ?? 'Current Staff'}) does not have permission to
            access this hospital module.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(getDashboardRoute(user?.role))}
          >
            Return to My Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
}
