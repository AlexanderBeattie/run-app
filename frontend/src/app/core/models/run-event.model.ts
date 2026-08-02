export interface Comment {
  id: string; runId: string; userId: string; content: string;
  displayName: string; avatarUrl?: string; createdAt: Date;
}
export type UserRole = 'runner' | 'organizer';
export type PaceCategory = 'easy' | 'social' | 'moderate' | 'tempo' | 'fast';
export interface Coordinates { lat: number; lng: number; }
export interface RunEvent {
  id: string; clubId: string; clubName: string; title: string;
  startLocation: Coordinates; endLocation: Coordinates;
  startAddress: string; endAddress: string;
  date: Date; distanceKm: number; estimatedMinutes: number;
  attendees: { id: string; display_name: string }[]; maxAttendees?: number; notes?: string;
  status?: string; createdBy?: string;
  pace?: PaceCategory; tags?: string[];
  runType?: string;
  club_name?: string; club_created_at?: string;
  strava_polyline?: string;
  distanceFromUserKm?: number;
}
export interface KlubUser {
  id: string; displayName: string; email: string;
  role: UserRole; clubId?: string;
  stravaConnected: boolean; joinedRunIds: string[];
}
export interface CreateRunPayload {
  clubId: string | null; clubName: string; title: string;
  startLocation: Coordinates; endLocation: Coordinates;
  startAddress: string; endAddress: string;
  date: any; distanceKm: number; estimatedMinutes: number;
  maxAttendees?: number; notes?: string;
  pace?: PaceCategory; tags?: string[];
  runType?: string;
}
export interface Club {
  id: string; name: string; description: string;
  owner_id: string; city?: string; pace?: PaceCategory;
  tags?: string[]; logo_url?: string; color?: string;
  member_count: number; active_run_count?: number; total_runs_count?: number;
  next_run_date?: string; created_at: string;
}
export interface ClubMember {
  id: string; display_name: string;
  role: string; joined_at: string;
}
export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  average_speed: number;
  start_date_local: string;
  polyline: string | null;
  type: string;
}