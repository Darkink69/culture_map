import { useEffect, useState } from "react";

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(options?: PositionOptions): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({
        ...s,
        loading: false,
        error: "Геолокация не поддерживается браузером",
      }));
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let message = "Не удалось получить местоположение";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Доступ к геолокации запрещён";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Информация о местоположении недоступна";
          break;
        case error.TIMEOUT:
          message = "Время ожидания истекло";
          break;
      }
      setState((s) => ({ ...s, loading: false, error: message }));
    };

    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
