import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestcameraPage } from './testcamera.page';

describe('TestcameraPage', () => {
  let component: TestcameraPage;
  let fixture: ComponentFixture<TestcameraPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TestcameraPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
