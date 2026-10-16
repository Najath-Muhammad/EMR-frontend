import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { APP_ROUTES } from '../../constants/routes';
import { Role, ROLES } from '../../types/auth.types';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const roleNavMap: Record<Role, NavItem[]> = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Admin Dashboard', path: APP_ROUTES.ADMIN_DASHBOARD, icon: '⊡' },
    { label: 'Departments',     path: APP_ROUTES.DEPARTMENTS,     icon: '⊞' },
    { label: 'Doctors',         path: APP_ROUTES.DOCTORS,         icon: '✚' },
    { label: 'Receptionists',   path: APP_ROUTES.RECEPTIONISTS,   icon: '⊟' },
    { label: 'Schedules',       path: APP_ROUTES.SCHEDULES,       icon: '▣' },
    { label: 'Patient Directory',path: APP_ROUTES.ADMIN_PATIENTS,  icon: '□' },
    { label: 'All Appointments',path: APP_ROUTES.ALL_APPOINTMENTS,icon: '▦' },
    { label: 'Audit Trail',     path: APP_ROUTES.AUDIT_LOGS,      icon: '📜' },
  ],
  [ROLES.RECEPTIONIST]: [
    { label: 'Reception Desk',  path: APP_ROUTES.RECEPTIONIST_DASHBOARD, icon: '⊡' },
    { label: 'Patient Records', path: APP_ROUTES.PATIENTS,              icon: '□' },
    { label: 'Book Appointment',path: APP_ROUTES.APPOINTMENTS_BOOKING,  icon: '✚' },
    { label: 'Appointments List', path: APP_ROUTES.RECEPTIONIST_APPOINTMENTS_LIST, icon: '▦' },
  ],
  [ROLES.DOCTOR]: [
    { label: 'Doctor Dashboard',path: APP_ROUTES.DOCTOR_DASHBOARD,    icon: '⊡' },
    { label: 'My Appointments', path: APP_ROUTES.DOCTOR_APPOINTMENTS, icon: '▦' },
    { label: 'My Patients',     path: APP_ROUTES.DOCTOR_PATIENTS,     icon: '□' },
  ],
};

const sidebarStyle: React.CSSProperties = {
  width: '240px',
  height: '100vh',
  position: 'sticky',
  top: 0,
  left: 0,
  background: '#ffffff',
  borderRight: '1px solid #dee2e6',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  overflowY: 'auto',
  zIndex: 40,
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
  const { user } = useAuth();
  const navItems = user?.role ? roleNavMap[user.role] ?? [] : [];

  return (
    <aside style={sidebarStyle}>
      <div style={brandStyle}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0a0a0a', letterSpacing: '-0.02em' }}>
          EMR System
        </span>
        <span style={{ fontSize: '0.7rem', color: '#adb5bd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Hospital Management
        </span>
      </div>

      <nav style={navStyle} aria-label="Main navigation">
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
        <span style={{ fontSize: '0.75rem', color: '#adb5bd' }}>
          {user ? `Role: ${user.role}` : 'Phase 1 · Auth & RBAC'}
        </span>
      </div>
    </aside>
  );
}
