import { Injectable } from '@angular/core';
import { Coordinates } from '../models/run-event.model';

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly EARTH_RADIUS_KM = 6371;

  calculateDistance(a: Coordinates, b: Coordinates): number {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinHalfLat = Math.sin(dLat / 2);
    const sinHalfLng = Math.sin(dLng / 2);
    const h = sinHalfLat * sinHalfLat +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
      sinHalfLng * sinHalfLng;
    return this.EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  milesToKilometers(miles: number): number {
    return miles * 1.60934;
  }
}
