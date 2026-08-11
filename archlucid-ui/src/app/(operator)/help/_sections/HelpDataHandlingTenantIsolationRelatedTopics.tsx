import Link from "next/link";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING,
  DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { OPERATOR_LINK, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** React-owned Related topics for `/help/data-handling` (TB-1655). */
export function HelpDataHandlingTenantIsolationRelatedTopics(): React.JSX.Element {
  return (
    <section
      id={DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING_ID}
      aria-labelledby="help-data-handling-tenant-isolation-related-heading"
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40",
        OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
        "scroll-mt-24",
      )}
      data-testid="help-data-handling-tenant-isolation-related"
    >
      <h2
        id="help-data-handling-tenant-isolation-related-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED_TOPICS_HEADING}
      </h2>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
        {DATA_HANDLING_TENANT_ISOLATION_HELP_RELATED.map((link) => (
          <li key={link.href}>
            <Link
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              href={link.href}
              data-testid={`help-data-handling-tenant-isolation-related-link-${link.label}`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
