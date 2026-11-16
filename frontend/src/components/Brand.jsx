import { Link } from 'react-router-dom';
import logo from '../../img/logo-removebg-preview.png';

// Marca partilhada que mantém a identidade visual consistente nas três telas.
export default function Brand({ variant = '' }) {
  return <Link to="/" className={`brand ${variant ? `brand-${variant}` : ''}`} aria-label="Licungo Alerta — página inicial"><img src={logo} alt="" /><span className="brand-word">LICUNGO<small>ALERTA PRECOCE</small></span></Link>;
}
