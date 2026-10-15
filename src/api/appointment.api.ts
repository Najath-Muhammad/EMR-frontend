import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type {
  Appointment,
  CreateAppointmentInput,
  CancelAppointmentInput,
  UpdateAppointmentInput,
  CompleteAppointmentInput,
  UpdateConsultationNotesInput,
  RescheduleAppointmentInput,
  AppointmentQueryParams,
} from '../types/appointment.types';

export async function fetchAppointments(
  params?: AppointmentQueryParams,
): Promise<ApiResponse<Appointment[]>> {
  const response = await axiosInstance.get<ApiResponse<Appointment[]>>('/appointments', {
    params,
  });
  return response.data;
}

export async function fetchAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return response.data;
}

export async function createAppointment(
  payload: CreateAppointmentInput,
): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.post<ApiResponse<Appointment>>(
    '/appointments',
    payload,
  );
  return response.data;
}

export async function markAppointmentArrived(id: string): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/arrive`,
  );
  return response.data;
}

export async function completeAppointment(
  id: string,
  payload?: CompleteAppointmentInput,
): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/complete`,
    payload || {},
  );
  return response.data;
}

export async function updateAppointment(
  id: string,
  payload: UpdateAppointmentInput,
): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.patch<ApiResponse<Appointment>>(
    `/appointments/${id}`,
    payload,
  );
  return response.data;
}

export async function updateConsultationNotes(
  id: string,
  payload: UpdateConsultationNotesInput,
): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/consultation`,
    payload,
  );
  return response.data;
}

export async function rescheduleAppointment(
  id: string,
  payload: RescheduleAppointmentInput,
): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/reschedule`,
    payload,
  );
  return response.data;
}

export async function cancelAppointment(
  id: string,
  payload?: CancelAppointmentInput,
): Promise<ApiResponse<Appointment>> {
  const response = await axiosInstance.patch<ApiResponse<Appointment>>(
    `/appointments/${id}/cancel`,
    payload || {},
  );
  return response.data;
}
