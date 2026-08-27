import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hot Seats — Find your study spot",
  description: "Find a study-friendly café near you.",
};

export const viewport: Viewport = {
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
      <body>{children}</body>
    </html>
  );
}
