import { useState } from "react";
import MapView from "./components/MapView";
import EventModal from "./components/EventModal";
import ProgressPanel from "./components/ProgressPanel";
import { useGeolocation } from "./hooks/useGeolocation";
import { useDetectedLocale } from "./hooks/useDetectedLocale";
import { useCultureEvents } from "./hooks/useCultureEvents";
import { CATEGORY_CONFIG } from "./utils/eventCategory";
import type { CultureEvent } from "./types/culture";

export default function App() {
  const location = useGeolocation();
  const detected = useDetectedLocale(location.latitude, location.longitude);

  const {
    events,
    loading,
    error,
    progress,
    fromCache,
    lastUpdated,
    refresh,
    stop,
    stopped,
  } = useCultureEvents(detected.locale?.sysName ?? null);

  const [selected, setSelected] = useState<CultureEvent | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapView
        location={location}
        events={events}
        onSelectEvent={setSelected}
        autoCenter={autoCenter}
      />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-[min(92vw,620px)]">
        <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg px-4 py-2 text-sm text-gray-800">
          {detected.loading && (
            <div className="text-gray-700">Определение города по GPS...</div>
          )}
          {!detected.loading && !detected.locale && (
            <div className="text-red-600">
              Не удалось определить город. Проверьте доступ к геолокации.
            </div>
          )}
          {detected.locale && (
            <ProgressPanel
              loading={loading}
              stopped={stopped}
              error={error}
              events={events}
              progress={progress}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              localeTitle={detected.locale.title}
              onRefresh={() => refresh({ force: true })}
              onStop={stop}
            />
          )}
        </div>
      </div>

      {/* Кнопка «Где я» */}
      <button
        onClick={() => setAutoCenter(true)}
        className="absolute bottom-6 right-6 z-1000 bg-white shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition"
        title="Центрировать на моём местоположении"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="8" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
        </svg>
      </button>

      <div className="absolute bottom-6 left-6 z-1000 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg px-3 py-2 text-xs">
        <div className="font-semibold mb-1 text-gray-700">Типы событий</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-gray-700">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: cfg.color }}
              />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      <EventModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
