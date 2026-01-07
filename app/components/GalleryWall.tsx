"use client";
import React from "react";
import type { ArchiveItem } from "../page";
import GalleryCard from "./GalleryCard";

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
          <GalleryCard
            key={it.id}
            item={it}
            selected={it.id === selectedId}
            onSelect={(id) => onSelect(id)}
          />
        ))
      )}
    </div>
  );
}
