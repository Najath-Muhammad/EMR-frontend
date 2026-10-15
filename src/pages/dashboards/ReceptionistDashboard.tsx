import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export function ReceptionistDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Reception Front Desk
          </h2>
          <Badge variant="success">Front Office</Badge>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', margin: 0 }}>
          Operator: {user?.name} · Department Front Desk Active
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
            Patient Intake
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
            Registration
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Register new patient records and medical cards
          </span>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Booking Desk
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
            Appointments
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Schedule patient appointments with department doctors
          </span>
        </Card>

        <Card>
          <span style={{ fontSize: '0.75rem', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Department Status
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: '0.5rem 0' }}>
            Active Duty
          </div>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Single receptionist policy strictly maintained
          </span>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '0.5rem' }}>
          Front Desk Operating Guidelines
        </h3>
        <p style={{ fontSize: '0.875rem', color: '#495057', lineHeight: 1.6 }}>
          As a receptionist, you are responsible for patient onboarding and appointment booking. All patient
          records are confidential and should only be accessed for scheduled consultations and official check-ins.
        </p>
      </Card>
    </div>
  );
}
