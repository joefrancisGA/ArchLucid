import type { Metadata } from "next";

import { MarketingPricingPublicCutoverNotice } from "@/components/marketing/MarketingPricingPublicCutoverNotice";
import { MarketingPricingQuotePanel } from "@/components/marketing/MarketingPricingQuotePanel";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { buildPricingSignupHref } from "@/lib/marketing/pricing-signup-href";
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p
        className="mb-6 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
        data-testid="pricing-brand-category-paragraph"
      >
        ArchLucid is an {BRAND_CATEGORY} offering. Compare{" "}
        <strong className="font-semibold text-neutral-800 dark:text-neutral-200">
          Team, Professional, and Enterprise
        </strong>{" "}
        plans in the section below, then request a quote when you are ready. Regulated-industry buyers typically finalize
        scope, licensing, deployment model, and contractual terms through procurement. Self-service checkout, where offered,
        is aimed at smaller teams — enterprise evaluations remain sales-guided. For custom deployments,{" "}
        <a
          className="font-semibold text-teal-800 underline underline-offset-2 dark:text-teal-200"
          href="#pricing-quote-request"
        >
          request a quote
        </a>{" "}
        — your account team confirms licensing.
      </p>
      <MarketingTierPricingSection
        sectionHeadingId="pricing-page-heading"
        sectionTitle="Pricing"
        sectionIntro="Tier summaries reflect the current published price list. Final pricing depends on deployment scope, volume, and procurement channel — your account team confirms details."
        signupHref={signupHref}
        signupCallToActionLabel="Start workspace trial"
        showSignupCallToAction={false}
      />
      <MarketingPricingQuotePanel />
      <MarketingPricingPublicCutoverNotice />
    </main>
  );
}
