import Link from "next/link";

import {
  PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE,
  PILOT_FEEDBACK_HELP_SOURCES,
  PILOT_FEEDBACK_HELP_SOURCES_INTRO,
} from "@/lib/pilot-feedback-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE = "Follow-up surfaces";

/** Claim discipline + cross-topic follow-ups for `/help/pilot-feedback`. */
export function PilotFeedbackHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="help-pilot-feedback-orientation">
      <div className={cn(DESIGN_TOKENS.callout.warn, "p-3")} data-testid="help-pilot-feedback-claim-discipline">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}</p>
      </div>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="help-pilot-feedback-sources-heading"
        data-testid="help-pilot-feedback-sources"
      >
        <h2 id="help-pilot-feedback-sources-heading" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {PILOT_FEEDBACK_HELP_FOLLOW_UPS_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PILOT_FEEDBACK_HELP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {PILOT_FEEDBACK_HELP_SOURCES.map((link) => (
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
