import Link from "next/link";

import {
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_SUFFIX,
  DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_LEAD,
  dataHandlingTenantIsolationHelpOverviewCrossCheckLinks,
} from "@/lib/data-handling-tenant-isolation-help-guide-content";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

/** Lead + linked cross-check line for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationOverview(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const crossCheckLinks = dataHandlingTenantIsolationHelpOverviewCrossCheckLinks(buyerPolishedShell);

  return (
    <div className="space-y-2" data-testid="help-data-handling-tenant-isolation-overview">
      <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>{DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_LEAD}</p>
      <p className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}>
        {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_PREFIX}{" "}
        {crossCheckLinks.map((link, index) => (
          <Link
            key={link.href}
            className={cn(OPERATOR_LINK.inline, DESIGN_TOKENS.accent.link)}
            href={link.href}
            data-testid={`help-data-handling-tenant-isolation-overview-link-${index}`}
          >
            {link.label}
          </Link>
        ))}{" "}
        {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CROSS_CHECK_SUFFIX}
      </p>
      <p
        className={cn("m-0", HELP_PAGE_LAYOUT.readingBody)}
        data-testid="help-data-handling-tenant-isolation-contracted-pack-follow-up"
      >
        {DATA_HANDLING_TENANT_ISOLATION_HELP_OVERVIEW_CONTRACTED_PACK_FOLLOW_UP}
      </p>
    </div>
  );
}
