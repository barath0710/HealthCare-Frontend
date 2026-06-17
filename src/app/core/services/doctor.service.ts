import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PagedResult } from '../models/api.model';
import { Doctor, AvailableSlots, Availability } from '../models/doctor.model';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private apiUrl = `${environment.apiUrl}/doctors`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, pageSize = 10, search = '', specializationId?: number):
    Observable<ApiResponse<PagedResult<Doctor>>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (specializationId) params = params.set('specializationId', specializationId);
    return this.http.get<ApiResponse<PagedResult<Doctor>>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${this.apiUrl}/${id}`);
  }

  getMyProfile(): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${this.apiUrl}/my-profile`);
  }

  create(data: any): Observable<ApiResponse<Doctor>> {
    return this.http.post<ApiResponse<Doctor>>(this.apiUrl, data);
  }

  update(id: number, data: any): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(`${this.apiUrl}/${id}`, data);
  }

  setAvailability(id: number, schedules: any[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/availability`, schedules);
  }

  getAvailability(id: number): Observable<ApiResponse<Availability[]>> {
    return this.http.get<ApiResponse<Availability[]>>(`${this.apiUrl}/${id}/availability`);
  }

  getSlots(id: number, date: string): Observable<ApiResponse<AvailableSlots>> {
    return this.http.get<ApiResponse<AvailableSlots>>(
      `${this.apiUrl}/${id}/slots`, { params: { date } });
  }

  requestDeletion(id: number, reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${id}/request-deletion`, { reason });
  }

  getPendingDeleteRequests(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/delete-requests/pending`);
  }

  reviewDeleteRequest(requestId: number, approve: boolean, reviewNotes?: string):
    Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/delete-requests/${requestId}/review`, { approve, reviewNotes });
  }
}