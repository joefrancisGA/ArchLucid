import type { Metadata } from "next";
import Link from "next/link";

import { MarketingCustomPolicyPackAuthoringSection } from "@/components/marketing/MarketingCustomPolicyPackAuthoringSection";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingPricingQuotePanel } from "@/components/marketing/MarketingPricingQuotePanel";
import { MarketingPricingUsageFaqSection } from "@/components/marketing/MarketingPricingUsageFaqSection";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { TrialNudgePricingQuoteFocus } from "@/components/marketing/TrialNudgePricingQuoteFocus";
import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer-polish-copy";
import { buildPricingSignupHref } from "@/lib/marketing/pricing-signup-href";
import {
  CUSTOM_POLICY_PACK_QUOTE_INTEREST,
  CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL,
} from "@/lib/marketing-custom-policy-pack-authoring";
import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  MARKETING_PRICING_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";

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
      <MarketingTierPricingSection
        sectionHeadingId="pricing-page-heading"
        sectionTitle="Pricing"
        sectionIntro={BUYER_MARKETING_PRICING_PAGE_INTRO}
        signupHref={signupHref}
        signupCallToActionLabel="Start now"
        showSignupCallToAction={false}
        preferSalesLedQuoteCta={preferSalesLedQuoteCta}
        showAiUsageNote
      />
      <MarketingPricingUsageFaqSection />
      <p className={cn("mb-10 max-w-3xl", MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>
        More evaluation and security answers in the{" "}
        <Link className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/faq">
          Product FAQ
        </Link>
        .
      </p>
      <MarketingCustomPolicyPackAuthoringSection quoteSectionDomId="pricing-quote-request" />
      <p
        className={`mb-6 max-w-3xl ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}
        data-testid="pricing-brand-category-paragraph"
      >
        ArchLucid is an {BRAND_CATEGORY} for governed architecture review, evidence traceability, and audit-ready signed review records.
      </p>
      <MarketingPricingQuotePanel
        initialTierInterest={
          customPolicyPackQuoteInterest ? CUSTOM_POLICY_PACK_TIER_INTEREST_LABEL : undefined
        }
        openOnMount={customPolicyPackQuoteInterest}
      />
    </MarketingPageShell>
  );
}
