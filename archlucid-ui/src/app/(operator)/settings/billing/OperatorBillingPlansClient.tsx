"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import { buildOperatorBillingPricingLines } from "@/lib/operator-billing-pricing-lines";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";
import { showInfo } from "@/lib/toast";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function PricingLines(props: { pricing: PricingDoc; pkg: PricingPackage }) {
  const lines = buildOperatorBillingPricingLines(props.pricing, props.pkg);

  return (
    <dl className={cn("space-y-1 border-t border-neutral-200 pt-4 text-neutral-800 dark:border-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
      {lines.map((line) => (
        <div key={line.label} className="flex justify-between gap-2">
          <dt>{line.label}</dt>
          <dd className="font-medium tabular-nums">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function tierPrimaryActionLabel(pkg: PricingPackage): string {
  if (pkg.id === "enterprise") {
    return "Talk to sales — Enterprise";
  }

  if (pkg.id === "professional") {
    return "Upgrade to Professional";
  }

  return "Upgrade to Team";
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

  const onPlaceholderCommercialAction = useCallback(() => {
    showInfo("Stripe Checkout Integration Pending");
  }, []);

  return (
    <div className="space-y-4">
      {pricingError ? (
        <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          Pricing data failed to load. Retry later or visit the public pricing page.
        </p>
      ) : null}

      {!pricing && !pricingError ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading plans…</p>
      ) : null}

      {pricing !== null && !pricingError ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {pricing.packages.map((pkg) => {
            const bullets = BILLING_TIER_FEATURE_BULLETS[pkg.id] ?? [];

            return (
              <Card key={pkg.id} className="flex flex-col" data-testid={`billing-tier-${pkg.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className={OPERATOR_TYPOGRAPHY.pageTitle}>{pkg.title}</CardTitle>
                  <CardDescription>
                    {pkg.id === "enterprise"
                      ? "Annual contract for high-volume reviews, custom policy packs, and enterprise support."
                      : pkg.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                  <PricingLines pricing={pricing} pkg={pkg} />
                  {pkg.id === "enterprise" ? (
                    <p className={OPERATOR_TYPOGRAPHY.helper}>
                      Contact sales for volume, retention, and support options tailored to your organization.
                    </p>
                  ) : null}
                  <div>
                    <p className={cn("mb-2", OPERATOR_NAV_GROUP_LABEL)}>
                      Highlights
                    </p>
                    <ul className={cn("list-disc space-y-1.5 pl-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                      {bullets.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto flex-col gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <Button
                    type="button"
                    variant={pkg.id === "team" ? "primary" : "outline"}
                    className="w-full"
                    onClick={onPlaceholderCommercialAction}
                  >
                    {tierPrimaryActionLabel(pkg)}
                  </Button>
                  <p className={cn("text-center", OPERATOR_TYPOGRAPHY.micro)}>
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
