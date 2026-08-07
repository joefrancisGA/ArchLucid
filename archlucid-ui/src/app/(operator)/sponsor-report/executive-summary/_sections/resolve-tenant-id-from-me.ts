import { buildAuthMeProxyRequestInit } from "@/lib/current-principal";

const ME_PATH = "/api/proxy/api/auth/me";

export async function resolveTenantIdFromMe(): Promise<string | null> {
  const init = await buildAuthMeProxyRequestInit();
  const res = await fetch(ME_PATH, init);

  if (!res.ok) return null;

  const body: unknown = await res.json();

  if (typeof body !== "object" || body === null || !("claims" in body)) return null;

  const claims = (body as { claims?: ReadonlyArray<{ type: string; value: string }> }).claims;
  const row = claims?.find((c) => c.type === "tenant_id");

  return row?.value?.trim() ?? null;
}
