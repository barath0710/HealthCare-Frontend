import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffRegister } from './staff-register';

describe('StaffRegister', () => {
  let component: StaffRegister;
  let fixture: ComponentFixture<StaffRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffRegister],
    }).compileComponents();

    fixture = TestBed.createComponent(StaffRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
