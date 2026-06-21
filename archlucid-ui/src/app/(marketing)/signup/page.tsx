import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { SignupForm } from "@/components/marketing/SignupForm";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Start free trial",
  description: "Create a self-service ArchLucid trial workspace.",
};

export default function SignupPage() {
  return (
    <MarketingPageShell variant="reading">
      <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Start your trial</h1>
      <p className={`mt-2 max-w-2xl ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        Tell us who you are and which organization you represent. We will create a dedicated workspace and seed a
        sample architecture review you can explore before you start your own review. Already have an account?{" "}
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
