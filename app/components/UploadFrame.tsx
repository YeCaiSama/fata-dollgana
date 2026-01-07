"use client";
import React, { useState } from "react";

export default function UploadFrame({ onOpen }: { onOpen: () => void }) {
  const [bounce, setBounce] = useState(false);

  function click() {
    setBounce(true);
    setTimeout(() => setBounce(false), 220);
    onOpen();
  }

  return (
    <div
      className="woodFrame"
      onClick={click}
      style={{ transform: bounce ? "translateY(-2px) scale(1.01)" : undefined }}
      title="Place a new exhibit"
    >
      <div className="framePulse" />
      <div className="frameTitle">Wooden Frame • Place a new exhibit</div>
      <div className="frameText">
        Tap to bring a beloved doll into the hall.
        We will soften it into pixels—like a memory that learned to glow.
      </div>
    </div>
  );
}
