"use client";

import { useMemo, type ReactElement } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  isValueReportOutcomesSurface,
  resolveVisibleValueReportOutcomesTabs,
  type ValueReportOutcomesTab,
} from "@/lib/value-report-outcomes-nav-tabs";

/** Single hub navigation for pilot value surfaces — reduces scattered outcomes routes in the sidebar. */
export function ValueReportOutcomesNav(): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const onOutcomesSurface = isValueReportOutcomesSurface(pathname);

  const visibleTabs: readonly ValueReportOutcomesTab[] = useMemo(
    () => resolveVisibleValueReportOutcomesTabs(isShowSystemAdministrationNavEnabled()),
    [],
  );

  const activeHref: string = useMemo(() => {
    const match = visibleTabs.find((tab) => tab.match(pathname));

    return match?.href ?? visibleTabs[0]?.href ?? "/value-report";
  }, [pathname, visibleTabs]);

  if (!onOutcomesSurface) {
    return null;
  }

  return (
    <Tabs
      value={activeHref}
      onValueChange={(href) => {
        router.push(href);
      }}
      className="mb-2"
      data-testid="value-report-outcomes-nav"
    >
      <TabsList aria-label="Insights outcomes" data-testid="value-report-outcomes-tablist">
        {visibleTabs.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} data-testid={`value-report-outcomes-tab-${tab.href.replace(/\//g, "-")}`}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
