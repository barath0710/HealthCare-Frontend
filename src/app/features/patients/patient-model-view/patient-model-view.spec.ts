import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientModelView } from './patient-model-view';

describe('PatientModelView', () => {
  let component: PatientModelView;
  let fixture: ComponentFixture<PatientModelView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientModelView],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientModelView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
