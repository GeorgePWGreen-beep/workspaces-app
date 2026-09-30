"use client";

import Image from "next/image";
import { useState } from "react";
import { CAFE_IMAGE_PLACEHOLDER } from "@/utils/cafeImages";

interface CafeHeroImageProps {
  src: string;
  cafeName: string;
}

export default function CafeHeroImage({ src, cafeName }: CafeHeroImageProps) {
  const requestedSource = src || CAFE_IMAGE_PLACEHOLDER;

  return (
    <CafeHeroImageContent
      key={`${requestedSource}:${cafeName}`}
      src={requestedSource}
      cafeName={cafeName}
    />
  );
}

function CafeHeroImageContent({ src, cafeName }: CafeHeroImageProps) {
  const [imageSource, setImageSource] = useState<string | null>(src);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleError = () => {
    setIsLoaded(false);
    setImageSource((currentSource) =>
      currentSource === CAFE_IMAGE_PLACEHOLDER ? null : CAFE_IMAGE_PLACEHOLDER,
    );
  };

  return (
    <div className="px-3 pt-3">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[24px] border border-[color:var(--hs-border)] bg-[color:var(--hs-canvas)] shadow-[0_8px_24px_rgba(20,25,21,0.06)]">
        {imageSource && (
          <Image
            key={imageSource}
            fill
            src={imageSource}
            alt={`Exterior of ${cafeName}`}
            sizes="(max-width: 767px) calc(100vw - 24px), 616px"
            className={`object-cover object-center transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
