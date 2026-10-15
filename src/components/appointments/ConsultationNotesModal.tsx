import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Appointment } from '../../types/appointment.types';
import { useCompleteAppointment, useUpdateConsultationNotes } from '../../hooks/useAppointments';
import { AxiosError } from 'axios';

interface ConsultationNotesModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export function ConsultationNotesModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: ConsultationNotesModalProps) {
  const [notes, setNotes] = useState(appointment?.consultationNotes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const completeMutation = useCompleteAppointment();
  const updateNotesMutation = useUpdateConsultationNotes();

  useEffect(() => {
    if (appointment) {
      setNotes(appointment.consultationNotes || '');
      setErrorMessage(null);
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const handleSaveNotes = async () => {
    try {
      setErrorMessage(null);
      const res = await updateNotesMutation.mutateAsync({
        id: appointment.id,
        payload: { consultationNotes: notes.trim() },
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setErrorMessage(err.response.data.message as string);
      } else {
        setErrorMessage('Failed to save consultation notes');
      }
    }
  };

  const handleComplete = async () => {
    try {
      setErrorMessage(null);
      const res = await completeMutation.mutateAsync({
        id: appointment.id,
        payload: { consultationNotes: notes.trim() || undefined },
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setErrorMessage(err.response.data.message as string);
      } else {
        setErrorMessage('Failed to complete consultation');
      }
    }
  };

  const isPending = completeMutation.isPending || updateNotesMutation.isPending;

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
          maxWidth: '600px',
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              Doctor Consultation
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
              Patient: {appointment.patient.fullName} ({appointment.patient.patientId || 'N/A'})
            </span>
          </div>
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

        {/* Patient visit context */}
        <div style={{ padding: '0.75rem 1.5rem', background: '#f8f9fa', borderBottom: '1px solid #e9ecef', fontSize: '0.8125rem', color: '#495057' }}>
          <strong>Visit Purpose:</strong> {appointment.purpose || 'None'} · <strong>Time:</strong> {appointment.date} ({appointment.startTime}–{appointment.endTime})
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#842029', fontSize: '0.8125rem' }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="consultationNotesArea"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}
            >
              Clinical Findings, Diagnosis & Prescription
            </label>
            <textarea
              id="consultationNotesArea"
              rows={8}
              placeholder="Record physical exam findings, patient symptoms, prescribed medications, recommended tests, and follow-up advice…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
            <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block', marginTop: '4px', textAlign: 'right' }}>
              {notes.length} / 2000 characters
            </span>
          </div>
        </div>

        {/* Footer */}
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
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
            Close
          </Button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveNotes}
              isLoading={updateNotesMutation.isPending}
              disabled={isPending}
            >
              Save Draft Notes
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleComplete}
              isLoading={completeMutation.isPending}
              disabled={isPending}
            >
              ✔ Complete Consultation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
