import { useCallback, useEffect, useMemo, useState } from 'react';
import { PIN_RESULTADOS, PRUEBAS } from '../config/pruebas';
import { segundosATexto } from '../lib/formato';
import { useEnLinea, useEquipos, useResultados } from '../lib/hooks';
import { idResultado, rankearPrueba, tablaGeneral, type FilaGeneral } from '../lib/puntaje';
import type { Equipo, Prueba, Resultado } from '../tipos';
import './tv.css';

type Pantalla = 'presentacion' | 'desempeno' | 'final';

const NOMBRES_PANTALLA: Record<Pantalla, string> = {
  presentacion: 'Equipos',
  desempeno: 'Desempeño',
  final: 'Final',
};

export default function TV() {
  const [pantalla, setPantalla] = useState<Pantalla>('presentacion');
  const [desbloqueadaFinal, setDesbloqueadaFinal] = useState(false);
  const { equipos } = useEquipos();
  const { resultados } = useResultados();
  const enLinea = useEnLinea();

  const general = useMemo(() => tablaGeneral(PRUEBAS, equipos, resultados), [equipos, resultados]);

  /*
   * Los tres puestos del podio, del más bajo al más alto, que es el orden en que
   * se revelan. Se agrupan por puesto y no por posición en la lista para que un
   * empate se anuncie junto: si dos equipos comparten el segundo puesto, salen
   * los dos en la misma revelación.
   */
  const puestosPodio = useMemo(
    () =>
      [...new Set(general.map((fila) => fila.puesto))]
        .sort((a, b) => a - b)
        .slice(0, 3)
        .reverse(),
    [general],
  );

  // Cada puesto son dos pasos: primero el marco tapado y después la revelación.
  // El paso final es el podio completo con la tabla de puntos.
  const [pasoFinal, setPasoFinal] = useState(0);
  const ultimoPasoFinal = puestosPodio.length * 2;
  const moverFinal = useCallback(
    (direccion: number) =>
      setPasoFinal((actual) => Math.min(ultimoPasoFinal, Math.max(0, actual + direccion))),
    [ultimoPasoFinal],
  );

  // La presentación se pasa a mano: la maneja quien esté en el micrófono.
  const [indiceEquipo, setIndiceEquipo] = useState(0);
  const totalDiapositivas = equipos.length + 1; // los equipos uno a uno, y al final todos juntos

  const moverEquipo = useCallback(
    (direccion: number) => {
      setIndiceEquipo((actual) => {
        const siguiente = actual + direccion;
        if (siguiente < 0) return 0;
        if (siguiente > totalDiapositivas - 1) return totalDiapositivas - 1;
        return siguiente;
      });
    },
    [totalDiapositivas],
  );

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (evento.target instanceof HTMLInputElement) return;
      if (evento.key === '1') setPantalla('presentacion');
      if (evento.key === '2') setPantalla('desempeno');
      if (evento.key === '3') setPantalla('final');
      if (pantalla === 'presentacion') {
        if (evento.key === 'ArrowRight') moverEquipo(1);
        if (evento.key === 'ArrowLeft') moverEquipo(-1);
      }
      if (pantalla === 'final' && desbloqueadaFinal) {
        if (evento.key === 'ArrowRight' || evento.key === ' ' || evento.key === 'Enter') {
          evento.preventDefault();
          moverFinal(1);
        }
        if (evento.key === 'ArrowLeft') moverFinal(-1);
      }
    }
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [pantalla, moverEquipo, moverFinal, desbloqueadaFinal]);

  return (
    <div className="tv">
      {!enLinea && <div className="tv-alerta-red">Sin conexión · datos no actualizados</div>}

      {pantalla === 'presentacion' && (
        <Presentacion
          equipos={equipos}
          indice={indiceEquipo}
          total={totalDiapositivas}
          alMover={moverEquipo}
        />
      )}
      {pantalla === 'desempeno' && <Desempeno equipos={equipos} resultados={resultados} />}
      {pantalla === 'final' &&
        (desbloqueadaFinal ? (
          <Final
            equipos={equipos}
            resultados={resultados}
            general={general}
            puestosPodio={puestosPodio}
            paso={pasoFinal}
            alAvanzar={() => moverFinal(1)}
          />
        ) : (
          <Candado alAbrir={() => setDesbloqueadaFinal(true)} />
        ))}

      <div className="tv-selector">
        {(Object.keys(NOMBRES_PANTALLA) as Pantalla[]).map((clave) => (
          <button
            key={clave}
            aria-selected={pantalla === clave}
            onClick={() => setPantalla(clave)}
          >
            {NOMBRES_PANTALLA[clave]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────── Pantalla 1: presentación ─────────────────────────

function Presentacion({
  equipos,
  indice,
  total,
  alMover,
}: {
  equipos: Equipo[];
  indice: number;
  total: number;
  alMover: (direccion: number) => void;
}) {
  if (equipos.length === 0) {
    return (
      <Marco titulo="Gincana" contexto="Presentación de los equipos">
        <div className="tv-vacio">
          Todavía no hay equipos cargados. Créalos desde la pantalla de Organización.
        </div>
      </Marco>
    );
  }

  const esResumen = indice >= equipos.length;
  const equipo = equipos[indice];

  return (
    <Marco
      titulo={esResumen ? 'Todos los equipos' : 'Nuestros equipos'}
      contexto={esResumen ? `${equipos.length} equipos` : `${indice + 1} de ${equipos.length}`}
      total={total}
      activo={indice}
    >
      <button
        className="tv-flecha izquierda"
        onClick={() => alMover(-1)}
        disabled={indice === 0}
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        className="tv-flecha derecha"
        onClick={() => alMover(1)}
        disabled={indice === total - 1}
        aria-label="Siguiente"
      >
        ›
      </button>

      {esResumen ? (
        <TodosLosEquipos equipos={equipos} />
      ) : (
        <div className="tv-presentacion">
          <Retrato equipo={equipo} clase="tv-foto" />
          <div>
            <h2 className="tv-nombre-equipo" style={{ color: equipo.color }}>
              {equipo.nombre}
            </h2>
            <ul className="tv-integrantes">
              {equipo.integrantes.filter(Boolean).map((integrante) => (
                <li key={integrante}>
                  <span className="tv-vineta" style={{ background: equipo.color }} />
                  {integrante}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Marco>
  );
}

function TodosLosEquipos({ equipos }: { equipos: Equipo[] }) {
  return (
    <div className="tv-todos">
      {equipos.map((equipo) => (
        <div className="tv-tarjeta-equipo" key={equipo.id}>
          <Retrato equipo={equipo} clase="tv-foto-chica" />
          <div className="etiqueta" style={{ borderColor: equipo.color }}>
            <span className="numero" style={{ background: equipo.color }}>
              {equipo.orden}
            </span>
            <span className="nombre">{equipo.nombre}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Retrato({ equipo, clase }: { equipo: Equipo; clase: string }) {
  if (equipo.fotoDataUrl) {
    return <img className={clase} src={equipo.fotoDataUrl} alt={equipo.nombre} />;
  }
  return (
    <div className={`${clase} tv-foto-vacia`} style={{ background: equipo.color }}>
      {equipo.orden}
    </div>
  );
}

// ───────────────────────── Pantalla 2: desempeño ─────────────────────────

/** El valor tal cual, sin unidad: la unidad ya está en el encabezado de la columna. */
function valorCorto(prueba: Prueba, valor: number | null, descartado: boolean): string {
  if (descartado) return '✕';
  if (valor === null) return '·';
  const campo = prueba.campos.find((c) => c.id === prueba.criterio.campoId);
  if (campo?.tipo === 'tiempo') return segundosATexto(valor);
  return String(valor);
}

function Desempeno({
  equipos,
  resultados,
}: {
  equipos: Equipo[];
  resultados: Map<string, Resultado>;
}) {
  // Una sola tabla: filas fijas por equipo, columnas por prueba. Las celdas se
  // van llenando a medida que los equipos pasan por cada estación.
  const porPrueba = useMemo(() => {
    const mapa = new Map<string, Map<string, { valor: number | null; descartado: boolean; puesto: number }>>();
    for (const prueba of PRUEBAS) {
      const filas = rankearPrueba(prueba, equipos, resultados);
      mapa.set(
        prueba.id,
        new Map(
          filas.map((fila) => [
            fila.equipoId,
            { valor: fila.sinRegistro ? null : fila.valor, descartado: fila.descartado, puesto: fila.puesto },
          ]),
        ),
      );
    }
    return mapa;
  }, [equipos, resultados]);

  const capturados = useMemo(() => {
    let cuenta = 0;
    for (const prueba of PRUEBAS) {
      for (const equipo of equipos) {
        if (resultados.has(idResultado(prueba.id, equipo.id))) cuenta += 1;
      }
    }
    return cuenta;
  }, [equipos, resultados]);

  if (equipos.length === 0) {
    return (
      <Marco titulo="Desempeño en vivo" contexto="Esperando datos">
        <div className="tv-vacio">
          Apenas los jueces empiecen a registrar, los resultados aparecen aquí solos.
        </div>
      </Marco>
    );
  }

  return (
    <Marco
      titulo="Desempeño en vivo"
      contexto={`${capturados} de ${PRUEBAS.length * equipos.length} pruebas registradas`}
    >
      <div className="tv-matriz-caja">
        <table className="tv-matriz">
          <thead>
            <tr>
              <th className="esquina">Equipo</th>
              {PRUEBAS.map((prueba) => (
                <th key={prueba.id}>
                  <span className="orden">{prueba.orden}</span>
                  <span className="corto">{prueba.nombreCorto}</span>
                  <span className="unidad">{prueba.unidad}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equipos.map((equipo) => (
              <tr key={equipo.id}>
                <th className="equipo" style={{ color: equipo.color }}>
                  <span className="punto" style={{ background: equipo.color }} />
                  {equipo.nombre}
                </th>
                {PRUEBAS.map((prueba) => {
                  const celda = porPrueba.get(prueba.id)?.get(equipo.id);
                  const lidera = celda?.puesto === 1 && celda.valor !== null;
                  return (
                    <td
                      key={prueba.id}
                      data-vacia={celda?.valor === null ? 'si' : 'no'}
                      data-lider={lidera ? 'si' : 'no'}
                    >
                      {valorCorto(prueba, celda?.valor ?? null, celda?.descartado ?? false)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Marco>
  );
}

// ───────────────────────── Pantalla 3: resultados finales ─────────────────────────

function Candado({ alAbrir }: { alAbrir: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  return (
    <Marco titulo="Resultados finales" contexto="Pantalla bloqueada">
      <form
        className="tv-candado"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (pin === PIN_RESULTADOS) alAbrir();
          else {
            setError(true);
            setPin('');
          }
        }}
      >
        <p style={{ fontSize: '1.6vw', color: '#94a3b8', margin: 0 }}>
          Escribe el PIN para revelar el podio y la tabla de puntos.
        </p>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={4}
          autoFocus
          value={pin}
          onChange={(evento) => {
            setPin(evento.target.value.replace(/\D/g, ''));
            setError(false);
          }}
        />
        <button type="submit" className="tv-boton-revelar">
          Revelar resultados
        </button>
        {error && <p style={{ color: '#fca5a5', fontSize: '1.4vw', margin: 0 }}>PIN incorrecto.</p>}
      </form>
    </Marco>
  );
}

const ORDINALES = [
  'PRIMER',
  'SEGUNDO',
  'TERCER',
  'CUARTO',
  'QUINTO',
  'SEXTO',
  'SÉPTIMO',
  'OCTAVO',
  'NOVENO',
  'DÉCIMO',
];

const MEDALLAS = ['🥇', '🥈', '🥉'];

function nombrePuesto(puesto: number): string {
  const ordinal = ORDINALES[puesto - 1];
  return ordinal ? `${ordinal} PUESTO` : `PUESTO ${puesto}`;
}

/**
 * La premiación, paso a paso: se anuncia el tercer puesto con el marco tapado,
 * se destapa, y así hasta el primero. Al final aparece el podio con la tabla.
 *
 * Avanza con clic en la pantalla, con la flecha derecha o con la barra
 * espaciadora; la flecha izquierda devuelve, por si se adelantaron.
 */
function Final({
  equipos,
  resultados,
  general,
  puestosPodio,
  paso,
  alAvanzar,
}: {
  equipos: Equipo[];
  resultados: Map<string, Resultado>;
  general: FilaGeneral[];
  puestosPodio: number[];
  paso: number;
  alAvanzar: () => void;
}) {
  const porId = useMemo(() => new Map(equipos.map((e) => [e.id, e])), [equipos]);

  if (general.length === 0) {
    return (
      <Marco titulo="Resultados finales" contexto="">
        <div className="tv-vacio">No hay equipos cargados.</div>
      </Marco>
    );
  }

  if (paso >= puestosPodio.length * 2) {
    return <PodioCompleto equipos={equipos} resultados={resultados} />;
  }

  const puesto = puestosPodio[Math.floor(paso / 2)];
  const revelado = paso % 2 === 1;
  const ganadores = general.filter((fila) => fila.puesto === puesto);

  return (
    <Marco titulo="Resultados finales" contexto="">
      <div className="tv-ceremonia" onClick={alAvanzar}>
        <p className="rotulo">
          {puesto <= 3 && <span className="medalla">{MEDALLAS[puesto - 1]}</span>}
          {nombrePuesto(puesto)}
        </p>

        <div className="tv-ganadores">
          {ganadores.map((fila) => {
            const equipo = porId.get(fila.equipoId);
            if (!equipo) return null;
            return (
              <div className="tv-ganador" key={fila.equipoId}>
                {revelado ? (
                  <>
                    <Retrato equipo={equipo} clase="tv-foto-ganador" />
                    <div className="nombre" style={{ color: equipo.color }}>
                      {equipo.nombre}
                    </div>
                    <div className="puntos">{fila.total} puntos</div>
                  </>
                ) : (
                  <>
                    <div className="tv-marco-misterio">?</div>
                    <div className="nombre tapado">· · · · ·</div>
                    <div className="puntos tapado">· · ·</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="pista">
          {revelado
            ? 'Toca la pantalla o presiona → para seguir'
            : 'Toca la pantalla o presiona → para revelar'}
        </p>
      </div>
    </Marco>
  );
}

function PodioCompleto({
  equipos,
  resultados,
}: {
  equipos: Equipo[];
  resultados: Map<string, Resultado>;
}) {
  const general = useMemo(() => tablaGeneral(PRUEBAS, equipos, resultados), [equipos, resultados]);
  const porId = useMemo(() => new Map(equipos.map((e) => [e.id, e])), [equipos]);
  const podio = general.slice(0, 3);
  const medallas = ['🥇', '🥈', '🥉'];
  // El segundo va a la izquierda y el tercero a la derecha, como un podio de verdad.
  const ordenVisual = [podio[1], podio[0], podio[2]].filter(Boolean);
  // Solo se explica el desempate si de verdad hubo empates que resolver.
  const hayEmpateEnPuntos = new Set(general.map((fila) => fila.total)).size < general.length;

  if (general.length === 0) {
    return (
      <Marco titulo="Resultados finales" contexto="">
        <div className="tv-vacio">No hay equipos cargados.</div>
      </Marco>
    );
  }

  return (
    <Marco titulo="Resultados finales" contexto="Gincana">
      <div className="tv-final">
        <div className="tv-podio">
          {ordenVisual.map((fila) => {
            const equipo = porId.get(fila.equipoId);
            if (!equipo) return null;
            return (
              <div className="tv-cajon" key={fila.equipoId} data-puesto={fila.puesto}>
                <div className="medalla">{medallas[fila.puesto - 1] ?? ''}</div>
                <Retrato equipo={equipo} clase="tv-foto-podio" />
                <div className="nombre">{equipo.nombre}</div>
                <div className="puntos">{fila.total} pts</div>
              </div>
            );
          })}
        </div>

        <table className="tv-tabla-final">
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              {PRUEBAS.map((prueba) => (
                <th key={prueba.id} className="num" title={prueba.nombre}>
                  {prueba.orden}
                </th>
              ))}
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {general.map((fila) => {
              const equipo = porId.get(fila.equipoId);
              return (
                <tr key={fila.equipoId}>
                  <td>{fila.puesto}</td>
                  <td style={{ color: equipo?.color, fontWeight: 700 }}>{equipo?.nombre}</td>
                  {PRUEBAS.map((prueba) => (
                    <td key={prueba.id} className="num">
                      {fila.puntosPorPrueba[prueba.id] ?? 0}
                    </td>
                  ))}
                  <td className="num total">{fila.total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {hayEmpateEnPuntos && (
          <p className="tv-nota">
            Los empates en puntos se resuelven con el menor tiempo en el transporte en camilla.
          </p>
        )}
      </div>
    </Marco>
  );
}

// ───────────────────────── Marco común ─────────────────────────

function Marco({
  titulo,
  contexto,
  total,
  activo,
  children,
}: {
  titulo: string;
  contexto: string;
  total?: number;
  activo?: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="tv-encabezado">
        <h1>{titulo}</h1>
        <span className="contexto">{contexto}</span>
        {total !== undefined && total > 1 && (
          <span className="tv-puntos">
            {Array.from({ length: total }, (_, posicion) => (
              <span
                key={posicion}
                className="tv-punto"
                data-activo={posicion === activo ? 'si' : 'no'}
              />
            ))}
          </span>
        )}
      </div>
      <div className="tv-cuerpo">{children}</div>
    </>
  );
}
