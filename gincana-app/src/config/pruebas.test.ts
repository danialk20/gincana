import { describe, expect, it } from 'vitest';
import { PIN_ADMIN, PIN_RESULTADOS, PRUEBAS } from './pruebas';

describe('configuración de las 10 estaciones', () => {
  it('son 10, numeradas del 1 al 10', () => {
    expect(PRUEBAS).toHaveLength(10);
    expect(PRUEBAS.map((p) => p.orden)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('cada estación pide un solo dato, aparte de las observaciones', () => {
    for (const prueba of PRUEBAS) {
      expect(prueba.campos, `${prueba.nombre} debería tener una sola casilla`).toHaveLength(1);
    }
  });

  it('el dato que se pide es exactamente el que decide el puesto', () => {
    for (const prueba of PRUEBAS) {
      expect(prueba.criterio.campoId).toBe(prueba.campos[0].id);
      expect(prueba.criterio.campoDescarta).toBeUndefined();
    }
  });

  it('solo la camilla se gana con el menor valor', () => {
    const porMenor = PRUEBAS.filter((p) => p.criterio.direccion === 'menor');
    expect(porMenor.map((p) => p.id)).toEqual(['camilla']);
    expect(porMenor[0].campos[0].tipo).toBe('tiempo');
  });

  it('los PIN son de 4 dígitos y no se repiten entre sí ni con los de la organización', () => {
    const pines = PRUEBAS.map((p) => p.pin);
    for (const pin of pines) expect(pin).toMatch(/^\d{4}$/);
    expect(new Set([...pines, PIN_ADMIN, PIN_RESULTADOS]).size).toBe(pines.length + 2);
  });

  it('ninguna estación se queda sin nombre corto ni sin unidad para el televisor', () => {
    for (const prueba of PRUEBAS) {
      expect(prueba.nombreCorto.length).toBeGreaterThan(0);
      expect(prueba.unidad.length).toBeGreaterThan(0);
      expect(prueba.vigilar.length).toBeGreaterThan(0);
    }
  });
});
