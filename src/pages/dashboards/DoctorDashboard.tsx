import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Doctor Clinical Portal
          </h2>
          <Badge variant="info">Clinical</Badge>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>
          Physician: {user?.name} · Internal Clinical Console
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <Card>
          <span style={{ fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Daily Schedule
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
            My Appointments
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            View and manage your assigned appointments
          </span>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Clinical Records
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
            Assigned Patients
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Access medical records for your consultations only
          </span>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Availability
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
            Roster & Shifts
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Managed by Department Super Admin
          </span>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '0.5rem' }}>
          Clinical Privacy Guarantee
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#495057', lineHeight: 1.6 }}>
          By design, doctor accounts strictly view their own appointments and patient information. Cross-doctor
          consultation details are isolated according to hospital privacy compliance guidelines.
        </p>
      </Card>
    </div>
  );
}
