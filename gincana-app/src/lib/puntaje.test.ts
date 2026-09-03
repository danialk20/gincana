import { describe, expect, it } from 'vitest';
import type { Equipo, Prueba, Resultado, ValorCampo } from '../tipos';
import { idResultado, puntosDePuesto, rankearPrueba, tablaGeneral } from './puntaje';

const pruebaMayor: Prueba = {
  id: 'bombas',
  orden: 1,
  nombre: 'Bombas',
  nombreCorto: 'Bombas',
  unidad: 'bombas',
  descripcion: '',
  vigilar: [],
  pin: '0000',
  campos: [{ id: 'bombas', label: 'Bombas', tipo: 'entero' }],
  criterio: { campoId: 'bombas', direccion: 'mayor' },
};

const pruebaMenor: Prueba = {
  id: 'camilla',
  orden: 2,
  nombre: 'Camilla',
  nombreCorto: 'Camilla',
  unidad: 'tiempo',
  descripcion: '',
  vigilar: [],
  pin: '0000',
  campos: [
    { id: 'tiempo', label: 'Tiempo', tipo: 'tiempo' },
    { id: 'noTermino', label: 'No terminó', tipo: 'booleano' },
  ],
  criterio: { campoId: 'tiempo', direccion: 'menor', campoDescarta: 'noTermino' },
};

function equiposDe(...nombres: string[]): Equipo[] {
  return nombres.map((nombre, indice) => ({
    id: nombre,
    nombre,
    orden: indice + 1,
    color: '#000000',
    integrantes: [],
  }));
}

function resultadosDe(
  pruebaId: string,
  registros: Record<string, Record<string, ValorCampo>>,
): Map<string, Resultado> {
  const mapa = new Map<string, Resultado>();
  for (const [equipoId, valores] of Object.entries(registros)) {
    const id = idResultado(pruebaId, equipoId);
    mapa.set(id, {
      id,
      pruebaId,
      equipoId,
      valores,
      notas: '',
      actualizadoEn: 0,
      juez: 'test',
    });
  }
  return mapa;
}

/** Devuelve los puntos en el mismo orden en que se pasaron los equipos. */
function puntosPorEquipo(filas: { equipoId: string; puntos: number }[]): Record<string, number> {
  return Object.fromEntries(filas.map((f) => [f.equipoId, f.puntos]));
}

describe('puntosDePuesto', () => {
  it('reparte 10 al primero y baja de uno en uno', () => {
    expect(puntosDePuesto(1)).toBe(10);
    expect(puntosDePuesto(2)).toBe(9);
    expect(puntosDePuesto(8)).toBe(3);
  });

  it('nunca entrega puntos negativos', () => {
    expect(puntosDePuesto(11)).toBe(0);
    expect(puntosDePuesto(20)).toBe(0);
  });
});

describe('rankearPrueba, gana el mayor', () => {
  it('aplica ranking estándar con empate triple: 10, 9, 9, 9, 6', () => {
    const equipos = equiposDe('a', 'b', 'c', 'd', 'e');
    const resultados = resultadosDe('bombas', {
      a: { bombas: 12 },
      b: { bombas: 9 },
      c: { bombas: 9 },
      d: { bombas: 9 },
      e: { bombas: 4 },
    });

    const filas = rankearPrueba(pruebaMayor, equipos, resultados);

    expect(puntosPorEquipo(filas)).toEqual({ a: 10, b: 9, c: 9, d: 9, e: 6 });
    expect(filas.map((f) => f.puesto)).toEqual([1, 2, 2, 2, 5]);
  });

  it('si todos empatan, todos reciben 10', () => {
    const equipos = equiposDe('a', 'b', 'c');
    const resultados = resultadosDe('bombas', {
      a: { bombas: 7 },
      b: { bombas: 7 },
      c: { bombas: 7 },
    });

    expect(puntosPorEquipo(rankearPrueba(pruebaMayor, equipos, resultados))).toEqual({
      a: 10,
      b: 10,
      c: 10,
    });
  });

  it('un cero registrado vale más que no tener registro', () => {
    const equipos = equiposDe('a', 'conCero', 'sinDato');
    const resultados = resultadosDe('bombas', {
      a: { bombas: 5 },
      conCero: { bombas: 0 },
    });

    const filas = rankearPrueba(pruebaMayor, equipos, resultados);
    const porId = new Map(filas.map((f) => [f.equipoId, f]));

    expect(porId.get('conCero')?.puesto).toBe(2);
    expect(porId.get('sinDato')?.puesto).toBe(3);
    expect(porId.get('sinDato')?.sinRegistro).toBe(true);
  });

  it('los equipos sin registro quedan al fondo empatados entre ellos', () => {
    const equipos = equiposDe('a', 'b', 'c', 'd');
    const resultados = resultadosDe('bombas', { a: { bombas: 5 }, b: { bombas: 3 } });

    const filas = rankearPrueba(pruebaMayor, equipos, resultados);

    expect(filas.map((f) => f.puesto)).toEqual([1, 2, 3, 3]);
  });

  it('sin registro son 0 puntos, no los del último puesto', () => {
    const equipos = equiposDe('conDato', 'sinDato');
    const resultados = resultadosDe('bombas', { conDato: { bombas: 5 } });

    expect(puntosPorEquipo(rankearPrueba(pruebaMayor, equipos, resultados))).toEqual({
      conDato: 10,
      sinDato: 0,
    });
  });

  it('si una prueba no tiene ningún dato, nadie se lleva puntos', () => {
    const equipos = equiposDe('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');

    const filas = rankearPrueba(pruebaMayor, equipos, new Map());

    expect(filas.every((f) => f.puntos === 0)).toBe(true);
    expect(filas.every((f) => f.sinRegistro)).toBe(true);
  });
});

