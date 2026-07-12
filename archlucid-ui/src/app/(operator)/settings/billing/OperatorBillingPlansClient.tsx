"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import {
  MARKETING_PRICING_RECOMMENDED_TIER,
  OPERATOR_BILLING_CATALOG_NOTE,
  OPERATOR_BILLING_TIER_CTAS,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";
import {
  buildOperatorBillingAddonLines,
  buildOperatorBillingPlanSummaryLines,
  formatPlanPrice,
  sortPricingPackages,
} from "@/lib/pricing-catalog-display";
import { fetchPricingCatalog } from "@/lib/pricing-catalog-client";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";
import { showInfo } from "@/lib/toast";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function PlanSummaryLines(props: { pricing: PricingDoc; pkg: PricingPackage }) {
  const lines = buildOperatorBillingPlanSummaryLines(props.pricing, props.pkg);

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

function PlanAddonDetails(props: { pricing: PricingDoc; pkg: PricingPackage }) {
  const addonLines = buildOperatorBillingAddonLines(props.pricing, props.pkg);

  if (addonLines.length === 0) {
    return null;
  }

  return (
    <details className="rounded-md border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
      <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        Usage and add-ons
      </summary>
      <dl className={cn("mt-2 space-y-1", OPERATOR_TYPOGRAPHY.helper)}>
        {addonLines.map((line) => (
          <div key={line.label} className="flex justify-between gap-2">
            <dt>{line.label}</dt>
            <dd className="font-medium tabular-nums">{line.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export function OperatorBillingPlansClient() {
  const [pricing, setPricing] = useState<PricingDoc | null>(null);
  const [pricingError, setPricingError] = useState(false);

  const loadPricing = useCallback(async () => {
    try {
      setPricing(await fetchPricingCatalog());
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
    showInfo("Self-serve checkout is coming soon. Contact sales if you need to upgrade before checkout ships.");
  }, []);

  return (
    <div className="space-y-4">
      <p className={cn("m-0 max-w-3xl", OPERATOR_TYPOGRAPHY.helper)}>
        {OPERATOR_BILLING_CATALOG_NOTE}{" "}
        <Link href="/pricing" className={OPERATOR_LINK.nav}>
          View public pricing
        </Link>
        .
      </p>

      {pricingError ? (
        <p className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)} role="alert">
          Pricing data failed to load. Retry later or visit the{" "}
          <Link href="/pricing" className={OPERATOR_LINK.nav}>
            public pricing page
          </Link>
          .
        </p>
      ) : null}

      {!pricing && !pricingError ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading plans…</p>
      ) : null}

      {pricing !== null && !pricingError ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {sortPricingPackages(pricing.packages).map((pkg) => {
            const tierId = pkg.id as MarketingPricingTierId;
            const cta = OPERATOR_BILLING_TIER_CTAS[tierId];
            const bullets = BILLING_TIER_FEATURE_BULLETS[pkg.id] ?? [];
            const isRecommended = tierId === MARKETING_PRICING_RECOMMENDED_TIER;

            return (
              <Card
                key={pkg.id}
                className={cn(
                  "flex flex-col",
                  isRecommended ? "border-teal-600 ring-1 ring-teal-600/20 dark:border-teal-500" : null,
                )}
                data-testid={`billing-tier-${pkg.id}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className={OPERATOR_TYPOGRAPHY.pageTitle}>
                    {pkg.title}
                    {isRecommended ? (
                      <span className={cn("ms-2 align-middle font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200", OPERATOR_TYPOGRAPHY.helper)}>
                        Recommended
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription>{pkg.summary}</CardDescription>
                  <p className={cn("m-0 pt-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)} data-testid={`billing-tier-price-${pkg.id}`}>
                    {formatPlanPrice(pkg, pricing.currency)}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                  <PlanSummaryLines pricing={pricing} pkg={pkg} />
                  <PlanAddonDetails pricing={pricing} pkg={pkg} />
                  <div>
                    <p className={cn("mb-2", OPERATOR_NAV_GROUP_LABEL)}>Highlights</p>
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
                    variant={tierId === "architect" || isRecommended ? "primary" : "outline"}
                    className="w-full"
                    onClick={onPlaceholderCommercialAction}
                  >
                    {cta?.primaryLabel ?? "Contact us"}
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
