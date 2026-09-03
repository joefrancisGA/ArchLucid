"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import { runDetailDeferredLoading } from "./run-detail-deferred-chunk-loading";

const artifactsExportsLoading = (
  <section id="artifacts-exports" className="scroll-mt-24">
    {runDetailDeferredLoading("Loading artifacts and exports", "h-36")}
  </section>
);

/** TB-2021 — export button cluster is tab/Evidence-gated; keep off sync First Load JS. */
export const RunDetailArtifactsExportsSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-artifacts-exports-section",
  {
    loadingWrapper: () => artifactsExportsLoading,
  },
);

/** TB-2142 — evidence tab scope/inventory cluster off sync First Load JS. */
export const RunDetailEvidenceTabPanelDeferred = createDeferredComponentFromManifest("run-detail-evidence-tab", {
  loadingClassName: "h-48",
});

export const RunDetailCaptureEvidenceSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-capture-evidence-section",
  { suppressLoading: true },
);

export const RunDetailTrustEvidenceCardSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-trust-evidence-card-section",
  { suppressLoading: true },
);

export const RunDetailRetrievalGroundingSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-retrieval-grounding-section",
  { suppressLoading: true },
);

export const RunDetailRetrievalGroundingSummaryCardDeferred = createDeferredComponentFromManifest(
  "run-detail-retrieval-grounding-summary-card",
  { suppressLoading: true },
);
