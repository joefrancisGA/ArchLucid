"use client";

import { cn } from "@/lib/utils";

import { useCallback, useEffect, useId, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ADVISORY_SCANS_HREF } from "@/lib/advisory-scans-route";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { ADVISORY_SCANS_PAGE_LEAD } from "@/lib/advisory-copy";
import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import { ADVISORY_HUB_TAB_IDS, advisoryHubTabFromSearchParam, type AdvisoryHubTabId } from "@/lib/advisory-hub-tab";
import { scopedRunIdFromQuery } from "@/lib/architecture/architecture-risk-register-page";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { AdvisoryScansContent } from "./AdvisoryScansContent";
import { AdvisorySchedulesContent } from "./AdvisorySchedulesContent";

const TAB_PARAM = "tab";

const TAB_LABEL: Record<AdvisoryHubTabId, string> = {
  scans: "Scans",
  schedules: "Schedules",
};

const SCHEDULES_TAB_READER_DESCRIPTION =
  "View schedules and executions; creating schedules and running scans now requires a management role.";

export type AdvisoryHubClientProps = {
  readonly initialTab: AdvisoryHubTabId;
  /** Optional product-run scope from `?runId=` (ArchitectureIntelligence publish round-trip). */
  readonly initialRunId?: string | null;
};

/**
 * Advisory scans hub under `/governance/advisory-scans`: **Scans** and **Schedules** tabs.
 * Tab state in `?tab=` for deep links. `initialTab` / `initialRunId` come from the server (no `useSearchParams` Suspense).
 */
export function AdvisoryHubClient({ initialTab, initialRunId = null }: AdvisoryHubClientProps): React.JSX.Element {
  const router: ReturnType<typeof useRouter> = useRouter();
  const pathname: string = usePathname();
  const canMutate: boolean = useOperateCapability();
  const [activeTab, setActiveTab] = useState<AdvisoryHubTabId>(initialTab);
  const scopedRunId = scopedRunIdFromQuery(initialRunId);
  const schedulesTabReaderHintId = useId();

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
      router.push(buildAdvisoryHubHref({ pathname, tab: tabId, runId: scopedRunId }));
    },
    [pathname, router, scopedRunId],
  );

  return (
    <div className="px-0" data-testid="advisory-hub">
      <OperatorPageHeader
        navHref={ADVISORY_SCANS_HREF}
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

      <Tabs value={activeTab} onValueChange={onSelectTab} variant="line" className="mb-6">
        <TabsList aria-label="Advisory hub sections" data-testid="advisory-hub-tablist">
          {ADVISORY_HUB_TAB_IDS.map((id) => {
            const readerHintId = !canMutate && id === "schedules" ? schedulesTabReaderHintId : undefined;

            return (
              <TabsTrigger
                key={id}
                value={id}
                data-testid={`advisory-hub-tab-${id}`}
                aria-describedby={readerHintId}
              >
                {TAB_LABEL[id]}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {!canMutate ? (
          <span id={schedulesTabReaderHintId} className="sr-only">
            {SCHEDULES_TAB_READER_DESCRIPTION}
          </span>
        ) : null}

        <TabsContent value="scans" className="mt-4 min-w-0" data-testid="advisory-hub-panel">
          <AdvisoryScansContent initialRunId={scopedRunId} />
        </TabsContent>
        <TabsContent value="schedules" className="mt-4 min-w-0">
          <AdvisorySchedulesContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
