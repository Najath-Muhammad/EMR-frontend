import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { activateAccount } from '../../api/staff.api';
import { InputField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { APP_ROUTES } from '../../constants/routes';

const activateSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ActivateFormValues = z.infer<typeof activateSchema>;

export function ActivateAccountPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateFormValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ActivateFormValues) => {
    if (!token) {
      setErrorMessage('Activation token is missing. Please check your invitation link.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await activateAccount({
        token,
        password: values.password,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to activate account. The invitation link may have expired or already been used.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          padding: '2rem',
        }}
      >
        {/* Brand / Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            EMR System
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '4px' }}>
            Staff Account Activation & Password Setup
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#d1fae5',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 1rem',
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0a0a0a', margin: '0 0 0.5rem' }}>
              Account Activated!
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#495057', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              Your password has been securely set. You can now log in to the hospital management system.
            </p>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={() => navigate(APP_ROUTES.LOGIN)}
            >
              Go to Login
            </Button>
          </div>
        ) : !token ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: '6px',
                background: '#fee2e2',
                color: '#991b1b',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              ⚠️ <strong>Missing Activation Token:</strong> This page requires a valid invitation link. Please check your invitation email or contact your administrator.
            </div>
            <Link
              to={APP_ROUTES.LOGIN}
              style={{
                fontSize: '0.875rem',
                color: '#0a0a0a',
                textDecoration: 'underline',
                fontWeight: 500,
              }}
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {errorMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            <div
              style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                color: '#6c757d',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}
            >
              Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
            </div>

            <InputField
              label="New Password"
              type="password"
              required
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <InputField
              label="Confirm Password"
              type="password"
              required
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button
              type="submit"
              variant="primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              isLoading={isLoading}
            >
              Activate Account
            </Button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link
                to={APP_ROUTES.LOGIN}
                style={{
                  fontSize: '0.8125rem',
                  color: '#6c757d',
                  textDecoration: 'none',
                }}
              >
                Already activated? <span style={{ color: '#0a0a0a', fontWeight: 600 }}>Log in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
