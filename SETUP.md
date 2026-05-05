# Reis Uitgaven — Setup

Een mobiele webapp voor 2 personen om eten & drinken bij te houden tijdens reizen. Realtime gedeelde data via Firebase Firestore, gehost op Netlify.

---

## ⚠️ Node.js versie

Angular 21 vereist **Node.js v20.19+ of v22.12+**. Je systeem heeft op moment van scaffolden v20.17.0, en de Angular CLI weigert te starten op die versie. Werk Node bij voordat je verder gaat.

- Download de laatste LTS van [nodejs.org](https://nodejs.org/)
- Of via [Volta](https://volta.sh/): `volta install node@22`
- Controleer: `node --version` → moet ≥ 20.19 of ≥ 22.12 zijn

Daarna: `npm install` opnieuw als je dat al gedaan hebt op de oude versie.

---

## 1. Firebase project aanmaken

1. Ga naar [console.firebase.google.com](https://console.firebase.google.com/) en log in met een Google account.
2. Klik **Project toevoegen** → naam bijvoorbeeld `reis-uitgaven` → Google Analytics mag uit → **Project maken**.
3. Wacht tot het project klaar is, klik **Doorgaan**.

## 2. Firestore activeren

1. In het project, links in het menu: **Build → Firestore Database**.
2. Klik **Database maken**.
3. Kies **Productiemodus starten** (rules zetten we hieronder open).
4. Locatie: kies `eur3 (europe-west)` of een Europese regio.
5. Wacht tot de database klaar is.

### Anonymous Authentication aanzetten

De app logt elke bezoeker stil in als anonieme gebruiker. Daarna eisen de Firestore rules dat token. Dat blokkeert misbruik door bots die open Firebase databases scannen — zonder via jouw app te gaan, krijgt niemand een token.

1. In Firebase Console, links: **Build → Authentication**.
2. Klik **Aan de slag** (eerste keer).
3. Tabblad **Sign-in method** → klik op **Anoniem** → schuif **Inschakelen** aan → **Opslaan**.

### Security rules

1. Ga terug naar **Build → Firestore Database**.
2. Klik op het tabblad **Regels**.
3. Vervang de inhoud door:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /uitgaven/{doc} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
4. Klik **Publiceren**.

> Combinatie pincode (in de app) + anonymous-auth-token (afgedwongen door rules) = drempel hoog genoeg voor deze use case. Deel de URL alleen met je ouders.

### Optioneel — API key beperken tot je domein

Voor een extra laag (blokkeert misbruik vanaf andere websites die jouw API key zouden vinden):

1. [console.cloud.google.com](https://console.cloud.google.com/) → kies project `reis-uitgaven`.
2. **APIs & Services → Credentials**.
3. Klik op de "Browser key (auto created by Firebase)".
4. **Application restrictions** → **HTTP referrers** → voeg toe: `https://jouw-naam.netlify.app/*` en `http://localhost:4200/*` (voor lokaal testen).
5. **Save**. Effect na ~5 min.

## 3. Web-app registreren en config kopiëren

1. In Firebase Console, klik het tandwiel ⚙️ → **Projectinstellingen**.
2. Scroll naar **Jouw apps** → klik het **`</>`** (web) icoon.
3. Bijnaam: `reis-uitgaven-web`. **Niet** Firebase Hosting aanvinken. Klik **App registreren**.
4. Kopieer het `firebaseConfig` object dat verschijnt.

## 4. Config invullen in de app

Open beide bestanden en plak je Firebase config:

- [src/environments/environment.ts](src/environments/environment.ts)
- [src/environments/environment.prod.ts](src/environments/environment.prod.ts)

Voorbeeld:

```ts
export const environment = {
  production: true,
  pincode: '4729',          // ← kies hier je gedeelde pincode (4 cijfers)
  firebase: {
    apiKey: 'AIzaSy...',
    authDomain: 'reis-uitgaven.firebaseapp.com',
    projectId: 'reis-uitgaven',
    storageBucket: 'reis-uitgaven.appspot.com',
    messagingSenderId: '123456789012',
    appId: '1:123456789012:web:abcdef0123456789',
  },
};
```

> Zet **dezelfde pincode** in beide environment-bestanden.

## 5. Lokaal draaien

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). Voer je pincode in. Voeg een testuitgave toe — ververs de pagina, hij moet er nog staan (komt uit Firestore).

## 6. Productie build

```bash
npm run build
```

De output staat in `dist/reis-uitgaven/browser/`.

## 7. Deployen op Netlify

### Snelste manier — drag & drop

1. Run `npm run build`.
2. Ga naar [app.netlify.com](https://app.netlify.com/) en log in.
3. Klik **Add new site → Deploy manually**.
4. Sleep de map `dist/reis-uitgaven/browser` naar het venster.
5. Netlify geeft je een URL zoals `https://magic-name-12345.netlify.app`.
6. Klik **Site settings → Change site name** om er bv. `reis-ouders.netlify.app` van te maken.

### Via Git (aanbevolen voor updates)

1. Push deze map naar een GitHub repo.
2. Op Netlify: **Add new site → Import an existing project → GitHub** → kies de repo.
3. Build settings worden automatisch opgepikt uit [netlify.toml](netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist/reis-uitgaven/browser`
4. Klik **Deploy**. Vanaf nu deployt elke push naar `main` automatisch.

> ⚠️ **Belangrijk:** je Firebase config en pincode staan in de gebouwde bundle. Iedereen met de URL kan zien welk Firebase project je gebruikt. Daarom doet de Firestore rules `allow if true` — de pincode is je enige beveiligingslaag. Deel de link alleen met vertrouwde personen.

## 8. Link delen via WhatsApp

1. Kopieer de Netlify URL (bv. `https://reis-ouders.netlify.app`).
2. Stuur in WhatsApp:

   > *Hoi pa & ma, hier is de uitgaven-app voor de reis: https://reis-ouders.netlify.app — pincode: 4729. Tip: voeg 'm toe aan je beginscherm (zie hieronder).*

## 9. Toevoegen aan beginscherm

### iPhone (Safari)

1. Open de link in **Safari** (niet Chrome — daar werkt "voeg toe aan beginscherm" niet hetzelfde).
2. Tik op het **deel-icoontje** (vierkantje met pijl naar boven, onder in de balk).
3. Scroll en tik **Voeg toe aan beginscherm**.
4. Naam: `Reis Uitgaven`. Tik **Voeg toe**.
5. Het icoon verschijnt op het beginscherm. Tikken opent de app fullscreen, zonder browser-balk.

### Android (Chrome)

1. Open de link in **Chrome**.
2. Tik op het menu (drie puntjes rechtsboven).
3. Tik **Toevoegen aan startscherm** of **App installeren**.
4. Bevestig de naam, tik **Toevoegen**.
5. Het icoon staat op het beginscherm.

## 10. Pincode wijzigen

Pas `pincode` aan in beide `environment*.ts` bestanden, push, Netlify herbuilt automatisch. **Beide gebruikers moeten daarna opnieuw inloggen** (sessionStorage wordt niet leeggehaald, maar de oude pincode werkt niet meer voor nieuwe sessies).

## 11. Een uitgave verwijderen

In de lijst, tik op de **✕** rechts van de uitgave → bevestig in het popup → de uitgave verdwijnt direct bij beide gebruikers (realtime sync via Firestore).

---

## Projectstructuur

```
src/
  app/
    components/
      pin/                  ← pincode-scherm
      uitgaven-lijst/       ← overzicht gegroepeerd per dag
      uitgave-form/         ← bottom sheet formulier
    services/
      auth.service.ts       ← pincode + sessionStorage
      uitgaven.service.ts   ← Firestore CRUD
    models/
      uitgave.model.ts      ← types + valuta-lijst
    app.ts / app.html / app.scss
    app.config.ts           ← zoneless + Firebase providers
  environments/
    environment.ts
    environment.prod.ts
  styles.scss               ← globale variabelen + dark theme
  index.html
  main.ts
public/
  favicon.svg
  manifest.webmanifest
netlify.toml
```

## Veelgebruikte commando's

| Commando | Doet |
|---|---|
| `npm install` | dependencies installeren |
| `npm start` | dev server op localhost:4200 |
| `npm run build` | productie build naar `dist/reis-uitgaven/browser` |
| `npm run watch` | dev build met file-watcher |
