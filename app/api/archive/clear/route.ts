// app/api/archive/clear/route.ts
export const runtime = "nodejs";

import { BUCKET, supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    // 1) 先把 current 清掉（避免 Wio 指向已删除的 item）
    const { error: curErr } = await supabaseAdmin
      .from("current_companion")
      .update({ item_id: null, version: Date.now() })
      .eq("id", 1);

    if (curErr) throw curErr;

    // 2) 查出所有 items（用于删除 storage 文件）
    const { data: items, error: listErr } = await supabaseAdmin
      .from("archive_items")
      .select("id, thumb_url, wio_preview_url");

    if (listErr) throw listErr;

    // 3) 删除表中所有行（PostgREST 需要带 filter）
    const { error: delErr } = await supabaseAdmin
      .from("archive_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (delErr) throw delErr;

    // 4) （可选）删除 storage 对象（thumb + wio-preview）
    const paths: string[] = [];
    for (const it of items ?? []) {
      for (const u of [it.thumb_url, it.wio_preview_url]) {
        if (!u || typeof u !== "string") continue;
        const p = extractStoragePath(u, BUCKET);
        if (p) paths.push(p);
      }
    }

    const unique = Array.from(new Set(paths));

    if (unique.length) {
      const CHUNK = 100;
      for (let i = 0; i < unique.length; i += CHUNK) {
        const batch = unique.slice(i, i + CHUNK);
        const { error: rmErr } = await supabaseAdmin.storage.from(BUCKET).remove(batch);
        if (rmErr) {
          // 不阻断主流程：数据库已清空，storage 失败最多就是留下一点“孤儿文件”
          console.warn("storage remove error:", rmErr);
        }
      }
    }

    return Response.json({
      ok: true,
      deletedRows: items?.length ?? 0,
      removedFiles: unique.length,
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  // 典型 public url:
  // https://xxxx.supabase.co/storage/v1/object/public/<bucket>/<path>
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.substring(idx + marker.length);
}
