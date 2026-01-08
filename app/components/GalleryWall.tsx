"use client";
import React, { useEffect, useRef } from "react";
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

  // ✅ 鼠标滚轮：纵向滚轮 -> 横向滚动（更像“墙”）
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // 仅在可横向滚动时拦截
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
        // 点击空白区域取消选择
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
          list.map((it) => (
            <div
              key={it.id}
              className="card"
              style={{
                borderColor: it.id === selectedId ? "rgba(216,179,106,0.75)" : undefined,
                cursor: "pointer",
              }}
              onClick={() => onSelect(it.id === selectedId ? null : it.id)}
              title={it.id === selectedId ? "Tap again to unselect" : "Select this exhibit"}
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

                  {it.id === selectedId && (
                    <div style={{ position: "absolute", right: 14, bottom: 14 }}>
                      <span className="pill">Selected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="cardBody">
                <div className="cardName">{it.dollName}</div>
                <div className="cardMeta">
                  {it.authorLabel}
                  <br />“{it.whisper}”
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
