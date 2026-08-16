import type { Metadata } from "next";
import Link from "next/link";

import { SeeItDeliverablePreview } from "@/app/(marketing)/see-it/SeeItDeliverablePreview";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupAccessRequestPanel } from "@/components/marketing/SignupAccessRequestPanel";
import { SignupEvidenceOrientationStrip } from "@/components/marketing/SignupEvidenceOrientationStrip";
import { SignupForm } from "@/components/marketing/SignupForm";
import { CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD } from "@/lib/auth/customer-auth-messaging";
import { MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { isPublicSelfServiceSignupEnabled } from "@/lib/marketing/is-public-signup-enabled";
import { SIGNUP_PAGE_INVITE_ONLY_LEAD } from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Start your evaluation",
  description:
    "Request evaluation access or create an evaluation workspace with sample architecture review data. Sign in later with a work account or email one-time code.",
};

export default function SignupPage() {
  const publicSignupEnabled = isPublicSelfServiceSignupEnabled();

  return (
    <MarketingPageShell variant="reading" className={cn("mx-auto w-full px-4 py-10 sm:py-12")}>
      <section
        className={cn(
          "grid items-start gap-10 border-b border-neutral-200 pb-8 dark:border-neutral-800 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12",
          MARKETING_MOTION.revealIn,
        )}
        data-testid="signup-hero"
        aria-labelledby="signup-hero-heading"
      >
        <header className="text-left">
          <h1 id="signup-hero-heading" className={MARKETING_TYPOGRAPHY.heroTitle}>Start your evaluation</h1>
          <p className={cn("mt-3 max-w-2xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            {publicSignupEnabled
              ? `${CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD} No sales call required.`
              : SIGNUP_PAGE_INVITE_ONLY_LEAD}
          </p>
          <p className={cn("mt-4 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Already have an account?{" "}
            <Link href="/auth/signin" className={MARKETING_SURFACES.inlineLink}>
              Sign in
            </Link>
          </p>
        </header>

        <SeeItDeliverablePreview />
      </section>
      <div className="mt-8">
        {publicSignupEnabled ? <SignupForm /> : <SignupAccessRequestPanel />}
      </div>
      <SignupEvidenceOrientationStrip />
    </MarketingPageShell>
  );
}
