import { MapContainer, TileLayer, Marker as LeafletMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MarkerInfo } from '../types';
import { useEffect } from 'react';

// Custom SVG Icons for markers
const getMarkerIcon = (status: string) => {
  const isVisited = status === 'visited';
  const color = isVisited ? '#aa3500' : '#f0803c'; // primary for visited, soft orange for want to go
  const iconHtml = `
    <div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); transition: all 0.2s ease;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    </div>
  `;
  
  return new L.DivIcon({
    className: 'custom-map-pin',
    html: iconHtml,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView({ markers, onLocationSelect, onMarkerClick, center }: { markers: MarkerInfo[], onLocationSelect: (lat: number, lng: number) => void, onMarkerClick?: (marker: MarkerInfo) => void, center?: [number, number] }) {
  return (
    <div className="w-full h-full z-0 relative">
      <MapContainer 
        center={center || [21.028511, 105.804817]} // Hanoi default
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Cleaner base map
        />
        <MapEvents onLocationSelect={onLocationSelect} />
        {markers.map((marker) => (
          <LeafletMarker key={marker.id} position={[marker.lat, marker.lng]} icon={getMarkerIcon(marker.status)}>
            <Popup className="rounded-xl overflow-hidden border-0 shadow-xl">
              <div className="p-2 min-w-[160px]">
                <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight mb-1">{marker.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{marker.address}</p>
                <div className="flex gap-2 mb-3">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {marker.status.replace('_', ' ')}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {marker.category}
                  </span>
                </div>
                {onMarkerClick && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick(marker);
                    }}
                    className="w-full bg-orange-50 border border-orange-100 py-2 rounded-lg text-xs font-bold text-primary hover:bg-orange-100 transition-colors shadow-sm"
                  >
                    Open Journal
                  </button>
                )}
              </div>
            </Popup>
          </LeafletMarker>
        ))}
        {center && <SetViewOnClick coords={center} />}
      </MapContainer>
    </div>
  );
}

function SetViewOnClick({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 15, { animate: true, duration: 1.5 });
  }, [coords, map]);
  return null;
}
