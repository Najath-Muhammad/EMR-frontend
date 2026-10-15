import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  fontFamily: 'inherit',
  fontWeight: 500,
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
  borderRadius: '6px',
  outline: 'none',
};

const variants: Record<string, React.CSSProperties> = {
  primary:   { background: '#0a0a0a', color: '#ffffff', borderColor: '#0a0a0a' },
  secondary: { background: '#ffffff', color: '#0a0a0a', borderColor: '#dee2e6' },
  ghost:     { background: 'transparent', color: '#0a0a0a', borderColor: 'transparent' },
  danger:    { background: '#dc3545', color: '#ffffff', borderColor: '#dc3545' },
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { padding: '4px 12px', fontSize: '0.8125rem' },
  md: { padding: '8px 16px', fontSize: '0.875rem' },
  lg: { padding: '10px 20px', fontSize: '0.9375rem' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, children, disabled, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          ...baseStyle,
          ...variants[variant],
          ...sizes[size],
          opacity: disabled || isLoading ? 0.6 : 1,
          ...style,
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
