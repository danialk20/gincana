import { useState } from 'react';
import type { Campo, ValorCampo } from '../tipos';
import { segundosATexto } from '../lib/formato';

interface Props {
  campo: Campo;
  valor: ValorCampo | undefined;
  alCambiar: (valor: ValorCampo) => void;
}

export default function CampoEntrada({ campo, valor, alCambiar }: Props) {
  return (
    <div className="campo">
      <label htmlFor={`campo-${campo.id}`}>{campo.label}</label>
      {campo.ayuda && <p className="ayuda">{campo.ayuda}</p>}
      {campo.tipo === 'entero' && (
        <Contador
          id={campo.id}
          paso={campo.paso ?? 1}
          valor={typeof valor === 'number' ? valor : 0}
          alCambiar={alCambiar}
        />
      )}
      {campo.tipo === 'booleano' && (
        <Interruptor id={campo.id} valor={valor === true} alCambiar={alCambiar} />
      )}
      {campo.tipo === 'tiempo' && (
        <EntradaTiempo
          id={campo.id}
          segundos={typeof valor === 'number' ? valor : 0}
          alCambiar={alCambiar}
        />
      )}
    </div>
  );
}

function Contador({
  id,
  valor,
  paso,
  alCambiar,
}: {
  id: string;
  valor: number;
  paso: number;
  alCambiar: (valor: number) => void;
}) {
  const [escribiendo, setEscribiendo] = useState(false);

  return (
    <>
      <div className="contador">
        <button
          type="button"
          onClick={() => alCambiar(Math.max(0, valor - paso))}
          aria-label="Restar uno"
        >
          −
        </button>
        {escribiendo ? (
          <input
            id={`campo-${id}`}
            className="texto"
            style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 800 }}
            type="number"
            inputMode="numeric"
            min={0}
            autoFocus
            value={valor}
            onChange={(evento) => alCambiar(Math.max(0, Number(evento.target.value) || 0))}
            onBlur={() => setEscribiendo(false)}
          />
        ) : (
          <div className="valor" aria-live="polite">
            {valor}
          </div>
        )}
        <button type="button" onClick={() => alCambiar(valor + paso)} aria-label="Sumar uno">
          +
        </button>
      </div>
      {!escribiendo && (
        <button type="button" className="boton-fantasma" onClick={() => setEscribiendo(true)}>
          Escribir el número directamente
        </button>
      )}
    </>
  );
}

function Interruptor({
  id,
  valor,
  alCambiar,
}: {
  id: string;
  valor: boolean;
  alCambiar: (valor: boolean) => void;
}) {
  return (
    <div className="interruptor" id={`campo-${id}`}>
      <button type="button" aria-pressed={valor} onClick={() => alCambiar(true)}>
        Sí
      </button>
      <button type="button" aria-pressed={!valor} onClick={() => alCambiar(false)}>
        No
      </button>
    </div>
  );
}

function EntradaTiempo({
  id,
  segundos,
  alCambiar,
}: {
  id: string;
  segundos: number;
  alCambiar: (segundos: number) => void;
}) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;

  return (
    <>
      <div className="tiempo-entrada">
        <input
          id={`campo-${id}`}
          type="number"
          inputMode="numeric"
          min={0}
          value={minutos}
          aria-label="Minutos"
          onChange={(evento) => alCambiar(Math.max(0, Number(evento.target.value) || 0) * 60 + resto)}
        />
        <span>:</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={String(resto).padStart(2, '0')}
          aria-label="Segundos"
          onChange={(evento) => {
            const nuevo = Math.min(59, Math.max(0, Number(evento.target.value) || 0));
            alCambiar(minutos * 60 + nuevo);
          }}
        />
      </div>
      <p className="ayuda">Quedó anotado como {segundosATexto(segundos)} minutos.</p>
    </>
  );
}
