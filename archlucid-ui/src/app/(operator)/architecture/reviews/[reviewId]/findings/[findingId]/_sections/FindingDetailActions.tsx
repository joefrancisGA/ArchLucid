"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

import { FindingAskInlinePanel } from "@/components/findings/FindingAskInlinePanel";
import { FindingDidNotThinkOfThatButton } from "@/components/findings/FindingDidNotThinkOfThatButton";
import { FindingIacStubPanel } from "@/components/findings/FindingIacStubPanel";
import { FindingItsmExportPanel } from "@/components/findings/FindingItsmExportPanel";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { OperatorEvidenceLimitsFooter } from "@/components/operator/OperatorEvidenceLimitsFooter";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  findingDetailActionsDisclosureHrefFromSearch,
  parseFindingExportOpenFromSearch,
  parseFindingTechnicalAuditOpenFromSearch,
  parseFindingTechnicalIdsOpenFromSearch,
} from "@/lib/findings/finding-detail-actions-disclosure-url";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { FindingInspectItsmWorkflowPanel } from "../FindingInspectItsmWorkflowPanel";
import { FindingDetailNextFindingFooter } from "./FindingDetailNextFindingFooter";
import { RunDetailNextReviewFooterClient } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailNextReviewFooterClient";
import type { FindingDetailPresentation } from "./finding-detail-presentation";

type Props = { readonly presentation: FindingDetailPresentation };

type ActionsDisclosureState = {
  exportOpen: boolean;
  technicalIdsOpen: boolean;
  technicalAuditOpen: boolean;
};

function readActionsDisclosureStateFromWindow(): ActionsDisclosureState {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);

  return {
    exportOpen: parseFindingExportOpenFromSearch(params.get("findingExportOpen")),
    technicalIdsOpen: parseFindingTechnicalIdsOpenFromSearch(params.get("findingTechnicalIdsOpen")),
    technicalAuditOpen: parseFindingTechnicalAuditOpenFromSearch(params.get("findingTechnicalAuditOpen")),
  };
}

/** Finding detail actions and footers. */
export function FindingDetailActions({ presentation }: Props) {
  const { model, graphEvidenceHref, linkedManifestHref, transparencyTrail } = presentation;
  const pathname = usePathname() ?? "/";
  const [actionsState, setActionsState] = useState<ActionsDisclosureState>(() => readActionsDisclosureStateFromWindow());
  const actionsStateRef = useRef(actionsState);
  actionsStateRef.current = actionsState;
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    buyerPolishedShell,
    runExecutionFootnote,
    nextFindingInReview,
  } = model;
  const { exportOpen, technicalIdsOpen, technicalAuditOpen } = actionsState;

  const syncPanelsToUrl = useCallback(
    (state: ActionsDisclosureState) => {
      commitHrefIfChanged(
        findingDetailActionsDisclosureHrefFromSearch(readWindowLocationSearch(), state, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const updateActionsState = useCallback(
    (next: ActionsDisclosureState) => {
      if (
        actionsStateRef.current.exportOpen === next.exportOpen
        && actionsStateRef.current.technicalIdsOpen === next.technicalIdsOpen
        && actionsStateRef.current.technicalAuditOpen === next.technicalAuditOpen
      ) {
        return;
      }

      actionsStateRef.current = next;
      setActionsState(next);
      syncPanelsToUrl(next);
    },
    [syncPanelsToUrl],
  );

  const setExportOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = actionsStateRef.current;
      const next = typeof value === "function" ? value(current.exportOpen) : value;
      updateActionsState({ ...current, exportOpen: next });
    },
    [updateActionsState],
  );

  const setTechnicalIdsOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = actionsStateRef.current;
      const next = typeof value === "function" ? value(current.technicalIdsOpen) : value;
      updateActionsState({ ...current, technicalIdsOpen: next });
    },
    [updateActionsState],
  );

  const setTechnicalAuditOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = actionsStateRef.current;
      const next = typeof value === "function" ? value(current.technicalAuditOpen) : value;
      updateActionsState({ ...current, technicalAuditOpen: next });
    },
    [updateActionsState],
  );

  useEffect(() => {
    const syncFromUrl = (): void => {
      const next = readActionsDisclosureStateFromWindow();

      if (
        actionsStateRef.current.exportOpen === next.exportOpen
        && actionsStateRef.current.technicalIdsOpen === next.technicalIdsOpen
        && actionsStateRef.current.technicalAuditOpen === next.technicalAuditOpen
      ) {
        return;
      }

      actionsStateRef.current = next;
      setActionsState(next);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  return (
    <>
      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingAskInlinePanel findingId={decodedFindingId} runId={runId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <div className="mt-2">
          <FindingDidNotThinkOfThatButton runId={runId} findingId={decodedFindingId} />
        </div>
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingIacStubPanel
          runId={runId}
          findingId={decodedFindingId}
          manifestVersion={inspectPayload.manifestVersion ?? null}
        />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingInspectItsmWorkflowPanel findingId={decodedFindingId} />
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection
          title="Export finding"
          open={exportOpen}
          onToggle={setExportOpen}
          summaryLine="Copy for Jira, Azure Boards, or ServiceNow"
        >
          <FindingItsmExportPanel
            runId={runId}
            findingId={decodedFindingId}
            payload={inspectPayload}
            transparencyTrail={transparencyTrail}
          />
        </CollapsibleSection>
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Technical identifiers" open={technicalIdsOpen} onToggle={setTechnicalIdsOpen}>
          <dl className={cn("m-0 grid gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Finding id</dt>
              <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                <code
                  className={cn(
                    "max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                >
                  {decodedFindingId}
                </code>
                <CopyIdButton value={decodedFindingId} aria-label="Copy finding ID" />
              </dd>
            </div>
            {inspectPayload.manifestVersion ? (
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Review record version</dt>
                <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{inspectPayload.manifestVersion}</dd>
              </div>
            ) : null}
          </dl>
        </CollapsibleSection>
      ) : null}

      {inspectPayload !== null && !buyerPolishedShell ? (
        <CollapsibleSection title="Technical audit trail" open={technicalAuditOpen} onToggle={setTechnicalAuditOpen}>
          <FindingExplainPanel
            runId={runId}
            findingId={findingIdRouteParam}
            confidenceLevel={inspectPayload?.confidenceLevel ?? null}
            graphEvidenceHref={graphEvidenceHref}
            linkedManifestHref={linkedManifestHref}
          />
        </CollapsibleSection>
      ) : null}

      {nextFindingInReview !== null ? <FindingDetailNextFindingFooter target={nextFindingInReview} /> : null}

      <RunDetailNextReviewFooterClient runId={runId} />

      <OperatorEvidenceLimitsFooter
        runId={runId}
        findingIdForInspectLink={buyerPolishedShell ? null : decodedFindingId}
        execution={runExecutionFootnote}
        inspectMetadata={
          inspectPayload !== null
            ? {
                modelDeploymentName: inspectPayload.modelDeploymentName ?? null,
                modelAlias: inspectPayload.modelAlias ?? null,
                promptTemplateVersion: inspectPayload.promptTemplateVersion ?? null,
              }
            : null
        }
      />
    </>
  );
}
