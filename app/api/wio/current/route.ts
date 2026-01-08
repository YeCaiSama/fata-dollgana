import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/wio/current
 * 返回给 Wio Terminal 的 payload
 */
export async function GET() {
  try {
    // 1) 取 current_companion
    const { data: cur, error: curErr } = await supabaseAdmin
      .from("current_companion")
      .select("item_id, version")
      .eq("id", 1)
      .single();

    if (curErr || !cur || !cur.item_id) {
      return NextResponse.json(
        { ok: false, error: "No current companion set" },
        { status: 404 }
      );
    }

    // 2) 取 archive_items
    const { data: it, error: itErr } = await supabaseAdmin
      .from("archive_items")
      .select(`
        id,
        doll_name,
        whisper,
        wio_base64
      `)
      .eq("id", cur.item_id)
      .single();

    if (itErr || !it) {
      return NextResponse.json(
        { ok: false, error: "Archive item missing" },
        { status: 404 }
      );
    }

    if (!it.wio_base64) {
      return NextResponse.json(
        { ok: false, error: "No wio_base64 data" },
        { status: 500 }
      );
    }

    // 3) 返回给 Wio 的 payload（已经是最终形态）
    return NextResponse.json({
      ok: true,
      version: cur.version,
      id: it.id,
      dollName: it.doll_name,
      whisper: it.whisper,
      w: 128,
      h: 128,
      rgb565_b64: it.wio_base64,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
