import { createClient } from "@supabase/supabase-js";

// ====== Env ======
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const BUCKET = process.env.SUPABASE_BUCKET || "fata";

// ====== Supabase admin client (server-only) ======
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ====== Helpers used by upload route (/api/archive/add) ======
export function isDataUrl(s: string) {
  return typeof s === "string" && s.startsWith("data:") && s.includes(";base64,");
}

export function extFromMime(mime: string) {
  const m = (mime || "").toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  // fallback
  return "png";
}

export function dataUrlToBuffer(dataUrl: string) {
  if (!isDataUrl(dataUrl)) throw new Error("Invalid data URL");
  const headerEnd = dataUrl.indexOf(","); // after ...;base64,
  const header = dataUrl.slice(0, headerEnd);
  const b64 = dataUrl.slice(headerEnd + 1);

  // example header: data:image/png;base64
  const mimeMatch = header.match(/^data:(.*?);base64$/);
  const mime = mimeMatch?.[1] || "application/octet-stream";

  return {
    mime,
    buffer: Buffer.from(b64, "base64"),
  };
}
