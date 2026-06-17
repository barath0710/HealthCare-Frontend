export interface Doctor {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  specializationId: number;
  specializationName: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  isAvailableToday: boolean;
  availabilities: Availability[];
}

export interface Availability {
  id: number;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

export interface AvailableSlots {
  doctorId: number;
  doctorName: string;
  specializationName: string;
  consultationFee: number;
  date: string;
  dayName: string;
  availableSlots: string[];
  bookedSlots: string[];
}

export interface DoctorListItem {
  id: number;
  fullName: string;
  email: string;
  specializationName: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  isAvailableToday: boolean;
}

