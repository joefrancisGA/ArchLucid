"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const OUTCOMES_TABS = [
  { href: "/value-report", label: "Sponsor report", match: (path: string) => path === "/value-report" },
  { href: "/value-report/pilot", label: "Pilot outcomes", match: (path: string) => path.startsWith("/value-report/pilot") },
  { href: "/value-report/roi", label: "ROI summary", match: (path: string) => path.startsWith("/value-report/roi") },
  { href: "/scorecard", label: "Executive scorecard", match: (path: string) => path.startsWith("/scorecard") },
] as const;

/** Single hub navigation for pilot value surfaces — reduces scattered outcomes routes in the sidebar. */
export function ValueReportOutcomesNav(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const onOutcomesSurface = OUTCOMES_TABS.some((tab) => tab.match(pathname));

  if (!onOutcomesSurface) {
    return null;
  }

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-700"
      aria-label="Pilot outcomes"
      data-testid="value-report-outcomes-nav"
    >
      {OUTCOMES_TABS.map((tab) => {
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
