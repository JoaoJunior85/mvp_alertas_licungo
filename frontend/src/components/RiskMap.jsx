import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from 'react-leaflet';
import { RISK, meta } from '../constants/risk';

// Mapa claro para leitura rápida, com fallback público se a chave CARTO ainda não estiver configurada.
export function RiskMap({ districts, risks, selected, onSelect }) {
  const center = useMemo(() => [-17.28, 36.98], []);
  const cartoKey = import.meta.env.VITE_CARTO_API_KEY?.trim();
  const tileUrl = cartoKey
    ? `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = cartoKey
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className={`map-box ${cartoKey ? 'map-carto' : 'map-osm'}`}>
      <MapContainer center={center} zoom={8} scrollWheelZoom zoomControl={false}>
        <ZoomControl position="bottomright" />
        <TileLayer attribution={attribution} url={tileUrl} />
        {districts
          .filter((district) => Number.isFinite(Number(district.lat)) && Number.isFinite(Number(district.lng)))
          .map((district) => {
            const level = risks[district.id]?.nivel;
            const color = meta(level).color;
            return (
              <CircleMarker
                key={district.id}
                center={[Number(district.lat), Number(district.lng)]}
                radius={selected?.id === district.id ? 18 : 15}
                pathOptions={{
                  color: '#FFFFFF',
                  fillColor: color,
                  fillOpacity: 0.82,
                  weight: 5,
                  className: level === 'alto' ? 'risk-marker-high' : '',
                }}
                eventHandlers={{ click: () => onSelect(district) }}
              >
                <Popup>
                  <b>{district.nome}</b><br />
                  Risco {meta(level).name}<br />
                  <button onClick={() => onSelect(district)}>Analisar risco →</button>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
      <span className="map-tag"><i /> MAPA DE RISCO · LICUNGO</span>
      <div className="map-legend">
        <b>NÍVEL DE RISCO</b>
        {Object.entries(RISK).map(([key, item]) => (
          <span key={key}><i style={{ background: item.color }} />{item.name}</span>
        ))}
      </div>
    </div>
  );
}

