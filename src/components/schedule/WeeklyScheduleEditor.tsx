import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DaySchedule, Session, Break, SaveScheduleInput } from '../../types/schedule.types';

interface WeeklyScheduleEditorProps {
  value: SaveScheduleInput;
  onChange: (updated: SaveScheduleInput) => void;
  disabled?: boolean;
  selectedDayOfWeek?: number;
  onSelectDayOfWeek?: (dayOfWeek: number) => void;
}

const DAYS_OF_WEEK: Array<{ dayOfWeek: number; dayName: DaySchedule['dayName']; shortLabel: string; label: string }> = [
  { dayOfWeek: 1, dayName: 'MONDAY', shortLabel: 'Mon', label: 'Monday' },
  { dayOfWeek: 2, dayName: 'TUESDAY', shortLabel: 'Tue', label: 'Tuesday' },
  { dayOfWeek: 3, dayName: 'WEDNESDAY', shortLabel: 'Wed', label: 'Wednesday' },
  { dayOfWeek: 4, dayName: 'THURSDAY', shortLabel: 'Thu', label: 'Thursday' },
  { dayOfWeek: 5, dayName: 'FRIDAY', shortLabel: 'Fri', label: 'Friday' },
  { dayOfWeek: 6, dayName: 'SATURDAY', shortLabel: 'Sat', label: 'Saturday' },
  { dayOfWeek: 0, dayName: 'SUNDAY', shortLabel: 'Sun', label: 'Sunday' },
];

