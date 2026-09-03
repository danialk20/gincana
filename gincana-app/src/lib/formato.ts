import type { Campo } from '../tipos';

/** 125 → "2:05" */
export function segundosATexto(segundos: number): string {
  const seg = Math.max(0, Math.round(segundos));
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "2:05", "205", "125" → 125 segundos. Devuelve null si no se entiende. */
export function textoASegundos(texto: string): number | null {
  const limpio = texto.trim();
  if (!limpio) return null;
  const conDosPuntos = limpio.match(/^(\d{1,2}):(\d{1,2})$/);
  if (conDosPuntos) {
    return Number(conDosPuntos[1]) * 60 + Number(conDosPuntos[2]);
  }
  if (/^\d+$/.test(limpio)) return Number(limpio);
  return null;
}

/** Cómo se muestra el valor de un campo en el televisor y en las tablas. */
export function formatearValor(campo: Campo, valor: number | boolean | undefined): string {
  if (valor === undefined || valor === null) return '—';
  if (campo.tipo === 'booleano') return valor ? 'Sí' : 'No';
  if (campo.tipo === 'tiempo') return segundosATexto(Number(valor));
  const numero = Number(valor);
  return campo.unidad ? `${numero} ${campo.unidad}` : String(numero);
}
