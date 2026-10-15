export interface AuditActor {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  actor?: AuditActor;
  details?: Record<string, unknown>;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  status?: 'SUCCESS' | 'FAILURE' | '';
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'action' | 'entityType';
  sortOrder?: 'asc' | 'desc';
}
