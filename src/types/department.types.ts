export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  doctorCount: number;
  hasActiveReceptionist: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
}

export interface DepartmentFilterParams {
  search?: string;
  isActive?: boolean;
}
