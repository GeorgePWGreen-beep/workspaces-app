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
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#ECE8E2]">
      {imageSource && (
        <Image
          key={imageSource}
          fill
          src={imageSource}
          alt={`Interior of ${cafeName}`}
          sizes="(max-width: 767px) 100vw, 640px"
          className={`object-cover transition-opacity duration-200 ease-out motion-reduce:transition-none ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
}
