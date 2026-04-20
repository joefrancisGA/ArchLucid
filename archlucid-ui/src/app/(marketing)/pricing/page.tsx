import type { Metadata } from "next";

import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";

export const metadata: Metadata = {
  title: "Pricing",
  description: "ArchLucid packaging and pricing overview — start a free trial.",
};

type PricingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Forwards common campaign query keys to signup so attribution survives the click. */
function buildSignupHref(searchParams: Record<string, string | string[] | undefined>): string {
  const forwardedKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
  const params = new URLSearchParams();

  for (const key of forwardedKeys) {
    const raw = searchParams[key];

    if (typeof raw === "string" && raw.trim() !== "") params.set(key, raw.trim());
  }

  if (!params.has("utm_source")) params.set("utm_source", "pricing_page");

  return `/signup?${params.toString()}`;
}

export default async function PricingPage(props: PricingPageProps) {
  const searchParams = await props.searchParams;
  const signupHref = buildSignupHref(searchParams);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <MarketingTierPricingSection
        sectionHeadingId="pricing-page-heading"
        sectionTitle="Pricing"
        sectionIntro="Figures are loaded from the published pricing document at build time — not hard-coded in the UI bundle."
        signupHref={signupHref}
      />
    </main>
  );
}
