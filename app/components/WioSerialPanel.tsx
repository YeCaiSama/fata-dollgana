"use client";

import React, { useMemo, useRef, useState } from "react";

type SerialPortLike = any; // 为了不引入额外 types

const BAUD = 115200;

// 分块发送，防止一次写太大导致 Wio 丢数据
async function writeInChunks(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: Uint8Array,
  chunkSize = 256,
  gapMs = 2
) {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    await writer.write(chunk);
    if (gapMs > 0) await new Promise((r) => setTimeout(r, gapMs));
  }
}

export default function WioSerialPanel() {
  const supported = useMemo(
    () => typeof window !== "undefined" && "serial" in navigator,
    []
  );

  const portRef = useRef<SerialPortLike | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);

  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("Idle");
  const [lastVersion, setLastVersion] = useState<string>("");

  async function connect() {
    if (!supported) {
      setStatus("WebSerial not supported (use Chrome/Edge desktop).");
      return;
    }

    try {
      setBusy(true);
      setStatus("Requesting port…");

      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: BAUD });

      const writer = port.writable.getWriter();

      portRef.current = port;
      writerRef.current = writer;

      setConnected(true);
      setStatus("Connected. Ready to send.");
    } catch (e: any) {
      setStatus(`Connect failed: ${e?.message ?? String(e)}`);
      // 清理
      portRef.current = null;
      writerRef.current = null;
      setConnected(false);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    try {
      setBusy(true);
      setStatus("Disconnecting…");

      const writer = writerRef.current;
      if (writer) {
        try {
          writer.releaseLock();
        } catch {}
      }
      writerRef.current = null;

      const port = portRef.current;
      if (port) {
        try {
          await port.close();
        } catch {}
      }
      portRef.current = null;

      setConnected(false);
      setStatus("Disconnected.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCurrent() {
    if (!connected || !writerRef.current) {
      setStatus("Not connected. Click ‘Open Wio Companion’ first.");
      return;
    }

    try {
      setBusy(true);
      setStatus("Fetching /api/wio/current …");

      // 直接拿文本，避免 JSON.stringify 改写格式
      const res = await fetch("/api/wio/current", { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        setStatus(`Fetch failed: HTTP ${res.status}`);
        return;
      }

      // 解析一下 version 给 UI 显示（不影响发送）
      try {
        const j = JSON.parse(text);
        if (j?.version) setLastVersion(String(j.version));
      } catch {}

      setStatus("Sending to Wio…");
      const payload = new TextEncoder().encode(text + "\n\n"); // 空行=结束信号

      // 分块写入更稳
      await writeInChunks(writerRef.current, payload, 256, 2);

      setStatus("Sent. Wio should render now.");
    } catch (e: any) {
      setStatus(`Send failed: ${e?.message ?? String(e)}`);
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
            {lastVersion ? ` · last version: ${lastVersion}` : ""}
          </div>
        </div>

        <div className="flex gap-2">
          {!connected ? (
            <button
              onClick={connect}
              disabled={!supported || busy}
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
        <div className="mt-1 font-mono">{status}</div>
      </div>

      <div className="mt-3 text-xs opacity-60 leading-relaxed">
        Tips: 插上 Wio → 点击 Open → 选择对应串口 → 点击 Send。Wio 端需要处于 USB
        接收模式（你现在的固件已经是）。
      </div>
    </div>
  );
}
