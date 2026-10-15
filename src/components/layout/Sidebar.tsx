import { NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../../constants/routes';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',    path: APP_ROUTES.DASHBOARD,    icon: '⊡' },
  { label: 'Departments',  path: APP_ROUTES.DEPARTMENTS,  icon: '⊞' },
  { label: 'Doctors',      path: APP_ROUTES.DOCTORS,      icon: '✚' },
  { label: 'Receptionists',path: APP_ROUTES.RECEPTIONISTS,icon: '⊟' },
  { label: 'Patients',     path: APP_ROUTES.PATIENTS,     icon: '□' },
  { label: 'Appointments', path: APP_ROUTES.APPOINTMENTS, icon: '▦' },
  { label: 'Schedules',    path: APP_ROUTES.SCHEDULES,    icon: '▣' },
];

const sidebarStyle: React.CSSProperties = {
  width: '240px',
  minHeight: '100vh',
  background: '#ffffff',
  borderRight: '1px solid #dee2e6',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
};

const brandStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid #dee2e6',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const navStyle: React.CSSProperties = {
  padding: '1rem 0.75rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  flex: 1,
};

const linkBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: '#495057',
  textDecoration: 'none',
  transition: 'background 0.12s, color 0.12s',
};

export function Sidebar() {
  return (
    <aside style={sidebarStyle} aria-label="Main navigation">
      <div style={brandStyle}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0a0a0a', letterSpacing: '-0.02em' }}>
          EMR System
        </span>
        <span style={{ fontSize: '0.7rem', color: '#adb5bd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Hospital Management
        </span>
      </div>

      <nav style={navStyle}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...linkBase,
              background: isActive ? '#f1f3f5' : 'transparent',
              color: isActive ? '#0a0a0a' : '#495057',
            })}
          >
            <span aria-hidden="true" style={{ fontSize: '1rem', width: '20px', textAlign: 'center' }}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #dee2e6' }}>
        <span style={{ fontSize: '0.75rem', color: '#adb5bd' }}>v0.1.0 · Phase 0</span>
      </div>
    </aside>
  );
}
