/** DW-009 — Working UI must not invent authoritative percentComplete on Real execute surfaces. */
export const DAYTIME_WAIT_NO_FAKE_PERCENT_COMPLETE_OWNER = "DW-009" as const;

export const DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY = "percentComplete" as const;

export const DAYTIME_WAIT_NO_FAKE_PERCENT_COMPLETE_SCAN_ROOTS = [
  "archlucid-ui/src/lib/runs",
  "archlucid-ui/src/lib/operations",
  "archlucid-ui/src/components/operations",
] as const;

export function assertDaytimeWaitNoFakePercentComplete(source: string): void {
  if (source.includes(DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY)) {
    throw new Error(
      `Forbidden fake progress property: ${DAYTIME_WAIT_FORBIDDEN_PERCENT_COMPLETE_PROPERTY}`,
    );
  }
}
