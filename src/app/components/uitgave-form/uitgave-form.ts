import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CATEGORIEEN,
  Categorie,
  Uitgave,
  UitgaveFormInvoer,
  VALUTAS,
  Valuta,
} from '../../models/uitgave.model';

function vandaagISO(): string {
  const d = new Date();
  const jaar = d.getFullYear();
  const maand = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${jaar}-${maand}-${dag}`;
}

function klampDatum(datum: string, min: string | null, max: string | null): string {
  if (min && datum < min) return min;
  if (max && datum > max) return max;
  return datum;
}

@Component({
  selector: 'app-uitgave-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './uitgave-form.html',
  styleUrl: './uitgave-form.scss',
})
export class UitgaveForm {
  readonly bezig = input(false);
  readonly bewerkenVan = input<Uitgave | null>(null);
  readonly minDatum = input<string | null>(null);
  readonly maxDatum = input<string | null>(null);
  readonly opgeslagen = output<UitgaveFormInvoer>();
  readonly gesloten = output<void>();

  protected readonly valutas = VALUTAS;
  protected readonly categorieen = CATEGORIEEN;
  protected readonly datum = signal<string>(vandaagISO());
  protected readonly bedrag = signal<string>('');
  protected readonly valuta = signal<Valuta>('EUR');
  protected readonly categorie = signal<Categorie>('eten');
  protected readonly omschrijving = signal<string>('');
  protected readonly raakBedrag = signal(false);

  protected readonly modus = computed<'nieuw' | 'bewerken'>(() =>
    this.bewerkenVan() ? 'bewerken' : 'nieuw',
  );

  constructor() {
    effect(() => {
      const u = this.bewerkenVan();
      if (u) {
        this.datum.set(u.datum);
        this.bedrag.set(u.bedrag.toString().replace('.', ','));
        this.valuta.set(u.valuta);
        this.categorie.set(u.categorie ?? 'overig');
        this.omschrijving.set(u.omschrijving ?? '');
        this.raakBedrag.set(false);
      } else {
        this.datum.set(klampDatum(vandaagISO(), this.minDatum(), this.maxDatum()));
      }
    });
  }

  protected readonly bedragNummer = computed<number | null>(() => {
    const ruw = this.bedrag().replace(',', '.').trim();
    if (!ruw) return null;
    const n = Number(ruw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100) / 100;
  });

  protected readonly datumGeldig = computed(() => {
    const d = this.datum();
    if (!d) return false;
    const min = this.minDatum();
    const max = this.maxDatum();
    if (min && d < min) return false;
    if (max && d > max) return false;
    return true;
  });

  protected readonly geldig = computed(
    () => this.bedragNummer() !== null && this.datumGeldig(),
  );

  setBedrag(waarde: string): void {
    this.bedrag.set(waarde);
  }

  setDatum(waarde: string): void {
    this.datum.set(waarde);
  }

  setValuta(waarde: Valuta): void {
    this.valuta.set(waarde);
  }

  setCategorie(waarde: Categorie): void {
    this.categorie.set(waarde);
  }

  setOmschrijving(waarde: string): void {
    this.omschrijving.set(waarde);
  }

  markeerBedragAangeraakt(): void {
    this.raakBedrag.set(true);
  }

  opslaan(): void {
    this.raakBedrag.set(true);
    const n = this.bedragNummer();
    if (n === null) return;
    this.opgeslagen.emit({
      datum: this.datum(),
      bedrag: n,
      valuta: this.valuta(),
      categorie: this.categorie(),
      omschrijving: this.omschrijving().trim(),
    });
  }

  sluiten(): void {
    this.gesloten.emit();
  }

  achtergrond(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.sluiten();
    }
  }
}
