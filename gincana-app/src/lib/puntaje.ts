import { ID_PRUEBA_DESEMPATE } from '../config/pruebas';
import type { Equipo, FilaRanking, Prueba, Resultado } from '../tipos';

/** Puntos que se lleva el primer puesto de cada prueba. */
export const PUNTOS_PRIMER_PUESTO = 10;

/**
 * Puesto 1 → 10 puntos, puesto 2 → 9, y así. Nunca por debajo de 0.
 * Con empates el puesto salta: si tres equipos quedan segundos, todos reciben 9
 * y el siguiente queda de quinto, con 6 puntos.
 */
export function puntosDePuesto(puesto: number): number {
  return Math.max(0, PUNTOS_PRIMER_PUESTO + 1 - puesto);
}

export function idResultado(pruebaId: string, equipoId: string): string {
  return `${pruebaId}__${equipoId}`;
}

interface Entrada {
  equipoId: string;
  valor: number | null;
  descartado: boolean;
  sinRegistro: boolean;
}

function leerEntrada(prueba: Prueba, equipoId: string, resultado?: Resultado): Entrada {
  const { campoId, campoDescarta } = prueba.criterio;
  const bruto = resultado?.valores?.[campoId];
  const descartado = campoDescarta ? resultado?.valores?.[campoDescarta] === true : false;
  const faltaValor = bruto === undefined || bruto === null;
  // Marcar "no terminó" sí es un registro: el equipo participó y el juez lo anotó.
  const sinRegistro = resultado === undefined || (faltaValor && !descartado);
  return {
    equipoId,
    valor: faltaValor ? null : Number(bruto),
    descartado,
    sinRegistro,
  };
}

/**
 * Tres grupos, en este orden:
 *   0. los que tienen un resultado anotado, ordenados entre sí
 *   1. los que participaron pero no terminaron, empatados
 *   2. los que no tienen ningún registro
 */
function grupo(entrada: Entrada): number {
  if (entrada.sinRegistro) return 2;
  if (entrada.descartado || entrada.valor === null) return 1;
  return 0;
}

/**
 * Ordena los equipos de una prueba y les asigna puesto y puntos.
 *
 * Un 0 registrado es un valor legítimo y queda por encima de quien no tiene
 * registro: no es lo mismo hacer cero bombas que no haber sido anotado.
 *
 * Quien no tiene registro se lleva 0 puntos, no los puntos del último puesto.
 * Si no fuera así, una prueba que nadie alcanzó a registrar repartiría 10 puntos
 * a todos por empate, que es justo lo contrario de lo que debería pasar.
 */
export function rankearPrueba(
  prueba: Prueba,
  equipos: Equipo[],
  resultados: Map<string, Resultado>,
): FilaRanking[] {
  const entradas = equipos.map((equipo) =>
    leerEntrada(prueba, equipo.id, resultados.get(idResultado(prueba.id, equipo.id))),
  );

  const ordenadas = [...entradas].sort((a, b) => {
    const grupoA = grupo(a);
    const grupoB = grupo(b);
    if (grupoA !== grupoB) return grupoA - grupoB;
    if (grupoA !== 0) return 0;
    const diferencia = (a.valor as number) - (b.valor as number);
    return prueba.criterio.direccion === 'mayor' ? -diferencia : diferencia;
  });

  // Ranking estándar: los empatados comparten el mejor puesto y el siguiente salta.
  const filas: FilaRanking[] = [];
  let puestoAnterior = 0;
  let claveAnterior: string | null = null;

  ordenadas.forEach((entrada, indice) => {
    const grupoActual = grupo(entrada);
    const clave = grupoActual === 0 ? String(entrada.valor) : `GRUPO_${grupoActual}`;
    const puesto = clave === claveAnterior ? puestoAnterior : indice + 1;
    puestoAnterior = puesto;
    claveAnterior = clave;
    filas.push({
      equipoId: entrada.equipoId,
      valor: entrada.valor,
      descartado: entrada.descartado,
      sinRegistro: entrada.sinRegistro,
      puesto,
      puntos: entrada.sinRegistro ? 0 : puntosDePuesto(puesto),
    });
  });

  return filas;
}

export interface FilaGeneral {
  equipoId: string;
  puntosPorPrueba: Record<string, number>;
  total: number;
  puesto: number;
  /** Pruebas en las que el equipo no tiene ningún dato capturado. */
  pruebasSinRegistro: string[];
  /** Valor de la prueba de desempate. Null si no tiene registro. */
  valorDesempate: number | null;
}

/**
 * Compara dos valores de la prueba de desempate. Quien no tenga registro en esa
 * prueba pierde el desempate, sin importar la dirección.
 */
function compararDesempate(
  a: number | null,
  b: number | null,
  direccion: 'mayor' | 'menor',
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return direccion === 'menor' ? a - b : b - a;
}

/** Suma los puntos de todas las pruebas y arma la tabla general. */
export function tablaGeneral(
  pruebas: Prueba[],
  equipos: Equipo[],
  resultados: Map<string, Resultado>,
): FilaGeneral[] {
  const pruebaDesempate = pruebas.find((prueba) => prueba.id === ID_PRUEBA_DESEMPATE);

  const acumulado = new Map<string, FilaGeneral>(
    equipos.map((equipo) => [
      equipo.id,
      {
        equipoId: equipo.id,
        puntosPorPrueba: {},
        total: 0,
        puesto: 0,
        pruebasSinRegistro: [],
        valorDesempate: pruebaDesempate
          ? leerEntrada(
              pruebaDesempate,
              equipo.id,
              resultados.get(idResultado(pruebaDesempate.id, equipo.id)),
            ).valor
          : null,
      },
    ]),
  );

  for (const prueba of pruebas) {
    for (const fila of rankearPrueba(prueba, equipos, resultados)) {
      const acumulador = acumulado.get(fila.equipoId);
      if (!acumulador) continue;
      acumulador.puntosPorPrueba[prueba.id] = fila.puntos;
      acumulador.total += fila.puntos;
      if (fila.sinRegistro) acumulador.pruebasSinRegistro.push(prueba.id);
    }
  }

  const direccion = pruebaDesempate?.criterio.direccion ?? 'menor';
  const filas = [...acumulado.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return compararDesempate(a.valorDesempate, b.valorDesempate, direccion);
  });

  // Dos equipos comparten puesto solo si empatan en puntos Y en el desempate.
  let puestoAnterior = 0;
  let claveAnterior: string | null = null;
  filas.forEach((fila, indice) => {
    const clave = `${fila.total}|${fila.valorDesempate ?? 'sin'}`;
    const puesto = clave === claveAnterior ? puestoAnterior : indice + 1;
    puestoAnterior = puesto;
    claveAnterior = clave;
    fila.puesto = puesto;
  });

  return filas;
}
