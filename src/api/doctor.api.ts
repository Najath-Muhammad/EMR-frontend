import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { DoctorWithSchedule } from '../types/schedule.types';

export interface DoctorFilterParams {
  search?: string;
  department?: string;
  isActive?: boolean;
}

export async function fetchDoctors(
  params?: DoctorFilterParams,
): Promise<ApiResponse<DoctorWithSchedule[]>> {
  const response = await axiosInstance.get<ApiResponse<DoctorWithSchedule[]>>('/doctors', {
    params,
  });
  return response.data;
}

export async function fetchDoctorById(id: string): Promise<ApiResponse<DoctorWithSchedule>> {
  const response = await axiosInstance.get<ApiResponse<DoctorWithSchedule>>(`/doctors/${id}`);
  return response.data;
}
