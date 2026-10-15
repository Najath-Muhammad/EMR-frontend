import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type {
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  DuplicateCheckResponse,
  PatientSearchParams,
} from '../types/patient.types';

export async function fetchPatients(
  params?: PatientSearchParams,
): Promise<ApiResponse<Patient[]>> {
  const response = await axiosInstance.get<ApiResponse<Patient[]>>('/patients', {
    params,
  });
  return response.data;
}

export async function fetchPatientById(id: string): Promise<ApiResponse<Patient>> {
  const response = await axiosInstance.get<ApiResponse<Patient>>(`/patients/${id}`);
  return response.data;
}

export async function checkPatientDuplicates(data: {
  fullName: string;
  phone: string;
  dateOfBirth?: string;
}): Promise<ApiResponse<DuplicateCheckResponse>> {
  const response = await axiosInstance.post<ApiResponse<DuplicateCheckResponse>>(
    '/patients/check-duplicates',
    data,
  );
  return response.data;
}

export async function createPatient(data: CreatePatientInput): Promise<ApiResponse<Patient>> {
  const response = await axiosInstance.post<ApiResponse<Patient>>('/patients', data);
  return response.data;
}

export async function updatePatient(
  id: string,
  data: UpdatePatientInput,
): Promise<ApiResponse<Patient>> {
  const response = await axiosInstance.put<ApiResponse<Patient>>(`/patients/${id}`, data);
  return response.data;
}
