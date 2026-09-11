import { Cafe } from "@/types/cafe";
import { CAFE_IMAGE_PLACEHOLDER } from "@/utils/cafeImages";
import { calculateStudyScore } from "@/utils/studyScoreV1";

const developmentCafeRecords: Cafe[] = [
  {
    city: "Exeter",
    isIndependent: true,
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Arrietty",
    studyScore: 85,
    coords: [-3.527072, 50.726516],
    wifi: "Great WiFi",
    noise: "Quiet",
    sockets: "Plenty",
    busyness: "Moderate",
    rating: 4.7,
    price: "££",
    image: CAFE_IMAGE_PLACEHOLDER,
    description: "Bright, relaxed speciality coffee shop well suited to studying and laptop work.",
    coffee: "Excellent",
    seating: "Comfortable",
    openingHours: "08:30 - 15:00",
  },
  {
    city: "Cambridge",
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Bould Brothers Coffee",
    isIndependent: true,
    studyScore: 50,
    coords: [0.1195, 52.2053],

    wifi: "Great WiFi",
    noise: "Moderate",
    sockets: "Plenty",
    busyness: "Busy",

    rating: 4.8,
    price: "££",

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Independent speciality coffee shop with excellent natural lighting and reliable WiFi. A favourite among Cambridge students.",

    coffee: "Excellent",
    seating: "Comfortable",

    openingHours: "08:00 - 18:00",
  },

  {
    city: "Cambridge",
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Hot Numbers",
    isIndependent: true,
    studyScore: 90,
    coords: [0.1322, 52.2007],

    wifi: "Great WiFi",
    noise: "Moderate",
    sockets: "Plenty",
    busyness: "Moderate",

    rating: 4.7,
    price: "££",

    image: "/cafes/hot-numbers.jpg",

    description:
      "Large artisan café with plenty of seating and a relaxed atmosphere ideal for longer study sessions.",

    coffee: "Excellent",
    seating: "Comfortable",

    openingHours: "07:30 - 17:30",
  },

  {
    city: "Cambridge",
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Espresso Library",
    isIndependent: null,
    studyScore: 80,
    coords: [0.1258, 52.2026],

    wifi: "Great WiFi",
    noise: "Quiet",
    sockets: "Plenty",
    busyness: "Moderate",

    rating: 4.8,
    price: "££",

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Popular student workspace with reliable WiFi, spacious tables and a calm working environment.",

    coffee: "Excellent",
    seating: "Comfortable",

    openingHours: "08:00 - 18:00",
  },

  {
    city: "Cambridge",
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Urban Larder",
    isIndependent: null,
    studyScore: 70,
    coords: [0.1164, 52.2084],

    wifi: "Good WiFi",
    noise: "Quiet",
    sockets: "Some",
    busyness: "Quiet",

    rating: 4.6,
    price: "££",

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Relaxed independent café with quieter corners and comfortable seating for focused work.",

    coffee: "Good",
    seating: "Comfortable",

    openingHours: "08:00 - 17:00",
  },

  {
    city: "Cambridge",
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Aromi",
    isIndependent: true,
    studyScore: 75,
    coords: [0.1227, 52.2058],

    wifi: "Good WiFi",
    noise: "Loud",
    sockets: "Few",
    busyness: "Busy",

    rating: 4.8,
    price: "££",

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Authentic Sicilian café with amazing food and coffee, better suited to shorter study sessions.",

    coffee: "Excellent",
    seating: "Basic",

    openingHours: "08:00 - 19:00",
  },

  {
    city: "Cambridge",
    seatCount: null,
    lastVerifiedAt: null,
    weeklyOpeningHours: null,
    name: "Fitzbillies",
    isIndependent: true,
    studyScore: 40,
    coords: [0.1242, 52.2044],

    wifi: "Okay WiFi",
    noise: "Moderate",
    sockets: "Few",
    busyness: "Busy",

    rating: 4.6,
    price: "£££",

    image: CAFE_IMAGE_PLACEHOLDER,

    description:
      "Historic Cambridge café famous for its Chelsea buns and lively atmosphere rather than long study sessions.",

    coffee: "Good",
    seating: "Basic",

    openingHours: "08:30 - 17:30",
  },
];

// Keep legacy values only while a fixture lacks verified scoring inputs.
export const cafes: Cafe[] = developmentCafeRecords.map((cafe) => ({
  ...cafe,
  studyScore: calculateStudyScore(cafe) ?? cafe.studyScore,
}));
