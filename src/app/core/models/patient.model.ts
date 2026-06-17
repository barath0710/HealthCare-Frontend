export interface Patient {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  age: number;
  address: string;
  genderName: string;
  bloodGroupCode: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface CreatePatientRequest {
  userId: number;
  dateOfBirth: string;
  address: string;
  genderId: number;
  bloodGroupId: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}