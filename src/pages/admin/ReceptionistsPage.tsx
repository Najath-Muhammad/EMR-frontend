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

const createReceptionistSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  department: z.string().min(1, 'Please select a department'),
  phone: z.string().max(20).optional(),
});

type CreateReceptionistFormValues = z.infer<typeof createReceptionistSchema>;

const updateReceptionistSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  department: z.string().min(1, 'Please select a department').optional(),
  phone: z.string().max(20).optional(),
});

type UpdateReceptionistFormValues = z.infer<typeof updateReceptionistSchema>;

export function ReceptionistsPage() {
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
  const [editingReceptionist, setEditingReceptionist] = useState<StaffMember | null>(null);
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<StaffMember | null>(null);
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
    role: ROLES.RECEPTIONIST,
    search: search || undefined,
    department: departmentFilter || undefined,
    isActive: isActiveParam,
  });

  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const toggleStatusMutation = useToggleStaffStatus();
  const resendActivationMutation = useResendActivation();

  // Forms
  const createForm = useForm<CreateReceptionistFormValues>({
    resolver: zodResolver(createReceptionistSchema),
    defaultValues: { name: '', email: '', department: '', phone: '' },
  });

  const updateForm = useForm<UpdateReceptionistFormValues>({
    resolver: zodResolver(updateReceptionistSchema),
    defaultValues: { name: '', department: '', phone: '' },
  });

  const selectedDepartmentId = createForm.watch('department');
  const selectedDeptObject = activeDepartments.find((d) => d.id === selectedDepartmentId);
  const hasActiveReceptionistInSelectedDept = selectedDeptObject?.hasActiveReceptionist;

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
    createForm.reset({ name: '', email: '', department: '', phone: '' });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (receptionist: StaffMember) => {
    setErrorMessage(null);
    setEditingReceptionist(receptionist);
    updateForm.reset({
      name: receptionist.name,
      department: receptionist.department?.id ?? '',
      phone: receptionist.phone ?? '',
    });
  };

  const handleCreateSubmit = (values: CreateReceptionistFormValues) => {
    setErrorMessage(null);
    createMutation.mutate(
      {
        ...values,
        role: 'RECEPTIONIST',
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
            'Failed to create receptionist account';
          setErrorMessage(message);
        },
      },
    );
  };

  const handleUpdateSubmit = (values: UpdateReceptionistFormValues) => {
    if (!editingReceptionist) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id: editingReceptionist.id, input: values },
      {
        onSuccess: () => {
          setEditingReceptionist(null);
        },
        onError: (err: unknown) => {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Failed to update receptionist details';
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
            'Failed to change receptionist status';
          alert(message);
          setStatusConfirmTarget(null);
        },
      },
    );
  };

  const handleResendActivation = (rec: StaffMember) => {
    resendActivationMutation.mutate(rec.id, {
      onSuccess: (res) => {
        setActivationResult(res.data);
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to resend activation invitation';
        alert(message);
      },
    });
  };

  const receptionists = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.totalPages ?? 1;

  const departmentOptions = activeDepartments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.code})${d.hasActiveReceptionist ? ' [Active Receptionist Assigned]' : ' [Vacant]'}`,
  }));

  const columns: Column<StaffMember>[] = [
    {
      id: 'name',
      header: 'Receptionist Name',
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
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
            {row.isActive && (
              <Badge variant="success">Active Receptionist</Badge>
            )}
          </div>
        ) : (
          <span style={{ color: '#adb5bd', fontSize: '0.8125rem' }}>Unassigned</span>
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
              title="Resend activation invitation"
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
      {/* Notice Banner */}
      <div
        style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderLeft: '4px solid #0a0a0a',
          padding: '0.875rem 1.25rem',
          borderRadius: '4px',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#212529', lineHeight: 1.5 }}>
          <strong>Hospital Invariant Rule:</strong> Each department may have at most{' '}
          <strong>one active receptionist</strong>. When a receptionist is deactivated, a replacement receptionist may be assigned to the department while preserving appointment history.
        </p>
      </div>

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
            Receptionists Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#6c757d' }}>
            Manage departmental front-desk receptionists responsible for patient registration and booking.
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate}>
          + Add Receptionist
        </Button>
      </div>

      {/* Table & Filters */}
      <DataTable
        columns={columns}
        data={receptionists}
        keyExtractor={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No receptionists found matching criteria"
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
                placeholder="Search by receptionist name or email..."
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
                aria-label="Filter receptionists by status"
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

      {/* Add Receptionist Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Receptionist"
        description="Invite a receptionist to manage front-desk bookings for a department."
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
              Create Receptionist
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

        {hasActiveReceptionistInSelectedDept && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: '6px',
              background: '#fff3cd',
              border: '1px solid #ffecb5',
              color: '#664d03',
              fontSize: '0.8125rem',
              lineHeight: 1.4,
            }}
          >
            ⚠️ <strong>Department Limit Notice:</strong> The selected department (
            {selectedDeptObject?.name}) already has an active receptionist assigned. Adding a new active receptionist to this department will be rejected by the server unless the existing receptionist is deactivated first.
          </div>
        )}

        <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
          <InputField
            label="Full Name"
            required
            placeholder="Sarah Jenkins"
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <InputField
            label="Email Address"
            type="email"
            required
            placeholder="sarah@hospital.com"
            helperText="An activation invitation will be generated."
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
            label="Phone"
            placeholder="+1 555-0144"
            error={createForm.formState.errors.phone?.message}
            {...createForm.register('phone')}
          />
        </form>
      </Modal>

      {/* Edit Receptionist Modal */}
      <Modal
        isOpen={!!editingReceptionist}
        onClose={() => setEditingReceptionist(null)}
        title={`Edit Receptionist: ${editingReceptionist?.name ?? ''}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditingReceptionist(null)}
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
        title={statusConfirmTarget?.isActive ? 'Deactivate Receptionist' : 'Activate Receptionist'}
        message={
          statusConfirmTarget?.isActive
            ? `Are you sure you want to deactivate ${statusConfirmTarget?.name}? Once deactivated, another receptionist may be assigned to ${statusConfirmTarget?.department?.name ?? 'the department'}. All historical appointments booked by this receptionist are preserved.`
            : `Are you sure you want to activate ${statusConfirmTarget?.name}? Note that if another receptionist is already active in ${statusConfirmTarget?.department?.name ?? 'their department'}, this action will be rejected.`
        }
        confirmLabel={statusConfirmTarget?.isActive ? 'Deactivate' : 'Activate'}
        variant={statusConfirmTarget?.isActive ? 'danger' : 'primary'}
        isLoading={toggleStatusMutation.isPending}
      />

      {/* Activation Link Modal */}
      <ActivationLinkModal
        creationResult={activationResult}
        onClose={() => setActivationResult(null)}
      />
    </div>
  );
}
