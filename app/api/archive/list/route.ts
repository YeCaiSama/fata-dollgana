export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const sb = supabaseAdmin; // ✅ client 对象（不加括号）

    const { data, error } = await sb
      .from("archive_items")
      .select(
        "id, created_at, doll_name, author_label, whisper, thumb_url, wio_preview_url"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    console.error("archive/list error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
