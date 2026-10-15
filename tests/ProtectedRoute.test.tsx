import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/auth/ProtectedRoute';
import * as useAuthModule from '../src/hooks/useAuth';
import { ROLES, User } from '../src/types/auth.types';

function mockUseAuth(overrides: Partial<ReturnType<typeof useAuthModule.useAuth>>) {
  vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

describe('ProtectedRoute', () => {
  it('renders loading spinner while session is being verified', () => {
    mockUseAuth({ isLoading: true });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status', { name: /checking authentication session/i })).toBeDefined();
  });

  it('redirects unauthenticated users to /login', () => {
    mockUseAuth({ isAuthenticated: false, user: null, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeDefined();
  });

  it('allows access when user has the authorized role', () => {
    const adminUser: User = {
      id: 'admin-123',
      name: 'Super Admin',
      email: 'admin@hospital.com',
      role: ROLES.SUPER_ADMIN,
      department: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    mockUseAuth({ isAuthenticated: true, user: adminUser, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/admin/dashboard" element={<div>Super Admin Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Super Admin Dashboard Content')).toBeDefined();
  });

  it('redirects user to /unauthorized when role is not permitted', () => {
    const doctorUser: User = {
      id: 'doctor-123',
      name: 'Dr. Smith',
      email: 'doctor@hospital.com',
      role: ROLES.DOCTOR,
      department: 'dep-1',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    mockUseAuth({ isAuthenticated: true, user: doctorUser, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]} />}>
            <Route path="/admin/dashboard" element={<div>Super Admin Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Unauthorized Page')).toBeDefined();
  });
});
