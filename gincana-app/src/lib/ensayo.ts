import { PRUEBAS } from '../config/pruebas';
import type { Equipo, Resultado, ValorCampo } from '../tipos';
import { PREFIJO_ENSAYO } from './almacen';
import { idResultado } from './puntaje';

const NOMBRES_EQUIPO = [
  'Urgencias',
  'Pediatría',
  'Laboratorio',
  'Cirugía',
  'Enfermería',
  'Farmacia',
  'Administración',
  'Mantenimiento',
];

const COLORES = [
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
];

const NOMBRES_PERSONA = [
  'Ana',
  'Carlos',
  'Marcela',
  'Julián',
  'Paola',
  'Andrés',
  'Luisa',
  'Óscar',
  'Diana',
  'Felipe',
];

function entreLosDos(minimo: number, maximo: number): number {
  return minimo + Math.floor(Math.random() * (maximo - minimo + 1));
}

/**
 * Arma un evento completo de mentiras para ensayar: 8 equipos con integrantes y
 * datos capturados en las 10 estaciones. Sirve para ver el televisor lleno y
 * revisar que los puntajes cuadren antes del día real.
 */
export function generarEnsayo(): { equipos: Equipo[]; resultados: Resultado[] } {
  const equipos: Equipo[] = NOMBRES_EQUIPO.map((nombre, indice) => ({
    id: `${PREFIJO_ENSAYO}${indice + 1}`,
    nombre,
    orden: indice + 1,
    color: COLORES[indice % COLORES.length],
    integrantes: Array.from(
      { length: 5 },
      (_, posicion) => `${NOMBRES_PERSONA[(indice + posicion) % NOMBRES_PERSONA.length]} ${posicion + 1}`,
    ),
  }));

  const resultados: Resultado[] = [];

  for (const prueba of PRUEBAS) {
    for (const equipo of equipos) {
      const valores: Record<string, ValorCampo> = {};
      for (const campo of prueba.campos) {
        if (campo.tipo === 'booleano') {
          valores[campo.id] = Math.random() > 0.25;
        } else if (campo.tipo === 'tiempo') {
          valores[campo.id] = entreLosDos(180, 420);
        } else {
          valores[campo.id] = entreLosDos(0, 14);
        }
      }
      resultados.push({
        id: idResultado(prueba.id, equipo.id),
        pruebaId: prueba.id,
        equipoId: equipo.id,
        valores,
        notas: '',
        actualizadoEn: Date.now(),
        juez: 'ensayo',
      });
    }
  }

  return { equipos, resultados };
}
