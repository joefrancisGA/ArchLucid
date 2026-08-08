"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ArchitectureCreatedClarificationsPanel } from "@/components/architecture/ArchitectureCreatedClarificationsPanel";
import { ArchitectureCreatedCompactFirstViewport } from "@/components/architecture/ArchitectureCreatedCompactFirstViewport";
import { ArchitectureCreatedDiagramEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedDiagramEvidenceOrientationStrip";
import { ArchitectureCreatedEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedEvidenceOrientationStrip";
import { ArchitectureCreatedFindingsEvidenceOrientationStrip } from "@/components/architecture/ArchitectureCreatedFindingsEvidenceOrientationStrip";
import { ArchitectureCreatedOverviewPanel } from "@/components/architecture/ArchitectureCreatedOverviewPanel";
import { ArchitectureCreatedWorkspaceHeader } from "@/components/architecture/ArchitectureCreatedWorkspaceHeader";
import { ArchitectureDiagramPanel } from "@/components/architecture/ArchitectureDiagramPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  countOpenClarifications,
  countOpenQuestionEntities,
} from "@/lib/architecture-open-clarifications-count";
import {
  buildArchitectureCreatedHomeModel,
  mergeArchitectureCreatedHomeInput,
  type BuildArchitectureCreatedHomeModelInput,
} from "@/lib/architecture-created-home-model";
import { readArchitectureCreationHandoff } from "@/lib/architecture-creation-handoff";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import {
  ARCHITECTURE_WORKSPACE_TAB_LABELS,
  ARCHITECTURE_WORKSPACE_TAB_PARAM,
  type ArchitectureWorkspaceTabId,
  resolveArchitectureWorkspaceTab,
  resolveArchitectureWorkspaceTabFromHash,
} from "@/lib/architecture-workspace-tabs";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { REVIEWS_NEW_CREATE_ARCHITECTURE_HREF } from "@/lib/reviews-new-path-copy";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ArchitectureCreatedWorkspacePanels = {
  readonly findings: ReactNode;
  readonly evidence: ReactNode;
  readonly governance: ReactNode;
  readonly activity: ReactNode;
  readonly submittedArchitecture: ReactNode;
};

export type ArchitectureCreatedWorkspaceProps = {
  readonly baseline: BuildArchitectureCreatedHomeModelInput;
  readonly architectureSourceText: string;
  readonly canEditDiagram: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly panels: ArchitectureCreatedWorkspacePanels;
  readonly correctionHref: string | null;
};

function resolveUserAssertions(
  merged: BuildArchitectureCreatedHomeModelInput,
): ArchitectureCreationUserAssertions {
  return {
    architectureName: merged.architectureName,
    architectureOverview: merged.architectureOverview,
    businessOutcome: merged.businessOutcome,
    peopleAndSystems: merged.peopleAndSystems,
  };
}

/** Tabbed post-creation architecture workspace with compact first viewport and lazy tab panels. */
export function ArchitectureCreatedWorkspace(props: ArchitectureCreatedWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hashResolved, setHashResolved] = useState(false);

  const merged = useMemo(() => {
    const snapshot = readArchitectureCreationHandoff(props.baseline.runId);

    return mergeArchitectureCreatedHomeInput(props.baseline, snapshot);
  }, [props.baseline]);

  const model = useMemo(() => buildArchitectureCreatedHomeModel(merged), [merged]);
  const userAssertions = useMemo(
    () => resolveUserAssertions(merged),
    [merged],
  );
  const openQuestionCount = useMemo(
    () => countOpenQuestionEntities(props.architectureSourceText, userAssertions),
    [props.architectureSourceText, userAssertions],
  );

  const activeTab = resolveArchitectureWorkspaceTab(searchParams.get(ARCHITECTURE_WORKSPACE_TAB_PARAM));

  const navigateTab = useCallback(
    (tab: ArchitectureWorkspaceTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(ARCHITECTURE_WORKSPACE_TAB_PARAM, tab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (hashResolved) {
      return;
    }

    const hash = window.location.hash.slice(1);
    const tabFromHash = resolveArchitectureWorkspaceTabFromHash(hash);

    if (tabFromHash === null) {
      setHashResolved(true);

      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(ARCHITECTURE_WORKSPACE_TAB_PARAM, tabFromHash);
    router.replace(`${pathname}?${params.toString()}#${hash}`, { scroll: false });
    setHashResolved(true);
  }, [hashResolved, pathname, router, searchParams]);

  const findingsCount = props.findings.length;
  const clarificationsCount = countOpenClarifications(model.missingItems.length, openQuestionCount);

  return (
    <div className="space-y-5" data-testid="architecture-created-workspace">
      <ArchitectureCreatedWorkspaceHeader model={model} onNavigateTab={navigateTab} />

      <ArchitectureCreatedCompactFirstViewport
        model={model}
        runId={props.baseline.runId}
        architectureSourceText={props.architectureSourceText}
        userAssertions={userAssertions}
        canEditDiagram={props.canEditDiagram}
        onNavigateTab={navigateTab}
      />

      <Tabs value={activeTab} onValueChange={(value) => navigateTab(resolveArchitectureWorkspaceTab(value))}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList aria-label="Architecture workspace sections" data-testid="architecture-workspace-tabs">
            {(Object.keys(ARCHITECTURE_WORKSPACE_TAB_LABELS) as ArchitectureWorkspaceTabId[]).map((tabId) => {
              const count =
                tabId === "clarifications" && clarificationsCount > 0
                  ? clarificationsCount
                  : tabId === "findings" && findingsCount > 0
                    ? findingsCount
                    : null;

              return (
                <TabsTrigger
                  key={tabId}
                  value={tabId}
                  data-testid={`architecture-workspace-tab-${tabId}`}
                  className="whitespace-nowrap"
                >
                  {ARCHITECTURE_WORKSPACE_TAB_LABELS[tabId]}
                  {count !== null ? (
                    <span
                      className={cn(
                        "ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
                        OPERATOR_TYPOGRAPHY.helper,
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" data-testid="architecture-workspace-panel-overview">
          <ArchitectureCreatedOverviewPanel
            model={model}
            sourceText={props.architectureSourceText}
            userAssertions={userAssertions}
            correctionHref={props.correctionHref}
            onNavigateTab={navigateTab}
            submittedArchitectureSection={props.panels.submittedArchitecture}
          />
        </TabsContent>

        <TabsContent value="diagram" data-testid="architecture-workspace-panel-diagram">
          <div className="space-y-4">
            <ArchitectureCreatedDiagramEvidenceOrientationStrip />
            <ArchitectureDiagramPanel
              runId={props.baseline.runId}
              architectureName={merged.architectureName}
              sourceText={props.architectureSourceText}
              userAssertions={userAssertions}
              canEdit={props.canEditDiagram}
              clarifyHref={REVIEWS_NEW_CREATE_ARCHITECTURE_HREF}
              variant="full"
            />
          </div>
        </TabsContent>

        <TabsContent value="clarifications" data-testid="architecture-workspace-panel-clarifications">
          <ArchitectureCreatedClarificationsPanel
            model={model}
            sourceText={props.architectureSourceText}
            userAssertions={userAssertions}
            correctionHref={props.correctionHref}
            onNavigateTab={navigateTab}
          />
        </TabsContent>

        <TabsContent value="findings" data-testid="architecture-workspace-panel-findings">
          <div className="space-y-4">
            <ArchitectureCreatedFindingsEvidenceOrientationStrip />
            {props.panels.findings}
          </div>
        </TabsContent>

        <TabsContent value="evidence" data-testid="architecture-workspace-panel-evidence">
          <div className="space-y-4">
            <ArchitectureCreatedEvidenceOrientationStrip />
            {props.panels.evidence}
          </div>
        </TabsContent>

        <TabsContent value="governance" data-testid="architecture-workspace-panel-governance">
          {props.panels.governance}
        </TabsContent>

        <TabsContent value="activity" data-testid="architecture-workspace-panel-activity">
          {props.panels.activity}
        </TabsContent>
      </Tabs>
    </div>
  );
}
