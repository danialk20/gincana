/**
 * Orden en que los equipos llegan a cada estación.
 *
 * El equipo 1 arranca en la estación 1, el equipo 2 en la estación 2, y así.
 * Cada ronda todos avanzan una estación, dando la vuelta al final.
 *
 * Visto desde una estación, eso significa que el primero en llegar es el equipo
 * con su mismo número, y después van llegando en orden descendente, dando la
 * vuelta: la estación 3 recibe al 3, luego al 2, luego al 1, luego al 10, al 9…
 *
 * Cuando hay menos equipos que estaciones (8 equipos y 10 estaciones), hay rondas
 * en las que a una estación no le llega nadie. Esas rondas simplemente no
 * aparecen en la lista.
 */
export function ordenDeLlegada(
  numeroEstacion: number,
  totalEquipos: number,
  totalEstaciones: number,
): number[] {
  const orden: number[] = [];
  for (let ronda = 1; ronda <= totalEstaciones; ronda += 1) {
    const posicion = (numeroEstacion - ronda) % totalEstaciones;
    const equipo = ((posicion + totalEstaciones) % totalEstaciones) + 1;
    if (equipo <= totalEquipos) orden.push(equipo);
  }
  return orden;
}

/**
 * Reordena una lista de equipos según el orden en que llegan a esa estación.
 *
 * Si hubiera más equipos que estaciones, la rotación no alcanza a nombrarlos a
 * todos. Esos van al final de la lista en vez de desaparecer: es preferible que
 * el juez los vea fuera de orden a que no los vea.
 */
export function ordenarPorLlegada<T>(
  equipos: T[],
  numeroEstacion: number,
  totalEstaciones: number,
): T[] {
  const orden = ordenDeLlegada(numeroEstacion, equipos.length, totalEstaciones);
  const usados = new Set(orden);
  const sobrantes = equipos.map((_, indice) => indice + 1).filter((numero) => !usados.has(numero));
  return [...orden, ...sobrantes].map((numero) => equipos[numero - 1]).filter(Boolean);
}
