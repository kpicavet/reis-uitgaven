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

### Authentication aanzetten

De app gebruikt Firebase Auth met **custom tokens** uitgegeven door een Cloud Function (zie stap 5). Voor nu hoef je alleen de service aan te zetten.

1. In Firebase Console, links: **Build → Authentication**.
2. Klik **Aan de slag** (eerste keer).
3. Geen sign-in methodes inschakelen — custom tokens vereisen geen aparte methode.

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

> De PIN staat **niet** in de app. Die wordt als secret op de server opgeslagen — zie stap 5.

## 5. Cloud Function deployen (PIN-check op de server)

### Waarom

De PIN staat veilig op de Firebase servers, niet in de JS-bundle. De Cloud Function checkt de PIN, geeft alleen na succes een Firebase-token terug, en is rate-limited (5 pogingen per IP per uur). Een aanvaller met je URL kan dus niet brute-forcen.

### 5.1 Upgrade naar Blaze plan (gratis voor jouw gebruik)

Cloud Functions vereist Blaze (pay-as-you-go), maar de free tier is **2 miljoen function-calls per maand**. Voor 2 ouders die ~50× per maand inloggen kost dit €0.

1. In Firebase Console: links onder, klik **Upgrade**.
2. Kies **Blaze**.
3. Voeg een Google Cloud billing account toe (creditcard nodig — wordt niet belast bij dit gebruik).
4. **Belangrijk — set een budget alarm**: in [console.cloud.google.com/billing](https://console.cloud.google.com/billing) → **Budgets & alerts** → **CREATE BUDGET** → bv. €1/maand met 50% en 100% alerts. Zo krijg je mail als er ooit iets raars gebeurt.

### 5.2 Firebase CLI installeren en inloggen

```bash
npm install -g firebase-tools
firebase login
```

Dit opent je browser om in te loggen met hetzelfde Google account als waarmee je Firebase project hebt aangemaakt.

### 5.3 .firebaserc aanpassen aan jouw project-id

Open [.firebaserc](.firebaserc) en vervang `reis-uitgaven` met je échte Firebase project-id (zie Firebase Console → ⚙️ → Projectinstellingen → Project-ID):

```json
{
  "projects": {
    "default": "jouw-project-id"
  }
}
```

### 5.4 PIN als secret instellen

```bash
firebase functions:secrets:set APP_PIN
```

Je krijgt een prompt — typ daar je PIN in (bv. `0672` of een langere code voor meer veiligheid). De secret staat encrypted in Google Secret Manager, alleen leesbaar door je Cloud Function.

> Wil je de PIN later wijzigen? Run hetzelfde commando opnieuw met de nieuwe waarde, dan `firebase deploy --only functions` om de function te herstarten met de nieuwe versie.

### 5.5 Functions installeren en deployen

```bash
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

Dit:
- Bouwt de TypeScript function (`tsc` in functions/)
- Deployt `verifyPin` naar `europe-west1`
- Deployt de Firestore rules uit [firestore.rules](firestore.rules) — die eisen `request.auth.token.verified == true`, wat alleen door de function uitgegeven kan worden

Eerste deploy duurt 2-3 minuten. Daarna zie je iets als:
```
✔  functions[verifyPin(europe-west1)] Successful create operation.
Function URL (verifyPin): https://europe-west1-jouw-project.cloudfunctions.net/verifyPin
```

### 5.6 Optioneel — API key beperken tot je domein

Extra laag (blokkeert misbruik vanaf andere websites die jouw API key zouden vinden):

1. [console.cloud.google.com](https://console.cloud.google.com/) → kies je project.
2. **APIs & Services → Credentials**.
3. Klik op de "Browser key (auto created by Firebase)".
4. **Application restrictions** → **HTTP referrers** → voeg toe: `https://jouw-naam.netlify.app/*` en `http://localhost:4200/*`.
5. **Save**. Effect na ~5 min.

## 6. Lokaal draaien

```bash
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). Voer je pincode in. De inlog gaat via de Cloud Function in europe-west1, dus halve seconde wachten is normaal. Voeg een testuitgave toe — ververs de pagina, hij moet er nog staan (komt uit Firestore).

> **Lokaal testen vereist dat de Cloud Function al gedeployed is** (stap 5). Er is geen lokale emulator-setup. Voor productie-achtig testen: gewoon `npm start` na succesvolle deploy.

## 7. Productie build

```bash
npm run build
```

De output staat in `dist/reis-uitgaven/browser/`.

## 8. Deployen op Netlify

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

> **Veiligheid:** de PIN staat als secret in Google Secret Manager (server-side), nooit in de JS-bundle. De Cloud Function rate-limit (5 pogingen per IP per uur) maakt brute force onmogelijk. Firestore rules eisen een geldig `verified` token uit de function. Deel de URL en PIN dus rustig met je ouders via WhatsApp.

## 9. Link delen via WhatsApp

1. Kopieer de Netlify URL (bv. `https://reis-ouders.netlify.app`).
2. Stuur in WhatsApp:

   > *Hoi pa & ma, hier is de uitgaven-app voor de reis: https://reis-ouders.netlify.app — pincode: 0672. Tip: voeg 'm toe aan je beginscherm (zie hieronder).*

## 10. Toevoegen aan beginscherm

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

## 11. Pincode wijzigen

```bash
firebase functions:secrets:set APP_PIN
firebase deploy --only functions
```

Sessies van eerder ingelogde gebruikers blijven actief tot ze hun browser/tab sluiten — daarna lukt inloggen alleen met de nieuwe PIN.

## 12. Een uitgave verwijderen

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
      auth.service.ts       ← roept verifyPin function aan + signInWithCustomToken
      uitgaven.service.ts   ← Firestore CRUD
    models/
      uitgave.model.ts      ← types + valuta-lijst
    app.ts / app.html / app.scss
    app.config.ts           ← zoneless + Firebase providers (Auth, Firestore, Functions)
  environments/
    environment.ts          ← alleen Firebase config (PIN staat server-side)
    environment.prod.ts
  styles.scss
  index.html
  main.ts
functions/
  src/index.ts              ← verifyPin Cloud Function (PIN-check, rate limit, custom token)
  package.json
public/
  favicon.svg
  manifest.webmanifest
firebase.json               ← Firebase deploy config
firestore.rules             ← rules: alleen verified-token mag bij uitgaven
.firebaserc                 ← project alias
netlify.toml
```

## Veelgebruikte commando's

| Commando | Doet |
|---|---|
| `npm install` | dependencies installeren |
| `npm start` | dev server op localhost:4200 |
| `npm run build` | productie build naar `dist/reis-uitgaven/browser` |
| `firebase deploy --only functions,firestore:rules` | Cloud Function + rules deployen |
| `firebase functions:secrets:set APP_PIN` | PIN wijzigen (re-deploy daarna nodig) |
| `firebase functions:log` | live logs van de function (handig om te zien waarom inloggen faalt) |

## Veiligheidsmodel — samenvatting

| Laag | Wat blokkeert het |
|---|---|
| **PIN als secret** in Google Secret Manager | PIN is nooit zichtbaar in JS, repo, of Firestore |
| **Rate limit** in `verifyPin` (5/uur/IP) | Brute force op 4-cijferige PIN |
| **Custom token met `verified` claim** | Alleen na geslaagde PIN-check krijg je een geldig token |
| **Firestore rules** eisen `auth.token.verified == true` | Niemand kan direct via REST API bij de data |
| **Browser session persistence** | Token wordt vergeten zodra browser/tab sluit |
| **API key referrer restriction** (optioneel) | Misbruik vanaf andere domeinen |
