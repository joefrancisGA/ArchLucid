import { formatAzureResourceDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import {
  formatInfraEvidenceChangeTypeLabel,
  normalizeInfraEvidenceChangeTypeKey,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import {
  formatInfraEvidenceDriftRiskLabel,
  resolveInfraEvidenceDriftRiskKey,
  type InfraEvidenceDriftRiskKey,
} from "@/lib/infra-evidence/infra-evidence-drift-risk-display";
import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import type { DriftTableSortDir, DriftTableSortKey } from "@/lib/infra-evidence/infra-evidence-drift-table-filter";
import { normalizeFindingSeverity } from "@/lib/design-tokens";

export type InfraEvidenceDriftResourceChangeGroup = {
  groupKey: string;
  changes: InfraEvidenceDiffChange[];
  representativeChange: InfraEvidenceDiffChange;
};

const DRIFT_RISK_RANK: Readonly<Record<string, number>> = {
  critical: 0,
  error: 1,
  elevated: 2,
  high: 3,
  medium: 4,
  warning: 5,
  low: 6,
  info: 7,
  unknown: 8,
  none: 9,
};

function compareStrings(left: string | null | undefined, right: string | null | undefined): number {
  return (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "base" });
}

function driftRiskRank(riskKey: InfraEvidenceDriftRiskKey): number {
  if (riskKey === "none") {
    return DRIFT_RISK_RANK.none;
  }

  if (riskKey === "unknown") {
    return DRIFT_RISK_RANK.unknown;
  }

  const overrideRank = DRIFT_RISK_RANK[riskKey];

  if (overrideRank != null) {
    return overrideRank;
  }

  const severityKind = normalizeFindingSeverity(riskKey);

  return DRIFT_RISK_RANK[severityKind] ?? 50;
}

export function resolveDriftResourceGroupKey(change: InfraEvidenceDiffChange): string {
  const cloudResourceId = change.cloudResourceId?.trim() ?? "";

  if (cloudResourceId.length > 0) {
    return `cloud:${cloudResourceId}`;
  }

  const azureResourceId = change.azureResourceId?.trim() ?? "";

  if (azureResourceId.length > 0) {
    return `azure:${azureResourceId}`;
  }

  return `change:${change.changeId}`;
}

export function pickRepresentativeDriftChange(
  changes: readonly InfraEvidenceDiffChange[],
): InfraEvidenceDiffChange {
  const sorted = [...changes];

  sorted.sort((left, right) => {
    const leftRank = driftRiskRank(resolveInfraEvidenceDriftRiskKey(left.riskClassification));
    const rightRank = driftRiskRank(resolveInfraEvidenceDriftRiskKey(right.riskClassification));

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return compareStrings(left.property, right.property);
  });

  return sorted[0] ?? changes[0];
}

export function buildDriftResourceChangeGroup(
  groupKey: string,
  changes: readonly InfraEvidenceDiffChange[],
): InfraEvidenceDriftResourceChangeGroup {
  const orderedChanges = [...changes];

  return {
    groupKey,
    changes: orderedChanges,
    representativeChange: pickRepresentativeDriftChange(orderedChanges),
  };
}

export function groupDriftChangesByResource(
  rows: readonly InfraEvidenceDiffChange[],
): InfraEvidenceDriftResourceChangeGroup[] {
  const groupsByKey = new Map<string, InfraEvidenceDiffChange[]>();

  for (const row of rows) {
    const groupKey = resolveDriftResourceGroupKey(row);
    const existing = groupsByKey.get(groupKey);

    if (existing != null) {
      existing.push(row);
      continue;
    }

    groupsByKey.set(groupKey, [row]);
  }

  return [...groupsByKey.entries()].map(([groupKey, changes]) => buildDriftResourceChangeGroup(groupKey, changes));
}

export function findDriftResourceChangeGroupByChangeId(
  groups: readonly InfraEvidenceDriftResourceChangeGroup[],
  changeId: string,
): InfraEvidenceDriftResourceChangeGroup | null {
  return groups.find((group) => group.changes.some((change) => change.changeId === changeId)) ?? null;
}

export function summarizeDriftResourceGroupChangeTypes(
  group: InfraEvidenceDriftResourceChangeGroup,
): string {
  if (group.changes.length <= 1) {
    return formatInfraEvidenceChangeTypeLabel(group.representativeChange.changeType);
  }

  const uniqueChangeTypes = new Set(
    group.changes.map((change) => normalizeInfraEvidenceChangeTypeKey(change.changeType)),
  );

  if (uniqueChangeTypes.size === 1) {
    return formatInfraEvidenceChangeTypeLabel(group.representativeChange.changeType);
  }

  return `${group.changes.length} changes`;
}

export function summarizeDriftResourceGroupProperties(
  group: InfraEvidenceDriftResourceChangeGroup,
): string {
  if (group.changes.length <= 1) {
    return group.representativeChange.property ?? "—";
  }

  const uniqueProperties = new Set(
    group.changes
      .map((change) => change.property?.trim() ?? "")
      .filter((property) => property.length > 0),
  );

  if (uniqueProperties.size === 1) {
    return [...uniqueProperties][0] ?? "—";
  }

  if (uniqueProperties.size === 0) {
    return "—";
  }

  return `${uniqueProperties.size} properties`;
}

export function sortDriftResourceChangeGroups(
  groups: readonly InfraEvidenceDriftResourceChangeGroup[],
  sortBy: DriftTableSortKey,
  sortDir: DriftTableSortDir,
): InfraEvidenceDriftResourceChangeGroup[] {
  const direction = sortDir === "desc" ? -1 : 1;
  const sorted = [...groups];

  sorted.sort((left, right) => {
    const leftChange = left.representativeChange;
    const rightChange = right.representativeChange;
    let result = 0;

    switch (sortBy) {
      case "resource":
        result = compareStrings(
          formatAzureResourceDisplay(leftChange.azureResourceId).name,
          formatAzureResourceDisplay(rightChange.azureResourceId).name,
        );
        break;

      case "resourceGroup":
        result = compareStrings(
          formatAzureResourceDisplay(leftChange.azureResourceId).resourceGroup,
          formatAzureResourceDisplay(rightChange.azureResourceId).resourceGroup,
        );
        break;

      case "resourceType":
        result = compareStrings(
          formatAzureResourceDisplay(leftChange.azureResourceId).resourceType,
          formatAzureResourceDisplay(rightChange.azureResourceId).resourceType,
        );
        break;

      case "change":
        result = compareStrings(
          summarizeDriftResourceGroupChangeTypes(left),
          summarizeDriftResourceGroupChangeTypes(right),
        );
        break;

      case "property":
        result = compareStrings(
          summarizeDriftResourceGroupProperties(left),
          summarizeDriftResourceGroupProperties(right),
        );
        break;

      case "risk":
        result = compareStrings(
          formatInfraEvidenceDriftRiskLabel(resolveInfraEvidenceDriftRiskKey(leftChange.riskClassification)),
          formatInfraEvidenceDriftRiskLabel(resolveInfraEvidenceDriftRiskKey(rightChange.riskClassification)),
        );
        break;

      default: {
        const exhaustive: never = sortBy;
        result = exhaustive;
        break;
      }
    }

    return result * direction;
  });

  return sorted;
}
