import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseFieldProps {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export interface InputFieldProps
  extends InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, required, id, style, ...props }, ref) => {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '1rem' }}>
        <label
          htmlFor={fieldId}
          style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#343a40' }}
        >
          {label} {required && <span style={{ color: '#dc3545' }}>*</span>}
        </label>
        <input
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
            transition: 'border-color 0.15s',
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
