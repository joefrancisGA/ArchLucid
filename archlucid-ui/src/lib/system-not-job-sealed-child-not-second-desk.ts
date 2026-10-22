import {
  architectureNestedComparePath,
  resolveArchitectureReviewHref,
} from "@/lib/architecture/architecture-routes";
import { compareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { comparePageHrefOnBase } from "@/lib/resolve-working-desk-tool-href";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_SEALED_CHILD_DOC_ANCHOR =
  "docs/architecture/adrs/0077-working-architecture-is-the-locator.md" as const;

export const SYSTEM_NOT_JOB_SEALED_CHILD_OWNER = "SN-018" as const;

export const SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL = "Back to architecture desk" as const;

export const SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID =
  "working-nested-back-to-architecture-desk" as const;

export type SystemNotJobDeskSealedChildLinkRow = {
  readonly relativePath: string;
  readonly surface: string;
  readonly ownerPrompt: string;
};

/** SN-018 desk surfaces that deep-link sealed child reviews under the architecture. */
export const SYSTEM_NOT_JOB_DESK_SEALED_CHILD_LINK_ROWS: readonly SystemNotJobDeskSealedChildLinkRow[] = [
  {
    relativePath: "archlucid-ui/src/components/architecture/ArchitectureIdentityDesk.tsx",
    surface: "latest sealed review record link",
    ownerPrompt: "SN-018",
  },
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskReviewsTable.tsx",
    surface: "child review rows",
    ownerPrompt: "SN-018",
  },
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskVersionsSection.tsx",
    surface: "version lattice review links",
    ownerPrompt: "SN-018",
  },
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskCurrentDraft.tsx",
    surface: "spawn-locked open review",
    ownerPrompt: "SN-018",
  },
  {
    relativePath: "archlucid-ui/src/components/architecture/ArchitectureSealDeltaPanel.tsx",
    surface: "seal delta what-if and compare",
    ownerPrompt: "SN-018",
  },
] as const;

export type SystemNotJobSealedChildBackSurfaceRow = {
  readonly relativePath: string;
  readonly surface: string;
  readonly ownerPrompt: string;
};

/** SN-018 back navigation from nested sealed child views — no breadcrumb trail (TB-2090). */
export const SYSTEM_NOT_JOB_SEALED_CHILD_BACK_SURFACES: readonly SystemNotJobSealedChildBackSurfaceRow[] = [
  {
    relativePath:
      "archlucid-ui/src/components/architecture/WorkingNestedArchitectureIdentityChrome.tsx",
    surface: "nested sealed child back to architecture desk",
    ownerPrompt: "SN-018",
  },
] as const;

/** SN-018 / ADR 0077 — desk sealed-child links nest under the architecture identity. */
export function resolveSystemNotJobDeskSealedChildReviewHref(
  reviewId: string,
  architectureId: string,
): string {
  return resolveArchitectureReviewHref(reviewId, architectureId);
}

export type ResolveSystemNotJobDeskSealedChildCompareHrefInput = {
  readonly architectureId: string;
  readonly priorRunId: string;
  readonly laterRunId: string;
  readonly workingMode: boolean;
};

/** Seal-delta compare from the desk: nested compare in Working; Guided keeps peer Insights. */
export function resolveSystemNotJobDeskSealedChildCompareHref(
  input: ResolveSystemNotJobDeskSealedChildCompareHrefInput,
): string {
  if (input.workingMode) {
    return comparePageHrefOnBase(
      architectureNestedComparePath(input.architectureId),
      input.priorRunId,
      input.laterRunId,
    );
  }

  return compareTwoReviewsHref({
    priorRunId: input.priorRunId,
    laterRunId: input.laterRunId,
    architectureId: input.architectureId,
  });
}
