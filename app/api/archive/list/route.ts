export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("archive_items")
    .select("id, created_at, doll_name, author_label, whisper, thumb_url, wio_preview_url")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return new Response(error.message, { status: 500 });

  // ✅ 兼容你前端已有字段名：thumbDataUrl / wioPreviewDataUrl
  const list = (data || []).map((x) => ({
    id: x.id,
    createdAt: new Date(x.created_at).getTime(),
    dollName: x.doll_name,
    authorLabel: x.author_label,
    whisper: x.whisper,
    thumbDataUrl: x.thumb_url,
    wioPreviewDataUrl: x.wio_preview_url,
  }));

  return Response.json({ ok: true, list });
}
