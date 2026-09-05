import type { AuditEvaluationOutcome, AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export type AuditLineageCheckboxPresentation = {
  kind: EnterpriseStatusKind;
  label: string;
  detail: string;
};

export function auditEvaluationOutcomeLabel(outcome: AuditEvaluationOutcome | undefined): string {
  switch (outcome) {
    case "TechnicallySupported":
      return "Technically supported";
    case "TechnicallyNotSupported":
      return "Technically not supported";
    case "InsufficientEvidence":
      return "Insufficient evidence";
    default:
      return "Unknown outcome";
  }
}

export function deriveAuditLineageCheckboxPresentation(
  lineage: AuditEvidenceLineageRecord,
): AuditLineageCheckboxPresentation {
  if (lineage.readyForPositiveCheckbox) {
    return {
      kind: "ready",
      label: "Supported",
      detail: "Chain of custody is complete — positive checkbox is allowed.",
    };
  }

  if ((lineage.brokenLinkReasons?.length ?? 0) > 0) {
    return {
      kind: "needs-attention",
      label: "Broken chain",
      detail: lineage.brokenLinkReasons!.join(" · "),
    };
  }

  if (lineage.evaluation?.outcome === "InsufficientEvidence") {
    return {
      kind: "needs-attention",
      label: "Insufficient evidence",
      detail: "Evaluation did not reach technical support.",
    };
  }

  return {
    kind: "neutral",
    label: "Not ready",
    detail: "Evidence chain is incomplete or snapshot hash is unverified.",
  };
}

export function collectBrokenEvidenceLinkKinds(lineage: AuditEvidenceLineageRecord): string[] {
  const kinds = new Set<string>();

  for (const chain of lineage.requirementChains ?? []) {
    for (const evidence of chain.evidence ?? []) {
      for (const kind of evidence.missingLinkKinds ?? []) {
        kinds.add(kind);
      }

      if (!evidence.itemHashVerified) {
        kinds.add("EvidenceHash");
      }

      if (!evidence.linkComplete) {
        kinds.add("LinkIncomplete");
      }
    }
  }

  return [...kinds];
}
