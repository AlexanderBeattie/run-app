import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KlubUser } from '../models/run-event.model';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

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

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: KlubUser }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.setSession(res))) as any;
  }

  register(displayName: string, email: string, password: string, role: 'runner' | 'organizer') {
    return this.http.post<{ token: string; user: KlubUser }>(`${environment.apiUrl}/auth/register`, { displayName, email, password, role })
      .pipe(tap(res => this.setSession(res))) as any;
  }

  private setSession(res: { token: string; user: KlubUser }) {
    localStorage.setItem('klub_token', res.token);
    localStorage.setItem('klub_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  logout() {
    localStorage.removeItem('klub_token');
    localStorage.removeItem('klub_user');
    this.currentUser.set(null);
  }
}