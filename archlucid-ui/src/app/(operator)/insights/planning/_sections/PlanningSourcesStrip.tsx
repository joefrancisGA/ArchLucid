import Link from "next/link";

import {
  PLANNING_SOURCES,
  PLANNING_SOURCES_INTRO,
} from "@/lib/planning-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { PlanningClaimDisciplineCallout } from "./PlanningClaimDisciplineCallout";

/** Sources + claim discipline for `/insights/planning` (PLA Evidence). */
export function PlanningSourcesStrip(): React.JSX.Element {
  return (
    <div className="mt-4 space-y-3" data-testid="planning-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="planning-sources-heading"
        data-testid="planning-sources"
      >
        <h2
          id="planning-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PLANNING_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {PLANNING_SOURCES.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PlanningClaimDisciplineCallout />
    </div>
  );
}
