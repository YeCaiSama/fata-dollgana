export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import {
  BUCKET,
  dataUrlToBuffer,
  extFromMime,
  isDataUrl,
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

type Body = {
  dollName: string;
  authorLabel: string;
  whisper: string;
  thumbDataUrl: string;
  wioPreviewDataUrl: string;
  wioBase64: string;
};

// 上传 dataURL 到 Supabase Storage
async function uploadDataUrlToStorage(path: string, dataUrl: string) {
  const sb = supabaseAdmin; // ✅ 正确：client 对象

  const { mime, buffer } = dataUrlToBuffer(dataUrl);

  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  });

  if (error) throw error;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    // -------- 校验 --------
    if (!body.dollName || !body.whisper) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isDataUrl(body.thumbDataUrl) || !isDataUrl(body.wioPreviewDataUrl)) {
      return NextResponse.json(
        { ok: false, error: "Invalid image data" },
        { status: 400 }
      );
    }

    // -------- ID & 路径 --------
    const id = randomUUID();

    const thumbExt = extFromMime(
      body.thumbDataUrl.match(/^data:(.*?);/)?.[1] || ""
    );

    const thumbPath = `thumb/${id}.${thumbExt}`;
    const wioPreviewPath = `wio-preview/${id}.${thumbExt}`;

    // -------- 上传图片 --------
    await uploadDataUrlToStorage(thumbPath, body.thumbDataUrl);
    await uploadDataUrlToStorage(wioPreviewPath, body.wioPreviewDataUrl);

    const thumbUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${thumbPath}`;
    const wioPreviewUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${wioPreviewPath}`;

    // -------- 写数据库 --------
    const { error: insertErr } = await supabaseAdmin
      .from("archive_items")
      .insert({
        id,
        doll_name: body.dollName,
        author_label: body.authorLabel || "Anonymous",
        whisper: body.whisper,
        thumb_url: thumbUrl,
        wio_preview_url: wioPreviewUrl,
        wio_base64: body.wioBase64,
      });

    if (insertErr) throw insertErr;

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    console.error("archive/add error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
