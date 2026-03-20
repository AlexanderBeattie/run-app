import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { organizerGuard } from '../organizer.guard';
import { AuthService } from '../../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { signal } from '@angular/core';

describe('organizerGuard', () => {
  let authService: any;
  let router: any;

  beforeEach(() => {
    authService = { isLoggedIn: jest.fn(), getUser: jest.fn() };
    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('redirects to login if not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      organizerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('redirects to home if runner tries to access organizer route', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.getUser.mockReturnValue(signal({ role: 'runner' }));
    const result = TestBed.runInInjectionContext(() =>
      organizerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('allows access for organizer', () => {
    authService.isLoggedIn.mockReturnValue(true);
    authService.getUser.mockReturnValue(signal({ role: 'organizer' }));
    const result = TestBed.runInInjectionContext(() =>
      organizerGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
  });
});