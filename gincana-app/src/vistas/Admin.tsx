import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import EstadoSync from '../componentes/EstadoSync';
import PuertaAdmin from '../componentes/PuertaAdmin';
import { PRUEBAS } from '../config/pruebas';
import { obtenerAlmacen, PREFIJO_ENSAYO } from '../lib/almacen';
import { generarEnsayo } from '../lib/ensayo';
import { formatearValor, segundosATexto } from '../lib/formato';
import { useEquipos, useResultados } from '../lib/hooks';
import { comprimirFoto, pesoAproximado } from '../lib/imagen';
import { idResultado, rankearPrueba, tablaGeneral } from '../lib/puntaje';
import type { Equipo, Resultado } from '../tipos';

const COLORES = [
  '#dc2626',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0891b2',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#0f766e',
  '#475569',
];

type Pestana = 'equipos' | 'datos' | 'respaldo';

export default function Admin() {
  const [pestana, setPestana] = useState<Pestana>('equipos');

  return (
    <PuertaAdmin titulo="Organización">
      <div className="barra">
        <h1>
          Organización
          <span className="sub">Preparación de la gincana</span>
        </h1>
        <EstadoSync />
      </div>
      <div className="pantalla pantalla-ancha">
        <div className="pestanas">
          <button aria-selected={pestana === 'equipos'} onClick={() => setPestana('equipos')}>
            Equipos
          </button>
          <button aria-selected={pestana === 'datos'} onClick={() => setPestana('datos')}>
            Datos capturados
          </button>
          <button aria-selected={pestana === 'respaldo'} onClick={() => setPestana('respaldo')}>
            Respaldo
          </button>
        </div>

        {pestana === 'equipos' && <PestanaEquipos />}
        {pestana === 'datos' && <PestanaDatos />}
        {pestana === 'respaldo' && <PestanaRespaldo />}

        <div className="tarjeta" style={{ marginTop: 24 }}>
          <h2>Hojas para los jueces</h2>
          <p className="tenue">
            Link, PIN y planilla de respaldo, una hoja por estación. Están aquí adentro a propósito:
            contienen los PIN de las 10 estaciones, así que no pueden quedar a la vista de
            cualquiera con el link de la app.
          </p>
          <Link className="boton boton-secundario" to="/imprimir">
            Ver e imprimir
          </Link>
        </div>

        <p className="tenue" style={{ marginTop: 16 }}>
          <Link to="/">Inicio</Link>
        </p>
      </div>
    </PuertaAdmin>
  );
}

// ───────────────────────────── Equipos ─────────────────────────────

