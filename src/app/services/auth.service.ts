import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const SESSION_KEY = 'reis-uitgaven:auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _ingelogd = signal<boolean>(this.leesSessie());
  readonly ingelogd = this._ingelogd.asReadonly();

  probeerInloggen(pincode: string): boolean {
    const klopt = pincode === environment.pincode;
    if (klopt) {
      sessionStorage.setItem(SESSION_KEY, '1');
      this._ingelogd.set(true);
    }
    return klopt;
  }

  uitloggen(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._ingelogd.set(false);
  }

  private leesSessie(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      return false;
    }
  }
}
