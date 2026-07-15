import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { SignupVerifyClient } from "./SignupVerifyClient";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email address to continue setting up your ArchLucid evaluation workspace.",
};

function VerifyFallback() {
  return (
    <p className={cn("text-center text-al-text-secondary", MARKETING_TYPOGRAPHY.body)} role="status">
      Loading…
    </p>
  );
}

export default function SignupVerifyPage() {
  return (
    <MarketingPageShell className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg items-center px-4 py-10 sm:py-12">
      <Suspense fallback={<VerifyFallback />}>
        <SignupVerifyClient />
      </Suspense>
    </MarketingPageShell>
  );
}
