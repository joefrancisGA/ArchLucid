import type { CitationReference } from "@/types/explanation";

import type { GovernanceFindingInspectHrefOptions } from "@/components/governance/findings/governance-findings-navigation";
import {
  getFindingEvidenceTraceHref,
  resolveQuickDecisionFindingDispositionHref,
  resolveQuickDecisionFindingInspectHref,
} from "@/lib/findings/finding-evidence-navigation";
import { ASK_CITATION_REFS_NOT_STORED_MARKER } from "@/lib/ask-review-artifact-status-copy";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";

/** Chip kinds for post-answer Ask citation follow-ups (TB-2219). */
export type AskCitationActionKind = "finding" | "evidence" | "disposition";

export type AskCitationActionFollowUp = {
  readonly kind: AskCitationActionKind;
  readonly label: string;
  readonly href: string | null;
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
  readonly inspectHrefOptions?: GovernanceFindingInspectHrefOptions;
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
      continue;
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

function hasBlankFindingReference(input: AskCitationActionFollowUpsInput): boolean {
  for (const citation of input.citations ?? []) {
    if (citation.kind === "Finding" && trimId(citation.id).length === 0) {
      return true;
    }
  }

  for (const findingId of input.referencedFindings ?? []) {
    if (trimId(findingId).length === 0) {
      return true;
    }
  }

  return false;
}

function collectEvidenceArtifactIds(input: AskCitationActionFollowUpsInput): readonly string[] {
  const ids: string[] = [];

  for (const citation of input.citations ?? []) {
    if (citation.kind === "EvidenceBundle" || citation.kind === "GraphSnapshot") {
      pushUniqueId(ids, trimId(citation.id));
    }
  }

  for (const artifactId of input.referencedArtifacts ?? []) {
    pushUniqueId(ids, trimId(artifactId));
  }

  return ids;
}

function hasBlankDecisionReference(input: AskCitationActionFollowUpsInput): boolean {
  for (const citation of input.citations ?? []) {
    if (citation.kind === "DecisionTrace" && trimId(citation.id).length === 0) {
      return true;
    }
  }

  for (const decisionId of input.referencedDecisions ?? []) {
    if (trimId(decisionId).length === 0) {
      return true;
    }
  }

  return false;
}

export const ASK_CITATION_FOLLOW_UPS_EMPTY_STORED_COPY =
  "No finding, evidence, or decision id was stored on this answer." as const;

export function resolveAskCitationFollowUpsEmptyNote(input: {
  readonly citationRefsOmitted: boolean;
  readonly citationRefsStoredEmpty: boolean;
}): string {
  if (input.citationRefsOmitted) {
    return ASK_CITATION_REFS_NOT_STORED_MARKER;
  }

  if (input.citationRefsStoredEmpty) {
    return ASK_CITATION_FOLLOW_UPS_EMPTY_STORED_COPY;
  }

  return "No linked finding, evidence, or decision to open from this answer.";
}

function findingHasEvidenceTraceCitation(input: AskCitationActionFollowUpsInput, findingId: string): boolean {
  const normalizedFindingId = findingId.trim().toLowerCase();

  if (normalizedFindingId.length === 0) {
    return false;
  }

  for (const link of input.groundingLinks ?? []) {
    const href = trimId(link.href);

    if (href.length === 0) {
      continue;
    }

    const match = FINDING_PATH_RE.exec(href);

    if (match?.[1] === undefined || match[2]?.toLowerCase() !== "evidence-trace") {
      continue;
    }

    try {
      if (decodeURIComponent(match[1]).toLowerCase() === normalizedFindingId) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

function pushChip(
  chips: AskCitationActionFollowUp[],
  chip: AskCitationActionFollowUp,
): void {
  if (
    chips.some(
      (existing) =>
        existing.href === chip.href && existing.kind === chip.kind && existing.label === chip.label,
    )
  ) {
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
  const evidenceArtifactIds = collectEvidenceArtifactIds(input);
  const chips: AskCitationActionFollowUp[] = [];

  const inspectHrefOptions = input.inspectHrefOptions;

  for (const findingId of findingIds) {
    pushChip(chips, {
      kind: "finding",
      label: `Open ${BUYER_SURFACE_VOCABULARY.finding.toLowerCase()}`,
      href: resolveQuickDecisionFindingInspectHref(runId, findingId, inspectHrefOptions),
      citationId: findingId,
    });
    if (findingHasEvidenceTraceCitation(input, findingId)) {
      pushChip(chips, {
        kind: "evidence",
        label: "Open evidence",
        href: getFindingEvidenceTraceHref(runId, findingId),
        citationId: findingId,
      });
    }
    pushChip(chips, {
      kind: "disposition",
      label: "Record disposition",
      href: resolveQuickDecisionFindingDispositionHref(runId, findingId, inspectHrefOptions),
      citationId: findingId,
    });
  }

  if (findingIds.length === 0 && hasBlankFindingReference(input)) {
    pushChip(chips, {
      kind: "finding",
      label: "Finding id was not stored.",
      href: null,
      citationId: "finding-id-not-stored",
    });
    pushChip(chips, {
      kind: "evidence",
      label: "Evidence link was not stored.",
      href: null,
      citationId: "finding-id-not-stored",
    });
    pushChip(chips, {
      kind: "disposition",
      label: "Disposition link was not stored.",
      href: null,
      citationId: "finding-id-not-stored",
    });
  }

  if (findingIds.length === 0 && hasBlankDecisionReference(input)) {
    pushChip(chips, {
      kind: "disposition",
      label: "Decision id was stored empty.",
      href: null,
      citationId: "decision-id-stored-empty",
    });
  }

  for (const decisionId of decisionIds) {
    const trimmed = trimId(decisionId);

    pushChip(chips, {
      kind: "disposition",
      label:
        trimmed.length === 0
          ? "Decision id was stored empty."
          : `Decision ${trimmed} — link was not stored.`,
      href: null,
      citationId: trimmed.length === 0 ? "decision-id-stored-empty" : trimmed,
    });
  }

  for (const artifactId of evidenceArtifactIds) {
    const trimmed = trimId(artifactId);

    pushChip(chips, {
      kind: "evidence",
      label:
        trimmed.length === 0
          ? "Artifact id was stored empty."
          : `${trimmed} — ${BUYER_SURFACE_VOCABULARY.evidenceGraph.toLowerCase()} link was not stored.`,
      href: null,
      citationId: trimmed.length === 0 ? "artifact-id-stored-empty" : trimmed,
    });
  }

  return chips;
}

/**
 * Best-effort parse of Ask reference lists from conversation message metadataJson.
 * Returns null when metadata is absent, invalid, or has no actionable reference keys.
 */
export type AskCitationRefsFromMessageMetadata = {
  readonly referencedFindings: readonly string[] | null;
  readonly referencedDecisions: readonly string[] | null;
  readonly referencedArtifacts: readonly string[] | null;
};

export function parseAskCitationRefsFromMessageMetadata(
  metadataJson: string | null | undefined,
): AskCitationRefsFromMessageMetadata | null {
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
  const hasCitationKeys =
    "referencedFindings" in record || "referencedDecisions" in record || "referencedArtifacts" in record;

  if (!hasCitationKeys) {
    return null;
  }

  const referencedFindings = readCitationStringArray(record, "referencedFindings");
  const referencedDecisions = readCitationStringArray(record, "referencedDecisions");
  const referencedArtifacts = readCitationStringArray(record, "referencedArtifacts");

  return {
    referencedFindings,
    referencedDecisions,
    referencedArtifacts,
  };
}

export function resolveAskCitationRefsEmptyState(
  metadataJson: string | null | undefined,
): { readonly citationRefsOmitted: boolean; readonly citationRefsStoredEmpty: boolean } {
  const raw = metadataJson?.trim() ?? "";

  if (raw.length === 0 || raw === "{}") {
    return { citationRefsOmitted: true, citationRefsStoredEmpty: false };
  }

  const parsed = parseAskCitationRefsFromMessageMetadata(metadataJson);

  if (parsed === null) {
    return { citationRefsOmitted: true, citationRefsStoredEmpty: false };
  }

  const storedEmpty =
    parsed.referencedFindings !== null
    && parsed.referencedDecisions !== null
    && parsed.referencedArtifacts !== null
    && parsed.referencedFindings.length === 0
    && parsed.referencedDecisions.length === 0
    && parsed.referencedArtifacts.length === 0;

  return { citationRefsOmitted: false, citationRefsStoredEmpty: storedEmpty };
}

function readCitationStringArray(
  record: Record<string, unknown>,
  key: "referencedFindings" | "referencedDecisions" | "referencedArtifacts",
): readonly string[] | null {
  if (!(key in record)) {
    return null;
  }

  const value = record[key];

  if (value === null) {
    return null;
  }

  return readStringArray(value);
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
