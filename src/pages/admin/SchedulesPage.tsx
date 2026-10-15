import { useState, useEffect, useMemo } from 'react';
import {
  useDoctors,
  useDoctorSchedule,
  useSaveDoctorSchedule,
  useToggleDoctorScheduleStatus,
} from '../../hooks/useDoctorSchedule';
import { WeeklyScheduleEditor } from '../../components/schedule/WeeklyScheduleEditor';
import { SlotPreviewGrid } from '../../components/schedule/SlotPreviewGrid';
import { DoctorScheduleFilterBar } from '../../components/schedule/DoctorScheduleFilterBar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { SaveScheduleInput, DaySchedule } from '../../types/schedule.types';

const DEFAULT_WORKING_DAYS: DaySchedule[] = [
  {
    dayOfWeek: 1,
    dayName: 'MONDAY',
    isEnabled: true,
    sessions: [{ startTime: '09:00', endTime: '17:00', label: 'Regular Shift' }],
    breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch Break' }],
  },
  {
    dayOfWeek: 2,
    dayName: 'TUESDAY',
    isEnabled: true,
    sessions: [{ startTime: '09:00', endTime: '17:00', label: 'Regular Shift' }],
    breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch Break' }],
  },
  {
    dayOfWeek: 3,
    dayName: 'WEDNESDAY',
    isEnabled: true,
    sessions: [{ startTime: '09:00', endTime: '17:00', label: 'Regular Shift' }],
    breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch Break' }],
  },
  {
    dayOfWeek: 4,
    dayName: 'THURSDAY',
    isEnabled: true,
    sessions: [{ startTime: '09:00', endTime: '17:00', label: 'Regular Shift' }],
    breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch Break' }],
  },
  {
    dayOfWeek: 5,
    dayName: 'FRIDAY',
    isEnabled: true,
    sessions: [{ startTime: '09:00', endTime: '17:00', label: 'Regular Shift' }],
    breaks: [{ startTime: '12:00', endTime: '13:00', label: 'Lunch Break' }],
  },
  {
    dayOfWeek: 6,
    dayName: 'SATURDAY',
    isEnabled: false,
    sessions: [],
    breaks: [],
  },
  {
    dayOfWeek: 0,
    dayName: 'SUNDAY',
    isEnabled: false,
    sessions: [],
    breaks: [],
  },
];

const DEFAULT_SCHEDULE_INPUT: SaveScheduleInput = {
  slotDuration: 15,
  isActive: true,
  workingDays: DEFAULT_WORKING_DAYS,
};

