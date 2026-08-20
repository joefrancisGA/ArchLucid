import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — run detail deferred chunk catalog (subset used by manifest import tests). */
export const RUN_DETAIL_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "run-detail-review-workspace-shell",
    label: "Loading review workspace",
    variant: "section",
    modulePath: "@/components/reviews/ReviewWorkspaceShell",
    exportName: "ReviewWorkspaceShell",
  },
  {
    id: "run-detail-overview-panel",
    label: "Loading review overview",
    variant: "panel",
    modulePath: "@/components/reviews/RunDetailOverviewPanelClient",
    exportName: "RunDetailOverviewPanelClient",
  },
  {
    id: "run-detail-evidence-tab",
    label: "Loading evidence tab",
    variant: "panel",
    modulePath: "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailEvidenceTabPanel",
    exportName: "RunDetailEvidenceTabPanel",
  },
  {
    id: "run-detail-below-fold",
    label: "Loading additional review sections",
    variant: "section",
    modulePath: "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBelowFoldSections",
    exportName: "RunDetailBelowFoldSections",
  },
  {
    id: "run-detail-architecture-created-workspace",
    label: "Loading create-home workspace",
    variant: "section",
    modulePath: "@/components/architecture/ArchitectureCreatedReviewWorkspaceShell",
    exportName: "ArchitectureCreatedReviewWorkspaceShell",
  },
  {
    id: "run-detail-create-home-evidence",
    label: "Loading evidence panel",
    variant: "panel",
    modulePath: "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeEvidencePanel",
    exportName: "RunDetailCreateHomeEvidencePanel",
  },
  {
    id: "run-detail-create-home-activity",
    label: "Loading activity panel",
    variant: "panel",
    modulePath: "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailCreateHomeActivityPanel",
    exportName: "RunDetailCreateHomeActivityPanel",
  },
  {
    id: "run-detail-technology-baseline",
    label: "Loading technology baseline",
    variant: "section",
    modulePath: "@/components/reviews/technology-baseline/TechnologyBaselineSection",
    exportName: "TechnologyBaselineSection",
  },
] as const;
