import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DoctorScheduleFilterBar } from '../src/components/schedule/DoctorScheduleFilterBar';
import * as deptApi from '../src/api/department.api';
import { DoctorWithSchedule } from '../src/types/schedule.types';
import { Department } from '../src/types/department.types';

vi.mock('../src/api/department.api', () => ({
  fetchActiveDepartments: vi.fn(),
}));

const mockDepartments: Department[] = [
  { id: 'dept-1', name: 'Cardiology', code: 'CARD', isActive: true },
  { id: 'dept-2', name: 'Neurology', code: 'NEUR', isActive: true },
  { id: 'dept-3', name: 'Pediatrics', code: 'PEDI', isActive: true },
];

const mockDoctors: DoctorWithSchedule[] = [
  {
    id: 'doc-1',
    name: 'Alice Smith',
    email: 'alice.smith@hospital.com',
    role: 'DOCTOR',
    department: { id: 'dept-1', name: 'Cardiology', code: 'CARD' },
    specialization: 'Interventional Cardiology',
    isActive: true,
    isActivated: true,
    hasSchedule: true,
    isScheduleActive: true,
  },
  {
    id: 'doc-2',
    name: 'Bob Jones',
    email: 'bob.jones@hospital.com',
    role: 'DOCTOR',
    department: { id: 'dept-2', name: 'Neurology', code: 'NEUR' },
    specialization: 'Neurophysiology',
    isActive: true,
    isActivated: true,
    hasSchedule: false,
    isScheduleActive: false,
  },
  {
    id: 'doc-3',
    name: 'Charlie Brown',
    email: 'charlie.brown@hospital.com',
    role: 'DOCTOR',
    department: { id: 'dept-1', name: 'Cardiology', code: 'CARD' },
    specialization: 'Echocardiography',
    isActive: true,
    isActivated: true,
    hasSchedule: true,
    isScheduleActive: false,
  },
  {
    id: 'doc-4',
    name: 'Diana Prince',
    email: 'diana.prince@hospital.com',
    role: 'DOCTOR',
    department: { id: 'dept-3', name: 'Pediatrics', code: 'PEDI' },
    specialization: 'General Pediatrics',
    isActive: true,
    isActivated: true,
    hasSchedule: false,
    isScheduleActive: false,
  },
];

function renderFilterBar(props: Partial<React.ComponentProps<typeof DoctorScheduleFilterBar>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const defaultProps = {
    doctors: mockDoctors,
    selectedDoctorId: 'doc-1',
    onSelectDoctor: vi.fn(),
    isDirty: false,
    ...props,
  };

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <DoctorScheduleFilterBar {...defaultProps} />
    </QueryClientProvider>,
  );

  return { ...utils, props: defaultProps };
}