describe('rankearPrueba, gana el menor', () => {
  it('el tiempo más bajo se lleva el primer puesto', () => {
    const equipos = equiposDe('a', 'b', 'c');
    const resultados = resultadosDe('camilla', {
      a: { tiempo: 245 },
      b: { tiempo: 180 },
      c: { tiempo: 310 },
    });

    const filas = rankearPrueba(pruebaMenor, equipos, resultados);

    expect(filas[0].equipoId).toBe('b');
    expect(puntosPorEquipo(filas)).toEqual({ b: 10, a: 9, c: 8 });
  });

  it('quien no terminó queda al fondo aunque tenga un tiempo anotado', () => {
    const equipos = equiposDe('rapido', 'abandono', 'lento');
    const resultados = resultadosDe('camilla', {
      rapido: { tiempo: 200 },
      abandono: { tiempo: 60, noTermino: true },
      lento: { tiempo: 400 },
    });

    const filas = rankearPrueba(pruebaMenor, equipos, resultados);

    expect(filas.map((f) => f.equipoId)).toEqual(['rapido', 'lento', 'abandono']);
    expect(filas[2].descartado).toBe(true);
    expect(filas[2].puntos).toBe(8);
  });

  it('haber participado sin terminar vale más que no tener registro', () => {
    const equipos = equiposDe('termino', 'abandono', 'sinDato');
    const resultados = resultadosDe('camilla', {
      termino: { tiempo: 200 },
      abandono: { noTermino: true },
    });

    const filas = rankearPrueba(pruebaMenor, equipos, resultados);
    const porId = new Map(filas.map((f) => [f.equipoId, f]));

    expect(porId.get('abandono')?.sinRegistro).toBe(false);
    expect(porId.get('abandono')?.puntos).toBe(9);
    expect(porId.get('sinDato')?.puntos).toBe(0);
  });
});

describe('tablaGeneral', () => {
  it('suma los puntos de todas las pruebas y ordena de mayor a menor', () => {
    const equipos = equiposDe('a', 'b');
    const resultados = new Map([
      ...resultadosDe('bombas', { a: { bombas: 10 }, b: { bombas: 5 } }),
      ...resultadosDe('camilla', { a: { tiempo: 200 }, b: { tiempo: 300 } }),
    ]);

    const filas = tablaGeneral([pruebaMayor, pruebaMenor], equipos, resultados);

    expect(filas.map((f) => f.equipoId)).toEqual(['a', 'b']);
    expect(filas.map((f) => f.total)).toEqual([20, 18]);
  });

  it('un empate en puntos lo rompe el menor tiempo de camilla', () => {
    const equipos = equiposDe('a', 'b', 'c');
    const resultados = new Map([
      ...resultadosDe('bombas', { a: { bombas: 10 }, b: { bombas: 5 }, c: { bombas: 1 } }),
      ...resultadosDe('camilla', { a: { tiempo: 300 }, b: { tiempo: 200 }, c: { tiempo: 100 } }),
    ]);

    const filas = tablaGeneral([pruebaMayor, pruebaMenor], equipos, resultados);

    // Los tres suman 18, así que decide la camilla: gana el más rápido.
    expect(filas.map((f) => f.total)).toEqual([18, 18, 18]);
    expect(filas.map((f) => f.equipoId)).toEqual(['c', 'b', 'a']);
    expect(filas.map((f) => f.puesto)).toEqual([1, 2, 3]);
  });

  it('si también empatan en la camilla, el empate se mantiene', () => {
    const equipos = equiposDe('a', 'b');
    const resultados = new Map([
      ...resultadosDe('bombas', { a: { bombas: 7 }, b: { bombas: 7 } }),
      ...resultadosDe('camilla', { a: { tiempo: 240 }, b: { tiempo: 240 } }),
    ]);

    const filas = tablaGeneral([pruebaMayor, pruebaMenor], equipos, resultados);

    expect(filas.map((f) => f.puesto)).toEqual([1, 1]);
  });

  it('quien no tiene registro de camilla pierde el desempate', () => {
    const equipos = equiposDe('conTiempo', 'sinTiempo');
    const resultados = new Map([
      ...resultadosDe('bombas', { conTiempo: { bombas: 7 }, sinTiempo: { bombas: 7 } }),
      ...resultadosDe('camilla', { conTiempo: { tiempo: 600 } }),
    ]);

    const filas = tablaGeneral([pruebaMayor, pruebaMenor], equipos, resultados);

    expect(filas[0].equipoId).toBe('conTiempo');
    expect(filas[0].puesto).toBe(1);
    expect(filas[1].puesto).toBe(2);
    expect(filas[1].valorDesempate).toBeNull();
  });

  it('reporta las pruebas en las que a un equipo le falta registro', () => {
    const equipos = equiposDe('a', 'b');
    const resultados = resultadosDe('bombas', { a: { bombas: 3 } });

    const filas = tablaGeneral([pruebaMayor, pruebaMenor], equipos, resultados);
    const b = filas.find((f) => f.equipoId === 'b');

    expect(b?.pruebasSinRegistro).toEqual(['bombas', 'camilla']);
  });
});
