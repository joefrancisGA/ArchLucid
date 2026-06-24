"use client";

import { OperatorBillingCurrentPlanSummary } from "./OperatorBillingCurrentPlanSummary";
import { OperatorBillingPlansClient } from "./OperatorBillingPlansClient";
import { OperatorBillingUsageSection } from "./OperatorBillingUsageSection";
import { OperatorBillingWalletPanel } from "./OperatorBillingWalletPanel";

export function OperatorBillingSettingsClient() {
  return (
    <div className="w-full max-w-[1440px] space-y-8 px-4 py-8" data-testid="operator-billing-plans-page">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-al-text-primary">Billing &amp; plans</h1>
        <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Review your current plan, compare Team, Professional, and Enterprise packaging, and manage usage credits and
          payment settings.
        </p>
      </header>

      <OperatorBillingCurrentPlanSummary />

      <section id="billing-plans" className="scroll-mt-24 space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Plans</h2>
        <OperatorBillingPlansClient />
      </section>

      <OperatorBillingUsageSection />

      <OperatorBillingWalletPanel />
    </div>
  );
}
