import Link from "next/link";

import {
  SYSTEM_HEALTH_CLAIM_DISCIPLINE,
  SYSTEM_HEALTH_SOURCES,
  SYSTEM_HEALTH_SOURCES_INTRO,
} from "@/lib/system-health-evidence-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Sources + claim discipline for `/administration/system-health` (ADY Evidence). */
export function SystemHealthSourcesStrip(): React.JSX.Element {
  return (
    <div className="mt-4 space-y-3" data-testid="system-health-orientation">
      <section
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
        aria-labelledby="system-health-sources-heading"
        data-testid="system-health-sources"
      >
        <h2
          id="system-health-sources-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Sources for follow-up
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SYSTEM_HEALTH_SOURCES_INTRO}
        </p>
        <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {SYSTEM_HEALTH_SOURCES.map((link) => (
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
        data-testid="system-health-claim-discipline"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Operational readiness only</h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{SYSTEM_HEALTH_CLAIM_DISCIPLINE}</p>
      </aside>
    </div>
  );
}
