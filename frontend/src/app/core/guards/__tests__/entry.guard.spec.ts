import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { entryGuard } from '../entry.guard';
import { AuthService } from '../../services/auth.service';

describe('entryGuard', () => {
  let authService: any;
  let router: any;

  beforeEach(() => {
    authService = { isLoggedIn: jest.fn() };
    router = { createUrlTree: jest.fn((commands: string[]) => commands[0] as unknown as UrlTree) };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('sends logged-in users to /home', () => {
    authService.isLoggedIn.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() =>
      entryGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(router.createUrlTree).toHaveBeenCalledWith(['/home']);
    expect(result).toBe('/home');
  });

  it('sends guests to /map', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() =>
      entryGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    expect(router.createUrlTree).toHaveBeenCalledWith(['/map']);
    expect(result).toBe('/map');
  });
});
