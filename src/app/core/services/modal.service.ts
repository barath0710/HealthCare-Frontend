import { Injectable, signal } from '@angular/core';

export type ModalType = 'booking' | 'schedule' | 'addDoctor' |'addPatient' | 'editPatient' | 'viewPatient' |null;

@Injectable({ providedIn: 'root' })
export class ModalService {
    activeModal = signal<ModalType>(null);
  modalData   = signal<any>(null);

  open(type: ModalType, data?: any): void {
    this.modalData.set(data ?? null);
    this.activeModal.set(type);
  }

  close(): void {
    this.activeModal.set(null);
    this.modalData.set(null);
  }
} 