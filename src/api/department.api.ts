import { axiosInstance } from './axiosInstance';
import type { ApiResponse, PaginatedData, PaginationParams } from '../types/api.types';
import type {
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentFilterParams,
} from '../types/department.types';

export async function fetchDepartments(
  params?: PaginationParams & DepartmentFilterParams,
): Promise<ApiResponse<PaginatedData<Department>>> {
  const response = await axiosInstance.get<ApiResponse<PaginatedData<Department>>>(
    '/departments',
    { params },
  );
  return response.data;
}

export async function fetchActiveDepartments(): Promise<Department[]> {
  const response = await axiosInstance.get<ApiResponse<PaginatedData<Department>>>(
    '/departments',
    { params: { isActive: true, limit: 100 } },
  );
  return response.data.data.items;
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
