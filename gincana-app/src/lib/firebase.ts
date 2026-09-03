import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

const configuracion = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Si no hay credenciales, la app arranca en modo local (localStorage) para que se
 * pueda ensayar sin haber creado todavía el proyecto de Firebase.
 */
export const hayFirebase = Boolean(configuracion.apiKey && configuracion.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function obtenerDb(): Firestore {
  if (!hayFirebase) {
    throw new Error('Firebase no está configurado. Revisa el archivo .env.local');
  }
  if (!db) {
    app = initializeApp(configuracion);
    // La caché persistente es lo que hace que el juez pueda guardar sin señal:
    // las escrituras se encolan en el celular y suben solas al volver la conexión.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    // Sesión anónima: no pedimos usuario ni contraseña, pero las reglas de
    // seguridad sí exigen que haya sesión, así nadie escribe desde afuera.
    signInAnonymously(getAuth(app)).catch((error) => {
      console.error('No se pudo iniciar sesión anónima:', error);
    });
  }
  return db;
}
