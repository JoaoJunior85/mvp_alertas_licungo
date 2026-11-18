// Cartão educativo reutilizado no registo e no painel comunitário.
export default function CartaoMemoriaHistorica() {
  return (
    <article className="historical-memory group relative overflow-hidden rounded-3xl shadow-2xl" aria-labelledby="historical-memory-title">
      <img className="memory-image w-full h-56 object-cover grayscale transition-all duration-700 ease-in-out group-hover:grayscale-0" src="/images/historico-cheia.jpg" alt="Fotografia histórica de uma cheia numa comunidade da Zambézia" />
      <div className="memory-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" aria-hidden="true" />
      <div className="memory-content absolute inset-x-0 bottom-0 z-10 p-5 text-white">
        <span className="memory-badge">MEMÓRIA HISTÓRICA</span>
        <h2 id="historical-memory-title">A nossa história</h2>
        <p>Em 2019, o Ciclone Idai mudou a Zambézia. Hoje, estamos preparados.</p>
      </div>
    </article>
  );
}
