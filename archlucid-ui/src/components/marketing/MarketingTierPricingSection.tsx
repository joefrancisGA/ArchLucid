"use client";
import { cn } from "@/lib/utils";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

import { QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { StatusTag } from "@/components/StatusTag";
import { Button } from "@/components/ui/button";
import { useMarketingPublicPricingQuery } from "@/hooks/use-marketing-public-pricing-query";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { MarketingPricingEarlyAdopterBanner } from "@/components/marketing/MarketingPricingEarlyAdopterBanner";
import { MarketingPricingFitMatrix } from "@/components/marketing/MarketingPricingFitMatrix";
import { MarketingPricingUniversalIncludesStrip } from "@/components/marketing/MarketingPricingUniversalIncludesStrip";
import { isPublicStripeTeamCheckoutEnabled } from "@/lib/marketing/is-public-stripe-team-checkout-enabled";
import { buildMarketingSelfServeBillingHref } from "@/lib/marketing/marketing-billing-plan-href";
import {
  MARKETING_PRICING_TIER_BEST_FOR,
  MARKETING_PRICING_TIER_HIGHLIGHTS,
  buildMarketingPricingIncludedLines,
  resolveMarketingTierFitQualifier,
  resolveMarketingTierPrimaryCtaVariant,
} from "@/lib/marketing/marketing-pricing-tier-display";
import {
  MARKETING_PRICING_RECOMMENDED_TIER,
  MARKETING_PRICING_TIER_CTAS,
  isMarketingPricingTierId,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";
import type { PricingDoc } from "@/lib/pricing-types";
import { formatPlanPrice, pricingTierSortIndex } from "@/lib/pricing-catalog-display";

export type MarketingTierPricingSectionProps = {
  /** Element id for the section heading (accessibility). */
  sectionHeadingId: string;
  /** Visible section title. */
  sectionTitle: string;
  /** When false, omits the visible section heading (page hero owns the h1). */
  showSectionHeading?: boolean;
  /** Optional short intro under the title. */
  sectionIntro?: string;
  /** Primary CTA target (include UTM query string when desired). */
  signupHref: string;
  /** Visible label for the primary signup CTA button. */
  signupCallToActionLabel?: string;
  /** When false, omit the trailing signup button (e.g. welcome page already has a hero CTA). */
  showSignupCallToAction?: boolean;
  /** DOM id of the quote panel on the same page (Pro / Enterprise scroll target). */
  quoteSectionDomId?: string;
  /** When true, Team tier leads with quote even if self-serve checkout is enabled (trial nudge flow). */
  preferSalesLedQuoteCta?: boolean;
  /** When true, show the monthly AI credits explainer under the tier grid. */
  showAiUsageNote?: boolean;
  /**
   * Server-read `public/pricing.json`. When supplied, tiers render in the initial HTML and the
   * client fetch is skipped, so buyers never see the loading skeleton and mistake it for
   * unfinished placeholder content.
   */
  initialPricing?: PricingDoc | null;
};

/** Renders tier cards from server-supplied pricing, falling back to a client `/pricing.json` fetch. */
export function MarketingTierPricingSection(props: MarketingTierPricingSectionProps): React.JSX.Element {
  const [queryClient] = useState(() => getOperatorQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MarketingTierPricingSectionInner {...props} />
    </QueryClientProvider>
  );
}

function MarketingTierPricingSectionInner(props: MarketingTierPricingSectionProps): React.JSX.Element {
  const quoteSectionDomId = props.quoteSectionDomId ?? "pricing-quote-request";
  const [quotePanelOnPage, setQuotePanelOnPage] = useState(false);
  const initialPricing = props.initialPricing ?? null;
  const shouldFetch = initialPricing === null;
  const pricingQuery = useMarketingPublicPricingQuery({ enabled: shouldFetch });
  const pricing = initialPricing ?? pricingQuery.data ?? null;
  const pricingError = shouldFetch && pricingQuery.isError;
  const pricingLoading = shouldFetch && pricingQuery.isPending;
  const selfServeCheckoutEnabled = isPublicStripeTeamCheckoutEnabled();

  const focusQuotePanel = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }

    const panel = document.getElementById(quoteSectionDomId);

    if (panel === null) {
      return;
    }

    panel.setAttribute("tabindex", "-1");
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [quoteSectionDomId]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setQuotePanelOnPage(document.getElementById(quoteSectionDomId) !== null);
  }, [quoteSectionDomId]);

  const quoteButtonAriaControls = quotePanelOnPage ? quoteSectionDomId : undefined;

  return (
    <section
      aria-labelledby={props.showSectionHeading !== false ? props.sectionHeadingId : undefined}
      aria-label={props.showSectionHeading === false ? "Pricing tiers" : undefined}
      className="mb-10"
    >
      {props.showSectionHeading !== false ? (
        <h2 id={props.sectionHeadingId} className={cn("mb-2 font-semibold tracking-tight text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}>
          {props.sectionTitle}
        </h2>
      ) : null}
      {props.sectionIntro ? (
        <p className={cn("mb-6 max-w-3xl text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.lead)}>{props.sectionIntro}</p>
      ) : null}

      {pricingError ? (
        <p className={cn("text-red-600", MARKETING_TYPOGRAPHY.body)} role="alert">
          Pricing data is temporarily unavailable.
        </p>
      ) : null}

      {pricingLoading && !pricingError ? (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading pricing tiers">
          {[0, 1, 2, 3].map((slot) => (
            <li
              key={slot}
              className="flex min-h-[22rem] animate-pulse flex-col rounded-lg border border-neutral-200 bg-neutral-100/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/60"
              data-testid="pricing-tier-skeleton"
            >
              <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-4 h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-2 h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="mt-6 flex-1 space-y-2">
                <div className="h-3 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-3 w-11/12 rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-3 w-10/12 rounded bg-neutral-200 dark:bg-neutral-700" />
              </div>
              <div className="mt-6 h-10 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            </li>
          ))}
        </ul>
      ) : null}

      {pricing && !pricingError ? (
        <>
          <MarketingPricingUniversalIncludesStrip />
          <ul className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[...pricing.packages]
              .sort((a, b) => pricingTierSortIndex(a.id) - pricingTierSortIndex(b.id))
              .map((pkg) => {
                const tierId: MarketingPricingTierId | null = isMarketingPricingTierId(pkg.id) ? pkg.id : null;
                const cta = tierId !== null ? MARKETING_PRICING_TIER_CTAS[tierId] : undefined;
                const isRecommended = tierId === MARKETING_PRICING_RECOMMENDED_TIER;
                const includedLines = buildMarketingPricingIncludedLines(pkg);
                const highlights = tierId !== null ? MARKETING_PRICING_TIER_HIGHLIGHTS[tierId] : [];
                const bestFor = tierId !== null ? MARKETING_PRICING_TIER_BEST_FOR[tierId] : null;
                const primaryCtaVariant =
                  tierId !== null ? resolveMarketingTierPrimaryCtaVariant(tierId, isRecommended) : "primary";
                const fitQualifier = tierId !== null ? resolveMarketingTierFitQualifier(tierId) : null;
                const billingHref =
                  tierId !== null && selfServeCheckoutEnabled
                    ? buildMarketingSelfServeBillingHref(tierId)
                    : null;

                return (
                  <li
                    key={pkg.id}
                    data-testid={pkg.id === "team" ? "pricing-tier-team" : pkg.id === "architect" ? "pricing-tier-architect" : undefined}
                    className={
                      isRecommended
                        ? "relative z-10 flex h-full flex-col rounded-lg border-2 border-teal-600 border-t-4 border-t-teal-700 bg-white p-5 shadow-md ring-1 ring-teal-600/20 xl:scale-[1.02] dark:border-teal-500 dark:border-t-teal-400 dark:bg-neutral-900 dark:ring-teal-500/25"
                        : pkg.id === "enterprise"
                          ? "flex h-full flex-col rounded-lg border border-teal-700/80 bg-white p-5 shadow-sm dark:border-teal-800 dark:bg-neutral-900"
                          : "flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    }
                  >
                    <div className="flex flex-1 flex-col">
                      {isRecommended ? (
                        <div className="mb-2">
                          <StatusTag kind="ready" label="Recommended" />
                        </div>
                      ) : null}
                      <h3 className={cn("text-lg font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                        {pkg.title}
                      </h3>
                      {fitQualifier !== null ? (
                        <p className={cn("mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{fitQualifier}</p>
                      ) : null}
                      <p
                        className={cn("mt-4 text-2xl font-semibold tracking-tight text-al-text-primary sm:text-[1.75rem]", MARKETING_TYPOGRAPHY.cardTitle)}
                        data-testid={`pricing-tier-price-${pkg.id}`}
                      >
                        {formatPlanPrice(pkg, pricing.currency)}
                      </p>
                      {bestFor !== null ? (
                        <div className="mt-5 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                          <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                            Best for
                          </p>
                          <p className={cn("m-0 mt-2 text-base font-medium leading-snug text-al-text-primary sm:text-lg", MARKETING_TYPOGRAPHY.body)}>
                            {bestFor}
                          </p>
                        </div>
                      ) : (
                        <p className={cn("mt-4 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}>{pkg.summary}</p>
                      )}
                      {includedLines.length > 0 ? (
                        <div className="mt-5 min-h-[5.5rem]">
                          <p className={cn("m-0 font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                            Included
                          </p>
                          <ul className={cn("m-0 mt-2 list-none space-y-1 p-0 text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.meta)}>
                            {includedLines.map((line) => (
                              <li key={line} className="flex gap-2">
                                <span aria-hidden className="text-al-text-secondary dark:text-neutral-300">
                                  ✓
                                </span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {highlights.length > 0 ? (
                        <div className="mt-4 min-h-[5.5rem]">
                          <p className={cn("m-0 font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>
                            Highlights
                          </p>
                          <ul className={cn("m-0 mt-2 list-none space-y-1 p-0 text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.meta)}>
                            {highlights.map((line) => (
                              <li key={line} className="flex gap-2">
                                <span aria-hidden className="text-al-text-secondary dark:text-neutral-300">
                                  ✓
                                </span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                    {cta !== undefined ? (
                    <div className="mt-auto flex min-h-[3.25rem] flex-col items-stretch justify-end gap-2 pt-5">
                      {cta.primaryKind === "quote" ? (
                        <Button
                          type="button"
                          variant={primaryCtaVariant}
                          size="default"
                          className="w-full"
                          aria-controls={quoteButtonAriaControls}
                          onClick={() => focusQuotePanel()}
                        >
                          {cta.primaryLabel}
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && props.preferSalesLedQuoteCta ? (
                        <Button
                          type="button"
                          variant={primaryCtaVariant}
                          size="default"
                          className="w-full"
                          aria-controls={quoteButtonAriaControls}
                          onClick={() => focusQuotePanel()}
                        >
                          {cta.primaryLabel}
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && !props.preferSalesLedQuoteCta && billingHref !== null ? (
                        <Button asChild variant={primaryCtaVariant} size="default" className="w-full">
                          <Link
                            data-testid={pkg.id === "team" ? "pricing-team-subscribe-stripe" : `pricing-${pkg.id}-subscribe-stripe`}
                            href={billingHref}
                          >
                            {cta.primaryLabel}
                          </Link>
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && !props.preferSalesLedQuoteCta && billingHref === null ? (
                        <Button asChild variant={primaryCtaVariant} size="default" className="w-full">
                          <Link href={props.signupHref}>{cta.primaryLabel}</Link>
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && !props.preferSalesLedQuoteCta && billingHref !== null ? (
                        <Button asChild variant="outline" className="w-full">
                          <Link href={props.signupHref}>{cta.secondaryLabel ?? "Start now"}</Link>
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && props.preferSalesLedQuoteCta && billingHref !== null ? (
                        <Button asChild variant="outline" className="w-full">
                          <Link
                            data-testid="pricing-team-subscribe-stripe"
                            href={billingHref}
                          >
                            {cta.primaryLabel}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                    ) : null}
                  </li>
                );
              })}
          </ul>
          <MarketingPricingFitMatrix />
          <MarketingPricingEarlyAdopterBanner showAiUsageNote={props.showAiUsageNote === true} />
          {props.showSignupCallToAction !== false ? (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="primary" size="lg">
                <Link href={props.signupHref}>{props.signupCallToActionLabel ?? "Start now"}</Link>
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
