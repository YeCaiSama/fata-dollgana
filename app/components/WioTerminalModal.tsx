"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ArchiveItem } from "../page";
import PixelPreview from "./PixelPreview";
import WioSerialPanel from "./WioSerialPanel";

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

  const [jsonText, setJsonText] = useState<string>("");
  const [copyHint, setCopyHint] = useState<string>("");
  const [showSerial, setShowSerial] = useState<boolean>(false);

  useEffect(() => {
    if (phase !== "sending") return;
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 900);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    setLine(LINES[i]);
  }, [i]);

  const canClipboard = useMemo(() => typeof navigator !== "undefined" && !!navigator.clipboard, []);

  async function copyToClipboard(text: string) {
    try {
      if (!canClipboard) throw new Error("Clipboard not supported.");
      await navigator.clipboard.writeText(text);
      setCopyHint("JSON copied to clipboard ✓");
      setTimeout(() => setCopyHint(""), 1800);
      return true;
    } catch (e: any) {
      setCopyHint("Copy failed (you can still copy manually below).");
      setTimeout(() => setCopyHint(""), 2500);
      return false;
    }
  }

  async function fetchCurrentJsonText() {
    // 直接拿文本，避免 stringify 改写
    const res = await fetch("/api/wio/current", { cache: "no-store" });
    const text = await res.text();
    if (!res.ok) throw new Error(`Fetch /api/wio/current failed: HTTP ${res.status}`);
    setJsonText(text);
    return text;
  }

  async function setCurrentAndPrepare() {
    setPhase("sending");
    setErr("");
    setJsonText("");
    setCopyHint("");

    try {
      // 1) set current
      const r = await fetch("/api/current/set", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id, id: item.id }),
      });
      const j = await r.json().catch(() => ({} as any));
      if (!r.ok || j.ok === false) throw new Error(j.error || (await r.text()));

      // 2) fetch /api/wio/current
      const text = await fetchCurrentJsonText();

      // 3) copy
      await copyToClipboard(text);

      // 4) open serial panel (optional, but matches your “Open Wio companion portal” intent)
      setShowSerial(true);

      setPhase("done");
      setLine("Delivered. JSON is ready—open Wio Companion below to send it in one click.");
    } catch (e: any) {
      setPhase("fail");
      setErr(e?.message ?? String(e));
      setLine("The corridor was closed for a moment. Please try again.");
    }
  }

  async function justCopyJson() {
    try {
      const text = jsonText ? jsonText : await fetchCurrentJsonText();
      await copyToClipboard(text);
    } catch (e: any) {
      setPhase("fail");
      setErr(e?.message ?? String(e));
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
        <div className="modalTop">
          <div className="t">Wio Companion Portal</div>
          <button className="iconBtn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modalBody">
          <div className="story">
            <div style={{ fontSize: 14.5, lineHeight: 1.75 }}>
              <b>{item.dollName}</b>
              <div style={{ marginTop: 6, opacity: 0.75 }}>{item.authorLabel}</div>
              <div style={{ marginTop: 10, opacity: 0.92 }}>“{item.whisper}”</div>

              <div style={{ marginTop: 14, opacity: 0.82 }}>
                This will become the <b>Current Companion</b>. Then you can send it to Wio through WebSerial (no hotspot / no current.json / no python).
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid rgba(190,255,225,0.22)",
                  background: "rgba(0,0,0,0.22)",
                }}
              >
                <div style={{ color: "rgba(190,255,225,0.92)", letterSpacing: 0.5, fontSize: 13.2 }}>
                  {line}
                </div>

                {copyHint && (
                  <div style={{ marginTop: 10, color: "rgba(190,255,225,0.85)", fontSize: 12.5 }}>
                    {copyHint}
                  </div>
                )}

                {phase === "fail" && (
                  <div style={{ marginTop: 10, color: "rgba(255,180,120,0.9)", fontSize: 12.5 }}>
                    Error: {err}
                  </div>
                )}
              </div>

              <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: "wrap" as any }}>
                <button className="primary" onClick={setCurrentAndPrepare} disabled={phase === "sending"}>
                  Send to the companion-screen
                </button>

                <button
                  className="iconBtn"
                  onClick={() => setShowSerial((v) => !v)}
                  disabled={phase === "sending"}
                  title="Open the WebSerial sender panel"
                >
                  {showSerial ? "Hide Wio Companion" : "Open Wio Companion"}
                </button>

                <button
                  className="iconBtn"
                  onClick={justCopyJson}
                  disabled={phase === "sending"}
                  title="Fetch /api/wio/current and copy JSON"
                >
                  Copy JSON
                </button>

                <button className="iconBtn" onClick={onClose}>
                  Back to hall
                </button>
              </div>

              {jsonText && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12.5, opacity: 0.75, marginBottom: 6 }}>
                    Current JSON (for manual copy if needed)
                  </div>
                  <textarea
                    className="textarea"
                    value={jsonText}
                    readOnly
                    style={{
                      width: "100%",
                      minHeight: 120,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: 11.5,
                      lineHeight: 1.5,
                      opacity: 0.95,
                    }}
                  />
                </div>
              )}

              {showSerial && (
                <div style={{ marginTop: 14 }}>
                  <WioSerialPanel />
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
