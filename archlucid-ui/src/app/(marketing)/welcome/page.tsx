import type { Metadata } from "next";

// Public marketing home is `/welcome` (not `app/(marketing)/page.tsx`) because `app/(operator)/page.tsx` already owns `/`.
import { WelcomeMarketingEngagementPathsSection } from "@/components/marketing/WelcomeMarketingEngagementPathsSection";
import { WelcomeMarketingPage } from "@/components/marketing/WelcomeMarketingPage";
import { WelcomeMarketingProofAtGlanceSection } from "@/components/marketing/WelcomeMarketingProofAtGlanceSection";
import { WELCOME_PAGE_METADATA_TITLE } from "@/components/marketing/welcome-marketing-copy";
import { BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import { loadPricingDoc } from "@/lib/marketing/load-pricing-doc";
import {
  MARKETING_WELCOME_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";

export const revalidate = 300;

export const metadata: Metadata = {
  title: WELCOME_PAGE_METADATA_TITLE,
  description: MARKETING_WELCOME_OG_DESCRIPTION,
  ...buildMarketingSocialMetadata(WELCOME_PAGE_METADATA_TITLE, MARKETING_WELCOME_OG_DESCRIPTION, "/welcome"),
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

/** Composes client hero/pricing islands with server-rendered proof sections (TB-566). */
export default function WelcomePage() {
  return (
    <WelcomeMarketingPage
      initialPricing={loadPricingDoc()}
      serverStaticSections={
        <>
          <WelcomeMarketingProofAtGlanceSection />
          <WelcomeMarketingEngagementPathsSection />
        </>
      }
    />
  );
}
