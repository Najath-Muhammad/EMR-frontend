import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { CancelAppointmentModal } from '../../components/appointments/CancelAppointmentModal';
import { AppointmentDetailModal } from '../../components/appointments/AppointmentDetailModal';
import { RescheduleModal } from '../../components/appointments/RescheduleModal';
import { EditAppointmentModal } from '../../components/appointments/EditAppointmentModal';
import { ConsultationNotesModal } from '../../components/appointments/ConsultationNotesModal';
import { SearchInput } from '../../components/ui/SearchInput';
import {
  useAppointments,
  useCancelAppointment,
  useMarkAppointmentArrived,
} from '../../hooks/useAppointments';
import { useActiveDepartments } from '../../hooks/useDepartments';
import { useDoctors } from '../../hooks/useDoctorSchedule';
import { useAuth } from '../../hooks/useAuth';
import { Appointment, AppointmentStatus } from '../../types/appointment.types';
import { ROLES } from '../../types/auth.types';
import { APP_ROUTES } from '../../constants/routes';

export function AppointmentsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === ROLES.DOCTOR;
  const isReceptionist = user?.role === ROLES.RECEPTIONIST;
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const canBook = isSuperAdmin || isReceptionist;

  const receptionistDeptId = useMemo(() => {
    if (!user || user.role !== ROLES.RECEPTIONIST) return null;
    if (typeof user.department === 'string') return user.department;
    if (user.department && typeof user.department === 'object') {
      return (
        (user.department as { id?: string; _id?: string }).id ||
        (user.department as { id?: string; _id?: string })._id ||
        null
      );
    }
    return null;
  }, [user]);

  // Filter & Query States
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState(receptionistDeptId || '');
  const [doctorId, setDoctorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [sortBy, setSortBy] = useState<'date' | 'startTime' | 'createdAt' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const handleSort = (field: 'date' | 'startTime' | 'createdAt' | 'status') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    if (!isReceptionist) {
      setDepartmentId('');
    }
    setDoctorId('');
    setStartDate('');
    setEndDate('');
    setStatus('');
    setSortBy('date');
    setSortOrder('asc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
      (!isReceptionist && departmentId) ||
      doctorId ||
      startDate ||
      endDate ||
      status ||
      sortBy !== 'date' ||
      sortOrder !== 'asc',
  );

  // Lock department for receptionist
  useEffect(() => {
    if (isReceptionist && receptionistDeptId && departmentId !== receptionistDeptId) {
      setDepartmentId(receptionistDeptId);
    }
  }, [isReceptionist, receptionistDeptId, departmentId]);

  // Modals
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [selectedDetailAppt, setSelectedDetailAppt] = useState<Appointment | null>(null);
  const [apptToReschedule, setApptToReschedule] = useState<Appointment | null>(null);
  const [apptToEdit, setApptToEdit] = useState<Appointment | null>(null);
  const [apptForConsultation, setApptForConsultation] = useState<Appointment | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  // Queries
  const { data: deptData } = useActiveDepartments();
  const departments = useMemo(() => {
    if (!deptData) return [];
    if (Array.isArray(deptData)) return deptData;
    if (Array.isArray((deptData as unknown as { data: unknown[] }).data)) {
      return (deptData as unknown as { data: unknown[] }).data as { id: string; name: string; code: string }[];
    }
    return [];
  }, [deptData]);

  const effectiveDepartmentId = isReceptionist ? (receptionistDeptId || undefined) : (departmentId || undefined);

  const { data: doctorData } = useDoctors({
    department: effectiveDepartmentId,
  });
  const doctors = useMemo(() => {
    if (!doctorData) return [];
    if (Array.isArray(doctorData)) return doctorData;
    if (Array.isArray(doctorData.data)) return doctorData.data;
    return [];
  }, [doctorData]);

  const { data: appointmentData, isLoading, refetch } = useAppointments({
    page,
    limit,
    search: search || undefined,
    departmentId: effectiveDepartmentId,
    doctorId: isDoctor ? undefined : doctorId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: (status as AppointmentStatus) || undefined,
    sortBy,
    sortOrder,
  });

  const appointmentsList = useMemo(() => {
    if (!appointmentData) return [];
    if (Array.isArray(appointmentData.data)) return appointmentData.data;
    if (
      appointmentData.data &&
      Array.isArray((appointmentData.data as unknown as { items: unknown[] }).items)
    ) {
      return (appointmentData.data as unknown as { items: unknown[] }).items as Appointment[];
    }
    return [];
  }, [appointmentData]);

  const total = appointmentData?.meta?.total ?? appointmentsList.length;
  const totalPages = appointmentData?.meta?.totalPages ?? (Math.ceil(total / limit) || 1);

  // Mutations
  const cancelMutation = useCancelAppointment();
  const markArrivedMutation = useMarkAppointmentArrived();

  const handleConfirmCancel = async (reason: string) => {
    if (!appointmentToCancel) return;

    try {
      await cancelMutation.mutateAsync({
        id: appointmentToCancel.id,
        payload: { reason },
      });
      setNotification(`Appointment for ${appointmentToCancel.patient.fullName} cancelled successfully.`);
      setAppointmentToCancel(null);
      void refetch();
    } catch {
      setNotification('Failed to cancel appointment. Please try again.');
    }
  };

  const handleMarkArrived = async (appt: Appointment) => {
    try {
      await markArrivedMutation.mutateAsync(appt.id);
      setNotification(`Patient ${appt.patient.fullName} marked as arrived.`);
      if (selectedDetailAppt?.id === appt.id) {
        setSelectedDetailAppt(null);
      }
      void refetch();
    } catch {
      setNotification('Failed to mark patient as arrived. Please try again.');
    }
  };

  const getStatusBadgeVariant = (st: AppointmentStatus) => {
    switch (st) {
      case 'CONFIRMED':
      case 'SCHEDULED':
        return 'info';
      case 'ARRIVED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      case 'NO_SHOW':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            {isDoctor ? 'My Appointments' : 'All Appointments'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '4px' }}>
            View and manage clinical appointments, arrival check-in, doctor consultations, and schedules.
          </p>
        </div>
        {canBook && (
          <Button
            variant="primary"
            onClick={() => navigate(APP_ROUTES.APPOINTMENTS_BOOKING)}
          >
            + Book Appointment
          </Button>
        )}
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            background: '#f1f3f5',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6c757d',
              fontWeight: 600,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search Bar Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search patient name, ID, or phone..."
              ariaLabel="Search appointments"
              style={{ maxWidth: '420px', flex: '1 1 300px' }}
            />
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            {isReceptionist ? (
              <div style={{ flex: '1 1 180px' }}>
                <label
                  style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
                >
                  Department
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '6px 10px',
                    background: '#f8f9fa',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#212529',
                  }}
                >
                  <span>
                    {departments.find((d) => d.id === receptionistDeptId)?.name || 'Your Department'}
                  </span>
                  <Badge variant="neutral">Your Department</Badge>
                </div>
              </div>
            ) : isSuperAdmin ? (
              <div style={{ flex: '1 1 180px' }}>
                <label
                  htmlFor="filterDept"
                  style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
                >
                  Department
                </label>
                <select
                  id="filterDept"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setDoctorId('');
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {!isDoctor && (
              <div style={{ flex: '1 1 180px' }}>
                <label
                  htmlFor="filterDoctor"
                  style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
                >
                  Doctor
                </label>
                <select
                  id="filterDoctor"
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value);
                    setPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #ced4da',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="">All Doctors</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ flex: '1 1 140px' }}>
              <label
                htmlFor="filterStartDate"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
              >
                From Date
              </label>
              <input
                id="filterStartDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: '1 1 140px' }}>
              <label
                htmlFor="filterEndDate"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
              >
                To Date
              </label>
              <input
                id="filterEndDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ flex: '1 1 160px' }}>
              <label
                htmlFor="filterStatus"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
              >
                Status
              </label>
              <select
                id="filterStatus"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as AppointmentStatus | '');
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              >
                <option value="">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="ARRIVED">ARRIVED (In Clinic)</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="NO_SHOW">NO_SHOW</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Appointments List / Table */}
      <Card>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
            <Spinner size="md" />
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Loading appointments…</p>
          </div>
        ) : appointmentsList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}>
              No Appointments Found
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              No bookings match the selected filters or there are no appointments recorded yet.
            </p>
            {canBook && (
              <Button
                variant="primary"
                size="sm"
                style={{ marginTop: '1rem' }}
                onClick={() => navigate(APP_ROUTES.APPOINTMENTS_BOOKING)}
              >
                Book First Appointment
              </Button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #dee2e6', color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('date')}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Date & Time</span>
                      <span style={{ fontSize: '0.7rem', color: sortBy === 'date' ? '#0a0a0a' : '#adb5bd' }}>
                        {sortBy === 'date' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                  {!isDoctor && <th style={{ padding: '0.75rem 1rem' }}>Doctor & Dept</th>}
                  <th style={{ padding: '0.75rem 1rem' }}>Purpose</th>
                  <th
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('status')}
                  >
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span>Status</span>
                      <span style={{ fontSize: '0.7rem', color: sortBy === 'status' ? '#0a0a0a' : '#adb5bd' }}>
                        {sortBy === 'status' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    </div>
                  </th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointmentsList.map((appt) => {
                  const isTerminal = appt.status === 'COMPLETED' || appt.status === 'CANCELLED';
                  const isScheduledOrConfirmed =
                    appt.status === 'SCHEDULED' || appt.status === 'CONFIRMED';
                  const isArrived = appt.status === 'ARRIVED';

                  return (
                    <tr
                      key={appt.id}
                      style={{
                        borderBottom: '1px solid #f1f3f5',
                        background: appt.status === 'CANCELLED' ? '#fdfdfd' : '#ffffff',
                        opacity: appt.status === 'CANCELLED' ? 0.75 : 1,
                      }}
                    >
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0a0a0a' }}>{appt.date}</div>
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#6c757d' }}>
                          {appt.startTime} - {appt.endTime}
                        </span>
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0a0a0a' }}>{appt.patient.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                          ID: {appt.patient.patientId || 'N/A'} · {appt.patient.phone}
                        </div>
                      </td>

                      {!isDoctor && (
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 500, color: '#0a0a0a' }}>{appt.doctor.name}</div>
                          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                            {appt.department.name} ({appt.department.code})
                          </span>
                        </td>
                      )}

                      <td style={{ padding: '0.75rem 1rem', maxWidth: '220px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appt.purpose}>
                          {appt.purpose}
                        </div>
                        {appt.cancellationReason && (
                          <div style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '2px' }}>
                            Reason: {appt.cancellationReason}
                          </div>
                        )}
                        {appt.arrivedAt && !isTerminal && (
                          <div style={{ fontSize: '0.75rem', color: '#856404', marginTop: '2px' }}>
                            Checked in at clinic
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant={getStatusBadgeVariant(appt.status)}>
                          {appt.status}
                        </Badge>
                      </td>

                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          {/* View details */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedDetailAppt(appt)}
                          >
                            Details
                          </Button>

                          {/* Receptionist / Admin: Mark as Arrived */}
                          {canBook && isScheduledOrConfirmed && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMarkArrived(appt)}
                              isLoading={markArrivedMutation.isPending}
                            >
                              Arrived
                            </Button>
                          )}

                          {/* Doctor / Admin: Consultation */}
                          {(isDoctor || isSuperAdmin) && (isArrived || isScheduledOrConfirmed) && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setApptForConsultation(appt)}
                            >
                              Consult
                            </Button>
                          )}

                          {/* Receptionist / Admin: Reschedule */}
                          {canBook && !isTerminal && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setApptToReschedule(appt)}
                            >
                              Reschedule
                            </Button>
                          )}

                          {/* Receptionist / Admin: Cancel */}
                          {canBook && !isTerminal && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setAppointmentToCancel(appt)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderTop: '1px solid #dee2e6',
                background: '#f8f9fa',
                fontSize: '0.8125rem',
                color: '#6c757d',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>
                  Showing {appointmentsList.length === 0 ? 0 : (page - 1) * limit + 1}–
                  {Math.min(page * limit, total)} of {total} appointments
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>Rows:</span>
                  <select
                    aria-label="Rows per page"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      fontSize: '0.8125rem',
                      background: '#ffffff',
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
                  Page {page} of {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        isOpen={Boolean(selectedDetailAppt)}
        appointment={selectedDetailAppt}
        currentUserRole={user?.role}
        currentUserId={user?.id}
        onClose={() => setSelectedDetailAppt(null)}
        onMarkArrived={(appt) => {
          void handleMarkArrived(appt);
        }}
        onComplete={(appt) => {
          setSelectedDetailAppt(null);
          setApptForConsultation(appt);
        }}
        onReschedule={(appt) => {
          setSelectedDetailAppt(null);
          setApptToReschedule(appt);
        }}
        onEdit={(appt) => {
          setSelectedDetailAppt(null);
          setApptToEdit(appt);
        }}
        onCancel={(appt) => {
          setSelectedDetailAppt(null);
          setAppointmentToCancel(appt);
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={Boolean(apptToReschedule)}
        appointment={apptToReschedule}
        onClose={() => setApptToReschedule(null)}
        onSuccess={(updated) => {
          setNotification(`Appointment for ${updated.patient.fullName} rescheduled to ${updated.date} at ${updated.startTime}.`);
          void refetch();
        }}
      />

      {/* Edit Purpose / Notes Modal */}
      <EditAppointmentModal
        isOpen={Boolean(apptToEdit)}
        appointment={apptToEdit}
        onClose={() => setApptToEdit(null)}
        onSuccess={(updated) => {
          setNotification(`Appointment for ${updated.patient.fullName} updated successfully.`);
          void refetch();
        }}
      />

      {/* Consultation Notes Modal */}
      <ConsultationNotesModal
        isOpen={Boolean(apptForConsultation)}
        appointment={apptForConsultation}
        onClose={() => setApptForConsultation(null)}
        onSuccess={(updated) => {
          setNotification(`Consultation for ${updated.patient.fullName} completed.`);
          void refetch();
        }}
      />

      {/* Cancel Appointment Modal */}
      <CancelAppointmentModal
        isOpen={Boolean(appointmentToCancel)}
        appointment={appointmentToCancel}
        isLoading={cancelMutation.isPending}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
