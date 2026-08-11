/**
 * TB-2255 — Audit trail ≠ Evidence graph / Search review evidence vocabulary rail.
 *
 * Why three surfaces exist:
 * - Audit trail (`/governance/audit`) is the operator activity log for
 *   governance and review events (filters, integrity export/verify).
 * - Evidence graph (`/insights/evidence-graph`) is the signed-record evidence
 *   trail visualization for an architecture package.
 * - Search review evidence (`/insights/search-review-evidence`) finds findings,
 *   decisions, and signed review records across packages in the evidence trail.
 *
 * They stay separate because the audit activity log is not the diligence
 * evidence trail, and graph presentation is not cross-package retrieval.
 * From Audit, deep-link both evidence surfaces; from each evidence surface,
 * deep-link Audit and the peer evidence surface.
 */

import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

export type AuditEvidenceTrailSurfaceId = "audit" | "evidence-graph" | "search-evidence";

export type AuditEvidenceTrailLink = {
  readonly id: AuditEvidenceTrailSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AuditEvidenceTrailVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  readonly auditLink: AuditEvidenceTrailLink;
  readonly evidenceGraphLink: AuditEvidenceTrailLink;
  readonly searchEvidenceLink: AuditEvidenceTrailLink;
};

export const AUDIT_EVIDENCE_TRAIL_HEADING =
  "Audit trail and evidence surfaces do different jobs" as const;

export const AUDIT_EVIDENCE_TRAIL_WHY_THREE =
  "Audit trail is the operator activity log for governance and review events. Evidence graph visualizes the signed-record evidence trail for an architecture package. Search review evidence finds findings, decisions, and signed review records across packages. Do not treat the audit log as the diligence evidence trail — open the peer evidence surface when you need signed-record proof or cross-package retrieval." as const;

export const AUDIT_EVIDENCE_TRAIL_COMPACT_LINE =
  "Audit is the activity log; Evidence graph and Search review evidence are the diligence trail — open the peers when you need both." as const;

export const AUDIT_EVIDENCE_TRAIL_AUDIT_LINK: AuditEvidenceTrailLink = {
  id: "audit",
  label: "Audit trail",
  href: GOVERNANCE_AUDIT_PATH,
  whenToUse: "Search and export the operator activity log for governance and review events.",
};

export const AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK: AuditEvidenceTrailLink = {
  id: "evidence-graph",
  label: "Evidence graph",
  href: EVIDENCE_GRAPH_PATH,
  whenToUse: "Inspect the signed-record evidence trail for an architecture package.",
};

export const AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK: AuditEvidenceTrailLink = {
  id: "search-evidence",
  label: "Search review evidence",
  href: SEARCH_REVIEW_EVIDENCE_PATH,
  whenToUse: "Find findings, decisions, and signed review records across architecture packages.",
};

/** Full vocabulary model (heading, why-three copy, and deep links). */
export function buildAuditEvidenceTrailVocabulary(): AuditEvidenceTrailVocabularyModel {
  return {
    heading: AUDIT_EVIDENCE_TRAIL_HEADING,
    whyThree: AUDIT_EVIDENCE_TRAIL_WHY_THREE,
    compactLine: AUDIT_EVIDENCE_TRAIL_COMPACT_LINE,
    auditLink: AUDIT_EVIDENCE_TRAIL_AUDIT_LINK,
    evidenceGraphLink: AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK,
    searchEvidenceLink: AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK,
  };
}

/**
 * Peer deep-links for the surfaces you are not currently on.
 * Audit mounts show both evidence surfaces; evidence mounts show Audit + the other evidence surface.
 */
export function resolveAuditEvidenceTrailPeerLinks(
  currentSurfaceId: AuditEvidenceTrailSurfaceId,
): readonly AuditEvidenceTrailLink[] {
  if (currentSurfaceId === "audit") {
    return [AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK, AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK];
  }

  if (currentSurfaceId === "evidence-graph") {
    return [AUDIT_EVIDENCE_TRAIL_AUDIT_LINK, AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK];
  }

  return [AUDIT_EVIDENCE_TRAIL_AUDIT_LINK, AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK];
}

/** Current surface link for aria-current labeling. */
export function resolveAuditEvidenceTrailCurrentLink(
  currentSurfaceId: AuditEvidenceTrailSurfaceId,
): AuditEvidenceTrailLink {
  if (currentSurfaceId === "audit") {
    return AUDIT_EVIDENCE_TRAIL_AUDIT_LINK;
  }

  if (currentSurfaceId === "evidence-graph") {
    return AUDIT_EVIDENCE_TRAIL_EVIDENCE_GRAPH_LINK;
  }

  return AUDIT_EVIDENCE_TRAIL_SEARCH_EVIDENCE_LINK;
}
