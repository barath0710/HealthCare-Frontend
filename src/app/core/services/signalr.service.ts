import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { NewBookingNotification, StatusChangedNotification } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private connection: signalR.HubConnection | null = null;

  newBooking$        = new Subject<NewBookingNotification>();
  statusChanged$     = new Subject<StatusChangedNotification>();
  rescheduled$       = new Subject<any>();
  cancelled$         = new Subject<any>();
  connectionStatus$  = new Subject<'connected' | 'disconnected' | 'reconnecting'>();

  constructor(private authService: AuthService) {}

  async connect(): Promise<void> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        accessTokenFactory: () => this.authService.getToken() ?? ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('NewBooking',           (d: NewBookingNotification)    => this.newBooking$.next(d));
    this.connection.on('StatusChanged',        (d: StatusChangedNotification) => this.statusChanged$.next(d));
    this.connection.on('Rescheduled',          (d: any)                       => this.rescheduled$.next(d));
    this.connection.on('AppointmentCancelled', (d: any)                       => this.cancelled$.next(d));

    this.connection.onreconnecting(() => this.connectionStatus$.next('reconnecting'));
    this.connection.onreconnected(() => this.connectionStatus$.next('connected'));
    this.connection.onclose(() => this.connectionStatus$.next('disconnected'));

    try {
      await this.connection.start();
      this.connectionStatus$.next('connected');
    } catch {
      this.connectionStatus$.next('disconnected');
    }
  }

  async disconnect(): Promise<void> {
    await this.connection?.stop();
    this.connection = null;
  }

  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}