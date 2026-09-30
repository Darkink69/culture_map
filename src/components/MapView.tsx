import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { GeolocationState } from "../hooks/useGeolocation";
import type { CultureEvent } from "../types/culture";
import EventMarkers from "./EventMarkers";

const userIcon = L.divIcon({
  className: "user-marker",
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <div style="
        position: absolute; inset: 0;
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px #2563eb, 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapViewProps {
  location: GeolocationState;
  events: CultureEvent[];
  onSelectEvent: (e: CultureEvent) => void;
  autoCenter?: boolean;
}

function RecenterMap({
  latitude,
  longitude,
  enabled,
}: {
  latitude: number | null;
  longitude: number | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (enabled && latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], map.getZoom(), { animate: true });
    }
  }, [latitude, longitude, map, enabled]);
  return null;
}

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FocusMap({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 12, { duration: 1.2 });
  }, [center, map]);
  return null;
}

interface MapViewProps {
  location: GeolocationState;
  events: CultureEvent[];
  onSelectEvent: (e: CultureEvent) => void;
  autoCenter?: boolean;
  /** Центр карты (для переезда к выбранной локали) */
  focusCenter?: [number, number] | null;
  /** Обработчик клика по карте */
  onMapClick?: (lat: number, lng: number) => void;
}

export default function MapView({
  location,
  events,
  onSelectEvent,
  autoCenter = false,
  focusCenter = null,
  onMapClick,
}: MapViewProps) {
  const { latitude, longitude, accuracy } = location;
  const center: [number, number] =
    latitude !== null && longitude !== null
      ? [latitude, longitude]
      : [55.0302, 82.9204]; // Новосибирск по умолчанию

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <RecenterMap
        latitude={latitude}
        longitude={longitude}
        enabled={autoCenter}
      />
      <FocusMap center={focusCenter} />
      {onMapClick && <ClickHandler onClick={onMapClick} />}

      <EventMarkers events={events} onSelect={onSelectEvent} />

      {latitude !== null && longitude !== null && (
        <>
          <Marker position={[latitude, longitude]} icon={userIcon} />
          {accuracy !== null && (
            <Circle
              center={[latitude, longitude]}
              radius={accuracy}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#3b82f6",
                fillOpacity: 0.15,
                weight: 1,
              }}
            />
          )}
        </>
      )}
    </MapContainer>
  );
}
