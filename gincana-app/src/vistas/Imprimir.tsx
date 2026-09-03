import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import PuertaAdmin from '../componentes/PuertaAdmin';
import { PIN_ADMIN, PIN_RESULTADOS, PRUEBAS } from '../config/pruebas';
import { useEquipos } from '../lib/hooks';
import { ordenarPorLlegada } from '../lib/rotacion';

/**
 * Hoja para imprimir y entregarle a cada juez: su link, su PIN y una planilla de
 * papel por si el celular falla. El papel es el respaldo de último recurso.
 */
export default function Imprimir() {
  return (
    <PuertaAdmin titulo="Hojas para los jueces">
      <Hojas />
    </PuertaAdmin>
  );
}

function Hojas() {
  const { equipos } = useEquipos();
  const [base, setBase] = useState(() => `${window.location.origin}${window.location.pathname}`);
  const [qr, setQr] = useState<string>('');

  const enlaceJuez = `${base}#/juez`;

  useEffect(() => {
    QRCode.toDataURL(enlaceJuez, { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [enlaceJuez]);

  const cuantasFilas = equipos.length > 0 ? equipos.length : 8;

  // Cada planilla lleva los equipos en el orden en que llegan a esa estación, igual
  // que en el celular, para que el juez pueda ir bajando sin buscar.
  function filasDe(orden: number): string[] {
    if (equipos.length === 0) return Array.from({ length: 8 }, () => '');
    return ordenarPorLlegada(equipos, orden, PRUEBAS.length).map(
      (equipo) => `${equipo.orden}. ${equipo.nombre}`,
    );
  }

  // Se reparte el espacio que sobra en la hoja entre las filas, sin pasarse a una
  // segunda página. La referencia es papel carta, que es más corto que A4: si cabe
  // en carta, cabe en los dos.
  const altoFila = cuantasFilas <= 8 ? 72 : cuantasFilas <= 10 ? 56 : 46;

  return (
    <div className="pantalla pantalla-ancha">
      <div className="no-imprimir">
        <div className="barra" style={{ marginBottom: 16 }}>
          <h1>Hoja para los jueces</h1>
        </div>
        <div className="tarjeta">
          <div className="campo" style={{ marginBottom: 12 }}>
            <label htmlFor="base">Dirección de la app</label>
            <p className="ayuda">
              Si todavía no la has publicado, pega aquí la dirección final antes de imprimir.
            </p>
            <input
              id="base"
              className="texto"
              value={base}
              onChange={(evento) => setBase(evento.target.value)}
            />
          </div>
          <button className="boton" onClick={() => window.print()}>
            Imprimir
          </button>
          <p className="tenue" style={{ marginTop: 12, marginBottom: 0 }}>
            PIN de organización: <strong>{PIN_ADMIN}</strong> · PIN de resultados finales en el
            televisor: <strong>{PIN_RESULTADOS}</strong>. Estos dos no van en las hojas de los
            jueces; guárdalos aparte.
          </p>
          <p className="tenue" style={{ marginBottom: 0 }}>
            <Link to="/admin">Volver a Organización</Link>
          </p>
        </div>
      </div>

      {PRUEBAS.map((prueba) => (
        <div className="hoja" key={prueba.id}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p className="tenue" style={{ margin: 0 }}>
                Estación {prueba.orden} de {PRUEBAS.length}
              </p>
              <h2 style={{ margin: '2px 0 10px', fontSize: '1.5rem' }}>{prueba.nombre}</h2>
              <p style={{ margin: '0 0 4px' }}>
                Entra a <strong>{enlaceJuez}</strong>, escoge esta estación y escribe el PIN:
              </p>
              <p
                style={{
                  fontSize: '2.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  margin: '4px 0 12px',
                }}
              >
                {prueba.pin}
              </p>
            </div>
            {qr && (
              <img
                src={qr}
                alt="Código QR de la app"
                style={{ width: 130, height: 130, flexShrink: 0 }}
              />
            )}
          </div>

          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>Qué vigilar</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 20, fontSize: '0.9rem', lineHeight: 1.5 }}>
            {prueba.vigilar.map((punto) => (
              <li key={punto}>{punto}</li>
            ))}
          </ul>

          <p style={{ margin: '0 0 6px', fontWeight: 700 }}>
            Planilla de respaldo (solo si el celular falla)
          </p>
          <table
            className="planilla"
            style={{ '--alto-fila': `${altoFila}px` } as React.CSSProperties}
          >
            <thead>
              <tr>
                <th className="col-equipo">Equipo</th>
                {prueba.campos.map((campo) => (
                  <th key={campo.id}>{campo.label}</th>
                ))}
                <th className="col-observaciones">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {filasDe(prueba.orden).map((nombre, posicion) => (
                <tr key={posicion}>
                  <td>{nombre}</td>
                  {prueba.campos.map((campo) => (
                    <td key={campo.id} />
                  ))}
                  <td />
                </tr>
              ))}
            </tbody>
          </table>

          <p className="tenue" style={{ marginTop: 10, marginBottom: 0, fontSize: '0.8rem' }}>
            Regla general: 5 minutos por estación. Pasan los 5 integrantes y, si sobra tiempo,
            siguen en el mismo orden. Todo lo que hagan de más suma.
            {prueba.criterio.direccion === 'menor' && ' En esta prueba gana el menor tiempo.'}
          </p>
        </div>
      ))}
    </div>
  );
}
