"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { AiUsageBillingVocabularyRail } from "@/components/AiUsageBillingVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { useTenantUsageStatusQuery } from "@/hooks/use-tenant-usage-status-query";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import { OPERATOR_BILLING_PAGE_LEAD } from "@/lib/marketing/marketing-public-pricing";
import {
  resolveOperatorBillingCommercialTier,
  resolveOperatorBillingIsTrialUsage,
  resolveOperatorBillingSubscriptionLoadState,
} from "@/lib/operator/operator-billing-subscription-resolution";
import { resolveOperatorBillingCurrentPlan } from "@/lib/operator/operator-billing-current-plan";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { OperatorBillingCurrentPlanSummary } from "./OperatorBillingCurrentPlanSummary";
import { OperatorBillingPaymentPastDueBanner } from "./OperatorBillingPaymentPastDueBanner";
import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";
import { OperatorBillingUsageSection } from "./OperatorBillingUsageSection";
import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";

export function OperatorBillingSettingsClient(props: { readonly initialPlanId?: string | null }) {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [plansSectionOpenOverride, setPlansSectionOpenOverride] = useState<boolean | null>(null);
  const { data: trialPayload } = useTenantTrialStatusQuery();
  const {
    data: subscriptionStatus,
    isPending: subscriptionPending,
    isFetched: subscriptionFetched,
  } = useBillingSubscriptionStatusQuery();
  const {
    data: usagePayload,
    isPending: usagePending,
    isFetched: usageFetched,
  } = useTenantUsageStatusQuery();

  const subscriptionLoadState = resolveOperatorBillingSubscriptionLoadState(
    subscriptionPending,
    usagePending,
    subscriptionFetched,
    usageFetched,
    subscriptionStatus,
    usagePayload,
  );
  const commercialTier = resolveOperatorBillingCommercialTier(usagePayload, subscriptionStatus);
  const isTrialUsage = resolveOperatorBillingIsTrialUsage(usagePayload, subscriptionStatus);
  const currentPlanView = resolveOperatorBillingCurrentPlan({
    isDemoMode: isNextPublicDemoMode(),
    isFrictionlessTrial:
      typeof window !== "undefined" ? readFrictionlessTrialSessionEnabled() : false,
    trialStatus: trialPayload?.status,
    trialDaysRemaining: trialPayload?.daysRemaining,
    workspaceLabel: null,
    aiBudgetRemainingPercent: null,
    isTrialUsage,
    commercialTier,
    subscriptionLoadState,
  });
  // Subscription state arrives asynchronously and `CollapsibleSection` captures `defaultOpen` only
  // on first render, so the section is driven as controlled state here. Until the admin toggles it
  // themselves the section follows the resolved plan state instead of the pending-load value.
  const plansSectionOpen =
    plansSectionOpenOverride ??
    (subscriptionLoadState !== "pending" && !currentPlanView.hasPaidPlan);

  return (
    <div className="w-full max-w-[1440px] space-y-4 p-4" data-testid="operator-billing-plans-page">
      <header className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Billing &amp; plans</h1>
            <p className={cn("max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>{OPERATOR_BILLING_PAGE_LEAD}</p>
          </div>
          <PageContextualHelpButton />
        </div>
      </header>
      <AiUsageBillingVocabularyRail currentSurfaceId="billing" />
      <OperatorBillingPaymentPastDueBanner canMutate={canMutate} />

      <OperatorBillingCurrentPlanSummary />

      <CollapsibleSection
        title="Available plans"
        headingLevel={2}
        open={plansSectionOpen}
        onToggle={setPlansSectionOpenOverride}
        sectionTestId="billing-plans-collapsible"
        summaryLine={
          currentPlanView.hasPaidPlan
            ? "Your workspace has an active paid plan. Expand to compare upgrades."
            : "Compare self-serve and sales-led tiers for this workspace."
        }
      >
        <div id="billing-plans" className="scroll-mt-24">
          <OperatorBillingPlansClient initialPlanId={props.initialPlanId ?? null} />
        </div>
      </CollapsibleSection>

      <OperatorBillingUsageSection />

      <OperatorBillingWalletPanel />

      <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
        Need procurement or deployment details?{" "}
        <Link href="/pricing" className="text-teal-800 underline decoration-teal-600/40 underline-offset-2 dark:text-teal-200">
          View public pricing
        </Link>{" "}
        or contact sales for Enterprise packaging.
      </p>
    </div>
  );
}
