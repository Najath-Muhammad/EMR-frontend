import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Patient } from '../../types/patient.types';
import { formatPhoneDisplay } from '../../utils/phone.util';

interface PatientDetailModalProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment?: (patient: Patient) => void;
}

export function PatientDetailModal({
  patient,
  isOpen,
  onClose,
  onBookAppointment,
}: PatientDetailModalProps) {
  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Patient Medical Profile"
      maxWidth="580px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {onBookAppointment && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onBookAppointment(patient);
              }}
            >
              Book Appointment
            </Button>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Banner with Name, ID, Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingBottom: '0.875rem',
            borderBottom: '1px solid #e9ecef',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0a0a0a' }}>
              {patient.fullName}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              Registered on {new Date(patient.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="neutral">{patient.patientId}</Badge>
            <Badge variant="info">{patient.gender}</Badge>
            {patient.bloodGroup && patient.bloodGroup !== 'UNKNOWN' && (
              <Badge variant="danger">{patient.bloodGroup}</Badge>
            )}
          </div>
        </div>

        {/* Contact and Demographics */}
        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem 1rem', margin: 0 }}>
          <div>
            <dt style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>Mobile Phone</dt>
            <dd style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              {formatPhoneDisplay(patient.phone)}
            </dd>
          </div>

          <div>
            <dt style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>Date of Birth</dt>
            <dd style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              {patient.dateOfBirth}
            </dd>
          </div>

          <div>
            <dt style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>Email</dt>
            <dd style={{ fontSize: '0.875rem', color: '#212529', margin: 0 }}>
              {patient.email || '—'}
            </dd>
          </div>

          <div>
            <dt style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>Primary Department</dt>
            <dd style={{ fontSize: '0.875rem', color: '#212529', margin: 0 }}>
              {patient.registrationDepartment?.name || 'General Registry'}
            </dd>
          </div>

          {patient.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <dt style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>Address</dt>
              <dd style={{ fontSize: '0.875rem', color: '#212529', margin: 0 }}>
                {patient.address}
              </dd>
            </div>
          )}
        </dl>

        {/* Emergency Contact Card */}
        {patient.emergencyContact && (
          <div
            style={{
              padding: '0.875rem 1rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#495057', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase' }}>
              Emergency Contact
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem', color: '#212529' }}>
              <div><strong>Name:</strong> {patient.emergencyContact.name}</div>
              <div><strong>Phone:</strong> {patient.emergencyContact.phone}</div>
              {(patient.emergencyContact.relationship || (patient.emergencyContact as unknown as { relation?: string }).relation) && (
                <div>
                  <strong>Relation:</strong>{' '}
                  {patient.emergencyContact.relationship || (patient.emergencyContact as unknown as { relation?: string }).relation}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
