"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const technologyBaselineLoading = (
  <section id="technology-baseline" className="scroll-mt-24">
    <div
      className="h-28 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      role="status"
      aria-label="Loading technology baseline"
    />
  </section>
);

export const RunDetailTechnologyBaselineSection = dynamic(
  () =>
    import("@/components/reviews/technology-baseline/TechnologyBaselineSection").then(
      (module) => module.TechnologyBaselineSection,
    ),
  { ssr: false, loading: () => technologyBaselineLoading },
);

export const RunDetailHolisticCriticPanelDeferred = dynamic(
  () => import("./RunDetailHolisticCriticPanel").then((module) => module.RunDetailHolisticCriticPanel),
  { ssr: false, loading: () => null },
);

export const RunDetailExportDeliverableDialog = dynamic(
  () =>
    import("@/components/usability/ExportDeliverableDialog").then(
      (module) => module.ExportDeliverableDialog,
    ),
  { ssr: false, loading: () => null },
);

export const RunDetailGenerateAdrFromRunModal = dynamic(
  () => import("@/components/GenerateAdrFromRunModal").then((module) => module.GenerateAdrFromRunModal),
  { ssr: false, loading: () => null },
);

export const RunDetailCompareToBaselineCta = dynamic(
  () => import("@/components/CompareToBaselineCta").then((module) => module.CompareToBaselineCta),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn("h-9 w-44 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.body)}
        role="status"
        aria-label="Loading compare to baseline"
      />
    ),
  },
);
