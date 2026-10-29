import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "@/components/HomeClient";
import { getCafes } from "@/lib/data/cafes";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hot Seats",
  alternateName: "hotseats.co.uk",
  url: "https://hotseats.co.uk/",
};

export default async function Home() {
  await connection();

  const cafes = await getCafes().catch((error: unknown) => {
    console.error("Unable to load cafe data for the home page:", error);
    return null;
  });

  if (!cafes) {
    return (
      <main className="grid min-h-dvh w-full place-items-center bg-[color:var(--hs-bg)] px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--hs-text)]">
            Couldn&apos;t load nearby seats.
          </h1>
          <p className="mt-2 text-[color:var(--hs-text-secondary)]">
            Check your connection and try again.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex h-11 items-center rounded-full bg-[color:var(--hs-green)] px-5 font-semibold text-white"
          >
            Try again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomeClient cafes={cafes} />
    </>
  );
}
