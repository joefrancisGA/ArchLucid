"use client";

import dynamic from "next/dynamic";
import type { ReactElement } from "react";

import type { QuickDecisionSummaryProps } from "@/components/quick-decision-summary/types";

const QuickDecisionSummaryLazy = dynamic(
  () =>
    import("@/components/QuickDecisionSummary").then((module) => ({
      default: module.QuickDecisionSummary,
    })),
  {
    loading: () => <p className="m-0 text-al-text-secondary">Loading card view…</p>,
  },
);

export type RunDetailFindingsCardViewLazyProps = QuickDecisionSummaryProps;

/** Lazy-loaded card stack for review findings (TB-2142 bundle guard). */
export function RunDetailFindingsCardViewLazy(props: RunDetailFindingsCardViewLazyProps): ReactElement {
  return <QuickDecisionSummaryLazy {...props} workspaceCardMode />;
}
