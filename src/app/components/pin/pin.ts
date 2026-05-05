import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

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
    if (toets === '') return;
    this.fout.set(false);
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

  private controleer(pin: string): void {
    const ok = this.auth.probeerInloggen(pin);
    if (!ok) {
      this.fout.set(true);
      setTimeout(() => {
        this.cijfers.set('');
      }, 600);
    }
  }
}
