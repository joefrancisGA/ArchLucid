import Link from "next/link";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Leaves vs stays orientation cards for `/help/data-handling` first viewport (TB-1654). */
export function HelpDataHandlingTenantIsolationLeavesStaysChrome(): React.JSX.Element {
  return (
    <section
      aria-labelledby="help-data-handling-tenant-isolation-leaves-stays-heading"
      className="space-y-3"
      data-testid="help-data-handling-tenant-isolation-leaves-stays"
    >
      <h2
        id="help-data-handling-tenant-isolation-leaves-stays-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Data boundary at a glance
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {DATA_HANDLING_TENANT_ISOLATION_HELP_LEAVES_STAYS_CARDS.map((card) => (
          <div
            key={card.id}
            className={cn(
              "space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
            )}
            data-testid={`help-data-handling-tenant-isolation-${card.id}-card`}
          >
            <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{card.title}</h3>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{card.summary}</p>
            <Link
              className={cn(OPERATOR_LINK.inline, "text-sm font-medium")}
              href={`#${card.sectionAnchor}`}
              data-testid={`help-data-handling-tenant-isolation-${card.id}-deep-link`}
            >
              Read full section
            </Link>
          </div>
        ))}
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Optional connectors, demo data, and AI provider handling are covered below — start with leaves vs stays when
        sponsors ask where review evidence flows.
      </p>
    </section>
  );
}
