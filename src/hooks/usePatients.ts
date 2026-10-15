import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPatients,
  fetchPatientById,
  checkPatientDuplicates,
  createPatient,
  updatePatient,
} from '../api/patient.api';
import {
  CreatePatientInput,
  UpdatePatientInput,
  PatientSearchParams,
} from '../types/patient.types';

export const PATIENT_QUERY_KEYS = {
  all: ['patients'] as const,
  list: (params?: PatientSearchParams) => ['patients', 'list', params] as const,
  detail: (id: string) => ['patients', 'detail', id] as const,
};

export function usePatients(params?: PatientSearchParams) {
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.list(params),
    queryFn: () => fetchPatients(params),
  });
}

export function usePatient(id?: string) {
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.detail(id ?? ''),
    queryFn: () => fetchPatientById(id!),
    enabled: Boolean(id),
  });
}

export function useCheckPatientDuplicates() {
  return useMutation({
    mutationFn: (data: { fullName: string; phone: string; dateOfBirth?: string }) =>
      checkPatientDuplicates(data),
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientInput) => createPatient(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.all });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientInput }) =>
      updatePatient(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: PATIENT_QUERY_KEYS.detail(id) });
    },
  });
}
