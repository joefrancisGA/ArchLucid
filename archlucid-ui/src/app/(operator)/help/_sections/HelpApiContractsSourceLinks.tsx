import Link from "next/link";

import {
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES,
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES_STRIP_INTRO,
  GOVERNANCE_API_CONTRACTS_HELP_SOURCES_STRIP_TITLE,
} from "@/lib/governance-api-contracts-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Related diligence topics for the API contracts technical reference (HG). */
export function HelpApiContractsSourceLinks(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-api-contracts-sources-strip-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-api-contracts-sources-strip"
    >
      <h2
        id="help-api-contracts-sources-strip-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {GOVERNANCE_API_CONTRACTS_HELP_SOURCES_STRIP_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {GOVERNANCE_API_CONTRACTS_HELP_SOURCES_STRIP_INTRO}
      </p>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {GOVERNANCE_API_CONTRACTS_HELP_SOURCES.map((link) => (
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
