"use client";
import React, { useMemo, useState } from "react";
import PixelPreview from "./PixelPreview";
import SquareCropper from "./SquareCropper";

function arrayBufferToBase64(buf: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary);
}

/** ✅ 颜色量化：让像素更“拓麻歌子感”（简化色阶） */
function quantizeRgb(r: number, g: number, b: number) {
  // 5-6-5 already happens for Wio, but we want it MORE retro.
  // Use RGB332-ish:
  const rq = (r >> 5) << 5;
  const gq = (g >> 5) << 5;
  const bq = (b >> 6) << 6;
  return { r: rq, g: gq, b: bq };
}

/** ✅ 从裁剪后的“清晰”正方形 canvas 生成：
 * 1) 网站清晰图 thumbDataUrl（512）
 * 2) Wio 像素预览图 wioPreviewDataUrl（128，但由低分辨率放大）
 * 3) Wio 二进制 WIO1（128x128 RGB565）
 */
function makeOutputsFromCropped(crop: HTMLCanvasElement) {
  // website: crisp square
  const web = document.createElement("canvas");
  web.width = 512;
  web.height = 512;
  const wctx = web.getContext("2d")!;
  wctx.drawImage(crop, 0, 0, web.width, web.height);
  const thumbDataUrl = web.toDataURL("image/jpeg", 0.92);

  // wio pixel: tamagotchi feel
  // step1: downsample to low-res (e.g. 64)
  const low = document.createElement("canvas");
  low.width = 64;
  low.height = 64;
  const lctx = low.getContext("2d")!;
  lctx.imageSmoothingEnabled = true;
  lctx.drawImage(crop, 0, 0, low.width, low.height);

  // apply quantization
  const img = lctx.getImageData(0, 0, low.width, low.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const q = quantizeRgb(d[i], d[i + 1], d[i + 2]);
    d[i] = q.r; d[i + 1] = q.g; d[i + 2] = q.b;
  }
  lctx.putImageData(img, 0, 0);

  // step2: scale up to 128 with nearest-neighbor
  const wioCanvas = document.createElement("canvas");
  wioCanvas.width = 128;
  wioCanvas.height = 128;
  const pctx = wioCanvas.getContext("2d")!;
  pctx.imageSmoothingEnabled = false;
  pctx.drawImage(low, 0, 0, 128, 128);
  const wioPreviewDataUrl = wioCanvas.toDataURL("image/png");

  // build WIO1 bytes (RGB565)
  const rgba = pctx.getImageData(0, 0, 128, 128).data;
  const payload = new Uint8Array(128 * 128 * 2);
  let p = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const v = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
    payload[p++] = v & 0xff;
    payload[p++] = (v >> 8) & 0xff;
  }

  const header = new Uint8Array(13);
  header[0] = 0x57; header[1] = 0x49; header[2] = 0x4f; header[3] = 0x31; // WIO1
  header[4] = 128; header[5] = 0;
  header[6] = 128; header[7] = 0;
  header[8] = 1; // format RGB565
  const len = payload.length;
  header[9] = len & 0xff;
  header[10] = (len >> 8) & 0xff;
  header[11] = (len >> 16) & 0xff;
  header[12] = (len >> 24) & 0xff;

  const out = new Uint8Array(header.length + payload.length);
  out.set(header, 0);
  out.set(payload, header.length);

  return {
    thumbDataUrl,
    wioPreviewDataUrl,
    wioBytes: out,
  };
}

