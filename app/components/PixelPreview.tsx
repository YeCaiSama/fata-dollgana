"use client";
import React, { useEffect, useRef } from "react";

export default function PixelPreview({ dataUrl }: { dataUrl: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const c = ref.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, c.width, c.height);
    };
  }, [dataUrl]);

  return (
    <canvas
      ref={ref}
      width={320}
      height={320}
      className="pixelCanvas"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
