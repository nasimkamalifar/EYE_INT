import React, { useEffect, useMemo, useRef, useState } from "react";
import aiComputingImg from "../../../assets/images/editorial_ai_computing_1794955233988.jpg";
import globalMarketsImg from "../../../assets/images/editorial_global_markets_1794955236718.jpg";
import cultureCinemaImg from "../../../assets/images/editorial_culture_cinema_1794955237737.jpg";
import scienceHorizonImg from "../../../assets/images/editorial_science_horizon_1794955238428.jpg";

const EDITORIAL_PLATES = [
  aiComputingImg,
  globalMarketsImg,
  cultureCinemaImg,
  scienceHorizonImg,
];

function pickEditorialPlate(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return EDITORIAL_PLATES[Math.abs(hash) % EDITORIAL_PLATES.length];
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { src, alt, style, className, onLoad, onError, ...rest } = props;
  const imgRef = useRef<HTMLImageElement>(null);
  const [didError, setDidError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fallbackPlate = useMemo(
    () => pickEditorialPlate(String(alt || src || "kian-editorial")),
    [alt, src],
  );

  useEffect(() => {
    setDidError(false);
    setLoaded(false);
    const el = imgRef.current;
    if (el && el.complete) {
      if (el.naturalWidth > 4) {
        setLoaded(true);
      } else if (src) {
        setDidError(true);
      }
    }
    if (!src) return;
    const timeout = window.setTimeout(() => {
      setLoaded((alreadyLoaded) => {
        if (!alreadyLoaded) setDidError(true);
        return alreadyLoaded;
      });
    }, 2800);
    return () => window.clearTimeout(timeout);
  }, [src]);

  if (!src || didError) {
    return (
      <img
        src={fallbackPlate}
        alt={alt || "تصویر تحریریه"}
        className={className}
        style={style}
        loading="lazy"
      />
    );
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt || ""}
      referrerPolicy="no-referrer"
      className={`transition-opacity duration-300 ease-out ${className ?? ""}`}
      style={{
        ...(loaded
          ? undefined
          : {
              backgroundImage: `url("${fallbackPlate}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }),
        ...style,
      }}
      {...rest}
      onLoad={(e) => {
        const target = e.currentTarget;
        if (target.naturalWidth <= 4) {
          setDidError(true);
          return;
        }
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setDidError(true);
        onError?.(e);
      }}
    />
  );
}
