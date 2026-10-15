import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDepartments,
  fetchActiveDepartments,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
} from '../api/department.api';
import type {
  CreateDepartmentInput,
  UpdateDepartmentInput,
  DepartmentFilterParams,
} from '../types/department.types';
import type { PaginationParams } from '../types/api.types';

export const DEPARTMENT_QUERY_KEYS = {
  all: ['departments'] as const,
  list: (params?: PaginationParams & DepartmentFilterParams) =>
    ['departments', 'list', params] as const,
  active: ['departments', 'active'] as const,
  detail: (id: string) => ['departments', 'detail', id] as const,
};

export function useDepartments(params?: PaginationParams & DepartmentFilterParams) {
  return useQuery({
    queryKey: DEPARTMENT_QUERY_KEYS.list(params),
    queryFn: () => fetchDepartments(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useActiveDepartments() {
  return useQuery({
    queryKey: DEPARTMENT_QUERY_KEYS.active,
    queryFn: fetchActiveDepartments,
    staleTime: 60_000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => createDepartment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDepartmentInput }) =>
      updateDepartment(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}

export function useToggleDepartmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleDepartmentStatus(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}
