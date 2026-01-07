"use client";
import React, { useEffect, useState } from "react";
import type { ArchiveItem } from "../page";
import PixelPreview from "./PixelPreview";

const LINES = [
  "I’m on my way to keep you company.",
  "Carrying warmth, in careful pixels.",
  "Crossing the quiet distance between screens.",
  "Almost there—hold your place for me.",
];

export default function WioTerminalModal({
  item,
  onClose,
}: {
  item: ArchiveItem;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "sending" | "done" | "fail">("idle");
  const [line, setLine] = useState(LINES[0]);
  const [i, setI] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (phase !== "sending") return;
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 900);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => { setLine(LINES[i]); }, [i]);

  async function setCurrent() {
    setPhase("sending");
    setErr("");
    try {
      const r = await fetch("/api/current/set", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      if (!r.ok) throw new Error(await r.text());
      setPhase("done");
      setLine("Delivered. The companion-screen will glow with it soon.");
    } catch (e: any) {
      setPhase("fail");
      setErr(e?.message ?? String(e));
      setLine("The corridor was closed for a moment. Please try again.");
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modalTop">
          <div className="t">Wio Companion Portal</div>
          <button className="iconBtn" onClick={onClose}>Close</button>
        </div>

        <div className="modalBody">
          <div className="story">
            <div style={{ fontSize: 14.5, lineHeight: 1.75 }}>
              <b>{item.dollName}</b>
              <div style={{ marginTop: 6, opacity: 0.75 }}>{item.authorLabel}</div>
              <div style={{ marginTop: 10, opacity: 0.92 }}>“{item.whisper}”</div>

              <div style={{ marginTop: 14, opacity: 0.82 }}>
                This will become the <b>Current Companion</b>.
                Your Wio Terminal will fetch it from the web—then hold it close on its small screen.
              </div>

              <div style={{ marginTop: 14, padding: 12, borderRadius: 14, border: "1px solid rgba(190,255,225,0.22)", background: "rgba(0,0,0,0.22)" }}>
                <div style={{ color: "rgba(190,255,225,0.92)", letterSpacing: 0.5, fontSize: 13.2 }}>
                  {line}
                </div>
                {phase === "fail" && (
                  <div style={{ marginTop: 10, color: "rgba(255,180,120,0.9)", fontSize: 12.5 }}>
                    Error: {err}
                  </div>
                )}
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <button className="primary" onClick={setCurrent} disabled={phase === "sending"}>
                  Send to the companion-screen
                </button>
                <button className="iconBtn" onClick={onClose}>Back to hall</button>
              </div>

              {phase === "done" && (
                <div className="smallHint" style={{ marginTop: 10 }}>
                  Next we’ll make this truly public (deploy) so the Wio can fetch it anywhere.
                </div>
              )}
            </div>
          </div>

          <div className="side">
            <div className="previewBox">
              <div className="previewTitle">What the screen will show</div>
              <PixelPreview dataUrl={item.wioPreviewDataUrl} />
              <div className="smallHint">A small glow. A steady presence.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
