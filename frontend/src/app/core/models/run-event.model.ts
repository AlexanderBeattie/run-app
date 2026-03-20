export type UserRole = 'runner' | 'organizer';
export interface Coordinates { lat: number; lng: number; }
export interface RunEvent {
  id: string; clubId: string; clubName: string; title: string;
  startLocation: Coordinates; endLocation: Coordinates;
  startAddress: string; endAddress: string;
  date: Date; distanceKm: number; estimatedMinutes: number;
  attendees: string[]; maxAttendees?: number; notes?: string;
  status?: string; createdBy?: string;
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
}