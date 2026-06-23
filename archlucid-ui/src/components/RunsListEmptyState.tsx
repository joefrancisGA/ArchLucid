"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { RunDemoReviewButton } from "@/components/RunDemoReviewButton";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { RUNS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** Reviews index empty state with one-click policy-aware demo review and optional sample workspace seed. */
export function RunsListEmptyState() {
  return (
    <EnterpriseCompactEmptyState
      {...RUNS_EMPTY_COMPACT}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <RunDemoReviewButton />
          <SeedSampleReviewButton label="Load sample workspace" />
        </div>
      }
    />
  );
}
