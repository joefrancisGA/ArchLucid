import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  EVIDENCE_GRAPH_OPEN_ACTION_LABEL,
} from "@/lib/evidence-graph-operator-source-link";
import { findingInspectHref } from "@/lib/findings/finding-policy-evidence-citations";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { reviewSignedRecordPath, signedRecordDetailPath } from "@/lib/signed-records-paths";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

import type { RetrievalHit } from "./retrieval-hit";

export type RetrievalHitRelevanceTier = "high" | "medium" | "low";

export type RetrievalHitActionLink = {
  readonly href: string;
  readonly label: string;
};

export const RETRIEVAL_HIT_TITLE_NOT_STORED = "Hit title was not stored." as const;
export const RETRIEVAL_HIT_TEXT_NOT_STORED = "Hit text was not stored." as const;
export const RETRIEVAL_HIT_SOURCE_TYPE_NOT_STORED = "Source type was not stored." as const;
export const RETRIEVAL_HIT_REVIEW_ID_NOT_STORED_ON_HIT =
  "Review id was not stored on this hit." as const;

export function resolveRetrievalHitTitle(title: string | null | undefined): string {
  const trimmed = (title ?? "").trim();

  return trimmed.length > 0 ? trimmed : RETRIEVAL_HIT_TITLE_NOT_STORED;
}

export function resolveRetrievalHitText(text: string | null | undefined): string {
  const trimmed = (text ?? "").trim();

  return trimmed.length > 0 ? (text ?? "") : RETRIEVAL_HIT_TEXT_NOT_STORED;
}

const GUID_PATTERN = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

const MANIFEST_FINDING_DOCUMENT_ID = new RegExp(`^manifest-(${GUID_PATTERN})-finding-`, "i");
const PROVENANCE_DOCUMENT_ID = new RegExp(`^provenance-(${GUID_PATTERN})$`, "i");

/** Maps indexed corpus source types to buyer-facing labels. */
export function retrievalHitSourceTypeLabel(sourceType: string | undefined): string {
  const normalized = (sourceType ?? "").trim();

  switch (normalized) {
    case "ManifestFinding":
      return "Finding";
    case "ManifestDecision":
      return "Decision";
    case "Manifest":
      return SIGNED_MANIFEST_LABEL;
    case "ManifestTopology":
      return "Architecture structure";
    case "ProvenanceGraph":
      return BUYER_SURFACE_VOCABULARY.evidenceGraph;
    case "Artifact":
      return "Evidence artifact";
    case "ConversationMessage":
      return "Conversation";
    case "PlatformDoc":
      return "Platform guidance";
    case "PolicyPackRule":
      return "Policy rule";
    case "PriorManifestDecision":
      return "Prior decision";
    default:
      return normalized.length > 0 ? normalized : RETRIEVAL_HIT_SOURCE_TYPE_NOT_STORED;
  }
}

/** Converts vector similarity score to a coarse relevance tier for display. */
export function retrievalHitRelevanceTier(score: number): RetrievalHitRelevanceTier {
  if (score >= 0.7) {
    return "high";
  }

  if (score >= 0.4) {
    return "medium";
  }

  return "low";
}

export function retrievalHitRelevanceLabel(tier: RetrievalHitRelevanceTier): string {
  switch (tier) {
    case "high":
      return "High similarity band";
    case "medium":
      return "Medium similarity band";
    case "low":
      return "Lower similarity band";
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

function normalizeGuid(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** Review id parsed from the hit payload only — never the page filter scope. */
export function retrievalHitStoredReviewId(hit: RetrievalHit): string | null {
  const documentId = normalizeGuid(hit.documentId);

  if (documentId.length > 0) {
    const findingMatch = MANIFEST_FINDING_DOCUMENT_ID.exec(documentId);

    if (findingMatch !== null && findingMatch[1] !== undefined) {
      return findingMatch[1];
    }

    const provenanceMatch = PROVENANCE_DOCUMENT_ID.exec(documentId);

    if (provenanceMatch !== null && provenanceMatch[1] !== undefined) {
      return provenanceMatch[1];
    }
  }

  if (hit.sourceType === "ManifestTopology" || hit.sourceType === "ProvenanceGraph") {
    const sourceRunId = normalizeGuid(hit.sourceId);

    if (sourceRunId.length > 0) {
      return sourceRunId;
    }
  }

  return null;
}

/** Best-effort run id for deep links when the API omits it on the hit payload. */
export function resolveRetrievalHitRunId(hit: RetrievalHit, scopedRunId?: string): string | null {
  const stored = retrievalHitStoredReviewId(hit);

  if (stored !== null) {
    return stored;
  }

  const scoped = normalizeGuid(scopedRunId);

  if (scoped.length > 0) {
    return scoped;
  }

  return null;
}

function reviewPackageHref(runId: string): RetrievalHitActionLink {
  return {
    href: `/architecture/reviews/${encodeURIComponent(runId)}`,
    label: "Open review",
  };
}

function manifestHref(manifestId: string): RetrievalHitActionLink {
  return {
    href: signedRecordDetailPath(manifestId),
    label: "Open finalized review record",
  };
}

/** Resolves the primary deep link for a retrieval hit, when enough ids are present. */
export function buildRetrievalHitActionLink(
  hit: RetrievalHit,
  scopedRunId?: string,
): RetrievalHitActionLink | null {
  const runId = resolveRetrievalHitRunId(hit, scopedRunId);
  const findingId = normalizeGuid(hit.findingId);
  const decisionId = normalizeGuid(hit.decisionId);
  const sourceId = normalizeGuid(hit.sourceId);
  const sourceType = (hit.sourceType ?? "").trim();

  if (findingId.length > 0 && runId !== null) {
    return {
      href: findingInspectHref(runId, findingId),
      label: "Open finding",
    };
  }

  if (sourceType === "ManifestFinding" && sourceId.length > 0 && runId !== null) {
    return {
      href: findingInspectHref(runId, sourceId),
      label: "Open finding",
    };
  }

  if (sourceType === "Manifest" && sourceId.length > 0) {
    return manifestHref(sourceId);
  }

  if (sourceType === "ManifestDecision" && runId !== null) {
    return {
      href: reviewSignedRecordPath(runId),
      label: "Open decision in review",
    };
  }

  if (sourceType === "ProvenanceGraph" && runId !== null) {
    return {
      href: evidenceGraphHref({ runId }),
      label: EVIDENCE_GRAPH_OPEN_ACTION_LABEL,
    };
  }

  if (sourceType === "ManifestTopology" && runId !== null) {
    return reviewPackageHref(runId);
  }

  if (decisionId.length > 0 && runId !== null) {
    return {
      href: reviewSignedRecordPath(runId),
      label: "Open decision in review",
    };
  }

  if (runId !== null) {
    return reviewPackageHref(runId);
  }

  return null;
}

/** Evidence graph href for a hit when a review id can be resolved — used by Evidence trail chips. */
export function buildRetrievalHitEvidenceTrailHref(
  hit: RetrievalHit,
  scopedRunId?: string,
): string | null {
  const runId = resolveRetrievalHitRunId(hit, scopedRunId);

  if (runId === null) {
    return null;
  }

  return evidenceGraphHref({ runId });
}
