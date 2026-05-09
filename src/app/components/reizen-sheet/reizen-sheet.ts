import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Reis, ReisInvoer } from '../../models/reis.model';
import { ValutaTotaal } from '../../models/uitgave.model';
import { ReizenService } from '../../services/reizen.service';
import { UitgavenService } from '../../services/uitgaven.service';

type Modus = 'lijst' | 'form';

@Component({
  selector: 'app-reizen-sheet',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reizen-sheet.html',
  styleUrl: './reizen-sheet.scss',
})
export class ReizenSheet {
  private readonly reizen = inject(ReizenService);
  private readonly uitgaven = inject(UitgavenService);

  readonly gesloten = output<void>();
  readonly verwijderAangevraagd = output<Reis>();

  protected readonly modus = signal<Modus>('lijst');
  protected readonly bewerkenVan = signal<Reis | null>(null);
  protected readonly toonArchief = signal(false);
  protected readonly bezig = signal(false);
  protected readonly fout = signal<string | null>(null);

  protected readonly naam = signal('');
  protected readonly startDatum = signal('');
  protected readonly eindDatum = signal('');
  protected readonly archief = signal(false);

  protected readonly actieveReisId = this.reizen.actieveReisId;

  protected readonly reizenLijst = computed<Reis[]>(() => {
    const alle = this.reizen.reizen();
    return this.toonArchief() ? alle : alle.filter((r) => !r.archief);
  });

  protected readonly heeftGearchiveerd = computed(() =>
    this.reizen.reizen().some((r) => r.archief),
  );

  protected readonly totalenPerReis = this.uitgaven.totalenPerReis;

  constructor() {
    effect(() => {
      const teBewerken = this.bewerkenVan();
      if (!teBewerken?.id) return;
      const bestaat = this.reizen.reizen().some((r) => r.id === teBewerken.id);
      if (!bestaat) {
        this.bewerkenVan.set(null);
        this.modus.set('lijst');
      }
    });
  }

  protected totalenVoor(reisId: string | undefined): ValutaTotaal[] {
    if (!reisId) return [];
    return this.totalenPerReis().get(reisId) ?? [];
  }

  protected readonly geldig = computed(() => {
    if (!this.naam().trim()) return false;
    if (!this.startDatum()) return false;
    const eind = this.eindDatum();
    if (eind && eind < this.startDatum()) return false;
    return true;
  });

  sluit(): void {
    this.gesloten.emit();
  }

  achtergrond(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.sluit();
    }
  }

  kies(reis: Reis): void {
    if (!reis.id) return;
    this.reizen.kies(reis.id);
    this.sluit();
  }

  startNieuw(): void {
    this.zetForm(null);
  }

  startBewerken(reis: Reis): void {
    this.zetForm(reis);
  }

  annuleerForm(): void {
    this.modus.set('lijst');
    this.bewerkenVan.set(null);
    this.fout.set(null);
  }

  toggleArchief(): void {
    this.toonArchief.update((v) => !v);
  }

  async opslaan(): Promise<void> {
    if (!this.geldig() || this.bezig()) return;
    if (this.modus() !== 'form') return;

    this.bezig.set(true);
    this.fout.set(null);
    const invoer: ReisInvoer = {
      naam: this.naam().trim(),
      startDatum: this.startDatum(),
      eindDatum: this.eindDatum() || null,
      archief: this.archief(),
    };

    try {
      const teBewerken = this.bewerkenVan();
      if (teBewerken?.id) {
        await this.reizen.bewerken(teBewerken.id, invoer);
      } else {
        const id = await this.reizen.toevoegen(invoer);
        this.reizen.kies(id);
      }
      this.annuleerForm();
    } catch (e) {
      console.error(e);
      this.fout.set('Opslaan mislukt. Controleer de internetverbinding.');
    } finally {
      this.bezig.set(false);
    }
  }

  vraagVerwijderen(): void {
    const reis = this.bewerkenVan();
    if (!reis?.id) return;
    this.verwijderAangevraagd.emit(reis);
  }

  protected formTitel(): string {
    if (this.modus() !== 'form') return '';
    return this.bewerkenVan() ? 'Reis bewerken' : 'Nieuwe reis';
  }

  protected isBewerken(): boolean {
    return this.modus() === 'form' && this.bewerkenVan() !== null;
  }

  setNaam(v: string): void {
    this.naam.set(v);
  }

  setStartDatum(v: string): void {
    this.startDatum.set(v);
  }

  setEindDatum(v: string): void {
    this.eindDatum.set(v);
  }

  toggleVeldArchief(): void {
    this.archief.update((v) => !v);
  }

  protected formatteerDatums(reis: Reis): string {
    const start = this.formatteerKortNL(reis.startDatum);
    if (!reis.eindDatum) return `vanaf ${start}`;
    const eind = this.formatteerKortNL(reis.eindDatum);
    return `${start} – ${eind}`;
  }

  private formatteerKortNL(iso: string): string {
    const [j, m, d] = iso.split('-').map(Number);
    if (!j || !m || !d) return iso;
    const dt = new Date(j, m - 1, d);
    return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private zetForm(reis: Reis | null): void {
    this.fout.set(null);
    this.naam.set(reis?.naam ?? '');
    this.startDatum.set(reis?.startDatum ?? new Date().toISOString().slice(0, 10));
    this.eindDatum.set(reis?.eindDatum ?? '');
    this.archief.set(reis?.archief ?? false);
    this.bewerkenVan.set(reis);
    this.modus.set('form');
  }
}
