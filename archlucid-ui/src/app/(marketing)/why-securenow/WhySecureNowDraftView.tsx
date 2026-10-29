import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_LAYOUT, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_CONVERSATION_MAILTO,
  WHY_SECURENOW_DRAFT_AUDIENCE,
  WHY_SECURENOW_DRAFT_BANNER,
  WHY_SECURENOW_DRAFT_HEADING,
  WHY_SECURENOW_DRAFT_PITCH,
  WHY_SECURENOW_DRAFT_REFUSALS,
  WHY_SECURENOW_DRAFT_STEPS,
} from "@/lib/marketing/why-securenow-draft-copy";
import { cn } from "@/lib/utils";

/** SN-MKT-02 — internal Why SecureNow draft (noindex, not linked from marketing nav). */
export function WhySecureNowDraftView(): React.JSX.Element {
  return (
    <MarketingPageShell variant="reading" data-testid="why-securenow-draft-page">
      <div className={cn(MARKETING_LAYOUT.sectionY, "space-y-8")}>
        <p
          className={cn(MARKETING_TYPOGRAPHY.lead, "text-amber-900 dark:text-amber-200")}
          data-testid="why-securenow-draft-banner"
        >
          {WHY_SECURENOW_DRAFT_BANNER}
        </p>

        <header className="space-y-3">
          <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{WHY_SECURENOW_DRAFT_HEADING}</h1>
          <p className={MARKETING_TYPOGRAPHY.lead} data-testid="why-securenow-draft-pitch">
            {WHY_SECURENOW_DRAFT_PITCH}
          </p>
        </header>

        <section className="space-y-2" aria-labelledby="why-securenow-audience-heading">
          <h2 id="why-securenow-audience-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            Who it is for
          </h2>
          <p className={MARKETING_TYPOGRAPHY.body}>{WHY_SECURENOW_DRAFT_AUDIENCE}</p>
        </section>

        <section className="space-y-2" aria-labelledby="why-securenow-steps-heading">
          <h2 id="why-securenow-steps-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            What a buyer walkthrough covers
          </h2>
          <ol className={cn("list-decimal space-y-2 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {WHY_SECURENOW_DRAFT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="space-y-2" aria-labelledby="why-securenow-refusals-heading">
          <h2 id="why-securenow-refusals-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            What SecureNow does not claim
          </h2>
          <ul className={cn("list-disc space-y-2 pl-5", MARKETING_TYPOGRAPHY.body)}>
            {WHY_SECURENOW_DRAFT_REFUSALS.map((refusal) => (
              <li key={refusal}>{refusal}</li>
            ))}
          </ul>
        </section>

        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link href={WHY_SECURENOW_CONVERSATION_MAILTO} className="text-al-link underline-offset-2 hover:underline">
            {WHY_SECURENOW_CONVERSATION_LABEL}
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
