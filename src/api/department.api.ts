import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginationParams } from '../types/api.types';
import type {
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentFilterParams,
} from '../types/department.types';

export async function fetchDepartments(
  params?: PaginationParams & DepartmentFilterParams,
): Promise<ApiResponse<Department[]>> {
  const response = await axiosInstance.get<ApiResponse<Department[]>>(
    '/departments',
    { params },
  );
  return response.data;
}

export async function fetchActiveDepartments(): Promise<Department[]> {
  try {
    const response = await axiosInstance.get<ApiResponse<Department[]>>('/departments/active');
    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }
    const fallback = response.data.data as unknown as { items?: Department[] };
    return Array.isArray(fallback?.items) ? fallback.items : [];
  } catch {
    // Fallback to query with isActive: true
    const fallbackResponse = await axiosInstance.get<ApiResponse<Department[]>>('/departments', {
      params: { isActive: true, limit: 100 },
    });
    if (Array.isArray(fallbackResponse.data.data)) {
      return fallbackResponse.data.data;
    }
    const fallback = fallbackResponse.data.data as unknown as { items?: Department[] };
    return Array.isArray(fallback?.items) ? fallback.items : [];
  }
}

export async function fetchDepartmentById(id: string): Promise<ApiResponse<Department>> {
  const response = await axiosInstance.get<ApiResponse<Department>>(`/departments/${id}`);
  return response.data;
}

export async function createDepartment(
  input: CreateDepartmentInput,
): Promise<ApiResponse<Department>> {
  const response = await axiosInstance.post<ApiResponse<Department>>('/departments', input);
  return response.data;
}

export async function updateDepartment(
  id: string,
  input: UpdateDepartmentInput,
): Promise<ApiResponse<Department>> {
  const response = await axiosInstance.put<ApiResponse<Department>>(`/departments/${id}`, input);
  return response.data;
}

export async function toggleDepartmentStatus(
  id: string,
  isActive: boolean,
): Promise<ApiResponse<Department>> {
  const response = await axiosInstance.patch<ApiResponse<Department>>(
    `/departments/${id}/status`,
    { isActive },
  );
  return response.data;
}
