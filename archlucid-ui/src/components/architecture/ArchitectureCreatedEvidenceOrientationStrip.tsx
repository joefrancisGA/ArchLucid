"use client";

import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  ARCHITECTURE_CREATED_EVIDENCE_CLAIM_DISCIPLINE,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES,
  ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO,
} from "@/lib/architecture-created-evidence-sources";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Category-1 help + Sources/claim discipline for create-home Evidence archTab (REE). */
export function ArchitectureCreatedEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="architecture-created-evidence-orientation">
      <div className="flex flex-wrap justify-end">
        <PageContextualHelpButton />
      </div>

      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="architecture-created-evidence-sources-heading"
        data-testid="architecture-created-evidence-sources"
      >
        <h2
          id="architecture-created-evidence-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_CREATED_EVIDENCE_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {ARCHITECTURE_CREATED_EVIDENCE_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20"
        data-testid="architecture-created-evidence-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Capture upload only
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>
          {ARCHITECTURE_CREATED_EVIDENCE_CLAIM_DISCIPLINE}
        </p>
      </aside>
    </div>
  );
}
