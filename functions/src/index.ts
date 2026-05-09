import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash, timingSafeEqual } from 'node:crypto';

initializeApp();

const APP_PIN = defineSecret('APP_PIN');

const MAX_POGINGEN = 5;
const VENSTER_MS = 60 * 60 * 1000;
const SHARED_UID = 'reis-uitgaven-user';

interface PinRequest {
  pin?: unknown;
}

interface PogingDoc {
  count: number;
  resetAt: number;
}

function constantTimeGelijk(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export const verifyPin = onCall(
  { secrets: [APP_PIN], region: 'europe-west1', cors: true },
  async (request: CallableRequest<PinRequest>) => {
    const ip = request.rawRequest.ip ?? 'onbekend';
    const db = getFirestore();
    const pogingRef = db.collection('pinAttempts').doc(ip.replace(/[^a-zA-Z0-9]/g, '_'));

    const geblokkeerd = await db.runTransaction(async (tx) => {
      const snap = await tx.get(pogingRef);
      const nu = Date.now();
      const data = (snap.data() as PogingDoc | undefined) ?? { count: 0, resetAt: 0 };

      if (data.resetAt < nu) {
        data.count = 0;
        data.resetAt = nu + VENSTER_MS;
      }

      if (data.count >= MAX_POGINGEN) {
        return true;
      }

      tx.set(pogingRef, { count: data.count + 1, resetAt: data.resetAt });
      return false;
    });

    if (geblokkeerd) {
      throw new HttpsError(
        'resource-exhausted',
        'Te veel verkeerde pogingen. Probeer over een uur opnieuw.',
      );
    }

    const ingevoerd = String(request.data?.pin ?? '');
    const echt = APP_PIN.value();

    if (!ingevoerd || !constantTimeGelijk(ingevoerd, echt)) {
      throw new HttpsError('permission-denied', 'Onjuiste pincode.');
    }

    await pogingRef.set({ count: 0, resetAt: 0 });

    const token = await getAuth().createCustomToken(SHARED_UID, { verified: true });
    return { token };
  },
);
