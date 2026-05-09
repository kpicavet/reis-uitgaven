import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AuthService } from './services/auth.service';
import { UitgavenService } from './services/uitgaven.service';
import { Pin } from './components/pin/pin';
import { UitgavenLijst } from './components/uitgaven-lijst/uitgaven-lijst';
import { UitgaveForm } from './components/uitgave-form/uitgave-form';
import { Uitgave } from './models/uitgave.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Pin, UitgavenLijst, UitgaveForm, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly uitgavenService = inject(UitgavenService);

  readonly ingelogd = this.auth.ingelogd;
  readonly initieelGeladen = this.auth.initieelGeladen;
  readonly uitgaven = this.uitgavenService.uitgaven;

  readonly formOpen = signal(false);
  readonly bevestigVerwijderen = signal<Uitgave | null>(null);
  readonly bezig = signal(false);
  readonly fout = signal<string | null>(null);

  openForm(): void {
    this.fout.set(null);
    this.formOpen.set(true);
  }

  sluitForm(): void {
    this.formOpen.set(false);
  }

  async opslaan(invoer: Parameters<UitgavenService['toevoegen']>[0]): Promise<void> {
    this.bezig.set(true);
    this.fout.set(null);
    try {
      await this.uitgavenService.toevoegen(invoer);
      this.formOpen.set(false);
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

  async uitloggen(): Promise<void> {
    await this.auth.uitloggen();
  }
}
