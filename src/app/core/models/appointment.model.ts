export interface Appointment {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string;
  patientId: number;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  statusCode: string;
  statusName: string;
  statusBadgeColor: string;
  canBeCancelled: boolean;
  canBeRescheduled: boolean;
  reasonForVisit?: string;
  notes?: string;
  rescheduledFrom?: string;
  createdAt: string;
}

export interface AppointmentHistory {
  id: number;
  appointmentId: number;
  action: string;
  oldStatus: string;
  newStatus: string;
  changedByName: string;
  changedByRole: string;
  notes?: string;
  changedAt: string;
}

export interface BookAppointmentRequest {
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit?: string;
}

export interface NewBookingNotification {
  appointmentId: number;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  reasonForVisit?: string;
  message: string;
  notifiedAt: string;
}

export interface StatusChangedNotification {
  appointmentId: number;
  statusCode: string;
  statusName: string;
  badgeColor: string;
  doctorName: string;
  message: string;
  notifiedAt: string;
}