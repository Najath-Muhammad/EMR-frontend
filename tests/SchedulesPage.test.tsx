import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SchedulesPage } from '../src/pages/admin/SchedulesPage';
import * as doctorApi from '../src/api/doctor.api';
import * as scheduleApi from '../src/api/schedule.api';
import { DoctorWithSchedule, DoctorSchedule } from '../src/types/schedule.types';
import { DaySlotsSummary } from '../src/types/slot.types';

vi.mock('../src/api/doctor.api', () => ({
  fetchDoctors: vi.fn(),
  fetchDoctorById: vi.fn(),
}));

vi.mock('../src/api/schedule.api', () => ({
  fetchDoctorSchedule: vi.fn(),
  saveDoctorSchedule: vi.fn(),
  toggleDoctorScheduleStatus: vi.fn(),
  previewSlots: vi.fn(),
  fetchSlots: vi.fn(),
}));

const mockDoctors: DoctorWithSchedule[] = [
  {
    id: 'doc-1',
    name: 'Gregory House',
    email: 'house@hospital.com',
    role: 'DOCTOR',
    department: { id: 'dept-1', name: 'Cardiology', code: 'CARD' },
    specialization: 'Diagnostic Medicine',
    isActive: true,
    isActivated: true,
    hasSchedule: true,
    isScheduleActive: true,
  },
  {
    id: 'doc-2',
    name: 'James Wilson',
    email: 'wilson@hospital.com',
    role: 'DOCTOR',
    department: { id: 'dept-2', name: 'Oncology', code: 'ONCO' },
    specialization: 'Oncology',
    isActive: true,
    isActivated: true,
    hasSchedule: false,
    isScheduleActive: false,
  },
];

const mockSchedule: DoctorSchedule = {
  id: 'sched-1',
  doctor: {
    id: 'doc-1',
    name: 'Gregory House',
    email: 'house@hospital.com',
    specialization: 'Diagnostic Medicine',
    department: { id: 'dept-1', name: 'Cardiology', code: 'CARD' },
  },
  slotDuration: 15,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  workingDays: [
    {
      dayOfWeek: 1,
      dayName: 'MONDAY',
      isEnabled: true,
      sessions: [{ startTime: '09:00', endTime: '12:00', label: 'Morning Clinic' }],
      breaks: [{ startTime: '10:30', endTime: '11:00', label: 'Tea Break' }],
    },
    {
      dayOfWeek: 2,
      dayName: 'TUESDAY',
      isEnabled: true,
      sessions: [{ startTime: '09:00', endTime: '12:00', label: 'Morning Clinic' }],
      breaks: [],
    },
    {
      dayOfWeek: 3,
      dayName: 'WEDNESDAY',
      isEnabled: false,
      sessions: [],
      breaks: [],
    },
    {
      dayOfWeek: 4,
      dayName: 'THURSDAY',
      isEnabled: false,
      sessions: [],
      breaks: [],
    },
    {
      dayOfWeek: 5,
      dayName: 'FRIDAY',
      isEnabled: false,
      sessions: [],
      breaks: [],
    },
    {
      dayOfWeek: 6,
      dayName: 'SATURDAY',
      isEnabled: false,
      sessions: [],
      breaks: [],
    },
    {
      dayOfWeek: 0,
      dayName: 'SUNDAY',
      isEnabled: false,
      sessions: [],
      breaks: [],
    },
  ],
};

