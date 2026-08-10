import Link from "next/link";

import {
  ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES,
  ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO,
} from "@/lib/architecture-created-overview-sources";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Sources and claim discipline for create-home Overview tab (REO). */
export function ArchitectureCreatedOverviewEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3 text-left" data-testid="architecture-overview-orientation">
      <section
        className={cn(DESIGN_TOKENS.callout.info, "p-3")}
        aria-labelledby="architecture-overview-sources-heading"
        data-testid="architecture-overview-sources"
      >
        <h2
          id="architecture-overview-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_OVERVIEW_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_OVERVIEW_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link
                className="font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className={cn(DESIGN_TOKENS.callout.neutral, "p-3")}
        data-testid="architecture-overview-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pre-finalize orientation only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_OVERVIEW_CLAIM_DISCIPLINE}
        </p>
      </aside>
    </div>
  );
}
