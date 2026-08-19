import Link from "next/link";

import {
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO,
  ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_TITLE,
} from "@/lib/engineering-troubleshooting-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Related diligence topics for the engineering troubleshooting runbook (HDX). */
export function HelpEngineeringTroubleshootingSourceLinks(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-engineering-troubleshooting-sources-strip-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-engineering-troubleshooting-sources-strip"
    >
      <h2
        id="help-engineering-troubleshooting-sources-strip-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {ENGINEERING_TROUBLESHOOTING_HELP_SOURCES_STRIP_INTRO}
      </p>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {ENGINEERING_TROUBLESHOOTING_HELP_SOURCES.map((link) => (
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
  );
}
