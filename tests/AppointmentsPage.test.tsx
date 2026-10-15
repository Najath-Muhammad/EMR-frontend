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

  it('triggers debounced server-side search when typing in search input', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('John Doe')).toBeDefined());

    const searchInput = screen.getByLabelText(/Search appointments/i);
    await user.type(searchInput, 'John');

    await waitFor(
      () => {
        expect(appointmentApi.fetchAppointments).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'John',
            page: 1,
          }),
        );
      },
      { timeout: 1500 },
    );
  });

  it('triggers server-side query with date range filters', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('John Doe')).toBeDefined());

    const fromDateInput = screen.getByLabelText(/From Date/i);
    const toDateInput = screen.getByLabelText(/To Date/i);

    await user.type(fromDateInput, '2030-01-01');
    await user.type(toDateInput, '2030-01-15');

    await waitFor(() => {
      expect(appointmentApi.fetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2030-01-01',
          endDate: '2030-01-15',
          page: 1,
        }),
      );
    });
  });

  it('toggles column sorting and triggers server-side query with sortBy and sortOrder', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('John Doe')).toBeDefined());

    // Click Date & Time header to toggle asc -> desc
    const dateTimeHeader = screen.getByRole('columnheader', { name: /Date & Time/i });
    await user.click(dateTimeHeader);

    await waitFor(() => {
      expect(appointmentApi.fetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'date',
          sortOrder: 'desc',
        }),
      );
    });

    // Click Status header to sort by status asc
    const statusHeader = screen.getByRole('columnheader', { name: /Status/i });
    await user.click(statusHeader);

    await waitFor(() => {
      expect(appointmentApi.fetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'status',
          sortOrder: 'asc',
        }),
      );
    });
  });

  it('updates rows per page limit and resets page to 1', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('John Doe')).toBeDefined());

    const rowsSelect = screen.getByLabelText(/Rows per page/i);
    await user.selectOptions(rowsSelect, '25');

    await waitFor(() => {
      expect(appointmentApi.fetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
          page: 1,
        }),
      );
    });
  });

  it('resets all filters when clicking Clear Filters', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => expect(screen.getByText('John Doe')).toBeDefined());

    // Set a status filter to make Clear Filters button appear
    const statusSelect = screen.getByLabelText(/Status/i);
    await user.selectOptions(statusSelect, 'ARRIVED');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeDefined();
    });

    // Click Clear Filters
    const clearBtn = screen.getByRole('button', { name: /Clear Filters/i });
    await user.click(clearBtn);

    await waitFor(() => {
      expect(appointmentApi.fetchAppointments).toHaveBeenCalledWith(
        expect.objectContaining({
          status: undefined,
          search: undefined,
          startDate: undefined,
          endDate: undefined,
          sortBy: 'date',
          sortOrder: 'asc',
          page: 1,
        }),
      );
    });
  });
});
