"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { BILLING_TIER_FEATURE_BULLETS } from "@/lib/billing-plan-tier-features";
import { BUYER_PRICING_FAIR_USE_OVERAGE_NOTE } from "@/lib/buyer-polish-copy";
import { isPublicStripeTeamCheckoutEnabled } from "@/lib/marketing/is-public-stripe-team-checkout-enabled";
import type { PricingDoc } from "@/lib/pricing-types";
import { looksStripeHostedTestCheckoutUrl, resolveTeamStripeCheckoutHref } from "@/lib/team-stripe-checkout-url";

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function pricingPackageGridOrder(id: string): number {
  if (id === "professional") {
    return 0;
  }

  if (id === "enterprise") {
    return 1;
  }

  if (id === "team") {
    return 2;
  }

  return 99;
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
  /** When false, omit the trailing “Start free trial” button (e.g. welcome page already has a hero CTA). */
  showSignupCallToAction?: boolean;
  /** DOM id of the quote panel on the same page (Pro / Enterprise “Talk to sales” scroll target). */
  quoteSectionDomId?: string;
  /** When true, Team tier leads with “Request quote” even if Stripe test checkout is enabled (trial nudge flow). */
  preferSalesLedQuoteCta?: boolean;
};

/** Loads `/pricing.json` and renders tier cards — shared by welcome and `/pricing`. */
export function MarketingTierPricingSection(props: MarketingTierPricingSectionProps) {
  const quoteSectionDomId = props.quoteSectionDomId ?? "pricing-quote-request";
  const [pricing, setPricing] = useState<PricingDoc | null>(null);
  const [pricingError, setPricingError] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(true);

  const scrollToQuote = useCallback(() => {
    if (typeof document === "undefined") return;

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

  const teamStripeCheckoutHref =
    pricing !== null && !pricingError && isPublicStripeTeamCheckoutEnabled()
      ? resolveTeamStripeCheckoutHref(pricing.teamStripeCheckoutUrl)
      : null;

  const teamStripeSubscribeLabel =
    teamStripeCheckoutHref !== null && looksStripeHostedTestCheckoutUrl(teamStripeCheckoutHref)
      ? "Subscribe (Stripe test)"
      : "Subscribe with Stripe";

  return (
    <section aria-labelledby={props.sectionHeadingId} className="mb-10">
      <h2 id={props.sectionHeadingId} className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {props.sectionTitle}
      </h2>
      {props.sectionIntro ? (
        <p className="mb-6 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">{props.sectionIntro}</p>
      ) : null}

      {pricingError ? (
        <p className="text-sm text-red-600" role="alert">
          Pricing data is temporarily unavailable.
        </p>
      ) : null}

      {pricingLoading && !pricingError ? (
        <ul className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Loading pricing tiers">
          {[0, 1, 2].map((slot) => (
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
          <ul className="grid gap-6 md:grid-cols-3">
            {[...pricing.packages]
              .sort((a, b) => pricingPackageGridOrder(a.id) - pricingPackageGridOrder(b.id))
              .map((pkg) => (
              <li
                key={pkg.id}
                data-testid={pkg.id === "team" ? "pricing-tier-team" : undefined}
                className={
                  pkg.id === "professional"
                    ? "flex flex-col rounded-lg border-2 border-teal-600 bg-white p-5 shadow-md ring-1 ring-teal-600/20 dark:border-teal-500 dark:bg-neutral-900 dark:ring-teal-500/25"
                    : pkg.id === "enterprise"
                      ? "flex flex-col rounded-lg border border-teal-700/80 bg-white p-5 shadow-sm dark:border-teal-800 dark:bg-neutral-900"
                      : "flex flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm opacity-[0.97] dark:border-neutral-800 dark:bg-neutral-900"
                }
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {pkg.title}
                  {pkg.id === "professional" ? (
                    <span className="ms-2 align-middle text-xs font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-200">
                      Recommended
                    </span>
                  ) : null}
                </h3>
                {pkg.id === "team" ? (
                  <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      Evaluation and small-team workspace
                    </span>
                    {" — "}pilot and evaluation tier (not the primary procurement path).
                  </p>
                ) : null}
                <p className="mt-2 flex-1 text-sm text-neutral-700 dark:text-neutral-300">{pkg.summary}</p>
                {BILLING_TIER_FEATURE_BULLETS[pkg.id] !== undefined ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-snug text-neutral-700 dark:text-neutral-300">
                    {BILLING_TIER_FEATURE_BULLETS[pkg.id]!.slice(0, 5).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : null}
                <dl className="mt-4 space-y-1 text-sm text-neutral-800 dark:text-neutral-200">
                  {typeof pkg.workspaceMonthlyUsd === "number" ? (
                    <div className="flex justify-between gap-2">
                      <dt>Workspace</dt>
                      <dd>{formatMoney(pkg.workspaceMonthlyUsd, pricing.currency)} / mo</dd>
                    </div>
                  ) : null}
                  {typeof pkg.seatMonthlyUsd === "number" ? (
                    <div className="flex justify-between gap-2">
                      <dt>Seat</dt>
                      <dd>{formatMoney(pkg.seatMonthlyUsd, pricing.currency)} / mo</dd>
                    </div>
                  ) : null}
                  {typeof pkg.annualFloorUsd === "number" ? (
                    <div className="flex justify-between gap-2">
                      <dt>Annual from</dt>
                      <dd>{formatMoney(pkg.annualFloorUsd, pricing.currency)}</dd>
                    </div>
                  ) : null}
                </dl>
                {pkg.id === "enterprise" ? (
                  <>
                    <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
                      Deployment model and terms are finalized through procurement.
                    </p>
                    <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">{BUYER_PRICING_FAIR_USE_OVERAGE_NOTE}</p>
                  </>
                ) : null}
                <div className="mt-4 flex flex-col gap-2">
                  {pkg.id === "team" ? (
                    <>
                      {teamStripeCheckoutHref !== null && !props.preferSalesLedQuoteCta ? (
                        <Button asChild variant="primary" className="w-full">
                          <a
                            data-testid="pricing-team-subscribe-stripe"
                            href={teamStripeCheckoutHref.trim()}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            {teamStripeSubscribeLabel}
                          </a>
                        </Button>
                      ) : (
                        <Button type="button" variant="primary" className="w-full" onClick={() => scrollToQuote()}>
                          Request quote
                        </Button>
                      )}
                      {teamStripeCheckoutHref !== null ? (
                        props.preferSalesLedQuoteCta ? (
                          <Button asChild variant="outline" className="w-full">
                            <a
                              data-testid="pricing-team-subscribe-stripe"
                              href={teamStripeCheckoutHref.trim()}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {teamStripeSubscribeLabel}
                            </a>
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" className="w-full" onClick={() => scrollToQuote()}>
                            Request quote
                          </Button>
                        )
                      ) : null}
                      <Button asChild variant="outline" className="w-full">
                        <Link href={props.signupHref}>{props.signupCallToActionLabel ?? "Start free trial"}</Link>
                      </Button>
                    </>
                  ) : null}
                  {pkg.id === "professional" || pkg.id === "enterprise" ? (
                    <Button type="button" className="w-full" variant="outline" onClick={() => scrollToQuote()}>
                      Talk to sales
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
            Roadmap-oriented diligence topics (for example enterprise directory lifecycle) are summarized in the{" "}
            <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/faq#pricing-roadmap-notes">
              product FAQ
            </Link>
            .
          </p>
          {props.showSignupCallToAction !== false ? (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="primary" size="lg">
                <Link href={props.signupHref}>{props.signupCallToActionLabel ?? "Start free trial"}</Link>
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
