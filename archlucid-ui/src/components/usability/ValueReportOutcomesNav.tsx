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
      className="border-b border-neutral-200 dark:border-neutral-700"
      data-testid="value-report-outcomes-nav"
    >
      <div
        className="-mb-px flex flex-wrap gap-1"
        role="tablist"
        aria-label="Sponsor report sections"
      >
        {visibleTabs.map((tab) => {
          const active = tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={active}
              className={cn(
                "rounded-t-md border border-b-0 px-3 py-2 no-underline",
                OPERATOR_TYPOGRAPHY.body,
                "font-medium",
                active
                  ? "border-neutral-200 border-b-2 border-b-[var(--al-accent-interactive)] bg-white text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950"
                  : "border-transparent bg-transparent text-al-text-secondary hover:bg-neutral-100 hover:text-al-text-primary dark:hover:bg-neutral-900",
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
