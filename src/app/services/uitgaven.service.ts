import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Uitgave, UitgaveInvoer } from '../models/uitgave.model';

const COLLECTION = 'uitgaven';

@Injectable({ providedIn: 'root' })
export class UitgavenService {
  private readonly firestore = inject(Firestore);
  private readonly uitgavenRef = collection(this.firestore, COLLECTION);

  private readonly uitgaven$: Observable<Uitgave[]> = collectionData(
    query(this.uitgavenRef, orderBy('aangemaaktOp', 'desc')),
    { idField: 'id' },
  ) as Observable<Uitgave[]>;

  readonly uitgaven = toSignal(this.uitgaven$, { initialValue: [] as Uitgave[] });

  async toevoegen(invoer: UitgaveInvoer): Promise<void> {
    await addDoc(this.uitgavenRef, {
      ...invoer,
      aangemaaktOp: serverTimestamp(),
    });
  }

  async verwijderen(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, COLLECTION, id));
  }
}
