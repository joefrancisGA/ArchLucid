import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupForm } from "@/components/marketing/SignupForm";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Start an evaluation",
  description: "Create a self-service ArchLucid workspace and start your evaluation — no sales call required.",
};

export default function SignupPage() {
  return (
    <MarketingPageShell variant="reading">
      <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Start your evaluation</h1>
      <p className={`mt-2 max-w-2xl ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        Tell us who you are and which organization you represent. We will create a dedicated workspace and add a
        sample architecture review you can inspect before you start your own. No sales call required. Already have an
        account?{" "}
        <Link href="/auth/signin" className={MARKETING_SURFACES.inlineLink}>
          Sign in
        </Link>
        .
      </p>
      <div className="mt-8">
        <SignupForm />
      </div>
    </MarketingPageShell>
  );
}
