"use client";

import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  ADVISORY_SCANS_HOW_IT_WORKS_BODY,
  ADVISORY_SCANS_HOW_IT_WORKS_TITLE,
  ADVISORY_SCANS_PAGE_LEAD,
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
  "View schedules and executions; creating schedules and running scans now requires a management role.";

export type AdvisoryHubClientProps = {
  readonly initialTab: AdvisoryHubTabId;
};

/**
 * Advisory scans hub under `/governance/advisory-scans`: **Scans** and **Schedules** tabs.
 * Tab state in `?tab=` for deep links. `initialTab` comes from the server (no `useSearchParams` Suspense).
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
    (id: string) => {
      const tabId = advisoryHubTabFromSearchParam(id);
      setActiveTab(tabId);

      if (tabId === "scans") {
        router.push(pathname);

        return;
      }

      router.push(`${pathname}?${TAB_PARAM}=${encodeURIComponent(tabId)}`);
    },
    [pathname, router],
  );

  return (
    <div className="px-0" data-testid="advisory-hub">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.architectureAdvisory}
        actions={<PageContextualHelpButton />}
        titleTestId="advisory-scans-page-title"
      >
        <p
          data-testid="advisory-scans-page-lead"
          className={cn("m-0 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        >
          {ADVISORY_SCANS_PAGE_LEAD}
        </p>
      </OperatorPageHeader>

      <CollapsibleSection title={ADVISORY_SCANS_HOW_IT_WORKS_TITLE} sectionTestId="advisory-scans-how-it-works">
        <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {ADVISORY_SCANS_HOW_IT_WORKS_BODY}
        </p>
      </CollapsibleSection>

      <Tabs value={activeTab} onValueChange={onSelectTab} className="mb-6">
        <TabsList
          aria-label="Advisory hub sections"
          data-testid="advisory-hub-tablist"
          className="mb-0 inline-flex w-fit gap-0 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 border-b-0 pb-0.5 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {ADVISORY_HUB_TAB_IDS.map((id) => {
            const selected = activeTab === id;
            const tabTitle: string | undefined =
              !canMutate && id === "schedules" ? SCHEDULES_TAB_READER_TITLE : undefined;

            return (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`advisory-hub-tab-${id}`}
                title={tabTitle}
                className={cn(
                  "-mb-px mb-0 rounded border-0 border-b-0 px-3 py-1.5 shadow-none",
                  selected
                    ? "bg-white text-al-text-primary shadow-sm dark:bg-neutral-950"
                    : "bg-transparent text-neutral-700 hover:text-al-text-primary dark:text-neutral-300",
                )}
              >
                {TAB_LABEL[id]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="scans" className="mt-4 min-w-0" data-testid="advisory-hub-panel">
          <AdvisoryScansContent />
        </TabsContent>
        <TabsContent value="schedules" className="mt-4 min-w-0">
          <AdvisorySchedulesContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
