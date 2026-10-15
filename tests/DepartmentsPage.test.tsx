import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DepartmentsPage } from '../src/pages/admin/DepartmentsPage';
import * as deptApi from '../src/api/department.api';
import { Department } from '../src/types/department.types';

vi.mock('../src/api/department.api', () => ({
  fetchDepartments: vi.fn(),
  fetchActiveDepartments: vi.fn(),
  createDepartment: vi.fn(),
  updateDepartment: vi.fn(),
  toggleDepartmentStatus: vi.fn(),
}));

const mockDepartments: Department[] = [
  {
    id: 'dept-1',
    name: 'Cardiology',
    code: 'CARD',
    description: 'Heart and cardiovascular care',
    isActive: true,
    doctorCount: 3,
    hasActiveReceptionist: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dept-2',
    name: 'Neurology',
    code: 'NEUR',
    description: 'Brain and nervous system',
    isActive: true,
    doctorCount: 0,
    hasActiveReceptionist: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

function renderDepartmentsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DepartmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(deptApi.fetchDepartments).mockResolvedValue({
      success: true,
      message: 'Departments fetched',
      data: {
        items: mockDepartments,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
    });
  });

  it('renders department table with code, name, doctor count, and receptionist status', async () => {
    renderDepartmentsPage();

    await waitFor(() => {
      expect(screen.getByText('CARD')).toBeDefined();
      expect(screen.getByText('Cardiology')).toBeDefined();
      expect(screen.getByText('3 Doctors')).toBeDefined();
      expect(screen.getByText('● Assigned')).toBeDefined();

      expect(screen.getByText('NEUR')).toBeDefined();
      expect(screen.getByText('Neurology')).toBeDefined();
      expect(screen.getByText('0 Doctors')).toBeDefined();
      expect(screen.getByText('○ Vacant')).toBeDefined();
    });
  });

  it('opens add department modal when clicking "+ Add Department"', async () => {
    const user = userEvent.setup();
    renderDepartmentsPage();

    const addBtn = screen.getByRole('button', { name: /\+ add department/i });
    await user.click(addBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByLabelText(/department code/i)).toBeDefined();
    expect(screen.getByLabelText(/department name/i)).toBeDefined();
  });

  it('validates department creation form on submit', async () => {
    const user = userEvent.setup();
    renderDepartmentsPage();

    await user.click(screen.getByRole('button', { name: /\+ add department/i }));

    const submitBtn = screen.getByRole('button', { name: /^create department$/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Code must be at least 2 characters')).toBeDefined();
      expect(screen.getByText('Name must be at least 2 characters')).toBeDefined();
    });
  });

  it('submits valid department creation', async () => {
    const user = userEvent.setup();
    vi.mocked(deptApi.createDepartment).mockResolvedValueOnce({
      success: true,
      message: 'Department created successfully',
      data: {
        id: 'dept-3',
        name: 'Pediatrics',
        code: 'PEDI',
        isActive: true,
        doctorCount: 0,
        hasActiveReceptionist: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      meta: {},
    });

    renderDepartmentsPage();

    await user.click(screen.getByRole('button', { name: /\+ add department/i }));

    await user.type(screen.getByLabelText(/department code/i), 'PEDI');
    await user.type(screen.getByLabelText(/department name/i), 'Pediatrics');

    await user.click(screen.getByRole('button', { name: /^create department$/i }));

    await waitFor(() => {
      expect(deptApi.createDepartment).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'PEDI',
          name: 'Pediatrics',
        }),
      );
    });
  });

  it('opens confirm dialog when clicking Deactivate on an active department', async () => {
    const user = userEvent.setup();
    renderDepartmentsPage();

    await waitFor(() => {
      expect(screen.getByText('Cardiology')).toBeDefined();
    });

    const deactivateButtons = screen.getAllByRole('button', { name: /deactivate/i });
    await user.click(deactivateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to deactivate "Cardiology"/i)).toBeDefined();
    });
  });
});
