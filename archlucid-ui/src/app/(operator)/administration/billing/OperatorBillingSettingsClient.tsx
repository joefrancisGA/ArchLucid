"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { AiUsageBillingVocabularyRail } from "@/components/AiUsageBillingVocabularyRail";
import { OperatorBillingSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import { useTenantUsageStatusQuery } from "@/hooks/use-tenant-usage-status-query";
import { useBillingSubscriptionStatusQuery } from "@/hooks/use-billing-subscription-status-query";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import {
  resolveOperatorBillingCommercialTier,
  resolveOperatorBillingIsTrialUsage,
  resolveOperatorBillingSubscriptionLoadState,
} from "@/lib/operator/operator-billing-subscription-resolution";
import { resolveOperatorBillingCurrentPlan } from "@/lib/operator/operator-billing-current-plan";
import {
  OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE,
} from "@/lib/operator/operator-billing-settings-evidence-copy";
import {
  OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID,
  OPERATOR_BILLING_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  OPERATOR_BILLING_SETTINGS_PRIMARY_CONTENT_ID,
  OPERATOR_BILLING_SETTINGS_SKIP_LINK_LABEL,
  OPERATOR_BILLING_SETTINGS_SKIP_TARGET_ID,
  operatorBillingSettingsPageSubtitle,
} from "@/lib/operator/operator-billing-settings-page-copy";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  billingPlansSectionDisclosureHrefFromSearch,
  parseBillingPlansSectionOpenFromSearch,
} from "@/lib/administration/billing-plans-section-disclosure-url";

import { OperatorBillingCurrentPlanSummary } from "./OperatorBillingCurrentPlanSummary";
import { OperatorBillingPaymentPastDueBanner } from "./OperatorBillingPaymentPastDueBanner";
import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";
import { OperatorBillingSettingsHeaderActions } from "./OperatorBillingSettingsHeaderActions";
import { OperatorBillingUsageSection } from "./OperatorBillingUsageSection";
import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";

export function OperatorBillingSettingsClient(props: { readonly initialPlanId?: string | null }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/administration/billing";
  const searchParams = useSearchParams();
  const billingPlansSectionOpenParam = searchParams.get("billingPlansSectionOpen");
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
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
    (parseBillingPlansSectionOpenFromSearch(billingPlansSectionOpenParam)
      || (billingPlansSectionOpenParam === null
        && subscriptionLoadState !== "pending"
        && !currentPlanView.hasPaidPlan));

  const setPlansSectionOpen = useCallback(
    (open: boolean) => {
      setPlansSectionOpenOverride(open);
      router.replace(billingPlansSectionDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (parseBillingPlansSectionOpenFromSearch(billingPlansSectionOpenParam)) {
      setPlansSectionOpenOverride(true);

      return;
    }

    if (billingPlansSectionOpenParam !== null) {
      setPlansSectionOpenOverride(false);
    }
  }, [billingPlansSectionOpenParam]);

  return (
    <OperatorPageContainer
      variant="dashboard"
      className={cn("p-4", OPERATOR_LAYOUT.sectionStack)}
      data-testid="operator-billing-plans-page"
    >
      <a
        href={`#${OPERATOR_BILLING_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {OPERATOR_BILLING_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={OPERATOR_BILLING_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={OPERATOR_BILLING_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref="/administration/billing"
          title="Billing & plans"
          headingLevel="h1"
          subtitle={operatorBillingSettingsPageSubtitle(buyerPolishedShell)}
          claimDiscipline={OPERATOR_BILLING_SETTINGS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={OPERATOR_BILLING_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={<OperatorBillingSettingsHeaderActions />}
        />

        <div
          id={OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID}
          data-testid={OPERATOR_BILLING_SETTINGS_FIRST_VIEWPORT_ID}
          className={cn(
            "scroll-mt-24 space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          <OperatorBillingPaymentPastDueBanner canMutate={canMutate} />
          <OperatorBillingCurrentPlanSummary />
        </div>

        {buyerPolishedShell ? null : (
          <AiUsageBillingVocabularyRail currentSurfaceId="billing" />
        )}

        <CollapsibleSection
          title="Available plans"
          headingLevel={2}
          open={plansSectionOpen}
          onToggle={setPlansSectionOpen}
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

        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          Need procurement or deployment details?{" "}
          <Link href="/pricing" className={OPERATOR_BODY_INLINE_LINK_CLASS}>
            View public pricing
          </Link>{" "}
          or contact sales for Enterprise packaging.
        </p>

        <div data-testid="operator-billing-settings-orientation-bottom">
          <OperatorBillingSettingsEvidenceOrientationStrip />
        </div>
      </div>
    </OperatorPageContainer>
  );
}
