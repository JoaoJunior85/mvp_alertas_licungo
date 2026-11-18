import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Imagens locais do projecto; cada slide muda sem desmontar o texto histórico.
const IMAGENS_MEMORIA = [
  '/images/historico-cheia.jpg',
  '/images/cheia.jpg',
  '/images/cheia2.jpeg',
  '/images/cheia3.jpeg',
  '/images/historico-ciclone.jpg',
  '/images/ciclone2.jpeg',
  '/images/ciclone5.jpeg',
];

// Carrossel acessível com avanço automático e controlos manuais.
export default function CarrosselMemoria() {
  const [imagemAtual, setImagemAtual] = useState(0);

  // Move para a imagem seguinte a cada seis segundos e limpa o timer ao sair.
  useEffect(() => {
    const temporizador = window.setInterval(() => {
      setImagemAtual((atual) => (atual + 1) % IMAGENS_MEMORIA.length);
    }, 6000);

    return () => window.clearInterval(temporizador);
  }, []);

  // Os controlos manuais reutilizam o mesmo estado e fazem wrap nas extremidades.
  const mostrarAnterior = () => setImagemAtual((atual) =>
    (atual - 1 + IMAGENS_MEMORIA.length) % IMAGENS_MEMORIA.length);
  const mostrarSeguinte = () => setImagemAtual((atual) =>
    (atual + 1) % IMAGENS_MEMORIA.length);

  return (
    <article className="historical-memory carousel-memory" aria-roledescription="carrossel" aria-label="Memória histórica de cheias e ciclones">
      {/* Só a opacidade das imagens muda; overlay, título e descrição ficam estáveis. */}
      {IMAGENS_MEMORIA.map((src, indice) => (
        <img
          key={src}
          className={`memory-image carousel-image transition-opacity duration-1000 ease-in-out${indice === imagemAtual ? ' is-visible' : ''}`}
          src={src}
          alt=""
          aria-hidden="true"
          loading={indice === 0 ? 'eager' : 'lazy'}
        />
      ))}

      <div className="memory-overlay" aria-hidden="true" />

      {/* Conteúdo textual fixo para manter leitura contínua durante as transições. */}
      <div className="memory-content carousel-content">
        <span className="memory-badge">MEMÓRIA HISTÓRICA</span>
        <h2>A nossa história</h2>
        <p>Em 2019, o Ciclone Idai mudou a Zambézia. Hoje, estamos preparados.</p>
      </div>

      {/* Setas e pontos permitem navegar sem depender do temporizador. */}
      <button className="carousel-arrow carousel-previous" type="button" onClick={mostrarAnterior} aria-label="Imagem histórica anterior">
        <ChevronLeft size={20} />
      </button>
      <button className="carousel-arrow carousel-next" type="button" onClick={mostrarSeguinte} aria-label="Imagem histórica seguinte">
        <ChevronRight size={20} />
      </button>
      <div className="carousel-dots" role="group" aria-label="Escolher imagem histórica">
        {IMAGENS_MEMORIA.map((src, indice) => (
          <button
            key={src}
            type="button"
            className={`carousel-dot${indice === imagemAtual ? ' active' : ''}`}
            aria-label={`Mostrar imagem ${indice + 1} de ${IMAGENS_MEMORIA.length}`}
            aria-current={indice === imagemAtual ? 'true' : undefined}
            onClick={() => setImagemAtual(indice)}
          />
        ))}
      </div>
    </article>
  );
}
