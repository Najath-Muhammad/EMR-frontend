import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { SearchInput } from '../../components/ui/SearchInput';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { AuditLog } from '../../types/auditLog.types';
import { AuditDetailModal } from '../../components/audit/AuditDetailModal';

export function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [status, setStatus] = useState<'SUCCESS' | 'FAILURE' | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'action' | 'entityType'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: response, isLoading, isError, error } = useAuditLogs({
    page,
    limit,
    search: search.trim() || undefined,
    action: action || undefined,
    entityType: entityType || undefined,
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    sortBy,
    sortOrder,
  });

  const auditLogs = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };

  const handleSort = (field: 'createdAt' | 'action' | 'entityType') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setAction('');
    setEntityType('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search || action || entityType || status || startDate || endDate || sortBy !== 'createdAt' || sortOrder !== 'desc',
  );

  const getActionBadge = (act: string) => {
    if (act.includes('SUCCESS') || act.includes('CREATE')) {
      return <Badge variant="success">{act}</Badge>;
    }
    if (act.includes('FAILURE') || act.includes('CANCEL')) {
      return <Badge variant="danger">{act}</Badge>;
    }
    if (act.includes('ARRIVE') || act.includes('UPDATE') || act.includes('RESCHEDULE')) {
      return <Badge variant="warning">{act}</Badge>;
    }
    return <Badge variant="info">{act}</Badge>;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0a0a', margin: 0, letterSpacing: '-0.02em' }}>
            Audit Trail & Activity Log
          </h1>
          <p style={{ color: '#6c757d', fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
            Immutable chronological record of administrative actions, authentication attempts, appointments, and staff changes
          </p>
        </div>
      </div>

      {}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                Search Action, Actor, or Entity ID
              </label>
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search by action, name, email, ID..."
              />
            </div>

            {/* Action Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                Action
              </label>
              <select
                aria-label="Action"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="">All Actions</option>
                <optgroup label="Authentication">
                  <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
                  <option value="AUTH_LOGIN_FAILURE">AUTH_LOGIN_FAILURE</option>
                  <option value="AUTH_LOGOUT">AUTH_LOGOUT</option>
                  <option value="AUTH_TOKEN_REFRESH">AUTH_TOKEN_REFRESH</option>
                </optgroup>
                <optgroup label="Appointments">
                  <option value="APPOINTMENT_CREATE">APPOINTMENT_CREATE</option>
                  <option value="APPOINTMENT_UPDATE">APPOINTMENT_UPDATE</option>
                  <option value="APPOINTMENT_ARRIVED">APPOINTMENT_ARRIVED</option>
                  <option value="APPOINTMENT_COMPLETED">APPOINTMENT_COMPLETED</option>
                  <option value="APPOINTMENT_RESCHEDULED">APPOINTMENT_RESCHEDULED</option>
                  <option value="APPOINTMENT_CANCEL">APPOINTMENT_CANCEL</option>
                </optgroup>
                <optgroup label="Staff & Schedules">
                  <option value="STAFF_CREATE">STAFF_CREATE</option>
                  <option value="STAFF_UPDATE">STAFF_UPDATE</option>
                  <option value="STAFF_STATUS_TOGGLE">STAFF_STATUS_TOGGLE</option>
                  <option value="SCHEDULE_UPDATE">SCHEDULE_UPDATE</option>
                </optgroup>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                Entity Type
              </label>
              <select
                aria-label="Entity Type"
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="">All Entities</option>
                <option value="Auth">Auth</option>
                <option value="Appointment">Appointment</option>
                <option value="User">User</option>
                <option value="Schedule">Schedule</option>
                <option value="Department">Department</option>
                <option value="Patient">Patient</option>
              </select>
            </div>

            {}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                Status
              </label>
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as 'SUCCESS' | 'FAILURE' | '');
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>

            {}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#495057', marginBottom: '4px' }}>
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <th
                  onClick={() => handleSort('createdAt')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 600,
                    color: '#495057',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Timestamp {sortBy === 'createdAt' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                </th>
                <th
                  onClick={() => handleSort('action')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 600,
                    color: '#495057',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Action {sortBy === 'action' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                </th>
                <th
                  onClick={() => handleSort('entityType')}
                  style={{
                    padding: '12px 16px',
                    fontWeight: 600,
                    color: '#495057',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Entity {sortBy === 'entityType' ? (sortOrder === 'asc' ? '▲' : '▼') : '⇅'}
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#495057' }}>Actor</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#495057' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#495057' }}>IP Address</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: '#495057', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Spinner size="md" /> Loading audit trail...
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#dc3545' }}>
                    ⚠️ {error instanceof Error ? error.message : 'Failed to load audit logs'}
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid #f1f3f5',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#495057' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {getActionBadge(log.action)}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 500, color: '#0a0a0a' }}>{log.entityType}</span>
                      {log.entityId && (
                        <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '6px' }}>
                          #{log.entityId}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500, color: '#0a0a0a' }}>
                          {log.actor?.name || 'System / Unauth'}
                        </span>
                        {log.actor?.email && (
                          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{log.actor.email}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                      {log.ipAddress || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedLog(log)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid #dee2e6',
            background: '#ffffff',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#495057' }}>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                fontSize: '0.875rem',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span style={{ marginLeft: '0.5rem' }}>
              Showing {auditLogs.length} of {meta.total} records
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#495057' }}>
              Page {meta.page} of {meta.totalPages || 1}
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
              disabled={page >= (meta.totalPages || 1) || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Modal */}
      <AuditDetailModal
        log={selectedLog}
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
