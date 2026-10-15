import { useHealth } from '../hooks/useHealth';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

export function HealthPage() {
  const { data, isLoading, isError, error } = useHealth();

  return (
    <div style={{ maxWidth: '560px' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#0a0a0a' }}>
        System Status
      </h2>

      {isLoading && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6c757d' }}>
            <Spinner size="sm" />
            <span style={{ fontSize: '0.875rem' }}>Checking backend health…</span>
          </div>
        </Card>
      )}

      {isError && (
        <Card style={{ borderColor: '#f5c6cb', background: '#fff5f5' }}>
          <p style={{ fontSize: '0.875rem', color: '#842029', fontWeight: 500 }}>
            ⚠️ Cannot reach backend
          </p>
          <p style={{ fontSize: '0.8125rem', color: '#6c757d', marginTop: '0.25rem' }}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </Card>
      )}

      {data?.success && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Backend API</span>
            <Badge variant={data.data.status === 'ok' ? 'success' : 'warning'}>
              {data.data.status === 'ok' ? '✔ Healthy' : '⚠ Degraded'}
            </Badge>
          </div>

          <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
            {[
              ['Environment', data.data.environment],
              ['Version',     data.data.version],
              ['Uptime',      `${data.data.uptime}s`],
              ['Timestamp',   new Date(data.data.timestamp).toLocaleTimeString()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt style={{ fontSize: '0.75rem', color: '#adb5bd', marginBottom: '2px' }}>{label}</dt>
                <dd style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0a0a0a' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </div>
  );
}
