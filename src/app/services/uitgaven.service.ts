import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import {
  Uitgave,
  UitgaveFormInvoer,
  UitgaveInvoer,
  ValutaTotaal,
  berekenTotalen,
} from '../models/uitgave.model';
import { ReizenService } from './reizen.service';

const COLLECTION = 'uitgaven';

@Injectable({ providedIn: 'root' })
export class UitgavenService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly reizen = inject(ReizenService);
  private readonly uitgavenRef = collection(this.firestore, COLLECTION);

  private readonly alleUitgaven$: Observable<Uitgave[]> = authState(this.auth).pipe(
    switchMap((user) => {
      if (!user) return of<Uitgave[]>([]);
      return collectionData(
        query(this.uitgavenRef, orderBy('aangemaaktOp', 'desc')),
        { idField: 'id' },
      ) as Observable<Uitgave[]>;
    }),
  );

  private readonly alleUitgaven = toSignal(this.alleUitgaven$, {
    initialValue: [] as Uitgave[],
  });

  readonly uitgaven = computed<Uitgave[]>(() => {
    const reisId = this.reizen.actieveReis()?.id;
    if (!reisId) return [];
    return this.alleUitgaven().filter((u) => u.reisId === reisId);
  });

  readonly totalenPerReis = computed<Map<string, ValutaTotaal[]>>(() => {
    const groepen = new Map<string, Uitgave[]>();
    for (const u of this.alleUitgaven()) {
      if (!u.reisId) continue;
      const arr = groepen.get(u.reisId) ?? [];
      arr.push(u);
      groepen.set(u.reisId, arr);
    }
    const result = new Map<string, ValutaTotaal[]>();
    for (const [reisId, lijst] of groepen) {
      result.set(reisId, berekenTotalen(lijst));
    }
    return result;
  });

  totalenVoor(reisId: string | undefined): ValutaTotaal[] {
    if (!reisId) return [];
    return this.totalenPerReis().get(reisId) ?? [];
  }

  aantalVoor(reisId: string | undefined): number {
    if (!reisId) return 0;
    return this.alleUitgaven().filter((u) => u.reisId === reisId).length;
  }

  async toevoegen(invoer: UitgaveInvoer): Promise<void> {
    await addDoc(this.uitgavenRef, {
      ...invoer,
      aangemaaktOp: serverTimestamp(),
    });
  }

  async bewerken(id: string, invoer: UitgaveFormInvoer): Promise<void> {
    const ref = doc(this.firestore, COLLECTION, id);
    await updateDoc(ref, {
      datum: invoer.datum,
      bedrag: invoer.bedrag,
      valuta: invoer.valuta,
      categorie: invoer.categorie,
      omschrijving: invoer.omschrijving,
    });
  }

  async verwijderen(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, COLLECTION, id));
  }

  async cascadeVerwijderReis(reisId: string): Promise<{ aantalUitgaven: number }> {
    const teVerwijderen = this.alleUitgaven().filter(
      (u) => u.reisId === reisId && !!u.id,
    );
    const batch = writeBatch(this.firestore);
    for (const u of teVerwijderen) {
      batch.delete(doc(this.firestore, COLLECTION, u.id!));
    }
    batch.delete(doc(this.firestore, 'reizen', reisId));
    await batch.commit();
    return { aantalUitgaven: teVerwijderen.length };
  }
}
