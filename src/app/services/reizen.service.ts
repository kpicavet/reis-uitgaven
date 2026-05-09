import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  deleteField,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { Reis, ReisInvoer, kiesAutomatischeReis } from '../models/reis.model';

const COLLECTION = 'reizen';
const STORAGE_KEY = 'reis-uitgaven:actieveReisId';

@Injectable({ providedIn: 'root' })
export class ReizenService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly reizenRef = collection(this.firestore, COLLECTION);

  private readonly _actieveReisId = signal<string | null>(this.leesUitStorage());

  private readonly reizen$: Observable<Reis[]> = authState(this.auth).pipe(
    switchMap((user) => {
      if (!user) return of<Reis[]>([]);
      return collectionData(query(this.reizenRef, orderBy('startDatum', 'desc')), {
        idField: 'id',
      }) as Observable<Reis[]>;
    }),
  );

  readonly reizen = toSignal(this.reizen$, { initialValue: [] as Reis[] });

  readonly actieveReisId = this._actieveReisId.asReadonly();

  readonly actieveReis = computed<Reis | null>(() => {
    const id = this._actieveReisId();
    const lijst = this.reizen();
    if (id) {
      const gevonden = lijst.find((r) => r.id === id);
      if (gevonden) return gevonden;
    }
    return kiesAutomatischeReis(lijst);
  });

  readonly heeftReizen = computed(() => this.reizen().length > 0);

  constructor() {
    effect(() => {
      const id = this.actieveReis()?.id ?? null;
      const opgeslagen = this._actieveReisId();
      if (id !== opgeslagen) {
        this._actieveReisId.set(id);
      }
      this.schrijfNaarStorage(id);
    });
  }

  kies(id: string | null): void {
    this._actieveReisId.set(id);
  }

  async toevoegen(invoer: ReisInvoer): Promise<string> {
    const ref = await addDoc(this.reizenRef, {
      naam: invoer.naam,
      startDatum: invoer.startDatum,
      ...(invoer.eindDatum ? { eindDatum: invoer.eindDatum } : {}),
      archief: invoer.archief,
      aangemaaktOp: serverTimestamp(),
    });
    return ref.id;
  }

  async bewerken(id: string, invoer: ReisInvoer): Promise<void> {
    const ref = doc(this.firestore, COLLECTION, id);
    await updateDoc(ref, {
      naam: invoer.naam,
      startDatum: invoer.startDatum,
      eindDatum: invoer.eindDatum ?? deleteField(),
      archief: invoer.archief,
    });
  }

  async verwijderen(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, COLLECTION, id));
  }

  private leesUitStorage(): string | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private schrijfNaarStorage(id: string | null): void {
    if (typeof localStorage === 'undefined') return;
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, id);
      }
    } catch {
      // private mode of geen quota — negeren
    }
  }
}
