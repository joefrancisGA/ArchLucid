import { normalizeInfraEvidenceSubscriptionId } from "@/lib/infra-evidence/infra-evidence-drift-subscription-scope";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { resolveInfraEvidenceSnapshotSubscriptionLabel } from "@/lib/infra-evidence/infra-evidence-drift-subscription-scope";

export const INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL = "all";

export type InfraDiagramsSubscriptionFilterOption = {
  readonly value: string;
  readonly label: string;
};

type InfraEvidenceSnapshotSummaryWire = InfraEvidenceSnapshotSummary & {
  readonly architectureDisplayName?: string | null;
};

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

/** Maps API snapshot rows to UI summaries, including optional architecture display name. */
export function normalizeInfraEvidenceDiagramsSnapshotSummaries(
  items: readonly InfraEvidenceSnapshotSummaryWire[],
): InfraEvidenceSnapshotSummary[] {
  return items.map((item) => ({
    snapshotId: item.snapshotId,
    subscriptionId: item.subscriptionId,
    subscriptionName: item.subscriptionName,
    capturedUtc: item.capturedUtc,
    captureStatus: item.captureStatus,
    resourceCount: item.resourceCount,
    relationshipCount: item.relationshipCount,
    architectureName: item.architectureName ?? item.architectureDisplayName ?? null,
  }));
}

export function resolveInfraDiagramsSnapshotArchitectureSortLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const architectureName = snapshot.architectureName?.trim() ?? "";

  return architectureName;
}

export function sortInfraDiagramsSnapshotsForPicker(
  rows: readonly InfraEvidenceSnapshotSummary[],
): InfraEvidenceSnapshotSummary[] {
  const sorted = [...rows];

  sorted.sort((left, right) => {
    const architectureCompare = compareStrings(
      resolveInfraDiagramsSnapshotArchitectureSortLabel(right),
      resolveInfraDiagramsSnapshotArchitectureSortLabel(left),
    );

    if (architectureCompare !== 0) {
      return architectureCompare;
    }

    return compareStrings(right.capturedUtc ?? "", left.capturedUtc ?? "");
  });

  return sorted;
}

export function buildInfraDiagramsSubscriptionFilterOptions(
  rows: readonly InfraEvidenceSnapshotSummary[],
): InfraDiagramsSubscriptionFilterOption[] {
  const bySubscriptionId = new Map<string, InfraDiagramsSubscriptionFilterOption>();

  for (const row of rows) {
    const subscriptionId = normalizeInfraEvidenceSubscriptionId(row.subscriptionId);

    if (subscriptionId == null) {
      continue;
    }

    if (bySubscriptionId.has(subscriptionId)) {
      continue;
    }

    bySubscriptionId.set(subscriptionId, {
      value: subscriptionId,
      label: resolveInfraEvidenceSnapshotSubscriptionLabel(row),
    });
  }

  const subscriptionOptions = [...bySubscriptionId.values()].sort((left, right) =>
    compareStrings(left.label, right.label),
  );

  return [
    { value: INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL, label: "All" },
    ...subscriptionOptions,
  ];
}

export function filterInfraDiagramsSnapshotsBySubscription(
  rows: readonly InfraEvidenceSnapshotSummary[],
  subscriptionFilter: string,
): InfraEvidenceSnapshotSummary[] {
  const trimmedFilter = subscriptionFilter.trim();

  if (trimmedFilter.length === 0 || trimmedFilter === INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL) {
    return [...rows];
  }

  const normalizedFilter = normalizeInfraEvidenceSubscriptionId(trimmedFilter);

  if (normalizedFilter == null) {
    return [...rows];
  }

  return rows.filter((row) => normalizeInfraEvidenceSubscriptionId(row.subscriptionId) === normalizedFilter);
}

export function resolveInfraDiagramsSubscriptionFilterForSnapshot(
  snapshot: InfraEvidenceSnapshotSummary | null | undefined,
): string {
  if (snapshot == null) {
    return INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL;
  }

  const subscriptionId = normalizeInfraEvidenceSubscriptionId(snapshot.subscriptionId);

  return subscriptionId ?? INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL;
}
