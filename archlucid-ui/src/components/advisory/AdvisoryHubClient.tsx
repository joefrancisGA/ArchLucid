"use client";

import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  ADVISORY_SCANS_PAGE_SUBTITLE,
  ADVISORY_SCANS_PAGE_VALUE_STATEMENT,
  ADVISORY_SCANS_TRUST_COPY,
} from "@/lib/advisory-copy";
import { ADVISORY_HUB_TAB_IDS, advisoryHubTabFromSearchParam, type AdvisoryHubTabId } from "@/lib/advisory-hub-tab";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { AdvisoryScansContent } from "./AdvisoryScansContent";
import { AdvisorySchedulesContent } from "./AdvisorySchedulesContent";

const TAB_PARAM = "tab";

const TAB_LABEL: Record<AdvisoryHubTabId, string> = {
  scans: "Scans",
  schedules: "Schedules",
};

const SCHEDULES_TAB_READER_TITLE =
  "View schedules and executions; creating schedules and running scans now requires Execute-level access.";

export type AdvisoryHubClientProps = {
  readonly initialTab: AdvisoryHubTabId;
};

/**
 * Single `/advisory` ("Advisory scans") surface: **Scans** and **Schedules** tabs. Tab state in `?tab=` for deep links.
 * `initialTab` comes from the server so this tree does not depend on `useSearchParams` (avoids long Suspense fallbacks).
 */
export function AdvisoryHubClient({ initialTab }: AdvisoryHubClientProps): React.JSX.Element {
  const router: ReturnType<typeof useRouter> = useRouter();
  const pathname: string = usePathname();
  const canMutate: boolean = useOperateCapability();
  const [activeTab, setActiveTab] = useState<AdvisoryHubTabId>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const onPop = () => {
      const sp = new URLSearchParams(window.location.search);
      setActiveTab(advisoryHubTabFromSearchParam(sp.get(TAB_PARAM)));
    };

    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  const onSelectTab = useCallback(
    (id: AdvisoryHubTabId) => {
      setActiveTab(id);

      if (id === "scans") {
        router.push(pathname);

        return;
      }

      router.push(`${pathname}?${TAB_PARAM}=${encodeURIComponent(id)}`);
    },
    [pathname, router],
  );

  return (
    <div className="px-0" data-testid="advisory-hub">
      <OperatorPageHeader title={OPERATOR_NAV_LINK_LABELS.architectureAdvisory} subtitle={ADVISORY_SCANS_PAGE_SUBTITLE}>
        <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {ADVISORY_SCANS_PAGE_VALUE_STATEMENT}
        </p>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_TRUST_COPY}
        </p>
      </OperatorPageHeader>

      <nav className="mb-6" aria-label="Advisory hub sections">
        <div
          className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
          role="tablist"
        >
          {ADVISORY_HUB_TAB_IDS.map((id) => {
            const selected: boolean = activeTab === id;
            const softMuted: boolean = !canMutate && id === "schedules";
            const tabTitle: string | undefined =
              !canMutate && id === "schedules" ? SCHEDULES_TAB_READER_TITLE : undefined;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`advisory-hub-tab-${id}`}
                aria-selected={selected}
                data-testid={`advisory-hub-tab-${id}`}
                title={tabTitle}
                onClick={() => {
                  onSelectTab(id);
                }}
                className={cn(
                  "rounded px-3 py-1.5 font-medium transition-colors",
                  OPERATOR_TYPOGRAPHY.body,
                  selected
                    ? "bg-white text-al-text-primary shadow-sm dark:bg-neutral-950"
                    : "bg-transparent text-al-text-secondary hover:text-al-text-primary",
                  softMuted && !selected && "opacity-80",
                )}
              >
                {TAB_LABEL[id]}
              </button>
            );
          })}
        </div>
      </nav>

      <div
        className="min-w-0"
        role="tabpanel"
        aria-labelledby={`advisory-hub-tab-${activeTab}`}
        data-testid="advisory-hub-panel"
      >
        {activeTab === "scans" ? <AdvisoryScansContent /> : null}
        {activeTab === "schedules" ? <AdvisorySchedulesContent /> : null}
      </div>
    </div>
  );
}
