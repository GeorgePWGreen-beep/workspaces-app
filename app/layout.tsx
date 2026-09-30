import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Hot Seats — Find your study spot",
  description: "Find a study-friendly café near you.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hot Seats",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/brand/hot-seats.svg", sizes: "any", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fafaf7",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
  <AuthProvider>{children}</AuthProvider>
  <Analytics />
</body>
    </html>
  );
}
