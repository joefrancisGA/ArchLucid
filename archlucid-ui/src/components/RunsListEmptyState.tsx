"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { SeedSampleReviewButton } from "@/components/SeedSampleReviewButton";
import { RUNS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

/** Reviews index empty state with one-click Contoso demo seed for sales-led pilots. */
export function RunsListEmptyState() {
  return (
    <EnterpriseCompactEmptyState
      {...RUNS_EMPTY_COMPACT}
      footer={<SeedSampleReviewButton label="Load sample workspace" />}
    />
  );
}
