"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  isValueReportOutcomesSurface,
  resolveVisibleValueReportOutcomesTabs,
} from "@/lib/value-report-outcomes-nav-tabs";

/** Single hub navigation for pilot value surfaces — reduces scattered outcomes routes in the sidebar. */
export function ValueReportOutcomesNav(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const onOutcomesSurface = isValueReportOutcomesSurface(pathname);

  if (!onOutcomesSurface) {
    return null;
  }

  const visibleTabs = resolveVisibleValueReportOutcomesTabs(isShowSystemAdministrationNavEnabled());

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-700"
      aria-label="Pilot outcomes"
      data-testid="value-report-outcomes-nav"
    >
      {visibleTabs.map((tab) => {
        const active = tab.match(pathname);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 no-underline",
              OPERATOR_TYPOGRAPHY.helper,
              active
                ? "border border-neutral-300 bg-al-surface-raised font-semibold text-al-text-primary dark:border-neutral-600"
                : "text-al-text-secondary hover:bg-al-layer-hover hover:text-al-text-primary",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
