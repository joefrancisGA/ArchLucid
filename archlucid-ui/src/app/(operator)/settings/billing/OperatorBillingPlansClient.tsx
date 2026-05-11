"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";
import { showInfo } from "@/lib/toast";

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function PricingLines(props: { pricing: PricingDoc; pkg: PricingPackage }) {
  const { pricing, pkg } = props;

  return (
    <dl className="space-y-1 border-t border-neutral-200 pt-4 text-sm text-neutral-800 dark:border-neutral-700 dark:text-neutral-200">
      {typeof pkg.workspaceMonthlyUsd === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Workspace platform</dt>
          <dd className="font-medium tabular-nums">{formatMoney(pkg.workspaceMonthlyUsd, pricing.currency)} / mo</dd>
        </div>
      ) : null}
      {typeof pkg.maxWorkspaces === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Workspaces (cap)</dt>
          <dd className="tabular-nums">{pkg.maxWorkspaces}</dd>
        </div>
      ) : null}
      {typeof pkg.seatMonthlyUsd === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Architect seat (beyond included allocation)</dt>
          <dd className="font-medium tabular-nums">{formatMoney(pkg.seatMonthlyUsd, pricing.currency)} / seat / mo</dd>
        </div>
      ) : null}
      {typeof pkg.includedArchitectSeats === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Architect seats (included)</dt>
          <dd className="tabular-nums">Up to {pkg.includedArchitectSeats}</dd>
        </div>
      ) : null}
      {typeof pkg.includedRunsPerMonth === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Runs / month (included)</dt>
          <dd className="tabular-nums">{pkg.includedRunsPerMonth}</dd>
        </div>
      ) : null}
      {typeof pkg.overageRunUsd === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Run overage</dt>
          <dd className="tabular-nums">{formatMoney(pkg.overageRunUsd, pricing.currency)} / run</dd>
        </div>
      ) : null}
      {typeof pkg.annualFloorUsd === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Annual contract from</dt>
          <dd className="font-medium tabular-nums">{formatMoney(pkg.annualFloorUsd, pricing.currency)}</dd>
        </div>
      ) : null}
      {typeof pkg.annualCeilingUsd === "number" ? (
        <div className="flex justify-between gap-2">
          <dt>Typical land range (to)</dt>
          <dd className="tabular-nums">{formatMoney(pkg.annualCeilingUsd, pricing.currency)} / yr</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function OperatorBillingPlansClient() {
  const [pricing, setPricing] = useState<PricingDoc | null>(null);
  const [pricingError, setPricingError] = useState(false);

  const loadPricing = useCallback(async () => {
    try {
      const res = await fetch("/pricing.json", { cache: "no-store" });

      if (!res.ok) {
        throw new Error(String(res.status));
      }

      setPricing((await res.json()) as PricingDoc);
      setPricingError(false);
    } catch {
      setPricing(null);
      setPricingError(true);
    }
  }, []);

  useEffect(() => {
    void loadPricing();
  }, [loadPricing]);

  const onUpgradeToTeam = useCallback(() => {
    showInfo("Stripe Checkout Integration Pending");
  }, []);

  const onPlaceholderCommercialAction = useCallback(() => {
    showInfo("Stripe Checkout Integration Pending");
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8" data-testid="operator-billing-plans-page">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Billing & plans
        </h1>
        <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          Compare Team, Professional, and Enterprise packaging. Figures mirror{" "}
          <Link
            className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
          >
            public pricing
          </Link>{" "}
          (<span className="font-mono">pricing.json</span>). Checkout is not wired from this workspace yet.
        </p>
      </header>

      {pricingError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Pricing data failed to load. Retry later or visit the public pricing page.
        </p>
      ) : null}

      {!pricing && !pricingError ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading plans…</p>
      ) : null}

      {pricing !== null && !pricingError ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {pricing.packages.map((pkg) => {
            const bullets = BILLING_TIER_FEATURE_BULLETS[pkg.id] ?? [];

            return (
              <Card key={pkg.id} className="flex flex-col" data-testid={`billing-tier-${pkg.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{pkg.title}</CardTitle>
                  <CardDescription>{pkg.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                  <PricingLines pricing={pricing} pkg={pkg} />
                  {pkg.id === "team" ? (
                    <p className="text-xs leading-snug text-neutral-600 dark:text-neutral-400">
                      Self-serve Stripe Checkout will use a single bundled Team subscription (currently modeled at{" "}
                      <strong className="font-medium text-neutral-800 dark:text-neutral-200">$249</strong> / mo) until
                      workspace + seat line items ship; quotes and order forms still use decomposed list fees.
                    </p>
                  ) : null}
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Highlights
                    </p>
                    <ul className="list-disc space-y-1.5 pl-4 text-sm text-neutral-700 dark:text-neutral-300">
                      {bullets.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  {pkg.id === "team" ? (
                    <Button type="button" variant="primary" className="w-full" onClick={onUpgradeToTeam}>
                      Upgrade to Team
                    </Button>
                  ) : null}
                  {pkg.id === "professional" ? (
                    <Button type="button" variant="outline" className="w-full" onClick={onPlaceholderCommercialAction}>
                      Upgrade to Professional
                    </Button>
                  ) : null}
                  {pkg.id === "enterprise" ? (
                    <Button type="button" variant="outline" className="w-full" onClick={onPlaceholderCommercialAction}>
                      Talk to sales — Enterprise
                    </Button>
                  ) : null}
                  <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-500">
                    Effective {pricing.effectiveDate} · {pricing.currency}
                  </p>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
