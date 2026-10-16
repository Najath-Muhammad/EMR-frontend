import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const routeTitles: Record<string, string> = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/departments': 'Department Management',
  '/admin/doctors': 'Doctor Management',
  '/admin/receptionists': 'Receptionist Management',
  '/admin/schedules': 'Doctor Schedule Management',
  '/admin/patients': 'Patient Directory',
  '/admin/appointments': 'All Appointments',
  '/receptionist/dashboard': 'Reception Desk',
  '/receptionist/patients': 'Patient Directory',
  '/receptionist/appointments': 'Book Appointment',
  '/doctor/dashboard': 'Doctor Dashboard',
  '/doctor/appointments': 'My Appointments',
  '/doctor/patients': 'Patient Records',
  '/doctor/schedule': 'My Schedule',
  '/': 'Overview',
};

export function AppShell() {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? 'EMR System';

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#f8f9fa',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header title={title} />
        <main
          role="main"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
