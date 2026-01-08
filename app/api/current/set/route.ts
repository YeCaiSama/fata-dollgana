import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/current/set
 * body: { id: uuid }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const itemId = String(body?.id || "").trim();

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "Missing item id" },
        { status: 400 }
      );
    }

    // 1) 确认 archive_items 里真的有这个 item
    const { data: item, error: itemErr } = await supabaseAdmin
      .from("archive_items")
      .select("id")
      .eq("id", itemId)
      .single();

    if (itemErr || !item) {
      return NextResponse.json(
        { ok: false, error: "Archive item not found" },
        { status: 404 }
      );
    }

    // 2) 更新 current_companion
    //    - 只更新 id = 1
    //    - version 自增（给 Wio 判断是否需要刷新）
    const { error: updErr } = await supabaseAdmin.rpc(
      "set_current_companion",
      { p_item_id: itemId }
    );

    if (updErr) {
      return NextResponse.json(
        { ok: false, error: updErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
