"use client";

import { OperatorBillingCurrentPlanSummary } from "./OperatorBillingCurrentPlanSummary";
import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";
import { OperatorBillingUsageSection } from "./OperatorBillingUsageSection";
import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function OperatorBillingSettingsClient() {
  return (
    <div className="w-full max-w-[1440px] space-y-8 px-4 py-8" data-testid="operator-billing-plans-page">
      <header className="space-y-2">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Billing &amp; plans</h1>
        <p className={cn("max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
          Review your current plan, compare Team, Professional, and Enterprise packaging, and manage usage credits and
          payment settings.
        </p>
      </header>

      <OperatorBillingCurrentPlanSummary />

      <section id="billing-plans" className="scroll-mt-24 space-y-4">
        <h2 className={OPERATOR_NAV_GROUP_LABEL}>Plans</h2>
        <OperatorBillingPlansClient />
      </section>

      <OperatorBillingUsageSection />

      <OperatorBillingWalletPanel />
    </div>
  );
}
