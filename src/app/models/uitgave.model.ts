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

export interface Uitgave {
  id?: string;
  datum: string;
  bedrag: number;
  valuta: Valuta;
  omschrijving: string;
  aangemaaktOp?: Timestamp;
}

export type UitgaveInvoer = Omit<Uitgave, 'id' | 'aangemaaktOp'>;
