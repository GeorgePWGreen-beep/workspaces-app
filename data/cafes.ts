import { Cafe } from "@/types/cafe";
import { CAFE_IMAGE_PLACEHOLDER } from "@/utils/cafeImages";

export const cafes: Cafe[] = [
  {
    name: "Bould Brothers Coffee",
    studyScore: 50,
    coords: [0.1195, 52.2053],

    wifi: "Great WiFi",
    noise: "Moderate",
    sockets: "Plenty",
    busyness: "Busy",

    rating: 4.8,
    price: "££",
    walkTime: 5,

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Independent speciality coffee shop with excellent natural lighting and reliable WiFi. A favourite among Cambridge students.",

    coffee: "Excellent",
    seating: "Comfortable",

    openingHours: "08:00 - 18:00",
  },

  {
    name: "Hot Numbers",
    studyScore: 90,
    coords: [0.1322, 52.2007],

    wifi: "Great WiFi",
    noise: "Moderate",
    sockets: "Plenty",
    busyness: "Moderate",

    rating: 4.7,
    price: "££",
    walkTime: 8,

    image: "/cafes/hot-numbers.jpg",

    description:
      "Large artisan café with plenty of seating and a relaxed atmosphere ideal for longer study sessions.",

    coffee: "Excellent",
    seating: "Comfortable",

    openingHours: "07:30 - 17:30",
  },

  {
    name: "Espresso Library",
    studyScore: 80,
    coords: [0.1258, 52.2026],

    wifi: "Great WiFi",
    noise: "Quiet",
    sockets: "Plenty",
    busyness: "Moderate",

    rating: 4.8,
    price: "££",
    walkTime: 6,

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Popular student workspace with reliable WiFi, spacious tables and a calm working environment.",

    coffee: "Excellent",
    seating: "Comfortable",

    openingHours: "08:00 - 18:00",
  },

  {
    name: "Urban Larder",
    studyScore: 70,
    coords: [0.1164, 52.2084],

    wifi: "Good WiFi",
    noise: "Quiet",
    sockets: "Some",
    busyness: "Quiet",

    rating: 4.6,
    price: "££",
    walkTime: 9,

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Relaxed independent café with quieter corners and comfortable seating for focused work.",

    coffee: "Good",
    seating: "Comfortable",

    openingHours: "08:00 - 17:00",
  },

  {
    name: "Aromi",
    studyScore: 75,
    coords: [0.1227, 52.2058],

    wifi: "Good WiFi",
    noise: "Loud",
    sockets: "Few",
    busyness: "Busy",

    rating: 4.8,
    price: "££",
    walkTime: 4,

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Authentic Sicilian café with amazing food and coffee, better suited to shorter study sessions.",

    coffee: "Excellent",
    seating: "Basic",

    openingHours: "08:00 - 19:00",
  },

  {
    name: "Fitzbillies",
    studyScore: 40,
    coords: [0.1242, 52.2044],

    wifi: "Okay WiFi",
    noise: "Moderate",
    sockets: "Few",
    busyness: "Busy",

    rating: 4.6,
    price: "£££",
    walkTime: 5,

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Historic Cambridge café famous for its Chelsea buns and lively atmosphere rather than long study sessions.",

    coffee: "Good",
    seating: "Basic",

    openingHours: "08:30 - 17:30",
  },
];
