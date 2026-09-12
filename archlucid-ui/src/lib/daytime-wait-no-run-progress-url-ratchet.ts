import { DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT } from "@/lib/daytime-wait-adr-inventory";

/** DW-014 — scan roots that must not invent GET /v1/runs/{runId}/progress. */
export const DAYTIME_WAIT_NO_RUN_PROGRESS_URL_SCAN_ROOTS = [
  "archlucid-ui/src/lib/api",
  "archlucid-ui/src/lib/operations",
] as const;

export function assertDaytimeWaitNoForbiddenRunProgressUrl(source: string): void {
  const normalized = source.replace(/\{id\}/g, "{runId}");

  if (normalized.includes(DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT)) {
    throw new Error(
      `Forbidden run progress URL fragment: ${DAYTIME_WAIT_FORBIDDEN_RUN_PROGRESS_URL_FRAGMENT}`,
    );
  }

  if (/\/v1\/runs\/[^/]+\/progress/.test(source)) {
    throw new Error("Forbidden run progress URL pattern under /v1/runs/*/progress");
  }
}
