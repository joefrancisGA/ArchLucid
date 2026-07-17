import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupAccessRequestPanel } from "@/components/marketing/SignupAccessRequestPanel";
import { SignupForm } from "@/components/marketing/SignupForm";
import { CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD } from "@/lib/auth/customer-auth-messaging";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { isPublicSelfServiceSignupEnabled } from "@/lib/marketing/is-public-signup-enabled";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Start your evaluation",
  description:
    "Create an evaluation workspace with sample architecture review data. Sign in later with a work account or email one-time code.",
};

export default function SignupPage() {
  const publicSignupEnabled = isPublicSelfServiceSignupEnabled();

  return (
    <MarketingPageShell className={cn("mx-auto w-full max-w-[640px] px-4 py-10 sm:py-12")}>
      <header className="text-center">
        <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Start your evaluation</h1>
        <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          {publicSignupEnabled
            ? `${CUSTOMER_AUTH_EVALUATION_SIGNUP_LEAD} No sales call required.`
            : "Request access to join the private beta. When approved, you will receive an invitation to create your evaluation workspace."}
        </p>
        <p className={cn("mt-4 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Questions before you start? Read the{" "}
          <Link href="/faq" className={MARKETING_SURFACES.inlineLink}>
            Product FAQ
          </Link>{" "}
          for evaluation, pricing, and security answers.
        </p>
        <p className={cn("mt-4 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Already have an account?{" "}
          <Link href="/auth/signin" className={MARKETING_SURFACES.inlineLink}>
            Sign in
          </Link>
        </p>
      </header>
      <div className="mt-8">
        {publicSignupEnabled ? <SignupForm /> : <SignupAccessRequestPanel />}
      </div>
    </MarketingPageShell>
  );
}
