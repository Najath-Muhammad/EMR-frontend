export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface PatientRef {
  id: string;
  patientId: string;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface DoctorRef {
  id: string;
  name: string;
  email: string;
  specialization?: string;
}

export interface DepartmentRef {
  id: string;
  name: string;
  code: string;
}

export interface StaffRef {
  id: string;
  name: string;
  email: string;
}

export interface RescheduleHistoryEntry {
  previousDate: string;
  previousStartTime: string;
  previousEndTime: string;
  rescheduledAt: string;
  rescheduledBy: StaffRef | null;
  reason?: string;
}

export interface Appointment {
  id: string;
  patient: PatientRef;
  doctor: DoctorRef;
  department: DepartmentRef;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  purpose: string;
  notes: string;
  createdBy: StaffRef | null;
  arrivedAt: string | null;
  arrivedBy: StaffRef | null;
  completedAt: string | null;
  completedBy: StaffRef | null;
  consultationNotes: string;
  cancelledAt: string | null;
  cancelledBy: StaffRef | null;
  cancellationReason: string;
  rescheduleHistory: RescheduleHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  departmentId?: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
}

export interface UpdateAppointmentInput {
  purpose?: string;
  notes?: string;
}

export interface CompleteAppointmentInput {
  consultationNotes?: string;
}

export interface UpdateConsultationNotesInput {
  consultationNotes: string;
}

export interface RescheduleAppointmentInput {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export interface CancelAppointmentInput {
  reason?: string;
}

export interface AppointmentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  date?: string;
  status?: AppointmentStatus;
  startDate?: string;
  endDate?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'date' | 'startTime' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}
