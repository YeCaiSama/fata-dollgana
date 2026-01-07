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

  // ✅ 网站墙上展示：清晰图（正方形）
  thumbDataUrl: string;

  // ✅ Wio 预览：像素化（拓麻歌子感）
  wioPreviewDataUrl: string;
};


export default function Page() {
  const [list, setList] = useState<ArchiveItem[]>([]);
  const [status, setStatus] = useState<string>("Preparing the hall…");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [openUpload, setOpenUpload] = useState(false);
  const [openWio, setOpenWio] = useState(false);

  const selected = useMemo(
    () => list.find((x) => x.id === selectedId) || null,
    [list, selectedId]
  );

  async function refresh() {
    try {
      const r = await fetch("/api/archive/list", { cache: "no-store" });
      const j = await r.json();
      setList(j.list || []);
      setStatus("The hall is open. Walk softly.");
    } catch {
      setStatus("Local-only mode: the hall remembers what you show it (for now).");
    }
  }

  useEffect(() => { refresh(); }, []);

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
              onClick={async () => {
                await fetch("/api/archive/clear", { method: "POST" });
                setSelectedId(null);
                refresh();
              }}
              title="Delete all current in-memory entries"
            >
              Clear test uploads
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
            <div className="eTitle">Companion Screen Portal</div>
            <div className="eLine">
              {selected ? (
                <>
                  <b>{selected.dollName}</b>
                  <br />
                  “{selected.whisper}”
                  <br /><br />
                  Set this as the Current Companion—your Wio Terminal will fetch it from the web and glow with it.
                </>
              ) : (
                <>
                  Select one exhibit from the wall.
                  <br />
                  Then send it to the companion-screen.
                  <br /><br />
                  The device will fetch the <i>Current</i> from the web.
                </>
              )}
            </div>
            <button className="eBtn" onClick={() => setOpenWio(true)} disabled={!selected}>
              Open Wio Companion Portal
            </button>
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
