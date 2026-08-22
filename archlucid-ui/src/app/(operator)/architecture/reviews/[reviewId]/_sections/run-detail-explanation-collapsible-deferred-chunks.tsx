"use client";

import type { JSX } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

const findingsWorkspaceLoadingWrapper = (): JSX.Element => (
  <div
    className="h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
    role="status"
    aria-label="Loading findings workspace"
  />
);

export const FindingsWhatIfAnalysisPanelDeferred = createDeferredComponentFromManifest(
  "run-detail-findings-what-if-analysis-panel",
  { suppressLoading: true },
);

export const RunDetailFindingsWorkspaceDeferred = createDeferredComponentFromManifest(
  "run-detail-findings-workspace",
  { loadingWrapper: findingsWorkspaceLoadingWrapper },
);

export const RunExplanationSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-run-explanation-section",
  { suppressLoading: true },
);

export const RunFindingExplainabilityTableDeferred = createDeferredComponentFromManifest(
  "run-detail-run-finding-explainability-table",
  { suppressLoading: true },
);
