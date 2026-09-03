import { describe, expect, it } from 'vitest';
import { ordenDeLlegada, ordenarPorLlegada } from './rotacion';

describe('ordenDeLlegada', () => {
  it('cada estación empieza con el equipo de su mismo número', () => {
    for (let estacion = 1; estacion <= 8; estacion += 1) {
      expect(ordenDeLlegada(estacion, 8, 10)[0]).toBe(estacion);
    }
  });

  it('con 8 equipos y 10 estaciones, la estación 3 los recibe en orden descendente', () => {
    // Ronda 1: el 3. Ronda 2: el 2. Ronda 3: el 1. Ronda 4 y 5: nadie (serían el
    // 10 y el 9, que no existen). Ronda 6: el 8, y sigue bajando.
    expect(ordenDeLlegada(3, 8, 10)).toEqual([3, 2, 1, 8, 7, 6, 5, 4]);
  });

  it('la estación 1 recibe al equipo 1 y luego da la vuelta', () => {
    expect(ordenDeLlegada(1, 8, 10)).toEqual([1, 8, 7, 6, 5, 4, 3, 2]);
  });

  it('las estaciones 9 y 10 no arrancan con nadie, pero reciben a todos', () => {
    const novena = ordenDeLlegada(9, 8, 10);
    expect(novena).toHaveLength(8);
    expect(novena[0]).toBe(8);
    expect([...novena].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('cada equipo pasa por la estación una sola vez', () => {
    for (let estacion = 1; estacion <= 10; estacion += 1) {
      const orden = ordenDeLlegada(estacion, 8, 10);
      expect(new Set(orden).size).toBe(8);
    }
  });

  it('si hay tantos equipos como estaciones, nadie se salta ninguna ronda', () => {
    expect(ordenDeLlegada(5, 10, 10)).toEqual([5, 4, 3, 2, 1, 10, 9, 8, 7, 6]);
  });

  it('funciona con menos equipos de los previstos', () => {
    expect(ordenDeLlegada(2, 5, 10)).toEqual([2, 1, 5, 4, 3]);
  });
});

describe('ordenarPorLlegada', () => {
  it('reordena la lista de equipos dejando de primero al que arranca ahí', () => {
    const equipos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    expect(ordenarPorLlegada(equipos, 3, 10)).toEqual(['C', 'B', 'A', 'H', 'G', 'F', 'E', 'D']);
  });

  it('no pierde ni repite equipos', () => {
    const equipos = [1, 2, 3, 4, 5, 6, 7, 8];
    for (let estacion = 1; estacion <= 10; estacion += 1) {
      const reordenados = ordenarPorLlegada(equipos, estacion, 10);
      expect([...reordenados].sort((a, b) => a - b)).toEqual(equipos);
    }
  });

  it('si hay más equipos que estaciones, los sobrantes van al final pero no se pierden', () => {
    const equipos = Array.from({ length: 13 }, (_, i) => i + 1);
    const reordenados = ordenarPorLlegada(equipos, 3, 10);
    expect(reordenados).toHaveLength(13);
    expect([...reordenados].sort((a, b) => a - b)).toEqual(equipos);
    expect(reordenados.slice(0, 3)).toEqual([3, 2, 1]);
    expect(reordenados.slice(-3)).toEqual([11, 12, 13]);
  });
});
