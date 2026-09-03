import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import CampoEntrada from '../componentes/CampoEntrada';
import EstadoSync from '../componentes/EstadoSync';
import { PRUEBAS, PRUEBAS_POR_ID } from '../config/pruebas';
import { obtenerAlmacen } from '../lib/almacen';
import { useEquipos, usePersistido, useResultados } from '../lib/hooks';
import { idResultado } from '../lib/puntaje';
import { ordenarPorLlegada } from '../lib/rotacion';
import type { Prueba, Resultado, ValorCampo } from '../tipos';

export default function Juez() {
  const [pruebaId, setPruebaId] = usePersistido<string | null>('gincana.juez.estacion', null);
  const [desbloqueada, setDesbloqueada] = usePersistido<string | null>(
    'gincana.juez.desbloqueada',
    null,
  );
  const [nombreJuez, setNombreJuez] = usePersistido<string>('gincana.juez.nombre', '');

  const prueba = pruebaId ? PRUEBAS_POR_ID.get(pruebaId) : undefined;

  function salir() {
    setPruebaId(null);
    setDesbloqueada(null);
  }

  if (!prueba) {
    return <ElegirEstacion alElegir={setPruebaId} />;
  }

  if (desbloqueada !== prueba.id) {
    return (
      <PedirPin
        prueba={prueba}
        nombreJuez={nombreJuez}
        alCambiarNombre={setNombreJuez}
        alDesbloquear={() => setDesbloqueada(prueba.id)}
        alVolver={() => setPruebaId(null)}
      />
    );
  }

  return <Captura prueba={prueba} nombreJuez={nombreJuez} alSalir={salir} />;
}

// ───────────────────────── Paso 1: elegir estación ─────────────────────────

function ElegirEstacion({ alElegir }: { alElegir: (id: string) => void }) {
  return (
    <>
      <div className="barra">
        <h1>
          ¿Cuál es tu estación?
          <span className="sub">Se queda guardada en este celular</span>
        </h1>
      </div>
      <div className="pantalla">
        <div className="lista-equipos">
          {PRUEBAS.map((prueba) => (
            <button key={prueba.id} className="opcion" onClick={() => alElegir(prueba.id)}>
              <strong>
                {prueba.orden}. {prueba.nombre}
              </strong>
              <span className="tenue">{prueba.campos[0].label}</span>
            </button>
          ))}
        </div>
        <p className="tenue" style={{ marginTop: 20 }}>
          <Link to="/">Volver al inicio</Link>
        </p>
      </div>
    </>
  );
}

// ───────────────────────── Paso 2: PIN ─────────────────────────

function PedirPin({
  prueba,
  nombreJuez,
  alCambiarNombre,
  alDesbloquear,
  alVolver,
}: {
  prueba: Prueba;
  nombreJuez: string;
  alCambiarNombre: (nombre: string) => void;
  alDesbloquear: () => void;
  alVolver: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  function comprobar(evento: React.FormEvent) {
    evento.preventDefault();
    if (pin.trim() === prueba.pin) {
      alDesbloquear();
    } else {
      setError(true);
      setPin('');
    }
  }

  return (
    <>
      <div className="barra">
        <button className="boton-fantasma" onClick={alVolver} aria-label="Cambiar de estación">
          ‹
        </button>
        <h1>
          {prueba.nombre}
          <span className="sub">Estación {prueba.orden}</span>
        </h1>
      </div>
      <div className="pantalla">
        <form className="tarjeta" onSubmit={comprobar}>
          <div className="campo">
            <label htmlFor="pin">PIN de la estación</label>
            <p className="ayuda">Está en la hoja que te entregaron.</p>
            <input
              id="pin"
              className="texto"
              type="tel"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '0.4em' }}
              value={pin}
              onChange={(evento) => {
                setPin(evento.target.value.replace(/\D/g, ''));
                setError(false);
              }}
            />
          </div>

          {error && <div className="aviso aviso-error">Ese PIN no es el de esta estación.</div>}

          <div className="campo">
            <label htmlFor="nombre-juez">Tu nombre (opcional)</label>
            <p className="ayuda">Sirve para saber quién anotó cada dato si hay que revisar algo.</p>
            <input
              id="nombre-juez"
              className="texto"
              value={nombreJuez}
              onChange={(evento) => alCambiarNombre(evento.target.value)}
            />
          </div>

          <button className="boton boton-grande" type="submit" disabled={pin.length < 4}>
            Entrar
          </button>
        </form>
      </div>
    </>
  );
}

