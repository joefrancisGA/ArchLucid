import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { FrictionlessTrialLauncher } from "@/components/marketing/FrictionlessTrialLauncher";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Try ArchLucid · Frictionless trial",
  description: "Explore a sample architecture review package without Azure setup or Entra ID sign-in.",
};

export default function TryPage(): ReactNode {
  return (
    <MarketingPageShell variant="reading">
      <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Try ArchLucid now</h1>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        Open a seeded review package in your browser — no Azure infrastructure, no Entra ID, and no credit card. When
        you are ready for your own workspace, start a trial or sign in.
      </p>
      <div className="mt-6" data-testid="try-page-launcher">
        <FrictionlessTrialLauncher />
      </div>
      <p className={`mt-6 ${MARKETING_TYPOGRAPHY.meta}`}>
        Prefer a guided signup?{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/signup">
          Start your trial workspace
        </Link>
        .
      </p>
    </MarketingPageShell>
  );
}