export default function UploadStoryModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  // step: 1 choose -> 1.5 crop -> 2 metadata -> 3 confirm
  const [step, setStep] = useState<1 | 15 | 2 | 3>(1);

  const [file, setFile] = useState<File | null>(null);

  const [anonymous, setAnonymous] = useState(true);
  const [curatorName, setCuratorName] = useState("");
  const [dollName, setDollName] = useState("");
  const [whisper, setWhisper] = useState("");

  const [thumbDataUrl, setThumbDataUrl] = useState<string>("");
  const [wioPreviewDataUrl, setWioPreviewDataUrl] = useState<string>("");
  const [wioB64, setWioB64] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("Choose a photo. We will frame it into a square—like a museum label finding its border.");

  const authorLabel = useMemo(() => {
    return anonymous || !curatorName.trim()
      ? "Anonymous"
      : `Curator: ${curatorName.trim()}`;
  }, [anonymous, curatorName]);

  async function submit() {
    if (!wioB64 || !thumbDataUrl || !wioPreviewDataUrl) return;
    setBusy(true);
    setNote("Placing your exhibit on the public wall…");
    try {
      const body = {
        dollName: dollName.trim() || "Untitled Doll",
        authorLabel,
        whisper: whisper.trim() || "I will remember you in pixels.",
        thumbDataUrl,          // ✅ clear
        wioPreviewDataUrl,     // ✅ pixel preview
        wioBase64: wioB64,     // ✅ WIO1 bytes
      };

      const r = await fetch("/api/archive/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error(await r.text());

      onUploaded();
      setTimeout(onClose, 250);
    } catch {
      setNote("Could not place the exhibit yet. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modalTop">
          <div className="t">A small ceremony</div>
          <button className="iconBtn" onClick={onClose}>Close</button>
        </div>

        <div className="modalBody">
          <div className="story">
            <div style={{ fontSize: 13.5, opacity: 0.88, lineHeight: 1.65 }}>
              <b>
                Step {step === 15 ? 2 : step === 3 ? 3 : step === 2 ? 2 : 1} of 3.
              </b>{" "}
              {note}
            </div>

            {/* STEP 1: choose */}
            {step === 1 && (
              <div className="field">
                <div className="label">Bring a doll into the hall</div>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setFile(f);
                    setNote("Now, crop it into a square frame. A gentle border, a clear center.");
                    setStep(15);
                  }}
                />
                <div className="smallHint">
                  This archive is public. Please upload only what you’re comfortable sharing.
                </div>
              </div>
            )}

            {/* STEP 1.5: crop */}
            {step === 15 && file && (
              <div className="field">
                <div className="label">Square crop</div>
                <SquareCropper
                  file={file}
                  onCancel={() => {
                    setFile(null);
                    setStep(1);
                    setNote("Choose a photo. We will frame it into a square—like a museum label finding its border.");
                  }}
                  onConfirm={(cropCanvas) => {
                    const outputs = makeOutputsFromCropped(cropCanvas);
                    setThumbDataUrl(outputs.thumbDataUrl);
                    setWioPreviewDataUrl(outputs.wioPreviewDataUrl);
                    setWioB64(arrayBufferToBase64(outputs.wioBytes.buffer));
                    setNote("A new exhibit is almost ready. Give it a name—if you wish.");
                    setStep(2);
                  }}
                />
              </div>
            )}

            {/* STEP 2: metadata */}
            {step === 2 && (
              <>
                <div className="field">
                  <div className="label">Do you wish to sign your name?</div>
                  <div className="row">
                    <div className={"pill " + (anonymous ? "pillOn" : "")} onClick={() => setAnonymous(true)}>
                      Anonymous
                    </div>
                    <div className={"pill " + (!anonymous ? "pillOn" : "")} onClick={() => setAnonymous(false)}>
                      I’ll leave a name
                    </div>
                  </div>
                </div>

                {!anonymous && (
                  <div className="field">
                    <div className="label">Your name (as the Curator)</div>
                    <input
                      className="input"
                      value={curatorName}
                      onChange={(e) => setCuratorName(e.target.value)}
                      placeholder="e.g., Mira"
                    />
                  </div>
                )}

                <div className="field">
                  <div className="label">Name your doll</div>
                  <input
                    className="input"
                    value={dollName}
                    onChange={(e) => setDollName(e.target.value)}
                    placeholder="e.g., Little Starkeeper"
                  />
                </div>

                <div className="field">
                  <div className="label">One line it carries (a whisper)</div>
                  <textarea
                    className="textarea"
                    value={whisper}
                    onChange={(e) => setWhisper(e.target.value)}
                    placeholder='e.g., "Even when you look away, I’m still here."'
                  />
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="iconBtn" onClick={() => setStep(15)} disabled={busy}>
                    Re-crop
                  </button>
                  <button className="primary" onClick={() => { setStep(3); setNote("Read the label once more—then place it on the wall."); }} disabled={!thumbDataUrl || busy}>
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: confirm */}
            {step === 3 && (
              <>
                <div className="field">
                  <div className="label">Final label</div>
                  <div className="previewBox">
                    <div style={{ fontSize: 14, lineHeight: 1.65 }}>
                      <b>{dollName.trim() || "Untitled Doll"}</b>
                      <div style={{ opacity: 0.75, marginTop: 6 }}>{authorLabel}</div>
                      <div style={{ marginTop: 10, opacity: 0.92 }}>
                        “{whisper.trim() || "I will remember you in pixels."}”
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row" style={{ marginTop: 12 }}>
                  <button className="iconBtn" onClick={() => setStep(2)} disabled={busy}>Back</button>
                  <button className="primary" onClick={submit} disabled={busy}>
                    Place it on the public wall
                  </button>
                </div>
              </>
            )}
          </div>

          {/* right preview */}
          <div className="side">
            <div className="previewBox">
              <div className="previewTitle">Gallery preview (clear)</div>
              {thumbDataUrl ? (
                <img
                  src={thumbDataUrl}
                  alt="gallery preview"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.28)",
                  }}
                />
              ) : (
                <div className="smallHint">No preview yet.</div>
              )}

              <div className="smallHint">
                The website keeps it clear.
                <br />
                The Wio Terminal receives a pixel relic (Tamagotchi-like).
              </div>

              {wioPreviewDataUrl && (
                <div style={{ marginTop: 12 }}>
                  <div className="previewTitle">Wio preview (pixel relic)</div>
                  <PixelPreview dataUrl={wioPreviewDataUrl} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
