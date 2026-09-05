"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import { startMarketingPlanBillingCheckout } from "@/lib/billing-checkout-client";
import { isSelfServeBillingCheckoutPlan } from "@/lib/billing-checkout-tier-map";
import {
  OPERATOR_BILLING_CATALOG_NOTE,
  OPERATOR_BILLING_RECOMMENDED_TIER,
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
import { clearFrictionlessTrialSessionForAuthenticatedOperator } from "@/lib/operator/operator-frictionless-trial-session-cleanup";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { OperatorBillingCheckoutConfirmDialog } from "./OperatorBillingCheckoutConfirmDialog";
import {
  billingCheckoutConfirmHrefFromSearch,
  parseBillingCheckoutConfirmOpenFromSearch,
} from "@/lib/administration/billing-checkout-confirm-url";
import {
  billingPlanAddonsHrefFromSearch,
  parseBillingPlanAddonsOpenFromSearch,
} from "@/lib/administration/billing-plan-addons-url";
import { SETTINGS_BILLING_PATH } from "@/lib/billing-and-plans-help-route";

function buildSalesLedPricingHref(tierId: MarketingPricingTierId): string {
  return `/pricing?source=operator-billing&tier=${encodeURIComponent(tierId)}#pricing-quote-request`;
}

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

function PlanAddonDetails(props: {
  pricing: PricingDoc;
  pkg: PricingPackage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addonLines = buildOperatorBillingAddonLines(props.pricing, props.pkg);

  if (addonLines.length === 0) {
    return null;
  }

  return (
    <details
      className="rounded-md border border-neutral-200 bg-neutral-50/70 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
      open={props.open}
      onToggle={(event) => {
        props.onOpenChange((event.currentTarget as HTMLDetailsElement).open);
      }}
    >
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

type PendingCheckout = {
  readonly tierId: MarketingPricingTierId;
  readonly pkg: PricingPackage;
};

type OperatorBillingPlansClientProps = {
  readonly initialPlanId?: string | null;
};

export function OperatorBillingPlansClient(props: OperatorBillingPlansClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? SETTINGS_BILLING_PATH;
  const searchParams = useSearchParams();
  const urlCheckoutConfirm = parseBillingCheckoutConfirmOpenFromSearch(searchParams.get("checkoutConfirm"));
  const billingPlanAddonsOpenParam = searchParams.get("billingPlanAddonsOpen");
  const [pricing, setPricing] = useState<PricingDoc | null>(null);
  const [pricingError, setPricingError] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState<MarketingPricingTierId | null>(null);
  const [checkoutSuccessMessage, setCheckoutSuccessMessage] = useState<string | null>(null);
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState<string | null>(null);
  const [pendingCheckout, setPendingCheckoutState] = useState<PendingCheckout | null>(null);
  const checkoutInFlightRef = useRef(false);

  const syncCheckoutConfirmToUrl = useCallback(
    (confirmOpen: boolean, tierId: MarketingPricingTierId | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (confirmOpen && tierId !== null) {
        params.set("plan", tierId);
      }

      router.replace(
        billingCheckoutConfirmHrefFromSearch(params.toString(), confirmOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingCheckout = useCallback(
    (value: PendingCheckout | null) => {
      setPendingCheckoutState(value);
      syncCheckoutConfirmToUrl(value !== null, value?.tierId ?? null);
    },
    [syncCheckoutConfirmToUrl],
  );

  const selectedPlanRaw = props.initialPlanId ?? searchParams.get("plan");
  const selectedPlanId =
    typeof selectedPlanRaw === "string" && isMarketingPricingTierId(selectedPlanRaw) ? selectedPlanRaw : null;
  const planAddonsOpen = parseBillingPlanAddonsOpenFromSearch(billingPlanAddonsOpenParam);

  const syncPlanAddonsOpenToUrl = useCallback(
    (tierId: MarketingPricingTierId, open: boolean) => {
      const params = new URLSearchParams(searchParams.toString());

      if (open) {
        params.set("plan", tierId);
      }

      router.replace(
        billingPlanAddonsHrefFromSearch(params.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!urlCheckoutConfirm || selectedPlanId === null || pricing === null) {
      if (!urlCheckoutConfirm && pendingCheckout !== null) {
        setPendingCheckoutState(null);
      }

      return;
    }

    const pkg = pricing.packages.find((row) => row.id === selectedPlanId);

    if (pkg === undefined) {
      return;
    }

    if (pendingCheckout?.tierId === selectedPlanId) {
      return;
    }

    setPendingCheckoutState({ tierId: selectedPlanId, pkg });
  }, [pendingCheckout?.tierId, pricing, selectedPlanId, urlCheckoutConfirm]);

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
      clearFrictionlessTrialSessionForAuthenticatedOperator();
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
        setPendingCheckout(null);
      }
    },
    [setPendingCheckout],
  );

  const onRequestCheckout = useCallback((tierId: MarketingPricingTierId, pkg: PricingPackage) => {
    setCheckoutErrorMessage(null);
    setPendingCheckout({ tierId, pkg });
  }, [setPendingCheckout]);

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

      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
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
            const isRecommended = tierId === OPERATOR_BILLING_RECOMMENDED_TIER;
            const isSelected = selectedPlanId === tierId;
            const isCheckoutLoading = checkoutPlanId === tierId;
            const selfServe = isSelfServeBillingCheckoutPlan(tierId);
            const priceLabel = formatPlanPrice(pkg, pricing.currency);
            const effectiveCaption = `Effective ${formatPricingCatalogEffectiveDate(pricing.effectiveDate)} · ${pricing.currency}`;

            return (
              <Card
                key={pkg.id}
                className={cn(
                  "flex flex-col",
                  isRecommended ? "border-neutral-500 ring-1 ring-neutral-400/20 dark:border-neutral-500" : null,
                  isSelected ? "ring-2 ring-neutral-500/40 dark:ring-neutral-400/50" : null,
                )}
                data-testid={`billing-tier-${pkg.id}`}
              >
                <CardHeader className="pb-2">
                  <p
                    className={cn("m-0 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                    data-testid={`billing-tier-price-${pkg.id}`}
                  >
                    {priceLabel}
                  </p>
                  <p className={cn("m-0 pt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{effectiveCaption}</p>
                  <CardTitle className={cn("pt-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {pkg.title}
                    {isRecommended ? (
                      <span
                        className={cn(
                          "ms-2 align-middle font-semibold uppercase tracking-wide text-al-text-secondary dark:text-neutral-200",
                          OPERATOR_TYPOGRAPHY.helper,
                        )}
                      >
                        Recommended
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription>{pkg.summary}</CardDescription>
                  {!selfServe ? (
                    <p className={cn("m-0 pt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      Sales-led — request a quote on public pricing.
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                  <PlanSummaryLines pricing={pricing} pkg={pkg} />
                  <PlanAddonDetails
                    pricing={pricing}
                    pkg={pkg}
                    open={planAddonsOpen && selectedPlanId === tierId}
                    onOpenChange={(open) => {
                      syncPlanAddonsOpenToUrl(tierId, open);
                    }}
                  />
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
                      onClick={() => onRequestCheckout(tierId, pkg)}
                    />
                  ) : (
                    <Button asChild type="button" variant="outline" className="w-full">
                      <Link href={buildSalesLedPricingHref(tierId)}>{cta?.primaryLabel ?? "Contact us"}</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : null}

      <OperatorBillingCheckoutConfirmDialog
        open={pendingCheckout !== null}
        tierId={pendingCheckout?.tierId ?? null}
        pkg={pendingCheckout?.pkg ?? null}
        pricing={pricing}
        busy={checkoutPlanId !== null}
        onCancel={() => setPendingCheckout(null)}
        onConfirm={() => {
          if (pendingCheckout === null) {
            return;
          }

          void onStartCheckout(pendingCheckout.tierId, pendingCheckout.pkg);
        }}
      />
    </div>
  );
}
