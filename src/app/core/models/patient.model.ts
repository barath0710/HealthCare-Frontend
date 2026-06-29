export interface Patient {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  age: number;
  address: string;
  genderId: number;
  genderName: string;
  bloodGroupId: number;
  bloodGroupCode: string;
  bloodGroupName: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface CreatePatientRequest {
  userId: number | null;
  dateOfBirth: string;
  address: string;
  genderId: number | null;
  bloodGroupId: number | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}