"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import { isPublicStripeTeamCheckoutEnabled } from "@/lib/marketing/is-public-stripe-team-checkout-enabled";
import {
  BUYER_MARKETING_PRICING_AI_USAGE_NOTE,
  MARKETING_PRICING_RECOMMENDED_TIER,
  MARKETING_PRICING_TIER_CTAS,
  isMarketingPricingTierId,
  type MarketingPricingTierId,
} from "@/lib/marketing/marketing-public-pricing";
import type { PricingDoc, PricingPackage } from "@/lib/pricing-types";
import {
  formatIncludedUsersAndWorkspaces,
  formatMonthlyAiCredits,
  formatPlanPrice,
  pricingTierSortIndex,
} from "@/lib/pricing-catalog-display";
import { looksStripeHostedTestCheckoutUrl, resolveTeamStripeCheckoutHref } from "@/lib/team-stripe-checkout-url";

function resolveStripeCheckoutHref(pricing: PricingDoc, tierId: MarketingPricingTierId): string | null {
  if (!isPublicStripeTeamCheckoutEnabled()) {
    return null;
  }

  if (tierId === "architect") {
    return resolveTeamStripeCheckoutHref(pricing.architectStripeCheckoutUrl);
  }

  if (tierId === "team") {
    return resolveTeamStripeCheckoutHref(pricing.teamStripeCheckoutUrl);
  }

  return null;
}

function stripeSubscribeLabel(checkoutHref: string): string {
  return looksStripeHostedTestCheckoutUrl(checkoutHref) ? "Subscribe (Stripe test)" : "Subscribe with Stripe";
}

export type MarketingTierPricingSectionProps = {
  /** Element id for the section heading (accessibility). */
  sectionHeadingId: string;
  /** Visible section title. */
  sectionTitle: string;
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
  /** When true, Team tier leads with quote even if Stripe test checkout is enabled (trial nudge flow). */
  preferSalesLedQuoteCta?: boolean;
  /** When true, show the monthly AI credits explainer under the tier grid. */
  showAiUsageNote?: boolean;
};

