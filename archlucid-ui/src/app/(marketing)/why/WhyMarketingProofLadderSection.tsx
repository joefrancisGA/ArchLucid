import Link from "next/link";

import { CtaButton } from "@/components/marketing/CtaButton";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_CONTOSO_PREVIEW_HREF,
  WHY_CONTOSO_PREVIEW_LABEL,
  WHY_PROOF_LADDER_PRIMARY_HREF,
  WHY_PROOF_LADDER_PRIMARY_LABEL,
  WHY_PROOF_LADDER_SAMPLE_HREF,
  WHY_PROOF_LADDER_SAMPLE_LABEL,
  WHY_PROOF_LADDER_WALKTHROUGH_HREF,
  WHY_PROOF_LADDER_WALKTHROUGH_LABEL,
} from "@/lib/why-page-copy";
import { cn } from "@/lib/utils";

/** TB-1302: canonical proof ladder — `/see-it` primary; Contoso preview demoted and labeled. */
export function WhyMarketingProofLadderSection(): React.JSX.Element {
  return (
    <section className="mt-10" aria-labelledby="why-proof-ladder-heading" data-testid="why-proof-ladder-section">
      <h2 id="why-proof-ladder-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        Inspect a sample review
      </h2>
      <p className={cn("mt-2 max-w-3xl", MARKETING_TYPOGRAPHY.meta)}>
        Start with the anonymous enterprise intake proof path — the same universe as the welcome and see-it funnels. A
        separate enterprise retail sample is available when you need a longer in-product preview.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <CtaButton
          href={WHY_PROOF_LADDER_PRIMARY_HREF}
          variant="primary"
          size="lg"
          data-testid="why-proof-ladder-primary-cta"
        >
          {WHY_PROOF_LADDER_PRIMARY_LABEL}
        </CtaButton>
        <CtaButton
          href={WHY_PROOF_LADDER_SAMPLE_HREF}
          variant="outline"
          size="lg"
          data-testid="why-proof-ladder-sample-cta"
        >
          {WHY_PROOF_LADDER_SAMPLE_LABEL}
        </CtaButton>
      </div>
      <p className={cn("mt-4 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)} data-testid="why-proof-ladder-links">
        <Link className={MARKETING_SURFACES.inlineLink} href={WHY_PROOF_LADDER_WALKTHROUGH_HREF}>
          {WHY_PROOF_LADDER_WALKTHROUGH_LABEL}
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href={WHY_CONTOSO_PREVIEW_HREF}>
          {WHY_CONTOSO_PREVIEW_LABEL}
        </Link>
      </p>
    </section>
  );
}
