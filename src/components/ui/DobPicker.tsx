import { forwardRef, useState, useEffect, useId } from 'react';
import { Badge } from './Badge';

export interface DobPickerProps {
  label?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | { target: { name?: string; value: string } }) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

function getDaysInMonth(year: number, month: number): number {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

function calculateAgeSummary(dobString?: string): string | null {
  if (!dobString || dobString.length < 10) return null;
  const parts = dobString.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const dob = new Date(year, month, day);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  if (dob > today) return null;

  let ageYears = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    ageYears--;
  }

  if (ageYears < 0) return null;

  if (ageYears === 0) {
    const totalMonths =
      (today.getFullYear() - dob.getFullYear()) * 12 +
      today.getMonth() -
      dob.getMonth() -
      (today.getDate() < dob.getDate() ? 1 : 0);

    if (totalMonths <= 0) {
      const diffTime = Math.abs(today.getTime() - dob.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays === 1 ? '' : 's'} old (Newborn)`;
    }
    return `${totalMonths} month${totalMonths === 1 ? '' : 's'} old (Infant)`;
  }

  return `${ageYears} year${ageYears === 1 ? '' : 's'} old`;
}

export const DobPicker = forwardRef<HTMLInputElement, DobPickerProps>(
  (
    {
      label = 'Date of Birth',
      name = 'dateOfBirth',
      value: propValue,
      defaultValue,
      error,
      helperText,
      required,
      id,
      onChange,
      onBlur,
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const [selectedDate, setSelectedDate] = useState<string>(propValue ?? defaultValue ?? '');

    useEffect(() => {
      if (propValue !== undefined) {
        setSelectedDate((prev) => (prev !== propValue ? propValue : prev));
      }
    }, [propValue]);

    const parts = selectedDate.split('-');
    const currentY = parts[0] || '';
    const currentM = parts[1] || '';
    const currentD = parts[2] || '';

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedDate(e.target.value);
      onChange?.(e);
    };

    const handleYearOrMonthJump = (newY: string, newM: string) => {
      const year = newY || currentY || String(currentYear - 25);
      const month = newM || currentM || '01';
      let day = currentD || '01';

      const maxD = getDaysInMonth(parseInt(year, 10), parseInt(month, 10));
      if (parseInt(day, 10) > maxD) {
        day = String(maxD).padStart(2, '0');
      }

      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      setSelectedDate(formatted);
      onChange?.({
        target: { name, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const ageSummary = calculateAgeSummary(selectedDate);

    const years: number[] = [];
    for (let y = currentYear; y >= 1900; y--) {
      years.push(y);
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
        {}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label
            htmlFor={fieldId}
            style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#343a40' }}
          >
            {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
          </label>
          {ageSummary && (
            <Badge variant="info">
              🎂 {ageSummary}
            </Badge>
          )}
        </div>

        {}
        <div style={{ position: 'relative' }}>
          <input
            ref={ref}
            id={fieldId}
            name={name}
            type="date"
            max={today}
            min="1900-01-01"
            value={selectedDate}
            onChange={handleDateInputChange}
            onBlur={onBlur}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${error ? '#dc3545' : '#ced4da'}`,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              background: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Quick Year / Month Jump Helper */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#f8f9fa',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid #e9ecef',
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#6c757d', fontWeight: 500, whiteSpace: 'nowrap' }}>
            ⚡ Quick Jump:
          </span>
          <select
            aria-label="Quick jump year"
            value={currentY}
            onChange={(e) => handleYearOrMonthJump(e.target.value, currentM)}
            style={{
              flex: 1,
              padding: '3px 6px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '0.75rem',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select
            aria-label="Quick jump month"
            value={currentM}
            onChange={(e) => handleYearOrMonthJump(currentY, e.target.value)}
            style={{
              flex: 1,
              padding: '3px 6px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '0.75rem',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {}
        {error ? (
          <span style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: 500 }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{helperText}</span>
        ) : null}
      </div>
    );
  },
);

DobPicker.displayName = 'DobPicker';
