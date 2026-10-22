import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNATTACHED_NSG_LABEL } from "@/lib/governance/governance-infrastructure-copy";

const DROP_GATE_REASON_LABELS: Readonly<Record<string, string>> = {
  "nsg-unattached": GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNATTACHED_NSG_LABEL,
};

/** Maps ledger drop-gate reason codes to reviewer-facing labels (outline drop rows). */
export function formatInfraEvidenceDiagramDropGateReasonLabel(reason: string): string {
  const trimmed = reason.trim();
  const mapped = DROP_GATE_REASON_LABELS[trimmed];

  if (mapped !== undefined) {
    return mapped;
  }

  if (trimmed.length === 0) {
    return "Drop reason was not stored.";
  }

  return trimmed;
}
