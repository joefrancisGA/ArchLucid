import { findingInspectHref } from "@/lib/finding-policy-evidence-citations";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

import type { RetrievalHit } from "./retrieval-hit";

export type RetrievalHitRelevanceTier = "high" | "medium" | "low";

export type RetrievalHitActionLink = {
  readonly href: string;
  readonly label: string;
};

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
      return "Decision record";
    case "Manifest":
      return SIGNED_MANIFEST_LABEL;
    case "ManifestTopology":
      return "Architecture topology";
    case "ProvenanceGraph":
      return "Evidence trail";
    case "Artifact":
      return "Evidence artifact";
    case "ConversationMessage":
      return "Conversation";
    case "PlatformDoc":
      return "Platform guidance";
    case "PolicyPackRule":
      return "Policy rule";
    case "PriorManifestDecision":
      return "Prior decision record";
    default:
      return normalized.length > 0 ? normalized : "Evidence";
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
      return "High relevance";
    case "medium":
      return "Medium relevance";
    case "low":
      return "Lower relevance";
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}

function normalizeGuid(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** Best-effort run id for deep links when the API omits it on the hit payload. */
export function resolveRetrievalHitRunId(hit: RetrievalHit, scopedRunId?: string): string | null {
  const scoped = normalizeGuid(scopedRunId);
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

  if (scoped.length > 0) {
    return scoped;
  }

  return null;
}

function reviewPackageHref(runId: string): RetrievalHitActionLink {
  return {
    href: `/reviews/${encodeURIComponent(runId)}`,
    label: "Open review package",
  };
}

function manifestHref(manifestId: string): RetrievalHitActionLink {
  return {
    href: `/manifests/${encodeURIComponent(manifestId)}`,
    label: `Open ${SIGNED_MANIFEST_LABEL.toLowerCase()}`,
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
      href: `/reviews/${encodeURIComponent(runId)}/manifest`,
      label: "Open decision in review package",
    };
  }

  if (sourceType === "ProvenanceGraph" && runId !== null) {
    return {
      href: `/reviews/${encodeURIComponent(runId)}/provenance`,
      label: "Open evidence trail",
    };
  }

  if (sourceType === "ManifestTopology" && runId !== null) {
    return reviewPackageHref(runId);
  }

  if (decisionId.length > 0 && runId !== null) {
    return {
      href: `/reviews/${encodeURIComponent(runId)}/manifest`,
      label: "Open decision in review package",
    };
  }

  if (runId !== null) {
    return reviewPackageHref(runId);
  }

  return null;
}
