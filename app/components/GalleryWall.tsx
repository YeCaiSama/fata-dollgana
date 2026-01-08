"use client";
import React, { useEffect, useRef, useState } from "react";
import type { ArchiveItem } from "../page";

export default function GalleryWall({
  list,
  selectedId,
  onSelect,
}: {
  list: ArchiveItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="wallScroller"
      style={{
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 6,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <div
        className="wallGrid"
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(280px, 340px)",
          gap: 18,
          alignItems: "start",
          padding: "6px 6px 12px 6px",
          minHeight: 360,
        }}
      >
        {list.length === 0 ? (
          <div className="emptyWall">
            <div className="t">The wall is still quiet.</div>
            <div className="p">
              Tap the wooden frame below to place the first gentle exhibit.
              <br />
              A photo becomes a relic, and a sentence becomes its label.
            </div>
          </div>
        ) : (
          list.map((it) => {
            const isSelected = it.id === selectedId;
            const isHover = it.id === hoverId;

            const hintText = isSelected
              ? "Tap again to let it go."
              : "Tap to select this exhibit.";

            return (
              <div
                key={it.id}
                className="card"
                style={{
                  borderColor: isSelected ? "rgba(216,179,106,0.75)" : undefined,
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => onSelect(isSelected ? null : it.id)}
                onMouseEnter={() => setHoverId(it.id)}
                onMouseLeave={() => setHoverId((prev) => (prev === it.id ? null : prev))}
              >
                <div className="cardWrap">
                  <img className="cardImg" src={it.thumbDataUrl} alt={it.dollName} />

                  <div className="cardOverlay">
                    <div>
                      <div className="ovTitle">{it.dollName}</div>
                      <div className="ovMeta">
                        {it.authorLabel}
                        <br />
                        “{it.whisper}”
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ position: "absolute", right: 14, bottom: 14 }}>
                        <span
                          className="pill"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(216,179,106,0.55)",
                            background: "rgba(25,18,10,0.55)",
                            color: "rgba(255,236,198,0.92)",
                            fontSize: 12,
                            letterSpacing: 0.3,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                          }}
                        >
                          Selected
                        </span>
                      </div>
                    )}

                    {(isHover || isSelected) && (
                      <div
                        style={{
                          position: "absolute",
                          right: 14,
                          top: 14,
                          maxWidth: 210,
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: "1px solid rgba(216,179,106,0.22)",
                          background: "rgba(20,14,9,0.55)",
                          color: "rgba(255,245,220,0.88)",
                          fontSize: 12.5,
                          lineHeight: 1.35,
                          backdropFilter: "blur(10px)",
                          transform: isHover ? "translateY(0)" : "translateY(-2px)",
                          opacity: isHover || isSelected ? 1 : 0,
                          transition: "opacity 180ms ease, transform 180ms ease",
                          pointerEvents: "none",
                        }}
                      >
                        {hintText}
                      </div>
                    )}

                    {isSelected && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 22,
                          boxShadow:
                            "0 0 0 1px rgba(216,179,106,0.35), 0 0 28px rgba(216,179,106,0.18)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* ✅ 去掉 cardBody（避免信息重复显示） */}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
