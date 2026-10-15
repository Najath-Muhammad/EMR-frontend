import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  bookingDetails: {
    patientName: string;
    patientId: string;
    patientPhone: string;
    departmentName: string;
    doctorName: string;
    doctorSpecialization?: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
    notes?: string;
  };
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  bookingDetails,
}) => {
  if (!isOpen) return null;

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
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
          padding: '1.75rem',
        }}
      >
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #dee2e6', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Confirm Appointment Booking
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '4px' }}>
            Please review the appointment details before confirming.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Patient Card */}
          <div style={{ background: '#f8f9fa', padding: '0.875rem', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <span style={{ fontSize: '0.75rem', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Patient
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a' }}>
                {bookingDetails.patientName}
              </span>
              <Badge variant="neutral">{bookingDetails.patientId}</Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#495057', marginTop: '2px' }}>
              Contact: {bookingDetails.patientPhone}
            </p>
          </div>

          {/* Doctor & Dept */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Department</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', marginTop: '2px' }}>
                {bookingDetails.departmentName}
              </p>
            </div>
            <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e9ecef' }}>
              <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Doctor</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', marginTop: '2px' }}>
                {bookingDetails.doctorName}
              </p>
              {bookingDetails.doctorSpecialization && (
                <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  {bookingDetails.doctorSpecialization}
                </span>
              )}
            </div>
          </div>

          {/* Date & Time Slot */}
          <div style={{ background: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Appointment Date</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a', marginTop: '2px' }}>
                  {bookingDetails.date}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Time Slot</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0a0a0a', fontFamily: 'monospace', marginTop: '2px' }}>
                  {bookingDetails.startTime} - {bookingDetails.endTime}
                </p>
              </div>
            </div>
          </div>

          {/* Purpose & Notes */}
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Purpose</span>
            <p style={{ fontSize: '0.875rem', color: '#0a0a0a', marginTop: '2px', fontWeight: 500 }}>
              {bookingDetails.purpose}
            </p>
            {bookingDetails.notes && (
              <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '4px', fontStyle: 'italic' }}>
                Notes: {bookingDetails.notes}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Edit Details
          </Button>
          <Button variant="primary" onClick={onConfirm} isLoading={isLoading}>
            Confirm & Book
          </Button>
        </div>
      </Card>
    </div>
  );
};
