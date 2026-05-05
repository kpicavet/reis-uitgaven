import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UitgaveInvoer, VALUTAS, Valuta } from '../../models/uitgave.model';

function vandaagISO(): string {
  const d = new Date();
  const jaar = d.getFullYear();
  const maand = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${jaar}-${maand}-${dag}`;
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
  readonly opgeslagen = output<UitgaveInvoer>();
  readonly gesloten = output<void>();

  protected readonly valutas = VALUTAS;
  protected readonly datum = signal<string>(vandaagISO());
  protected readonly bedrag = signal<string>('');
  protected readonly valuta = signal<Valuta>('EUR');
  protected readonly omschrijving = signal<string>('');
  protected readonly raakBedrag = signal(false);

  protected readonly bedragNummer = computed<number | null>(() => {
    const ruw = this.bedrag().replace(',', '.').trim();
    if (!ruw) return null;
    const n = Number(ruw);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100) / 100;
  });

  protected readonly geldig = computed(() => this.bedragNummer() !== null && !!this.datum());

  setBedrag(waarde: string): void {
    this.bedrag.set(waarde);
  }

  setDatum(waarde: string): void {
    this.datum.set(waarde);
  }

  setValuta(waarde: Valuta): void {
    this.valuta.set(waarde);
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
