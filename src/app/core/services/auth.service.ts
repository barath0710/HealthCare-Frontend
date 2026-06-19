import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<UserDto | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, request)
      .pipe(tap(res => { if (res.success) this.storeSession(res.data); }));
  }

  // register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
  //   return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request)
  //     .pipe(tap(res => { if (res.success) this.storeSession(res.data); }));
  // }
  register(request: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, request);
  }
  
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  getRoles(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/roles`);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expiry = localStorage.getItem('token_expiry');
    if (expiry && new Date() > new Date(expiry)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  getUserRole(): string {
    return this.currentUser()?.roleCode ?? '';
  }

  isAdmin(): boolean   { return this.getUserRole() === 'ADMIN'; }
  isDoctor(): boolean  { return this.getUserRole() === 'DOCTOR'; }
  isPatient(): boolean { return this.getUserRole() === 'PATIENT'; }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem('access_token',  res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('token_expiry',  res.expiresAt);
    localStorage.setItem('current_user',  JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    localStorage.clear();
    this.currentUser.set(null);
  }

  private loadUser(): UserDto | null {
    const user = localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
  }
}