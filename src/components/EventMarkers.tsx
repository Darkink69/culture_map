import { useEffect, useReducer, useRef } from "react";
import { Marker } from "react-leaflet";
import L from "leaflet";
import type { CultureEvent } from "../types/culture";
import { CATEGORY_CONFIG, getEventCategory } from "../utils/eventCategory";
import { getEventCoords } from "../utils/coordsCache";
import { onCoordsUpdated, getQueueSize } from "../utils/geocodeQueue";
import { jitterCoords } from "../utils/jitterCoords";

const iconCache = new Map<string, L.DivIcon>();

function makeIcon(category: keyof typeof CATEGORY_CONFIG): L.DivIcon {
  const cached = iconCache.get(category);
  if (cached) return cached;

  const { icon } = CATEGORY_CONFIG[category];

  const divIcon = L.divIcon({
    className: "event-marker",
    html: `
      <div style="
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        box-shadow: 0 0 0 .5px #ffffff;
      ">
        <img
          src="${icon}"
          alt=""
          style="
            width: 46px;
            height: 46px;
            display: block;
            border-radius: 50%;
          "
        />
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  });

  iconCache.set(category, divIcon);
  return divIcon;
}

interface Props {
  events: CultureEvent[];
  onSelect: (e: CultureEvent) => void;
}

function getCoordsForEvent(event: CultureEvent): [number, number] | null {
  const source = event.source ?? "culture";
  if (source !== "culture") {
    const c = event.places?.[0]?.location?.coordinates;
    if (c && c.length === 2) return [c[0], c[1]];
    return null;
  }
  return getEventCoords(event._id);
}

export default function EventMarkers({ events, onSelect }: Props) {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const jitteredRef = useRef<Map<number, [number, number]>>(new Map());

  useEffect(() => {
    const next = new Map<number, [number, number]>();
    for (const event of events) {
      const cached = jitteredRef.current.get(event._id);
      if (cached) {
        next.set(event._id, cached);
        continue;
      }
      const raw = getCoordsForEvent(event);
      if (!raw) continue;
      next.set(event._id, jitterCoords(raw));
    }
    jitteredRef.current = next;
  }, [events]);

  useEffect(() => {
    const unsub = onCoordsUpdated(() => {
      let added = 0;
      for (const event of events) {
        if (jitteredRef.current.has(event._id)) continue;
        const raw = getCoordsForEvent(event);
        if (!raw) continue;
        jitteredRef.current.set(event._id, jitterCoords(raw));
        added++;
      }
      if (added > 0) forceUpdate();
    });
    return () => {
      unsub();
    };
  }, [events]);

  let rendered = 0;
  let noCoords = 0;

  const markers = events.map((event) => {
    const pos = jitteredRef.current.get(event._id);
    if (!pos) {
      noCoords++;
      return null;
    }
    rendered++;
    const category = getEventCategory(event);
    const icon = makeIcon(category);

    return (
      <Marker
        key={event._id}
        position={[pos[1], pos[0]]}
        icon={icon}
        eventHandlers={{ click: () => onSelect(event) }}
      />
    );
  });

  const inQueue = getQueueSize();
  if (events.length > 0) {
    console.log(
      `[markers] всего: ${events.length}, отрисовано: ${rendered}, ` +
        `без координат: ${noCoords}, в очереди: ${inQueue}`,
    );
  }

  return <>{markers}</>;
}
