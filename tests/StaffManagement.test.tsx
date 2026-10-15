import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DoctorsPage } from '../src/pages/admin/DoctorsPage';
import { ReceptionistsPage } from '../src/pages/admin/ReceptionistsPage';
import * as staffApi from '../src/api/staff.api';
import * as deptApi from '../src/api/department.api';
import { StaffMember } from '../src/types/staff.types';
import { Department } from '../src/types/department.types';
import { ROLES } from '../src/types/auth.types';

vi.mock('../src/api/staff.api', () => ({
  fetchStaff: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  toggleStaffStatus: vi.fn(),
  resendStaffActivation: vi.fn(),
}));

vi.mock('../src/api/department.api', () => ({
  fetchActiveDepartments: vi.fn(),
}));

const mockDepartments: Department[] = [
  {
    id: 'dept-cardio',
    name: 'Cardiology',
    code: 'CARD',
    isActive: true,
    doctorCount: 1,
    hasActiveReceptionist: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dept-neuro',
    name: 'Neurology',
    code: 'NEUR',
    isActive: true,
    doctorCount: 0,
    hasActiveReceptionist: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockDoctors: StaffMember[] = [
  {
    id: 'doc-1',
    name: 'Dr. Gregory House',
    email: 'house@hospital.com',
    role: ROLES.DOCTOR,
    department: { id: 'dept-cardio', name: 'Cardiology', code: 'CARD' },
    specialization: 'Diagnostic Medicine',
    phone: '+1 555-0101',
    isActive: true,
    isActivated: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const mockReceptionists: StaffMember[] = [
  {
    id: 'rec-1',
    name: 'Sarah Jenkins',
    email: 'sarah@hospital.com',
    role: ROLES.RECEPTIONIST,
    department: { id: 'dept-cardio', name: 'Cardiology', code: 'CARD' },
    phone: '+1 555-0102',
    isActive: true,
    isActivated: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
}

describe('DoctorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deptApi.fetchActiveDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(staffApi.fetchStaff).mockResolvedValue({
      success: true,
      message: 'Staff fetched',
      data: {
        items: mockDoctors,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('renders doctors list with department and details', async () => {
    const Wrapper = createTestWrapper();
    render(
      <Wrapper>
        <DoctorsPage />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dr. Gregory House')).toBeDefined();
      expect(screen.getByText('house@hospital.com')).toBeDefined();
      expect(screen.getByText('Diagnostic Medicine')).toBeDefined();
      expect(screen.getAllByText(/Cardiology \(CARD\)/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('opens add doctor modal and presents activation link modal upon successful creation', async () => {
    const user = userEvent.setup();
    const Wrapper = createTestWrapper();

    vi.mocked(staffApi.createStaff).mockResolvedValueOnce({
      success: true,
      message: 'Doctor created',
      data: {
        staff: {
          id: 'doc-2',
          name: 'Dr. James Wilson',
          email: 'wilson@hospital.com',
          role: ROLES.DOCTOR,
          department: { id: 'dept-cardio', name: 'Cardiology', code: 'CARD' },
          isActive: true,
          isActivated: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        activationToken: 'test-token-12345678',
        activationLink: 'http://localhost:5173/activate-account?token=test-token-12345678',
        expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      },
      meta: {},
    });

    render(
      <Wrapper>
        <DoctorsPage />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /\+ add doctor/i }));

    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/full name/i), 'Dr. James Wilson');
    await user.type(within(dialog).getByLabelText(/email address/i), 'wilson@hospital.com');
    await user.selectOptions(within(dialog).getByLabelText(/department/i), 'dept-cardio');

    await user.click(within(dialog).getByRole('button', { name: /^create doctor$/i }));

    await waitFor(() => {
      expect(screen.getByText('Staff Account Created')).toBeDefined();
      expect(screen.getByDisplayValue(/activate-account\?token=test-token-12345678/)).toBeDefined();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeDefined();
    });
  });
});

describe('ReceptionistsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deptApi.fetchActiveDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(staffApi.fetchStaff).mockResolvedValue({
      success: true,
      message: 'Staff fetched',
      data: {
        items: mockReceptionists,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('renders receptionist list and shows Active Receptionist badge', async () => {
    const Wrapper = createTestWrapper();
    render(
      <Wrapper>
        <ReceptionistsPage />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sarah Jenkins')).toBeDefined();
      expect(screen.getByText('sarah@hospital.com')).toBeDefined();
      expect(screen.getByText('Active Receptionist')).toBeDefined();
    });
  });

  it('displays department limit warning when selecting a department with an existing active receptionist', async () => {
    const user = userEvent.setup();
    const Wrapper = createTestWrapper();

    render(
      <Wrapper>
        <ReceptionistsPage />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /\+ add receptionist/i }));

    const dialog = screen.getByRole('dialog');
    // Select Cardiology (which has hasActiveReceptionist: true)
    await user.selectOptions(within(dialog).getByLabelText(/department/i), 'dept-cardio');

    await waitFor(() => {
      expect(
        screen.getByText(/The selected department \(Cardiology\) already has an active receptionist assigned/i),
      ).toBeDefined();
    });
  });
});
