import React from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AuditLog } from '../../types/auditLog.types';

interface AuditDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, isOpen, onClose }) => {
  if (!isOpen || !log) return null;

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('CREATE')) return 'success';
    if (action.includes('FAILURE') || action.includes('CANCEL')) return 'danger';
    if (action.includes('ARRIVE') || action.includes('UPDATE')) return 'warning';
    return 'info';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#0a0a0a' }}>
              Audit Record Details
            </h3>
            <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
            <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>
              {log.status}
            </Badge>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#6c757d',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '6px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>Timestamp</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0a0a0a' }}>
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>Entity Type & ID</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0a0a0a' }}>
                {log.entityType} {log.entityId ? `(#${log.entityId})` : ''}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>Actor</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0a0a0a' }}>
                {log.actor?.name || 'System / Unauthenticated'}
                {log.actor?.role ? ` (${log.actor.role})` : ''}
              </span>
              {log.actor?.email && (
                <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>
                  {log.actor.email}
                </span>
              )}
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block' }}>Network IP</span>
              <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#0a0a0a' }}>
                {log.ipAddress || 'Internal'}
              </span>
            </div>
          </div>

          {/* User Agent */}
          {log.userAgent && (
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block', marginBottom: '0.25rem' }}>
                User Agent
              </span>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#495057',
                  wordBreak: 'break-all',
                }}
              >
                {log.userAgent}
              </div>
            </div>
          )}

          {/* Context Details JSON */}
          <div>
            <span style={{ fontSize: '0.75rem', color: '#6c757d', display: 'block', marginBottom: '0.25rem' }}>
              Action Metadata & Parameters (Sanitized)
            </span>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                overflowX: 'auto',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {JSON.stringify(log.details || {}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
