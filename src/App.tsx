import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import EventModal from "./components/EventModal";
import ProgressPanel from "./components/ProgressPanel";
import Splash from "./components/Splash";
import HintPopup from "./components/HintPopup";
import { useGeolocation } from "./hooks/useGeolocation";
import { useMapLocale } from "./hooks/useMapLocale";
import { useCultureEvents } from "./hooks/useCultureEvents";
import { CATEGORY_CONFIG } from "./utils/eventCategory";
import type { CultureEvent } from "./types/culture";

export default function App() {
  const location = useGeolocation();
  const mapLocale = useMapLocale();

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
  } = useCultureEvents(mapLocale.locale?.sysName ?? null);

  const [selected, setSelected] = useState<CultureEvent | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [focusCenter, setFocusCenter] = useState<[number, number] | null>(null);

  // Обработка клика по карте — установить локаль
  const handleMapClick = async (lat: number, lng: number) => {
    setFocusCenter([lat, lng]);
    await mapLocale.setLocaleByCoords(lat, lng);
  };

  // При смене локали — центрируем карту на её примерный центр
  // (у нас нет координат центра локали, поэтому используем клик-центр
  //  или координаты пользователя)
  useEffect(() => {
    if (mapLocale.userLat && mapLocale.userLng && autoCenter) {
      setFocusCenter([mapLocale.userLat, mapLocale.userLng]);
    }
  }, [mapLocale.userLat, mapLocale.userLng, autoCenter]);

  useEffect(() => {
    if (mapLocale.center) {
      setFocusCenter(mapLocale.center);
    }
  }, [mapLocale.center]);

  // Показываем splash, пока нет локали ИЛИ она ещё инициализируется
  const splashVisible =
    mapLocale.locale === null || (mapLocale.loading && !mapLocale.locale);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapView
        location={location}
        events={events}
        onSelectEvent={setSelected}
        autoCenter={autoCenter}
        focusCenter={focusCenter}
        onMapClick={handleMapClick}
      />

      {/* Верхняя панель — прогресс, только если локаль определена */}
      {mapLocale.locale && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-[min(92vw,620px)]">
          <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg px-4 py-2 text-sm text-gray-800">
            <ProgressPanel
              loading={loading}
              stopped={stopped}
              error={error}
              events={events}
              progress={progress}
              fromCache={fromCache}
              lastUpdated={lastUpdated}
              localeTitle={mapLocale.locale.title}
              onRefresh={() => refresh({ force: true })}
              onStop={stop}
            />
          </div>
        </div>
      )}

      {/* Ошибка определения локали */}
      {mapLocale.error && !loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-1000 w-[min(92vw,620px)]">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
            {mapLocale.error}
          </div>
        </div>
      )}

      {/* Кнопка «Где я» */}
      <button
        onClick={() => {
          setAutoCenter(true);
          if (mapLocale.userLat && mapLocale.userLng) {
            setFocusCenter([mapLocale.userLat, mapLocale.userLng]);
          }
        }}
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

      {/* Легенда */}
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

      <Splash
        visible={splashVisible}
        message={
          mapLocale.loading
            ? "Определение местоположения..."
            : "Подключение к GPS..."
        }
      />

      <HintPopup
        visible={mapLocale.showFirstTimeHint}
        onClose={mapLocale.dismissHint}
      />
    </div>
  );
}
