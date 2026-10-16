import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useStaffList,
  useCreateStaff,
  useUpdateStaff,
  useToggleStaffStatus,
  useResendActivation,
} from '../../hooks/useStaff';
import { useActiveDepartments } from '../../hooks/useDepartments';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { InputField, SelectField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ActivationLinkModal } from '../../components/staff/ActivationLinkModal';
import { StaffMember, StaffCreationResult } from '../../types/staff.types';
import { ROLES } from '../../types/auth.types';

const createDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  department: z.string().min(1, 'Please select a department'),
  specialization: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

type CreateDoctorFormValues = z.infer<typeof createDoctorSchema>;

const updateDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  department: z.string().min(1, 'Please select a department').optional(),
  specialization: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

type UpdateDoctorFormValues = z.infer<typeof updateDoctorSchema>;

export function DoctorsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<StaffMember | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<StaffMember | null>(null);
  const [statusErrorModal, setStatusErrorModal] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<StaffCreationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: departmentsData } = useActiveDepartments();
  const activeDepartments = departmentsData ?? [];

  const isActiveParam = statusFilter === 'all' ? undefined : statusFilter === 'active';
  const { data, isLoading } = useStaffList({
    page,
    limit,
    sortBy,
    sortOrder,
    role: ROLES.DOCTOR,
    search: search || undefined,
    department: departmentFilter || undefined,
    isActive: isActiveParam,
  });

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const toggleStatusMutation = useToggleStaffStatus();
  const resendActivationMutation = useResendActivation();

  // React Hook Form
  const createForm = useForm<CreateDoctorFormValues>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: { name: '', email: '', department: '', specialization: '', phone: '' },
  });

  const updateForm = useForm<UpdateDoctorFormValues>({
    resolver: zodResolver(updateDoctorSchema),
    defaultValues: { name: '', department: '', specialization: '', phone: '' },
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
    createForm.reset({ name: '', email: '', department: '', specialization: '', phone: '' });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (doctor: StaffMember) => {
    setErrorMessage(null);
    setEditingDoctor(doctor);
    updateForm.reset({
      name: doctor.name,
      department: doctor.department?.id ?? '',
      specialization: doctor.specialization ?? '',
      phone: doctor.phone ?? '',
    });
  };

  const handleCreateSubmit = (values: CreateDoctorFormValues) => {
    setErrorMessage(null);
    createMutation.mutate(
      {
        ...values,
        role: 'DOCTOR',
      },
      {
        onSuccess: (res) => {
          setIsCreateOpen(false);
          createForm.reset();
          setActivationResult(res.data);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to create doctor account';
          setErrorMessage(message);
        },
      },
    );
  };

  const handleUpdateSubmit = (values: UpdateDoctorFormValues) => {
    if (!editingDoctor) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id: editingDoctor.id, input: values },
      {
        onSuccess: () => {
          setEditingDoctor(null);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to update doctor details';
          setErrorMessage(message);
        },
      },
    );
  };

  const handleToggleStatusConfirm = () => {
    if (!statusConfirmTarget) return;
    toggleStatusMutation.mutate(
      { id: statusConfirmTarget.id, isActive: !statusConfirmTarget.isActive },
      {
        onSuccess: () => {
          setStatusConfirmTarget(null);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to change doctor status';
          setStatusErrorModal(message);
          setStatusConfirmTarget(null);
        },
      },
    );
  };

  const handleResendActivation = (doctor: StaffMember) => {
    resendActivationMutation.mutate(doctor.id, {
      onSuccess: (res) => {
        setActivationResult(res.data);
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to resend activation invitation';
        setStatusErrorModal(message);
      },
    });
  };

  const doctors: StaffMember[] = Array.isArray(data?.data)
    ? data.data
    : (data?.data as unknown as { items?: StaffMember[] })?.items ?? [];
  const total = data?.meta?.total ?? (data?.data as unknown as { total?: number })?.total ?? doctors.length;
  const totalPages = data?.meta?.totalPages ?? (data?.data as unknown as { totalPages?: number })?.totalPages ?? 1;

  const departmentOptions = activeDepartments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }));

  const columns: Column<StaffMember>[] = [
    {
      id: 'name',
      header: 'Doctor Name',
      sortable: true,
      accessor: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0a0a0a' }}>{row.name}</span>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6c757d' }}>
            {row.email}
          </p>
        </div>
      ),
    },
    {
      id: 'department',
      header: 'Department',
      accessor: (row) =>
        row.department ? (
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#f1f3f5',
            }}
          >
            {row.department.name} ({row.department.code})
          </span>
        ) : (
          <span style={{ color: '#adb5bd', fontSize: '0.8125rem' }}>Unassigned</span>
        ),
    },
    {
      id: 'specialization',
      header: 'Specialization',
      accessor: (row) => (
        <span style={{ fontSize: '0.8125rem', color: '#495057' }}>
          {row.specialization || '—'}
        </span>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessor: (row) => (
        <span style={{ fontSize: '0.8125rem', color: '#495057' }}>
          {row.phone || '—'}
        </span>
      ),
    },
    {
      id: 'isActivated',
      header: 'Account',
      width: '120px',
      align: 'center',
      accessor: (row) => (
        <Badge variant={row.isActivated ? 'success' : 'warning'}>
          {row.isActivated ? 'Activated' : 'Pending'}
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
      width: '220px',
      align: 'right',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', alignItems: 'center' }}>
          {!row.isActivated && (
            <Button
              variant="ghost"
              size="sm"
              title="Resend activation link"
              onClick={() => handleResendActivation(row)}
              isLoading={resendActivationMutation.isPending}
            >
              Invite
            </Button>
          )}
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
      {/* Page Header */}
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
            Doctors Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#6c757d' }}>
            Roster and department assignments for hospital physicians. Multiple doctors may belong to one department.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Add Doctor
        </Button>
      </div>

      {/* Table & Filters */}
      <DataTable
        columns={columns}
        data={doctors}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No doctors found matching criteria"
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
                placeholder="Search by doctor name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.875rem',
                  width: '100%',
                  maxWidth: '300px',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                aria-label="Filter by department"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
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
                <option value="">All Departments</option>
                {activeDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter doctors by status"
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
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </>
        }
      />

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Doctor"
        description="Invite a physician to the medical staff roster."
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
              Create Doctor
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
            label="Full Name"
            required
            placeholder="Dr. Gregory House"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <InputField
            label="Email Address"
            type="email"
            required
            placeholder="house@hospital.com"
            helperText="An activation link will be generated for initial password setup."
            error={createForm.formState.errors.email?.message}
            {...createForm.register('email')}
          />
          <SelectField
            label="Department"
            required
            placeholder="-- Select Department --"
            options={departmentOptions}
            error={createForm.formState.errors.department?.message}
            {...createForm.register('department')}
          />
          <InputField
            label="Specialization"
            placeholder="e.g. Diagnostic Medicine, Nephrology"
            error={createForm.formState.errors.specialization?.message}
            {...createForm.register('specialization')}
          />
          <InputField
            label="Phone"
            placeholder="+1 555-0199"
            error={createForm.formState.errors.phone?.message}
            {...createForm.register('phone')}
          />
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={!!editingDoctor}
        onClose={() => setEditingDoctor(null)}
        title={`Edit Doctor: ${editingDoctor?.name ?? ''}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingDoctor(null)}
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
            label="Full Name"
            required
            error={updateForm.formState.errors.name?.message}
            {...updateForm.register('name')}
          />
          <SelectField
            label="Department"
            options={departmentOptions}
            error={updateForm.formState.errors.department?.message}
            {...updateForm.register('department')}
          />
          <InputField
            label="Specialization"
            error={updateForm.formState.errors.specialization?.message}
            {...updateForm.register('specialization')}
          />
          <InputField
            label="Phone"
            error={updateForm.formState.errors.phone?.message}
            {...updateForm.register('phone')}
          />
        </form>
      </Modal>

      {/* Status Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!statusConfirmTarget}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={handleToggleStatusConfirm}
        title={statusConfirmTarget?.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
        message={
          statusConfirmTarget?.isActive
            ? `Are you sure you want to deactivate ${statusConfirmTarget?.name}? Their appointments and history will remain intact, but new appointments cannot be scheduled.`
            : `Are you sure you want to activate ${statusConfirmTarget?.name}?`
        }
        confirmLabel={statusConfirmTarget?.isActive ? 'Deactivate' : 'Activate'}
        variant={statusConfirmTarget?.isActive ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Activation Link Modal (upon create or resend invitation) */}
      <ActivationLinkModal
        creationResult={activationResult}
        onClose={() => setActivationResult(null)}
      />

      {/* Action Error Modal */}
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
