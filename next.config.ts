import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.theexeterdaily.co.uk" },
      { protocol: "https", hostname: "img.restaurantguru.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "boatyardbakery.co.uk" },
      { protocol: "https", hostname: "s10.localdatacdn.com" },
      { protocol: "https", hostname: "i2-prod.devonlive.com" },
      { protocol: "https", hostname: "images.happycow.net" },
      { protocol: "https", hostname: "cdn.ecommercedns.uk" },
    ],
  },
};

export default nextConfig;