export function SchedulesPage() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [draftSchedule, setDraftSchedule] = useState<SaveScheduleInput>(DEFAULT_SCHEDULE_INPUT);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeDayOfWeek, setActiveDayOfWeek] = useState<number>(1); // Default Monday

  // Conflict modal state
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictMessage, setConflictMessage] = useState<string>('');

  // Queries & Mutations
  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors();
  const doctorsList = useMemo(() => {
    if (!doctorsData) return [];
    if (Array.isArray(doctorsData.data)) return doctorsData.data;
    if (doctorsData.data && Array.isArray((doctorsData.data as unknown as { items: unknown[] }).items)) {
      return (doctorsData.data as unknown as { items: unknown[] }).items as typeof doctorsData.data;
    }
    return [];
  }, [doctorsData]);

  const effectiveDoctorId = selectedDoctorId || (doctorsList[0]?.id ?? '');

  const selectedDoctor = useMemo(
    () => doctorsList.find((d) => d.id === effectiveDoctorId),
    [doctorsList, effectiveDoctorId],
  );

  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    isError: isScheduleError,
  } = useDoctorSchedule(effectiveDoctorId);

  const saveMutation = useSaveDoctorSchedule();
  const toggleStatusMutation = useToggleDoctorScheduleStatus();

  // Load existing schedule or set default template
  useEffect(() => {
    if (scheduleData?.data) {
      setDraftSchedule({
        slotDuration: scheduleData.data.slotDuration ?? 15,
        isActive: scheduleData.data.isActive ?? true,
        workingDays: scheduleData.data.workingDays ?? DEFAULT_WORKING_DAYS,
      });
      setIsDirty(false);
    } else if (isScheduleError) {
      // 404 means no schedule configured yet - reset to default
      setDraftSchedule(DEFAULT_SCHEDULE_INPUT);
      setIsDirty(false);
    }
  }, [scheduleData, isScheduleError, effectiveDoctorId]);

  const handleScheduleChange = (updated: SaveScheduleInput) => {
    setDraftSchedule(updated);
    setIsDirty(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSave = (force = false) => {
    if (!effectiveDoctorId) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    saveMutation.mutate(
      {
        doctorId: effectiveDoctorId,
        input: draftSchedule,
        force,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Doctor schedule saved and active slots regenerated successfully.');
          setIsDirty(false);
          setConflictModalOpen(false);
        },
        onError: (err: unknown) => {
          const apiErr = err as {
            response?: {
              status?: number;
              data?: {
                message?: string;
              };
            };
          };

          if (apiErr.response?.status === 409) {
            setConflictMessage(
              apiErr.response?.data?.message ??
                'Schedule changes conflict with existing future appointments. Overriding will preserve appointments but slots will change.',
            );
            setConflictModalOpen(true);
          } else {
            setErrorMessage(
              apiErr.response?.data?.message ?? 'Failed to save doctor schedule. Please check all fields.',
            );
          }
        },
      },
    );
  };

  const handleToggleScheduleActive = () => {
    if (!effectiveDoctorId) return;
    const newStatus = !draftSchedule.isActive;
    toggleStatusMutation.mutate(
      { doctorId: effectiveDoctorId, isActive: newStatus },
      {
        onSuccess: () => {
          setDraftSchedule((prev) => ({ ...prev, isActive: newStatus }));
          setSuccessMessage(`Schedule is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}.`);
        },
        onError: (err: unknown) => {
          const apiErr = err as { response?: { data?: { message?: string } } };
          setErrorMessage(apiErr.response?.data?.message ?? 'Failed to update schedule status.');
        },
      },
    );
  };

  if (isLoadingDoctors) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '0.75rem' }}>
        <Spinner size="md" />
        <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Loading doctors and schedules…</span>
      </div>
    );
  }

  if (doctorsList.length === 0) {
    return (
      <Card style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👨‍⚕️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.5rem' }}>
          No Doctors Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Schedules can only be created for registered doctors. Please add doctor accounts in Staff Management first.
        </p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner / Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Doctor Schedules &amp; Dynamic Slot Engine
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#6c757d', margin: '4px 0 0' }}>
            Configure working days, multiple sessions, breaks, and preview appointment slots generated in real time.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (scheduleData?.data) {
                setDraftSchedule({
                  slotDuration: scheduleData.data.slotDuration ?? 15,
                  isActive: scheduleData.data.isActive ?? true,
                  workingDays: scheduleData.data.workingDays ?? DEFAULT_WORKING_DAYS,
                });
                setIsDirty(false);
              } else {
                setDraftSchedule(DEFAULT_SCHEDULE_INPUT);
                setIsDirty(false);
              }
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            disabled={!isDirty || saveMutation.isPending}
          >
            Reset
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => handleSave(false)}
            isLoading={saveMutation.isPending}
            disabled={!effectiveDoctorId}
          >
            {isDirty ? '● Save Changes' : 'Save Schedule'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            background: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '6px',
            color: '#065f46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✔ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Doctor Selector Header Card with Precision Filter Bar */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <DoctorScheduleFilterBar
            doctors={doctorsList}
            selectedDoctorId={effectiveDoctorId}
            onSelectDoctor={(newDoctorId) => {
              setSelectedDoctorId(newDoctorId);
              setIsDirty(false);
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            isDirty={isDirty}
          />

          {selectedDoctor && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #f1f3f5',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#495057' }}>
                  Current Doctor Status:
                </span>
                <Badge variant={selectedDoctor.hasSchedule ? 'success' : 'warning'}>
                  {selectedDoctor.hasSchedule ? 'Schedule Configured' : 'New / Unconfigured'}
                </Badge>

                <Badge variant={draftSchedule.isActive ? 'success' : 'neutral'}>
                  {draftSchedule.isActive ? 'Schedule Active' : 'Schedule Inactive'}
                </Badge>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleToggleScheduleActive}
                isLoading={toggleStatusMutation.isPending}
                style={{ fontSize: '0.75rem', border: '1px solid #ced4da' }}
              >
                {draftSchedule.isActive ? 'Pause Schedule' : 'Activate Schedule'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Two-Column Work Area */}
      {isLoadingSchedule ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '0.75rem' }}>
          <Spinner size="sm" />
          <span style={{ color: '#6c757d', fontSize: '0.875rem' }}>Fetching doctor schedule…</span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(460px, 1.35fr) minmax(360px, 1fr)',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Weekly Schedule Editor */}
          <div>
            <WeeklyScheduleEditor
              value={draftSchedule}
              onChange={handleScheduleChange}
              disabled={saveMutation.isPending}
              selectedDayOfWeek={activeDayOfWeek}
              onSelectDayOfWeek={setActiveDayOfWeek}
            />
          </div>

          {/* Right Column: Live Slot Preview */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <SlotPreviewGrid
              schedule={draftSchedule}
              doctorName={selectedDoctor?.name}
              activeDayOfWeek={activeDayOfWeek}
            />
          </div>
        </div>
      )}

      {/* Appointment Conflict Resolution Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="⚠️ Existing Appointments Conflict"
        maxWidth="540px"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConflictModalOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel &amp; Review
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => handleSave(true)}
              isLoading={saveMutation.isPending}
            >
              Force Override &amp; Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#495057', lineHeight: 1.5 }}>
            Saving this schedule will cause conflicts with existing booked appointments:
          </p>
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#fff5f5',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '0.8125rem',
              color: '#842029',
              maxHeight: '160px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {conflictMessage}
          </div>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#6c757d' }}>
            To save anyway and preserve existing appointments while updating availability for future bookings, click <strong>Force Override &amp; Save</strong>.
          </p>
        </div>
      </Modal>
    </div>
  );
}
