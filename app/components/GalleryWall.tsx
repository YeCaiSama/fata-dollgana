"use client";
import React from "react";
import type { ArchiveItem } from "../page";

export default function GalleryWall({
  list,
  selectedId,
  onSelect,
}: {
  list: ArchiveItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="wallGrid">
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
            style={{ borderColor: it.id === selectedId ? "rgba(216,179,106,0.75)" : undefined }}
            onClick={() => onSelect(it.id)}
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
              </div>
            </div>

            <div className="cardBody">
              <div className="cardName">{it.dollName}</div>
              <div className="cardMeta">
                {it.authorLabel}<br />
                “{it.whisper}”
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
