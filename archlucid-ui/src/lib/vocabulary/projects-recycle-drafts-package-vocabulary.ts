/**
 * TB-2251 — Recycle ≠ Drafts ≠ Package vocabulary triad.
 *
 * Three related project surfaces:
 * - Projects recycle bin (`/administration/tenant/recycle-bin`) restores
 *   soft-deleted projects (retention window — not permanent erase).
 * - Architecture drafts (`/architecture/architectures`) is the draft registry
 *   before a review starts.
 * - Architecture packages / reviews (`/architecture/reviews`) is the hub for
 *   architecture packages and review inventory.
 *
 * They stay separate because soft-delete and restore are not the draft list,
 * and drafts are not finalized architecture packages. Restore residue honesty:
 * soft-delete does not erase architecture packages — restoring a project
 * returns project scope residue; packages and drafts remain distinct objects.
 */

import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";

/** Canonical projects recycle bin path (administration tenant scope). */
export const PROJECTS_RECYCLE_BIN_PATH = "/administration/tenant/recycle-bin" as const;

export type ProjectsRecycleDraftsPackageSurfaceId =
  | "projects-recycle"
  | "architecture-drafts"
  | "architecture-packages";

export type ProjectsRecycleDraftsPackageLink = {
  readonly id: ProjectsRecycleDraftsPackageSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ProjectsRecycleDraftsPackageVocabularyModel = {
  readonly heading: string;
  readonly whyThree: string;
  readonly compactLine: string;
  /** Soft-delete restores project residue; it does not erase architecture packages. */
  readonly restoreResidueHonesty: string;
  readonly recycleLink: ProjectsRecycleDraftsPackageLink;
  readonly draftsLink: ProjectsRecycleDraftsPackageLink;
  readonly packageLink: ProjectsRecycleDraftsPackageLink;
};

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_HEADING =
  "Recycle, drafts, and packages are three different jobs" as const;

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_WHY_THREE =
  "The projects recycle bin restores soft-deleted projects within the retention window. Architecture drafts are saved work before a review starts. Architecture packages live on the reviews hub as the review inventory. Soft-delete is not erase for packages — restore returns project residue; drafts and packages stay separate objects." as const;

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_COMPACT_LINE =
  "Recycle restores soft-deleted projects; drafts are pre-review; packages are architecture packages — open the other when you need that job." as const;

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY =
  "Soft-delete does not erase architecture packages. Restore brings back project residue; drafts and packages remain distinct from the recycle bin." as const;

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK: ProjectsRecycleDraftsPackageLink = {
  id: "projects-recycle",
  label: "Projects recycle bin",
  href: PROJECTS_RECYCLE_BIN_PATH,
  whenToUse: "Restore soft-deleted projects within the retention window.",
};

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK: ProjectsRecycleDraftsPackageLink = {
  id: "architecture-drafts",
  label: "Architecture drafts",
  href: ARCHITECTURES_LIST_PATH,
  whenToUse: "Open or create architecture drafts before starting a review.",
};

export const PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK: ProjectsRecycleDraftsPackageLink = {
  id: "architecture-packages",
  label: "Architecture packages",
  href: REVIEWS_LIST_PATH,
  whenToUse: "Browse architecture packages and review inventory.",
};

const ALL_LINKS: readonly ProjectsRecycleDraftsPackageLink[] = [
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
  PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
];

/** Full triad vocabulary model (heading, why-three, honesty, and deep links). */
export function buildProjectsRecycleDraftsPackageVocabulary(): ProjectsRecycleDraftsPackageVocabularyModel {
  return {
    heading: PROJECTS_RECYCLE_DRAFTS_PACKAGE_HEADING,
    whyThree: PROJECTS_RECYCLE_DRAFTS_PACKAGE_WHY_THREE,
    compactLine: PROJECTS_RECYCLE_DRAFTS_PACKAGE_COMPACT_LINE,
    restoreResidueHonesty: PROJECTS_RECYCLE_DRAFTS_PACKAGE_RESTORE_RESIDUE_HONESTY,
    recycleLink: PROJECTS_RECYCLE_DRAFTS_PACKAGE_RECYCLE_LINK,
    draftsLink: PROJECTS_RECYCLE_DRAFTS_PACKAGE_DRAFTS_LINK,
    packageLink: PROJECTS_RECYCLE_DRAFTS_PACKAGE_PACKAGE_LINK,
  };
}

/** Resolve the link for the current surface (null when unknown). */
export function resolveProjectsRecycleDraftsPackageLink(
  surfaceId: ProjectsRecycleDraftsPackageSurfaceId,
): ProjectsRecycleDraftsPackageLink | null {
  const match = ALL_LINKS.find((link) => link.id === surfaceId);

  if (match === undefined) {
    return null;
  }

  return match;
}

/** Peer deep-links for the surfaces you are not currently on. */
export function resolveProjectsRecycleDraftsPackagePeerLinks(
  currentSurfaceId: ProjectsRecycleDraftsPackageSurfaceId,
): readonly ProjectsRecycleDraftsPackageLink[] {
  return ALL_LINKS.filter((link) => link.id !== currentSurfaceId);
}
