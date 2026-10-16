import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StaffCreationResult } from '../../types/staff.types';

interface ActivationLinkModalProps {
  creationResult: StaffCreationResult | null;
  onClose: () => void;
}

export function ActivationLinkModal({
  creationResult,
  onClose,
}: ActivationLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!creationResult) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(creationResult.activationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {

      setCopied(false);
    }
  };

  const expiresDate = new Date(creationResult.expiresAt).toLocaleString();

  return (
    <Modal
      isOpen={!!creationResult}
      onClose={onClose}
      title="Staff Account Created"
      description={`An activation invitation has been generated for ${creationResult.staff.name}.`}
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            padding: '1rem',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px', fontSize: '0.8125rem' }}>
            <span style={{ color: '#6c757d', fontWeight: 600 }}>Name:</span>
            <span style={{ color: '#0a0a0a', fontWeight: 600 }}>{creationResult.staff.name}</span>
            <span style={{ color: '#6c757d', fontWeight: 600 }}>Email:</span>
            <span style={{ color: '#0a0a0a' }}>{creationResult.staff.email}</span>
            <span style={{ color: '#6c757d', fontWeight: 600 }}>Role:</span>
            <span style={{ color: '#0a0a0a' }}>{creationResult.staff.role}</span>
            <span style={{ color: '#6c757d', fontWeight: 600 }}>Expires:</span>
            <span style={{ color: '#6c757d' }}>{expiresDate} (48 hours)</span>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#343a40',
              marginBottom: '6px',
            }}
          >
            Single-Use Activation Link
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              value={creationResult.activationLink}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                background: '#f8f9fa',
                outline: 'none',
              }}
            />
            <Button
              type="button"
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        <div
          style={{
            background: '#e8f4fd',
            border: '1px solid #b6e0fe',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            color: '#084298',
            lineHeight: 1.5,
          }}
        >
          ℹ <strong>Development Note:</strong> In production, this secure, time-limited link is emailed directly to the staff member. In local development without an SMTP service, copy this link to simulate opening the account setup page and setting a initial password.
        </div>
      </div>
    </Modal>
  );
}
