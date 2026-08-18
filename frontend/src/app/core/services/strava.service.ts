import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StravaActivity } from '../models/run-event.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StravaService {
  private http = inject(HttpClient);

  getActivities() {
    return this.http.get<StravaActivity[]>(`${environment.apiUrl}/users/strava/activities`);
  }
}
