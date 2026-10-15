export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
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
  cancelledAt: string | null;
  cancelledBy: StaffRef | null;
  cancellationReason: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
}

export interface CancelAppointmentInput {
  reason?: string;
}

export interface AppointmentQueryParams {
  page?: number;
  limit?: number;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  date?: string;
  status?: AppointmentStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'date' | 'startTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
