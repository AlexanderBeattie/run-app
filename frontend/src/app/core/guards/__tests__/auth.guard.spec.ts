import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from '../auth.guard';
import { AuthService } from '../../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authService: any;
  let router: any;

  beforeEach(() => {
    authService = { isLoggedIn: jest.fn() };
    router = { navigate: jest.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows access when logged in', () => {
    authService.isLoggedIn.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirects to login when not logged in', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});