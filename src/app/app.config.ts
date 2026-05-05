import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { getApp, provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import {
  Auth,
  browserSessionPersistence,
  getAuth,
  provideAuth,
  setPersistence,
} from '@angular/fire/auth';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions(getApp(), 'europe-west1')),
    provideAppInitializer(() => {
      const auth = inject(Auth);
      return setPersistence(auth, browserSessionPersistence).catch((err) => {
        console.error('Persistence setup mislukt:', err);
      });
    }),
  ],
};
