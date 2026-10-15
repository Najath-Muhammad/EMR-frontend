import { Role } from './auth.types';

export interface StaffDepartmentRef {
  id: string;
  name: string;
  code: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: StaffDepartmentRef | null;
  phone?: string;
  specialization?: string;
  isActive: boolean;
  isActivated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffCreationResult {
  staff: StaffMember;
  activationToken: string;
  activationLink: string;
  expiresAt: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  role: 'DOCTOR' | 'RECEPTIONIST';
  department: string;
  phone?: string;
  specialization?: string;
}

export interface UpdateStaffInput {
  name?: string;
  department?: string;
  phone?: string;
  specialization?: string;
}

export interface ActivateAccountInput {
  token: string;
  password: string;
}

export interface StaffFilterParams {
  search?: string;
  role?: Role;
  department?: string;
  isActive?: boolean;
}
