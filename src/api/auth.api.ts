import { axiosInstance } from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { AuthResponseData, LoginCredentials, User } from '../types/auth.types';

export async function loginApi(credentials: LoginCredentials): Promise<ApiResponse<AuthResponseData>> {
  const response = await axiosInstance.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
  return response.data;
}

export async function refreshApi(): Promise<ApiResponse<AuthResponseData>> {
  const response = await axiosInstance.post<ApiResponse<AuthResponseData>>('/auth/refresh');
  return response.data;
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  const response = await axiosInstance.post<ApiResponse<null>>('/auth/logout');
  return response.data;
}

export async function getMeApi(): Promise<ApiResponse<{ user: User }>> {
  const response = await axiosInstance.get<ApiResponse<{ user: User }>>('/auth/me');
  return response.data;
}
