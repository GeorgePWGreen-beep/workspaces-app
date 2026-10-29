import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://hotseats.co.uk/",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
