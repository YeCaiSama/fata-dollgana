"use client";
import React, { useEffect, useMemo, useState } from "react";
import GalleryWall from "./components/GalleryWall";
import UploadFrame from "./components/UploadFrame";
import UploadStoryModal from "./components/UploadStoryModal";
import WioTerminalModal from "./components/WioTerminalModal";

export type ArchiveItem = {
  id: string;
  createdAt: number;
  dollName: string;
  authorLabel: string;
  whisper: string;

  // 网站墙上展示：清晰图（正方形）
  thumbDataUrl: string;

  // Wio 预览：像素化（拓麻歌子感）
  wioPreviewDataUrl: string;
};

export default function Page() {
  const [list, setList] = useState<ArchiveItem[]>([]);
  const [status, setStatus] = useState<string>("Preparing the hall…");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [openWio, setOpenWio] = useState(false);
  const [busyClear, setBusyClear] = useState(false);
  const [busySetCurrent, setBusySetCurrent] = useState(false);

  const selected = useMemo(
    () => list.find((x) => x.id === selectedId) || null,
    [list, selectedId]
  );

  async function refresh() {
    try {
      const r = await fetch("/api/archive/list", { cache: "no-store" });
      const j = await r.json();

      // ✅ 兼容不同字段名：items / list
      const raw = (j.items ?? j.list ?? []) as any[];

      const mapped: ArchiveItem[] = raw.map((x) => ({
        id: x.id,
        createdAt: x.created_at ? Date.parse(x.created_at) : x.createdAt ?? Date.now(),
        dollName: x.doll_name ?? x.dollName ?? "",
        authorLabel: x.author_label ?? x.authorLabel ?? "Anonymous",
        whisper: x.whisper ?? "",
        thumbDataUrl: x.thumb_url ?? x.thumbDataUrl ?? "",
        wioPreviewDataUrl: x.wio_preview_url ?? x.wioPreviewDataUrl ?? "",
      }));

      setList(mapped);
      setStatus("The hall is open. Walk softly.");
    } catch (e) {
      setStatus("The hall is quiet—could not reach the archive right now.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function clearTestUploads() {
    setBusyClear(true);
    setStatus("Sweeping the hall…");
    try {
      const r = await fetch("/api/archive/clear", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) throw new Error(j.error || (await r.text()));
      setSelectedId(null);
      await refresh();
      setStatus("Cleared. The hall is open again.");
    } catch (e: any) {
      setStatus(`Could not clear right now: ${e?.message ?? String(e)}`);
    } finally {
      setBusyClear(false);
    }
  }

  async function setAsCurrentCompanion() {
    if (!selected) return;
    setBusySetCurrent(true);
    setStatus("Placing a small glow into the Current…");
    try {
      // ✅ 兼容两种 API body（有的版本用 itemId，有的用 id）
      const r = await fetch("/api/current/set", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: selected.id, id: selected.id }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) throw new Error(j.error || (await r.text()));
      setStatus("Current Companion set. Your Wio can fetch it now.");
    } catch (e: any) {
      setStatus(`Could not set Current: ${e?.message ?? String(e)}`);
    } finally {
      setBusySetCurrent(false);
    }
  }

  return (
    <div className="container">
      <div className="brandRow">
        <div>
          <div className="brandTitle">Fata Dollgana | 馆</div>
          <div className="brandSub">
            A public museum of beloved dolls—softened into pixels, kept like warm lanterns in a small forever.
            <br />
            Leave a name (or leave none). Leave one line. Let it travel as a whisper.
          </div>
        </div>
        <div className="badge">Public Archive • Warm Pixels • Remote Companion</div>
      </div>

      <div className="panel">
        <div className="wallHeader">
          <h2>THE PUBLIC WALL</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="hint">{status}</div>
            <button
              className="iconBtn"
              onClick={clearTestUploads}
              disabled={busyClear}
              title="Delete all current test entries"
            >
              {busyClear ? "Clearing…" : "Clear test uploads"}
            </button>
          </div>
        </div>

        <GalleryWall
          list={list}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="footerDock">
        <div className="dockInner">
          <UploadFrame onOpen={() => setOpenUpload(true)} />

          <div className="eScreen">
            <div className="eTitle">COMPANION SCREEN PORTAL</div>
            <div className="eLine">
              {selected ? (
                <>
                  <b>{selected.dollName}</b>
                  <br />
                  “{selected.whisper}”
                  <br />
                  <br />
                  Set this as the <i>Current Companion</i>—your Wio Terminal will fetch it from the web and glow with it.
                </>
              ) : (
                <>
                  Select one exhibit from the wall.
                  <br />
                  Tap it again to let it go.
                  <br />
                  <br />
                  The device will fetch the <i>Current</i> from the web.
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="primary"
                onClick={setAsCurrentCompanion}
                disabled={!selected || busySetCurrent}
                title="Set selected exhibit as Current Companion"
              >
                {busySetCurrent ? "Setting…" : "Set as Current Companion"}
              </button>

              <button
                className="eBtn"
                onClick={() => setOpenWio(true)}
                disabled={!selected}
                title="Open warm portal view"
              >
                Open Wio Companion Portal
              </button>
            </div>
          </div>
        </div>
      </div>

      {openUpload && (
        <UploadStoryModal
          onClose={() => setOpenUpload(false)}
          onUploaded={() => refresh()}
        />
      )}

      {openWio && selected && (
        <WioTerminalModal item={selected} onClose={() => setOpenWio(false)} />
      )}
    </div>
  );
}