describe('DoctorScheduleFilterBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deptApi.fetchActiveDepartments).mockResolvedValue(mockDepartments);
  });

  it('renders all filter controls, quick status tabs, and doctor count badge', async () => {
    renderFilterBar();

    expect(screen.getByRole('combobox', { name: /filter by department/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /search doctor/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /sort doctors/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select doctor/i })).toBeInTheDocument();

    // Check status buttons with real-time counts
    expect(screen.getByRole('button', { name: /all \(4\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /needs setup \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /configured \(2\)/i })).toBeInTheDocument();

    // Check counter
    expect(screen.getByText(/showing/i).textContent).toContain('Showing 4 of 4 doctors');
  });

  it('filters doctors by department dropdown selection', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    await waitFor(() => {
      expect(screen.getByText(/Cardiology \(CARD\)/i)).toBeInTheDocument();
    });

    const deptFilter = screen.getByRole('combobox', { name: /filter by department/i });
    await user.selectOptions(deptFilter, 'dept-2'); // Neurology

    const docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    const doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');

    expect(doctorOptions).toHaveLength(1);
    expect(doctorOptions[0]?.textContent).toContain('Dr. Bob Jones');
    expect(doctorOptions[0]?.textContent).toContain('Neurology');
    expect(screen.getByText(/showing/i).textContent).toContain('Showing 1 of 4 doctors');
  });

  it('searches doctors by name and specialization with clear button support', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const searchInput = screen.getByRole('textbox', { name: /search doctor/i });

    // Search by specialization
    await user.type(searchInput, 'Pediatrics');
    let docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    let doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');

    expect(doctorOptions).toHaveLength(1);
    expect(doctorOptions[0]?.textContent).toContain('Dr. Diana Prince');

    // Clear search using clear button (✕)
    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearBtn);

    docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');
    expect(doctorOptions).toHaveLength(4);
  });

  it('filters doctors by status buttons (Needs Setup vs Configured)', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    // Click 'Needs Setup'
    const needsSetupBtn = screen.getByRole('button', { name: /needs setup \(2\)/i });
    await user.click(needsSetupBtn);

    let docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    let doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');
    expect(doctorOptions).toHaveLength(2);
    expect(doctorOptions.map((o) => o.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Dr. Bob Jones'),
        expect.stringContaining('Dr. Diana Prince'),
      ]),
    );

    // Click 'Configured'
    const configuredBtn = screen.getByRole('button', { name: /configured \(2\)/i });
    await user.click(configuredBtn);

    docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');
    expect(doctorOptions).toHaveLength(2);
    expect(doctorOptions.map((o) => o.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Dr. Alice Smith'),
        expect.stringContaining('Dr. Charlie Brown'),
      ]),
    );

    // Reset via 'Clear Filters' button
    const clearFiltersBtn = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearFiltersBtn);

    doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');
    expect(doctorOptions).toHaveLength(4);
  });

  it('sorts doctors by various criteria (Name Z-A, Department, Needs Schedule first)', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const sortSelect = screen.getByRole('combobox', { name: /sort doctors/i });

    // Sort by Name (Z → A)
    await user.selectOptions(sortSelect, 'name-desc');
    let docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    let doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');
    expect(doctorOptions[0]?.textContent).toContain('Diana Prince');
    expect(doctorOptions[3]?.textContent).toContain('Alice Smith');

    // Sort by Needs Schedule First
    await user.selectOptions(sortSelect, 'needs-schedule');
    doctorOptions = Array.from(docSelect.querySelectorAll('option')).filter((o) => o.value !== '');
    // Unscheduled (Bob, Diana) should come before scheduled (Alice, Charlie)
    expect(doctorOptions[0]?.textContent).toMatch(/Bob Jones|Diana Prince/);
    expect(doctorOptions[1]?.textContent).toMatch(/Bob Jones|Diana Prince/);
    expect(doctorOptions[2]?.textContent).toMatch(/Alice Smith|Charlie Brown/);
  });

  it('navigates through doctors using Next (▶) and Prev (◀) stepper buttons', async () => {
    const user = userEvent.setup();
    const onSelectDoctor = vi.fn();
    renderFilterBar({ selectedDoctorId: 'doc-1', onSelectDoctor });

    const prevBtn = screen.getByRole('button', { name: /previous doctor/i });
    const nextBtn = screen.getByRole('button', { name: /next doctor/i });

    // Since doc-1 is index 0, prev button should be disabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    // Click Next
    await user.click(nextBtn);
    expect(onSelectDoctor).toHaveBeenCalledWith('doc-2');
  });

  it('guards unsaved schedule draft with modal confirmation when isDirty is true', async () => {
    const user = userEvent.setup();
    const onSelectDoctor = vi.fn();
    renderFilterBar({ selectedDoctorId: 'doc-1', onSelectDoctor, isDirty: true });

    // Attempt to switch doctor via select
    const docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    await user.selectOptions(docSelect, 'doc-2');

    // Callback should NOT be invoked immediately
    expect(onSelectDoctor).not.toHaveBeenCalled();

    // Safeguard modal should appear
    expect(screen.getByText(/Unsaved Schedule Changes/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Switching to another doctor will discard these unsaved changes/i),
    ).toBeInTheDocument();

    // Click 'Keep Editing'
    const keepEditingBtn = screen.getByRole('button', { name: /keep editing/i });
    await user.click(keepEditingBtn);
    expect(onSelectDoctor).not.toHaveBeenCalled();
    expect(screen.queryByText(/Unsaved Schedule Changes/i)).not.toBeInTheDocument();

    // Attempt switch again and confirm with 'Discard & Switch'
    await user.selectOptions(docSelect, 'doc-3');
    expect(screen.getByText(/Unsaved Schedule Changes/i)).toBeInTheDocument();

    const discardBtn = screen.getByRole('button', { name: /discard & switch/i });
    await user.click(discardBtn);

    expect(onSelectDoctor).toHaveBeenCalledWith('doc-3');
  });

  it('shows empty option when no doctors match filters', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    const searchInput = screen.getByRole('textbox', { name: /search doctor/i });
    await user.type(searchInput, 'NonExistentDoctorQueryXYZ');

    const docSelect = screen.getByRole('combobox', { name: /select doctor/i });
    const options = Array.from(docSelect.querySelectorAll('option'));
    expect(options).toHaveLength(1);
    expect(options[0]?.textContent).toContain('No doctors matching current filters');
  });
});
