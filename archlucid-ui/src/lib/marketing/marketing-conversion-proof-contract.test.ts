import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/** Conversion routes that must use `MARKETING_TYPOGRAPHY.heroTitle` on the page H1. */
const CONVERSION_HERO_MODULES = [
  "components/marketing/WelcomeMarketingHeroSection.tsx",
  "app/(marketing)/why/WhyMarketingHeroSection.tsx",
  "app/(marketing)/see-it/SeeItHeroSection.tsx",
  "app/(marketing)/get-started/GetStartedPageClient.tsx",
  "app/(marketing)/quick-scan/QuickScanClient.tsx",
  "components/marketing/PricingPageHero.tsx",
  "app/(marketing)/signup/page.tsx",
  "app/(marketing)/showcase/[runId]/page.tsx",
] as const;

const TRANSACTIONAL_SIGNUP_VERIFY_MODULE = "app/(marketing)/signup/verify/SignupVerifyClient.tsx";

const GET_STARTED_PAGE_MODULE = "app/(marketing)/get-started/GetStartedPageClient.tsx";

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");
}

describe("marketing conversion-proof contract (TB-2337)", () => {
  it.each(CONVERSION_HERO_MODULES)("uses heroTitle on conversion H1 in %s", (relativePath) => {
    const source = readSrcModule(relativePath);

    expect(source).toMatch(/MARKETING_TYPOGRAPHY\.heroTitle/);
    expect(source).not.toMatch(/<h1[^>]*MARKETING_TYPOGRAPHY\.pageTitle/);
  });

  it("allows transactional signup verify to use pageTitle", () => {
    const source = readSrcModule(TRANSACTIONAL_SIGNUP_VERIFY_MODULE);

    expect(source).toMatch(/MARKETING_TYPOGRAPHY\.pageTitle/);
  });

  it("requires get-started to mount a product visual", () => {
    const source = readSrcModule(GET_STARTED_PAGE_MODULE);

    expect(source).toMatch(/SeeItDeliverablePreview|WelcomeMarketingHeroVisual/);
  });
});
