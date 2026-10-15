import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  cancelAppointment,
} from '../api/appointment.api';
import type {
  CreateAppointmentInput,
  CancelAppointmentInput,
  AppointmentQueryParams,
} from '../types/appointment.types';

export const APPOINTMENT_QUERY_KEYS = {
  all: ['appointments'] as const,
  list: (params?: AppointmentQueryParams) => ['appointments', 'list', params] as const,
  detail: (id: string) => ['appointments', 'detail', id] as const,
};

export function useAppointments(params?: AppointmentQueryParams) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.list(params),
    queryFn: () => fetchAppointments(params),
  });
}

export function useAppointment(id?: string) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.detail(id ?? ''),
    queryFn: () => fetchAppointmentById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentInput) => createAppointment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelAppointmentInput }) =>
      cancelAppointment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}
