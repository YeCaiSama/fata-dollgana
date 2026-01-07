export const runtime = "nodejs";

declare global {
  // eslint-disable-next-line no-var
  var __FDG_LIST__: any[] | undefined;
  // eslint-disable-next-line no-var
  var __FDG_CURRENT_ID__: string | undefined;
  // eslint-disable-next-line no-var
  var __FDG_CURRENT_VER__: string | undefined;
}

export async function POST() {
  globalThis.__FDG_LIST__ = [];
  globalThis.__FDG_CURRENT_ID__ = undefined;
  globalThis.__FDG_CURRENT_VER__ = undefined;
  return Response.json({ ok: true });
}
