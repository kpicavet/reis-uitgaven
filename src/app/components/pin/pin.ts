import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

// Shake-animatie duurt 0.45s (zie pin.scss); houd cijfers iets langer zichtbaar zodat de fout te zien is voor we wissen.
const FOUT_RESET_VERTRAGING_MS = 600;

@Component({
  selector: 'app-pin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pin.html',
  styleUrl: './pin.scss',
})
export class Pin {
  private readonly auth = inject(AuthService);

  protected readonly cijfers = signal<string>('');
  protected readonly fout = signal(false);
  protected readonly bezig = signal(false);
  protected readonly foutTekst = signal<string | null>(null);
  protected readonly toetsen: ReadonlyArray<string> = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '',
    '0',
    'wis',
  ];

  protected readonly bullets = computed(() => {
    const lengte = this.cijfers().length;
    return [0, 1, 2, 3].map((i) => i < lengte);
  });

  drukToets(toets: string): void {
    if (toets === '' || this.bezig()) return;
    this.fout.set(false);
    this.foutTekst.set(null);

    if (toets === 'wis') {
      this.cijfers.update((c) => c.slice(0, -1));
      return;
    }

    this.cijfers.update((c) => {
      if (c.length >= 4) return c;
      const nieuwe = c + toets;
      if (nieuwe.length === 4) {
        queueMicrotask(() => this.controleer(nieuwe));
      }
      return nieuwe;
    });
  }

  private async controleer(pin: string): Promise<void> {
    this.bezig.set(true);
    const resultaat = await this.auth.probeerInloggen(pin);
    this.bezig.set(false);

    if (!resultaat.ok) {
      this.fout.set(true);
      this.foutTekst.set(resultaat.reden);
      setTimeout(() => {
        this.cijfers.set('');
      }, FOUT_RESET_VERTRAGING_MS);
    }
  }
}
