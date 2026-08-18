import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { CreateRunComponent } from '../create-run.component';
import { AuthService } from '../../../core/services/auth.service';
import { ClubService } from '../../../core/services/club.service';

describe('CreateRunComponent', () => {
  let component: CreateRunComponent;
  let fixture: ComponentFixture<CreateRunComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CreateRunComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            getUser: jest.fn().mockReturnValue(signal(null)),
            isOrganizer: jest.fn().mockReturnValue(false),
            isLoggedIn: jest.fn().mockReturnValue(false)
          }
        },
        {
          provide: ClubService,
          useValue: { getMyClubs: jest.fn().mockReturnValue([]) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => expect(component).toBeTruthy());

  it('renders the wizard', () => {
    const wizardEl = fixture.nativeElement.querySelector('app-create-run-wizard');
    expect(wizardEl).not.toBeNull();
  });
});
