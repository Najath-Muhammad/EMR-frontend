import { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { SlotGrid } from './SlotGrid';
import { useDoctorSlots } from '../../hooks/useDoctorSchedule';
import { useRescheduleAppointment } from '../../hooks/useAppointments';
import { Appointment } from '../../types/appointment.types';
import { TimeSlot } from '../../types/slot.types';
import { AxiosError } from 'axios';

interface RescheduleModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (updated: Appointment) => void;
}

export function RescheduleModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0] as string, []);
  const [newDate, setNewDate] = useState(
    appointment && appointment.date >= todayStr ? appointment.date : todayStr,
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const doctorId = appointment?.doctor?.id;
  const {
    data: slotsData,
    isLoading: isLoadingSlots,
    refetch: refetchSlots,
  } = useDoctorSlots(doctorId, newDate);

  const availableSlots = useMemo(() => slotsData?.data?.slots ?? [], [slotsData]);

  const rescheduleMutation = useRescheduleAppointment();

  useEffect(() => {
    if (appointment) {
      setNewDate(appointment.date >= todayStr ? appointment.date : todayStr);
      setSelectedSlot(null);
      setReason('');
      setErrorMessage(null);
    }
  }, [appointment, todayStr]);

  if (!isOpen || !appointment) return null;

  const handleDateChange = (date: string) => {
    setNewDate(date);
    setSelectedSlot(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMessage('Please select a new time slot');
      return;
    }

    try {
      setErrorMessage(null);
      const res = await rescheduleMutation.mutateAsync({
        id: appointment.id,
        payload: {
          date: newDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          reason: reason.trim() || undefined,
        },
      });

      onSuccess(res.data);
      onClose();
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setErrorMessage(err.response.data.message as string);
      } else {
        setErrorMessage('Failed to reschedule appointment. Please try selecting another slot.');
      }
      void refetchSlots();
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
          maxWidth: '640px',
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
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              Reschedule Appointment
            </h2>
            <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
              Patient: {appointment.patient.fullName} · Doctor: {appointment.doctor.name}
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

        {/* Current slot comparison */}
        <div style={{ padding: '0.75rem 1.5rem', background: '#f8f9fa', borderBottom: '1px solid #e9ecef', fontSize: '0.8125rem', color: '#495057' }}>
          <strong>Current Slot:</strong> {appointment.date} at {appointment.startTime} – {appointment.endTime}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#fff5f5', border: '1px solid #f5c6cb', borderRadius: '6px', color: '#842029', fontSize: '0.8125rem' }}>
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="rescheduleDate"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Select New Date *
            </label>
            <input
              id="rescheduleDate"
              type="date"
              min={todayStr}
              value={newDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
                width: '100%',
                maxWidth: '240px',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>
              Available Time Slots *
            </label>
            {isLoadingSlots ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6c757d', fontSize: '0.875rem' }}>
                <Spinner size="sm" /> Loading available doctor slots…
              </div>
            ) : (
              <SlotGrid
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => {
                  setSelectedSlot(slot);
                  setErrorMessage(null);
                }}
              />
            )}
          </div>

          <div>
            <label
              htmlFor="rescheduleReason"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Reason for Rescheduling (Optional)
            </label>
            <input
              id="rescheduleReason"
              type="text"
              placeholder="e.g. Patient requested morning slot, doctor rescheduled clinic hours"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
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

          {selectedSlot && (
            <div style={{ padding: '0.75rem 1rem', background: '#d1fae5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46', fontSize: '0.8125rem' }}>
              <strong>New Proposed Slot:</strong> {newDate} from {selectedSlot.startTime} to {selectedSlot.endTime}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={rescheduleMutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={rescheduleMutation.isPending} disabled={!selectedSlot}>
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
