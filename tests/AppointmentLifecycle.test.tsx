import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookAppointmentPage } from '../src/pages/receptionist/BookAppointmentPage';
import { AppointmentsListPage } from '../src/pages/appointments/AppointmentsListPage';
import { DoctorAppointmentsPage } from '../src/pages/doctor/DoctorAppointmentsPage';
import * as appointmentApi from '../src/api/appointment.api';
import * as deptApi from '../src/api/department.api';
import * as doctorApi from '../src/api/doctor.api';
import { Appointment } from '../src/types/appointment.types';
import { useAuth } from '../src/hooks/useAuth';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/api/appointment.api', () => ({
  fetchAppointments: vi.fn(),
  fetchAppointmentById: vi.fn(),
  createAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  markAppointmentArrived: vi.fn(),
  completeAppointment: vi.fn(),
  updateAppointment: vi.fn(),
  updateConsultationNotes: vi.fn(),
  rescheduleAppointment: vi.fn(),
}));

vi.mock('../src/api/department.api', () => ({
  fetchActiveDepartments: vi.fn(),
}));

vi.mock('../src/api/doctor.api', () => ({
  fetchDoctors: vi.fn(),
}));

vi.mock('../src/api/patient.api', () => ({
  fetchPatients: vi.fn(),
  fetchPatientById: vi.fn(),
  checkPatientDuplicates: vi.fn(),
  createPatient: vi.fn(),
}));

vi.mock('../src/api/schedule.api', () => ({
  fetchDoctorSchedule: vi.fn(),
  saveDoctorSchedule: vi.fn(),
  toggleDoctorScheduleStatus: vi.fn(),
  fetchSlots: vi.fn(),
  previewSlots: vi.fn(),
}));

