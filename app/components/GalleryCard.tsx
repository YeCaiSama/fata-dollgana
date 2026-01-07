"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Item = {
  id: string;
  dollName: string;
  authorLabel: string;
  whisper: string;
  thumbDataUrl: string; // 现在是 URL（supabase public url）也兼容 data url
};

export default function GalleryCard({
  item,
  selected,
  onSelect,
}: {
  item: Item;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 如果它被选中（用于右侧 Wio portal 选择），我们让信息卡“更容易出现”
  useEffect(() => {
    if (selected) setOpen(true);
  }, [selected]);

  // 点击页面其它地方关闭（移动端很有用）
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (!open) return;
      const el = cardRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  const subtitle = useMemo(() => {
    const curator = item.authorLabel?.trim()
      ? `Curator: ${item.authorLabel.trim()}`
      : "Curator: Anonymous";
    const whisper = item.whisper?.trim()
      ? `“${item.whisper.trim()}”`
      : "“A small forever.”";
    return { curator, whisper };
  }, [item.authorLabel, item.whisper]);

  return (
    <div
      ref={cardRef}
      className="fdgCard"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => {
        setOpen((v) => !v);
        onSelect?.(item.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
          onSelect?.(item.id);
        }
      }}
      aria-label={`Exhibit: ${item.dollName}`}
      data-open={open ? "1" : "0"}
      data-selected={selected ? "1" : "0"}
    >
      {/* Image */}
      <div className="fdgImgWrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fdgImg" src={item.thumbDataUrl} alt={item.dollName} />
        <div className="fdgVignette" />
        {/* ✅ selected 的柔光（覆盖在图像上） */}
        <div className="fdgInnerGlow" aria-hidden="true" />
      </div>

      {/* Reveal overlay */}
      <div className="fdgReveal" aria-hidden={!open}>
        <div className="fdgRevealInner">
          <div className="fdgTitleRow">
            <div className="fdgTitle">{item.dollName}</div>
            <span className="fdgPill">{selected ? "Selected" : "Tap to select"}</span>
          </div>
          <div className="fdgMeta">{subtitle.curator}</div>
          <div className="fdgWhisper">{subtitle.whisper}</div>

          <div className="fdgHint">
            <span className="dot" />
            {selected
              ? "Ready to travel to your companion-screen."
              : "Hover or tap to read. Tap again to close."}
          </div>
        </div>
      </div>

      <style jsx>{`
        .fdgCard {
          position: relative;
          width: 360px;
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;

          border: 1px solid rgba(216, 179, 106, 0.35);
          background: rgba(20, 14, 10, 0.35);

          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
          transform: translateZ(0);
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
          user-select: none;
        }

        .fdgCard:hover {
          transform: translateY(-2px);
        }

        /* ✅ 选中：更亮边框 + 外发光 + 呼吸 */
        .fdgCard[data-selected="1"] {
          border-color: rgba(246, 220, 150, 0.9);
          box-shadow:
            0 20px 70px rgba(0, 0, 0, 0.46),
            0 0 0 1px rgba(246, 220, 150, 0.35),
            0 0 30px rgba(246, 220, 150, 0.22);
          animation: selectedBreath 2.2s ease-in-out infinite;
        }

        @keyframes selectedBreath {
          0% {
            box-shadow:
              0 20px 70px rgba(0, 0, 0, 0.46),
              0 0 0 1px rgba(246, 220, 150, 0.32),
              0 0 26px rgba(246, 220, 150, 0.18);
          }
          50% {
            box-shadow:
              0 20px 75px rgba(0, 0, 0, 0.48),
              0 0 0 1px rgba(246, 220, 150, 0.40),
              0 0 34px rgba(246, 220, 150, 0.28);
          }
          100% {
            box-shadow:
              0 20px 70px rgba(0, 0, 0, 0.46),
              0 0 0 1px rgba(246, 220, 150, 0.32),
              0 0 26px rgba(246, 220, 150, 0.18);
          }
        }

        .fdgImgWrap {
          position: relative;
          aspect-ratio: 1 / 1.1;
          width: 100%;
          background: rgba(0, 0, 0, 0.12);
        }

        .fdgImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.04) contrast(1.02);
        }

        .fdgVignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(120% 80% at 50% 35%, rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 0.32) 100%),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.0), rgba(0, 0, 0, 0.24));
        }

        /* ✅ 选中时图片上会有一层“馆灯”柔光 */
        .fdgInnerGlow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          transition: opacity 220ms ease;
          background:
            radial-gradient(60% 45% at 50% 30%, rgba(246, 220, 150, 0.22), rgba(246, 220, 150, 0) 70%),
            radial-gradient(90% 70% at 50% 100%, rgba(246, 220, 150, 0.10), rgba(246, 220, 150, 0) 72%);
        }

        .fdgCard[data-selected="1"] .fdgInnerGlow {
          opacity: 1;
        }

        .fdgReveal {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: end;
          pointer-events: none;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .fdgCard[data-open="1"] .fdgReveal {
          opacity: 1;
          transform: translateY(0);
        }

        .fdgRevealInner {
          width: 100%;
          padding: 14px 16px 14px 16px;
          backdrop-filter: blur(10px);
          background: linear-gradient(
            to top,
            rgba(14, 10, 7, 0.78),
            rgba(14, 10, 7, 0.55),
            rgba(14, 10, 7, 0.12)
          );
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .fdgTitleRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 6px;
        }

        .fdgTitle {
          font-size: 20px;
          letter-spacing: 0.2px;
          color: rgba(255, 240, 214, 0.95);
          text-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
          line-height: 1.15;
        }

        .fdgPill {
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(216, 179, 106, 0.35);
          color: rgba(255, 235, 200, 0.85);
          background: rgba(0, 0, 0, 0.16);
          white-space: nowrap;
        }

        .fdgMeta {
          font-size: 14px;
          opacity: 0.82;
          color: rgba(240, 220, 190, 0.9);
          margin-bottom: 6px;
        }

        .fdgWhisper {
          font-size: 15px;
          color: rgba(255, 248, 232, 0.9);
          opacity: 0.92;
          line-height: 1.45;
        }

        .fdgHint {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          font-size: 12.5px;
          color: rgba(236, 214, 180, 0.75);
          opacity: 0.9;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(216, 179, 106, 0.75);
          box-shadow: 0 0 0 4px rgba(216, 179, 106, 0.14);
          animation: pulse 1.8s ease-in-out infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
