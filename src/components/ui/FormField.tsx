import { useState, forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export interface InputFieldProps
  extends InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  showPasswordToggle?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, required, id, type, style, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    const isPasswordField = type === 'password' || showPasswordToggle;
    const effectiveType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
        <label
          htmlFor={fieldId}
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#343a40' }}
        >
          {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            ref={ref}
            id={fieldId}
            type={effectiveType}
            style={{
              width: '100%',
              padding: isPasswordField ? '8px 38px 8px 12px' : '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${error ? '#dc3545' : '#ced4da'}`,
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              background: '#ffffff',
              outline: 'none',
              transition: 'border-color 0.15s',
              ...style,
            }}
            {...props}
          />
          {isPasswordField && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d',
                outline: 'none',
                borderRadius: '4px',
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>
        {error ? (
          <span style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: 500 }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{helperText}</span>
        ) : null}
      </div>
    );
  },
);
InputField.displayName = 'InputField';

export interface SelectFieldProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, helperText, required, id, options, placeholder, style, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
        <label
          htmlFor={fieldId}
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#343a40' }}
        >
          {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
        </label>
        <select
          ref={ref}
          id={fieldId}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${error ? '#dc3545' : '#ced4da'}`,
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            background: '#ffffff',
            outline: 'none',
            ...style,
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: 500 }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{helperText}</span>
        ) : null}
      </div>
    );
  },
);
SelectField.displayName = 'SelectField';

export interface TextareaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, helperText, required, id, style, rows = 3, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
        <label
          htmlFor={fieldId}
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#343a40' }}
        >
          {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: `1px solid ${error ? '#dc3545' : '#ced4da'}`,
            fontSize: '0.875rem',
            fontFamily: 'inherit',
            background: '#ffffff',
            outline: 'none',
            resize: 'vertical',
            ...style,
          }}
          {...props}
        />
        {error ? (
          <span style={{ fontSize: '0.75rem', color: '#dc3545', fontWeight: 500 }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{helperText}</span>
        ) : null}
      </div>
    );
  },
);
TextareaField.displayName = 'TextareaField';
