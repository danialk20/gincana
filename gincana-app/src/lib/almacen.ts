import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { Equipo, Resultado } from '../tipos';
import { hayFirebase, obtenerDb } from './firebase';

export interface EstadoDatos<T> {
  datos: T;
  /** Hay escrituras hechas en este dispositivo que todavía no suben al servidor. */
  pendientes: boolean;
  /** Lo que se está mostrando salió de la caché local, no del servidor. */
  desdeCache: boolean;
}

type Escucha<T> = (estado: EstadoDatos<T>) => void;

export interface Almacen {
  modo: 'firebase' | 'local';
  escucharEquipos(escucha: Escucha<Equipo[]>): () => void;
  escucharResultados(escucha: Escucha<Map<string, Resultado>>): () => void;
  guardarEquipo(equipo: Equipo): Promise<void>;
  borrarEquipo(equipoId: string): Promise<void>;
  guardarResultado(resultado: Resultado): Promise<void>;
  /** Restaura un respaldo completo. Sobrescribe lo que haya. */
  restaurar(datos: { equipos: Equipo[]; resultados: Resultado[] }): Promise<void>;
  /** Borra equipos y resultados. Se usa para dejar limpio después del ensayo. */
  limpiar(): Promise<void>;
  /** Borra solo lo que generó el ensayo, respetando los equipos reales. */
  limpiarEnsayo(): Promise<void>;
}

/** Los equipos de mentiras siempre llevan este prefijo en su identificador. */
export const PREFIJO_ENSAYO = 'ensayo-';

function ordenarEquipos(equipos: Equipo[]): Equipo[] {
  return [...equipos].sort((a, b) => a.orden - b.orden);
}

// ───────────────────────────── Firestore ─────────────────────────────

function crearAlmacenFirebase(db: Firestore): Almacen {
  return {
    modo: 'firebase',

    escucharEquipos(escucha) {
      return onSnapshot(
        collection(db, 'equipos'),
        { includeMetadataChanges: true },
        (snapshot) => {
          escucha({
            datos: ordenarEquipos(snapshot.docs.map((d) => d.data() as Equipo)),
            pendientes: snapshot.metadata.hasPendingWrites,
            desdeCache: snapshot.metadata.fromCache,
          });
        },
      );
    },

    escucharResultados(escucha) {
      return onSnapshot(
        collection(db, 'resultados'),
        { includeMetadataChanges: true },
        (snapshot) => {
          const mapa = new Map<string, Resultado>();
          for (const documento of snapshot.docs) {
            const resultado = documento.data() as Resultado;
            mapa.set(resultado.id, resultado);
          }
          escucha({
            datos: mapa,
            pendientes: snapshot.metadata.hasPendingWrites,
            desdeCache: snapshot.metadata.fromCache,
          });
        },
      );
    },

    async guardarEquipo(equipo) {
      // No se espera la promesa a propósito: offline nunca resuelve hasta que
      // vuelva la señal, pero el dato ya quedó guardado en la caché local.
      void setDoc(doc(db, 'equipos', equipo.id), equipo);
    },

    async borrarEquipo(equipoId) {
      void deleteDoc(doc(db, 'equipos', equipoId));
    },

    async guardarResultado(resultado) {
      void setDoc(doc(db, 'resultados', resultado.id), resultado);
    },

    async restaurar({ equipos, resultados }) {
      await Promise.all([
        ...equipos.map((equipo) => setDoc(doc(db, 'equipos', equipo.id), equipo)),
        ...resultados.map((resultado) => setDoc(doc(db, 'resultados', resultado.id), resultado)),
      ]);
    },

    async limpiar() {
      for (const nombreColeccion of ['equipos', 'resultados']) {
        const snapshot = await getDocs(collection(db, nombreColeccion));
        await Promise.all(snapshot.docs.map((documento) => deleteDoc(documento.ref)));
      }
    },

    async limpiarEnsayo() {
      const equipos = await getDocs(collection(db, 'equipos'));
      await Promise.all(
        equipos.docs
          .filter((documento) => documento.id.startsWith(PREFIJO_ENSAYO))
          .map((documento) => deleteDoc(documento.ref)),
      );
      const resultados = await getDocs(collection(db, 'resultados'));
      await Promise.all(
        resultados.docs
          .filter((documento) => {
            const equipoId = (documento.data() as Resultado).equipoId ?? '';
            return equipoId.startsWith(PREFIJO_ENSAYO);
          })
          .map((documento) => deleteDoc(documento.ref)),
      );
    },
  };
}

