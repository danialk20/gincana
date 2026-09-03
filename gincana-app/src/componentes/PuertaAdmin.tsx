import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PIN_ADMIN } from '../config/pruebas';
import { usePersistido } from '../lib/hooks';

/**
 * Deja pasar solo con el PIN de organización, y lo recuerda en el dispositivo.
 *
 * Protege las pantallas que muestran los PIN de todas las estaciones: si
 * estuvieran abiertas, cualquiera con el link de la app los tendría todos.
 *
 * Es un control práctico, no una caja fuerte: el PIN viaja dentro del código de
 * la app, así que alguien con conocimientos técnicos podría saltárselo. Lo que
 * de verdad protege los datos son las reglas de seguridad de Firestore.
 */
export default function PuertaAdmin({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  const [desbloqueado, setDesbloqueado] = usePersistido('gincana.admin.desbloqueado', false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (desbloqueado) return <>{children}</>;

  return (
    <div className="inicio">
      <h1>{titulo}</h1>
      <form
        className="tarjeta"
        onSubmit={(evento) => {
          evento.preventDefault();
          if (pin === PIN_ADMIN) setDesbloqueado(true);
          else {
            setError(true);
            setPin('');
          }
        }}
      >
        <div className="campo">
          <label htmlFor="pin-admin">PIN de organización</label>
          <input
            id="pin-admin"
            className="texto"
            type="tel"
            inputMode="numeric"
            maxLength={4}
            style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '0.4em' }}
            value={pin}
            onChange={(evento) => {
              setPin(evento.target.value.replace(/\D/g, ''));
              setError(false);
            }}
          />
        </div>
        {error && <div className="aviso aviso-error">PIN incorrecto.</div>}
        <button className="boton boton-grande" type="submit">
          Entrar
        </button>
      </form>
      <p className="tenue">
        <Link to="/">Volver</Link>
      </p>
    </div>
  );
}
