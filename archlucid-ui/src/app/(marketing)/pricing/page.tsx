import type { Metadata } from "next";

import { MarketingCustomPolicyPackAuthoringSection } from "@/components/marketing/MarketingCustomPolicyPackAuthoringSection";
import { MarketingPricingPublicCutoverNotice } from "@/components/marketing/MarketingPricingPublicCutoverNotice";
import { MarketingPricingQuotePanel } from "@/components/marketing/MarketingPricingQuotePanel";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { TrialNudgePricingQuoteFocus } from "@/components/marketing/TrialNudgePricingQuoteFocus";
import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer-polish-copy";
import { BUYER_PRICING_ARCHITECTURE_PROOF_ENGINE_CLAUSE } from "@/lib/buyer-polish-copy";
import { buildPricingSignupHref } from "@/lib/marketing/pricing-signup-href";
import {
  CUSTOM_POLICY_PACK_QUOTE_INTEREST,
  CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL,
} from "@/lib/marketing-custom-policy-pack-authoring";
import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";

export const metadata: Metadata = {
  title: "Pricing",
  description: `ArchLucid ${BRAND_CATEGORY} — packaging and pricing overview — request a demo or quote.`,
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

type PricingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PricingPage(props: PricingPageProps) {
  const searchParams = await props.searchParams;
  const signupHref = buildPricingSignupHref(searchParams);
  const sourceParam = searchParams.source;
  const interestParam = searchParams.interest;
  const preferSalesLedQuoteCta =
    (typeof sourceParam === "string" && sourceParam === "trial-nudge") ||
    (Array.isArray(sourceParam) && sourceParam.includes("trial-nudge"));
  const customPolicyPackQuoteInterest =
    (typeof interestParam === "string" && interestParam === CUSTOM_POLICY_PACK_QUOTE_INTEREST) ||
    (Array.isArray(interestParam) && interestParam.includes(CUSTOM_POLICY_PACK_QUOTE_INTEREST));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {preferSalesLedQuoteCta ? <TrialNudgePricingQuoteFocus quoteSectionDomId="pricing-quote-request" /> : null}
      <MarketingTierPricingSection
        sectionHeadingId="pricing-page-heading"
        sectionTitle="Pricing"
        sectionIntro={BUYER_MARKETING_PRICING_PAGE_INTRO}
        signupHref={signupHref}
        signupCallToActionLabel="Request evaluation workspace"
        showSignupCallToAction={false}
        preferSalesLedQuoteCta={preferSalesLedQuoteCta}
      />
      <MarketingPricingPublicCutoverNotice />
      <p
        className="mb-6 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
        data-testid="pricing-brand-category-paragraph"
      >
        ArchLucid is an {BRAND_CATEGORY} offering {BUYER_PRICING_ARCHITECTURE_PROOF_ENGINE_CLAUSE}. For procurement-led deployments,{" "}
        <a
          className="font-semibold text-teal-800 underline underline-offset-2 dark:text-teal-200"
          href="#pricing-quote-request"
        >
          request a quote
        </a>{" "}
        below.
      </p>
      <MarketingCustomPolicyPackAuthoringSection quoteSectionDomId="pricing-quote-request" />
      <MarketingPricingQuotePanel
        initialTierInterest={
          customPolicyPackQuoteInterest ? CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL : undefined
        }
        openOnMount={customPolicyPackQuoteInterest}
      />
    </main>
  );
}
