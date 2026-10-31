import Link from "next/link";

import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MARKETING_LAYOUT, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_SAMPLE_BEATS,
  SECURENOW_SAMPLE_FIXTURE_LINE,
  SECURENOW_SAMPLE_HEADING,
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_CONVERSATION_MAILTO,
  WHY_SECURENOW_DRAFT_PITCH,
  WHY_SECURENOW_STATUS_LINE,
} from "@/lib/marketing/securenow-sample-copy";
import { cn } from "@/lib/utils";

/** SN-MKT-09 — public synthetic SecureNow sample (indexed; fixture only). */
export function SecureNowSampleView(): React.JSX.Element {
  return (
    <MarketingPageShell variant="reading" data-testid="securenow-sample-page">
      <div className={cn(MARKETING_LAYOUT.sectionStack, "space-y-8")}>
        <p
          className={cn(MARKETING_TYPOGRAPHY.lead, "text-amber-900 dark:text-amber-200")}
          data-testid="securenow-sample-status-line"
        >
          {WHY_SECURENOW_STATUS_LINE}
        </p>

        <p className={MARKETING_TYPOGRAPHY.body} data-testid="securenow-sample-fixture-line">
          {SECURENOW_SAMPLE_FIXTURE_LINE}
        </p>

        <header className="space-y-3">
          <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{SECURENOW_SAMPLE_HEADING}</h1>
          <p className={MARKETING_TYPOGRAPHY.lead} data-testid="securenow-sample-pitch">
            {WHY_SECURENOW_DRAFT_PITCH}
          </p>
        </header>

        <div className="space-y-6">
          {SECURENOW_SAMPLE_BEATS.map((beat, index) => {
            const headingId = `securenow-sample-beat-${index + 1}-heading`;

            return (
              <section key={beat.title} className="space-y-2" aria-labelledby={headingId}>
                <h2 id={headingId} className={MARKETING_TYPOGRAPHY.sectionTitle}>
                  {beat.title}
                </h2>
                <p className={MARKETING_TYPOGRAPHY.body}>{beat.body}</p>
              </section>
            );
          })}
        </div>

        <p className={MARKETING_TYPOGRAPHY.body}>
          <Link href={WHY_SECURENOW_CONVERSATION_MAILTO} className="text-al-link underline-offset-2 hover:underline">
            {WHY_SECURENOW_CONVERSATION_LABEL}
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
