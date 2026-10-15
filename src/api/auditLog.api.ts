import { axiosInstance } from './axiosInstance';
import { ApiResponse } from '../types/api.types';
import { AuditLog, AuditLogQueryParams } from '../types/auditLog.types';

export async function fetchAuditLogs(
  params: AuditLogQueryParams = {},
): Promise<ApiResponse<AuditLog[]>> {
  const query = new URLSearchParams();

  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.action) query.set('action', params.action);
  if (params.entityType) query.set('entityType', params.entityType);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const url = `/audit-logs?${query.toString()}`;
  const response = await axiosInstance.get<ApiResponse<AuditLog[]>>(url);
  return response.data;
}

export async function fetchAuditLogById(id: string): Promise<ApiResponse<AuditLog>> {
  const response = await axiosInstance.get<ApiResponse<AuditLog>>(`/audit-logs/${id}`);
  return response.data;
}
