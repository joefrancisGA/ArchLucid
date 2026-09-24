import type { AuditEvaluationOutcome, AuditEvidenceLineageRecord } from "@/lib/audit-evidence-lineage-types";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { formatIsoUtcForDisplay, parseIsoUtcMs } from "@/lib/format-iso-utc";

export type AuditLineageCheckboxPresentation = {
  kind: EnterpriseStatusKind;
  label: string;
  detail: string;
};

export function auditEvaluationOutcomeStatusKind(
  outcome: AuditEvaluationOutcome | undefined,
): EnterpriseStatusKind {
  switch (outcome) {
    case "TechnicallySupported":
      return "ready";
    case "TechnicallyNotSupported":
      return "blocked";
    case "InsufficientEvidence":
      return "needs-attention";
    default:
      return "neutral";
  }
}

export function humanizeAuditEvidenceLinkKind(kind: string): string {
  const trimmed = kind.trim();

  if (trimmed.length === 0) {
    return "Unknown link kind";
  }

  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\bApi\b/g, "API")
    .replace(/\bBlob\b/g, "blob")
    .trim();
}

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
      detail:
        "Chain of custody is complete — downstream attestation may record this control as supported.",
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

export function countEvidenceHashVerification(lineage: AuditEvidenceLineageRecord): {
  verifiedCount: number;
  totalCount: number;
} {
  let verifiedCount = 0;
  let totalCount = 0;

  for (const chain of lineage.requirementChains ?? []) {
    for (const evidence of chain.evidence ?? []) {
      totalCount += 1;

      if (evidence.itemHashVerified) {
        verifiedCount += 1;
      }
    }
  }

  return { verifiedCount, totalCount };
}

export function formatEvidenceHashVerificationSummary(lineage: AuditEvidenceLineageRecord): string {
  const { verifiedCount, totalCount } = countEvidenceHashVerification(lineage);

  if (totalCount === 0) {
    return "No evidence rows to verify in this snapshot";
  }

  return `${verifiedCount}/${totalCount} evidence hashes verified`;
}

export function resolveLatestCollectedUtc(lineage: AuditEvidenceLineageRecord): string | null {
  let latestMs = Number.NaN;
  let latestIso: string | null = null;

  for (const chain of lineage.requirementChains ?? []) {
    for (const evidence of chain.evidence ?? []) {
      const collected = evidence.collectedUtc?.trim();

      if (collected === undefined || collected.length === 0) {
        continue;
      }

      const ms = parseIsoUtcMs(collected);

      if (Number.isNaN(ms)) {
        continue;
      }

      if (Number.isNaN(latestMs) || ms > latestMs) {
        latestMs = ms;
        latestIso = collected;
      }
    }
  }

  return latestIso;
}

export function formatAuditLineageEvaluationContext(lineage: AuditEvidenceLineageRecord): string {
  const outcomeLabel = lineage.evaluation?.outcome
    ? auditEvaluationOutcomeLabel(lineage.evaluation.outcome)
    : "Evaluation unavailable";
  const latestUtc = resolveLatestCollectedUtc(lineage);
  const latestLabel = latestUtc
    ? formatIsoUtcForDisplay(latestUtc)
    : "no collected evidence timestamps in this snapshot";

  return `${outcomeLabel} · Latest evidence collected ${latestLabel}`;
}

export function countAuditEvidenceLineageSummary(lineage: AuditEvidenceLineageRecord): {
  requirementCount: number;
  evidenceCount: number;
} {
  const requirementChains = lineage.requirementChains ?? [];
  const evidenceCount = requirementChains.reduce(
    (total, chain) => total + (chain.evidence?.length ?? 0),
    0,
  );

  return {
    requirementCount: requirementChains.length,
    evidenceCount,
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
