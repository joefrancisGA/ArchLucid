import type { Metadata } from "next";

// Public marketing home is `/welcome` (not `app/(marketing)/page.tsx`) because `app/(operator)/page.tsx` already owns `/`.
import { WelcomeMarketingPage } from "@/components/marketing/WelcomeMarketingPage";
import { BRAND_CATEGORY, BRAND_CATEGORY_LEGACY } from "@/lib/brand-category";
import {
  MARKETING_WELCOME_OG_DESCRIPTION,
  buildMarketingSocialMetadata,
} from "@/lib/marketing-open-graph";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Welcome",
  description: `ArchLucid ${BRAND_CATEGORY} — trial signup and product overview.`,
  ...buildMarketingSocialMetadata("Welcome", MARKETING_WELCOME_OG_DESCRIPTION, "/welcome"),
  other: {
    "x-archlucid-brand-category-legacy": BRAND_CATEGORY_LEGACY,
  },
};

export default function WelcomePage() {
  return (
    <main>
      <WelcomeMarketingPage />
    </main>
  );
}
