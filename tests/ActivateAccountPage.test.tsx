import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ActivateAccountPage } from '../src/pages/auth/ActivateAccountPage';
import * as staffApi from '../src/api/staff.api';

vi.mock('../src/api/staff.api', () => ({
  activateAccount: vi.fn(),
}));

function renderActivateAccount(initialRoute = '/activate-account') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/activate-account" element={<ActivateAccountPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ActivateAccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays warning when activation token is missing in URL', () => {
    renderActivateAccount('/activate-account');

    expect(screen.getByText(/Missing Activation Token/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /return to login/i })).toBeDefined();
  });

  it('renders password setup form when token is present', () => {
    renderActivateAccount('/activate-account?token=valid-token-12345');

    expect(screen.getByLabelText(/new password/i)).toBeDefined();
    expect(screen.getByLabelText(/confirm password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /activate account/i })).toBeDefined();
  });

  it('displays validation error if password does not meet complexity requirements', async () => {
    const user = userEvent.setup();
    renderActivateAccount('/activate-account?token=valid-token-12345');

    await user.type(screen.getByLabelText(/new password/i), 'simple');
    await user.type(screen.getByLabelText(/confirm password/i), 'simple');
    await user.click(screen.getByRole('button', { name: /activate account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeDefined();
    });
  });

  it('displays error when password and confirm password do not match', async () => {
    const user = userEvent.setup();
    renderActivateAccount('/activate-account?token=valid-token-12345');

    await user.type(screen.getByLabelText(/new password/i), 'ValidPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass@123');
    await user.click(screen.getByRole('button', { name: /activate account/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeDefined();
    });
  });

  it('submits valid password and displays success screen', async () => {
    const user = userEvent.setup();
    vi.mocked(staffApi.activateAccount).mockResolvedValueOnce({
      success: true,
      message: 'Account activated successfully',
      data: { email: 'staff@hospital.com', role: 'DOCTOR', activated: true },
      meta: {},
    });

    renderActivateAccount('/activate-account?token=valid-token-12345');

    await user.type(screen.getByLabelText(/new password/i), 'StrongPass@123');
    await user.type(screen.getByLabelText(/confirm password/i), 'StrongPass@123');
    await user.click(screen.getByRole('button', { name: /activate account/i }));

    await waitFor(() => {
      expect(staffApi.activateAccount).toHaveBeenCalledWith({
        token: 'valid-token-12345',
        password: 'StrongPass@123',
      });
      expect(screen.getByText('Account Activated!')).toBeDefined();
      expect(screen.getByRole('button', { name: /go to login/i })).toBeDefined();
    });
  });
});
