export interface Session {
  startTime: string;
  endTime: string;
  label?: string;
}

export interface Break {
  startTime: string;
  endTime: string;
  label?: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  dayName: 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  isEnabled: boolean;
  sessions: Session[];
  breaks: Break[];
}

export interface ScheduleDoctorRef {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface DoctorSchedule {
  id: string;
  doctor: ScheduleDoctorRef;
  slotDuration: number;
  workingDays: DaySchedule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveScheduleInput {
  slotDuration: number;
  workingDays: DaySchedule[];
  isActive: boolean;
}

export interface ScheduleConflict {
  appointmentId: string;
  patientName?: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface DoctorWithSchedule {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  isActivated: boolean;
  hasSchedule: boolean;
  isScheduleActive: boolean;
  slotDuration?: number;
  workingDaysCount?: number;
}
