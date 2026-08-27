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
      className="border-b border-neutral-200 dark:border-neutral-800"
      data-testid="value-report-outcomes-nav"
      aria-label="Sponsor report sections"
    >
      <div className="-mb-px flex flex-wrap gap-1">
        {visibleTabs.map((tab) => {
          const active = tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "px-4 py-2 no-underline outline-none transition-colors",
                OPERATOR_TYPOGRAPHY.body,
                "-mb-px border-b-2",
                active
                  ? "border-neutral-600 font-semibold text-al-text-primary dark:border-neutral-400 dark:text-neutral-100"
                  : "border-transparent font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100",
                "focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
