import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDoctorSchedule,
  saveDoctorSchedule,
  toggleDoctorScheduleStatus,
  fetchSlots,
  previewSlots,
} from '../api/schedule.api';
import { fetchDoctors, DoctorFilterParams } from '../api/doctor.api';
import { SaveScheduleInput } from '../types/schedule.types';
import { PreviewSlotsInput } from '../types/slot.types';

export const SCHEDULE_QUERY_KEYS = {
  doctors: (params?: DoctorFilterParams) => ['doctors', 'list', params] as const,
  schedule: (doctorId: string) => ['doctors', doctorId, 'schedule'] as const,
  slots: (doctorId: string, date: string) => ['slots', doctorId, date] as const,
};

export function useDoctors(params?: DoctorFilterParams) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.doctors(params),
    queryFn: () => fetchDoctors(params),
  });
}

export function useDoctorSchedule(doctorId?: string) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.schedule(doctorId ?? ''),
    queryFn: () => fetchDoctorSchedule(doctorId!),
    enabled: Boolean(doctorId),
    retry: false,
  });
}

export function useSaveDoctorSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      doctorId,
      input,
      force = false,
    }: {
      doctorId: string;
      input: SaveScheduleInput;
      force?: boolean;
    }) => saveDoctorSchedule(doctorId, input, force),
    onSuccess: (_, { doctorId }) => {
      void queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.schedule(doctorId) });
      void queryClient.invalidateQueries({ queryKey: ['doctors'] });
      void queryClient.invalidateQueries({ queryKey: ['slots', doctorId] });
    },
  });
}

export function useToggleDoctorScheduleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ doctorId, isActive }: { doctorId: string; isActive: boolean }) =>
      toggleDoctorScheduleStatus(doctorId, isActive),
    onSuccess: (_, { doctorId }) => {
      void queryClient.invalidateQueries({ queryKey: SCHEDULE_QUERY_KEYS.schedule(doctorId) });
      void queryClient.invalidateQueries({ queryKey: ['doctors'] });
      void queryClient.invalidateQueries({ queryKey: ['slots', doctorId] });
    },
  });
}

export function useDoctorSlots(doctorId?: string, date?: string) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.slots(doctorId ?? '', date ?? ''),
    queryFn: () => fetchSlots(doctorId!, date!),
    enabled: Boolean(doctorId && date),
  });
}

export function usePreviewSlots() {
  return useMutation({
    mutationFn: (input: PreviewSlotsInput) => previewSlots(input),
  });
}
