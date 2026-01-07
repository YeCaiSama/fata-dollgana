export const runtime = "nodejs";

import { BUCKET, dataUrlToBuffer, extFromMime, isDataUrl, supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  dollName: string;
  authorLabel: string;
  whisper: string;

  // 仍然由前端传 dataURL（服务端负责上传成 URL）
  thumbDataUrl: string;
  wioPreviewDataUrl: string;

  // WIO1 bytes base64
  wioBase64: string;
};

async function uploadDataUrlToStorage(path: string, dataUrl: string) {
  const sb = supabaseAdmin();
  const { mime, buf } = dataUrlToBuffer(dataUrl);

  const { error } = await sb.storage.from(BUCKET).upload(path, buf, {
    contentType: mime,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body?.wioBase64) return new Response("Missing wioBase64", { status: 400 });
  if (!body?.thumbDataUrl || !body?.wioPreviewDataUrl) return new Response("Missing images", { status: 400 });

  const sb = supabaseAdmin();

  // upload images (if dataUrl)
  const now = Date.now();
  const safeName = (body.dollName || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
  const basePath = `archive/${now}-${safeName}`;

  let thumbUrl = body.thumbDataUrl;
  let wioPreviewUrl = body.wioPreviewDataUrl;

  if (isDataUrl(body.thumbDataUrl)) {
    const { mime } = dataUrlToBuffer(body.thumbDataUrl);
    const ext = extFromMime(mime);
    thumbUrl = await uploadDataUrlToStorage(`${basePath}-clear.${ext}`, body.thumbDataUrl);
  }

  if (isDataUrl(body.wioPreviewDataUrl)) {
    const { mime } = dataUrlToBuffer(body.wioPreviewDataUrl);
    const ext = extFromMime(mime);
    wioPreviewUrl = await uploadDataUrlToStorage(`${basePath}-wio.${ext}`, body.wioPreviewDataUrl);
  }

  const insert = {
    doll_name: body.dollName?.trim() || "Untitled Doll",
    author_label: body.authorLabel?.trim() || "Anonymous",
    whisper: body.whisper?.trim() || "I will remember you in pixels.",
    thumb_url: thumbUrl,
    wio_preview_url: wioPreviewUrl,
    wio_base64: body.wioBase64,
  };

  const { data, error } = await sb.from("archive_items").insert(insert).select("id").single();
  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true, id: data.id });
}
