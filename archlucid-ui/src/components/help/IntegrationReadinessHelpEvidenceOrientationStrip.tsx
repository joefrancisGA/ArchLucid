import Link from "next/link";

import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_SOURCES,
  INTEGRATION_READINESS_HELP_SOURCES_INTRO,
} from "@/lib/integration-readiness-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";
import { cn } from "@/lib/utils";

/** Claim discipline + connector follow-up index for `/help/integration-readiness`. */
export function IntegrationReadinessHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="integration-readiness-help-orientation">
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="integration-readiness-help-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="integration-readiness-help-sources-heading"
        data-testid="integration-readiness-help-sources"
      >
        <h2
          id="integration-readiness-help-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {HELP_DILIGENCE_ARTIFACT_INDEX_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {INTEGRATION_READINESS_HELP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {INTEGRATION_READINESS_HELP_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                className={cn(OPERATOR_LINK.inline, "inline-flex min-h-6 items-center py-1 font-medium")}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
