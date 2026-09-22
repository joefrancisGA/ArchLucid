import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_OPS_ROOT_PATH } from "@/lib/internal-ops-route-paths";
import { OPERATIONAL_ERRORS_PAGE_TITLE } from "@/lib/internal/operational-errors-evidence-copy";
import { cn } from "@/lib/utils";

/** Internal Operations trail for operational errors (INO). */
export function OperationalErrorsBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="operational-errors-page-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href={INTERNAL_OPS_ROOT_PATH}>
            Internal
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {OPERATIONAL_ERRORS_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
