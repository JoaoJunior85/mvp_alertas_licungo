import { BrowserRouter, Route, Routes } from 'react-router-dom';
import CommunityScreen from './components/CommunityScreen';
import { Entry } from './components/EntryScreen';
import OperatorScreen from './components/OperatorScreen';
import 'leaflet/dist/leaflet.css';

// Ponto central da navegação: cada URL abre uma tela independente.
export default function App() {
  return <BrowserRouter><Routes><Route path="/" element={<Entry />} /><Route path="/operador" element={<OperatorScreen />} /><Route path="/comunidade" element={<CommunityScreen />} /></Routes></BrowserRouter>;
}

