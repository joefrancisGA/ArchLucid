import Link from "next/link";

import {
  DATA_HANDLING_HELP_IA_DUAL_HEADING,
  DATA_HANDLING_HELP_JOB_MATRIX,
  DATA_HANDLING_HELP_JOB_MATRIX_TEST_ID,
} from "@/lib/data-handling-help-ia-dual";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Job-matrix IA dual for `/help/data-handling` vs Security and trust (TB-1652). */
export function HelpDataHandlingTenantIsolationJobMatrix(): React.JSX.Element {
  return (
    <section
      aria-labelledby="help-data-handling-job-matrix-heading"
      data-testid={DATA_HANDLING_HELP_JOB_MATRIX_TEST_ID}
    >
      <h2
        id="help-data-handling-job-matrix-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {DATA_HANDLING_HELP_IA_DUAL_HEADING}
      </h2>
      <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {DATA_HANDLING_HELP_JOB_MATRIX.map((row) => (
          <li key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
            {row.href !== undefined ? (
              <Link className={cn(OPERATOR_LINK.inline, "shrink-0 font-medium")} href={row.href}>
                {row.label}
              </Link>
            ) : (
              <span className="shrink-0 font-medium text-al-text-primary">{row.label}</span>
            )}
            <span className="text-al-text-secondary">{row.when}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
