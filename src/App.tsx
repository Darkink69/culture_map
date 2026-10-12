import { useEffect, useMemo, useState } from "react";
import MapView from "./components/MapView";
import EventModal from "./components/EventModal";
import IdentifyPopup from "./components/IdentifyPopup";
import ProgressPanel from "./components/ProgressPanel";
import Splash from "./components/Splash";
import HintPopup from "./components/HintPopup";
import SearchButton from "./components/SearchButton";
import SearchPanel from "./components/SearchPanel";
import { useGeolocation } from "./hooks/useGeolocation";
import { useMapLocale } from "./hooks/useMapLocale";
import { useAggregatedEvents } from "./hooks/useAggregatedEvents";
import { useEventFilters, filterEvents } from "./hooks/useEventFilters";
import type { CultureEvent } from "./types/culture";
import { detectLocaleByCoords } from "./utils/detectLocale";

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
  } = useAggregatedEvents(mapLocale.locale?.sysName ?? null);

  const filterState = useEventFilters();

  const [selected, setSelected] = useState<CultureEvent | null>(null);
  const [autoCenter, setAutoCenter] = useState(true);
  const [focusCenter, setFocusCenter] = useState<[number, number] | null>(null);
  const [identifyPoint, setIdentifyPoint] = useState<{
    lat: number;
    lng: number;
    sameLocale: boolean;
  } | null>(null);

  const [debug] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("debug") === "1";
  });

  // Применённые фильтры — то, что реально видно на карте
  const visibleEvents = useMemo(
    () => filterEvents(events, filterState.applied),
    [events, filterState.applied],
  );

  // Сколько совпадёт, если нажать «Показать события» прямо сейчас
  const previewCount = useMemo(
    () => filterEvents(events, filterState.filters).length,
    [events, filterState.filters],
  );

  const handleMapClick = async (lat: number, lng: number) => {
    const currentSys = mapLocale.locale?.sysName ?? null;
    let sameLocale = true;
    try {
      const res = await detectLocaleByCoords(lat, lng);
      const clickedSys = res.locale?.sysName ?? null;
      sameLocale = currentSys !== null && clickedSys === currentSys;
    } catch {
      sameLocale = false;
    }
    setIdentifyPoint({ lat, lng, sameLocale });
  };

  const handleShowCityEvents = async () => {
    if (!identifyPoint) return;
    const { lat, lng } = identifyPoint;
    setFocusCenter([lat, lng]);
    await mapLocale.setLocaleByCoords(lat, lng);
    setIdentifyPoint(null);
  };

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

  const splashVisible =
    mapLocale.locale === null || (mapLocale.loading && !mapLocale.locale);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapView
        location={location}
        events={visibleEvents}
        onSelectEvent={(e) => {
          setIdentifyPoint(null);
          setSelected(e);
        }}
        autoCenter={autoCenter}
        focusCenter={focusCenter}
        onMapClick={handleMapClick}
      />

      {mapLocale.locale && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 w-[min(768px,calc(100%-2rem))] flex">
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
            debug={debug}
          />
        </div>
      )}

      {mapLocale.error && !loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-1000 w-[min(92vw,620px)]">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
            {mapLocale.error}
          </div>
        </div>
      )}

      <SearchButton
        onClick={() => filterState.open()}
        active={filterState.isOpen || filterState.hasActiveFilter}
      />

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

      {filterState.isOpen && (
        <SearchPanel
          filters={filterState.filters}
          onQueryChange={filterState.setQuery}
          onToggleCategory={filterState.toggleCategory}
          onDateChange={(from, to) => {
            filterState.setDateFrom(from);
            filterState.setDateTo(to);
          }}
          onClearDate={filterState.clearDate}
          onApply={filterState.apply}
          onClose={() => {
            filterState.close();
            filterState.reset();
          }}
          matchedCount={previewCount}
        />
      )}

      <EventModal event={selected} onClose={() => setSelected(null)} />

      {identifyPoint && (
        <IdentifyPopup
          lat={identifyPoint.lat}
          lng={identifyPoint.lng}
          isSameLocale={identifyPoint.sameLocale}
          onClose={() => setIdentifyPoint(null)}
          onShowCityEvents={
            identifyPoint.sameLocale ? undefined : handleShowCityEvents
          }
        />
      )}

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
