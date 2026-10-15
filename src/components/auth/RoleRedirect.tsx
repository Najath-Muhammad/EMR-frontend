import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { ROLES } from '../../types/auth.types';

export function RoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }

  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      return <Navigate to={APP_ROUTES.ADMIN_DASHBOARD} replace />;
    case ROLES.RECEPTIONIST:
      return <Navigate to={APP_ROUTES.RECEPTIONIST_DASHBOARD} replace />;
    case ROLES.DOCTOR:
      return <Navigate to={APP_ROUTES.DOCTOR_DASHBOARD} replace />;
    default:
      return <Navigate to={APP_ROUTES.LOGIN} replace />;
  }
}
