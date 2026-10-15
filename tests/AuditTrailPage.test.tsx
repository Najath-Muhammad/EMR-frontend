import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuditTrailPage } from '../src/pages/admin/AuditTrailPage';
import * as auditApi from '../src/api/auditLog.api';
import { AuditLog } from '../src/types/auditLog.types';

vi.mock('../src/api/auditLog.api');

const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    action: 'AUTH_LOGIN_SUCCESS',
    entityType: 'Auth',
    status: 'SUCCESS',
    actor: {
      userId: 'user-admin',
      name: 'System Admin',
      email: 'admin@hospital.com',
      role: 'SUPER_ADMIN',
    },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Vitest',
    details: { role: 'SUPER_ADMIN' },
    createdAt: '2026-10-15T10:00:00.000Z',
  },
  {
    id: 'log-2',
    action: 'APPOINTMENT_CREATE',
    entityType: 'Appointment',
    entityId: 'APP-1001',
    status: 'SUCCESS',
    actor: {
      userId: 'user-recep',
      name: 'Sarah Jenkins',
      email: 'sarah.ortho@hospital.com',
      role: 'RECEPTIONIST',
    },
    ipAddress: '192.168.1.10',
    details: {
      patientName: 'Arthur Pendelton',
      doctorName: 'Dr. James Wilson',
      date: '2026-10-20',
      startTime: '09:00',
    },
    createdAt: '2026-10-15T11:00:00.000Z',
  },
];

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuditTrailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AuditTrailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditApi.fetchAuditLogs).mockResolvedValue({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: mockAuditLogs,
      meta: {
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('renders page header and audit logs table with formatted data', async () => {
    renderWithProviders();

    expect(screen.getByText('Audit Trail & Activity Log')).toBeDefined();
    expect(screen.getByPlaceholderText(/search by action/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getAllByText('AUTH_LOGIN_SUCCESS').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('APPOINTMENT_CREATE').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('System Admin')).toBeDefined();
      expect(screen.getByText('Sarah Jenkins')).toBeDefined();
      expect(screen.getByText('127.0.0.1')).toBeDefined();
    });
  });

  it('triggers API call with action filter when select dropdown changes', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('AUTH_LOGIN_SUCCESS').length).toBeGreaterThanOrEqual(1);
    });

    const actionSelect = screen.getByRole('combobox', { name: /action/i });
    fireEvent.change(actionSelect, { target: { value: 'APPOINTMENT_CREATE' } });

    await waitFor(() => {
      expect(auditApi.fetchAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'APPOINTMENT_CREATE',
        }),
      );
    });
  });

  it('opens audit detail modal when clicking View Details button', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getAllByText('View Details').length).toBe(2);
    });

    const detailButtons = screen.getAllByText('View Details');
    fireEvent.click(detailButtons[1]!); // Click second button (APPOINTMENT_CREATE)

    await waitFor(() => {
      expect(screen.getByText('Audit Record Details')).toBeDefined();
      expect(screen.getByText('Sarah Jenkins (RECEPTIONIST)')).toBeDefined();
      expect(screen.getByText('Appointment (#APP-1001)')).toBeDefined();
      expect(screen.getByText(/Arthur Pendelton/)).toBeDefined();
    });

    // Close modal
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Audit Record Details')).toBeNull();
    });
  });
});
