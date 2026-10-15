import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PossibleDuplicate, Patient } from '../../types/patient.types';

interface PossibleDuplicatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: PossibleDuplicate[];
  onSelectExisting: (patient: Patient) => void;
  onConfirmProceed: () => void;
  isRegistering?: boolean;
}

export function PossibleDuplicatesModal({
  isOpen,
  onClose,
  duplicates,
  onSelectExisting,
  onConfirmProceed,
  isRegistering = false,
}: PossibleDuplicatesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isRegistering ? () => {} : onClose}
      title="⚠️ Potential Duplicate Records Detected"
      maxWidth="600px"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isRegistering}
          >
            Review &amp; Edit Details
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirmProceed}
            isLoading={isRegistering}
          >
            Register as New Patient (Shared Phone / Family)
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#495057', lineHeight: 1.5 }}>
          We found <strong>{duplicates.length}</strong> existing patient record(s) matching the phone number or name and birth date. Please check whether this patient is already registered before creating a new record:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
          {duplicates.map((item, idx) => (
            <div
              key={item.patient.id || idx}
              style={{
                border: '1px solid #ced4da',
                borderRadius: '6px',
                padding: '0.875rem 1rem',
                background: '#f8f9fa',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0a0a0a' }}>
                    {item.patient.fullName}
                  </span>
                  <Badge variant="neutral">{item.patient.patientId}</Badge>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectExisting(item.patient)}
                  disabled={isRegistering}
                >
                  Use This Patient
                </Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', fontSize: '0.75rem', color: '#6c757d' }}>
                <div>
                  <span style={{ color: '#adb5bd' }}>Phone: </span>
                  <strong style={{ color: '#212529' }}>{item.patient.phone}</strong>
                </div>
                <div>
                  <span style={{ color: '#adb5bd' }}>DOB: </span>
                  <strong style={{ color: '#212529' }}>{item.patient.dateOfBirth}</strong>
                </div>
                <div>
                  <span style={{ color: '#adb5bd' }}>Gender: </span>
                  <strong style={{ color: '#212529' }}>{item.patient.gender}</strong>
                </div>
                {item.patient.registrationDepartment && (
                  <div>
                    <span style={{ color: '#adb5bd' }}>Dept: </span>
                    <strong style={{ color: '#212529' }}>{item.patient.registrationDepartment.name}</strong>
                  </div>
                )}
              </div>

              {/* Match Reason Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                {item.matchReasons.map((reason, rIdx) => (
                  <span
                    key={rIdx}
                    style={{
                      background: '#fff3cd',
                      color: '#856404',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                    }}
                  >
                    ⚠ {reason}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6c757d' }}>
          💡 <em>Rule:</em> Family members are allowed to share a contact number. If this is a child or relative sharing this mobile number, choose <strong>Register as New Patient</strong>.
        </p>
      </div>
    </Modal>
  );
}
