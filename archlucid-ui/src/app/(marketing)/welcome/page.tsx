import type { Metadata } from "next";

// Public marketing home is `/welcome` (not `app/(marketing)/page.tsx`) because `app/(operator)/page.tsx` already owns `/`.
import { WelcomeMarketingFirstTimeVisitorSection } from "@/components/marketing/WelcomeMarketingFirstTimeVisitorSection";
import { WelcomeMarketingPage } from "@/components/marketing/WelcomeMarketingPage";
import { WelcomeMarketingProofAtGlanceSection } from "@/components/marketing/WelcomeMarketingProofAtGlanceSection";
import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import {
  MARKETING_WELCOME_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";
export { revalidate } from "@/lib/next/marketing-isr-route-policy";

export const metadata: Metadata = {
  title: "Welcome",
  description: `ArchLucid ${BRAND_CATEGORY} — trial signup and product overview.`,
  ...buildMarketingSocialMetadata("Welcome", MARKETING_WELCOME_OG_DESCRIPTION, "/welcome"),
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

/** Composes client hero/pricing islands with server-rendered proof sections (TB-566). */
export default function WelcomePage() {
  return (
    <WelcomeMarketingPage
      serverStaticSections={
        <>
          <WelcomeMarketingProofAtGlanceSection />
          <WelcomeMarketingFirstTimeVisitorSection />
        </>
      }
    />
  );
}
