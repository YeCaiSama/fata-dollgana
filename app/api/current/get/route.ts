export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const sb = supabaseAdmin();

  const cur = await sb.from("current_companion").select("item_id, version").eq("id", 1).single();
  if (cur.error) return new Response(cur.error.message, { status: 500 });

  if (!cur.data.item_id) {
    return Response.json({ ok: true, empty: true, version: cur.data.version });
  }

  const item = await sb
    .from("archive_items")
    .select("id, doll_name, author_label, whisper, wio_base64, wio_preview_url")
    .eq("id", cur.data.item_id)
    .single();

  if (item.error) return new Response(item.error.message, { status: 500 });

  return Response.json({
    ok: true,
    version: cur.data.version,
    item: {
      id: item.data.id,
      dollName: item.data.doll_name,
      authorLabel: item.data.author_label,
      whisper: item.data.whisper,
      wioBase64: item.data.wio_base64,
      wioPreviewUrl: item.data.wio_preview_url,
    },
  });
}
