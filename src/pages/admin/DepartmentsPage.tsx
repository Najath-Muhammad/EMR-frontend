import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useToggleDepartmentStatus,
} from '../../hooks/useDepartments';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InputField, TextareaField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Department } from '../../types/department.types';

const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must not exceed 10 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
  description: z.string().max(500).optional(),
});

type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>;

const updateDepartmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  description: z.string().max(500).optional(),
});

type UpdateDepartmentFormValues = z.infer<typeof updateDepartmentSchema>;

export function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<Department | null>(null);
  const [statusErrorModal, setStatusErrorModal] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
  const { data, isLoading } = useDepartments({
    page,
    limit,
    sortBy,
    sortOrder,
    search: search || undefined,
    isActive: isActiveParam,
  });

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const toggleStatusMutation = useToggleDepartmentStatus();

  const createForm = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: { name: '', code: '', description: '' },
  });

  const updateForm = useForm<UpdateDepartmentFormValues>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: { name: '', description: '' },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleOpenCreate = () => {
    setErrorMessage(null);
    createForm.reset({ name: '', code: '', description: '' });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setErrorMessage(null);
    setEditingDepartment(dept);
    updateForm.reset({ name: dept.name, description: dept.description ?? '' });
  };

  const handleCreateSubmit = (values: CreateDepartmentFormValues) => {
    setErrorMessage(null);
    createMutation.mutate(
      { ...values, code: values.code.toUpperCase() },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          createForm.reset();
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to create department';
          setErrorMessage(message);
        },
      },
    );
  };

  const handleUpdateSubmit = (values: UpdateDepartmentFormValues) => {
    if (!editingDepartment) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id: editingDepartment.id, input: values },
      {
        onSuccess: () => {
          setEditingDepartment(null);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to update department';
          setErrorMessage(message);
        },
      },
    );
  };

  const handleToggleStatusConfirm = () => {
    if (!statusConfirmTarget) return;
    const targetStatus = !statusConfirmTarget.isActive;

    toggleStatusMutation.mutate(
      { id: statusConfirmTarget.id, isActive: targetStatus },
      {
        onSuccess: () => {
          setStatusConfirmTarget(null);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to change department status';
          setStatusErrorModal(message);
          setStatusConfirmTarget(null);
        },
      },
    );
  };

  const departments: Department[] = Array.isArray(data?.data)
    ? data.data
    : (data?.data as unknown as { items?: Department[] })?.items ?? [];
  const total = data?.meta?.total ?? (data?.data as unknown as { total?: number })?.total ?? departments.length;
  const totalPages = data?.meta?.totalPages ?? (data?.data as unknown as { totalPages?: number })?.totalPages ?? 1;

  const columns: Column<Department>[] = [
    {
      id: 'code',
      header: 'Code',
      sortable: true,
      width: '120px',
      accessor: (row) => (
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.8125rem',
            background: '#f1f3f5',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          {row.code}
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Department Name',
      sortable: true,
      accessor: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0a0a0a' }}>{row.name}</span>
          {row.description && (
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6c757d' }}>
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'doctorCount',
      header: 'Doctors',
      width: '110px',
      align: 'center',
      accessor: (row) => (
        <Badge variant={row.doctorCount > 0 ? 'info' : 'neutral'}>
          {row.doctorCount} {row.doctorCount === 1 ? 'Doctor' : 'Doctors'}
        </Badge>
      ),
    },
    {
      id: 'hasActiveReceptionist',
      header: 'Receptionist',
      width: '140px',
      align: 'center',
      accessor: (row) => (
        <Badge variant={row.hasActiveReceptionist ? 'success' : 'warning'}>
          {row.hasActiveReceptionist ? '● Assigned' : '○ Vacant'}
        </Badge>
      ),
    },
    {
      id: 'isActive',
      header: 'Status',
      sortable: true,
      width: '100px',
      align: 'center',
      accessor: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '180px',
      align: 'right',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleOpenEdit(row)}
          >
            Edit
          </Button>
          <Button
            variant={row.isActive ? 'danger' : 'secondary'}
            size="sm"
            onClick={() => setStatusConfirmTarget(row)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0a0a0a' }}>
            Departments
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#6c757d' }}>
            Manage clinical departments, doctor rosters, and single active receptionist assignments.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Add Department
        </Button>
      </div>

      {/* Table & Filters */}
      <DataTable
        columns={columns}
        data={departments}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No departments found matching your criteria"
        sorting={{
          sortBy,
          sortOrder,
          onSort: handleSort,
        }}
        pagination={{
          page,
          limit,
          total,
          totalPages,
          onPageChange: (newPage) => setPage(newPage),
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        toolbar={
          <>
            <form
              onSubmit={handleSearchSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}
            >
              <input
                type="text"
                placeholder="Search by department name or code..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.875rem',
                  width: '100%',
                  maxWidth: '320px',
                  outline: 'none',
                }}
              />
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
              {search && (
                <Button type="button" variant="ghost" size="sm" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>Status:</span>
              <select
                aria-label="Filter departments by status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                  setPage(1);
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.8125rem',
                  background: '#ffffff',
                }}
              >
                <option value="all">All Departments</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </>
        }
      />

      {}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Department"
        description="Create a new medical department in the hospital system."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createForm.handleSubmit(handleCreateSubmit)}
              isLoading={createMutation.isPending}
            >
              Create Department
            </Button>
          </>
        }
      >
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.8125rem',
            }}
          >
            {errorMessage}
          </div>
        )}
        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
          <InputField
            label="Department Code"
            required
            placeholder="e.g. CARD, NEUR, PEDI"
            helperText="Uppercase alphanumeric identifier (e.g. CARD)"
            error={createForm.formState.errors.code?.message}
            {...createForm.register('code')}
          />
          <InputField
            label="Department Name"
            required
            placeholder="e.g. Cardiology"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <TextareaField
            label="Description"
            placeholder="Brief overview of clinical specialties..."
            error={createForm.formState.errors.description?.message}
            {...createForm.register('description')}
          />
        </form>
      </Modal>

      {}
      <Modal
        isOpen={!!editingDepartment}
        onClose={() => setEditingDepartment(null)}
        title={`Edit Department: ${editingDepartment?.code ?? ''}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingDepartment(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={updateForm.handleSubmit(handleUpdateSubmit)}
              isLoading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </>
        }
      >
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: '0.8125rem',
            }}
          >
            {errorMessage}
          </div>
        )}
        <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)}>
          <InputField
            label="Department Name"
            required
            error={updateForm.formState.errors.name?.message}
            {...updateForm.register('name')}
          />
          <TextareaField
            label="Description"
            error={updateForm.formState.errors.description?.message}
            {...updateForm.register('description')}
          />
        </form>
      </Modal>

      {}
      <ConfirmDialog
        isOpen={!!statusConfirmTarget}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={handleToggleStatusConfirm}
        title={statusConfirmTarget?.isActive ? 'Deactivate Department' : 'Activate Department'}
        message={
          statusConfirmTarget?.isActive
            ? `Are you sure you want to deactivate "${statusConfirmTarget?.name}" (${statusConfirmTarget?.code})? Existing appointments and audit logs are preserved, but staff will not be able to book new appointments under an inactive department.`
            : `Are you sure you want to reactivate "${statusConfirmTarget?.name}"?`
        }
        confirmLabel={statusConfirmTarget?.isActive ? 'Deactivate' : 'Activate'}
        variant={statusConfirmTarget?.isActive ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
      />

      {}
      <Modal
        isOpen={!!statusErrorModal}
        onClose={() => setStatusErrorModal(null)}
        title="Action Failed"
        maxWidth="440px"
        footer={
          <Button variant="secondary" onClick={() => setStatusErrorModal(null)}>
            Close
          </Button>
        }
      >
        <div style={{ padding: '0.5rem 0', color: '#dc3545', fontSize: '0.875rem', lineHeight: 1.5 }}>
          {statusErrorModal}
        </div>
      </Modal>
    </div>
  );
}
