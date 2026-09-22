import Link from "next/link";

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Diagram reconciliation breadcrumb (IDI). */
export function DiagramReconcileBreadcrumb(): React.JSX.Element {
  return (
    <nav aria-label="Breadcrumb" data-testid="infra-diagram-reconcile-breadcrumb">
      <ol className={cn("m-0 flex flex-wrap items-center gap-1 p-0 list-none", OPERATOR_TYPOGRAPHY.helper)}>
        <li>
          <Link
            href={GOVERNANCE_INFRASTRUCTURE_PATH}
            className={cn("text-al-link hover:underline", OPERATOR_LINK.inline)}
          >
            {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE}
          </Link>
        </li>
        <li aria-hidden className="text-al-text-secondary">/</li>
        <li className="text-al-text-secondary" aria-current="page">
          {GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
