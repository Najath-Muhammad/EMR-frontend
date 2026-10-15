import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { PatientSearchInput } from '../../components/patients/PatientSearchInput';
import { RegisterPatientModal } from '../../components/patients/RegisterPatientModal';
import { SlotGrid } from '../../components/appointments/SlotGrid';
import { BookingConfirmationModal } from '../../components/appointments/BookingConfirmationModal';
import { useActiveDepartments } from '../../hooks/useDepartments';
import { useDoctors, useDoctorSlots } from '../../hooks/useDoctorSchedule';
import { usePatients } from '../../hooks/usePatients';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../types/auth.types';
import { Patient } from '../../types/patient.types';
import { TimeSlot } from '../../types/slot.types';
import { APP_ROUTES } from '../../constants/routes';
import { AxiosError } from 'axios';

export function BookAppointmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReceptionist = user?.role === ROLES.RECEPTIONIST;

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

  // Step 1: Patient Selection State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Step 2: Department & Doctor State
  const [departmentId, setDepartmentId] = useState(receptionistDeptId || '');
  const [doctorId, setDoctorId] = useState('');

  // Lock department for receptionist
  useEffect(() => {
    if (isReceptionist && receptionistDeptId && departmentId !== receptionistDeptId) {
      setDepartmentId(receptionistDeptId);
    }
  }, [isReceptionist, receptionistDeptId, departmentId]);

  // Step 3: Date & Time Slot State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0] as string, []);
  const [date, setDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Step 4: Purpose & Notes State
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // UI State: Confirmation modal, conflict message, errors
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: deptData, isLoading: isLoadingDepts } = useActiveDepartments();
  const departments = useMemo(() => {
    if (!deptData) return [];
    if (Array.isArray(deptData)) return deptData;
    if (Array.isArray((deptData as unknown as { data: unknown[] }).data)) {
      return (deptData as unknown as { data: unknown[] }).data as { id: string; name: string; code: string }[];
    }
    return [];
  }, [deptData]);

  const { data: doctorData, isLoading: isLoadingDoctors } = useDoctors({
    department: departmentId || undefined,
  });
  const doctors = useMemo(() => {
    if (!doctorData) return [];
    if (Array.isArray(doctorData)) return doctorData;
    if (Array.isArray(doctorData.data)) return doctorData.data;
    return [];
  }, [doctorData]);

  const {
    data: patientSearchData,
    isLoading: isSearchingPatients,
  } = usePatients({
    search: patientSearch || undefined,
    limit: 5,
  });

  const searchResults = useMemo(() => {
    if (!patientSearch.trim() || !patientSearchData) return [];
    if (Array.isArray(patientSearchData.data)) return patientSearchData.data;
    if (
      patientSearchData.data &&
      Array.isArray((patientSearchData.data as unknown as { items: unknown[] }).items)
    ) {
      return (patientSearchData.data as unknown as { items: unknown[] }).items as Patient[];
    }
    return [];
  }, [patientSearch, patientSearchData]);

  const {
    data: slotsData,
    isLoading: isLoadingSlots,
    refetch: refetchSlots,
  } = useDoctorSlots(doctorId || undefined, date || undefined);

  const availableSlots = useMemo(() => slotsData?.data?.slots ?? [], [slotsData]);

  // Mutation
  const createAppointmentMutation = useCreateAppointment();

  // Reset doctor & slot if department changes
  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    setDoctorId('');
    setSelectedSlot(null);
    setConflictError(null);
  };

  // Reset slot if doctor or date changes
  const handleDoctorChange = (newDoctorId: string) => {
    setDoctorId(newDoctorId);
    setSelectedSlot(null);
    setConflictError(null);
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setSelectedSlot(null);
    setConflictError(null);
  };

  // Validation before opening confirmation modal
  const handleReviewBooking = () => {
    const errors: Record<string, string> = {};
    if (!selectedPatient) errors['patient'] = 'Please select or register a patient';
    if (!departmentId) errors['department'] = 'Please select a department';
    if (!doctorId) errors['doctor'] = 'Please select a doctor';
    if (!date) errors['date'] = 'Please select an appointment date';
    if (!selectedSlot) errors['slot'] = 'Please select an available time slot';
    if (!purpose.trim()) {
      errors['purpose'] = 'Please provide an appointment purpose (min 2 characters)';
    } else if (purpose.trim().length < 2) {
      errors['purpose'] = 'Purpose must be at least 2 characters';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length === 0) {
      setConflictError(null);
      setIsConfirmModalOpen(true);
    }
  };

  // Final booking submission
  const handleConfirmBooking = async () => {
    if (!selectedPatient || !selectedSlot) return;

    try {
      const res = await createAppointmentMutation.mutateAsync({
        patientId: selectedPatient.id,
        doctorId,
        departmentId,
        date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        purpose: purpose.trim(),
        notes: notes.trim() || undefined,
      });

      setIsConfirmModalOpen(false);
      setSuccessInfo({
        id: res.data.id,
        message: 'Appointment booked successfully!',
      });
      setSelectedSlot(null);
      setPurpose('');
      setNotes('');
    } catch (err: unknown) {
      setIsConfirmModalOpen(false);
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr.response?.status === 409) {
        setConflictError(
          axiosErr.response.data?.message ||
            'This time slot has just been booked by another user. Please select another slot.',
        );
        setSelectedSlot(null);
        void refetchSlots();
      } else {
        setConflictError(
          axiosErr.response?.data?.message ||
            'An unexpected error occurred while booking. Please try again.',
        );
      }
    }
  };

  // Find department and doctor names for summary
  const selectedDeptObj = departments.find((d) => d.id === departmentId);
  const selectedDocObj = doctors.find((doc) => doc.id === doctorId);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Title & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Book Appointment
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginTop: '4px' }}>
            Schedule patient appointments with live doctor slot validation & double-booking protection.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate(APP_ROUTES.ALL_APPOINTMENTS)}
        >
          View All Appointments
        </Button>
      </div>

      {/* Success Banner */}
      {successInfo && (
        <div
          role="status"
          style={{
            padding: '1rem 1.25rem',
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            color: '#065f46',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong style={{ display: 'block', fontSize: '0.9375rem' }}>✓ {successInfo.message}</strong>
            <span style={{ fontSize: '0.8125rem' }}>Appointment Ref: {successInfo.id}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSuccessInfo(null);
                setSelectedPatient(null);
              }}
            >
              Book Another
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(APP_ROUTES.ALL_APPOINTMENTS)}
            >
              Go to Appointments
            </Button>
          </div>
        </div>
      )}

      {/* 409 Conflict / Error Banner */}
      {conflictError && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.9375rem' }}>
              Booking Slot Conflict
            </strong>
            <span style={{ fontSize: '0.875rem' }}>{conflictError}</span>
          </div>
        </div>
      )}

      {/* Step 1: Patient Selection */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              1. Patient Identification
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '2px' }}>
              Search an existing patient record or register a new patient.
            </p>
          </div>
          {selectedPatient && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedPatient(null);
                setPatientSearch('');
              }}
            >
              Change Patient
            </Button>
          )}
        </div>

        {selectedPatient ? (
          <div
            style={{
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0a0a' }}>
                  {selectedPatient.fullName}
                </span>
                <Badge variant="neutral">{selectedPatient.patientId}</Badge>
                <Badge variant="neutral">{selectedPatient.gender}</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#495057', marginTop: '4px' }}>
                Phone: {selectedPatient.phone} &nbsp;·&nbsp; DOB: {selectedPatient.dateOfBirth}
              </p>
            </div>
            <Badge variant="success">✓ Patient Selected</Badge>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <PatientSearchInput
                  value={patientSearch}
                  onChange={setPatientSearch}
                  placeholder="Search by Patient ID, name, or phone number…"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsRegisterModalOpen(true)}
              >
                + Register New Patient
              </Button>
            </div>

            {validationErrors['patient'] && (
              <span style={{ fontSize: '0.8125rem', color: '#dc3545', fontWeight: 500 }}>
                {validationErrors['patient']}
              </span>
            )}

            {/* Quick search results */}
            {isSearchingPatients && (
              <div style={{ padding: '0.5rem', color: '#6c757d', fontSize: '0.8125rem' }}>
                <Spinner size="sm" /> Searching patients…
              </div>
            )}

            {!isSearchingPatients && patientSearch && searchResults.length === 0 && (
              <div
                style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '0.8125rem',
                  color: '#6c757d',
                }}
              >
                No matching patients found.{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0a0a0a',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Register a new patient
                </button>
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{ border: '1px solid #e9ecef', borderRadius: '6px', overflow: 'hidden' }}>
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f3f5',
                      background: '#ffffff',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0a0a0a' }}>
                        {patient.fullName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '0.5rem' }}>
                        ({patient.patientId}) · {patient.phone} · DOB: {patient.dateOfBirth}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setPatientSearch('');
                      }}
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Step 2: Department & Doctor Selection */}
      <Card>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '1rem' }}>
          2. Department & Doctor
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div>
            <label
              htmlFor="deptSelect"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Department *
            </label>
            {isReceptionist ? (
              <div
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  background: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0a0a0a' }}>
                  {departments.find((d) => d.id === (receptionistDeptId || departmentId))?.name || 'Assigned Department'}
                  {departments.find((d) => d.id === (receptionistDeptId || departmentId))?.code
                    ? ` (${departments.find((d) => d.id === (receptionistDeptId || departmentId))?.code})`
                    : ''}
                </span>
                <Badge variant="info">Your Department</Badge>
              </div>
            ) : (
              <select
                id="deptSelect"
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={isLoadingDepts}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #ced4da',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: '#ffffff',
                }}
              >
                <option value="">-- Choose a Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            )}
            {validationErrors['department'] && (
              <span style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '2px', display: 'block' }}>
                {validationErrors['department']}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="doctorSelect"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Doctor *
            </label>
            <select
              id="doctorSelect"
              value={doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              disabled={!departmentId || isLoadingDoctors}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
                background: '#ffffff',
              }}
            >
              <option value="">
                {!departmentId
                  ? '-- Select Department First --'
                  : doctors.length === 0
                  ? '-- No Doctors in this Department --'
                  : '-- Choose a Doctor --'}
              </option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
                </option>
              ))}
            </select>
            {validationErrors['doctor'] && (
              <span style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '2px', display: 'block' }}>
                {validationErrors['doctor']}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Step 3: Date & Dynamic Slots */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0a0a0a', margin: 0 }}>
              3. Date & Available Slots
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '2px' }}>
              Dynamic slots automatically account for sessions, breaks, past times, and live bookings.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="appointmentDate" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a' }}>
              Date:
            </label>
            <input
              id="appointmentDate"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {validationErrors['date'] && (
          <span style={{ fontSize: '0.75rem', color: '#dc3545', display: 'block', marginBottom: '0.5rem' }}>
            {validationErrors['date']}
          </span>
        )}

        {!doctorId ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px dashed #ced4da',
              color: '#6c757d',
              fontSize: '0.875rem',
            }}
          >
            Please select a department and doctor above to view dynamic time slots.
          </div>
        ) : (
          <SlotGrid
            slots={availableSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setConflictError(null);
            }}
            isLoading={isLoadingSlots}
          />
        )}

        {validationErrors['slot'] && (
          <span style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '0.75rem', display: 'block' }}>
            {validationErrors['slot']}
          </span>
        )}
      </Card>

      {/* Step 4: Purpose & Notes */}
      <Card>
        <h2 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '1rem' }}>
          4. Appointment Purpose & Notes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              htmlFor="appointmentPurpose"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Appointment Purpose *
            </label>
            <input
              id="appointmentPurpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Annual routine physical exam, Follow-up consultation, ECG checkup"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            {validationErrors['purpose'] && (
              <span style={{ fontSize: '0.75rem', color: '#dc3545', marginTop: '2px', display: 'block' }}>
                {validationErrors['purpose']}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="appointmentNotes"
              style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}
            >
              Permitted Notes (Optional)
            </label>
            <textarea
              id="appointmentNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any pertinent notes for the physician or clinical staff..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Submission Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedPatient(null);
            setSelectedSlot(null);
            setPurpose('');
            setNotes('');
          }}
        >
          Reset Form
        </Button>
        <Button
          variant="primary"
          onClick={handleReviewBooking}
          disabled={!selectedPatient || !selectedSlot}
        >
          Review & Confirm Booking →
        </Button>
      </div>

      {/* Confirmation Modal */}
      {selectedPatient && selectedSlot && (
        <BookingConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmBooking}
          isLoading={createAppointmentMutation.isPending}
          bookingDetails={{
            patientName: selectedPatient.fullName,
            patientId: selectedPatient.patientId,
            patientPhone: selectedPatient.phone,
            departmentName: selectedDeptObj?.name || 'Department',
            doctorName: selectedDocObj?.name || 'Doctor',
            doctorSpecialization: selectedDocObj?.specialization,
            date,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            purpose,
            notes,
          }}
        />
      )}

      {/* Register Patient Modal Shortcut */}
      <RegisterPatientModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(newPatient) => {
          setSelectedPatient(newPatient);
          setIsRegisterModalOpen(false);
        }}
        onSelectExisting={(existingPatient) => {
          setSelectedPatient(existingPatient);
          setIsRegisterModalOpen(false);
        }}
      />
    </div>
  );
}
