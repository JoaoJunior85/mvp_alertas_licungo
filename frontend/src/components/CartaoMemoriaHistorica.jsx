// Cartão educativo reutilizado no registo e no painel comunitário.
export default function CartaoMemoriaHistorica() {
  return (
    <article className="historical-memory group relative overflow-hidden rounded-2xl shadow-md" aria-labelledby="historical-memory-title">
      <img className="memory-image w-full h-56 object-cover grayscale transition-all duration-700 ease-in-out group-hover:grayscale-0" src="/images/historico-cheia.jpg" alt="Vista aérea de habitações e vegetação numa área inundada em Moçambique" />
      <div className="memory-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" aria-hidden="true" />
      <div className="memory-content absolute inset-x-0 bottom-0 z-10 p-5 text-white">
        <span className="memory-badge">MEMÓRIA HISTÓRICA</span>
        <h2 id="historical-memory-title">Cheias na Bacia do Licungo</h2>
        <p>Recordar o passado para proteger o futuro. Este sistema ajuda a fazer chegar avisos atempados às comunidades.</p>
      </div>
    </article>
  );
}
