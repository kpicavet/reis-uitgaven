import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ReizenService } from './services/reizen.service';
import { UitgavenService } from './services/uitgaven.service';
import { Pin } from './components/pin/pin';
import { UitgavenLijst } from './components/uitgaven-lijst/uitgaven-lijst';
import { UitgaveForm } from './components/uitgave-form/uitgave-form';
import { ReizenSheet } from './components/reizen-sheet/reizen-sheet';
import { Reis } from './models/reis.model';
import { Uitgave, UitgaveFormInvoer } from './models/uitgave.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Pin, UitgavenLijst, UitgaveForm, ReizenSheet, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly reizenService = inject(ReizenService);
  private readonly uitgavenService = inject(UitgavenService);

  readonly ingelogd = this.auth.ingelogd;
  readonly initieelGeladen = this.auth.initieelGeladen;
  readonly uitgaven = this.uitgavenService.uitgaven;
  readonly actieveReis = this.reizenService.actieveReis;
  readonly heeftReizen = this.reizenService.heeftReizen;
  readonly actieveReisTotalen = computed(() =>
    this.uitgavenService.totalenVoor(this.actieveReis()?.id),
  );

  readonly formOpen = signal(false);
  readonly bewerkenVan = signal<Uitgave | null>(null);
  readonly reizenSheetOpen = signal(false);
  readonly bevestigVerwijderen = signal<Uitgave | null>(null);
  readonly bevestigReisVerwijderen = signal<Reis | null>(null);
  readonly bezig = signal(false);
  readonly fout = signal<string | null>(null);

  readonly reisVerwijderAantal = computed(() =>
    this.uitgavenService.aantalVoor(this.bevestigReisVerwijderen()?.id),
  );

  openForm(): void {
    if (!this.actieveReis()) return;
    this.fout.set(null);
    this.bewerkenVan.set(null);
    this.formOpen.set(true);
  }

  vraagBewerken(uitgave: Uitgave): void {
    this.fout.set(null);
    this.bewerkenVan.set(uitgave);
    this.formOpen.set(true);
  }

  sluitForm(): void {
    this.formOpen.set(false);
    this.bewerkenVan.set(null);
    this.fout.set(null);
  }

  openReizen(): void {
    this.reizenSheetOpen.set(true);
  }

  sluitReizen(): void {
    this.reizenSheetOpen.set(false);
  }

  async opslaan(invoer: UitgaveFormInvoer): Promise<void> {
    const teBewerken = this.bewerkenVan();
    this.bezig.set(true);
    this.fout.set(null);
    try {
      if (teBewerken?.id) {
        await this.uitgavenService.bewerken(teBewerken.id, invoer);
      } else {
        const reis = this.actieveReis();
        if (!reis?.id) {
          this.fout.set('Selecteer eerst een reis.');
          return;
        }
        await this.uitgavenService.toevoegen({ ...invoer, reisId: reis.id });
      }
      this.formOpen.set(false);
      this.bewerkenVan.set(null);
    } catch (e) {
      console.error(e);
      this.fout.set('Opslaan mislukt. Controleer de internetverbinding.');
    } finally {
      this.bezig.set(false);
    }
  }

  vraagBevestiging(uitgave: Uitgave): void {
    this.bevestigVerwijderen.set(uitgave);
  }

  annuleerVerwijderen(): void {
    this.bevestigVerwijderen.set(null);
  }

  async bevestigEnVerwijder(): Promise<void> {
    const uitgave = this.bevestigVerwijderen();
    if (!uitgave?.id) return;
    this.bezig.set(true);
    try {
      await this.uitgavenService.verwijderen(uitgave.id);
      this.bevestigVerwijderen.set(null);
    } catch (e) {
      console.error(e);
      this.fout.set('Verwijderen mislukt. Probeer opnieuw.');
    } finally {
      this.bezig.set(false);
    }
  }

  vraagReisVerwijderen(reis: Reis): void {
    this.bevestigReisVerwijderen.set(reis);
  }

  annuleerReisVerwijderen(): void {
    this.bevestigReisVerwijderen.set(null);
  }

  async bevestigEnVerwijderReis(): Promise<void> {
    const reis = this.bevestigReisVerwijderen();
    if (!reis?.id) return;
    this.bezig.set(true);
    try {
      await this.uitgavenService.cascadeVerwijderReis(reis.id);
      this.bevestigReisVerwijderen.set(null);
    } catch (e) {
      console.error(e);
      this.fout.set('Verwijderen mislukt. Probeer opnieuw.');
    } finally {
      this.bezig.set(false);
    }
  }

  async uitloggen(): Promise<void> {
    await this.auth.uitloggen();
  }
}
