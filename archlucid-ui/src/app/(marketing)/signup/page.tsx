import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupForm } from "@/components/marketing/SignupForm";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Start your evaluation",
  description:
    "Create an evaluation workspace with sample architecture review data. No sales call required.",
};

export default function SignupPage() {
  return (
    <MarketingPageShell className={cn("mx-auto w-full max-w-[640px] px-4 py-10 sm:py-12")}>
      <header className="text-center">
        <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Start your evaluation</h1>
        <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          Create an evaluation workspace with sample architecture review data. No sales call required.
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
        <SignupForm />
      </div>
    </MarketingPageShell>
  );
}
