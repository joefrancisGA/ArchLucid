import {
  ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW,
  ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { cn } from "@/lib/utils";

type HelpEngineeringTroubleshootingRunbookOverviewProps = {
  readonly majorSections: readonly HelpMarkdownHeading[];
};

/** Runbook overview landing for the engineering troubleshooting help topic (HDX). */
export function HelpEngineeringTroubleshootingRunbookOverview(
  props: HelpEngineeringTroubleshootingRunbookOverviewProps,
): React.ReactElement {
  const { majorSections } = props;

  return (
    <section
      aria-labelledby="help-engineering-troubleshooting-runbook-overview-heading"
      className="space-y-4 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="help-engineering-troubleshooting-runbook-overview"
    >
      <div className="space-y-1">
        <h2
          id="help-engineering-troubleshooting-runbook-overview-heading"
          className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.title}
        </h2>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{ENGINEERING_TROUBLESHOOTING_HELP_OVERVIEW}</p>
      </div>

      <dl className="m-0 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Audience</dt>
          <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
            {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.audience}
          </dd>
        </div>
        <div>
          <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Support status</dt>
          <dd className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
            {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.stability}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.label)}>Authoritative source</dt>
          <dd className={cn("m-0 mt-1 font-mono text-sm", OPERATOR_TYPOGRAPHY.body)}>
            {ENGINEERING_TROUBLESHOOTING_HELP_RUNBOOK_OVERVIEW.documentSource}
          </dd>
        </div>
      </dl>

      {majorSections.length > 0 ? (
        <div>
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Major runbook sections</h3>
          <ul
            className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0"
            data-testid="help-engineering-troubleshooting-major-sections"
          >
            {majorSections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "inline-flex rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm no-underline transition-colors hover:border-teal-600/40 hover:bg-teal-50/40 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-teal-600/40 dark:hover:bg-teal-950/20",
                    DESIGN_TOKENS.accent.link,
                  )}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
