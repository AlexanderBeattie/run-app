import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KlubUser } from '../models/run-event.model';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: KlubUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private currentUser = signal<KlubUser | null>(this.loadFromStorage());

  private loadFromStorage(): KlubUser | null {
    try {
      const token = localStorage.getItem('klub_token');
      const user = localStorage.getItem('klub_user');
      if (token && user) return JSON.parse(user);
    } catch {}
    return null;
  }

  getUser() { return this.currentUser; }
  isLoggedIn() { return this.currentUser() !== null; }
  isOrganizer() { return this.currentUser()?.role === 'organizer'; }
  getToken() { return localStorage.getItem('klub_token'); }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('klub_token_expiry');
    if (!expiry) return false;
    return Date.now() > parseInt(expiry, 10) - 60_000; // 60s buffer
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.setSession(res))) as any;
  }

  register(displayName: string, email: string, password: string, role: 'runner' | 'organizer') {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { displayName, email, password, role })
      .pipe(tap(res => this.setSession(res))) as any;
  }

  refresh(): Observable<{ token: string; expiresIn: number }> {
    const refreshToken = localStorage.getItem('klub_refresh_token');
    if (!refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http.post<{ token: string; expiresIn: number }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(tap(res => {
        localStorage.setItem('klub_token', res.token);
        localStorage.setItem('klub_token_expiry', String(Date.now() + res.expiresIn * 1000));
      }));
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem('klub_token', res.token);
    localStorage.setItem('klub_user', JSON.stringify(res.user));
    if (res.refreshToken) {
      localStorage.setItem('klub_refresh_token', res.refreshToken);
    }
    if (res.expiresIn) {
      localStorage.setItem('klub_token_expiry', String(Date.now() + res.expiresIn * 1000));
    }
    this.currentUser.set(res.user);
  }

  setStravaConnected() {
    const user = this.currentUser();
    if (!user) return;
    const updated = { ...user, stravaConnected: true };
    localStorage.setItem('klub_user', JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  logout() {
    const refreshToken = localStorage.getItem('klub_refresh_token');
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({ error: () => {} });
    }
    localStorage.removeItem('klub_token');
    localStorage.removeItem('klub_refresh_token');
    localStorage.removeItem('klub_token_expiry');
    localStorage.removeItem('klub_user');
    this.currentUser.set(null);
  }
}
