import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '../types/api.types';

export interface HealthData {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
}

export async function fetchHealth(): Promise<ApiResponse<HealthData>> {
  const response = await axiosInstance.get<ApiResponse<HealthData>>('/health');
  return response.data;
}
