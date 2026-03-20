import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Club, ClubMember } from '../models/run-event.model';

@Injectable({ providedIn: 'root' })
export class ClubService {
    private http = inject(HttpClient);
    private myClubIds = signal<string[]>([]);

    getMyClubIds() { return this.myClubIds; }

    listClubs() { return this.http.get<Club[]>(`${environment.apiUrl}/clubs`); }
    getClub(id: string) { return this.http.get<Club>(`${environment.apiUrl}/clubs/${id}`); }
    getClubRuns(id: string) { return this.http.get<any[]>(`${environment.apiUrl}/clubs/${id}/runs`); }
    getClubMembers(id: string) { return this.http.get<ClubMember[]>(`${environment.apiUrl}/clubs/${id}/members`); }

    createClub(data: { name: string; description?: string; city?: string; pace?: string; tags?: string[] }) {
        return this.http.post<Club>(`${environment.apiUrl}/clubs`, data);
    }

    updateClub(id: string, data: Partial<Club>) {
        return this.http.patch<Club>(`${environment.apiUrl}/clubs/${id}`, data);
    }

    toggleJoin(clubId: string) {
        this.http.post<{ joined: boolean }>(`${environment.apiUrl}/clubs/${clubId}/join`, {}).subscribe(res => {
            const ids = this.myClubIds();
            if (res.joined) {
                this.myClubIds.set([...ids, clubId]);
            } else {
                this.myClubIds.set(ids.filter(id => id !== clubId));
            }
        });
    }

    loadMyClubs() {
        this.http.get<Club[]>(`${environment.apiUrl}/clubs/mine`).subscribe(clubs => {
            this.myClubIds.set(clubs.map(c => c.id));
        });
    }

    getMyClubs() {
        return this.http.get<Club[]>(`${environment.apiUrl}/clubs/owned`);
    }
}