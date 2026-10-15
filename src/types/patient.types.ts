export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
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

export interface Patient {
  id: string;
  patientId: string;
  fullName: string;
  phone: string;
  normalizedPhone: string;
  dateOfBirth: string;
  gender: Gender;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  bloodGroup: BloodGroup;
  registrationDepartment?: DepartmentRef | null;
  registeredBy?: StaffRef | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  bloodGroup?: BloodGroup;
  registrationDepartment?: string;
}

export interface UpdatePatientInput {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  email?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
  bloodGroup?: BloodGroup;
  registrationDepartment?: string;
}

export interface PossibleDuplicate {
  patient: Patient;
  matchReasons: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DuplicateCheckResponse {
  hasMatches: boolean;
  duplicates: PossibleDuplicate[];
}

export interface PatientSearchParams {
  search?: string;
  gender?: Gender;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
