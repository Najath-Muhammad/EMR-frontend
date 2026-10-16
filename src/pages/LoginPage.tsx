import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { APP_ROUTES } from '../constants/routes';
import { ROLES, Role } from '../types/auth.types';

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Helper to resolve role-specific destination
  const getDestinationForRole = (role: Role): string => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return APP_ROUTES.ADMIN_DASHBOARD;
      case ROLES.RECEPTIONIST:
        return APP_ROUTES.RECEPTIONIST_DASHBOARD;
      case ROLES.DOCTOR:
        return APP_ROUTES.DOCTOR_DASHBOARD;
      default:
        return APP_ROUTES.ROOT;
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated && user) {
    const destination = getDestinationForRole(user.role);
    return <Navigate to={destination} replace />;
  }

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(data);
      const destination = getDestinationForRole(loggedInUser.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 401) {
          setServerError('Invalid email or password. Please verify your credentials.');
        } else if (axiosErr.response?.status === 422) {
          setServerError('Please review the submitted form for formatting errors.');
        } else {
          setServerError(axiosErr.response?.data?.message ?? 'Authentication service unavailable. Please try again.');
        }
      } else {
        setServerError('Unable to connect to the authentication server. Please check your network.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromState = location.state as { from?: { pathname?: string } } | undefined;
  const sessionExpiredNotice = fromState?.from ? 'Please sign in to access the requested clinical page.' : null;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        padding: '1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#0a0a0a',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
            }}
          >
            ✚
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>
            EMR System
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '0.25rem' }}>
            Sign in to your hospital staff account
          </p>
        </div>

        <Card>
          {sessionExpiredNotice && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#e9ecef',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: '#495057',
              }}
            >
              ℹ {sessionExpiredNotice}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: '#991b1b',
              }}
            >
              ⚠ {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#0a0a0a',
                  marginBottom: '0.375rem',
                }}
              >
                Staff Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@hospital.com"
                {...register('email')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${errors.email ? '#dc3545' : '#dee2e6'}`,
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
              {errors.email && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#dc3545', marginTop: '0.25rem' }}>
                  {errors.email.message}
                </span>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#0a0a0a',
                  marginBottom: '0.375rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  style={{
                    width: '100%',
                    padding: '8px 38px 8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${errors.password ? '#dc3545' : '#dee2e6'}`,
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                />
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
              </div>
              {errors.password && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#dc3545', marginTop: '0.25rem' }}>
                  {errors.password.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              style={{ width: '100%' }}
            >
              Sign In
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#adb5bd', marginTop: '1.5rem' }}>
          Authorized hospital personnel only. Internal access is logged and monitored.
        </p>
      </div>
    </div>
  );
}
