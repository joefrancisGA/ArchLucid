import { architectureNestedComparePath } from "@/lib/architecture/architecture-routes";
import { compareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { comparePageHrefOnBase } from "@/lib/resolve-working-desk-tool-href";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_DESK_CHILDREN_DOC_ANCHOR =
  "docs/architecture/adrs/0079-working-desk-is-the-work-surface.md" as const;

export const SYSTEM_NOT_JOB_DESK_CHILDREN_OWNER = "SN-017" as const;

export type SystemNotJobDeskChildListSurfaceRow = {
  readonly relativePath: string;
  readonly surface: string;
  readonly ownerPrompt: string;
};

/** SN-017 child list surfaces on the architecture desk (reviews, drafts, in-flight). */
export const SYSTEM_NOT_JOB_DESK_CHILD_LIST_SURFACES: readonly SystemNotJobDeskChildListSurfaceRow[] = [
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskCurrentDraft.tsx",
    surface: "current draft child slot",
    ownerPrompt: "SN-017",
  },
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskReviewsTable.tsx",
    surface: "child reviews table",
    ownerPrompt: "SN-017",
  },
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskInFlightSection.tsx",
    surface: "in-flight child reviews",
    ownerPrompt: "SN-017",
  },
] as const;

export type SystemNotJobDeskPeerInsightsCtaRow = {
  readonly relativePath: string;
  readonly surface: string;
  readonly ownerPrompt: string;
};

/** SN-017 shrink inventory: Working desk surfaces that must not mint bare peer Insights CTAs. */
export const SYSTEM_NOT_JOB_DESK_PEER_INSIGHTS_CTA_ROWS: readonly SystemNotJobDeskPeerInsightsCtaRow[] = [
  {
    relativePath:
      "archlucid-ui/src/components/architecture/ArchitectureIdentityDeskCompareAction.tsx",
    surface: "desk Compare reviews CTA",
    ownerPrompt: "SN-017",
  },
] as const;

export type ResolveSystemNotJobWorkingDeskCompareHrefInput = {
  readonly architectureId: string;
  readonly priorRunId: string;
  readonly laterRunId: string;
  readonly workingMode: boolean;
};

/** SN-017 / ADR 0079 — Working desk Compare nests under the architecture; Guided keeps peer Insights. */
export function resolveSystemNotJobWorkingDeskCompareHref(
  input: ResolveSystemNotJobWorkingDeskCompareHrefInput,
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
