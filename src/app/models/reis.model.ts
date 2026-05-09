import { Timestamp } from '@angular/fire/firestore';

export interface Reis {
  id?: string;
  naam: string;
  startDatum: string;
  eindDatum?: string;
  archief: boolean;
  aangemaaktOp?: Timestamp;
}

export interface ReisInvoer {
  naam: string;
  startDatum: string;
  eindDatum: string | null;
  archief: boolean;
}

export function reisLooptOpDatum(reis: Reis, isoDatum: string): boolean {
  if (isoDatum < reis.startDatum) return false;
  if (reis.eindDatum && isoDatum > reis.eindDatum) return false;
  return true;
}

export function kiesAutomatischeReis(reizen: readonly Reis[]): Reis | null {
  if (reizen.length === 0) return null;
  const vandaag = new Date().toISOString().slice(0, 10);
  const lopend = reizen.find((r) => !r.archief && reisLooptOpDatum(r, vandaag));
  if (lopend) return lopend;
  const nietGearchiveerd = reizen.filter((r) => !r.archief);
  const kandidaten = nietGearchiveerd.length > 0 ? nietGearchiveerd : reizen;
  return [...kandidaten].sort((a, b) => (a.startDatum < b.startDatum ? 1 : -1))[0] ?? null;
}
