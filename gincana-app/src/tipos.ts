/** Tipos compartidos por toda la app. */

export type TipoCampo = 'entero' | 'tiempo' | 'booleano';

export interface Campo {
  id: string;
  label: string;
  tipo: TipoCampo;
  /** Texto de apoyo que ve el juez debajo del campo. */
  ayuda?: string;
  unidad?: string;
  /** Cuánto suma o resta cada toque de los botones + / −. */
  paso?: number;
}

export interface Prueba {
  id: string;
  orden: number;
  nombre: string;
  /** Versión corta para la tabla del televisor, donde el espacio es oro. */
  nombreCorto: string;
  /** Qué se cuenta, en una palabra: bombas, huevos, goles, tiempo. */
  unidad: string;
  /** Cómo se juega, para que el juez lo tenga a la mano. */
  descripcion: string;
  /** Lo que el juez debe vigilar sí o sí. */
  vigilar: string[];
  pin: string;
  campos: Campo[];
  criterio: {
    /** Campo que decide el puesto en esta estación. */
    campoId: string;
    direccion: 'mayor' | 'menor';
    /** Campo booleano que, si está marcado, manda al equipo al último puesto. */
    campoDescarta?: string;
  };
}

export interface Equipo {
  id: string;
  nombre: string;
  orden: number;
  color: string;
  integrantes: string[];
  /** Foto comprimida como data URL. */
  fotoDataUrl?: string;
}

export type ValorCampo = number | boolean;

export interface Resultado {
  /** Siempre `${pruebaId}__${equipoId}`. */
  id: string;
  pruebaId: string;
  equipoId: string;
  valores: Record<string, ValorCampo>;
  notas: string;
  actualizadoEn: number;
  /** Nombre que el juez le puso a su dispositivo, para rastrear quién capturó qué. */
  juez: string;
}

export interface FilaRanking {
  equipoId: string;
  /** Valor del campo que decide, ya normalizado. */
  valor: number | null;
  descartado: boolean;
  /** Puesto con ranking estándar: 1, 2, 2, 2, 5, … */
  puesto: number;
  puntos: number;
  sinRegistro: boolean;
}