// ───────────────────────── Paso 3: captura ─────────────────────────

function Captura({
  prueba,
  nombreJuez,
  alSalir,
}: {
  prueba: Prueba;
  nombreJuez: string;
  alSalir: () => void;
}) {
  const { equipos, cargando } = useEquipos();
  const { resultados, cargando: cargandoResultados } = useResultados();
  const [indice, setIndice] = useState(0);
  const [valores, setValores] = useState<Record<string, ValorCampo>>({});
  const [notas, setNotas] = useState('');
  const [sucio, setSucio] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState<number | null>(null);
  const [verReglas, setVerReglas] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Los equipos no salen del 1 al 8, sino en el orden en que van a llegar a esta
  // estación: primero el que arranca aquí, después los que le siguen en la rotación.
  const equiposEnOrden = useMemo(
    () => ordenarPorLlegada(equipos, prueba.orden, PRUEBAS.length),
    [equipos, prueba.orden],
  );

  const equipo = equiposEnOrden[indice];
  const idActual = equipo ? idResultado(prueba.id, equipo.id) : null;
  const guardado = idActual ? resultados.get(idActual) : undefined;

  /*
   * Carga en el formulario lo que ya esté registrado para este equipo.
   *
   * Ojo con dos casos que hay que respetar a la vez:
   *  · Al abrir la app, los equipos llegan antes que los resultados. Si diéramos
   *    el formulario por cargado con el primer render, el juez vería ceros aunque
   *    ya hubiera datos guardados. Por eso también se recarga cuando `guardado`
   *    cambia, no solo cuando cambia de equipo.
   *  · Si el juez está escribiendo, no se le pisa lo que lleva: mientras haya
   *    cambios sin guardar, no se toca el formulario.
   */
  const idCargado = useRef<string | null>(null);
  useEffect(() => {
    if (!idActual) return;
    const cambioDeEquipo = idCargado.current !== idActual;
    if (!cambioDeEquipo && sucio) return;
    idCargado.current = idActual;
    setValores(guardado?.valores ?? {});
    setNotas(guardado?.notas ?? '');
    if (cambioDeEquipo) setSucio(false);
  }, [idActual, guardado, sucio]);

  const equiposListos = useMemo(() => {
    const listos = new Set<string>();
    for (const equipoDeLista of equipos) {
      if (resultados.has(idResultado(prueba.id, equipoDeLista.id))) listos.add(equipoDeLista.id);
    }
    return listos;
  }, [equipos, resultados, prueba.id]);

  /*
   * Al abrir, se para en el primer equipo que aún no tenga datos: al comenzar la
   * gincana ese es el equipo que inaugura la estación, y más tarde es el que sigue.
   *
   * Se recalcula mientras el juez no haya tocado nada, porque los resultados
   * pueden llegar un momento después que los equipos y la primera cuenta se haría
   * con información incompleta. En cuanto el juez navega o escribe algo, la app
   * deja de moverle la pantalla.
   */
  const interactuo = useRef(false);
  useEffect(() => {
    if (interactuo.current || cargandoResultados || equiposEnOrden.length === 0) return;
    const pendiente = equiposEnOrden.findIndex((e) => !equiposListos.has(e.id));
    setIndice(pendiente === -1 ? 0 : pendiente);
  }, [cargandoResultados, equiposEnOrden, equiposListos]);

  function guardar(equipoId: string, valoresAGuardar: Record<string, ValorCampo>, notasAGuardar: string) {
    const resultado: Resultado = {
      id: idResultado(prueba.id, equipoId),
      pruebaId: prueba.id,
      equipoId,
      valores: valoresAGuardar,
      notas: notasAGuardar,
      actualizadoEn: Date.now(),
      juez: nombreJuez || 'sin nombre',
    };
    void obtenerAlmacen().guardarResultado(resultado);
    setSucio(false);
    setGuardadoEn(Date.now());
  }

  // Segunda red de seguridad: si el juez bloquea el celular o se cambia de app
  // con datos sin guardar, se guardan antes de que el navegador congele la página.
  const guardarPendiente = useRef<() => void>(() => {});
  guardarPendiente.current = () => {
    if (sucio && equipo) guardar(equipo.id, valores, notas);
  };
  useEffect(() => {
    const alOcultarse = () => {
      if (document.visibilityState === 'hidden') guardarPendiente.current();
    };
    const alSalirDeLaPagina = () => guardarPendiente.current();
    document.addEventListener('visibilitychange', alOcultarse);
    window.addEventListener('pagehide', alSalirDeLaPagina);
    return () => {
      document.removeEventListener('visibilitychange', alOcultarse);
      window.removeEventListener('pagehide', alSalirDeLaPagina);
    };
  }, []);

  /** Red de seguridad: si el juez cambia de equipo con cambios sin guardar, se guardan solos. */
  function irA(nuevoIndice: number) {
    if (nuevoIndice < 0 || nuevoIndice >= equiposEnOrden.length) return;
    interactuo.current = true;
    if (sucio && equipo) guardar(equipo.id, valores, notas);
    setIndice(nuevoIndice);
  }

  function actualizarCampo(campoId: string, valor: ValorCampo) {
    interactuo.current = true;
    setValores((previos) => ({ ...previos, [campoId]: valor }));
    setSucio(true);
    setGuardadoEn(null);
  }

  if (cargando) {
    return <Cargando prueba={prueba} />;
  }

  const encabezado = (
    <Encabezado
      prueba={prueba}
      menuAbierto={menuAbierto}
      alAlternarMenu={() => setMenuAbierto((previo) => !previo)}
      alSalir={alSalir}
    />
  );

  if (equipos.length === 0) {
    return (
      <>
        {encabezado}
        <div className="pantalla">
          <div className="aviso aviso-alerta">
            <span>⚠️</span>
            <div>
              Todavía no hay equipos cargados. La organización debe crearlos desde la pantalla de
              Organización antes de que empiece la gincana.
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {encabezado}

      <div className="pantalla">
        <div className="navegador">
          <button onClick={() => irA(indice - 1)} disabled={indice === 0} aria-label="Equipo anterior">
            ‹
          </button>
          <div className="equipo-actual" style={{ borderColor: equipo?.color }}>
            <span className="tenue">
              Turno {indice + 1} de {equiposEnOrden.length}
            </span>
            <strong>{equipo?.nombre}</strong>
            <span className="tenue">Equipo {equipo?.orden}</span>
          </div>
          <button
            onClick={() => irA(indice + 1)}
            disabled={indice === equiposEnOrden.length - 1}
            aria-label="Equipo siguiente"
          >
            ›
          </button>
        </div>

        <div className="fichas">
          {equiposEnOrden.map((equipoDeLista, posicion) => (
            <button
              key={equipoDeLista.id}
              className="ficha"
              data-estado={equiposListos.has(equipoDeLista.id) ? 'listo' : 'pendiente'}
              data-actual={posicion === indice ? 'si' : 'no'}
              onClick={() => irA(posicion)}
              title={equipoDeLista.nombre}
            >
              {equipoDeLista.orden}
            </button>
          ))}
        </div>

        <p className="tenue" style={{ marginTop: -8, marginBottom: 16 }}>
          Los equipos están en el orden en que llegan a esta estación. En verde los que ya
          registraste.
        </p>

        {guardadoEn !== null && (
          <div className="aviso aviso-info">
            <span>✓</span>
            <div>
              Guardado. Si no hay señal queda en el celular y sube solo apenas vuelva la conexión.
            </div>
          </div>
        )}

        <div className="tarjeta">
          {prueba.campos.map((campo) => (
            <CampoEntrada
              key={campo.id}
              campo={campo}
              valor={valores[campo.id]}
              alCambiar={(valor) => actualizarCampo(campo.id, valor)}
            />
          ))}

          <div className="campo" style={{ marginBottom: 0 }}>
            <label htmlFor="notas">Observaciones (opcional)</label>
            <p className="ayuda">Cualquier cosa rara que quieras dejar por escrito.</p>
            <textarea
              id="notas"
              className="texto"
              rows={2}
              value={notas}
              onChange={(evento) => {
                setNotas(evento.target.value);
                setSucio(true);
                setGuardadoEn(null);
              }}
            />
          </div>
        </div>

        <div className="tarjeta">
          <button
            className="boton-fantasma"
            style={{ padding: 0 }}
            onClick={() => setVerReglas((previo) => !previo)}
          >
            {verReglas ? '▾' : '▸'} Reglas de mi estación
          </button>
          {verReglas && (
            <>
              <p className="tenue">{prueba.descripcion}</p>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>Vigilar:</p>
              <ul className="tenue" style={{ marginTop: 0, paddingLeft: 20 }}>
                {prueba.vigilar.map((punto) => (
                  <li key={punto} style={{ marginBottom: 6 }}>
                    {punto}
                  </li>
                ))}
              </ul>
              <p className="tenue">
                Regla general: 5 minutos por estación, pasan los 5 integrantes y si sobra tiempo
                siguen en el mismo orden. Todo lo que hagan de más suma.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="barra-guardar">
        <div className="interior">
          <button
            className="boton boton-grande"
            onClick={() => equipo && guardar(equipo.id, valores, notas)}
            disabled={!equipo}
          >
            {guardado ? 'Actualizar' : 'Guardar'} {equipo?.nombre}
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * El botón de "⋯" abre un menú en vez de salirse de una. Salir obliga a volver a
 * escoger estación y a escribir el PIN, así que no puede pasar por un toque suelto.
 */
function Encabezado({
  prueba,
  menuAbierto,
  alAlternarMenu,
  alSalir,
}: {
  prueba: Prueba;
  menuAbierto: boolean;
  alAlternarMenu: () => void;
  alSalir: () => void;
}) {
  return (
    <>
      <div className="barra">
        <h1>
          {prueba.nombre}
          <span className="sub">Estación {prueba.orden}</span>
        </h1>
        <EstadoSync />
        <button
          className="boton-fantasma"
          onClick={alAlternarMenu}
          aria-expanded={menuAbierto}
          title="Opciones"
        >
          ⋯
        </button>
      </div>
      {menuAbierto && (
        <div className="menu">
          <p className="tenue" style={{ margin: '0 0 10px' }}>
            Estás en la estación <strong>{prueba.nombre}</strong>.
          </p>
          <button className="boton boton-secundario boton-grande" onClick={alAlternarMenu}>
            Seguir aquí
          </button>
          <button
            className="boton boton-peligro boton-grande"
            style={{ marginTop: 8 }}
            onClick={alSalir}
          >
            Cambiar de estación
          </button>
          <p className="tenue" style={{ margin: '10px 0 0' }}>
            Cambiar de estación te va a pedir el PIN otra vez. Los datos que ya registraste no se
            pierden.
          </p>
        </div>
      )}
    </>
  );
}

function Cargando({ prueba }: { prueba: Prueba }) {
  return (
    <>
      <div className="barra">
        <h1>{prueba.nombre}</h1>
      </div>
      <div className="pantalla">
        <p className="tenue">Cargando equipos…</p>
      </div>
    </>
  );
}
