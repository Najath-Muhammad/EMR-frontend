import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { InputField, SelectField, TextareaField } from '../ui/FormField';
import { DobPicker } from '../ui/DobPicker';
import { Button } from '../ui/Button';
import { PossibleDuplicatesModal } from './PossibleDuplicatesModal';
import { useActiveDepartments } from '../../hooks/useDepartments';
import { useCheckPatientDuplicates, useCreatePatient } from '../../hooks/usePatients';
import { Patient, PossibleDuplicate, Gender, BloodGroup } from '../../types/patient.types';
import type { Department } from '../../types/department.types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const registerPatientSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phone: z
    .string({ required_error: 'Mobile phone number is required' })
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(20, 'Phone number cannot exceed 20 characters'),
  dateOfBirth: z
    .string({ required_error: 'Date of birth is required' })
    .regex(dateRegex, 'Date of birth must be in YYYY-MM-DD format')
    .refine((val) => {
      const dob = new Date(val);
      return !isNaN(dob.getTime()) && dob <= new Date();
    }, 'Date of birth cannot be in the future'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Please select a gender',
  }),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).default('UNKNOWN'),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  address: z.string().max(250, 'Address cannot exceed 250 characters').optional().or(z.literal('')),
  emergencyContactName: z.string().max(100).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(20).optional().or(z.literal('')),
  emergencyContactRelation: z.string().max(50).optional().or(z.literal('')),
  registrationDepartment: z.string().optional().or(z.literal('')),
});

type RegisterPatientFormValues = z.infer<typeof registerPatientSchema>;

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
  onSelectExisting?: (patient: Patient) => void;
}

export function RegisterPatientModal({
  isOpen,
  onClose,
  onSuccess,
  onSelectExisting,
}: RegisterPatientModalProps) {
  const [duplicateMatches, setDuplicateMatches] = useState<PossibleDuplicate[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<RegisterPatientFormValues | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: departments } = useActiveDepartments();
  const checkDuplicatesMutation = useCheckPatientDuplicates();
  const createPatientMutation = useCreatePatient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterPatientFormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      dateOfBirth: '',
      gender: 'MALE',
      bloodGroup: 'UNKNOWN',
      email: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      registrationDepartment: '',
    },
  });

  const departmentList = Array.isArray(departments)
    ? departments
    : Array.isArray((departments as unknown as { data?: Department[] })?.data)
      ? (departments as unknown as { data: Department[] }).data
      : [];

  const departmentOptions = [
    { value: '', label: 'None / General Patient Record (Optional)' },
    ...departmentList.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    })),
  ];

  const handleExecuteRegistration = (values: RegisterPatientFormValues) => {
    setErrorMessage(null);

    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender as Gender,
      email: values.email || undefined,
      address: values.address || undefined,
      bloodGroup: values.bloodGroup as BloodGroup,
      registrationDepartment: values.registrationDepartment || undefined,
      emergencyContact:
        values.emergencyContactName && values.emergencyContactPhone
          ? {
              name: values.emergencyContactName,
              phone: values.emergencyContactPhone,
              relationship: values.emergencyContactRelation || undefined,
            }
          : undefined,
    };

    createPatientMutation.mutate(payload, {
      onSuccess: (res) => {
        setIsDuplicateModalOpen(false);
        reset();
        onSuccess(res.data);
      },
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setErrorMessage(apiErr.response?.data?.message ?? 'Failed to register patient. Please check all fields.');
        setIsDuplicateModalOpen(false);
      },
    });
  };

  const onSubmit = async (values: RegisterPatientFormValues) => {
    setErrorMessage(null);

    try {

      const res = await checkDuplicatesMutation.mutateAsync({
        fullName: values.fullName,
        phone: values.phone,
        dateOfBirth: values.dateOfBirth,
      });

      if (res.success && res.data.hasMatches && res.data.duplicates.length > 0) {
        setDuplicateMatches(res.data.duplicates);
        setPendingValues(values);
        setIsDuplicateModalOpen(true);
        return;
      }

      handleExecuteRegistration(values);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        apiErr.response?.data?.message ?? 'Unable to complete duplicate pre-screening. Please try again.',
      );
    }
  };

  const handleSelectExistingPatient = (existing: Patient) => {
    setIsDuplicateModalOpen(false);
    reset();
    if (onSelectExisting) {
      onSelectExisting(existing);
    } else {
      onClose();
    }
  };

  const handleProceedDuplicate = () => {
    if (pendingValues) {
      handleExecuteRegistration(pendingValues);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isDuplicateModalOpen}
        onClose={createPatientMutation.isPending ? () => {} : onClose}
        title="Register New Patient"
        description="Create a centralized patient record for consultations across all hospital departments."
        maxWidth="680px"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={checkDuplicatesMutation.isPending || createPatientMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              isLoading={checkDuplicatesMutation.isPending || createPatientMutation.isPending}
            >
              Check Duplicates &amp; Register
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {errorMessage && (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '0.8125rem',
                marginBottom: '1rem',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <InputField
              label="Full Name"
              required
              placeholder="e.g. Johnathan Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <InputField
              label="Mobile Number"
              required
              placeholder="e.g. (555) 234-5678"
              helperText="Numbers are normalized automatically"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <DobPicker
              label="Date of Birth"
              required
              error={errors.dateOfBirth?.message}
              {...register('dateOfBirth')}
            />

            <SelectField
              label="Gender"
              required
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
              error={errors.gender?.message}
              {...register('gender')}
            />

            <SelectField
              label="Blood Group"
              options={[
                { value: 'UNKNOWN', label: 'Unknown / Not Tested' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
              error={errors.bloodGroup?.message}
              {...register('bloodGroup')}
            />
          </div>

          {/* Contact Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <InputField
              label="Email Address"
              type="email"
              placeholder="patient@example.com (optional)"
              error={errors.email?.message}
              {...register('email')}
            />

            <SelectField
              label="Initial Department"
              helperText="Optional metadata. Does not restrict future visits."
              options={departmentOptions}
              error={errors.registrationDepartment?.message}
              {...register('registrationDepartment')}
            />
          </div>

          <TextareaField
            label="Residential Address"
            rows={2}
            placeholder="Street address, City, Postal Code (optional)"
            error={errors.address?.message}
            {...register('address')}
          />

          {}
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.875rem 1rem',
              background: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #e9ecef',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#343a40', display: 'block', marginBottom: '0.5rem' }}>
              Emergency Contact (Optional)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <InputField
                label="Contact Name"
                placeholder="Next of kin"
                error={errors.emergencyContactName?.message}
                {...register('emergencyContactName')}
              />
              <InputField
                label="Contact Phone"
                placeholder="Phone number"
                error={errors.emergencyContactPhone?.message}
                {...register('emergencyContactPhone')}
              />
              <InputField
                label="Relationship"
                placeholder="e.g. Spouse, Parent"
                error={errors.emergencyContactRelation?.message}
                {...register('emergencyContactRelation')}
              />
            </div>
          </div>
        </form>
      </Modal>

      {}
      <PossibleDuplicatesModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        duplicates={duplicateMatches}
        onSelectExisting={handleSelectExistingPatient}
        onConfirmProceed={handleProceedDuplicate}
        isRegistering={createPatientMutation.isPending}
      />
    </>
  );
}
