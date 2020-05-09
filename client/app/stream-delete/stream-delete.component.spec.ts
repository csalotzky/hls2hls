import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StreamDeleteComponent } from './stream-delete.component';

describe('StreamDeleteComponent', () => {
  let component: StreamDeleteComponent;
  let fixture: ComponentFixture<StreamDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StreamDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StreamDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
