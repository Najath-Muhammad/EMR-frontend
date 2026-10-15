import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type {
  DoctorSchedule,
  SaveScheduleInput,
} from '../types/schedule.types';
import type {
  DaySlotsSummary,
  PreviewSlotsInput,
} from '../types/slot.types';

export async function fetchDoctorSchedule(doctorId: string): Promise<ApiResponse<DoctorSchedule>> {
  const response = await axiosInstance.get<ApiResponse<DoctorSchedule>>(
    `/doctors/${doctorId}/schedule`,
  );
  return response.data;
}

export async function saveDoctorSchedule(
  doctorId: string,
  input: SaveScheduleInput,
  force = false,
): Promise<ApiResponse<DoctorSchedule>> {
  const response = await axiosInstance.put<ApiResponse<DoctorSchedule>>(
    `/doctors/${doctorId}/schedule`,
    input,
    { params: { force: force ? 'true' : undefined } },
  );
  return response.data;
}

export async function toggleDoctorScheduleStatus(
  doctorId: string,
  isActive: boolean,
): Promise<ApiResponse<DoctorSchedule>> {
  const response = await axiosInstance.patch<ApiResponse<DoctorSchedule>>(
    `/doctors/${doctorId}/schedule/status`,
    { isActive },
  );
  return response.data;
}

export async function fetchSlots(
  doctorId: string,
  date: string,
  timezone?: string,
): Promise<ApiResponse<DaySlotsSummary>> {
  const response = await axiosInstance.get<ApiResponse<DaySlotsSummary>>('/slots', {
    params: { doctorId, date, timezone },
  });
  return response.data;
}

export async function previewSlots(
  input: PreviewSlotsInput,
): Promise<ApiResponse<DaySlotsSummary>> {
  const response = await axiosInstance.post<ApiResponse<DaySlotsSummary>>(
    '/slots/preview',
    input,
  );
  return response.data;
}
