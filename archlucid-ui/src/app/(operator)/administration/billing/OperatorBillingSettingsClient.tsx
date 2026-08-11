"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { AiUsageBillingVocabularyRail } from "@/components/AiUsageBillingVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { OPERATOR_BILLING_PAGE_LEAD } from "@/lib/marketing/marketing-public-pricing";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { OperatorBillingCurrentPlanSummary } from "./OperatorBillingCurrentPlanSummary";
import { OperatorBillingPaymentPastDueBanner } from "./OperatorBillingPaymentPastDueBanner";
import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";
import { OperatorBillingUsageSection } from "./OperatorBillingUsageSection";
import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";

export function OperatorBillingSettingsClient(props: { readonly initialPlanId?: string | null }) {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;

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

      <section id="billing-plans" className="scroll-mt-24 space-y-4">
        <h2 className={OPERATOR_NAV_GROUP_LABEL}>Available plans</h2>
        <OperatorBillingPlansClient initialPlanId={props.initialPlanId ?? null} />
      </section>

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
