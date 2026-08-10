import Link from "next/link";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES,
  DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO,
} from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type DataHandlingHelpEvidenceOrientationStripProps = {
  readonly showClaimDiscipline?: boolean;
  readonly showSources?: boolean;
};

/** Claim discipline + Sources orientation for `/help/data-handling`. */
export function DataHandlingHelpEvidenceOrientationStrip(
  props: DataHandlingHelpEvidenceOrientationStripProps,
): React.JSX.Element {
  const showClaimDiscipline = props.showClaimDiscipline !== false;
  const showSources = props.showSources !== false;

  return (
    <div className="space-y-3" data-testid="help-data-handling-tenant-isolation-orientation">
      {showClaimDiscipline ? (
        <aside
          className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
          data-testid="help-data-handling-tenant-isolation-claim-discipline"
        >
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE}
          </p>
        </aside>
      ) : null}

      {showSources ? (
        <section
          className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
          aria-labelledby="help-data-handling-tenant-isolation-sources-heading"
          data-testid="help-data-handling-tenant-isolation-sources"
        >
          <h2
            id="help-data-handling-tenant-isolation-sources-heading"
            className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
          >
            Sources for follow-up
          </h2>
          <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES_INTRO}
          </p>
          <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {DATA_HANDLING_TENANT_ISOLATION_HELP_SOURCES.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
