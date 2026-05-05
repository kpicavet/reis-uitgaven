import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, signInWithCustomToken, signOut, user } from '@angular/fire/auth';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

interface VerifyResultaat {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly functions = inject(Functions);

  private readonly user$ = user(this.auth);
  private readonly _gebruiker = signal<unknown>(null);
  private readonly _initieelGeladen = signal(false);

  readonly ingelogd = computed(() => this._gebruiker() !== null);
  readonly initieelGeladen = this._initieelGeladen.asReadonly();

  constructor() {
    this.user$.subscribe((u) => {
      this._gebruiker.set(u);
      this._initieelGeladen.set(true);
    });
  }

  async probeerInloggen(pincode: string): Promise<{ ok: true } | { ok: false; reden: string }> {
    try {
      const verify = httpsCallable<{ pin: string }, VerifyResultaat>(this.functions, 'verifyPin');
      const resultaat = await verify({ pin: pincode });
      const credential = await signInWithCustomToken(this.auth, resultaat.data.token);
      const tokenResult = await credential.user.getIdTokenResult(true);
      console.log('[DEBUG] Token claims na inloggen:', tokenResult.claims);
      console.log('[DEBUG] verified claim:', tokenResult.claims['verified']);
      return { ok: true };
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      if (code.includes('resource-exhausted')) {
        return { ok: false, reden: 'Te veel pogingen — probeer over een uur opnieuw.' };
      }
      if (code.includes('permission-denied')) {
        return { ok: false, reden: 'Onjuiste pincode.' };
      }
      return { ok: false, reden: 'Inloggen mislukt. Controleer je verbinding.' };
    }
  }

  async uitloggen(): Promise<void> {
    await signOut(this.auth);
  }

  async wachtTotKlaar(): Promise<void> {
    if (this._initieelGeladen()) return;
    await firstValueFrom(this.user$);
  }
}
