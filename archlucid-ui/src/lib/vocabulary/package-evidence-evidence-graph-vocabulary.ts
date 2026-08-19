/**
 * TB-2300 — Package Evidence ≠ Evidence graph vocabulary rail.
 *
 * Why two surfaces exist:
 * - Package Evidence (`?archTab=evidence` / `?reviewTab=evidence`) is capture and
 *   inventory of evidence for one architecture package.
 * - Evidence graph (`/insights/evidence-graph`) is the cross-package provenance
 *   and linkage explorer.
 *
 * They stay separate because uploading or inventorying evidence on one package
 * is not the same task as exploring the evidence graph. Distinct from Run
 * provenance ≠ Evidence graph (TB-2296) and Architecture intelligence ≠ Evidence
 * graph (TB-2273).
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture/architecture-workspace-tabs";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";

export type PackageEvidenceHrefKind = "archTab" | "reviewTab";

export type PackageEvidenceEvidenceGraphSurfaceId = "package-evidence" | "evidence-graph";

export type PackageEvidenceEvidenceGraphLink = {
  readonly id: PackageEvidenceEvidenceGraphSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PackageEvidenceEvidenceGraphVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly packageEvidenceLink: PackageEvidenceEvidenceGraphLink;
  readonly evidenceGraphLink: PackageEvidenceEvidenceGraphLink;
};

export const PACKAGE_EVIDENCE_EVIDENCE_GRAPH_HEADING =
  "Package Evidence and Evidence graph serve different purposes" as const;

export const PACKAGE_EVIDENCE_EVIDENCE_GRAPH_WHY_TWO =
  "Package Evidence captures and inventories evidence for one architecture package. Evidence graph explores provenance and evidence trails across packages. Capturing evidence on one review is not the same as exploring the cross-package graph." as const;

export const PACKAGE_EVIDENCE_EVIDENCE_GRAPH_COMPACT_LINE =
  "Package Evidence is capture and inventory for one review; Evidence graph explores across packages." as const;

/**
 * Peer from Evidence graph: Reviews hub, because Evidence is package-scoped
 * (open the Evidence tab on a package from the reviews list).
 */
export const PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK: PackageEvidenceEvidenceGraphLink =
  {
    id: "package-evidence",
    label: "Reviews (open Evidence)",
    href: REVIEWS_LIST_PATH,
    whenToUse: "Open an architecture package, then use Evidence for capture and inventory.",
  };

export const PACKAGE_EVIDENCE_EVIDENCE_GRAPH_GRAPH_LINK: PackageEvidenceEvidenceGraphLink = {
  id: "evidence-graph",
  label: "Evidence graph",
  href: EVIDENCE_GRAPH_PATH,
  whenToUse: "Explore provenance and evidence trails across architecture packages.",
};

/** Build vocabulary; pass runId when mounting on a package Evidence tab. */
export function buildPackageEvidenceEvidenceGraphVocabulary(
  runId?: string | null,
  hrefKind: PackageEvidenceHrefKind = "archTab",
): PackageEvidenceEvidenceGraphVocabularyModel {
  const trimmed = runId?.trim() ?? "";

  const packageEvidenceHref =
    trimmed.length === 0
      ? null
      : hrefKind === "reviewTab"
        ? buildReviewDetailTabHref(trimmed, "evidence")
        : buildArchitectureWorkspaceTabHref(trimmed, "evidence");

  const packageEvidenceLink: PackageEvidenceEvidenceGraphLink =
    packageEvidenceHref !== null
      ? {
          id: "package-evidence",
          label: "Evidence",
          href: packageEvidenceHref,
          whenToUse: "Capture and inventory evidence for this architecture package.",
        }
      : PACKAGE_EVIDENCE_EVIDENCE_GRAPH_REVIEWS_PEER_LINK;

  return {
    heading: PACKAGE_EVIDENCE_EVIDENCE_GRAPH_HEADING,
    whyTwo: PACKAGE_EVIDENCE_EVIDENCE_GRAPH_WHY_TWO,
    compactLine: PACKAGE_EVIDENCE_EVIDENCE_GRAPH_COMPACT_LINE,
    packageEvidenceLink,
    evidenceGraphLink: PACKAGE_EVIDENCE_EVIDENCE_GRAPH_GRAPH_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePackageEvidenceEvidenceGraphPeerLink(
  currentSurfaceId: PackageEvidenceEvidenceGraphSurfaceId,
  model: PackageEvidenceEvidenceGraphVocabularyModel,
): PackageEvidenceEvidenceGraphLink {
  if (currentSurfaceId === "package-evidence") {
    return model.evidenceGraphLink;
  }

  return model.packageEvidenceLink;
}
