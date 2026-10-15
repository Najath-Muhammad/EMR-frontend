import { useQuery } from '@tanstack/react-query';
import { fetchHealth, type HealthData } from '../api/health.api';
import type { ApiResponse } from '../types/api.types';

export function useHealth() {
  return useQuery<ApiResponse<HealthData>, Error>({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