// ─────────────────────────── Modo local ───────────────────────────

const CLAVE_EQUIPOS = 'gincana.equipos';
const CLAVE_RESULTADOS = 'gincana.resultados';
const CANAL = 'gincana.cambios';

function leerLista<T>(clave: string): T[] {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T[]) : [];
  } catch {
    return [];
  }
}

function crearAlmacenLocal(): Almacen {
  const canal = 'BroadcastChannel' in window ? new BroadcastChannel(CANAL) : null;

  // Ni el evento 'storage' ni BroadcastChannel le avisan a la pestaña que hizo el
  // cambio: solo notifican a las demás. Por eso se guardan aparte los oyentes de
  // esta pestaña y se les avisa a mano, o la pantalla no se actualizaría sola
  // después de guardar.
  const oyentes = new Set<() => void>();

  function anunciar() {
    for (const oyente of oyentes) oyente();
    canal?.postMessage('cambio');
  }

  function escuchar<T>(clave: string, transformar: (crudo: unknown[]) => T, escucha: Escucha<T>) {
    const emitir = () => {
      escucha({ datos: transformar(leerLista(clave)), pendientes: false, desdeCache: true });
    };
    emitir();
    oyentes.add(emitir);
    window.addEventListener('storage', emitir);
    canal?.addEventListener('message', emitir);
    return () => {
      oyentes.delete(emitir);
      window.removeEventListener('storage', emitir);
      canal?.removeEventListener('message', emitir);
    };
  }

  function guardarLista(clave: string, lista: unknown[]) {
    localStorage.setItem(clave, JSON.stringify(lista));
    anunciar();
  }

  return {
    modo: 'local',

    escucharEquipos(escucha) {
      return escuchar(CLAVE_EQUIPOS, (crudo) => ordenarEquipos(crudo as Equipo[]), escucha);
    },

    escucharResultados(escucha) {
      return escuchar(
        CLAVE_RESULTADOS,
        (crudo) => new Map((crudo as Resultado[]).map((r) => [r.id, r])),
        escucha,
      );
    },

    async guardarEquipo(equipo) {
      const equipos = leerLista<Equipo>(CLAVE_EQUIPOS).filter((e) => e.id !== equipo.id);
      guardarLista(CLAVE_EQUIPOS, [...equipos, equipo]);
    },

    async borrarEquipo(equipoId) {
      guardarLista(
        CLAVE_EQUIPOS,
        leerLista<Equipo>(CLAVE_EQUIPOS).filter((e) => e.id !== equipoId),
      );
    },

    async guardarResultado(resultado) {
      const resultados = leerLista<Resultado>(CLAVE_RESULTADOS).filter((r) => r.id !== resultado.id);
      guardarLista(CLAVE_RESULTADOS, [...resultados, resultado]);
    },

    async restaurar({ equipos, resultados }) {
      localStorage.setItem(CLAVE_EQUIPOS, JSON.stringify(equipos));
      guardarLista(CLAVE_RESULTADOS, resultados);
    },

    async limpiar() {
      localStorage.setItem(CLAVE_EQUIPOS, '[]');
      guardarLista(CLAVE_RESULTADOS, []);
    },

    async limpiarEnsayo() {
      const equipos = leerLista<Equipo>(CLAVE_EQUIPOS).filter(
        (equipo) => !equipo.id.startsWith(PREFIJO_ENSAYO),
      );
      localStorage.setItem(CLAVE_EQUIPOS, JSON.stringify(equipos));
      guardarLista(
        CLAVE_RESULTADOS,
        leerLista<Resultado>(CLAVE_RESULTADOS).filter(
          (resultado) => !resultado.equipoId.startsWith(PREFIJO_ENSAYO),
        ),
      );
    },
  };
}

let instancia: Almacen | null = null;

export function obtenerAlmacen(): Almacen {
  if (!instancia) {
    instancia = hayFirebase ? crearAlmacenFirebase(obtenerDb()) : crearAlmacenLocal();
  }
  return instancia;
}
