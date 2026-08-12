"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { GovernanceOverviewPanelProps } from "./GovernanceOverviewPanel";
import type { GovernanceReviewContextBarProps } from "./GovernanceReviewContextBar";
import type { GovernanceWorkflowSubmitSectionProps } from "./GovernanceWorkflowSubmitSection";

function GovernanceWorkflowDeferredLoading(props: { readonly label: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        "min-h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label={props.label}
      data-testid="governance-workflow-deferred-chunk-loading"
    />
  );
}

/** Overview panel — deferred so approval-queue chrome paints first (wave 11 hub First Load). */
export const GovernanceOverviewPanelDeferred: ComponentType<GovernanceOverviewPanelProps> = dynamic(
  () => import("./GovernanceOverviewPanel").then((module) => module.GovernanceOverviewPanel),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading governance overview" />,
  },
);

/** Review context bar — deferred so approval-queue header paints first (wave 14 First Load). */
export const GovernanceReviewContextBarDeferred: ComponentType<GovernanceReviewContextBarProps> = dynamic(
  () => import("./GovernanceReviewContextBar").then((module) => module.GovernanceReviewContextBar),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading review context" />,
  },
);

export const GovernanceWorkflowSubmitSectionDeferred: ComponentType<GovernanceWorkflowSubmitSectionProps> =
  dynamic(
    () =>
      import("./GovernanceWorkflowSubmitSection").then(
        (module) => module.GovernanceWorkflowSubmitSection,
      ),
    {
      ssr: false,
      loading: () => <GovernanceWorkflowDeferredLoading label="Loading approval submit" />,
    },
  );

/** Approvals list — below-fold relative to overview/header (wave 10 hub First Load). */
export const GovernanceWorkflowApprovalsListDeferred = dynamic(
  () =>
    import("./GovernanceWorkflowApprovalsList").then((module) => module.GovernanceWorkflowApprovalsList),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading approval requests" />,
  },
);

export const GovernanceWorkflowPromotionsActivationsSectionDeferred = dynamic(
  () =>
    import("./GovernanceWorkflowPromotionsActivationsSection").then(
      (module) => module.GovernanceWorkflowPromotionsActivationsSection,
    ),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading environment releases" />,
  },
);

export const GovernanceWorkflowDialogsDeferred = dynamic(
  () => import("./GovernanceWorkflowDialogs").then((module) => module.GovernanceWorkflowDialogs),
  { ssr: false, loading: () => null },
);

export const CtoDemoBuyerValueStripDeferred = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoBuyerValueStrip").then(
      (module) => module.CtoDemoBuyerValueStrip,
    ),
  { ssr: false, loading: () => null },
);

export const CtoDemoSegregationCalloutDeferred = dynamic(
  () =>
    import("@/components/cto-demo/CtoDemoSegregationCallout").then(
      (module) => module.CtoDemoSegregationCallout,
    ),
  { ssr: false, loading: () => null },
);

export const CtoDemoGovernancePreviewHintDeferred = dynamic(
  () =>
    import("@/components/OperateCapabilityHints").then(
      (module) => module.CtoDemoGovernancePreviewHint,
    ),
  { ssr: false, loading: () => null },
);

export const GovernanceInteractiveQuickstartContentDeferred = dynamic(
  () =>
    import("@/components/governance/GovernanceInteractiveQuickstartContent").then(
      (module) => module.GovernanceInteractiveQuickstartContent,
    ),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading governance quickstart" />,
  },
);

/** Buyer approval narrative card — below-fold relative to workflow header (First Load split). */
export const GovernanceApprovalStoryCardDeferred = dynamic(
  () =>
    import("@/components/governance/GovernanceApprovalStoryCard").then(
      (module) => module.GovernanceApprovalStoryCard,
    ),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading approval decision record" />,
  },
);

/** Environment releases accordion — advanced options, below primary approval path. */
export const AdvancedOptionsAccordionDeferred = dynamic(
  () =>
    import("@/components/AdvancedOptionsAccordion").then(
      (module) => module.AdvancedOptionsAccordion,
    ),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading advanced options" />,
  },
);