export function WeeklyScheduleEditor({
  value,
  onChange,
  disabled = false,
  selectedDayOfWeek: propSelectedDayOfWeek,
  onSelectDayOfWeek,
}: WeeklyScheduleEditorProps) {
  const [internalDayOfWeek, setInternalDayOfWeek] = useState<number>(1);
  const selectedDayOfWeek = propSelectedDayOfWeek ?? internalDayOfWeek;

  const handleSelectDay = (day: number) => {
    if (onSelectDayOfWeek) {
      onSelectDayOfWeek(day);
    } else {
      setInternalDayOfWeek(day);
    }
  };

  const currentDayConfig = value.workingDays.find((d) => d.dayOfWeek === selectedDayOfWeek) ?? {
    dayOfWeek: selectedDayOfWeek,
    dayName: (DAYS_OF_WEEK.find((d) => d.dayOfWeek === selectedDayOfWeek)?.dayName ?? 'MONDAY') as DaySchedule['dayName'],
    isEnabled: false,
    sessions: [],
    breaks: [],
  };

  const updateCurrentDay = (updater: (prev: DaySchedule) => DaySchedule) => {
    const existingIndex = value.workingDays.findIndex((d) => d.dayOfWeek === selectedDayOfWeek);
    let newWorkingDays: DaySchedule[];

    if (existingIndex >= 0) {
      newWorkingDays = [...value.workingDays];
      newWorkingDays[existingIndex] = updater(newWorkingDays[existingIndex]!);
    } else {
      newWorkingDays = [...value.workingDays, updater(currentDayConfig)];
    }

    onChange({
      ...value,
      workingDays: newWorkingDays,
    });
  };

  const handleToggleDayEnabled = () => {
    updateCurrentDay((prev) => {
      const willEnable = !prev.isEnabled;
      return {
        ...prev,
        isEnabled: willEnable,

        sessions:
          willEnable && prev.sessions.length === 0
            ? [{ startTime: '09:00', endTime: '17:00', label: 'Regular Shift' }]
            : prev.sessions,
      };
    });
  };

  const handleAddSession = () => {
    updateCurrentDay((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        { startTime: '13:00', endTime: '17:00', label: 'Afternoon' },
      ],
    }));
  };

  const handleUpdateSession = (index: number, field: keyof Session, val: string) => {
    updateCurrentDay((prev) => {
      const updated = [...prev.sessions];
      if (updated[index]) {
        updated[index] = { ...updated[index]!, [field]: val };
      }
      return { ...prev, sessions: updated };
    });
  };

  const handleRemoveSession = (index: number) => {
    updateCurrentDay((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index),
    }));
  };

  const handleAddBreak = () => {
    updateCurrentDay((prev) => ({
      ...prev,
      breaks: [
        ...prev.breaks,
        { startTime: '12:00', endTime: '13:00', label: 'Lunch Break' },
      ],
    }));
  };

  const handleUpdateBreak = (index: number, field: keyof Break, val: string) => {
    updateCurrentDay((prev) => {
      const updated = [...prev.breaks];
      if (updated[index]) {
        updated[index] = { ...updated[index]!, [field]: val };
      }
      return { ...prev, breaks: updated };
    });
  };

  const handleRemoveBreak = (index: number) => {
    updateCurrentDay((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index),
    }));
  };

  const handleCopyMondayToWeekdays = () => {
    const mondayConfig = value.workingDays.find((d) => d.dayOfWeek === 1);
    if (!mondayConfig) return;

    const weekdayNumbers = [1, 2, 3, 4, 5];
    const newWorkingDays = value.workingDays.map((day) => {
      if (weekdayNumbers.includes(day.dayOfWeek)) {
        return {
          ...day,
          isEnabled: mondayConfig.isEnabled,
          sessions: JSON.parse(JSON.stringify(mondayConfig.sessions)),
          breaks: JSON.parse(JSON.stringify(mondayConfig.breaks)),
        };
      }
      return day;
    });

    onChange({
      ...value,
      workingDays: newWorkingDays,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {}
      <div
        style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <label
            htmlFor="slotDuration"
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#343a40', display: 'block' }}
          >
            Appointment Slot Duration
          </label>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
            Time allotted per patient consultation
          </span>
        </div>
        <select
          id="slotDuration"
          aria-label="Appointment Slot Duration"
          value={value.slotDuration}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, slotDuration: Number(e.target.value) })}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #ced4da',
            fontSize: '0.875rem',
            fontWeight: 600,
            background: '#ffffff',
            outline: 'none',
          }}
        >
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes (Standard)</option>
          <option value={20}>20 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={45}>45 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
      </div>

      {/* Weekday Selection Bar */}
      <div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = selectedDayOfWeek === d.dayOfWeek;
            const dayData = value.workingDays.find((item) => item.dayOfWeek === d.dayOfWeek);
            const isWorking = dayData?.isEnabled && dayData.sessions.length > 0;

            return (
              <button
                key={d.dayOfWeek}
                type="button"
                onClick={() => handleSelectDay(d.dayOfWeek)}
                style={{
                  flex: 1,
                  minWidth: '58px',
                  padding: '8px 4px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #0a0a0a' : '1px solid #dee2e6',
                  background: isSelected ? '#0a0a0a' : '#ffffff',
                  color: isSelected ? '#ffffff' : '#495057',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.12s',
                }}
              >
                <span>{d.shortLabel}</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isWorking ? (isSelected ? '#4ade80' : '#198754') : '#ced4da',
                  }}
                  title={isWorking ? 'Working Day' : 'Day Off'}
                />
              </button>
            );
          })}
        </div>

        {}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyMondayToWeekdays}
            disabled={disabled}
            style={{ fontSize: '0.75rem' }}
          >
            📋 Apply Monday Roster to Weekdays (Mon–Fri)
          </Button>
        </div>
      </div>

      {/* Day Configuration Panel */}
      <div
        style={{
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '1.25rem',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #e9ecef',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#0a0a0a' }}>
              {DAYS_OF_WEEK.find((d) => d.dayOfWeek === selectedDayOfWeek)?.label} Schedule
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
              Define working hours and scheduled break intervals
            </span>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={currentDayConfig.isEnabled}
              onChange={handleToggleDayEnabled}
              disabled={disabled}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>{currentDayConfig.isEnabled ? 'Working Day' : 'Day Off'}</span>
          </label>
        </div>

        {!currentDayConfig.isEnabled ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#adb5bd',
              background: '#f8f9fa',
              borderRadius: '6px',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
              Physician is not scheduled to work on this day.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>
              Toggle &ldquo;Working Day&rdquo; above to configure hours.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#212529' }}>
                    Working Sessions
                  </span>
                  <Badge variant="info">{currentDayConfig.sessions.length}</Badge>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddSession}
                  disabled={disabled}
                >
                  + Add Session
                </Button>
              </div>

              {currentDayConfig.sessions.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    background: '#fff3cd',
                    color: '#856404',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                  }}
                >
                  ⚠️ Please add at least one working session for this day.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentDayConfig.sessions.map((session, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#f8f9fa',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="e.g. Morning Shift"
                        value={session.label ?? ''}
                        onChange={(e) => handleUpdateSession(idx, 'label', e.target.value)}
                        disabled={disabled}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '0.8125rem',
                          background: '#ffffff',
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>From</span>
                        <input
                          type="time"
                          value={session.startTime}
                          onChange={(e) => handleUpdateSession(idx, 'startTime', e.target.value)}
                          disabled={disabled}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: '#ffffff',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>to</span>
                        <input
                          type="time"
                          value={session.endTime}
                          onChange={(e) => handleUpdateSession(idx, 'endTime', e.target.value)}
                          disabled={disabled}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: '#ffffff',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSession(idx)}
                        disabled={disabled}
                        aria-label="Remove session"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '2px 6px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Break Periods Section */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#212529' }}>
                    Break Periods
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                    (Slots are never generated during breaks)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddBreak}
                  disabled={disabled}
                >
                  + Add Break
                </Button>
              </div>

              {currentDayConfig.breaks.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: '#adb5bd', fontStyle: 'italic' }}>
                  No breaks configured for this day.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentDayConfig.breaks.map((brk, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#fff9db',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '6px',
                        border: '1px solid #ffe066',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="e.g. Lunch"
                        value={brk.label ?? ''}
                        onChange={(e) => handleUpdateBreak(idx, 'label', e.target.value)}
                        disabled={disabled}
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: '1px solid #ced4da',
                          fontSize: '0.8125rem',
                          background: '#ffffff',
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>From</span>
                        <input
                          type="time"
                          value={brk.startTime}
                          onChange={(e) => handleUpdateBreak(idx, 'startTime', e.target.value)}
                          disabled={disabled}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: '#ffffff',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>to</span>
                        <input
                          type="time"
                          value={brk.endTime}
                          onChange={(e) => handleUpdateBreak(idx, 'endTime', e.target.value)}
                          disabled={disabled}
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            background: '#ffffff',
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveBreak(idx)}
                        disabled={disabled}
                        aria-label="Remove break"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '2px 6px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
