"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import { startMarketingPlanBillingCheckout } from "@/lib/billing-checkout-client";
import { isSelfServeBillingCheckoutPlan } from "@/lib/billing-checkout-tier-map";
import {
  MARKETING_PRICING_RECOMMENDED_TIER,
  OPERATOR_BILLING_CATALOG_NOTE,
  OPERATOR_BILLING_TIER_CTAS,
  isMarketingPricingTierId,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";
import {
  buildOperatorBillingAddonLines,
  buildOperatorBillingPlanSummaryLines,
  formatPlanPrice,
  formatPricingCatalogEffectiveDate,
  sortPricingPackages,
} from "@/lib/pricing-catalog-display";
import { fetchPricingCatalog } from "@/lib/pricing-catalog-client";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";
import {
  BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
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

type OperatorBillingPlansClientProps = {
  readonly initialPlanId?: string | null;
};

export function OperatorBillingPlansClient(props: OperatorBillingPlansClientProps) {
  const searchParams = useSearchParams();
  const [pricing, setPricing] = useState<PricingDoc | null>(null);
  const [pricingError, setPricingError] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<MarketingPricingTierId | null>(null);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const checkoutInFlightRef = useRef(false);

  const selectedPlanRaw = props.initialPlanId ?? searchParams.get("plan");
  const selectedPlanId =
    typeof selectedPlanRaw === "string" && isMarketingPricingTierId(selectedPlanRaw) ? selectedPlanRaw : null;

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

  useEffect(() => {
    const checkoutState = searchParams.get("checkout");

    if (checkoutState === "success") {
      setCheckoutSuccessMessage(BILLING_CHECKOUT_COMPLETED_SUCCESS_MESSAGE);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedPlanId === null) {
      return;
    }

    const card = document.querySelector(`[data-testid="billing-tier-${selectedPlanId}"]`);

    if (card instanceof HTMLElement) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [pricing, selectedPlanId]);

  const onSalesLedPlanAction = useCallback((tierId: MarketingPricingTierId) => {
    if (tierId === "enterprise") {
      showInfo("Enterprise packaging is sales-led. Use the quote form on public pricing or contact sales.");

      return;
    }

    showInfo("Professional guided trials are sales-led. Request a quote on public pricing or contact sales.");
  }, []);

  const onStartCheckout = useCallback(
    async (tierId: MarketingPricingTierId, pkg: PricingPackage) => {
      if (checkoutInFlightRef.current) {
        return;
      }

      checkoutInFlightRef.current = true;
      setCheckoutPlanId(tierId);
      setCheckoutErrorMessage(null);
      setCheckoutSuccessMessage(null);

      try {
        const result = await startMarketingPlanBillingCheckout({
          planId: tierId,
          seats: pkg.includedUsers ?? 1,
          workspaces: pkg.includedWorkspaces ?? 1,
        });

        if (result.outcome === "not_configured" || result.outcome === "accepted") {
          setCheckoutSuccessMessage(result.message);
        } else if (result.outcome === "failed") {
          setCheckoutErrorMessage(result.message);
        }
      } finally {
        checkoutInFlightRef.current = false;
        setCheckoutPlanId(null);
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      {checkoutSuccessMessage !== null ? (
        <OperatorSuccessCallout
          message={checkoutSuccessMessage}
          testId="billing-checkout-success-callout"
          onDismiss={() => setCheckoutSuccessMessage(null)}
        />
      ) : null}

      {checkoutErrorMessage !== null ? (
        <OperatorMutationInlineError
          message={checkoutErrorMessage}
          testId="billing-checkout-inline-error"
        />
      ) : null}

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
            const isSelected = selectedPlanId === tierId;
            const isCheckoutLoading = checkoutPlanId === tierId;
            const selfServe = isSelfServeBillingCheckoutPlan(tierId);

            return (
              <Card
                key={pkg.id}
                className={cn(
                  "flex flex-col",
                  isRecommended ? "border-teal-600 ring-1 ring-teal-600/20 dark:border-teal-500" : null,
                  isSelected ? "ring-2 ring-teal-700/40 dark:ring-teal-400/50" : null,
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
                  {selfServe ? (
                    <AsyncActionButton
                      type="button"
                      variant={tierId === "architect" || isRecommended ? "primary" : "outline"}
                      className="w-full"
                      idleLabel={cta?.primaryLabel ?? "Upgrade plan"}
                      loadingLabel="Opening checkout…"
                      isLoading={isCheckoutLoading}
                      onClick={() => {
                        void onStartCheckout(tierId, pkg);
                      }}
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => onSalesLedPlanAction(tierId)}
                    >
                      {cta?.primaryLabel ?? "Contact us"}
                    </Button>
                  )}
                  <p className={cn("text-center", OPERATOR_TYPOGRAPHY.micro)}>
                    Effective {formatPricingCatalogEffectiveDate(pricing.effectiveDate)} · {pricing.currency}
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
