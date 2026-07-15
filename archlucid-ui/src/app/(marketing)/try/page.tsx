import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { FrictionlessTrialLauncher } from "@/components/marketing/FrictionlessTrialLauncher";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Inspect a sample review · ArchLucid",
  description: "Inspect a governed sample architecture review in your browser — no Azure setup, no Entra ID sign-in, no sales call.",
};

export default function TryPage(): ReactNode {
  return (
    <MarketingPageShell variant="reading">
      <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>Inspect a governed sample review</h1>
      <p className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>
        Open a sample review in your browser — fabricated data only, no Azure infrastructure, no Entra ID, and no
        credit card. Every finding traces to evidence and every decision leaves an audit trail, so you can judge the
        product on its own terms. When you are ready, start an evaluation with your own architecture evidence or sign in.
      </p>
      <div className="mt-6" data-testid="try-page-launcher">
        <FrictionlessTrialLauncher />
      </div>
      <p className={`mt-6 ${MARKETING_TYPOGRAPHY.meta}`}>
        Prefer a guided signup?{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/signup">
          Start your evaluation
        </Link>
        .
      </p>
    </MarketingPageShell>
  );
}
