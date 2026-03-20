import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);

  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const result = await firstValueFrom(
        this.http.get<{ lat: number | null; lng: number | null }>(`${environment.apiUrl}/geocode`, {
          params: { address }
        })
      );
      if (result.lat !== null && result.lng !== null) {
        return { lat: result.lat, lng: result.lng };
      }
      return null;
    } catch { return null; }
  }
}