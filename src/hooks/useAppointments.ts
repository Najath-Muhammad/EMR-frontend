import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAppointments,
  fetchAppointmentById,
  createAppointment,
  cancelAppointment,
  markAppointmentArrived,
  completeAppointment,
  updateAppointment,
  updateConsultationNotes,
  rescheduleAppointment,
} from '../api/appointment.api';
import type {
  CreateAppointmentInput,
  CancelAppointmentInput,
  UpdateAppointmentInput,
  CompleteAppointmentInput,
  UpdateConsultationNotesInput,
  RescheduleAppointmentInput,
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

export function useMarkAppointmentArrived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markAppointmentArrived(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CompleteAppointmentInput }) =>
      completeAppointment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentInput }) =>
      updateAppointment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateConsultationNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateConsultationNotesInput }) =>
      updateConsultationNotes(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: APPOINTMENT_QUERY_KEYS.all });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleAppointmentInput }) =>
      rescheduleAppointment(id, payload),
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
