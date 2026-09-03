import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Inicio from './vistas/Inicio';
import Juez from './vistas/Juez';
import Admin from './vistas/Admin';
import TV from './vistas/TV';
import Imprimir from './vistas/Imprimir';
import './estilos.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Rutas con # para que los links funcionen en cualquier hosting sin configuración extra. */}
    <HashRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/juez" element={<Juez />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/tv" element={<TV />} />
        <Route path="/imprimir" element={<Imprimir />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </HashRouter>
  </StrictMode>,
);
