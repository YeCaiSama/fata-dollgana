"use client";

import React, { useMemo, useRef, useState } from "react";

type SerialPortLike = any;

const BAUD = 115200;

// Slower + safer
const CHUNK_SIZE = 64;
const GAP_MS = 6;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function writeInChunks(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: Uint8Array
) {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    await writer.write(data.slice(i, i + CHUNK_SIZE));
    await sleep(GAP_MS);
  }
}

function formatErr(e: any) {
  if (!e) return "Unknown error";
  const name = e?.name ? String(e.name) : "";
  const msg = e?.message ? String(e.message) : String(e);
  return name ? `${name}: ${msg}` : msg;
}

export default function WioSerialPanel() {
  const supported = useMemo(
    () => typeof window !== "undefined" && "serial" in navigator,
    []
  );

  const secureOk = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }, []);

  const portRef = useRef<SerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("Idle");
  const [lastVersion, setLastVersion] = useState<string>("");

  async function cleanup() {
    const writer = writerRef.current;
    const port = portRef.current;
    writerRef.current = null;
    portRef.current = null;

    try {
      if (writer) {
        try { writer.releaseLock(); } catch {}
      }
      if (port) {
        try { await port.close(); } catch {}
      }
    } catch {}
    setConnected(false);
  }

  async function connect() {
    if (!supported) {
      setStatus("WebSerial is not supported. Use Chrome/Edge on desktop.");
      return;
    }
    if (!secureOk) {
      setStatus("WebSerial requires HTTPS (or localhost).");
      return;
    }

    try {
      setBusy(true);
      setStatus("Requesting a serial port… choose the Wio Terminal port.");
      if (connected) await cleanup();

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: BAUD });

      const writer = port.writable.getWriter();
      portRef.current = port;
      writerRef.current = writer;

      setConnected(true);
      setStatus("Connected. Ready to send.");
    } catch (e: any) {
      setStatus(`Connect failed: ${formatErr(e)}\nTip: Close Arduino Serial Monitor/Plotter if it is open.`);
      await cleanup();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    try {
      setBusy(true);
      setStatus("Disconnecting…");
      await cleanup();
      setStatus("Disconnected.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCurrent() {
    if (!connected || !writerRef.current) {
      setStatus("Not connected. Click “Open Wio Companion” first.");
      return;
    }

    try {
      setBusy(true);
      setStatus("Fetching /api/wio/current …");

      const res = await fetch("/api/wio/current", { cache: "no-store" });
      const text = await res.text();
      if (!res.ok) {
        setStatus(`Fetch failed: HTTP ${res.status}`);
        return;
      }

      try {
        const j = JSON.parse(text);
        if (j?.version) setLastVersion(String(j.version));
      } catch {}

      setStatus(`Sending… (chunk ${CHUNK_SIZE} bytes, gap ${GAP_MS}ms)`);

      // IMPORTANT: end with TWO newlines (blank line terminator)
      const payload = new TextEncoder().encode(text + "\n\n");

      await writeInChunks(writerRef.current, payload);

      setStatus("Sent ✓  (Wio should render now)");
    } catch (e: any) {
      // This is where your “unknown system error” happens
      setStatus(
        `Send failed: ${formatErr(e)}\n` +
          "Common causes:\n" +
          "• Wio disconnected/reset during sending\n" +
          "• Cable/HUB unstable\n" +
          "• Another app grabbed the COM port\n" +
          "Try: unplug/replug Wio → reconnect → send again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm opacity-80">Wio Companion (WebSerial)</div>
          <div className="text-xs opacity-60">
            {supported ? "WebSerial supported" : "WebSerial NOT supported"}
            {secureOk ? "" : " · insecure context"}
            {lastVersion ? ` · last version: ${lastVersion}` : ""}
          </div>
        </div>

        <div className="flex gap-2">
          {!connected ? (
            <button
              onClick={connect}
              disabled={!supported || !secureOk || busy}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20 disabled:opacity-40"
            >
              Open Wio Companion
            </button>
          ) : (
            <button
              onClick={disconnect}
              disabled={busy}
              className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/20 disabled:opacity-40"
            >
              Disconnect
            </button>
          )}

          <button
            onClick={sendCurrent}
            disabled={!connected || busy}
            className="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm hover:bg-emerald-500/30 disabled:opacity-40"
          >
            Send to the companion screen
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs">
        <div className="opacity-70">Status</div>
        <pre className="mt-1 whitespace-pre-wrap font-mono">{status}</pre>
      </div>

      <div className="mt-3 text-xs opacity-60 leading-relaxed">
        <div className="opacity-80">Checklist</div>
        <ul className="list-disc pl-5">
          <li>Use Chrome/Edge desktop.</li>
          <li>Use HTTPS (or localhost/127.0.0.1).</li>
          <li>Use a data-capable USB cable (not charge-only).</li>
          <li>Close Arduino Serial Monitor/Plotter and any serial tools.</li>
          <li>Unplug/replug Wio → reconnect → send again.</li>
        </ul>
      </div>
    </div>
  );
}
