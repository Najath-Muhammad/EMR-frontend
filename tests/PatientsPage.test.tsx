import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientsPage } from '../src/pages/receptionist/PatientsPage';
import * as patientApi from '../src/api/patient.api';
import * as deptApi from '../src/api/department.api';
import { Patient, DuplicateCheckResponse } from '../src/types/patient.types';

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'u-1', email: 'receptionist@hospital.com', name: 'Desk Staff', role: 'RECEPTIONIST' },
    isAuthenticated: true,
  })),
}));

vi.mock('../src/api/patient.api', () => ({
  fetchPatients: vi.fn(),
  fetchPatientById: vi.fn(),
  checkPatientDuplicates: vi.fn(),
  createPatient: vi.fn(),
  updatePatient: vi.fn(),
}));

vi.mock('../src/api/department.api', () => ({
  fetchActiveDepartments: vi.fn(),
}));

const mockPatients: Patient[] = [
  {
    id: 'p-1',
    patientId: 'PAT-2026-00001',
    fullName: 'Jane Doe',
    phone: '5551234567',
    normalizedPhone: '5551234567',
    dateOfBirth: '1990-05-15',
    gender: 'FEMALE',
    bloodGroup: 'O+',
    email: 'jane@example.com',
    address: '123 Main St, Springfield',
    emergencyContact: {
      name: 'John Doe',
      phone: '5559876543',
      relation: 'Spouse',
    },
    registrationDepartment: {
      id: 'dept-cardio',
      name: 'Cardiology',
      code: 'CARD',
    },
    registeredBy: {
      id: 'staff-1',
      name: 'Receptionist Sarah',
      email: 'sarah@hospital.com',
    },
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'p-2',
    patientId: 'PAT-2026-00002',
    fullName: 'Robert Smith',
    phone: '5559876543',
    normalizedPhone: '5559876543',
    dateOfBirth: '1985-08-20',
    gender: 'MALE',
    bloodGroup: 'A+',
    email: 'robert@example.com',
    address: '456 Elm St, Cityville',
    registrationDepartment: {
      id: 'dept-neuro',
      name: 'Neurology',
      code: 'NEUR',
    },
    registeredBy: {
      id: 'staff-1',
      name: 'Receptionist Sarah',
      email: 'sarah@hospital.com',
    },
    createdAt: '2026-01-11T11:00:00.000Z',
    updatedAt: '2026-01-11T11:00:00.000Z',
  },
];

function renderPatientsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PatientsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(patientApi.fetchPatients).mockResolvedValue({
      success: true,
      message: 'Patients retrieved successfully',
      data: mockPatients,
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });

    vi.mocked(deptApi.fetchActiveDepartments).mockResolvedValue([
      {
        id: 'dept-cardio',
        name: 'Cardiology',
        code: 'CARD',
        isActive: true,
        doctorCount: 2,
        hasActiveReceptionist: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('renders patient directory with table rows and columns', async () => {
    renderPatientsPage();

    expect(screen.getByText('Patient Directory & Registration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ register patient/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('PAT-2026-00001')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('PAT-2026-00002')).toBeInTheDocument();
      expect(screen.getByText('Robert Smith')).toBeInTheDocument();
    });
  });

  it('allows debounced search input', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    const searchInput = screen.getByRole('textbox', { name: /search patients/i });
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, 'Jane');

    await waitFor(
      () => {
        expect(patientApi.fetchPatients).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Jane',
          }),
        );
      },
      { timeout: 1000 },
    );
  });

  it('opens and displays the patient detail modal', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /view profile/i });
    await user.click(viewButtons[0]);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Patient Medical Profile')).toBeInTheDocument();
      expect(within(dialog).getByText('123 Main St, Springfield')).toBeInTheDocument();
      expect(within(dialog).getByText('John Doe')).toBeInTheDocument();
    });

    // Close detail modal
    const closeBtn = screen.getByRole('button', { name: /^close$/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Patient Medical Profile')).not.toBeInTheDocument();
    });
  });

  it('opens the registration modal and validates required fields', async () => {
    const user = userEvent.setup();
    renderPatientsPage();

    const registerBtn = screen.getByRole('button', { name: /\+ register patient/i });
    await user.click(registerBtn);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Register New Patient')).toBeInTheDocument();

    const submitBtn = within(dialog).getByRole('button', { name: /check duplicates & register/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number must be at least 7 digits/i)).toBeInTheDocument();
      expect(screen.getByText(/date of birth must be in yyyy-mm-dd format/i)).toBeInTheDocument();
    });
  });

  it('successfully creates a new patient when duplicate check returns no matches', async () => {
    const user = userEvent.setup();

    vi.mocked(patientApi.checkPatientDuplicates).mockResolvedValue({
      success: true,
      message: 'No duplicates found',
      data: {
        hasMatches: false,
        duplicates: [],
      },
      meta: {},
    });

    const createdPatient: Patient = {
      id: 'p-3',
      patientId: 'PAT-2026-00003',
      fullName: 'Alice Walker',
      phone: '5553334444',
      normalizedPhone: '5553334444',
      dateOfBirth: '1995-04-12',
      gender: 'FEMALE',
      bloodGroup: 'B+',
      email: 'alice@example.com',
      createdAt: '2026-01-12T12:00:00.000Z',
      updatedAt: '2026-01-12T12:00:00.000Z',
    };

    vi.mocked(patientApi.createPatient).mockResolvedValue({
      success: true,
      message: 'Patient registered successfully',
      data: createdPatient,
      meta: {},
    });

    renderPatientsPage();

    const registerBtn = screen.getByRole('button', { name: /\+ register patient/i });
    await user.click(registerBtn);

    const dialog = screen.getByRole('dialog');

    // Fill form
    await user.type(within(dialog).getByLabelText(/^full name/i), 'Alice Walker');
    await user.type(within(dialog).getByLabelText(/^mobile number/i), '5553334444');
    await user.type(within(dialog).getByLabelText(/^date of birth/i), '1995-04-12');
    await user.selectOptions(within(dialog).getByLabelText(/^gender/i), 'FEMALE');

    const submitBtn = within(dialog).getByRole('button', { name: /check duplicates & register/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(patientApi.checkPatientDuplicates).toHaveBeenCalledWith({
        phone: '5553334444',
        fullName: 'Alice Walker',
        dateOfBirth: '1995-04-12',
      });
      expect(patientApi.createPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Alice Walker',
          phone: '5553334444',
          dateOfBirth: '1995-04-12',
          gender: 'FEMALE',
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/patient alice walker registered successfully with id: pat-2026-00003/i),
      ).toBeInTheDocument();
    });
  });

  it('triggers duplicate prevention warning modal when duplicate is detected, allows selecting existing patient', async () => {
    const user = userEvent.setup();

    const duplicateCheckResponse: DuplicateCheckResponse = {
      hasMatches: true,
      duplicates: [
        {
          patient: mockPatients[0],
          matchReasons: ['MATCHING_PHONE'],
          confidence: 'HIGH',
        },
      ],
    };

    vi.mocked(patientApi.checkPatientDuplicates).mockResolvedValue({
      success: true,
      message: 'Potential duplicate patients detected',
      data: duplicateCheckResponse,
      meta: {},
    });

    renderPatientsPage();

    const registerBtn = screen.getByRole('button', { name: /\+ register patient/i });
    await user.click(registerBtn);

    const regDialog = screen.getByRole('dialog');

    await user.type(within(regDialog).getByLabelText(/^full name/i), 'Jane Doe Junior');
    await user.type(within(regDialog).getByLabelText(/^mobile number/i), '5551234567');
    await user.type(within(regDialog).getByLabelText(/^date of birth/i), '2015-06-10');
    await user.selectOptions(within(regDialog).getByLabelText(/^gender/i), 'FEMALE');

    const submitBtn = within(regDialog).getByRole('button', { name: /check duplicates & register/i });
    await user.click(submitBtn);

    // Duplicate alert modal should appear
    await waitFor(() => {
      expect(screen.getByText(/potential duplicate records detected/i)).toBeInTheDocument();
    });

    // Receptionist can select the existing patient
    const useExistingBtn = screen.getByRole('button', { name: /use this patient/i });
    await user.click(useExistingBtn);

    // Should open patient medical profile for the existing patient
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('Patient Medical Profile')).toBeInTheDocument();
      expect(within(dialog).getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('allows receptionist to proceed with new registration (e.g. family member sharing phone) from duplicate dialog', async () => {
    const user = userEvent.setup();

    const duplicateCheckResponse: DuplicateCheckResponse = {
      hasMatches: true,
      duplicates: [
        {
          patient: mockPatients[0],
          matchReasons: ['MATCHING_PHONE'],
          confidence: 'HIGH',
        },
      ],
    };

    vi.mocked(patientApi.checkPatientDuplicates).mockResolvedValue({
      success: true,
      message: 'Potential duplicate patients detected',
      data: duplicateCheckResponse,
      meta: {},
    });

    const createdChild: Patient = {
      id: 'p-4',
      patientId: 'PAT-2026-00004',
      fullName: 'Jimmy Doe',
      phone: '5551234567',
      normalizedPhone: '5551234567',
      dateOfBirth: '2018-09-01',
      gender: 'MALE',
      bloodGroup: 'O+',
      createdAt: '2026-01-12T14:00:00.000Z',
      updatedAt: '2026-01-12T14:00:00.000Z',
    };

    vi.mocked(patientApi.createPatient).mockResolvedValue({
      success: true,
      message: 'Patient registered successfully',
      data: createdChild,
      meta: {},
    });

    renderPatientsPage();

    const registerBtn = screen.getByRole('button', { name: /\+ register patient/i });
    await user.click(registerBtn);

    const regDialog = screen.getByRole('dialog');

    await user.type(within(regDialog).getByLabelText(/^full name/i), 'Jimmy Doe');
    await user.type(within(regDialog).getByLabelText(/^mobile number/i), '5551234567');
    await user.type(within(regDialog).getByLabelText(/^date of birth/i), '2018-09-01');
    await user.selectOptions(within(regDialog).getByLabelText(/^gender/i), 'MALE');

    const submitBtn = within(regDialog).getByRole('button', { name: /check duplicates & register/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/potential duplicate records detected/i)).toBeInTheDocument();
    });

    // Receptionist clicks "Register as New Patient (Shared Phone / Family)"
    const forceCreateBtn = screen.getByRole('button', {
      name: /register as new patient \(shared phone \/ family\)/i,
    });
    await user.click(forceCreateBtn);

    await waitFor(() => {
      expect(patientApi.createPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Jimmy Doe',
          phone: '5551234567',
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/patient jimmy doe registered successfully with id: pat-2026-00004/i),
      ).toBeInTheDocument();
    });
  });
});
