import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  resendStaffActivation,
} from '../api/staff.api';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  StaffFilterParams,
} from '../types/staff.types';
import type { PaginationParams } from '../types/api.types';
import { DEPARTMENT_QUERY_KEYS } from './useDepartments';

export const STAFF_QUERY_KEYS = {
  all: ['staff'] as const,
  list: (params?: PaginationParams & StaffFilterParams) =>
    ['staff', 'list', params] as const,
  detail: (id: string) => ['staff', 'detail', id] as const,
};

export function useStaffList(params?: PaginationParams & StaffFilterParams) {
  return useQuery({
    queryKey: STAFF_QUERY_KEYS.list(params),
    queryFn: () => fetchStaff(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateStaffInput) => createStaff(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all });

      void queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffInput }) =>
      updateStaff(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}

export function useToggleStaffStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleStaffStatus(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: DEPARTMENT_QUERY_KEYS.all });
    },
  });
}

export function useResendActivation() {
  return useMutation({
    mutationFn: (id: string) => resendStaffActivation(id),
  });
}
