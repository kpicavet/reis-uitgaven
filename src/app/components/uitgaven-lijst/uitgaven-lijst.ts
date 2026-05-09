import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  CategorieInfo,
  Uitgave,
  Valuta,
  ValutaTotaal,
  berekenTotalen,
  categorieInfo,
  valutaSymbool,
} from '../../models/uitgave.model';

interface DagGroep {
  datum: string;
  label: string;
  totalen: ValutaTotaal[];
  uitgaven: Uitgave[];
}

@Component({
  selector: 'app-uitgaven-lijst',
  standalone: true,
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './uitgaven-lijst.html',
  styleUrl: './uitgaven-lijst.scss',
})
export class UitgavenLijst {
  readonly uitgaven = input.required<readonly Uitgave[]>();
  readonly verwijderAangevraagd = output<Uitgave>();
  readonly bewerkAangevraagd = output<Uitgave>();

  protected readonly dagen = computed<DagGroep[]>(() => {
    const lijst = this.uitgaven();
    if (lijst.length === 0) return [];

    const map = new Map<string, Uitgave[]>();
    for (const u of lijst) {
      const arr = map.get(u.datum) ?? [];
      arr.push(u);
      map.set(u.datum, arr);
    }

    const datums = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));

    return datums.map((datum) => {
      const uitgavenVoorDag = map.get(datum) ?? [];
      return {
        datum,
        label: this.formatteerDatum(datum),
        totalen: berekenTotalen(uitgavenVoorDag),
        uitgaven: uitgavenVoorDag,
      } satisfies DagGroep;
    });
  });

  symbool(valuta: Valuta): string {
    return valutaSymbool(valuta);
  }

  categorie(uitgave: Uitgave): CategorieInfo {
    return categorieInfo(uitgave.categorie);
  }

  vraagVerwijderen(uitgave: Uitgave): void {
    this.verwijderAangevraagd.emit(uitgave);
  }

  vraagBewerken(uitgave: Uitgave): void {
    this.bewerkAangevraagd.emit(uitgave);
  }

  private formatteerDatum(datum: string): string {
    const [jaar, maand, dag] = datum.split('-').map(Number);
    if (!jaar || !maand || !dag) return datum;
    const d = new Date(jaar, maand - 1, dag);
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);
    const verschil = Math.round((vandaag.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (verschil === 0) return 'Vandaag';
    if (verschil === 1) return 'Gisteren';
    return d.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
}
