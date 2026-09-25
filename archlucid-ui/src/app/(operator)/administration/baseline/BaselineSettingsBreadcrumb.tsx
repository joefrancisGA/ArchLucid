import Link from "next/link";

import { BASELINE_SETTINGS_PAGE_TITLE } from "@/lib/baseline-settings-present";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { cn } from "@/lib/utils";

/** Administration trail for ROI baseline settings (ADB). */
export function BaselineSettingsBreadcrumb(): React.JSX.Element {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="baseline-settings-page-breadcrumb"
    >
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        <li>
          <Link className={OPERATOR_LINK.inline} href={SETTINGS_ROOT_PATH}>
            Administration
          </Link>
        </li>
        <li aria-hidden="true" className="text-al-text-secondary">/</li>
        <li aria-current="page" className="text-al-text-primary">
          {BASELINE_SETTINGS_PAGE_TITLE}
        </li>
      </ol>
    </nav>
  );
}
