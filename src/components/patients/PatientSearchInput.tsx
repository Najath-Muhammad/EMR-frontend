import { useState, useEffect } from 'react';

interface PatientSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PatientSearchInput({
  value,
  onChange,
  placeholder = 'Search by Patient ID (e.g. PAT-2026-00001), mobile, or name…',
}: PatientSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '460px',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '12px',
          color: '#adb5bd',
          fontSize: '0.9375rem',
          pointerEvents: 'none',
        }}
      >
        🔍
      </span>

      <input
        type="text"
        aria-label="Search patients"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 36px 8px 36px',
          borderRadius: '6px',
          border: '1px solid #ced4da',
          fontSize: '0.875rem',
          background: '#ffffff',
          outline: 'none',
          transition: 'border-color 0.15s',
        }}
      />

      {localValue && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#adb5bd',
            fontSize: '0.875rem',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
