import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { CancelAppointmentModal } from '../../components/appointments/CancelAppointmentModal';
import { useAppointments, useCancelAppointment } from '../../hooks/useAppointments';
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
  const canBook = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.RECEPTIONIST;

  // Filter States
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<AppointmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals & Notices
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
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

  const { data: doctorData } = useDoctors({
    department: departmentId || undefined,
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
    departmentId: departmentId || undefined,
    doctorId: isDoctor ? undefined : doctorId || undefined,
    date: date || undefined,
    status: (status as AppointmentStatus) || undefined,
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

  // Cancellation mutation
  const cancelMutation = useCancelAppointment();

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

  const getStatusBadgeVariant = (st: AppointmentStatus) => {
    switch (st) {
      case 'CONFIRMED':
      case 'SCHEDULED':
        return 'success';
      case 'COMPLETED':
        return 'neutral';
      case 'CANCELLED':
        return 'danger';
      case 'NO_SHOW':
        return 'warning';
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
            View and manage clinical appointments, schedules, and active bookings.
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          {!isDoctor && (
            <div style={{ flex: '1 1 200px' }}>
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
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isDoctor && (
            <div style={{ flex: '1 1 200px' }}>
              <label
                htmlFor="filterDoc"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
              >
                Doctor
              </label>
              <select
                id="filterDoc"
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

          <div style={{ flex: '1 1 150px' }}>
            <label
              htmlFor="filterDate"
              style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
            >
              Date
            </label>
            <input
              id="filterDate"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
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

          <div style={{ flex: '1 1 150px' }}>
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
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="NO_SHOW">NO_SHOW</option>
            </select>
          </div>

          {(departmentId || doctorId || date || status) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDepartmentId('');
                setDoctorId('');
                setDate('');
                setStatus('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
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
                  <th style={{ padding: '0.75rem 1rem' }}>Date & Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                  {!isDoctor && <th style={{ padding: '0.75rem 1rem' }}>Doctor & Dept</th>}
                  <th style={{ padding: '0.75rem 1rem' }}>Purpose</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  {canBook && <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {appointmentsList.map((appt) => {
                  const canCancel =
                    canBook &&
                    appt.status !== 'CANCELLED' &&
                    appt.status !== 'COMPLETED';

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
                          ID: {appt.patient.patientId} · {appt.patient.phone}
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
                      </td>

                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Badge variant={getStatusBadgeVariant(appt.status)}>
                          {appt.status}
                        </Badge>
                      </td>

                      {canBook && (
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                          {canCancel ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setAppointmentToCancel(appt)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#adb5bd' }}>—</span>
                          )}
                        </td>
                      )}
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
                padding: '1rem',
                borderTop: '1px solid #dee2e6',
                fontSize: '0.8125rem',
                color: '#6c757d',
              }}
            >
              <span>
                Total: <strong>{total}</strong> appointments (Page {page} of {totalPages})
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Cancellation Modal */}
      <CancelAppointmentModal
        isOpen={Boolean(appointmentToCancel)}
        onClose={() => setAppointmentToCancel(null)}
        onConfirm={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
        appointment={appointmentToCancel}
      />
    </div>
  );
}
