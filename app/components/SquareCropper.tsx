"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  file: File;
  size?: number; // preview box size in px
  onCancel: () => void;
  onConfirm: (croppedCanvas: HTMLCanvasElement) => void; // square canvas
};

export default function SquareCropper({ file, size = 360, onCancel, onConfirm }: Props) {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [url, setUrl] = useState<string>("");

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // in preview px
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // ✅ 关键修复：在 effect 内创建 objectURL，并在 cleanup revoke（避免 Strict Mode 提前 revoke）
  useEffect(() => {
    const localUrl = URL.createObjectURL(file);
    setUrl(localUrl);

    const img = new Image();
    img.src = localUrl;

    img.onload = () => {
      setImgEl(img);

      // cover to fill square
      const cover = Math.max(size / img.width, size / img.height);
      setZoom(cover);
      setOffset({ x: 0, y: 0 });
    };

    img.onerror = () => {
      setImgEl(null);
    };

    return () => {
      URL.revokeObjectURL(localUrl);
    };
  }, [file, size]);

  function clampOffset(nx: number, ny: number) {
    if (!imgEl) return { x: nx, y: ny };
    const w = imgEl.width * zoom;
    const h = imgEl.height * zoom;

    const minX = -(w - size) / 2;
    const maxX = (w - size) / 2;
    const minY = -(h - size) / 2;
    const maxY = (h - size) / 2;

    const cx = w <= size ? 0 : Math.max(minX, Math.min(maxX, nx));
    const cy = h <= size ? 0 : Math.max(minY, Math.min(maxY, ny));
    return { x: cx, y: cy };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!imgEl) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const next = clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy);
    setOffset(next);
  }

  function onPointerUp() {
    setDragging(false);
    dragStart.current = null;
  }

  function applyZoom(nextZoom: number) {
    if (!imgEl) return;
    const z = Math.max(nextZoom, 0.2);
    setZoom(z);
    setOffset((o) => clampOffset(o.x, o.y));
  }

  function exportCroppedCanvas() {
    if (!imgEl) return;

    const out = document.createElement("canvas");
    const OUT = 768; // crisp website master crop
    out.width = OUT;
    out.height = OUT;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    const scaledW = imgEl.width * zoom;
    const scaledH = imgEl.height * zoom;
    const imgLeft = (size - scaledW) / 2 + offset.x;
    const imgTop = (size - scaledH) / 2 + offset.y;

    const sx = (-imgLeft) / zoom;
    const sy = (-imgTop) / zoom;
    const sSize = size / zoom;

    ctx.drawImage(imgEl, sx, sy, sSize, sSize, 0, 0, OUT, OUT);
    onConfirm(out);
  }

  const zoomMax = useMemo(() => {
    // allow big zoom even if cover is large
    return Math.max(3, zoom * 1.5);
  }, [zoom]);

  return (
    <div>
      <div style={{ fontSize: 13.5, opacity: 0.88, lineHeight: 1.6 }}>
        Drag to reposition. Zoom to frame your doll.
      </div>

      <div
        style={{
          marginTop: 12,
          width: size,
          height: size,
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(0,0,0,0.22)",
          overflow: "hidden",
          position: "relative",
          touchAction: "none",
          userSelect: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {!imgEl ? (
          <div style={{ padding: 16, opacity: 0.75 }}>Loading image…</div>
        ) : (
          <>
            <img
              src={url}
              alt="crop"
              draggable={false}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: imgEl.width * zoom,
                height: imgEl.height * zoom,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                willChange: "transform",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                boxShadow:
                  "inset 0 0 0 2px rgba(216,179,106,0.18), inset 0 0 60px rgba(0,0,0,0.35)",
                pointerEvents: "none",
              }}
            />
          </>
        )}
      </div>

      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.75, minWidth: 60 }}>Zoom</div>
        <input
          type="range"
          min={0.2}
          max={zoomMax}
          step={0.01}
          value={zoom}
          onChange={(e) => applyZoom(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button className="iconBtn" onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={exportCroppedCanvas} disabled={!imgEl}>
          Use this crop
        </button>
      </div>
    </div>
  );
}
