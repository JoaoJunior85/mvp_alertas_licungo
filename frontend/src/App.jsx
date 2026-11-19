import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import CommunityScreen from './components/CommunityScreen';
import { Entry } from './components/EntryScreen';
import OperatorScreen from './components/OperatorScreen';
import RotaProtegida from './components/RotaProtegida';
import T06_LoginOperador from './components/T06_LoginOperador';
import 'leaflet/dist/leaflet.css';

// Centraliza rotas públicas e protege a entrada da Sala de Situações.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/operador/login" element={<T06_LoginOperador />} />
        <Route path="/operador" element={<RotaProtegida><OperatorScreen /></RotaProtegida>} />
        <Route path="/comunidade" element={<CommunityScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}