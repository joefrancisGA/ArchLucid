"use client";

import type { ComponentType, JSX } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const RunDetailPostCommitHabitLoopCardDeferred = createDeferredComponentFromManifest(
  "run-detail-post-commit-habit-loop",
  { suppressLoading: true },
);

const runDetailArchitectureGraphLoadingWrapper = (): JSX.Element => (
  <section id="architecture-graph" className="scroll-mt-24">
    <div
      className="h-64 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading architecture graph"
    />
  </section>
);

export const RunDetailArchitectureGraphSectionDeferred = createDeferredComponentFromManifest(
  "run-detail-architecture-graph-section",
  { loadingWrapper: runDetailArchitectureGraphLoadingWrapper },
);
