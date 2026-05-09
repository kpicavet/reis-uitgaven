import { Timestamp } from '@angular/fire/firestore';

export type Valuta =
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'TRY'
  | 'THB'
  | 'JPY'
  | 'MAD'
  | 'AED'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'MXN';

export interface ValutaInfo {
  code: Valuta;
  symbool: string;
  naam: string;
}

export const VALUTAS: readonly ValutaInfo[] = [
  { code: 'EUR', symbool: '€', naam: 'Euro' },
  { code: 'USD', symbool: '$', naam: 'US Dollar' },
  { code: 'GBP', symbool: '£', naam: 'Britse Pond' },
  { code: 'TRY', symbool: '₺', naam: 'Turkse Lira' },
  { code: 'THB', symbool: '฿', naam: 'Thaise Baht' },
  { code: 'JPY', symbool: '¥', naam: 'Japanse Yen' },
  { code: 'MAD', symbool: 'DH', naam: 'Marokkaanse Dirham' },
  { code: 'AED', symbool: 'د.إ', naam: 'VAE Dirham' },
  { code: 'PLN', symbool: 'zł', naam: 'Poolse Zloty' },
  { code: 'CZK', symbool: 'Kč', naam: 'Tsjechische Kroon' },
  { code: 'HUF', symbool: 'Ft', naam: 'Hongaarse Forint' },
  { code: 'MXN', symbool: 'Mex$', naam: 'Mexicaanse Peso' },
] as const;

const VALUTA_INDEX: Record<Valuta, ValutaInfo> = VALUTAS.reduce((acc, v) => {
  acc[v.code] = v;
  return acc;
}, {} as Record<Valuta, ValutaInfo>);

export function valutaSymbool(code: Valuta): string {
  return VALUTA_INDEX[code]?.symbool ?? code;
}

export interface ValutaTotaal {
  valuta: Valuta;
  bedrag: number;
  symbool: string;
}

export function berekenTotalen(uitgaven: Iterable<{ valuta: Valuta; bedrag: number }>): ValutaTotaal[] {
  const map = new Map<Valuta, number>();
  for (const u of uitgaven) {
    map.set(u.valuta, (map.get(u.valuta) ?? 0) + u.bedrag);
  }
  return Array.from(map.entries()).map(([valuta, bedrag]) => ({
    valuta,
    bedrag,
    symbool: valutaSymbool(valuta),
  }));
}

export type Categorie =
  | 'eten'
  | 'vervoer'
  | 'verblijf'
  | 'activiteit'
  | 'shopping'
  | 'overig';

export interface CategorieInfo {
  code: Categorie;
  label: string;
  icoon: string;
}

export const CATEGORIEEN: readonly CategorieInfo[] = [
  { code: 'eten', label: 'Eten', icoon: '🍽️' },
  { code: 'vervoer', label: 'Vervoer', icoon: '🚕' },
  { code: 'verblijf', label: 'Verblijf', icoon: '🏨' },
  { code: 'activiteit', label: 'Activiteit', icoon: '🎟️' },
  { code: 'shopping', label: 'Shopping', icoon: '🛍️' },
  { code: 'overig', label: 'Overig', icoon: '✦' },
] as const;

const CATEGORIE_FALLBACK: CategorieInfo = CATEGORIEEN[CATEGORIEEN.length - 1];
const CATEGORIE_INDEX: Record<Categorie, CategorieInfo> = CATEGORIEEN.reduce(
  (acc, c) => {
    acc[c.code] = c;
    return acc;
  },
  {} as Record<Categorie, CategorieInfo>,
);

export function categorieInfo(code: Categorie | undefined): CategorieInfo {
  if (!code) return CATEGORIE_FALLBACK;
  return CATEGORIE_INDEX[code] ?? CATEGORIE_FALLBACK;
}

export interface Uitgave {
  id?: string;
  datum: string;
  bedrag: number;
  valuta: Valuta;
  categorie?: Categorie;
  omschrijving: string;
  reisId?: string;
  aangemaaktOp?: Timestamp;
}

export interface UitgaveInvoer {
  datum: string;
  bedrag: number;
  valuta: Valuta;
  categorie: Categorie;
  omschrijving: string;
  reisId: string;
}

export type UitgaveFormInvoer = Omit<UitgaveInvoer, 'reisId'>;
