import { useState, useMemo } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useActiveDepartments } from '../../hooks/useDepartments';
import { DoctorWithSchedule } from '../../types/schedule.types';

export type DoctorSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'dept-asc'
  | 'spec-asc'
  | 'needs-schedule'
  | 'active-schedule';

export type ScheduleStatusFilter = 'ALL' | 'WITH_SCHEDULE' | 'NO_SCHEDULE';

export interface DoctorScheduleFilterBarProps {
  doctors: DoctorWithSchedule[];
  selectedDoctorId: string;
  onSelectDoctor: (doctorId: string) => void;
  isDirty?: boolean;
}

export function DoctorScheduleFilterBar({
  doctors,
  selectedDoctorId,
  onSelectDoctor,
  isDirty = false,
}: DoctorScheduleFilterBarProps) {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<DoctorSortOption>('name-asc');
  const [statusFilter, setStatusFilter] = useState<ScheduleStatusFilter>('ALL');

  // Confirmation modal when attempting to switch doctors with unsaved schedule changes
  const [pendingDoctorId, setPendingDoctorId] = useState<string | null>(null);
  const [showDirtyModal, setShowDirtyModal] = useState(false);

  const { data: deptData } = useActiveDepartments();
  const departments = useMemo(() => {
    if (!deptData) return [];
    if (Array.isArray(deptData)) return deptData;
    if (Array.isArray((deptData as unknown as { data: unknown[] }).data)) {
      return (deptData as unknown as { data: unknown[] }).data as { id: string; name: string; code: string }[];
    }
    return [];
  }, [deptData]);

  // Compute counts for quick status filters
  const counts = useMemo(() => {
    let withSched = 0;
    let needsSched = 0;
    doctors.forEach((d) => {
      if (d.hasSchedule) withSched++;
      else needsSched++;
    });
    return { all: doctors.length, withSched, needsSched };
  }, [doctors]);

  // Filter & Sort physicians
  const filteredAndSortedDoctors = useMemo(() => {
    let list = [...doctors];

    // 1. Department filter
    if (departmentFilter) {
      list = list.filter((d) => d.department?.id === departmentFilter);
    }

    // 2. Search query filter (name, email, specialization, department code/name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.email && d.email.toLowerCase().includes(q)) ||
          (d.specialization && d.specialization.toLowerCase().includes(q)) ||
          (d.department?.name && d.department.name.toLowerCase().includes(q)) ||
          (d.department?.code && d.department.code.toLowerCase().includes(q)),
      );
    }

    // 3. Status filter
    if (statusFilter === 'WITH_SCHEDULE') {
      list = list.filter((d) => d.hasSchedule);
    } else if (statusFilter === 'NO_SCHEDULE') {
      list = list.filter((d) => !d.hasSchedule);
    }

    // 4. Sorting
    switch (sortBy) {
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'dept-asc':
        list.sort((a, b) => (a.department?.name || '').localeCompare(b.department?.name || ''));
        break;
      case 'spec-asc':
        list.sort((a, b) => (a.specialization || '').localeCompare(b.specialization || ''));
        break;
      case 'needs-schedule':
        list.sort((a, b) => Number(a.hasSchedule) - Number(b.hasSchedule));
        break;
      case 'active-schedule':
        list.sort((a, b) => Number(b.isScheduleActive) - Number(a.isScheduleActive));
        break;
    }

    return list;
  }, [doctors, departmentFilter, searchQuery, statusFilter, sortBy]);

  // Find index of active doctor in the filtered list
  const currentIndex = useMemo(() => {
    return filteredAndSortedDoctors.findIndex((d) => d.id === selectedDoctorId);
  }, [filteredAndSortedDoctors, selectedDoctorId]);

  const hasFiltersActive = Boolean(departmentFilter || searchQuery || statusFilter !== 'ALL' || sortBy !== 'name-asc');

  const handleRequestDoctorChange = (newDoctorId: string) => {
    if (newDoctorId === selectedDoctorId) return;

    if (isDirty) {
      setPendingDoctorId(newDoctorId);
      setShowDirtyModal(true);
    } else {
      onSelectDoctor(newDoctorId);
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingDoctorId !== null) {
      onSelectDoctor(pendingDoctorId);
    }
    setShowDirtyModal(false);
    setPendingDoctorId(null);
  };

  const handleCancelSwitch = () => {
    setShowDirtyModal(false);
    setPendingDoctorId(null);
  };

  const handleStepPrev = () => {
    if (currentIndex > 0) {
      const prevDoc = filteredAndSortedDoctors[currentIndex - 1];
      if (prevDoc) handleRequestDoctorChange(prevDoc.id);
    }
  };

  const handleStepNext = () => {
    if (currentIndex < 0) {
      if (filteredAndSortedDoctors.length > 0 && filteredAndSortedDoctors[0]) {
        handleRequestDoctorChange(filteredAndSortedDoctors[0].id);
      }
    } else if (currentIndex < filteredAndSortedDoctors.length - 1) {
      const nextDoc = filteredAndSortedDoctors[currentIndex + 1];
      if (nextDoc) handleRequestDoctorChange(nextDoc.id);
    }
  };

  const handleClearFilters = () => {
    setDepartmentFilter('');
    setSearchQuery('');
    setStatusFilter('ALL');
    setSortBy('name-asc');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Top Filter Controls Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          alignItems: 'flex-end',
          padding: '0.75rem 1rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
        }}
      >
        {/* Department Filter */}
        <div>
          <label
            htmlFor="filterDepartment"
            style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '3px' }}
          >
            Filter by Department
          </label>
          <select
            id="filterDepartment"
            aria-label="Filter by Department"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '0.8125rem',
              outline: 'none',
              background: '#ffffff',
            }}
          >
            <option value="">All Departments ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {/* Search Doctor Input */}
        <div>
          <label
            htmlFor="searchDoctor"
            style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '3px' }}
          >
            Search Physician
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="searchDoctor"
              aria-label="Search Doctor"
              type="text"
              placeholder="Name, email, specialty…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 28px 6px 10px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#adb5bd',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label
            htmlFor="sortDoctors"
            style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '3px' }}
          >
            Sort Order
          </label>
          <select
            id="sortDoctors"
            aria-label="Sort Doctors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as DoctorSortOption)}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '0.8125rem',
              outline: 'none',
              background: '#ffffff',
            }}
          >
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
            <option value="dept-asc">Department (A → Z)</option>
            <option value="spec-asc">Specialization (A → Z)</option>
            <option value="needs-schedule">Needs Schedule First</option>
            <option value="active-schedule">Active Schedule First</option>
          </select>
        </div>

        {/* Status Filter Chips & Reset */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: statusFilter === 'ALL' ? '1px solid #0a0a0a' : '1px solid #dee2e6',
              background: statusFilter === 'ALL' ? '#0a0a0a' : '#ffffff',
              color: statusFilter === 'ALL' ? '#ffffff' : '#495057',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('NO_SCHEDULE')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: statusFilter === 'NO_SCHEDULE' ? '1px solid #0a0a0a' : '1px solid #dee2e6',
              background: statusFilter === 'NO_SCHEDULE' ? '#0a0a0a' : '#ffffff',
              color: statusFilter === 'NO_SCHEDULE' ? '#ffffff' : '#495057',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Needs Setup ({counts.needsSched})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('WITH_SCHEDULE')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: statusFilter === 'WITH_SCHEDULE' ? '1px solid #0a0a0a' : '1px solid #dee2e6',
              background: statusFilter === 'WITH_SCHEDULE' ? '#0a0a0a' : '#ffffff',
              color: statusFilter === 'WITH_SCHEDULE' ? '#ffffff' : '#495057',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Configured ({counts.withSched})
          </button>

          {hasFiltersActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: 'none',
                background: 'transparent',
                color: '#dc3545',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Doctor Selection & Quick Stepper Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '320px' }}>
          <label
            htmlFor="doctorSelector"
            style={{ fontSize: '0.875rem', fontWeight: 700, color: '#212529', whiteSpace: 'nowrap' }}
          >
            Select Doctor:
          </label>

          {/* Quick Prev Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleStepPrev}
            disabled={currentIndex <= 0}
            title="Previous doctor in list"
            aria-label="Previous Doctor"
          >
            ◀
          </Button>

          {/* Accessible Select element */}
          <select
            id="doctorSelector"
            aria-label="Select Doctor"
            value={selectedDoctorId}
            onChange={(e) => handleRequestDoctorChange(e.target.value)}
            style={{
              flex: 1,
              maxWidth: '520px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: '#ffffff',
              outline: 'none',
            }}
          >
            {filteredAndSortedDoctors.length === 0 ? (
              <option value="" disabled>
                -- No doctors matching current filters --
              </option>
            ) : (
              <>
                <option value="">-- Select a Doctor to Manage Schedule --</option>
                {filteredAndSortedDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name} {doc.department ? `(${doc.department.name})` : ''} -{' '}
                    {doc.specialization || 'General Practice'}{' '}
                    {doc.hasSchedule
                      ? doc.isScheduleActive
                        ? '• Active'
                        : '○ Inactive'
                      : '⚠ No Schedule'}
                  </option>
                ))}
              </>
            )}
          </select>

          {/* Quick Next Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleStepNext}
            disabled={filteredAndSortedDoctors.length === 0 || (currentIndex >= 0 && currentIndex >= filteredAndSortedDoctors.length - 1)}
            title="Next doctor in list"
            aria-label="Next Doctor"
          >
            ▶
          </Button>
        </div>

        {/* Counter Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
            Showing <strong>{filteredAndSortedDoctors.length}</strong> of {doctors.length} doctors
          </span>
          {isDirty && (
            <Badge variant="warning">
              ● Unsaved Schedule Draft
            </Badge>
          )}
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <Modal
        isOpen={showDirtyModal}
        title="Unsaved Schedule Changes"
        onClose={handleCancelSwitch}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#495057', lineHeight: 1.5 }}>
            You have modified the working days, sessions, or breaks for the current doctor. Switching to
            another doctor will discard these unsaved changes.
          </p>
          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#856404', fontWeight: 600 }}>
            Do you want to discard your changes and switch doctors?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" size="sm" onClick={handleCancelSwitch}>
              Keep Editing
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmSwitch}>
              Discard &amp; Switch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
