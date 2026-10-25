import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_NO_ASSOCIATION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_OFF_DIAGRAM_TARGET_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";

const DROP_GATE_REASON_LABELS: Readonly<Record<string, string>> = {
  collocation:
    "Resource-group collocation only. This diagram left it off. It is not a stored connection.",
  "mode-filter": "In the snapshot, and left off this diagram mode.",
  "below-minimum-weight": "Stored below the diagram weight cutoff, and left off this diagram.",
  "endpoint-peeled-or-hidden": "A subnet on this relationship is not drawn on this diagram.",
  "nsg-unattached": GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_NO_ASSOCIATION_LABEL,
  "nsg-unattached-no-association": GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_NO_ASSOCIATION_LABEL,
  "nsg-unattached-off-diagram": GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_OFF_DIAGRAM_TARGET_LABEL,
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
