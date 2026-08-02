import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { RunEvent, CreateRunPayload, Comment } from '../models/run-event.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RunsService {
  private http = inject(HttpClient);
  private runs = signal<RunEvent[]>([]);
  private joinedRunIds = signal<string[]>([]);

  getRuns() { return this.runs; }
  getJoinedRunIds() { return this.joinedRunIds; }

  mapRun(r: any): RunEvent {
    return {
      id: r.id, clubId: r.club_id, clubName: r.club_name, title: r.title,
      startLocation: { lat: parseFloat(r.start_lat), lng: parseFloat(r.start_lng) },
      endLocation: { lat: parseFloat(r.end_lat), lng: parseFloat(r.end_lng) },
      startAddress: r.start_address, endAddress: r.end_address,
      date: new Date(r.event_date), distanceKm: parseFloat(r.distance_km),
      estimatedMinutes: r.estimated_minutes, attendees: r.attendees ?? [],
      maxAttendees: r.max_attendees, notes: r.notes,
      status: r.status, createdBy: r.created_by,
      pace: r.pace, tags: r.tags,
      runType: r.run_type,
      club_name: r.club_name, club_created_at: r.club_created_at,
      distanceFromUserKm: r.distance_miles !== undefined
        ? parseFloat((r.distance_miles * 1.60934).toFixed(2))
        : undefined
    };
  }

  loadRuns(params?: {
    search?: string; distance_min?: number; date?: string; city?: string;
    pace?: string; trending?: boolean; tags?: string; club_ids?: string;
    run_type?: string;
  }) {
    const queryParams: any = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.distance_min) queryParams.distance_min = params.distance_min;
    if (params?.date) queryParams.date = params.date;
    if (params?.city) queryParams.city = params.city;
    if (params?.pace) queryParams.pace = params.pace;
    if (params?.trending) queryParams.trending = 1;
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.club_ids) queryParams.club_ids = params.club_ids;
    if (params?.run_type) queryParams.run_type = params.run_type;
    return this.http.get<any[]>(`${environment.apiUrl}/runs`, { params: queryParams }).subscribe(data => {
      this.runs.set(data.map(r => this.mapRun(r)));
    });
  }

  fetchRuns(params?: {
    search?: string; distance_min?: number; date?: string; city?: string;
    pace?: string; trending?: boolean; tags?: string; club_ids?: string;
    date_from?: string; date_to?: string; run_type?: string;
  }) {
    const queryParams: any = {};
    if (params?.search) queryParams.search = params.search;
    if (params?.distance_min) queryParams.distance_min = params.distance_min;
    if (params?.date) queryParams.date = params.date;
    if (params?.city) queryParams.city = params.city;
    if (params?.pace) queryParams.pace = params.pace;
    if (params?.trending) queryParams.trending = 1;
    if (params?.tags) queryParams.tags = params.tags;
    if (params?.club_ids) queryParams.club_ids = params.club_ids;
    if (params?.date_from) queryParams.date_from = params.date_from;
    if (params?.date_to) queryParams.date_to = params.date_to;
    if (params?.run_type) queryParams.run_type = params.run_type;
    return this.http.get<any[]>(`${environment.apiUrl}/runs`, { params: queryParams }).pipe(
      map(data => data.map(r => this.mapRun(r)))
    );
  }

  getNearbyRuns(lat: number, lng: number, limit = 3) {
    return this.http.get<any[]>(`${environment.apiUrl}/runs/nearby`, {
      params: { lat, lng, limit }
    }).pipe(map(data => data.map(r => this.mapRun(r))));
  }

  getMyRuns() { return this.http.get<any[]>(`${environment.apiUrl}/runs/mine`); }
  getJoinedRuns() { return this.http.get<any[]>(`${environment.apiUrl}/runs/joined`); }
  getRunById(id: string) { return this.http.get<any>(`${environment.apiUrl}/runs/${id}`); }

  getAttendees(runId: string) {
    return this.http.get<{ id: string; display_name: string; joined_at: string; has_verified_pace: boolean }[]>(`${environment.apiUrl}/runs/${runId}/attendees`);
  }

  toggleJoin(runId: string, userId: string) {
    this.http.post<{ joined: boolean }>(`${environment.apiUrl}/runs/${runId}/join`, {}).subscribe(res => {
      const joined = this.joinedRunIds();
      if (res.joined) {
        this.joinedRunIds.set([...joined, runId]);
        this.runs.update(runs => runs.map(r => r.id === runId
          ? { ...r, attendees: [...r.attendees, { id: userId, display_name: '' }] }
          : r));
      } else {
        this.joinedRunIds.set(joined.filter(id => id !== runId));
        this.runs.update(runs => runs.map(r => r.id === runId
          ? { ...r, attendees: r.attendees.filter(a => a.id !== userId) }
          : r));
      }
    });
  }

  getNextRunByClub(clubId: string, excludeRunId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/runs`, { params: { club_id: clubId } }).pipe(
      map(data => data.map(r => this.mapRun(r))
        .filter(r => r.id !== excludeRunId && new Date(r.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        [0] ?? null
      )
    );
  }

  getUserProfile(userId: string) {
    return this.http.get<{
      id: string;
      display_name: string;
      total_runs: number;
      total_distance_km: number;
      favorite_pace: string | null;
      verified_pace: number | null;
      recent_runs: { id: string; title: string; club_name: string; distance_km: number; pace: string | null; attended_date: string; strava_activity_id: number | null }[];
    }>(`${environment.apiUrl}/users/${userId}/profile`);
  }

  linkStravaActivity(runId: string, payload: {
    strava_activity_id: number;
    strava_distance: number;
    strava_moving_time: number;
    strava_average_speed: number;
    strava_polyline: string | null;
  }) {
    return this.http.post<{ success: boolean; data: any }>(`${environment.apiUrl}/runs/${runId}/link-strava`, payload);
  }

  getComments(runId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/runs/${runId}/comments`).pipe(
      map(data => data.map(c => ({
        id: c.id, runId: c.run_id, userId: c.user_id, content: c.content,
        displayName: c.display_name, avatarUrl: c.avatar_url,
        createdAt: new Date(c.created_at)
      } as Comment)))
    );
  }

  postComment(runId: string, content: string) {
    return this.http.post<any>(`${environment.apiUrl}/runs/${runId}/comments`, { content }).pipe(
      map(c => ({
        id: c.id, runId: c.run_id, userId: c.user_id, content: c.content,
        displayName: c.display_name, avatarUrl: c.avatar_url,
        createdAt: new Date(c.created_at)
      } as Comment))
    );
  }

  createRun(payload: CreateRunPayload) { return this.http.post<any>(`${environment.apiUrl}/runs`, payload); }
  updateRun(id: string, payload: any) { return this.http.patch<any>(`${environment.apiUrl}/runs/${id}`, payload); }
  deleteRun(id: string) { return this.http.delete<any>(`${environment.apiUrl}/runs/${id}`); }
  cancelRun(id: string) { return this.http.patch<any>(`${environment.apiUrl}/runs/${id}`, { status: 'cancelled' }); }

  formatDate(date: Date): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const diff = d.getTime() - Date.now();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
