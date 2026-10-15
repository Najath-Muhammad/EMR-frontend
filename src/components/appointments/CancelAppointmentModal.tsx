import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Appointment } from '../../types/appointment.types';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
  appointment: Appointment | null;
}

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  appointment,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#dc3545', margin: 0 }}>
          Cancel Appointment
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.5rem' }}>
          Are you sure you want to cancel the appointment for{' '}
          <strong>{appointment.patient.fullName}</strong> on {appointment.date} at{' '}
          {appointment.startTime}?
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '4px' }}>
          This will free up the slot for other patients immediately while keeping a complete historical record.
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <label
            htmlFor="cancellationReason"
            style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
          >
            Reason for Cancellation (Optional)
          </label>
          <textarea
            id="cancellationReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Patient requested reschedule, doctor emergency..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="secondary" onClick={onClose} disabled={isLoading} type="button">
              Keep Appointment
            </Button>
            <Button variant="danger" type="submit" isLoading={isLoading}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
