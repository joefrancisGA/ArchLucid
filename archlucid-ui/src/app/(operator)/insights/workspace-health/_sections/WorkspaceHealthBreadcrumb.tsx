import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE } from "@/lib/sponsor/sponsor-workspace-health-page-copy";
import { cn } from "@/lib/utils";

/** Insights trail for workspace health KPIs (INW). */
export function WorkspaceHealthBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="workspace-health-page-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href="/insights">
            Insights
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {SPONSOR_WORKSPACE_HEALTH_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
