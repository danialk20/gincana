import { Link } from 'react-router-dom';
import { obtenerAlmacen } from '../lib/almacen';

export default function Inicio() {
  const modoLocal = obtenerAlmacen().modo === 'local';

  return (
    <div className="inicio">
      <div>
        <h1>Gincana</h1>
        <p className="tenue">Registro de desempeño y resultados.</p>
      </div>

      {modoLocal && (
        <div className="aviso aviso-alerta">
          <span>⚠️</span>
          <div>
            <strong>Modo local.</strong> Todavía no hay Firebase configurado, así que los datos se
            guardan solo en este dispositivo y no se comparten con el televisor. Sirve para ensayar.
          </div>
        </div>
      )}

      <Link className="opcion" to="/juez">
        <strong>Soy juez</strong>
        <span className="tenue">Registrar el desempeño de mi estación.</span>
      </Link>

      <Link className="opcion" to="/tv">
        <strong>Televisor</strong>
        <span className="tenue">Presentación de equipos, desempeño en vivo y podio final.</span>
      </Link>

      <Link className="opcion" to="/admin">
        <strong>Organización</strong>
        <span className="tenue">
          Equipos, respaldos, revisión de datos y hojas para los jueces. Pide PIN.
        </span>
      </Link>
    </div>
  );
}
