import { normalizePostureToken } from "./caiq-sig-posture-counts";

export type CaiqSigEvidenceSegmentKind = "evidence" | "gap" | "body";

export type CaiqSigEvidenceSegment = {
  readonly kind: CaiqSigEvidenceSegmentKind;
  readonly text: string;
};

export type CaiqSigEvidenceAffordanceKind = "linked-artifact" | "inherited-provider" | "nda-on-request" | "prose-only";

export type CaiqSigEvidenceAffordance = {
  readonly kind: CaiqSigEvidenceAffordanceKind;
  readonly qualifier: string;
};

export const CAIQ_SIG_EVIDENCE_DISCLOSURE_WORD_LIMIT = 40 as const;

function hasLinkedArtifactHref(text: string): boolean {
  const linkTargets = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1] ?? "");

  return linkTargets.some(
    (target) =>
      /\/help\//i.test(target) ||
      /\/trust\b/i.test(target) ||
      /^https?:\/\//i.test(target),
  );
}

export function countWordsInCaiqSigEvidenceText(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function parseCaiqSigEvidenceSegments(evidenceMarkdown: string): readonly CaiqSigEvidenceSegment[] {
  const trimmed = evidenceMarkdown.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const gapMarker = /\*\*Gap\s*\/\s*next step:\*\*/i;
  const evidenceMarker = /\*\*Evidence:\*\*/i;

  if (!gapMarker.test(trimmed) && !evidenceMarker.test(trimmed)) {
    return [{ kind: "body", text: trimmed }];
  }

  const segments: CaiqSigEvidenceSegment[] = [];
  let remainder = trimmed;

  const evidenceSplit = remainder.split(evidenceMarker);

  if (evidenceSplit.length > 1) {
    const beforeEvidence = evidenceSplit[0]?.trim() ?? "";

    if (beforeEvidence.length > 0) {
      segments.push({ kind: "body", text: beforeEvidence });
    }

    remainder = evidenceSplit.slice(1).join("**Evidence:**").trim();
  }

  const gapSplit = remainder.split(gapMarker);

  if (gapSplit.length > 1) {
    const evidenceBody = gapSplit[0]?.trim() ?? "";

    if (evidenceBody.length > 0) {
      segments.push({ kind: "evidence", text: evidenceBody });
    }

    const gapBody = gapSplit.slice(1).join("**Gap / next step:**").trim();

    if (gapBody.length > 0) {
      segments.push({ kind: "gap", text: gapBody });
    }
  } else if (remainder.length > 0) {
    segments.push({ kind: evidenceMarker.test(trimmed) ? "evidence" : "body", text: remainder });
  }

  return segments.length > 0 ? segments : [{ kind: "body", text: trimmed }];
}

export function resolveCaiqSigEvidenceAffordance(
  evidenceCell: string,
  statusCell?: string,
): CaiqSigEvidenceAffordance {
  const trimmed = evidenceCell.trim();
  const statusNormalized = statusCell !== undefined ? normalizePostureToken(statusCell) : null;

  if (statusNormalized === "Inherited") {
    return {
      kind: "inherited-provider",
      qualifier: "Inherited from cloud provider",
    };
  }

  if (/nda|under request|on request/i.test(trimmed)) {
    return {
      kind: "nda-on-request",
      qualifier: "Available under NDA on request",
    };
  }

  if (hasLinkedArtifactHref(trimmed)) {
    return {
      kind: "linked-artifact",
      qualifier: "Linked in-app artifact",
    };
  }

  return {
    kind: "prose-only",
    qualifier: "Assertion without in-app link",
  };
}
