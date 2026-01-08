"use client";

import React, { useEffect, useState } from "react";
import type { ArchiveItem } from "../page";
import PixelPreview from "./PixelPreview";

const LINES = [
  "I’m on my way to keep you company.",
  "Carrying warmth, in careful pixels.",
  "Crossing the quiet distance between screens.",
  "Almost there — hold your place for me.",
];

type Phase = "idle" | "sending" | "done" | "fail";

export default function WioTerminalModal({
  item,
  onClose,
}: {
  item: ArchiveItem;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lineIndex, setLineIndex] = useState(0);
  const [err, setErr] = useState("");

  // rotating story lines while sending
  useEffect(() => {
    if (phase !== "sending") return;
    const t = setInterval(
      () => setLineIndex((i) => (i + 1) % LINES.length),
      900
    );
    return () => clearInterval(t);
  }, [phase]);

  async function setAsCurrentCompanion() {
    setPhase("sending");
    setErr("");

    try {
      const res = await fetch("/api/current/set", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Unknown error");
      }

      setPhase("done");
    } catch (e: any) {
      setPhase("fail");
      setErr(e?.message ?? "Failed to reach the corridor.");
    }
  }

  return (
    <div
      className="modalOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        {/* Header */}
        <div className="modalTop">
          <div className="t">Companion Screen Portal</div>
          <button className="iconBtn" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Body */}
        <div className="modalBody">
          {/* Left: Story */}
          <div className="story">
            <div style={{ fontSize: 15, lineHeight: 1.75 }}>
              <b style={{ fontSize: 17 }}>{item.dollName}</b>

              <div style={{ marginTop: 6, opacity: 0.75 }}>
                {item.authorLabel}
              </div>

              <div style={{ marginTop: 10, opacity: 0.95 }}>
                “{item.whisper}”
              </div>

              <div style={{ marginTop: 14, opacity: 0.85 }}>
                This exhibit will become the{" "}
                <b>Current Companion</b>.
                <br />
                The Wio Terminal will fetch it from the web
                <br />
                and keep it glowing on its small screen.
              </div>

              {/* Status box */}
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  borderRadius: 16,
                  border: "1px solid rgba(190,255,225,0.22)",
                  background: "rgba(0,0,0,0.28)",
                }}
              >
                {phase === "idle" && (
                  <div
                    style={{
                      color: "rgba(190,255,225,0.9)",
                      fontSize: 13.5,
                      letterSpacing: 0.4,
                    }}
                  >
                    Ready when you are.
                  </div>
                )}

                {phase === "sending" && (
                  <div
                    style={{
                      color: "rgba(190,255,225,0.95)",
                      fontSize: 13.5,
                      letterSpacing: 0.4,
                    }}
                  >
                    {LINES[lineIndex]}
                  </div>
                )}

                {phase === "done" && (
                  <div
                    style={{
                      color: "rgba(180,255,210,1)",
                      fontSize: 13.5,
                    }}
                  >
                    Delivered.
                    <br />
                    The companion-screen will glow with it soon.
                  </div>
                )}

                {phase === "fail" && (
                  <div
                    style={{
                      color: "rgba(255,180,120,0.95)",
                      fontSize: 13,
                    }}
                  >
                    The corridor was closed for a moment.
                    <br />
                    {err}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="row" style={{ marginTop: 14 }}>
                <button
                  className="primary"
                  onClick={setAsCurrentCompanion}
                  disabled={phase === "sending" || phase === "done"}
                >
                  Set as Current Companion
                </button>

                <button className="iconBtn" onClick={onClose}>
                  Back to the hall
                </button>
              </div>

              {phase === "done" && (
                <div className="smallHint" style={{ marginTop: 10 }}>
                  The device will fetch this from the public archive.
                </div>
              )}
            </div>
          </div>

          {/* Right: Pixel preview */}
          <div className="side">
            <div className="previewBox">
              <div className="previewTitle">
                What the companion-screen will show
              </div>

              <PixelPreview dataUrl={item.wioPreviewDataUrl} />

              <div className="smallHint">
                A small glow. A steady presence.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
