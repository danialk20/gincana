import type { Prueba } from '../tipos';

/**
 * Las 10 estaciones de la gincana.
 *
 * Regla general (aplica a todas): la estación dura 5 minutos y deben pasar los 5
 * integrantes. Si sobra tiempo siguen pasando en el mismo orden hasta que se acabe.
 * Todo lo que hagan de más suma.
 *
 * El PIN es el que el juez escribe para entrar a su estación. Cámbialos si quieres,
 * pero acuérdate de reimprimir la hoja de jueces (vista /imprimir).
 */
export const PRUEBAS: Prueba[] = [
  {
    id: 'encostalados',
    orden: 1,
    nombre: 'Encostalados y tiro al blanco',
    nombreCorto: 'Encostalados',
    unidad: 'aciertos',
    pin: '6108',
    descripcion:
      'Cuatro integrantes saltan en costal del punto A al B, dejan los costales y corren a la mesa de bandas elásticas y ganzúas. Los cinco disparan uno a uno a las dianas; cada uno tira hasta acertar al menos una vez. Cuando ya pasaron los cinco, el equipo escoge a su mejor tirador para seguir el resto del tiempo.',
    vigilar: [
      'Los cuatro encostalados van saltando, no corriendo con el costal en la mano.',
      'Cada uno de los cinco tira hasta acertar al menos una vez antes de pasar al siguiente.',
      'Solo después de que pasaron los cinco puede repetir el mejor tirador.',
    ],
    campos: [
      {
        id: 'aciertos',
        label: 'Tiros acertados',
        tipo: 'entero',
        ayuda: 'Total de impactos del equipo. Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'aciertos', direccion: 'mayor' },
  },
  {
    id: 'pista-enjabonada',
    orden: 2,
    nombre: 'Pista enjabonada',
    nombreCorto: 'Pista enjabonada',
    unidad: 'marcas',
    pin: '8130',
    descripcion:
      'Uno a uno recorren la pista de plástico enjabonada de A a B llevando un trozo de espuma. En B empapan la espuma en los baldes de agua de color y regresan por la pista hasta A, donde la exprimen dentro de la botella. Cuando termina uno arranca el siguiente; completados los cinco siguen en el mismo orden.',
    vigilar: [
      'El siguiente no arranca hasta que el anterior exprima la espuma en la botella.',
      'La espuma se moja solo en el balde, no se llena la botella de otra forma.',
      'Se respeta el mismo orden de integrantes en cada vuelta.',
    ],
    campos: [
      {
        id: 'volumen',
        label: 'Agua acumulada en la botella',
        tipo: 'entero',
        unidad: 'marcas',
        ayuda: 'Lee la línea de volumen que alcanzó la botella. Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'volumen', direccion: 'mayor' },
  },
  {
    id: 'concertina',
    orden: 3,
    nombre: 'Paso de concertina',
    nombreCorto: 'Concertina',
    unidad: 'bombas',
    pin: '5926',
    descripcion:
      'Uno a uno se arrastran de A a B por debajo de las cuerdas, pasando por la zanja con agua o lodo. En B se levantan, toman un palo de pincho con la boca y revientan dos bombas: una de agua y una de aire con harina. Regresan arrastrándose hasta A y ahí arranca el siguiente. Completados los cinco siguen en el mismo orden.',
    vigilar: [
      'Nadie arranca hasta que el anterior regrese completo al punto A.',
      'Las bombas se revientan con el palo en la boca, sin ayuda de las manos ni de otros.',
      'Se hace todo el recorrido arrastrado, sin levantarse en la zanja.',
    ],
    campos: [
      {
        id: 'bombas',
        label: 'Bombas reventadas',
        tipo: 'entero',
        ayuda: 'Total del equipo, incluidas las de las vueltas extra. Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'bombas', direccion: 'mayor' },
  },
  {
    id: 'catapulta',
    orden: 4,
    nombre: 'Lanzamiento de balones',
    nombreCorto: 'Catapulta',
    unidad: 'impactos',
    pin: '3184',
    descripcion:
      'Un integrante se ubica en la cauchera o catapulta y debe pasar el balón por encima del obstáculo para pegarle a la diana (la sábana). Los otros cuatro se distribuyen en la zona de caída para recuperar los balones y devolvérselos lo más rápido posible. El equipo solo tiene tres balones.',
    vigilar: [
      'El balón pasa por encima del obstáculo; si va por debajo o por fuera no cuenta.',
      'Solo usan los tres balones asignados.',
      'El tirador dispara desde la posición marcada.',
    ],
    campos: [
      {
        id: 'impactos',
        label: 'Veces que el balón pegó en la diana',
        tipo: 'entero',
        ayuda: 'Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'impactos', direccion: 'mayor' },
  },
  {
    id: 'pesca',
    orden: 5,
    nombre: 'Pesca milagrosa',
    nombreCorto: 'Pesca',
    unidad: 'pescados',
    pin: '7052',
    descripcion:
      'Uno a uno se suben a una caneca, se sientan y con la caña de pescar sacan un pescadito de la batea, giran y lo depositan en el platón. Cuando lo logran se bajan y sube el siguiente. Completados los cinco siguen pescando en el mismo orden.',
    vigilar: [
      'Pescan sentados sobre la caneca, sin apoyar los pies en el piso.',
      'El pescado cuenta solo cuando queda dentro del platón.',
      'El siguiente sube apenas el anterior se baja, no antes.',
    ],
    campos: [
      {
        id: 'pescados',
        label: 'Pescados depositados en el platón',
        tipo: 'entero',
        ayuda: 'Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'pescados', direccion: 'mayor' },
  },
  {
    id: 'bolos',
    orden: 6,
    nombre: 'Bolos con llanta',
    nombreCorto: 'Bolos',
    unidad: 'botellas',
    pin: '6493',
    descripcion:
      'El equipo impulsa la llanta de camión hasta el punto de suelta, desde donde rueda por la pista para derribar seis botellas puestas como bolos. Si tumban las seis de un solo tiro se reponen todas y arranca ronda nueva. Si tumban menos, vuelven a lanzar hasta derribar las que queden en pie; solo cuando caen todas se arma otra ronda.',
    vigilar: [
      'La llanta se suelta desde el punto marcado, ni un paso más adelante.',
      'Las botellas se reponen solo cuando cayeron las seis.',
      'Cuentan las botellas derribadas por la llanta, no las que tumben con el cuerpo.',
    ],
    campos: [
      {
        id: 'botellas',
        label: 'Botellas derribadas',
        tipo: 'entero',
        ayuda: 'Total acumulado de toda la estación. Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'botellas', direccion: 'mayor' },
  },
  {
    id: 'equilibrio',
    orden: 7,
    nombre: 'Prueba de equilibrio',
    nombreCorto: 'Equilibrio',
    unidad: 'balones',
    pin: '2867',
    descripcion:
      'Cuatro integrantes sostienen una tabla con cuatro lazos y transportan sobre ella un balón de baloncesto de A a B, donde lo depositan en la caneca o cesta. El quinto integrante hace de guía. Si el balón se cae en el trayecto, o cae por fuera de la cesta, el intento no vale y arrancan de nuevo desde cero.',
    vigilar: [
      'Nadie toca el balón con las manos ni con el cuerpo durante el trayecto.',
      'Si el balón cae, vuelven al punto A y arrancan de cero.',
      'El guía no sostiene la tabla, solo dirige.',
    ],
    campos: [
      {
        id: 'balones',
        label: 'Balones depositados dentro de la cesta',
        tipo: 'entero',
        ayuda: 'Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'balones', direccion: 'mayor' },
  },
  {
    id: 'penal-mareado',
    orden: 8,
    nombre: 'Penal mareado',
    nombreCorto: 'Penal mareado',
    unidad: 'goles',
    pin: '9315',
    descripcion:
      'Uno a uno llegan hasta el palo clavado en la tierra, le dan cinco vueltas alrededor y salen de inmediato a patear el balón hacia la portería. Terminado su turno arranca el siguiente. Completados los cinco siguen en el mismo orden. Si alguien queda muy mareado o se siente mal, se salta su turno y pasa el siguiente.',
    vigilar: [
      'Cuenta las cinco vueltas completas antes de que salgan a patear.',
      'Patean de inmediato, sin pausa para estabilizarse.',
      'Si alguien se siente mal, se salta el turno sin discusión. La salud va primero.',
    ],
    campos: [
      {
        id: 'goles',
        label: 'Goles conseguidos',
        tipo: 'entero',
        ayuda: 'Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'goles', direccion: 'mayor' },
  },
  {
    id: 'quiebrahuevos',
    orden: 9,
    nombre: 'Quiebrahuevos',
    nombreCorto: 'Quiebrahuevos',
    unidad: 'huevos',
    pin: '1748',
    descripcion:
      'Los cinco forman una cadena humana entre A y B, cada uno con un panel de huevos en las manos. Desde A se pasan los huevos lanzándolos de uno en uno a lo largo de la cadena. El último lo lanza al panel que está en el piso sobre la colchoneta. Solo cuando un huevo llega completo a ese panel pueden arrancar con el siguiente.',
    vigilar: [
      'Los huevos se lanzan, no se entregan en la mano.',
      'No arrancan con el siguiente huevo hasta que el anterior llegue al panel del piso.',
      'Solo cuenta el huevo que queda entero en el panel final.',
    ],
    campos: [
      {
        id: 'huevos',
        label: 'Huevos que llegaron enteros al panel',
        tipo: 'entero',
        ayuda: 'Este dato define el puesto.',
      },
    ],
    criterio: { campoId: 'huevos', direccion: 'mayor' },
  },
  {
    id: 'camilla',
    orden: 10,
    nombre: 'Transporte en camilla',
    nombreCorto: 'Camilla',
    unidad: 'tiempo',
    pin: '5039',
    descripcion:
      'El equipo llega hasta la camilla, inmoviliza al paciente (uno de ellos) en la tabla rígida con todas las medidas de seguridad y lo transporta por la pista de obstáculos hasta la ambulancia. Allí lo pasan de la tabla rígida a la camilla de la ambulancia, la suben y cierran la puerta. Al cerrar la puerta termina la prueba.',
    vigilar: [
      'La inmovilización se hace completa antes de arrancar el traslado.',
      'El cronómetro corre desde la señal de salida hasta que cierran la puerta de la ambulancia.',
      'Esta prueba puede pasarse de los 5 minutos: déjalos terminar y anota el tiempo real.',
    ],
    campos: [
      {
        id: 'tiempo',
        label: 'Tiempo total del recorrido',
        tipo: 'tiempo',
        ayuda: 'Minutos y segundos. Gana el menor tiempo.',
      },
    ],
    criterio: { campoId: 'tiempo', direccion: 'menor' },
  },
];

export const PRUEBAS_POR_ID = new Map(PRUEBAS.map((p) => [p.id, p]));

/**
 * Prueba que desempata la tabla general cuando dos equipos suman lo mismo.
 *
 * Se escogió el transporte en camilla por dos razones: es la prueba más ligada al
 * oficio del personal del hospital, y al medirse en tiempo es la que menos
 * probabilidades tiene de volver a empatar.
 */
export const ID_PRUEBA_DESEMPATE = 'camilla';

/** PIN de la pantalla de resultados finales del televisor. */
export const PIN_RESULTADOS = '2580';

/** PIN de la pantalla de administración (crear equipos, respaldos). */
export const PIN_ADMIN = '1379';
