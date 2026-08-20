"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

import type { GovernanceOverviewPanelProps } from "./GovernanceOverviewPanel";
import type { GovernanceReviewContextBarProps } from "./GovernanceReviewContextBar";
import type { GovernanceWorkflowSubmitSectionProps } from "./GovernanceWorkflowSubmitSection";

function governanceWorkflowDeferredLoading(label: string): React.JSX.Element {
  return (
    <DeferredChunkLoading label={label} testId="governance-workflow-deferred-chunk-loading" />
  );
}

/** Overview panel — deferred so approval-queue chrome paints first (wave 11 hub First Load). */
export const GovernanceOverviewPanelDeferred: ComponentType<GovernanceOverviewPanelProps> =
  createDeferredComponentFromManifest("governance-workflow-overview-panel", {
    loadingTestId: "governance-workflow-deferred-chunk-loading",
  });

/** Review context bar — deferred so approval-queue header paints first (wave 14 First Load). */
export const GovernanceReviewContextBarDeferred: ComponentType<GovernanceReviewContextBarProps> =
  createDeferredComponentFromManifest("governance-workflow-review-context-bar", {
    loadingTestId: "governance-workflow-deferred-chunk-loading",
  });

export const GovernanceWorkflowSubmitSectionDeferred: ComponentType<GovernanceWorkflowSubmitSectionProps> =
  dynamic(
    () =>
      import("./GovernanceWorkflowSubmitSection").then(
        (module) => module.GovernanceWorkflowSubmitSection,
      ),
    {
      ssr: false,
      loading: () => governanceWorkflowDeferredLoading("Loading approval submit"),
    },
  );

/** Approvals list — below-fold relative to overview/header (wave 10 hub First Load). */
export const GovernanceWorkflowApprovalsListDeferred = createDeferredComponentFromManifest(
  "governance-workflow-approvals-list",
  { loadingTestId: "governance-workflow-deferred-chunk-loading" },
);

export const GovernanceWorkflowPromotionsActivationsSectionDeferred = dynamic(
  () =>
    import("./GovernanceWorkflowPromotionsActivationsSection").then(
      (module) => module.GovernanceWorkflowPromotionsActivationsSection,
    ),
  {
    ssr: false,
    loading: () => governanceWorkflowDeferredLoading("Loading environment releases"),
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
    loading: () => governanceWorkflowDeferredLoading("Loading governance quickstart"),
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
    loading: () => governanceWorkflowDeferredLoading("Loading approval decision record"),
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
    loading: () => governanceWorkflowDeferredLoading("Loading advanced options"),
  },
);