/** Loads `/pricing.json` and renders tier cards — shared by welcome and `/pricing`. */
export function MarketingTierPricingSection(props: MarketingTierPricingSectionProps): React.JSX.Element {
  const quoteSectionDomId = props.quoteSectionDomId ?? "pricing-quote-request";
  const [pricing, setPricing] = useState<PricingDoc | null>(null);
  const [pricingError, setPricingError] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(true);

  const scrollToQuote = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.getElementById(quoteSectionDomId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [quoteSectionDomId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/pricing.json", { cache: "no-store" });

        if (!res.ok) {
          throw new Error(String(res.status));
        }

        const json = (await res.json()) as PricingDoc;

        if (!cancelled) {
          setPricing(json);
          setPricingLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPricingError(true);
          setPricingLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby={props.sectionHeadingId} className="mb-10">
      <h2 id={props.sectionHeadingId} className={cn("mb-2 font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
        {props.sectionTitle}
      </h2>
      {props.sectionIntro ? (
        <p className={cn("mb-6 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{props.sectionIntro}</p>
      ) : null}

      {pricingError ? (
        <p className={cn("text-red-600", OPERATOR_TYPOGRAPHY.body)} role="alert">
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
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[...pricing.packages]
              .sort((a, b) => pricingTierSortIndex(a.id) - pricingTierSortIndex(b.id))
              .map((pkg) => {
                const tierId: MarketingPricingTierId | null = isMarketingPricingTierId(pkg.id) ? pkg.id : null;
                const cta = tierId !== null ? MARKETING_PRICING_TIER_CTAS[tierId] : undefined;
                const isRecommended = tierId === MARKETING_PRICING_RECOMMENDED_TIER;
                const includedLine = formatIncludedUsersAndWorkspaces(pkg);
                const aiCreditsLine = formatMonthlyAiCredits(pkg);
                const stripeHref = tierId !== null ? resolveStripeCheckoutHref(pricing, tierId) : null;
                const bullets = BILLING_TIER_FEATURE_BULLETS[pkg.id] ?? [];

                return (
                  <li
                    key={pkg.id}
                    data-testid={pkg.id === "team" ? "pricing-tier-team" : pkg.id === "architect" ? "pricing-tier-architect" : undefined}
                    className={
                      isRecommended
                        ? "flex flex-col rounded-lg border-2 border-teal-600 bg-white p-5 shadow-md ring-1 ring-teal-600/20 dark:border-teal-500 dark:bg-neutral-900 dark:ring-teal-500/25"
                        : pkg.id === "enterprise"
                          ? "flex flex-col rounded-lg border border-teal-700/80 bg-white p-5 shadow-sm dark:border-teal-800 dark:bg-neutral-900"
                          : "flex flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    }
                  >
                    <h3 className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                      {pkg.title}
                      {isRecommended ? (
                        <span
                          className={cn(
                            "ms-2 align-middle font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200",
                            OPERATOR_TYPOGRAPHY.helper,
                          )}
                        >
                          Recommended
                        </span>
                      ) : null}
                    </h3>
                    <p className={cn("mt-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)} data-testid={`pricing-tier-price-${pkg.id}`}>
                      {formatPlanPrice(pkg, pricing.currency)}
                    </p>
                    <p className={cn("mt-2 flex-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{pkg.summary}</p>
                    {includedLine !== null ? (
                      <p className={cn("mt-2 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>{includedLine}</p>
                    ) : null}
                    {aiCreditsLine !== null ? (
                      <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{aiCreditsLine}</p>
                    ) : null}
                    {bullets.length > 0 ? (
                      <ul className={cn("mt-3 list-disc space-y-1 pl-5 leading-snug text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                        {bullets.slice(0, 5).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {cta !== undefined ? (
                    <div className="mt-4 flex flex-col gap-2">
                      {cta.primaryKind === "quote" ? (
                        <Button type="button" variant={isRecommended ? "primary" : "outline"} className="w-full" onClick={() => scrollToQuote()}>
                          {cta.primaryLabel}
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && props.preferSalesLedQuoteCta ? (
                        <Button type="button" variant="primary" className="w-full" onClick={() => scrollToQuote()}>
                          {cta.primaryLabel}
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && !props.preferSalesLedQuoteCta && stripeHref !== null ? (
                        <Button asChild variant="primary" className="w-full">
                          <a
                            data-testid={pkg.id === "team" ? "pricing-team-subscribe-stripe" : `pricing-${pkg.id}-subscribe-stripe`}
                            href={stripeHref.trim()}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {stripeSubscribeLabel(stripeHref)}
                          </a>
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && !props.preferSalesLedQuoteCta && stripeHref === null ? (
                        <Button asChild variant="primary" className="w-full">
                          <Link href={props.signupHref}>{cta.primaryLabel}</Link>
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && !props.preferSalesLedQuoteCta && stripeHref !== null ? (
                        <Button asChild variant="outline" className="w-full">
                          <Link href={props.signupHref}>{cta.secondaryLabel ?? "Start now"}</Link>
                        </Button>
                      ) : null}

                      {cta.primaryKind === "stripe" && props.preferSalesLedQuoteCta && stripeHref !== null ? (
                        <Button asChild variant="outline" className="w-full">
                          <a
                            data-testid="pricing-team-subscribe-stripe"
                            href={stripeHref.trim()}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {stripeSubscribeLabel(stripeHref)}
                          </a>
                        </Button>
                      ) : null}
                    </div>
                    ) : null}
                  </li>
                );
              })}
          </ul>
          {props.showAiUsageNote === true ? (
            <p className={cn("mt-6 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} data-testid="pricing-ai-usage-note">
              {BUYER_MARKETING_PRICING_AI_USAGE_NOTE}
            </p>
          ) : null}
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
