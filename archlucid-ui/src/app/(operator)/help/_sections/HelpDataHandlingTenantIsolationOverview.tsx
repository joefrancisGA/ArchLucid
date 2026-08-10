import Link from "next/link";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_SUFFIX,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_LEAD,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help-page-layout";
import { cn } from "@/lib/utils";

/** Lead + linked cross-check line for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationOverview(): React.JSX.Element {
  return (
    <div className="space-y-2" data-testid="help-data-handling-tenant-isolation-overview">
      <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_LEAD}</p>
      <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
        {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX}{" "}
        {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.map((link, index) => {
          const linkCount = DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_LINKS.length;
          const isLast = index === linkCount - 1;
          const separator = index === linkCount - 2 ? ", and " : isLast ? "" : ", ";

          return (
            <span key={`${link.href}-${link.label}`}>
              <Link
                className={cn(OPERATOR_LINK.inline, DESIGN_TOKENS.accent.link)}
                href={link.href}
                data-testid={`help-data-handling-tenant-isolation-overview-link-${index}`}
              >
                {link.label}
              </Link>
              {separator}
            </span>
          );
        })}{" "}
        {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_SUFFIX}
      </p>
    </div>
  );
}
