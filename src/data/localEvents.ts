import type { CultureEvent } from "../types/culture";

export const LOCAL_EVENTS: CultureEvent[] = [
  {
    _id: -1,
    title: "НГУ",
    name: "test-ngu",
    isPremiere: false,
    isPushkinsCard: false,
    source: "local",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/80/%D0%A4%D0%BE%D1%82%D0%BE_%D0%BD%D0%BE%D0%B2%D1%8B%D0%B9_%D0%BA%D0%BE%D1%80%D0%BF%D1%83%D1%81.jpg",
    description:
      "Новосибирский национальный исследовательский государственный университет.",
    topPlaceTitle: "Новосибирск, Академгородок",
    places: [
      {
        _id: "local-1",
        title: "НГУ",
        address: "Новосибирск, ул. Пирогова, 1",
        eventId: -1,
        location: { type: "Point", coordinates: [83.090845, 54.842994] },
      },
    ],
  },
  {
    _id: -2,
    title: "Мышь, вяжущая ДНК",
    name: "test-mouse-dna",
    isPremiere: false,
    isPushkinsCard: false,
    source: "local",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/ru/thumb/f/f0/Monument_to_lab_mouse-1.jpg/1280px-Monument_to_lab_mouse-1.jpg",
    description: "Жанровая скульптура в Новосибирском Академгородке",
    topPlaceTitle: "Новосибирск, Академгородок",
    places: [
      {
        _id: "local-2",
        title: "Мышь, вяжущая ДНК",
        address: "Новосибирск, ул. Ильича",
        eventId: -2,
        location: { type: "Point", coordinates: [83.105982, 54.849059] },
      },
    ],
  },
];
