import { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Infrastructure overview hub breadcrumb (IN / GOI). */
export function InfrastructureOverviewBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="governance-infrastructure-overview-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li aria-current="page" className="text-al-text-primary">
          {GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
