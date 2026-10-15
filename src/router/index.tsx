import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleRedirect } from '../components/auth/RoleRedirect';
import { LoginPage } from '../pages/LoginPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { HealthPage } from '../pages/HealthPage';
import { SuperAdminDashboard } from '../pages/dashboards/SuperAdminDashboard';
import { ReceptionistDashboard } from '../pages/dashboards/ReceptionistDashboard';
import { DoctorDashboard } from '../pages/dashboards/DoctorDashboard';
import { DepartmentsPage } from '../pages/admin/DepartmentsPage';
import { DoctorsPage } from '../pages/admin/DoctorsPage';
import { ReceptionistsPage } from '../pages/admin/ReceptionistsPage';
import { SchedulesPage } from '../pages/admin/SchedulesPage';
import { PatientsPage } from '../pages/receptionist/PatientsPage';
import { BookAppointmentPage } from '../pages/receptionist/BookAppointmentPage';
import { AppointmentsListPage } from '../pages/appointments/AppointmentsListPage';
import { ActivateAccountPage } from '../pages/auth/ActivateAccountPage';
import { APP_ROUTES } from '../constants/routes';
import { ROLES } from '../types/auth.types';

export const router = createBrowserRouter([
  // Public staff login
  {
    path: APP_ROUTES.LOGIN,
    element: <LoginPage />,
  },

  // Public staff account activation
  {
    path: APP_ROUTES.ACTIVATE_ACCOUNT,
    element: <ActivateAccountPage />,
  },

  // Protected application shell
  {
    path: APP_ROUTES.ROOT,
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <RoleRedirect /> },
          { path: 'health', element: <HealthPage /> },
          { path: 'unauthorized', element: <UnauthorizedPage /> },

          // Super Admin exclusive routes
          {
            element: <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />,
            children: [
              { path: 'admin/dashboard', element: <SuperAdminDashboard /> },
              { path: 'admin/departments', element: <DepartmentsPage /> },
              { path: 'admin/doctors', element: <DoctorsPage /> },
              { path: 'admin/receptionists', element: <ReceptionistsPage /> },
              { path: 'admin/schedules', element: <SchedulesPage /> },
              { path: 'admin/patients', element: <PatientsPage /> },
              { path: 'admin/appointments', element: <AppointmentsListPage /> },
            ],
          },

          // Receptionist exclusive routes
          {
            element: <ProtectedRoute allowedRoles={[ROLES.RECEPTIONIST]} />,
            children: [
              { path: 'receptionist/dashboard', element: <ReceptionistDashboard /> },
              { path: 'receptionist/patients', element: <PatientsPage /> },
              { path: 'receptionist/appointments', element: <BookAppointmentPage /> },
              { path: 'receptionist/appointments-list', element: <AppointmentsListPage /> },
            ],
          },

          // Doctor exclusive routes
          {
            element: <ProtectedRoute allowedRoles={[ROLES.DOCTOR]} />,
            children: [
              { path: 'doctor/dashboard', element: <DoctorDashboard /> },
              { path: 'doctor/appointments', element: <AppointmentsListPage /> },
              { path: 'doctor/patients', element: <PatientsPage /> },
              { path: 'doctor/schedule', element: <DoctorDashboard /> },
            ],
          },
        ],
      },
    ],
  },

  // Fallback 404
  {
    path: APP_ROUTES.NOT_FOUND,
    element: <NotFoundPage />,
  },
]);
