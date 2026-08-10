"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
    import("@/components/GovernanceInteractiveQuickstartContent").then(
      (module) => module.GovernanceInteractiveQuickstartContent,
    ),
  {
    ssr: false,
    loading: () => <GovernanceWorkflowDeferredLoading label="Loading governance quickstart" />,
  },
);
