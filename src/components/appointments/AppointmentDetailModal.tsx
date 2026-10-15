import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Appointment, AppointmentStatus } from '../../types/appointment.types';
import { ROLES, Role } from '../../types/auth.types';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  currentUserRole?: Role;
  currentUserId?: string;
  onClose: () => void;
  onMarkArrived?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
}

export function AppointmentDetailModal({
  isOpen,
  appointment,
  currentUserRole,
  currentUserId,
  onClose,
  onMarkArrived,
  onComplete,
  onReschedule,
  onCancel,
  onEdit,
}: AppointmentDetailModalProps) {
  if (!isOpen || !appointment) return null;

  const isAssignedDoctor =
    currentUserRole === ROLES.DOCTOR && appointment.doctor.id === currentUserId;
  const isSuperAdmin = currentUserRole === ROLES.SUPER_ADMIN;
  const isReceptionist = currentUserRole === ROLES.RECEPTIONIST;

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'SCHEDULED':
        return <Badge variant="info">Confirmed</Badge>;
      case 'ARRIVED':
        return <Badge variant="warning">Arrived (In Clinic)</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'NO_SHOW':
        return <Badge variant="neutral">No Show</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const isTerminal = appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              Appointment Details
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>ID: {appointment.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {getStatusBadge(appointment.status)}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                lineHeight: 1,
                cursor: 'pointer',
                color: '#6c757d',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Patient & Doctor Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#6c757d', marginBottom: '4px' }}>
                Patient
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a' }}>
                {appointment.patient.fullName}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#495057', marginTop: '2px' }}>
                ID: {appointment.patient.patientId || 'N/A'} · Phone: {appointment.patient.phone}
              </div>
              {appointment.patient.dateOfBirth && (
                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  DOB: {appointment.patient.dateOfBirth} {appointment.patient.gender ? `(${appointment.patient.gender})` : ''}
                </div>
              )}
            </div>

            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#6c757d', marginBottom: '4px' }}>
                Doctor & Department
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a' }}>
                {appointment.doctor.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#495057', marginTop: '2px' }}>
                {appointment.department.name} ({appointment.department.code})
              </div>
              {appointment.doctor.specialization && (
                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  Specialization: {appointment.doctor.specialization}
                </div>
              )}
            </div>
          </div>

          {/* Schedule details */}
          <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c757d' }}>Date</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0a0a0a' }}>
                  {appointment.date}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c757d' }}>Time Slot</span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0a0a0a' }}>
                  {appointment.startTime} – {appointment.endTime}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c757d' }}>Booked By</span>
                <span style={{ fontSize: '0.875rem', color: '#495057' }}>
                  {appointment.createdBy ? appointment.createdBy.name : 'System'}
                </span>
              </div>
            </div>
          </div>

          {/* Purpose & Notes */}
          <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #dee2e6' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c757d', fontWeight: 600 }}>
                Appointment Purpose
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#0a0a0a' }}>
                {appointment.purpose || 'No purpose recorded.'}
              </p>
            </div>
            {appointment.notes && (
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c757d', fontWeight: 600 }}>
                  Administrative Notes
                </span>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#495057' }}>
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Consultation Notes (Clinical) */}
          {(appointment.consultationNotes || isAssignedDoctor || isSuperAdmin) && (
            <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#6c757d', fontWeight: 600 }}>
                Doctor Consultation & Clinical Notes
              </span>
              {appointment.consultationNotes ? (
                <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: '#0a0a0a', whiteSpace: 'pre-wrap' }}>
                  {appointment.consultationNotes}
                </p>
              ) : (
                <p style={{ margin: '6px 0 0 0', fontSize: '0.8125rem', color: '#6c757d', fontStyle: 'italic' }}>
                  No consultation notes entered yet.
                </p>
              )}
            </div>
          )}

          {/* Audit trail */}
          <div style={{ padding: '0.75rem 1rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #f1f3f5', fontSize: '0.75rem', color: '#6c757d' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div>
                <strong>Created:</strong> {new Date(appointment.createdAt).toLocaleString()}
              </div>
              {appointment.arrivedAt && (
                <div>
                  <strong>Arrived:</strong> {new Date(appointment.arrivedAt).toLocaleString()}
                  {appointment.arrivedBy ? ` by ${appointment.arrivedBy.name}` : ''}
                </div>
              )}
              {appointment.completedAt && (
                <div>
                  <strong>Completed:</strong> {new Date(appointment.completedAt).toLocaleString()}
                  {appointment.completedBy ? ` by ${appointment.completedBy.name}` : ''}
                </div>
              )}
              {appointment.cancelledAt && (
                <div>
                  <strong style={{ color: '#dc3545' }}>Cancelled:</strong>{' '}
                  {new Date(appointment.cancelledAt).toLocaleString()}
                  {appointment.cancelledBy ? ` by ${appointment.cancelledBy.name}` : ''}
                  {appointment.cancellationReason ? ` (${appointment.cancellationReason})` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Reschedule History if present */}
          {appointment.rescheduleHistory && appointment.rescheduleHistory.length > 0 && (
            <div style={{ padding: '1rem', background: '#fff9db', borderRadius: '6px', border: '1px solid #ffe066' }}>
              <span style={{ display: 'block', fontSize: '0.8125rem', color: '#856404', fontWeight: 600, marginBottom: '6px' }}>
                Reschedule History ({appointment.rescheduleHistory.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {appointment.rescheduleHistory.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: '#664d03' }}>
                    • Moved from <strong>{item.previousDate} {item.previousStartTime}–{item.previousEndTime}</strong> on{' '}
                    {new Date(item.rescheduledAt).toLocaleDateString()}
                    {item.rescheduledBy ? ` by ${item.rescheduledBy.name}` : ''}
                    {item.reason ? ` — Reason: "${item.reason}"` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #dee2e6',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Mark as Arrived action: for Receptionist / Super Admin when status is SCHEDULED or CONFIRMED */}
            {(isReceptionist || isSuperAdmin) &&
              (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') &&
              onMarkArrived && (
                <Button variant="primary" size="sm" onClick={() => onMarkArrived(appointment)}>
                  ✔ Mark Patient Arrived
                </Button>
              )}

            {/* Complete Consultation action: for Assigned Doctor or Super Admin when status is ARRIVED or CONFIRMED */}
            {(isAssignedDoctor || isSuperAdmin) &&
              (appointment.status === 'ARRIVED' || appointment.status === 'CONFIRMED') &&
              onComplete && (
                <Button variant="primary" size="sm" onClick={() => onComplete(appointment)}>
                  🩺 Complete Consultation
                </Button>
              )}

            {/* Reschedule action: for Receptionist / Super Admin when not terminal */}
            {(isReceptionist || isSuperAdmin) && !isTerminal && onReschedule && (
              <Button variant="secondary" size="sm" onClick={() => onReschedule(appointment)}>
                📅 Reschedule
              </Button>
            )}

            {/* Edit details: for Receptionist / Super Admin when not terminal */}
            {(isReceptionist || isSuperAdmin) && !isTerminal && onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(appointment)}>
                ✏ Edit Purpose / Notes
              </Button>
            )}

            {/* Cancel: for Receptionist / Super Admin when not terminal */}
            {(isReceptionist || isSuperAdmin) && !isTerminal && onCancel && (
              <Button variant="danger" size="sm" onClick={() => onCancel(appointment)}>
                Cancel Appointment
              </Button>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
