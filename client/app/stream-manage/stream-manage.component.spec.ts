import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamManageComponent } from './stream-manage.component';

describe('StreamManageComponent', () => {
  let component: StreamManageComponent;
  let fixture: ComponentFixture<StreamManageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StreamManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
