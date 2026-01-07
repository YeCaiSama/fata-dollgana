export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return new Response("Missing id", { status: 400 });

  const sb = supabaseAdmin();

  // ensure item exists
  const check = await sb.from("archive_items").select("id").eq("id", id).single();
  if (check.error) return new Response("Not found", { status: 404 });

  const version = Date.now();

  const { error } = await sb
    .from("current_companion")
    .upsert({ id: 1, item_id: id, version }, { onConflict: "id" });

  if (error) return new Response(error.message, { status: 500 });

  return Response.json({ ok: true, version });
}
