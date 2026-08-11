import Link from "next/link";

import {
  TROUBLESHOOTING_HELP_APPLICABILITY,
  TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE,
  TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL,
  TROUBLESHOOTING_HELP_RELATED_TITLE,
  TROUBLESHOOTING_HELP_SOURCES,
  TROUBLESHOOTING_HELP_SOURCES_INTRO,
} from "@/lib/troubleshooting-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Freshness + claim discipline for `/help/troubleshooting` (not a diligence Sources trail). */
export function TroubleshootingHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="troubleshooting-help-orientation">
      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="troubleshooting-help-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="troubleshooting-help-freshness"
      >
        <span className="font-medium text-al-text-primary">{TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL}</span>
        {" — "}
        {TROUBLESHOOTING_HELP_APPLICABILITY}
      </p>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="troubleshooting-help-related-heading"
        data-testid="troubleshooting-help-related"
      >
        <h2
          id="troubleshooting-help-related-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {TROUBLESHOOTING_HELP_RELATED_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {TROUBLESHOOTING_HELP_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {TROUBLESHOOTING_HELP_SOURCES.map((link) => (
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
