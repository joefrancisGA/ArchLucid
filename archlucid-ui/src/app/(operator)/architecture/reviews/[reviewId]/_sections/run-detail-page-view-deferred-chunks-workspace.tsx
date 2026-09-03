"use client";

import { DEFERRED_CHUNK_LOADING_SURFACE_CLASS } from "@/components/ui/deferred-chunk-loading";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { cn } from "@/lib/utils";

import { runDetailDeferredLoading } from "./run-detail-deferred-chunk-loading";

const technologyBaselineLoading = (
  <section id="technology-baseline" className="scroll-mt-24">
    {runDetailDeferredLoading("Loading technology baseline", "h-28")}
  </section>
);

export const RunDetailTechnologyBaselineSection = createDeferredComponentFromManifest(
  "run-detail-technology-baseline",
  {
    loadingWrapper: () => technologyBaselineLoading,
  },
);

const preFinalizeChecklistLoading = (
  <section id="pre-finalize-checklist" className="scroll-mt-24">
    {runDetailDeferredLoading("Loading pre-finalize checklist", "h-28")}
  </section>
);

export const RunDetailPreFinalizeChecklistSection = createDeferredComponentFromManifest(
  "run-detail-pre-finalize-checklist",
  {
    loadingWrapper: () => preFinalizeChecklistLoading,
  },
);

const workspaceShellLoading = (
  <div className="space-y-3" role="status" aria-label="Loading review workspace">
    <div className={cn(DEFERRED_CHUNK_LOADING_SURFACE_CLASS, "h-10")} aria-hidden />
    <div className={cn(DEFERRED_CHUNK_LOADING_SURFACE_CLASS, "h-48")} aria-hidden />
  </div>
);

/** TB-2021 remainder — tabbed workspace shell off sync First Load JS. */
export const ReviewDetailWorkspaceDeferred = createDeferredComponentFromManifest(
  "run-detail-review-workspace-shell",
  {
    loadingWrapper: () => workspaceShellLoading,
  },
);

export const RunDetailOverviewPanelClientDeferred = createDeferredComponentFromManifest(
  "run-detail-overview-panel",
  { loadingClassName: "h-48" },
);

const workspaceHeaderLoading = (
  <header className="space-y-3 border-b border-neutral-200 pb-5 dark:border-neutral-800">
    {runDetailDeferredLoading("Loading review header", "h-24")}
  </header>
);

/** TB-2117 — workspace identity chrome off sync First Load JS. */
export const RunDetailWorkspaceHeaderDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-header",
  {
    loadingWrapper: () => workspaceHeaderLoading,
  },
);

export const RunDetailWorkspaceSummaryStripDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-summary-strip",
  { loadingClassName: "h-48" },
);

export const RunDetailWorkspaceBlockingBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-blocking-banner",
  { suppressLoading: true },
);

export const RunDetailWorkspaceStickyActionsDeferred = createDeferredComponentFromManifest(
  "run-detail-workspace-sticky-actions",
  {
    loadingClassName: "h-14 hidden rounded-lg dark:bg-neutral-900/40 lg:block",
  },
);

export const RunDetailSectionNavDeferred = createDeferredComponentFromManifest("run-detail-section-nav", {
  loadingClassName: "h-10",
});

export const RunDetailTabbedSectionNavDeferred = createDeferredComponentFromManifest(
  "run-detail-tabbed-section-nav",
  { loadingClassName: "h-10" },
);

/** Perf wave 14 — create-home evidence archTab off sync First Load JS. */
export const RunDetailCreateHomeEvidencePanelDeferred = createDeferredComponentFromManifest(
  "run-detail-create-home-evidence",
  { loadingClassName: "h-48" },
);

/** Perf wave 14 — create-home activity archTab off sync First Load JS (TB-1832/TB-1834). */
export const RunDetailCreateHomeActivityPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-create-home-activity",
  { loadingClassName: "h-40" },
);

/** Perf wave 14 — activity-tab sources panel off sync First Load JS. */
export const RunDetailActivitySourcesPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-activity-sources",
  { loadingClassName: "h-32" },
);
