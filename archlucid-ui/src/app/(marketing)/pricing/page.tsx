import type { Metadata } from "next";

import { MarketingCustomPolicyPackAuthoringSection } from "@/components/marketing/MarketingCustomPolicyPackAuthoringSection";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingPricingQuotePanel } from "@/components/marketing/MarketingPricingQuotePanel";
import { MarketingPricingUsageFaqSection } from "@/components/marketing/MarketingPricingUsageFaqSection";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { PricingEvidenceOrientationStrip } from "@/components/marketing/PricingEvidenceOrientationStrip";
import { PricingPageHero } from "@/components/marketing/PricingPageHero";
import { TrialNudgePricingQuoteFocus } from "@/components/marketing/TrialNudgePricingQuoteFocus";
import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { loadPricingDoc } from "@/lib/marketing/load-pricing-doc";
import { buildPricingSignupHref } from "@/lib/marketing/pricing-signup-href";
import {
  CUSTOM_POLICY_PACK_QUOTE_INTEREST,
  CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL,
} from "@/lib/marketing-custom-policy-pack-authoring";
import {
  MARKETING_PRICING_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
import {
  PRICING_PAGE_BRAND_CATEGORY_DETAILS_TRIGGER,
  pricingPageBrandCategoryLead,
} from "@/lib/marketing/pricing-page-copy";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pricing",
  description: `ArchLucid ${BRAND_CATEGORY} — start with one architect, grow into team and enterprise plans.`,
  ...buildMarketingSocialMetadata("Pricing", MARKETING_PRICING_OG_DESCRIPTION, "/pricing"),
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
    <MarketingPageShell>
      {preferSalesLedQuoteCta ? <TrialNudgePricingQuoteFocus quoteSectionDomId="pricing-quote-request" /> : null}
      <PricingPageHero />
      <MarketingTierPricingSection
        sectionHeadingId="pricing-tier-grid-heading"
        sectionTitle="Pricing"
        showSectionHeading={false}
        signupHref={signupHref}
        signupCallToActionLabel="Start now"
        showSignupCallToAction={false}
        preferSalesLedQuoteCta={preferSalesLedQuoteCta}
        showAiUsageNote
        initialPricing={loadPricingDoc()}
      />
      <MarketingPricingUsageFaqSection />
      <MarketingCustomPolicyPackAuthoringSection quoteSectionDomId="pricing-quote-request" />
      <details
        className="mb-6 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="pricing-brand-category-details"
      >
        <summary className={cn("cursor-pointer select-none font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
          {PRICING_PAGE_BRAND_CATEGORY_DETAILS_TRIGGER}
        </summary>
        <p
          className={cn("m-0 mt-3 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}
          data-testid="pricing-brand-category-paragraph"
        >
          {pricingPageBrandCategoryLead(BRAND_CATEGORY)}
        </p>
      </details>
      <MarketingPricingQuotePanel
        initialTierInterest={
          customPolicyPackQuoteInterest ? CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL : undefined
        }
        openOnMount={customPolicyPackQuoteInterest}
      />
      <PricingEvidenceOrientationStrip />
    </MarketingPageShell>
  );
}
