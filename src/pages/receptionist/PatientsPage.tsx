import { useState, useMemo } from 'react';
import { usePatients } from '../../hooks/usePatients';
import { useAuth } from '../../hooks/useAuth';
import { PatientSearchInput } from '../../components/patients/PatientSearchInput';
import { RegisterPatientModal } from '../../components/patients/RegisterPatientModal';
import { PatientDetailModal } from '../../components/patients/PatientDetailModal';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Patient } from '../../types/patient.types';
import { ROLES } from '../../types/auth.types';
import { formatPhoneDisplay } from '../../utils/phone.util';

export function PatientsPage() {
  const { user } = useAuth();
  const canRegister = user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.RECEPTIONIST;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const { data, isLoading } = usePatients({
    search: search || undefined,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const patientsList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.data)) return data.data;
    if (data.data && Array.isArray((data.data as unknown as { items: unknown[] }).items)) {
      return (data.data as unknown as { items: unknown[] }).items as Patient[];
    }
    return [];
  }, [data]);

  const totalPatients = data?.meta?.total ?? patientsList.length;

  const columns: Column<Patient>[] = [
    {
      id: 'patientId',
      header: 'Patient ID',
      sortable: true,
      accessor: (p) => (
        <Badge variant="neutral">
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{p.patientId}</strong>
        </Badge>
      ),
    },
    {
      id: 'fullName',
      header: 'Full Name',
      sortable: true,
      accessor: (p) => (
        <div>
          <span style={{ fontWeight: 600, color: '#0a0a0a', display: 'block' }}>{p.fullName}</span>
          {p.email && <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{p.email}</span>}
        </div>
      ),
    },
    {
      id: 'phone',
      header: 'Mobile Phone',
      accessor: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#212529', fontWeight: 500 }}>
          {formatPhoneDisplay(p.phone)}
        </span>
      ),
    },
    {
      id: 'dateOfBirth',
      header: 'DOB / Gender',
      accessor: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#495057' }}>{p.dateOfBirth}</span>
          <Badge variant="neutral">{p.gender}</Badge>
        </div>
      ),
    },
    {
      id: 'registrationDepartment',
      header: 'Primary Dept',
      accessor: (p) => (
        <span style={{ fontSize: '0.8125rem', color: '#495057' }}>
          {p.registrationDepartment?.name ?? '—'}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: 'Registered',
      sortable: true,
      accessor: (p) => (
        <span style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
          {new Date(p.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      accessor: (p) => (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPatient(p)}
            style={{ fontSize: '0.75rem', padding: '3px 8px', border: '1px solid #dee2e6' }}
          >
            View Profile
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner and Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            Patient Directory &amp; Registration
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#6c757d', margin: '4px 0 0' }}>
            Central hospital patient database with duplicate screening and multi-department visits.
          </p>
        </div>

        {canRegister && (
          <Button type="button" variant="primary" onClick={() => setIsRegisterOpen(true)}>
            + Register Patient
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successNotice && (
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
          <span>✔ {successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <PatientSearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
        />

        <div style={{ fontSize: '0.8125rem', color: '#6c757d' }}>
          Total registered patients: <strong>{totalPatients}</strong>
        </div>
      </div>

      {/* Patients Table */}
      <DataTable
        columns={columns}
        data={patientsList}
        keyExtractor={(p) => p.id}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: totalPatients,
          totalPages: data?.meta?.totalPages ?? Math.ceil(totalPatients / limit),
          onPageChange: setPage,
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        sorting={{
          sortBy,
          sortOrder,
          onSort: (field) => {
            if (sortBy === field) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(field);
              setSortOrder('asc');
            }
          },
        }}
        emptyMessage="No patient records found. Use the button above to register a new patient."
      />

      {}
      <RegisterPatientModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newPatient) => {
          setIsRegisterOpen(false);
          setSuccessNotice(`Patient ${newPatient.fullName} registered successfully with ID: ${newPatient.patientId}`);
        }}
        onSelectExisting={(existing) => {
          setIsRegisterOpen(false);
          setSelectedPatient(existing);
        }}
      />

      {}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
