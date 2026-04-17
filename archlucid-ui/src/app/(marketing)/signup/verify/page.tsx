import type { Metadata } from "next";
import { Suspense } from "react";

import { SignupVerifyClient } from "./SignupVerifyClient";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Complete email verification to activate your ArchLucid trial workspace.",
};

function VerifyFallback() {
  return <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>;
}

export default function SignupVerifyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Suspense fallback={<VerifyFallback />}>
        <SignupVerifyClient />
      </Suspense>
    </main>
  );
}
