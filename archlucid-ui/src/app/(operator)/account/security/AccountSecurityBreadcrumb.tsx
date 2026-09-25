import Link from "next/link";

import { ACCOUNT_SECURITY_PAGE_TITLE } from "@/lib/account-security-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Account trail for `/account/security` (ACS). */
export function AccountSecurityBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="account-security-page-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href="/account">
            Account
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {ACCOUNT_SECURITY_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
