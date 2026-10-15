import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const routeTitles: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/departments':  'Departments',
  '/doctors':      'Doctors',
  '/receptionists':'Receptionists',
  '/patients':     'Patients',
  '/appointments': 'Appointments',
  '/schedules':    'Schedules',
  '/':             'Overview',
};

export function AppShell() {
  const location = useLocation();
  const title = routeTitles[location.pathname] ?? 'EMR System';

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8f9fa',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
