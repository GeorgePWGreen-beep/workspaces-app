import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Workspaces App",
  description: "Find the best places to work",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
