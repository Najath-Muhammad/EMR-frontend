import React from 'react';
import { TimeSlot } from '../../types/slot.types';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

interface SlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
        <Spinner size="md" />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Loading dynamic slots…</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#f8f9fa',
          border: '1px dashed #ced4da',
          borderRadius: '8px',
          color: '#6c757d',
        }}
      >
        <p style={{ fontWeight: 500, fontSize: '0.9375rem', marginBottom: '4px' }}>
          No Slots Available
        </p>
        <p style={{ fontSize: '0.8125rem' }}>
          The doctor does not have an active working schedule or sessions configured for this date.
        </p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.isAvailable).length;
  const bookedCount = slots.filter((s) => s.reason === 'BOOKED').length;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a' }}>
            Appointment Slots
          </span>
          <Badge variant="neutral">{slots.length} Total</Badge>
          <Badge variant="success">{availableCount} Available</Badge>
          {bookedCount > 0 && <Badge variant="warning">{bookedCount} Booked</Badge>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#6c757d' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                border: '1px solid #0a0a0a',
                background: '#ffffff',
              }}
            />
            Available
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: '#0a0a0a',
              }}
            />
            Selected
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: '#e9ecef',
              }}
            />
            Unavailable
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {slots.map((slot) => {
          const isSelected =
            selectedSlot?.startTime === slot.startTime &&
            selectedSlot?.endTime === slot.endTime;
          const isAvail = slot.isAvailable;

          let reasonLabel = '';
          if (slot.reason === 'BOOKED') reasonLabel = 'Booked';
          else if (slot.reason === 'PAST_TIME') reasonLabel = 'Past';
          else if (slot.reason === 'BREAK') reasonLabel = 'Break';
          else if (slot.reason === 'OUTSIDE_SESSION') reasonLabel = 'Off-hours';

          return (
            <button
              key={`${slot.startTime}-${slot.endTime}`}
              type="button"
              disabled={!isAvail}
              onClick={() => onSelectSlot(slot)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.625rem 0.5rem',
                borderRadius: '6px',
                border: isSelected
                  ? '2px solid #0a0a0a'
                  : isAvail
                  ? '1px solid #ced4da'
                  : '1px solid #e9ecef',
                background: isSelected
                  ? '#0a0a0a'
                  : isAvail
                  ? '#ffffff'
                  : '#f8f9fa',
                color: isSelected
                  ? '#ffffff'
                  : isAvail
                  ? '#0a0a0a'
                  : '#adb5bd',
                cursor: isAvail ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                outline: 'none',
              }}
            >
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 700 : 600,
                  fontFamily: 'monospace',
                }}
              >
                {slot.startTime} - {slot.endTime}
              </span>
              {!isAvail && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                    letterSpacing: '0.04em',
                    color: slot.reason === 'BOOKED' ? '#dc3545' : '#6c757d',
                    fontWeight: 500,
                  }}
                >
                  {reasonLabel}
                </span>
              )}
              {isAvail && !isSelected && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: '#198754',
                    marginTop: '2px',
                    fontWeight: 500,
                  }}
                >
                  Open
                </span>
              )}
              {isSelected && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: '#ffffff',
                    marginTop: '2px',
                    fontWeight: 600,
                  }}
                >
                  ✓ Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
