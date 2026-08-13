/**
 * TB-2303 — Artifact preview ≠ Sponsor export vocabulary rail.
 *
 * Why two surfaces exist:
 * - Artifact preview (`/governance/signed-records/.../artifacts/...`) is the
 *   in-shell signed-record artifact viewer for one committed output.
 * - Sponsor export (executive dashboard `#sponsor-exports` and review-detail
 *   `#sponsor-handoff`) is the per-package handoff — download the executive
 *   review summary or architecture report for sponsors.
 *
 * They stay separate because previewing a signed-record artifact in the shell
 * is not the same task as exporting a package for sponsor handoff. Distinct from
 * ROI summary ≠ sponsor export (TB-2258).
 */

import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** Stable peer — matches executive dashboard `#sponsor-exports` (avoid coupling to WIP path moves). */
const SPONSOR_EXPORTS_HREF = "/architecture/executive-dashboard#sponsor-exports" as const;

export type ArtifactPreviewSponsorExportSurfaceId = "artifact-preview" | "sponsor-export";

export type ArtifactPreviewSponsorExportLink = {
  readonly id: ArtifactPreviewSponsorExportSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ArtifactPreviewSponsorExportVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly artifactPreviewLink: ArtifactPreviewSponsorExportLink;
  readonly sponsorExportLink: ArtifactPreviewSponsorExportLink;
};

export const ARTIFACT_PREVIEW_SPONSOR_EXPORT_HEADING =
  "Artifact preview and Sponsor export serve different purposes" as const;

export const ARTIFACT_PREVIEW_SPONSOR_EXPORT_WHY_TWO =
  "Artifact preview shows one signed-record artifact in the shell for review and download of that output. Sponsor export hands off a finalized architecture package — executive review summary or architecture report — to sponsors. Previewing a committed artifact is not the same as sending a package handoff." as const;

export const ARTIFACT_PREVIEW_SPONSOR_EXPORT_COMPACT_LINE =
  "Artifact preview is in-shell signed-record content; Sponsor export is package handoff." as const;

/**
 * Peer from Sponsor export: Signed review records list, because artifact preview
 * is manifest/artifact-scoped (open a record, then preview an artifact).
 */
export const ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK: ArtifactPreviewSponsorExportLink =
  {
    id: "artifact-preview",
    label: "Signed review records (open Artifact preview)",
    href: SIGNED_RECORDS_LIST_PATH,
    whenToUse: "Open a signed review record, then preview a committed artifact in the shell.",
  };

export const ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK: ArtifactPreviewSponsorExportLink = {
  id: "sponsor-export",
  label: "Sponsor export",
  href: SPONSOR_EXPORTS_HREF,
  whenToUse: "Download the executive review summary or architecture report for sponsor handoff.",
};

/** Optional run-scoped sponsor handoff href when a review is in scope. */
export function buildArtifactPreviewSponsorExportHref(runId?: string | null): string {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK.href;
  }

  return `/architecture/reviews/${encodeURIComponent(trimmed)}#sponsor-handoff`;
}

/** Build vocabulary; pass artifactHref when mounting on a specific preview page. */
export function buildArtifactPreviewSponsorExportVocabulary(
  options?: {
    readonly artifactHref?: string | null;
    readonly runId?: string | null;
  },
): ArtifactPreviewSponsorExportVocabularyModel {
  const artifactHref = options?.artifactHref?.trim() ?? "";

  const artifactPreviewLink: ArtifactPreviewSponsorExportLink =
    artifactHref.length > 0
      ? {
          id: "artifact-preview",
          label: "Artifact preview",
          href: artifactHref,
          whenToUse: "Review this signed-record artifact in the shell.",
        }
      : ARTIFACT_PREVIEW_SPONSOR_EXPORT_RECORDS_PEER_LINK;

  const sponsorExportLink: ArtifactPreviewSponsorExportLink = {
    ...ARTIFACT_PREVIEW_SPONSOR_EXPORT_SPONSOR_LINK,
    href: buildArtifactPreviewSponsorExportHref(options?.runId),
  };

  return {
    heading: ARTIFACT_PREVIEW_SPONSOR_EXPORT_HEADING,
    whyTwo: ARTIFACT_PREVIEW_SPONSOR_EXPORT_WHY_TWO,
    compactLine: ARTIFACT_PREVIEW_SPONSOR_EXPORT_COMPACT_LINE,
    artifactPreviewLink,
    sponsorExportLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveArtifactPreviewSponsorExportPeerLink(
  currentSurfaceId: ArtifactPreviewSponsorExportSurfaceId,
  model: ArtifactPreviewSponsorExportVocabularyModel,
): ArtifactPreviewSponsorExportLink {
  if (currentSurfaceId === "artifact-preview") {
    return model.sponsorExportLink;
  }

  return model.artifactPreviewLink;
}
