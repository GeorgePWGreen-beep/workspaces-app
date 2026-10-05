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
      { protocol: "https", hostname: "www.roastworks.co.uk", port: "", pathname: "/cdn/shop/**" },
      { protocol: "https", hostname: "bostonteaparty.co.uk", port: "", pathname: "/media/**" },
      { protocol: "https", hostname: "www.visitexeter.com", port: "", pathname: "/dbimgs/**" },
      { protocol: "https", hostname: "eu-assets.simpleview-europe.com", port: "", pathname: "/southdevon2018/imageresizer/**" },
      { protocol: "https", hostname: "execoffeeroasters.co.uk", port: "", pathname: "/cdn/shop/**" },
      { protocol: "https", hostname: "us1-photo.nextdoor.com", port: "", pathname: "/business_gallery/**" },
      { protocol: "https", hostname: "images.squarespace-cdn.com", port: "", pathname: "/content/v1/**" },
      { protocol: "https", hostname: "www.exeter.ac.uk", port: "", pathname: "/v8media/**" },
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com", port: "", pathname: "/media/photo-o/**" },
    ],
  },
};

export default nextConfig;
