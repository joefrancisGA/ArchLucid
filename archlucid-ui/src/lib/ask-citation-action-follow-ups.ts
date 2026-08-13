import type { CitationReference } from "@/types/explanation";

import {
  getFindingDetailHref,
  getFindingEvidenceTraceHref,
  getFindingGovernanceDispositionHref,
} from "@/lib/findings/finding-evidence-navigation";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { ARCHITECTURE_DECISION_LABEL } from "@/lib/usability/canonical-product-terms";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

/** Chip kinds for post-answer Ask citation follow-ups (TB-2219). */
export type AskCitationActionKind = "finding" | "evidence" | "disposition";

export type AskCitationActionFollowUp = {
  readonly kind: AskCitationActionKind;
  readonly label: string;
  readonly href: string;
  /** Stable id used for dedupe and test keys. */
  readonly citationId: string;
};

export type AskCitationGroundingLinkRef = {
  readonly href: string;
  readonly label?: string;
};

/**
 * Citation / Ask reference payload used to build deep-link action chips.
 * Prefer structured {@link CitationReference} when present; Ask `referenced*` string lists are accepted as fallbacks.
 */
export type AskCitationActionFollowUpsInput = {
  readonly runId: string;
  readonly citations?: readonly CitationReference[] | null;
  readonly referencedFindings?: readonly string[] | null;
  readonly referencedDecisions?: readonly string[] | null;
  readonly referencedArtifacts?: readonly string[] | null;
  readonly groundingLinks?: readonly AskCitationGroundingLinkRef[] | null;
};

const FINDING_PATH_RE = /\/findings\/([^/?#]+)(?:\/(evidence-trace|inspect))?/i;

function trimId(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function pushUniqueId(target: string[], id: string): void {
  if (id.length === 0) {
    return;
  }

  if (target.some((existing) => existing.toLowerCase() === id.toLowerCase())) {
    return;
  }

  target.push(id);
}

/** Collects finding ids from CitationReference rows, Ask referencedFindings, and finding deep-links in grounding hrefs. */
export function collectAskCitationFindingIds(input: AskCitationActionFollowUpsInput): readonly string[] {
  const ids: string[] = [];

  for (const citation of input.citations ?? []) {
    if (citation.kind !== "Finding") {
      continue;
    }

    pushUniqueId(ids, trimId(citation.id));
  }

  for (const findingId of input.referencedFindings ?? []) {
    pushUniqueId(ids, trimId(findingId));
  }

  for (const link of input.groundingLinks ?? []) {
    const href = trimId(link.href);

    if (href.length === 0) {
      continue;
    }

    const match = FINDING_PATH_RE.exec(href);

    if (match?.[1] === undefined) {
      continue;
    }

    try {
      pushUniqueId(ids, decodeURIComponent(match[1]));
    } catch {
      pushUniqueId(ids, match[1]);
    }
  }

  return ids;
}

function collectDecisionIds(input: AskCitationActionFollowUpsInput): readonly string[] {
  const ids: string[] = [];

  for (const citation of input.citations ?? []) {
    if (citation.kind !== "DecisionTrace") {
      continue;
    }

    pushUniqueId(ids, trimId(citation.id));
  }

  for (const decisionId of input.referencedDecisions ?? []) {
    pushUniqueId(ids, trimId(decisionId));
  }

  return ids;
}

function hasEvidenceArtifactRefs(input: AskCitationActionFollowUpsInput): boolean {
  for (const citation of input.citations ?? []) {
    if (citation.kind === "EvidenceBundle" || citation.kind === "GraphSnapshot") {
      if (trimId(citation.id).length > 0) {
        return true;
      }
    }
  }

  for (const artifactId of input.referencedArtifacts ?? []) {
    if (trimId(artifactId).length > 0) {
      return true;
    }
  }

  return false;
}

function pushChip(
  chips: AskCitationActionFollowUp[],
  chip: AskCitationActionFollowUp,
): void {
  if (chips.some((existing) => existing.href === chip.href && existing.kind === chip.kind)) {
    return;
  }

  chips.push(chip);
}

/**
 * Builds deep-link action chips from Ask citation / grounding refs.
 * Returns an empty list when run id or actionable citation ids are missing (honest empty — no fabricated chips).
 */
export function buildAskCitationActionFollowUps(
  input: AskCitationActionFollowUpsInput,
): readonly AskCitationActionFollowUp[] {
  const runId = trimId(input.runId);

  if (runId.length === 0) {
    return [];
  }

  const findingIds = collectAskCitationFindingIds(input);
  const decisionIds = collectDecisionIds(input);
  const evidenceArtifacts = hasEvidenceArtifactRefs(input);
  const chips: AskCitationActionFollowUp[] = [];

  for (const findingId of findingIds) {
    pushChip(chips, {
      kind: "finding",
      label: `Open ${BUYER_SURFACE_VOCABULARY.finding.toLowerCase()}`,
      href: getFindingDetailHref(runId, findingId),
      citationId: findingId,
    });
    pushChip(chips, {
      kind: "evidence",
      label: "Open evidence",
      href: getFindingEvidenceTraceHref(runId, findingId),
      citationId: findingId,
    });
    pushChip(chips, {
      kind: "disposition",
      label: "Record disposition",
      href: getFindingGovernanceDispositionHref(runId, findingId),
      citationId: findingId,
    });
  }

  if (findingIds.length === 0 && decisionIds.length > 0) {
    for (const decisionId of decisionIds) {
      pushChip(chips, {
        kind: "disposition",
        label: `Open ${ARCHITECTURE_DECISION_LABEL.toLowerCase()} register`,
        href: GOVERNANCE_DECISION_REGISTER_PATH,
        citationId: decisionId,
      });
    }
  }

  if (findingIds.length === 0 && evidenceArtifacts) {
    pushChip(chips, {
      kind: "evidence",
      label: `Open ${BUYER_SURFACE_VOCABULARY.evidenceGraph.toLowerCase()}`,
      href: evidenceGraphHref({ runId }),
      citationId: runId,
    });
  }

  return chips;
}

/**
 * Best-effort parse of Ask reference lists from conversation message metadataJson.
 * Returns null when metadata is absent, invalid, or has no actionable reference keys.
 */
export function parseAskCitationRefsFromMessageMetadata(metadataJson: string | null | undefined): {
  readonly referencedFindings: readonly string[];
  readonly referencedDecisions: readonly string[];
  readonly referencedArtifacts: readonly string[];
} | null {
  const raw = metadataJson?.trim() ?? "";

  if (raw.length === 0 || raw === "{}") {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  const referencedFindings = readStringArray(record.referencedFindings);
  const referencedDecisions = readStringArray(record.referencedDecisions);
  const referencedArtifacts = readStringArray(record.referencedArtifacts);

  if (
    referencedFindings.length === 0 &&
    referencedDecisions.length === 0 &&
    referencedArtifacts.length === 0
  ) {
    return null;
  }

  return {
    referencedFindings,
    referencedDecisions,
    referencedArtifacts,
  };
}

function readStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    pushUniqueId(ids, entry);
  }

  return ids;
}
