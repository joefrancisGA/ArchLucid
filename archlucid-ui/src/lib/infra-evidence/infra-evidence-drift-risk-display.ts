import { formatInfraEvidenceChangeTypeLabel } from "@/lib/infra-evidence/infra-evidence-drift-display";
import type { InfraEvidenceDiffChange, InfraEvidenceDiffSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { SEVERITY_LABELS, normalizeFindingSeverity } from "@/lib/design-tokens";

export type InfraEvidenceDriftRiskKey = "none" | "unknown" | string;

const DRIFT_RISK_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  elevated: "Elevated",
};

export function isComparingTwoInventorySnapshots(
  diff: InfraEvidenceDiffSummary | null | undefined,
): boolean {
  if (diff == null) {
    return false;
  }

  const snapshotAId = diff.snapshotAId.trim();
  const snapshotBId = diff.snapshotBId.trim();

  return snapshotAId.length > 0 && snapshotBId.length > 0 && snapshotAId !== snapshotBId;
}

export function resolveInfraEvidenceDriftRiskKey(
  raw: string | null | undefined,
): InfraEvidenceDriftRiskKey {
  const trimmed = (raw ?? "").trim();

  if (trimmed.length === 0) {
    return "none";
  }

  const normalized = trimmed.toLowerCase();

  if (normalized === "none") {
    return "none";
  }

  if (normalized === "unknown") {
    return "unknown";
  }

  return normalized;
}

export function formatInfraEvidenceDriftRiskLabel(riskKey: InfraEvidenceDriftRiskKey): string {
  if (riskKey === "none") {
    return "None";
  }

  if (riskKey === "unknown") {
    return "Unknown";
  }

  const override = DRIFT_RISK_LABEL_OVERRIDES[riskKey];

  if (override != null) {
    return override;
  }

  const severityKind = normalizeFindingSeverity(riskKey);

  if (severityKind !== "unknown") {
    return SEVERITY_LABELS[severityKind];
  }

  return riskKey
    .split(/[\s_-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isInfraEvidenceDriftRiskTooltipEligible(riskKey: InfraEvidenceDriftRiskKey): boolean {
  return riskKey !== "none" && riskKey !== "unknown";
}

export function isInfraEvidenceDriftRiskyChange(riskClassification: string | null | undefined): boolean {
  const riskKey = resolveInfraEvidenceDriftRiskKey(riskClassification);

  return isInfraEvidenceDriftRiskTooltipEligible(riskKey);
}

function humanizeSignificanceToken(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildInfraEvidenceDriftRiskTooltip(
  change: Pick<
    InfraEvidenceDiffChange,
    "riskClassification" | "securitySignificance" | "architectureSignificance" | "changeType" | "property"
  >,
): string {
  const riskKey = resolveInfraEvidenceDriftRiskKey(change.riskClassification);
  const lines: string[] = [`${formatInfraEvidenceDriftRiskLabel(riskKey)} risk`];
  const securitySignificance = change.securitySignificance?.trim() ?? "";

  if (securitySignificance.length > 0) {
    lines.push(`Security significance: ${humanizeSignificanceToken(securitySignificance)}`);
  }

  const architectureSignificance = change.architectureSignificance?.trim() ?? "";

  if (architectureSignificance.length > 0) {
    lines.push(`Architecture significance: ${humanizeSignificanceToken(architectureSignificance)}`);
  }

  const changeLabel = formatInfraEvidenceChangeTypeLabel(change.changeType);
  const property = change.property?.trim() ?? "";

  if (property.length > 0) {
    lines.push(`${changeLabel} · ${property}`);
  }
  else {
    lines.push(changeLabel);
  }

  return lines.join("\n");
}
