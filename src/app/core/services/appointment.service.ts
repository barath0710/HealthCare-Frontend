import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api.model';
import { Appointment, AppointmentHistory, BookAppointmentRequest } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  book(request: BookAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.apiUrl, request);
  }

  getAll(page = 1, pageSize = 10, status?: string, doctorId?: number, patientId?: number):
    Observable<ApiResponse<PagedResult<Appointment>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status)    params = params.set('status', status);
    if (doctorId)  params = params.set('doctorId', doctorId);
    if (patientId) params = params.set('patientId', patientId);
    return this.http.get<ApiResponse<PagedResult<Appointment>>>(this.apiUrl, { params });
  }

  getMy(page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Appointment>>> {
    return this.http.get<ApiResponse<PagedResult<Appointment>>>(
      `${this.apiUrl}/my`, { params: { page, pageSize } });
  }

  getDoctorToday(): Observable<ApiResponse<PagedResult<Appointment>>> {
    return this.http.get<ApiResponse<PagedResult<Appointment>>>(`${this.apiUrl}/doctor/today`);
  }

  getDoctorUpcoming(page = 1, pageSize = 10): Observable<ApiResponse<PagedResult<Appointment>>> {
    return this.http.get<ApiResponse<PagedResult<Appointment>>>(
      `${this.apiUrl}/doctor/upcoming`, { params: { page, pageSize } });
  }

  getById(id: number): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`);
  }

  confirm(id: number):   Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/confirm`, {});
  }

  complete(id: number):  Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/complete`, {});
  }

  cancel(id: number, reason?: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  reschedule(id: number, newDate: string, newTime: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(
      `${this.apiUrl}/${id}/reschedule`, { newDate, newTime });
  }

  noShow(id: number): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/noshow`, {});
  }

  getHistory(id: number): Observable<ApiResponse<AppointmentHistory[]>> {
    return this.http.get<ApiResponse<AppointmentHistory[]>>(`${this.apiUrl}/${id}/history`);
  }
}