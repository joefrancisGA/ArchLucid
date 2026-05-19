import { HEALTH_LIVE_PATH } from "@/lib/health-endpoint-paths";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type HealthLiveResponse = {
  status?: string;
};

/** Anonymous liveness (`GET /health/live` via the UI proxy). */
export async function fetchHealthLive(): Promise<{ ok: boolean; body: HealthLiveResponse | null }> {
  try {
    const res = await fetch(
      HEALTH_LIVE_PATH,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    );

    if (!res.ok) {
      return { ok: false, body: null };
    }

    try {
      return { ok: true, body: (await res.json()) as HealthLiveResponse };
    } catch {
      return { ok: true, body: null };
    }
  } catch {
    return { ok: false, body: null };
  }
}
