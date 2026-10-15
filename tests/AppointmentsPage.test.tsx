import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppointmentsListPage } from '../src/pages/appointments/AppointmentsListPage';
import * as appointmentApi from '../src/api/appointment.api';
import * as deptApi from '../src/api/department.api';
import * as doctorApi from '../src/api/doctor.api';
import { Appointment } from '../src/types/appointment.types';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u-admin', email: 'admin@hospital.com', name: 'Admin', role: 'SUPER_ADMIN' },
    isAuthenticated: true,
  })),
}));

vi.mock('../src/api/appointment.api', () => ({
  fetchAppointments: vi.fn(),
  fetchAppointmentById: vi.fn(),
  createAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
}));

vi.mock('../src/api/department.api', () => ({
  fetchActiveDepartments: vi.fn(),
}));

vi.mock('../src/api/doctor.api', () => ({
  fetchDoctors: vi.fn(),
}));

const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    patient: {
      id: 'p-1',
      patientId: 'PAT-2026-00001',
      fullName: 'John Doe',
      phone: '5551112222',
    },
    doctor: {
      id: 'doc-1',
      name: 'Dr. Gregory House',
      email: 'house@hospital.com',
      specialization: 'Diagnostic Medicine',
    },
    department: {
      id: 'dept-1',
      name: 'Cardiology',
      code: 'CARD',
    },
    date: '2030-01-01',
    startTime: '09:00',
    endTime: '09:30',
    status: 'CONFIRMED',
    purpose: 'Routine checkup',
    notes: 'None',
    createdBy: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: '',
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
  },
  {
    id: 'appt-2',
    patient: {
      id: 'p-2',
      patientId: 'PAT-2026-00002',
      fullName: 'Alice Smith',
      phone: '5553334444',
    },
    doctor: {
      id: 'doc-1',
      name: 'Dr. Gregory House',
      email: 'house@hospital.com',
      specialization: 'Diagnostic Medicine',
    },
    department: {
      id: 'dept-1',
      name: 'Cardiology',
      code: 'CARD',
    },
    date: '2030-01-01',
    startTime: '10:00',
    endTime: '10:30',
    status: 'CANCELLED',
    purpose: 'Follow-up consultation',
    notes: '',
    createdBy: null,
    cancelledAt: '2026-10-15T13:00:00Z',
    cancelledBy: null,
    cancellationReason: 'Patient rescheduled',
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-10-15T13:00:00Z',
  },
];

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppointmentsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppointmentsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deptApi.fetchActiveDepartments).mockResolvedValue({
      success: true,
      message: 'OK',
      data: [{ id: 'dept-1', name: 'Cardiology', code: 'CARD', isActive: true }],
      meta: {},
    });
    vi.mocked(doctorApi.fetchDoctors).mockResolvedValue({
      success: true,
      message: 'OK',
      data: [{ id: 'doc-1', name: 'Dr. Gregory House', specialization: 'Diagnostic Medicine', department: 'dept-1' }],
      meta: {},
    });
    vi.mocked(appointmentApi.fetchAppointments).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockAppointments,
      meta: { total: 2, page: 1, limit: 15, totalPages: 1 },
    });
  });

  it('renders appointments table with patient, doctor, date, and status badges', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: /All Appointments/i })).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
      expect(screen.getByText('Alice Smith')).toBeDefined();
      expect(screen.getAllByText('CONFIRMED').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('CANCELLED').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('09:00 - 09:30')).toBeDefined();
    });
  });

  it('allows cancelling a confirmed appointment with a reason', async () => {
    vi.mocked(appointmentApi.cancelAppointment).mockResolvedValue({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        ...mockAppointments[0]!,
        status: 'CANCELLED',
        cancellationReason: 'Emergency reschedule',
      },
      meta: {},
    });

    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('John Doe')).toBeDefined());

    // Click Cancel on the first row
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    await user.click(cancelButtons[0]!);

    // Cancellation modal appears
    expect(screen.getByRole('heading', { name: /Cancel Appointment/i })).toBeDefined();

    // Type reason
    const reasonInput = screen.getByLabelText(/Reason for Cancellation/i);
    await user.type(reasonInput, 'Emergency reschedule');

    // Confirm Cancellation
    const confirmBtn = screen.getByRole('button', { name: /Confirm Cancellation/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(appointmentApi.cancelAppointment).toHaveBeenCalledWith('appt-1', {
        reason: 'Emergency reschedule',
      });
      expect(screen.getByRole('status')).toBeDefined();
    });
  });
});
