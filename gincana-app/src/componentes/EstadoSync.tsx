import { useEnLinea, useResultados } from '../lib/hooks';
import { obtenerAlmacen } from '../lib/almacen';

/**
 * Indicador que el juez tiene siempre a la vista. Es la garantía de que nada se
 * perdió: mientras diga "pendiente", los datos ya están guardados en el celular
 * y suben solos cuando vuelva la señal.
 */
export default function EstadoSync() {
  const enLinea = useEnLinea();
  const { pendientes } = useResultados();
  const modoLocal = obtenerAlmacen().modo === 'local';

  if (modoLocal) {
    return (
      <span className="estado-sync" data-estado="ok" title="Los datos se guardan solo en este dispositivo">
        Modo local
      </span>
    );
  }

  if (!enLinea) {
    return (
      <span className="estado-sync" data-estado="sin-red">
        Sin señal · guardado aquí
      </span>
    );
  }

  if (pendientes) {
    return (
      <span className="estado-sync" data-estado="pendiente">
        Subiendo…
      </span>
    );
  }

  return (
    <span className="estado-sync" data-estado="ok">
      Todo sincronizado
    </span>
  );
}
