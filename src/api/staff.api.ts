import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginationParams } from '../types/api.types';
import type {
  StaffMember,
  StaffCreationResult,
  CreateStaffInput,
  UpdateStaffInput,
  StaffFilterParams,
  ActivateAccountInput,
} from '../types/staff.types';

export async function fetchStaff(
  params?: PaginationParams & StaffFilterParams,
): Promise<ApiResponse<StaffMember[]>> {
  const response = await axiosInstance.get<ApiResponse<StaffMember[]>>('/staff', {
    params,
  });
  return response.data;
}

export async function fetchStaffById(id: string): Promise<ApiResponse<StaffMember>> {
  const response = await axiosInstance.get<ApiResponse<StaffMember>>(`/staff/${id}`);
  return response.data;
}

export async function createStaff(
  input: CreateStaffInput,
): Promise<ApiResponse<StaffCreationResult>> {
  const response = await axiosInstance.post<ApiResponse<StaffCreationResult>>('/staff', input);
  return response.data;
}

export async function updateStaff(
  id: string,
  input: UpdateStaffInput,
): Promise<ApiResponse<StaffMember>> {
  const response = await axiosInstance.put<ApiResponse<StaffMember>>(`/staff/${id}`, input);
  return response.data;
}

export async function toggleStaffStatus(
  id: string,
  isActive: boolean,
): Promise<ApiResponse<StaffMember>> {
  const response = await axiosInstance.patch<ApiResponse<StaffMember>>(`/staff/${id}/status`, {
    isActive,
  });
  return response.data;
}

export async function resendStaffActivation(
  id: string,
): Promise<ApiResponse<StaffCreationResult>> {
  const response = await axiosInstance.post<ApiResponse<StaffCreationResult>>(
    `/staff/${id}/resend-activation`,
  );
  return response.data;
}

export async function activateAccount(
  input: ActivateAccountInput,
): Promise<ApiResponse<{ email: string; role: string; activated: boolean }>> {
  const response = await axiosInstance.post<ApiResponse<{ email: string; role: string; activated: boolean }>>(
    '/auth/activate',
    input,
  );
  return response.data;
}