const mockPreviewSlots: DaySlotsSummary = {
  doctor: {
    id: 'doc-1',
    name: 'Gregory House',
    department: { id: 'dept-1', name: 'Cardiology', code: 'CARD' },
  },
  date: '2026-10-20',
  dayOfWeek: 'TUESDAY',
  slotDuration: 15,
  totalSlots: 4,
  availableSlots: 4,
  slots: [
    { startTime: '09:00', endTime: '09:15', date: '2026-10-20', isAvailable: true, slotDuration: 15 },
    { startTime: '09:15', endTime: '09:30', date: '2026-10-20', isAvailable: true, slotDuration: 15 },
    { startTime: '09:30', endTime: '09:45', date: '2026-10-20', isAvailable: true, slotDuration: 15 },
    { startTime: '09:45', endTime: '10:00', date: '2026-10-20', isAvailable: true, slotDuration: 15 },
  ],
};

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SchedulesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SchedulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(doctorApi.fetchDoctors).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockDoctors,
      meta: { total: 2 },
    });

    vi.mocked(scheduleApi.fetchDoctorSchedule).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockSchedule,
      meta: {},
    });

    vi.mocked(scheduleApi.previewSlots).mockResolvedValue({
      success: true,
      message: 'OK',
      data: mockPreviewSlots,
      meta: {},
    });
  });

  it('shows no doctor selected initially, then renders doctor schedule details upon selection', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Doctor Schedules & Dynamic Slot Engine/i)).toBeInTheDocument();
    });

    // Check empty state prompt is displayed initially
    expect(screen.getByText(/No Doctor Selected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Please select a doctor from the physician list above to view, configure, and activate/i),
    ).toBeInTheDocument();

    // Check doctor select dropdown contains doctors
    const select = screen.getByRole('combobox', { name: /select doctor/i });
    expect(select).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Gregory House/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr\. James Wilson/i)).toBeInTheDocument();

    // Select doctor
    await user.selectOptions(select, 'doc-1');

    // Check schedule status badge and details now appear
    expect(await screen.findByText('Schedule Configured')).toBeInTheDocument();
    expect(screen.queryByText(/No Doctor Selected/i)).not.toBeInTheDocument();
  });

  it('renders weekly schedule editor with working sessions and break periods after doctor selection', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /select doctor/i })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /select doctor/i });
    await user.selectOptions(select, 'doc-1');

    await waitFor(() => {
      expect(screen.getByText(/Monday Schedule/i)).toBeInTheDocument();
    });

    // Check session input
    expect(screen.getByDisplayValue('Morning Clinic')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('12:00')).toBeInTheDocument();

    // Check break input
    expect(screen.getByDisplayValue('Tea Break')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10:30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('11:00')).toBeInTheDocument();
  });

  it('renders live slot preview grid with slot chips and count summary after doctor selection', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /select doctor/i })).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox', { name: /select doctor/i });
    await user.selectOptions(select, 'doc-1');

    await waitFor(() => {
      expect(screen.getByText(/Live Slot Preview/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('09:00 – 09:15')).toBeInTheDocument();
      expect(screen.getByText('09:15 – 09:30')).toBeInTheDocument();
    });

    // Verify summary counts
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Available:/i)).toBeInTheDocument();
  });

  it('saves updated schedule configuration successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(scheduleApi.saveDoctorSchedule).mockResolvedValue({
      success: true,
      message: 'Schedule saved',
      data: mockSchedule,
      meta: {},
    });

    renderComponent();

    // Select doctor
    const select = await screen.findByRole('combobox', { name: /select doctor/i });
    await user.selectOptions(select, 'doc-1');

    // Wait for doctor schedule to finish loading
    const durationSelect = await screen.findByLabelText(/Appointment Slot Duration/i);
    expect(durationSelect).toBeInTheDocument();

    // Change slot duration
    await user.selectOptions(durationSelect, '30');

    // Click Save button
    const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(scheduleApi.saveDoctorSchedule).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({ slotDuration: 30 }),
        false,
      );
    });

    expect(
      await screen.findByText(/Doctor schedule saved and active slots regenerated successfully/i),
    ).toBeInTheDocument();
  });

  it('displays conflict resolution modal on 409 conflict and supports force override', async () => {
    const user = userEvent.setup();

    // First save attempt rejects with 409 Conflict
    vi.mocked(scheduleApi.saveDoctorSchedule).mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          success: false,
          message: 'Conflict: existing appointment at 2026-10-25 10:00 falls outside new sessions',
        },
      },
    });

    // Second save attempt (force=true) succeeds
    vi.mocked(scheduleApi.saveDoctorSchedule).mockResolvedValueOnce({
      success: true,
      message: 'Schedule saved with override',
      data: mockSchedule,
      meta: {},
    });

    renderComponent();

    // Select doctor
    const select = await screen.findByRole('combobox', { name: /select doctor/i });
    await user.selectOptions(select, 'doc-1');

    // Wait for doctor schedule to finish loading
    await screen.findByDisplayValue('Morning Clinic');

    // Trigger save
    const saveBtn = screen.getByRole('button', { name: /save schedule/i });
    await user.click(saveBtn);

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText(/Existing Appointments Conflict/i)).toBeInTheDocument();
      expect(screen.getByText(/falls outside new sessions/i)).toBeInTheDocument();
    });

    // Click Force Override & Save
    const forceBtn = screen.getByRole('button', { name: /Force Override & Save/i });
    await user.click(forceBtn);

    await waitFor(() => {
      expect(scheduleApi.saveDoctorSchedule).toHaveBeenCalledWith(
        'doc-1',
        expect.any(Object),
        true, // force = true
      );
    });
  });
});
