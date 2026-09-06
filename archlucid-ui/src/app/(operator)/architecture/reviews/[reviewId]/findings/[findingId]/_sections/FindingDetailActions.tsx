"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FindingAskInlinePanel } from "@/components/findings/FindingAskInlinePanel";
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

import { FindingInspectItsmWorkflowPanel } from "../FindingInspectItsmWorkflowPanel";
import { FindingDetailNextFindingFooter } from "./FindingDetailNextFindingFooter";
import { RunDetailNextReviewFooterClient } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailNextReviewFooterClient";
import type { FindingDetailPresentation } from "./finding-detail-presentation";

type Props = { readonly presentation: FindingDetailPresentation };

/** Finding detail actions and footers. */
export function FindingDetailActions({ presentation }: Props) {
  const { model, graphEvidenceHref, linkedManifestHref } = presentation;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingExportOpenParam = searchParams.get("findingExportOpen");
  const findingTechnicalIdsOpenParam = searchParams.get("findingTechnicalIdsOpen");
  const findingTechnicalAuditOpenParam = searchParams.get("findingTechnicalAuditOpen");
  const [exportOpen, setExportOpenState] = useState(() => parseFindingExportOpenFromSearch(findingExportOpenParam));
  const [technicalIdsOpen, setTechnicalIdsOpenState] = useState(() =>
    parseFindingTechnicalIdsOpenFromSearch(findingTechnicalIdsOpenParam),
  );
  const [technicalAuditOpen, setTechnicalAuditOpenState] = useState(() =>
    parseFindingTechnicalAuditOpenFromSearch(findingTechnicalAuditOpenParam),
  );
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    buyerPolishedShell,
    runExecutionFootnote,
    nextFindingInReview,
  } = model;

  const syncPanelsToUrl = useCallback(
    (state: { exportOpen: boolean; technicalIdsOpen: boolean; technicalAuditOpen: boolean }) => {
      router.replace(findingDetailActionsDisclosureHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setExportOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setExportOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncPanelsToUrl({ exportOpen: next, technicalIdsOpen, technicalAuditOpen });

        return next;
      });
    },
    [syncPanelsToUrl, technicalAuditOpen, technicalIdsOpen],
  );

  const setTechnicalIdsOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setTechnicalIdsOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncPanelsToUrl({ exportOpen, technicalIdsOpen: next, technicalAuditOpen });

        return next;
      });
    },
    [exportOpen, syncPanelsToUrl, technicalAuditOpen],
  );

  const setTechnicalAuditOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setTechnicalAuditOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncPanelsToUrl({ exportOpen, technicalIdsOpen, technicalAuditOpen: next });

        return next;
      });
    },
    [exportOpen, syncPanelsToUrl, technicalIdsOpen],
  );

  useEffect(() => {
    setExportOpenState(parseFindingExportOpenFromSearch(findingExportOpenParam));
  }, [findingExportOpenParam]);

  useEffect(() => {
    setTechnicalIdsOpenState(parseFindingTechnicalIdsOpenFromSearch(findingTechnicalIdsOpenParam));
  }, [findingTechnicalIdsOpenParam]);

  useEffect(() => {
    setTechnicalAuditOpenState(parseFindingTechnicalAuditOpenFromSearch(findingTechnicalAuditOpenParam));
  }, [findingTechnicalAuditOpenParam]);

  return (
    <>
      {inspectPayload !== null && !buyerPolishedShell ? (
        <FindingAskInlinePanel findingId={decodedFindingId} runId={runId} />
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
          <FindingItsmExportPanel runId={runId} findingId={decodedFindingId} payload={inspectPayload} />
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
