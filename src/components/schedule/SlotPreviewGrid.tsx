import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { usePreviewSlots } from '../../hooks/useDoctorSchedule';
import { SaveScheduleInput } from '../../types/schedule.types';
import { DaySlotsSummary, TimeSlot } from '../../types/slot.types';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SlotPreviewGridProps {
  schedule: SaveScheduleInput;
  doctorName?: string;
  activeDayOfWeek?: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getNextDateForDayOfWeek(targetDayOfWeek: number): string {
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntil = (targetDayOfWeek - currentDay + 7) % 7;

  if (daysUntil === 0) {
    daysUntil = 7;
  }
  return format(addDays(today, daysUntil), 'yyyy-MM-dd');
}

export function SlotPreviewGrid({
  schedule,
  doctorName,
  activeDayOfWeek = 1,
}: SlotPreviewGridProps) {

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getNextDateForDayOfWeek(activeDayOfWeek),
  );
  const [summary, setSummary] = useState<DaySlotsSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewMutation = usePreviewSlots();

  useEffect(() => {
    setSelectedDate(getNextDateForDayOfWeek(activeDayOfWeek));
  }, [activeDayOfWeek]);

  const handleFetchPreview = useCallback(
    (dateToUse = selectedDate) => {
      setErrorMessage(null);
      previewMutation.mutate(
        {
          schedule,
          date: dateToUse,
        },
        {
          onSuccess: (res) => {
            if (res.success && res.data) {
              setSummary(res.data);
            }
          },
          onError: (err: unknown) => {
            const apiErr = err as { response?: { data?: { message?: string } } };
            const msg = apiErr.response?.data?.message ?? 'Failed to generate preview slots';
            setErrorMessage(msg);
            setSummary(null);
          },
        },
      );
    },

    [schedule, selectedDate],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetchPreview(selectedDate);
    }, 350);

    return () => clearTimeout(timer);
  }, [handleFetchPreview, selectedDate]);

  const getSlotVariant = (
    slot: TimeSlot,
  ): {
    bg: string;
    border: string;
    text: string;
    badge: string;
    badgeVariant: 'success' | 'neutral' | 'danger' | 'warning';
  } => {
    if (slot.isAvailable) {
      return {
        bg: '#ffffff',
        border: '#198754',
        text: '#0a0a0a',
        badge: 'Available',
        badgeVariant: 'success',
      };
    }
    if (slot.reason === 'PAST_TIME') {
      return {
        bg: '#f8f9fa',
        border: '#dee2e6',
        text: '#adb5bd',
        badge: 'Past',
        badgeVariant: 'neutral',
      };
    }
    if (slot.reason === 'BOOKED') {
      return {
        bg: '#fff5f5',
        border: '#dc3545',
        text: '#842029',
        badge: 'Booked',
        badgeVariant: 'danger',
      };
    }
    return {
      bg: '#fff9db',
      border: '#ffe066',
      text: '#856404',
      badge: slot.reason ?? 'Unavailable',
      badgeVariant: 'warning',
    };
  };

  const cleanDoctorName = doctorName
    ? doctorName.trim().replace(/^(dr\.?\s*)+/i, 'Dr. ')
    : '';

  const activeDayName = DAY_NAMES[activeDayOfWeek] ?? 'Monday';
  const isPreviewDayDifferent = summary && summary.dayOfWeek.toUpperCase() !== activeDayName.toUpperCase();

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0a0a0a' }}>
            Live Slot Preview
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            {cleanDoctorName ? `Generated slots for ${cleanDoctorName}` : 'Dynamic slot engine verification'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label htmlFor="previewDate" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#495057' }}>
            Preview Date:
          </label>
          <input
            id="previewDate"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '0.8125rem',
              fontWeight: 600,
              background: '#ffffff',
              outline: 'none',
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleFetchPreview(selectedDate)}
            isLoading={previewMutation.isPending}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Helpful day sync notice if user picked a different day in the date picker */}
      {isPreviewDayDifferent && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            Previewing <strong>{summary.dayOfWeek}</strong> slots while editing <strong>{activeDayName}</strong>.
          </span>
          <button
            type="button"
            onClick={() => setSelectedDate(getNextDateForDayOfWeek(activeDayOfWeek))}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '3px 8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            Switch Preview to {activeDayName}
          </button>
        </div>
      )}

      {/* Summary KPI Bar */}
      {summary && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#f8f9fa',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#212529' }}>
              {summary.dayOfWeek}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>({summary.date})</span>
            <Badge variant="neutral">{summary.slotDuration} min / slot</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#495057' }}>
              Total: <strong>{summary.totalSlots}</strong>
            </span>
            <span style={{ color: '#ced4da' }}>|</span>
            <span style={{ fontSize: '0.8125rem', color: '#198754' }}>
              Available: <strong>{summary.availableSlots}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {previewMutation.isPending && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '2rem 1rem',
            color: '#6c757d',
            fontSize: '0.875rem',
          }}
        >
          <Spinner size="sm" />
          <span>Generating slots dynamically from schedule rules…</span>
        </div>
      )}

      {}
      {errorMessage && !previewMutation.isPending && (
        <div
          style={{
            padding: '0.875rem 1rem',
            background: '#fff5f5',
            border: '1px solid #f5c6cb',
            borderRadius: '6px',
            color: '#842029',
            fontSize: '0.8125rem',
          }}
        >
          <strong>Validation Note:</strong> {errorMessage}
        </div>
      )}

      {}
      {!previewMutation.isPending && !errorMessage && summary && summary.slots.length === 0 && (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            background: '#f8f9fa',
            borderRadius: '6px',
            border: '1px dashed #dee2e6',
            color: '#6c757d',
          }}
        >
          <div style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>🗓️</div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: '#343a40' }}>
            No slots generated for this date
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#adb5bd' }}>
            The physician is either not scheduled to work on this day or break periods cover all working time.
          </p>
        </div>
      )}

      {}
      {!previewMutation.isPending && summary && summary.slots.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.625rem',
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '2px',
          }}
        >
          {summary.slots.map((slot, index) => {
            const variant = getSlotVariant(slot);
            return (
              <div
                key={`${slot.startTime}-${index}`}
                style={{
                  background: variant.bg,
                  border: `1px solid ${variant.border}`,
                  borderRadius: '6px',
                  padding: '0.5rem 0.625rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.12s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: variant.text,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {slot.startTime} – {slot.endTime}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant={variant.badgeVariant}>{variant.badge}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid #f1f3f5',
          fontSize: '0.75rem',
          color: '#6c757d',
        }}
      >
        <span style={{ fontWeight: 600, color: '#343a40' }}>Legend:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: '#ffffff',
              border: '1px solid #198754',
            }}
          />
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: '#fff5f5',
              border: '1px solid #dc3545',
            }}
          />
          <span>Booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
            }}
          />
          <span>Past Time</span>
        </div>
      </div>
    </div>
  );
}
