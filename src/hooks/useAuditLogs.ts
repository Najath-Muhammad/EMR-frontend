import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchAuditLogs, fetchAuditLogById } from '../api/auditLog.api';
import { AuditLogQueryParams } from '../types/auditLog.types';

export function useAuditLogs(params: AuditLogQueryParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => fetchAuditLogById(id),
    enabled: Boolean(id),
  });
}
