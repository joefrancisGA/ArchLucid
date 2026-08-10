import Link from "next/link";

import {
  ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES,
  ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO,
} from "@/lib/architecture-created-findings-sources";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Sources and claim discipline for create-home Findings tab (REF). */
export function ArchitectureCreatedFindingsEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3 text-left" data-testid="architecture-findings-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="architecture-findings-sources-heading"
        data-testid="architecture-findings-sources"
      >
        <h2
          id="architecture-findings-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_FINDINGS_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_FINDINGS_SOURCES.map((link) => (
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
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="architecture-findings-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pre-finalize findings only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_FINDINGS_CLAIM_DISCIPLINE}
        </p>
      </aside>
    </div>
  );
}
