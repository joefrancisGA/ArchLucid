import type { Metadata } from "next";
import { Suspense } from "react";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupVerifyLoadingSkeleton } from "@/components/marketing/SignupVerifyLoadingSkeleton";
import { SignupVerifyPageChrome } from "@/components/marketing/SignupVerifyPageChrome";
import { SIGNUP_VERIFY_PAGE_TITLE } from "@/lib/marketing/signup-verify-page-copy";

import { SignupVerifyClient } from "./SignupVerifyClient";

export const metadata: Metadata = {
  title: SIGNUP_VERIFY_PAGE_TITLE,
  description: "Confirm your email address to continue setting up your ArchLucid evaluation workspace.",
};

export default function SignupVerifyPage() {
  return (
    <MarketingPageShell
      className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-lg flex-col justify-start px-4 py-10 sm:py-12"
      data-testid="signup-verify-page"
    >
      {/* my-auto centers when the viewport is tall; auto margins collapse when the card is taller than leftover space, so the top never clips under the sticky header. */}
      <div className="my-auto w-full">
        <SignupVerifyPageChrome>
          <Suspense fallback={<SignupVerifyLoadingSkeleton />}>
            <SignupVerifyClient />
          </Suspense>
        </SignupVerifyPageChrome>
      </div>
    </MarketingPageShell>
  );
}
