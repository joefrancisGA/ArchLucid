import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getAuditEventTypes } from "@/lib/api";

/** Server-hydrated audit shell data; search/export remain client-driven (cookies/proxy + CSV download). */
export type AuditPageServerLoad = {
  readonly eventTypes: string[];
  readonly typesLoadFailure: ApiLoadFailureState | null;
};

export async function loadAuditPageData(): Promise<AuditPageServerLoad> {
  try {
    const eventTypes: string[] = await getAuditEventTypes();

    return { eventTypes, typesLoadFailure: null };
  } catch (e: unknown) {
    return { eventTypes: [], typesLoadFailure: toApiLoadFailure(e) };
  }
}
