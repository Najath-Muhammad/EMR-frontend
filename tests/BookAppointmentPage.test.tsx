import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookAppointmentPage } from '../src/pages/receptionist/BookAppointmentPage';
import * as deptApi from '../src/api/department.api';
import * as doctorApi from '../src/api/doctor.api';
import * as scheduleApi from '../src/api/schedule.api';
import * as patientApi from '../src/api/patient.api';
import * as appointmentApi from '../src/api/appointment.api';
import { AxiosError, AxiosResponse } from 'axios';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u-1', email: 'receptionist@hospital.com', name: 'Desk Staff', role: 'RECEPTIONIST' },
    isAuthenticated: true,
  })),
}));

vi.mock('../src/api/department.api', () => ({
  fetchActiveDepartments: vi.fn(),
}));

vi.mock('../src/api/doctor.api', () => ({
  fetchDoctors: vi.fn(),
}));

vi.mock('../src/api/schedule.api', () => ({
  fetchDoctorSchedule: vi.fn(),
  saveDoctorSchedule: vi.fn(),
  toggleDoctorScheduleStatus: vi.fn(),
  fetchSlots: vi.fn(),
  previewSlots: vi.fn(),
}));

vi.mock('../src/api/patient.api', () => ({
  fetchPatients: vi.fn(),
  fetchPatientById: vi.fn(),
  checkPatientDuplicates: vi.fn(),
  createPatient: vi.fn(),
}));

vi.mock('../src/api/appointment.api', () => ({
  fetchAppointments: vi.fn(),
  fetchAppointmentById: vi.fn(),
  createAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
}));

const mockDepartments = [
  { id: 'dept-1', name: 'Cardiology', code: 'CARD', isActive: true },
];

const mockDoctors = [
  { id: 'doc-1', name: 'Dr. Gregory House', specialization: 'Diagnostic Medicine', department: 'dept-1' },
];

const mockPatient = {
  id: 'p-1',
  patientId: 'PAT-2026-00001',
  fullName: 'Jane Doe',
  phone: '5551234567',
  dateOfBirth: '1990-05-15',
  gender: 'FEMALE',
  isActive: true,
};

