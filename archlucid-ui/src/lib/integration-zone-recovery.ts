import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";

export type IntegrationZoneLoadSlice = {
  readonly id: string;
  readonly label: string;
  readonly failed: boolean;
  readonly errorMessage: string | null;
};

export type IntegrationZoneRecovery = {
  readonly zoneId: string;
  readonly zoneLabel: string;
  readonly presentation: ErrorRecoveryContractPresentation;
};

function formatIntactZoneLabels(labels: readonly string[]): string {
  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

/** Builds a three-part recovery presentation for one failed integration load zone (TB-2388). */
export function buildIntegrationZoneRecovery(
  zone: IntegrationZoneLoadSlice,
  allZones: readonly IntegrationZoneLoadSlice[],
): IntegrationZoneRecovery | null {
  if (!zone.failed) {
    return null;
  }

  const errorDetail = zone.errorMessage?.trim() ?? "An unexpected error occurred.";
  const intactLabels = allZones.filter((slice) => !slice.failed).map((slice) => slice.label);
  const intactSummary = formatIntactZoneLabels(intactLabels);

  const whatIsIntact =
    intactSummary.length > 0
      ? `${intactSummary} loaded successfully and remain available on this page.`
      : "Other sections on this page may still be available after you refresh.";

  return {
    zoneId: zone.id,
    zoneLabel: zone.label,
    presentation: {
      whatFailed: `${zone.label} could not be loaded. ${errorDetail}`,
      whatIsIntact,
      nextStep: `Use Refresh or Retry to load ${zone.label} again. If the error persists, check system health or contact support.`,
    },
  };
}

/** Returns recovery cards for every failed zone in a multi-zone integration page load. */
export function buildIntegrationZoneRecoveries(
  zones: readonly IntegrationZoneLoadSlice[],
): readonly IntegrationZoneRecovery[] {
  return zones
    .map((zone) => buildIntegrationZoneRecovery(zone, zones))
    .filter((recovery): recovery is IntegrationZoneRecovery => recovery !== null);
}
