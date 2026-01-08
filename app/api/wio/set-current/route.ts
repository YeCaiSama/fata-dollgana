import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const itemId = String(body?.itemId || "").trim();
  if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

  // 建议 current 表只存一行 id=1
  const { error } = await supabase
    .from("current")
    .upsert({ id: 1, item_id: itemId, updated_at: new Date().toISOString() }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
