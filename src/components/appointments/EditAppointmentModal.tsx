import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Appointment } from '../../types/appointment.types';
import { useUpdateAppointment } from '../../hooks/useAppointments';
import { AxiosError } from 'axios';

interface EditAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export function EditAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: EditAppointmentModalProps) {
  const [purpose, setPurpose] = useState(appointment?.purpose || '');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateMutation = useUpdateAppointment();

  useEffect(() => {
    if (appointment) {
      setPurpose(appointment.purpose || '');
      setNotes(appointment.notes || '');
      setErrorMessage(null);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || purpose.trim().length < 2) {
      setErrorMessage('Purpose must be at least 2 characters');
      return;
    }

    try {
      setErrorMessage(null);
      const res = await updateMutation.mutateAsync({
        id: appointment.id,
        payload: {
          purpose: purpose.trim(),
          notes: notes.trim() || undefined,
        },
      });

      onSuccess(res.data);
      onClose();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setErrorMessage(err.response.data.message as string);
      } else {
        setErrorMessage('Failed to update appointment details');
      }
    }
  };

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
        zIndex: 1010,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '520px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
            Edit Appointment Details
          </h2>
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

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#842029', fontSize: '0.8125rem' }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="editPurpose"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Appointment Purpose *
            </label>
            <input
              id="editPurpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              minLength={2}
              maxLength={500}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="editNotes"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Administrative Notes
            </label>
            <textarea
              id="editNotes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
