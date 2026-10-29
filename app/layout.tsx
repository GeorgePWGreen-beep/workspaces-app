import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://hotseats.co.uk"),
  applicationName: "Hot Seats",
  title: "Hot Seats | Study-Friendly Cafés in Exeter & Cambridge",
  description: "Discover study-friendly cafés in Exeter and Cambridge. Compare Wi-Fi, sockets, seating, noise levels and Hot Seats Study Scores to find your ideal workspace.",
  openGraph: {
    type: "website",
    siteName: "Hot Seats",
    locale: "en_GB",
    title: "Hot Seats | Study-Friendly Cafés in Exeter & Cambridge",
    description: "Discover study-friendly cafés in Exeter and Cambridge. Compare Wi-Fi, sockets, seating, noise levels and Hot Seats Study Scores to find your ideal workspace.",
  },
  twitter: {
    card: "summary",
    title: "Hot Seats | Study-Friendly Cafés in Exeter & Cambridge",
    description: "Discover study-friendly cafés in Exeter and Cambridge. Compare Wi-Fi, sockets, seating, noise levels and Hot Seats Study Scores to find your ideal workspace.",
  },
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
