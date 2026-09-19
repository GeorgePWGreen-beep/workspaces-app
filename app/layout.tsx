import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

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
    icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
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
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
