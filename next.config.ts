import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.theexeterdaily.co.uk" },
      { protocol: "https", hostname: "img.restaurantguru.com" },
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "boatyardbakery.co.uk" },
      { protocol: "https", hostname: "static.where-e.com" },
      { protocol: "https", hostname: "i2-prod.devonlive.com" },
      { protocol: "https", hostname: "images.happycow.net" },
      { protocol: "https", hostname: "cdn.ecommercedns.uk" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "execoffeeroasters.co.uk" },
      { protocol: "https", hostname: "bostonteaparty.co.uk" },
      { protocol: "https", hostname: "eu-assets.simpleview-europe.com" },
      { protocol: "https", hostname: "images.squarespace-cdn.com" },
      { protocol: "https", hostname: "www.visitexeter.com" },
      { protocol: "https", hostname: "us1-photo.nextdoor.com" },
      { protocol: "https", hostname: "www.roastworks.co.uk" },
      { protocol: "https", hostname: "www.exeter.ac.uk" },
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com" },
    ],
  },
};

export default nextConfig;
