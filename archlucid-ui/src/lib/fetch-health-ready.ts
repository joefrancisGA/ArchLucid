import type { HealthReadyResponse } from "@/lib/health-dashboard-types";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Anonymous readiness summary (`GET /health/ready` via the UI proxy). */
export async function fetchHealthReadySummary(): Promise<HealthReadyResponse | null> {
  try {
    const res = await fetch(
      "/api/proxy/health/ready",
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    );

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as HealthReadyResponse;
  } catch {
    return null;
  }
}
