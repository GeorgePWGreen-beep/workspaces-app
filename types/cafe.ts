export type Cafe = {
  name: string;
  studyScore: number;
  coords: [number, number];

  wifi: "Great WiFi" | "Good WiFi" | "Okay WiFi";
  noise: "Quiet" | "Moderate" | "Loud";
  sockets: "Plenty" | "Some" | "Few";
  busyness: "Quiet" | "Moderate" | "Busy";

  rating: number;
  price: "£" | "££" | "£££";
  walkTime: number;

  image: string;

  description: string;

  coffee: "Excellent" | "Good" | "Basic";

  seating: "Comfortable" | "Average" | "Basic";

  openingHours: string;
};