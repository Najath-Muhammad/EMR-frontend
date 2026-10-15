import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export function SuperAdminDashboard() {
  const { user } = useAuth();

  const stats = [
    { title: 'Departments', count: 'Active', note: 'Single receptionist rule enforced' },
    { title: 'Registered Doctors', count: 'Staff', note: 'Multiple per department allowed' },
    { title: 'Active Receptionists', count: 'Front Desk', note: 'Max 1 active per department' },
    { title: 'System Security', count: 'Protected', note: 'Role-based access active' },
  ];

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Super Admin Command Center
          </h2>
          <Badge variant="neutral">Administrative</Badge>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>
          Logged in as {user?.name} ({user?.email})
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.title}>
            <span style={{ fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.title}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
              {stat.count}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{stat.note}</span>
          </Card>
        ))}
      </div>

      <Card>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '0.75rem' }}>
          System Governance Rules & Protocols
        </h3>
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#495057', lineHeight: 1.8 }}>
          <li>
            <strong>Department Receptionist Invariant:</strong> Exactly one active receptionist is permitted per department.
          </li>
          <li>
            <strong>Doctor Department Association:</strong> Multiple doctors may belong to one department.
          </li>
          <li>
            <strong>Privacy Enforcement:</strong> Doctors can only query their own appointments and assigned patient details.
          </li>
          <li>
            <strong>Audit & Security:</strong> Short-lived access tokens (15m) and family-rotated refresh tokens protect sessions.
          </li>
        </ul>
      </Card>
    </div>
  );
}