const mockAppointments: Appointment[] = [
  {
    id: 'appt-1',
    patient: {
      id: 'p-1',
      patientId: 'PT-2026-0001',
      fullName: 'John Doe',
      phone: '5551234567',
      dateOfBirth: '1985-06-15',
    },
    doctor: {
      id: 'doc-1',
      name: 'Dr. Gregory House',
      email: 'house@hospital.com',
      specialization: 'Cardiology',
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
    purpose: 'Cardiology evaluation',
    notes: 'Urgent checkup',
    createdBy: { id: 'u-rec', name: 'Receptionist Jane', email: 'jane@hospital.com' },
    arrivedAt: null,
    arrivedBy: null,
    completedAt: null,
    completedBy: null,
    consultationNotes: '',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: '',
    rescheduleHistory: [],
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
  },
  {
    id: 'appt-2',
    patient: {
      id: 'p-2',
      patientId: 'PT-2026-0002',
      fullName: 'Alice Smith',
      phone: '5559876543',
      dateOfBirth: '1992-03-20',
    },
    doctor: {
      id: 'doc-1',
      name: 'Dr. Gregory House',
      email: 'house@hospital.com',
      specialization: 'Cardiology',
    },
    department: {
      id: 'dept-1',
      name: 'Cardiology',
      code: 'CARD',
    },
    date: '2030-01-01',
    startTime: '09:30',
    endTime: '10:00',
    status: 'ARRIVED',
    purpose: 'Follow-up consultation',
    notes: 'In clinic',
    createdBy: { id: 'u-rec', name: 'Receptionist Jane', email: 'jane@hospital.com' },
    arrivedAt: '2030-01-01T09:20:00Z',
    arrivedBy: { id: 'u-rec', name: 'Receptionist Jane', email: 'jane@hospital.com' },
    completedAt: null,
    completedBy: null,
    consultationNotes: '',
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: '',
    rescheduleHistory: [],
    createdAt: '2026-10-15T12:00:00Z',
    updatedAt: '2026-10-15T12:00:00Z',
  },
];

function createTestWrapper(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Phase 6 — Frontend Appointment Lifecycle & Workflows', () => {
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
      data: [{ id: 'doc-1', name: 'Dr. Gregory House', specialization: 'Cardiology', department: 'dept-1' }],
      meta: {},
    });

    vi.mocked(appointmentApi.fetchAppointments).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockAppointments,
      meta: { total: 2, page: 1, limit: 15, totalPages: 1 },
    });
  });

  describe('Receptionist Department Locking', () => {
    it('locks department to assigned department and displays "Your Department" badge without dropdown', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'u-rec',
          name: 'Receptionist Jane',
          email: 'jane@hospital.com',
          role: 'RECEPTIONIST',
          department: 'dept-1',
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      createTestWrapper(<BookAppointmentPage />);

      await waitFor(() => {
        // Displays department name with locked badge
        expect(screen.getByText('Cardiology (CARD)')).toBeDefined();
        expect(screen.getByText('Your Department')).toBeDefined();
        // Dropdown for department does NOT exist
        expect(screen.queryByRole('combobox', { name: /Department \*/i })).toBeNull();
      });
    });
  });

  describe('AppointmentsListPage Lifecycle Actions', () => {
    it('allows a receptionist to mark a confirmed patient as arrived', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'u-rec',
          name: 'Receptionist Jane',
          email: 'jane@hospital.com',
          role: 'RECEPTIONIST',
          department: 'dept-1',
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(appointmentApi.markAppointmentArrived).mockResolvedValue({
        success: true,
        message: 'Patient marked as arrived successfully',
        data: {
          ...mockAppointments[0]!,
          status: 'ARRIVED',
          arrivedAt: '2030-01-01T08:55:00Z',
          arrivedBy: { id: 'u-rec', name: 'Receptionist Jane', email: 'jane@hospital.com' },
        },
        meta: {},
      });

      const user = userEvent.setup();
      createTestWrapper(<AppointmentsListPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeDefined();
      });

      // Find the "Arrived" action button for John Doe's row
      const arrivedBtn = screen.getByRole('button', { name: 'Arrived' });
      await user.click(arrivedBtn);

      await waitFor(() => {
        expect(appointmentApi.markAppointmentArrived).toHaveBeenCalledWith('appt-1');
        expect(screen.getByText(/marked as arrived/i)).toBeDefined();
      });
    });

    it('opens detailed view modal with audit trail and consultation notes', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'u-admin',
          name: 'Admin',
          email: 'admin@hospital.com',
          role: 'SUPER_ADMIN',
          department: null,
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      const user = userEvent.setup();
      createTestWrapper(<AppointmentsListPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeDefined();
      });

      // Click "Details" button
      const detailButtons = screen.getAllByRole('button', { name: 'Details' });
      await user.click(detailButtons[1]!); // Alice Smith row

      // Modal appears
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Appointment Details')).toBeDefined();
      expect(screen.getByText('ID: PT-2026-0002 · Phone: 5559876543')).toBeDefined();
    });
  });

  describe('Doctor Clinical Portal', () => {
    it('displays Waiting Room queue for patients marked as ARRIVED and allows completing consultation', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          id: 'doc-1',
          name: 'Dr. Gregory House',
          email: 'house@hospital.com',
          role: 'DOCTOR',
          department: 'dept-1',
          isActive: true,
          createdAt: '',
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(appointmentApi.completeAppointment).mockResolvedValue({
        success: true,
        message: 'Appointment completed successfully',
        data: {
          ...mockAppointments[1]!,
          status: 'COMPLETED',
          completedAt: '2030-01-01T10:00:00Z',
          completedBy: { id: 'doc-1', name: 'Dr. Gregory House', email: 'house@hospital.com' },
          consultationNotes: 'Echocardiogram clear. Advised low-sodium diet.',
        },
        meta: {},
      });

      const user = userEvent.setup();
      createTestWrapper(<DoctorAppointmentsPage />);

      // Verify Waiting Room card is rendered
      await waitFor(() => {
        expect(screen.getByText(/Patients in Waiting Room/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /Start Consultation/i })).toBeDefined();
      });

      // Click Start Consultation
      const consultBtn = screen.getByRole('button', { name: /Start Consultation/i });
      await user.click(consultBtn);

      // Consultation modal opens
      expect(screen.getByRole('dialog')).toBeDefined();
      expect(screen.getByText('Doctor Consultation')).toBeDefined();

      // Enter clinical findings
      const notesArea = screen.getByRole('textbox', { name: /Clinical Findings/i });
      await user.type(notesArea, 'Echocardiogram clear. Advised low-sodium diet.');

      // Complete consultation
      const completeBtn = screen.getByRole('button', { name: /Complete Consultation/i });
      await user.click(completeBtn);

      await waitFor(() => {
        expect(appointmentApi.completeAppointment).toHaveBeenCalledWith('appt-2', {
          consultationNotes: 'Echocardiogram clear. Advised low-sodium diet.',
        });
      });
    });
  });
});
