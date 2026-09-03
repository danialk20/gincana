import { useEffect, useState } from 'react';
import type { Equipo, Resultado } from '../tipos';
import { obtenerAlmacen } from './almacen';

export function useEquipos() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return obtenerAlmacen().escucharEquipos(({ datos }) => {
      setEquipos(datos);
      setCargando(false);
    });
  }, []);

  return { equipos, cargando };
}

export function useResultados() {
  const [resultados, setResultados] = useState<Map<string, Resultado>>(new Map());
  const [pendientes, setPendientes] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    return obtenerAlmacen().escucharResultados(({ datos, pendientes }) => {
      setResultados(datos);
      setPendientes(pendientes);
      setCargando(false);
    });
  }, []);

  return { resultados, pendientes, cargando };
}

export function useEnLinea() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);

  useEffect(() => {
    const subir = () => setEnLinea(true);
    const bajar = () => setEnLinea(false);
    window.addEventListener('online', subir);
    window.addEventListener('offline', bajar);
    return () => {
      window.removeEventListener('online', subir);
      window.removeEventListener('offline', bajar);
    };
  }, []);

  return enLinea;
}

/** Estado que sobrevive al cierre de la app. Se usa para no volver a pedir estación ni PIN. */
export function usePersistido<T>(clave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const crudo = localStorage.getItem(clave);
      return crudo ? (JSON.parse(crudo) as T) : inicial;
    } catch {
      return inicial;
    }
  });

  useEffect(() => {
    localStorage.setItem(clave, JSON.stringify(valor));
  }, [clave, valor]);

  return [valor, setValor] as const;
}