const mockSlots = {
  doctor: { id: 'doc-1', name: 'Dr. Gregory House' },
  date: '2030-01-01',
  dayOfWeek: 'TUESDAY',
  slotDuration: 30,
  totalSlots: 3,
  availableSlots: 2,
  slots: [
    { startTime: '09:00', endTime: '09:30', date: '2030-01-01', isAvailable: true, slotDuration: 30 },
    { startTime: '09:30', endTime: '10:00', date: '2030-01-01', isAvailable: false, reason: 'BOOKED', slotDuration: 30 },
    { startTime: '10:00', endTime: '10:30', date: '2030-01-01', isAvailable: true, slotDuration: 30 },
  ],
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <BookAppointmentPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BookAppointmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deptApi.fetchActiveDepartments).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockDepartments,
      meta: {},
    });
    vi.mocked(doctorApi.fetchDoctors).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockDoctors,
      meta: {},
    });
    vi.mocked(patientApi.fetchPatients).mockResolvedValue({
      success: true,
      message: 'OK',
      data: [mockPatient],
      meta: { total: 1 },
    });
    vi.mocked(scheduleApi.fetchSlots).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockSlots,
      meta: {},
    });
  });

  it('renders booking workflow sections and initial state', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: /Book Appointment/i })).toBeDefined();
    expect(screen.getByText(/1\. Patient Identification/i)).toBeDefined();
    expect(screen.getByText(/2\. Department & Doctor/i)).toBeDefined();
    expect(screen.getByText(/3\. Date & Available Slots/i)).toBeDefined();
    expect(screen.getByText(/4\. Appointment Purpose & Notes/i)).toBeDefined();
  });

  it('allows searching and selecting an existing patient', async () => {
    const user = userEvent.setup();
    renderComponent();

    const searchInput = screen.getByLabelText('Search patients');
    await user.type(searchInput, 'Jane');

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeDefined();
    });

    const selectBtn = screen.getByRole('button', { name: 'Select' });
    await user.click(selectBtn);

    expect(screen.getByText('✓ Patient Selected')).toBeDefined();
    expect(screen.getByText('PAT-2026-00001')).toBeDefined();
  });

  it('displays dynamic slots when department and doctor are selected', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Select Department
    const deptSelect = screen.getByLabelText(/Department \*/i);
    await waitFor(() => expect(deptSelect).not.toBeDisabled());
    await user.selectOptions(deptSelect, 'dept-1');

    // Select Doctor
    const docSelect = screen.getByLabelText(/Doctor \*/i);
    await waitFor(() => expect(docSelect).not.toBeDisabled());
    await user.selectOptions(docSelect, 'doc-1');

    await waitFor(() => {
      expect(screen.getByText('09:00 - 09:30')).toBeDefined();
      expect(screen.getByText('09:30 - 10:00')).toBeDefined();
      expect(screen.getByText('10:00 - 10:30')).toBeDefined();
      expect(screen.getByText('Booked')).toBeDefined();
    });
  });

  it('completes booking confirmation and displays success notification', async () => {
    vi.mocked(appointmentApi.createAppointment).mockResolvedValue({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        id: 'appt-12345',
        patient: mockPatient,
        doctor: mockDoctors[0]!,
        department: mockDepartments[0]!,
        date: '2030-01-01',
        startTime: '09:00',
        endTime: '09:30',
        status: 'CONFIRMED',
        purpose: 'Annual heart exam',
        notes: '',
        createdBy: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: '',
        createdAt: '2026-10-15T12:00:00Z',
        updatedAt: '2026-10-15T12:00:00Z',
      },
      meta: {},
    });

    const user = userEvent.setup();
    renderComponent();

    // 1. Select patient
    const searchInput = screen.getByLabelText('Search patients');
    await user.type(searchInput, 'Jane');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Select' })).toBeDefined());
    await user.click(screen.getByRole('button', { name: 'Select' }));

    // 2. Select Department and Doctor
    const deptSelect = screen.getByLabelText(/Department \*/i);
    await waitFor(() => expect(deptSelect).not.toBeDisabled());
    await user.selectOptions(deptSelect, 'dept-1');

    const docSelect = screen.getByLabelText(/Doctor \*/i);
    await waitFor(() => expect(docSelect).not.toBeDisabled());
    await user.selectOptions(docSelect, 'doc-1');

    // 3. Select 09:00 - 09:30 slot
    await waitFor(() => expect(screen.getByText('09:00 - 09:30')).toBeDefined());
    const slotBtn = screen.getByRole('button', { name: /09:00 - 09:30/i });
    await user.click(slotBtn);

    // 4. Fill Purpose
    const purposeInput = screen.getByLabelText(/Appointment Purpose \*/i);
    await user.type(purposeInput, 'Annual heart exam');

    // 5. Click Review & Confirm
    const reviewBtn = screen.getByRole('button', { name: /Review & Confirm Booking/i });
    await user.click(reviewBtn);

    // 6. Confirmation modal should be visible
    expect(screen.getByRole('heading', { name: /Confirm Appointment Booking/i })).toBeDefined();
    expect(screen.getAllByText('Jane Doe').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Annual heart exam')).toBeDefined();

    // 7. Confirm
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Book/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeDefined();
      expect(screen.getByText(/Appointment booked successfully/i)).toBeDefined();
    });
  });

  it('handles 409 Conflict with double-booking alert message and refreshes slots', async () => {
    const errorResponse = {
      status: 409,
      data: {
        success: false,
        message: 'This time slot has just been booked by another user. Please select another slot.',
      },
    } as AxiosResponse;

    const conflictAxiosError = new AxiosError(
      'Request failed with status code 409',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      errorResponse,
    );
    conflictAxiosError.response = errorResponse;

    vi.mocked(appointmentApi.createAppointment).mockRejectedValue(conflictAxiosError);

    const user = userEvent.setup();
    renderComponent();

    // Select patient
    const searchInput = screen.getByLabelText('Search patients');
    await user.type(searchInput, 'Jane');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Select' })).toBeDefined());
    await user.click(screen.getByRole('button', { name: 'Select' }));

    // Select Dept & Doctor
    const deptSelect = screen.getByLabelText(/Department \*/i);
    await waitFor(() => expect(deptSelect).not.toBeDisabled());
    await user.selectOptions(deptSelect, 'dept-1');

    const docSelect = screen.getByLabelText(/Doctor \*/i);
    await waitFor(() => expect(docSelect).not.toBeDisabled());
    await user.selectOptions(docSelect, 'doc-1');

    // Select Slot
    await waitFor(() => expect(screen.getByText('09:00 - 09:30')).toBeDefined());
    await user.click(screen.getByRole('button', { name: /09:00 - 09:30/i }));

    // Type Purpose
    await user.type(screen.getByLabelText(/Appointment Purpose \*/i), 'Checkup');

    // Review & Confirm
    await user.click(screen.getByRole('button', { name: /Review & Confirm Booking/i }));
    await user.click(screen.getByRole('button', { name: /Confirm & Book/i }));

    // Conflict Alert must be shown
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getByText(/This time slot has just been booked by another user/i)).toBeDefined();
    });

    // Slots query should be refetched
    expect(scheduleApi.fetchSlots).toHaveBeenCalled();
  });
});
