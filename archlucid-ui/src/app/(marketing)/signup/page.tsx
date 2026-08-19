import type { Metadata } from "next";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupAccessRequestPanel } from "@/components/marketing/SignupAccessRequestPanel";
import { SignupEvaluationAsideRail } from "@/components/marketing/SignupEvaluationAsideRail";
import { SignupEvidenceOrientationStrip } from "@/components/marketing/SignupEvidenceOrientationStrip";
import { SignupForm } from "@/components/marketing/SignupForm";
import { SignupHeroSection } from "@/components/marketing/SignupHeroSection";
import { SignupPageChrome } from "@/components/marketing/SignupPageChrome";
import { MARKETING_LAYOUT } from "@/lib/design-tokens";
import { isPublicSelfServiceSignupEnabled } from "@/lib/marketing/is-public-signup-enabled";
import { SIGNUP_PAGE_TITLE } from "@/lib/marketing/signup-page-copy";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: SIGNUP_PAGE_TITLE,
  description:
    "Request evaluation access or create an evaluation workspace with sample architecture review data. Sign in later with a work account or email one-time code.",
};

export default function SignupPage() {
  const publicSignupEnabled = isPublicSelfServiceSignupEnabled();

  return (
    <MarketingPageShell className={cn(MARKETING_LAYOUT.mainOnboarding, "py-10 sm:py-12")} data-testid="signup-page">
      <SignupPageChrome
        hero={<SignupHeroSection publicSignupEnabled={publicSignupEnabled} />}
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <div className="min-w-0">
            {publicSignupEnabled ? <SignupForm /> : <SignupAccessRequestPanel />}
          </div>
          <SignupEvaluationAsideRail />
        </div>

        <SignupEvidenceOrientationStrip part="sources" />
      </SignupPageChrome>
    </MarketingPageShell>
  );
}
