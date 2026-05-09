import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { getApp, provideFirebaseApp, initializeApp } from '@angular/fire/app';
import {
  provideFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from '@angular/fire/firestore';
import {
  browserSessionPersistence,
  initializeAuth,
  provideAuth,
} from '@angular/fire/auth';
import { provideFunctions, getFunctions } from '@angular/fire/functions';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() =>
      initializeAuth(getApp(), {
        persistence: browserSessionPersistence,
      }),
    ),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }),
    ),
    provideFunctions(() => getFunctions(getApp(), 'europe-west1')),
  ],
};
