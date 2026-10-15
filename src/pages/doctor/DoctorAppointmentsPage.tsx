import { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { AppointmentDetailModal } from '../../components/appointments/AppointmentDetailModal';
import { ConsultationNotesModal } from '../../components/appointments/ConsultationNotesModal';
import { useAppointments } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { Appointment, AppointmentStatus } from '../../types/appointment.types';

export function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const { isConnected, isReconnecting, lastEvent, clearLastEvent } = useSocket();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0] as string, []);

  const [dateFilter, setDateFilter] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | ''>('');
  const [selectedDetailAppt, setSelectedDetailAppt] = useState<Appointment | null>(null);
  const [apptForConsultation, setApptForConsultation] = useState<Appointment | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Doctor only gets their own appointments from the backend (service enforces filter.doctor = requestingUser.userId)
  const { data: appointmentData, isLoading, refetch } = useAppointments({
    date: dateFilter || undefined,
    status: (statusFilter as AppointmentStatus) || undefined,
    limit: 50,
  });

  const appointments = useMemo(() => {
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

  // Priority queue: Patients marked as ARRIVED (Waiting in Clinic)
  const arrivedQueue = useMemo(() => {
    return appointments.filter((a) => a.status === 'ARRIVED');
  }, [appointments]);

  const completedCount = useMemo(() => {
    return appointments.filter((a) => a.status === 'COMPLETED').length;
  }, [appointments]);

  const scheduledCount = useMemo(() => {
    return appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'SCHEDULED').length;
  }, [appointments]);

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'SCHEDULED':
        return <Badge variant="info">Scheduled</Badge>;
      case 'ARRIVED':
        return <Badge variant="warning">In Waiting Room</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
              Physician Clinical Portal
            </h1>
            <Badge variant={isConnected ? 'success' : isReconnecting ? 'warning' : 'neutral'}>
              {isConnected ? '● Live' : isReconnecting ? '↻ Reconnecting...' : '○ Offline'}
            </Badge>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '4px' }}>
            Welcome, Dr. {user?.name}. Manage your patient appointments and clinical consultations.
          </p>
        </div>
      </div>

      {lastEvent && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            color: '#1e40af',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span style={{ fontWeight: 500 }}>{lastEvent.message}</span>
          </div>
          <button
            onClick={clearLastEvent}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {notification && (
        <div
          role="status"
          style={{
            padding: '0.75rem 1rem',
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            color: '#065f46',
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
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 600 }}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase' }}>
            Waiting Room (Arrived)
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#e03131', marginTop: '4px' }}>
            {arrivedQueue.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '2px' }}>
            Ready for consultation
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase' }}>
            Scheduled
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1971c2', marginTop: '4px' }}>
            {scheduledCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '2px' }}>
            Upcoming appointments
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', textTransform: 'uppercase' }}>
            Completed Consultations
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2b8a3e', marginTop: '4px' }}>
            {completedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6c757d', marginTop: '2px' }}>
            Finished visits
          </div>
        </Card>
      </div>

      {/* Waiting Room Queue */}
      {arrivedQueue.length > 0 && (
        <Card style={{ borderColor: '#ffe066', background: '#fff9db' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#856404', margin: 0 }}>
                🚨 Patients in Waiting Room ({arrivedQueue.length})
              </h2>
              <p style={{ fontSize: '0.8125rem', color: '#664d03', margin: '2px 0 0 0' }}>
                These patients have been checked in by reception and are waiting for their consultation.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {arrivedQueue.map((appt) => (
              <div
                key={appt.id}
                style={{
                  background: '#ffffff',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #ffd43b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0a0a0a' }}>
                      {appt.patient.fullName}
                    </span>
                    <Badge variant="warning">In Waiting Room</Badge>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#495057', marginTop: '4px' }}>
                    Slot: <strong>{appt.startTime} – {appt.endTime}</strong> · ID: {appt.patient.patientId || 'N/A'} · Phone: {appt.patient.phone}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '2px' }}>
                    Reason: {appt.purpose || 'General Consultation'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedDetailAppt(appt)}>
                    Patient Info
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setApptForConsultation(appt)}>
                    🩺 Start Consultation
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Date & Filter controls */}
      <Card>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label
              htmlFor="doctorDate"
              style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
            >
              Filter Date
            </label>
            <input
              id="doctorDate"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="doctorStatus"
              style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}
            >
              Filter Status
            </label>
            <select
              id="doctorStatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | '')}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
                background: '#ffffff',
              }}
            >
              <option value="">All Statuses</option>
              <option value="ARRIVED">In Waiting Room (ARRIVED)</option>
              <option value="CONFIRMED">Scheduled / Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {(dateFilter !== todayStr || statusFilter) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDateFilter(todayStr);
                setStatusFilter('');
              }}
            >
              Reset to Today
            </Button>
          )}
        </div>
      </Card>

      {/* Appointments Table */}
      <Card>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '1rem' }}>
          All Schedule & Consultations
        </h2>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
            <Spinner size="md" />
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>Loading appointments…</p>
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}>
              No Appointments Found
            </p>
            <p style={{ fontSize: '0.875rem' }}>No patient appointments for the selected date.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #dee2e6', color: '#6c757d', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Patient</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Purpose</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Clinical Notes</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr
                    key={appt.id}
                    style={{
                      borderBottom: '1px solid #f1f3f5',
                      background: appt.status === 'ARRIVED' ? '#fffdf0' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#0a0a0a' }}>
                        {appt.startTime} – {appt.endTime}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>{appt.date}</div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#0a0a0a' }}>{appt.patient.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        ID: {appt.patient.patientId || 'N/A'} · Phone: {appt.patient.phone}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem', maxWidth: '240px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={appt.purpose}>
                        {appt.purpose}
                      </div>
                    </td>

                    <td style={{ padding: '0.75rem 1rem' }}>{getStatusBadge(appt.status)}</td>

                    <td style={{ padding: '0.75rem 1rem', maxWidth: '200px' }}>
                      {appt.consultationNotes ? (
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: '#2b8a3e' }}>
                          ✔ {appt.consultationNotes}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#adb5bd' }}>None</span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedDetailAppt(appt)}
                        >
                          Details
                        </Button>
                        {(appt.status === 'ARRIVED' || appt.status === 'CONFIRMED' || appt.status === 'COMPLETED') && (
                          <Button
                            variant={appt.status === 'ARRIVED' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setApptForConsultation(appt)}
                          >
                            {appt.status === 'COMPLETED' ? 'Edit Notes' : 'Consult'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        onComplete={(appt) => {
          setSelectedDetailAppt(null);
          setApptForConsultation(appt);
        }}
      />

      {/* Consultation Modal */}
      <ConsultationNotesModal
        isOpen={Boolean(apptForConsultation)}
        appointment={apptForConsultation}
        onClose={() => setApptForConsultation(null)}
        onSuccess={(updated) => {
          setNotification(`Consultation for ${updated.patient.fullName} saved successfully.`);
          void refetch();
        }}
      />
    </div>
  );
}