function PestanaEquipos() {
  const { equipos } = useEquipos();
  const [editando, setEditando] = useState<Equipo | null>(null);

  function nuevoEquipo(): Equipo {
    const orden = equipos.length + 1;
    return {
      id: crypto.randomUUID(),
      nombre: `Equipo ${orden}`,
      orden,
      color: COLORES[(orden - 1) % COLORES.length],
      integrantes: ['', '', '', '', ''],
    };
  }

  if (editando) {
    return <EditorEquipo equipo={editando} alCerrar={() => setEditando(null)} />;
  }

  return (
    <>
      <div className="aviso aviso-info">
        <span>💡</span>
        <div>
          Crea aquí los equipos con su foto y sus integrantes. Es lo único que hay que dejar listo
          antes del evento: el día de la gincana los jueces solo abren su estación y registran.
          <br />
          <strong>El orden importa:</strong> el equipo 1 arranca en la estación 1, el 2 en la
          estación 2, y así. Con ese número la app le arma a cada juez su lista en el orden en que
          los equipos van llegando.
        </div>
      </div>

      <div className="lista-equipos">
        {equipos.map((equipo) => (
          <div key={equipo.id} className="fila-equipo">
            {equipo.fotoDataUrl ? (
              <img className="avatar" src={equipo.fotoDataUrl} alt={equipo.nombre} />
            ) : (
              <div className="avatar avatar-vacio" style={{ background: equipo.color }}>
                {equipo.orden}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{equipo.nombre}</strong>
              <div className="tenue">
                {equipo.integrantes.filter(Boolean).length} integrantes ·{' '}
                {equipo.fotoDataUrl ? 'con foto' : 'sin foto'}
              </div>
            </div>
            <button className="boton boton-secundario" onClick={() => setEditando(equipo)}>
              Editar
            </button>
          </div>
        ))}
      </div>

      <button
        className="boton boton-grande"
        style={{ marginTop: 16 }}
        onClick={() => setEditando(nuevoEquipo())}
      >
        + Agregar equipo
      </button>
    </>
  );
}

function EditorEquipo({ equipo, alCerrar }: { equipo: Equipo; alCerrar: () => void }) {
  const { equipos } = useEquipos();
  const [borrador, setBorrador] = useState<Equipo>({ ...equipo });
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entradaArchivo = useRef<HTMLInputElement>(null);

  async function cargarFoto(archivo: File) {
    setProcesando(true);
    setError(null);
    try {
      const fotoDataUrl = await comprimirFoto(archivo);
      setBorrador((previo) => ({ ...previo, fotoDataUrl }));
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo procesar la foto.');
    } finally {
      setProcesando(false);
    }
  }

  function guardar() {
    void obtenerAlmacen().guardarEquipo({
      ...borrador,
      nombre: borrador.nombre.trim() || `Equipo ${borrador.orden}`,
      integrantes: borrador.integrantes.map((integrante) => integrante.trim()),
    });
    alCerrar();
  }

  function borrar() {
    if (!confirm(`¿Borrar ${borrador.nombre}? Sus datos capturados quedarían huérfanos.`)) return;
    const almacen = obtenerAlmacen();
    void (async () => {
      await almacen.borrarEquipo(borrador.id);
      // Los números tienen que quedar 1, 2, 3… sin huecos: la rotación depende de
      // que el equipo N arranque en la estación N. Si se borra uno de la mitad,
      // se renumeran los que quedan.
      const restantes = equipos.filter((otro) => otro.id !== borrador.id);
      await Promise.all(
        restantes.map((otro, posicion) =>
          otro.orden === posicion + 1
            ? Promise.resolve()
            : almacen.guardarEquipo({ ...otro, orden: posicion + 1 }),
        ),
      );
    })();
    alCerrar();
  }

  return (
    <div className="tarjeta">
      <div className="campo">
        <label htmlFor="nombre-equipo">Nombre del equipo</label>
        <input
          id="nombre-equipo"
          className="texto"
          value={borrador.nombre}
          onChange={(evento) => setBorrador({ ...borrador, nombre: evento.target.value })}
        />
      </div>

      <div className="campo">
        <label>Color</label>
        <p className="ayuda">Se usa en el televisor para distinguirlos.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COLORES.map((color) => (
            <button
              key={color}
              onClick={() => setBorrador({ ...borrador, color })}
              aria-label={`Color ${color}`}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: color,
                border: borrador.color === color ? '4px solid #111827' : '2px solid #e5e7eb',
              }}
            />
          ))}
        </div>
      </div>

      <div className="campo">
        <label>Foto del equipo</label>
        <p className="ayuda">
          Se recorta en cuadrado y se comprime automáticamente. Sale en la presentación del
          televisor y en el podio.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {borrador.fotoDataUrl && (
            <img
              className="avatar"
              style={{ width: 88, height: 88 }}
              src={borrador.fotoDataUrl}
              alt=""
            />
          )}
          <div>
            <input
              ref={entradaArchivo}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(evento) => {
                const archivo = evento.target.files?.[0];
                if (archivo) void cargarFoto(archivo);
              }}
            />
            <button
              className="boton boton-secundario"
              onClick={() => entradaArchivo.current?.click()}
              disabled={procesando}
            >
              {procesando ? 'Procesando…' : borrador.fotoDataUrl ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {borrador.fotoDataUrl && (
              <p className="tenue" style={{ marginBottom: 0 }}>
                Pesa {pesoAproximado(borrador.fotoDataUrl)}
              </p>
            )}
          </div>
        </div>
        {error && <div className="aviso aviso-error">{error}</div>}
      </div>

      <div className="campo">
        <label>Integrantes</label>
        <p className="ayuda">Aparecen uno a uno en la presentación del televisor.</p>
        {borrador.integrantes.map((integrante, posicion) => (
          <input
            key={posicion}
            className="texto"
            style={{ marginBottom: 8 }}
            placeholder={`Integrante ${posicion + 1}`}
            value={integrante}
            onChange={(evento) => {
              const integrantes = [...borrador.integrantes];
              integrantes[posicion] = evento.target.value;
              setBorrador({ ...borrador, integrantes });
            }}
          />
        ))}
        <button
          className="boton-fantasma"
          onClick={() =>
            setBorrador({ ...borrador, integrantes: [...borrador.integrantes, ''] })
          }
        >
          + Otro integrante
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="boton" onClick={guardar}>
          Guardar
        </button>
        <button className="boton boton-secundario" onClick={alCerrar}>
          Cancelar
        </button>
        <button className="boton boton-peligro" style={{ marginLeft: 'auto' }} onClick={borrar}>
          Borrar
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────── Datos capturados ─────────────────────────────

function PestanaDatos() {
  const { equipos } = useEquipos();
  const { resultados } = useResultados();

  const general = useMemo(
    () => tablaGeneral(PRUEBAS, equipos, resultados),
    [equipos, resultados],
  );

  const faltantes = useMemo(() => {
    let cuenta = 0;
    for (const prueba of PRUEBAS) {
      for (const equipo of equipos) {
        if (!resultados.has(idResultado(prueba.id, equipo.id))) cuenta += 1;
      }
    }
    return cuenta;
  }, [equipos, resultados]);

  if (equipos.length === 0) {
    return <p className="tenue">Primero crea los equipos.</p>;
  }

  return (
    <>
      <div className={faltantes > 0 ? 'aviso aviso-alerta' : 'aviso aviso-info'}>
        <span>{faltantes > 0 ? '⚠️' : '✓'}</span>
        <div>
          {faltantes > 0
            ? `Faltan ${faltantes} registros de ${PRUEBAS.length * equipos.length}. Los equipos sin dato quedan de últimos en esa prueba.`
            : 'Todas las estaciones tienen datos de todos los equipos.'}
        </div>
      </div>

      <div className="tarjeta">
        <h2>Qué falta por capturar</h2>
        <div className="desplazable">
          <table className="tabla">
            <thead>
              <tr>
                <th>Estación</th>
                {equipos.map((equipo) => (
                  <th key={equipo.id} style={{ textAlign: 'center' }}>
                    {equipo.orden}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRUEBAS.map((prueba) => (
                <tr key={prueba.id}>
                  <td>
                    {prueba.orden}. {prueba.nombre}
                  </td>
                  {equipos.map((equipo) => {
                    const listo = resultados.has(idResultado(prueba.id, equipo.id));
                    return (
                      <td key={equipo.id} style={{ textAlign: 'center' }}>
                        {listo ? '🟩' : '⬜'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="tenue">Los números de arriba son el orden de cada equipo.</p>
      </div>

      <div className="tarjeta">
        <h2>Detalle por estación</h2>
        {PRUEBAS.map((prueba) => {
          const filas = rankearPrueba(prueba, equipos, resultados);
          const campoPrincipal = prueba.campos.find((c) => c.id === prueba.criterio.campoId)!;
          return (
            <div key={prueba.id} style={{ marginBottom: 22 }}>
              <strong>
                {prueba.orden}. {prueba.nombre}
              </strong>
              <p className="tenue" style={{ margin: '2px 0 8px' }}>
                {campoPrincipal.label} · gana el {prueba.criterio.direccion}
              </p>
              <div className="desplazable">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Puesto</th>
                      <th>Equipo</th>
                      <th className="num">{campoPrincipal.label}</th>
                      <th className="num">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((fila) => {
                      const equipo = equipos.find((e) => e.id === fila.equipoId);
                      return (
                        <tr key={fila.equipoId}>
                          <td>{fila.puesto}</td>
                          <td>
                            {equipo?.nombre}
                            {fila.sinRegistro && (
                              <span style={{ color: 'var(--rojo)' }}> · sin registro</span>
                            )}
                            {fila.descartado && (
                              <span style={{ color: 'var(--rojo)' }}> · no terminó</span>
                            )}
                          </td>
                          <td className="num">
                            {fila.valor === null
                              ? '—'
                              : formatearValor(campoPrincipal, fila.valor)}
                          </td>
                          <td className="num">
                            <strong>{fila.puntos}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="tarjeta">
        <h2>Tabla general</h2>
        <p className="tenue">
          Si dos equipos suman lo mismo, desempata el menor tiempo en el transporte en camilla.
        </p>
        <div className="desplazable">
          <table className="tabla">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Equipo</th>
                <th className="num">Total</th>
                <th className="num">Camilla</th>
              </tr>
            </thead>
            <tbody>
              {general.map((fila) => (
                <tr key={fila.equipoId}>
                  <td>{fila.puesto}</td>
                  <td>{equipos.find((e) => e.id === fila.equipoId)?.nombre}</td>
                  <td className="num">
                    <strong>{fila.total}</strong>
                  </td>
                  <td className="num">
                    {fila.valorDesempate === null ? '—' : segundosATexto(fila.valorDesempate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ───────────────────────────── Respaldo ─────────────────────────────

function PestanaRespaldo() {
  const { equipos } = useEquipos();
  const { resultados } = useResultados();
  const entradaArchivo = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const equiposReales = equipos.filter((e) => !e.id.startsWith(PREFIJO_ENSAYO)).length;

  function descargar(nombre: string, contenido: string, tipo: string) {
    const blob = new Blob([contenido], { type: tipo });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  function exportarJson() {
    const datos = { equipos, resultados: [...resultados.values()], exportadoEn: Date.now() };
    descargar('gincana-respaldo.json', JSON.stringify(datos, null, 2), 'application/json');
  }

  function exportarCsv() {
    const encabezados = ['Equipo', ...PRUEBAS.map((p) => p.nombre), 'Total'];
    const general = tablaGeneral(PRUEBAS, equipos, resultados);
    const filas = general.map((fila) => {
      const equipo = equipos.find((e) => e.id === fila.equipoId);
      return [
        equipo?.nombre ?? fila.equipoId,
        ...PRUEBAS.map((p) => String(fila.puntosPorPrueba[p.id] ?? 0)),
        String(fila.total),
      ];
    });
    const csv = [encabezados, ...filas]
      .map((fila) => fila.map((celda) => `"${celda.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    descargar('gincana-puntajes.csv', '﻿' + csv, 'text/csv;charset=utf-8');
  }

  async function importar(archivo: File) {
    try {
      const datos = JSON.parse(await archivo.text()) as {
        equipos: Equipo[];
        resultados: Resultado[];
      };
      if (!Array.isArray(datos.equipos) || !Array.isArray(datos.resultados)) {
        throw new Error('El archivo no tiene el formato esperado.');
      }
      await obtenerAlmacen().restaurar(datos);
      setMensaje(
        `Restaurados ${datos.equipos.length} equipos y ${datos.resultados.length} registros.`,
      );
    } catch (fallo) {
      setMensaje(fallo instanceof Error ? fallo.message : 'No se pudo leer el archivo.');
    }
  }

  return (
    <>
      <div className="tarjeta">
        <h2>Descargar respaldo</h2>
        <p className="tenue">
          Bájalo apenas termines de crear los equipos, y otra vez al final del evento. Es un archivo
          plano que sirve para restaurar todo si algo sale mal.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="boton" onClick={exportarJson}>
            Respaldo completo (JSON)
          </button>
          <button className="boton boton-secundario" onClick={exportarCsv}>
            Puntajes (CSV para Excel)
          </button>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Restaurar</h2>
        <p className="tenue">
          Carga un respaldo. Sobrescribe los equipos y registros que tengan el mismo identificador.
        </p>
        <input
          ref={entradaArchivo}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(evento) => {
            const archivo = evento.target.files?.[0];
            if (archivo) void importar(archivo);
          }}
        />
        <button className="boton boton-secundario" onClick={() => entradaArchivo.current?.click()}>
          Elegir archivo
        </button>
        {mensaje && <div className="aviso aviso-info" style={{ marginTop: 12 }}>{mensaje}</div>}
      </div>

      <div className="tarjeta">
        <h2>Ensayo</h2>
        <p className="tenue">
          Llena la gincana con 8 equipos y datos inventados para ver cómo se ve el televisor y
          revisar que los puntajes cuadren. Acuérdate de borrar todo antes del día real.
        </p>
        {equiposReales > 0 && (
          <div className="aviso aviso-alerta">
            <span>⚠️</span>
            <div>
              Ya tienes {equiposReales} equipo{equiposReales === 1 ? '' : 's'} de verdad cargado
              {equiposReales === 1 ? '' : 's'}. Los de ensayo se suman a los tuyos, no los
              reemplazan. Bórralos con el botón del medio antes del evento.
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="boton boton-secundario"
            onClick={async () => {
              await obtenerAlmacen().restaurar(generarEnsayo());
              setMensaje('Datos de ensayo cargados. Mira el televisor.');
            }}
          >
            Cargar datos de ensayo
          </button>
          <button
            className="boton boton-secundario"
            onClick={async () => {
              await obtenerAlmacen().limpiarEnsayo();
              setMensaje('Listo, se fueron los datos de ensayo. Tus equipos reales siguen ahí.');
            }}
          >
            Borrar solo lo del ensayo
          </button>
          <button
            className="boton boton-peligro"
            onClick={async () => {
              if (!confirm('¿Borrar TODOS los equipos y registros? Esto no se puede deshacer.')) {
                return;
              }
              await obtenerAlmacen().limpiar();
              setMensaje('Todo borrado. La gincana quedó en blanco.');
            }}
          >
            Borrar todo
          </button>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Estado</h2>
        <p className="tenue">
          {equipos.length} equipos · {resultados.size} registros capturados ·{' '}
          {obtenerAlmacen().modo === 'firebase' ? 'conectado a Firebase' : 'modo local'}
        </p>
      </div>
    </>
  );
}
