"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingAskInlinePanel } from "@/components/findings/FindingAskInlinePanel";
import { findingSemanticSupportBandFromTypedPayload } from "@/components/findings/FindingSemanticSupportBandInspectSection";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";
import { FindingItsmExportPanel } from "@/components/findings/FindingItsmExportPanel";
import { FindingProvenancePanel } from "@/components/findings/FindingProvenancePanel";
import { ProductLearningFeedbackControls } from "@/components/ProductLearningFeedbackControls";
import { cn } from "@/lib/utils";
import { isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  findingDetailActionsDisclosureHrefFromSearch,
  parseFindingExportOpenFromSearch,
  parseFindingTechnicalAuditOpenFromSearch,
  parseFindingTechnicalIdsOpenFromSearch,
} from "@/lib/findings/finding-detail-actions-disclosure-url";
import {
  findingDetailInspectDisclosureHrefFromSearch,
  parseFindingAuditOpenFromSearch,
  parseFindingEvidenceBasisOpenFromSearch,
  parseFindingEvidenceOpenFromSearch,
  parseFindingFullEvidenceTraceOpenFromSearch,
  parseFindingRelatedAuditOpenFromSearch,
  parseFindingTechnicalMetadataOpenFromSearch,
  parseFindingWorkWithOpenFromSearch,
  type FindingDetailInspectDisclosureUrlState,
} from "@/lib/findings/finding-detail-inspect-disclosure-url";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/findings/finding-policy-evidence-citations";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { FindingExplainabilityTracePanel } from "@/components/findings/FindingExplainabilityTracePanel";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

import { FindingInspectAuditSection } from "../FindingInspectAuditSection";
import { FindingInspectEvidenceSection } from "../FindingInspectEvidenceSection";
import { FindingInspectItsmWorkflowPanel } from "../FindingInspectItsmWorkflowPanel";

type FindingDetailInspectDisclosuresProps = {
  readonly runId: string;
  readonly findingIdRouteParam: string;
  readonly decodedFindingId: string;
  readonly inspectPayload: FindingInspectPayload;
  readonly transparencyTrail?: TransparencyTrail | null;
  readonly demoFillGaps: boolean;
  readonly evidenceBasisSummary: string;
  readonly validationRequirementText: string;
  readonly reviewPackageHref: string;
  readonly graphEvidenceHref: string | null;
  readonly linkedManifestHref: string | null;
  readonly citationModel: FindingPolicyEvidenceCitationModel | null;
};

function readInspectDisclosureState(searchParams: URLSearchParams): FindingDetailInspectDisclosureUrlState {
  return {
    evidenceOpen: parseFindingEvidenceOpenFromSearch(searchParams.get("findingEvidenceOpen")),
    auditOpen: parseFindingAuditOpenFromSearch(searchParams.get("findingAuditOpen")),
    relatedAuditOpen: parseFindingRelatedAuditOpenFromSearch(searchParams.get("findingRelatedAuditOpen")),
    technicalMetadataOpen: parseFindingTechnicalMetadataOpenFromSearch(searchParams.get("findingTechnicalMetadataOpen")),
    evidenceBasisOpen: parseFindingEvidenceBasisOpenFromSearch(searchParams.get("findingEvidenceBasisOpen")),
    fullEvidenceTraceOpen: parseFindingFullEvidenceTraceOpenFromSearch(searchParams.get("findingFullEvidenceTraceOpen")),
    workWithOpen: parseFindingWorkWithOpenFromSearch(searchParams.get("findingWorkWithOpen")),
  };
}

function readInspectDisclosureStateFromWindow(): FindingDetailInspectDisclosureUrlState {
  return readInspectDisclosureState(
    new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
  );
}

function readExportOpenFromWindow(): boolean {
  return parseFindingExportOpenFromSearch(
    new URLSearchParams(typeof window === "undefined" ? "" : window.location.search).get("findingExportOpen"),
  );
}

/** Buyer-polished finding detail progressive disclosures synced to URL params. */
export function FindingDetailInspectDisclosures(props: FindingDetailInspectDisclosuresProps): ReactElement {
  const {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    demoFillGaps,
    evidenceBasisSummary,
    validationRequirementText,
    reviewPackageHref,
    graphEvidenceHref,
    linkedManifestHref,
    citationModel,
  } = props;
  const pathname = usePathname() ?? "/";

  const [inspectState, setInspectState] = useState<FindingDetailInspectDisclosureUrlState>(() =>
    readInspectDisclosureStateFromWindow(),
  );
  const inspectStateRef = useRef(inspectState);
  inspectStateRef.current = inspectState;
  const [exportOpen, setExportOpenState] = useState(() => readExportOpenFromWindow());
  const exportOpenRef = useRef(exportOpen);
  exportOpenRef.current = exportOpen;

  const syncInspectPanelsToUrl = useCallback(
    (state: FindingDetailInspectDisclosureUrlState) => {
      commitHrefIfChanged(
        findingDetailInspectDisclosureHrefFromSearch(readWindowLocationSearch(), state, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const syncExportToUrl = useCallback(
    (open: boolean) => {
      const params = new URLSearchParams(readWindowLocationSearch());

      commitHrefIfChanged(
        findingDetailActionsDisclosureHrefFromSearch(
          readWindowLocationSearch(),
          {
            exportOpen: open,
            technicalIdsOpen: parseFindingTechnicalIdsOpenFromSearch(params.get("findingTechnicalIdsOpen")),
            technicalAuditOpen: parseFindingTechnicalAuditOpenFromSearch(params.get("findingTechnicalAuditOpen")),
          },
          pathname,
        ),
        { notify: false },
      );
    },
    [pathname],
  );

  const setInspectPanelOpen = useCallback(
    (key: keyof FindingDetailInspectDisclosureUrlState, value: SetStateAction<boolean>) => {
      setInspectState((current) => {
        const nextValue = typeof value === "function" ? value(current[key]) : value;

        if (current[key] === nextValue) {
          return current;
        }

        const nextState = { ...current, [key]: nextValue };
        inspectStateRef.current = nextState;
        syncInspectPanelsToUrl(nextState);

        return nextState;
      });
    },
    [syncInspectPanelsToUrl],
  );

  const setExportOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setExportOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (exportOpenRef.current === next) {
          return current;
        }

        exportOpenRef.current = next;
        syncExportToUrl(next);

        return next;
      });
    },
    [syncExportToUrl],
  );

  useEffect(() => {
    const syncFromUrl = (): void => {
      const nextInspect = readInspectDisclosureStateFromWindow();
      const inspectChanged = (Object.keys(nextInspect) as (keyof FindingDetailInspectDisclosureUrlState)[]).some(
        (key) => inspectStateRef.current[key] !== nextInspect[key],
      );

      if (inspectChanged) {
        inspectStateRef.current = nextInspect;
        setInspectState(nextInspect);
      }

      const nextExport = readExportOpenFromWindow();

      if (exportOpenRef.current !== nextExport) {
        exportOpenRef.current = nextExport;
        setExportOpenState(nextExport);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  return (
    <>
      <CollapsibleSection
        title="Evidence"
        open={inspectState.evidenceOpen}
        onToggle={(open) => setInspectPanelOpen("evidenceOpen", open)}
        sectionTestId="finding-evidence-collapsible"
        summaryLine={evidenceBasisSummary}
      >
        <FindingInspectEvidenceSection
          runId={runId}
          demoFillGaps={demoFillGaps}
          reviewContextHref={reviewPackageHref}
          reviewContextLabel="Open review summary"
          evidence={inspectPayload.evidence}
          citationModel={citationModel}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Audit"
        open={inspectState.auditOpen}
        onToggle={(open) => setInspectPanelOpen("auditOpen", open)}
        summaryLine={validationRequirementText}
      >
        <p className={cn("m-0 leading-relaxed text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {validationRequirementText}
        </p>
        <div className="mt-4">
          <FindingInspectAuditSection auditRowId={inspectPayload.auditRowId} demoFillGaps={demoFillGaps} />
        </div>
      </CollapsibleSection>

      <FindingExplainabilityTracePanel
        runId={runId}
        findingId={decodedFindingId}
        buyerPolishedShell
        defaultCollapsed
        graphEvidenceHref={graphEvidenceHref}
        linkedManifestHref={linkedManifestHref}
      />

      <CollapsibleSection
        title="Related audit record"
        open={inspectState.relatedAuditOpen}
        onToggle={(open) => setInspectPanelOpen("relatedAuditOpen", open)}
        summaryLine="Redacted LLM audit and feedback when generated for this finding."
      >
        <FindingExplainPanel
          runId={runId}
          findingId={findingIdRouteParam}
          confidenceLevel={inspectPayload.confidenceLevel ?? null}
          buyerPolishedShell
          graphEvidenceHref={graphEvidenceHref}
          linkedManifestHref={linkedManifestHref}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Technical metadata"
        open={inspectState.technicalMetadataOpen}
        onToggle={(open) => setInspectPanelOpen("technicalMetadataOpen", open)}
        summaryLine={evidenceBasisSummary}
      >
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
          {inspectPayload.decisionRuleId ? (
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Technical rule identifier</dt>
              <dd className="m-0 mt-1 flex flex-wrap items-center gap-2">
                <code
                  className={cn(
                    "max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                >
                  {inspectPayload.decisionRuleId}
                </code>
                <CopyIdButton value={inspectPayload.decisionRuleId} aria-label="Copy rule identifier" />
              </dd>
            </div>
          ) : null}
          {inspectPayload.manifestVersion ? (
            <div>
              <dt className={cn("text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Review record version</dt>
              <dd className={cn("m-0 mt-1 font-mono", OPERATOR_TYPOGRAPHY.micro)}>{inspectPayload.manifestVersion}</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-4">
          <CollapsibleSection
            title="Evidence basis"
            open={inspectState.evidenceBasisOpen}
            onToggle={(open) => setInspectPanelOpen("evidenceBasisOpen", open)}
            summaryLine={evidenceBasisSummary}
          >
            <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{evidenceBasisSummary}</p>
          </CollapsibleSection>
        </div>
        <div className="mt-4">
          <CollapsibleSection
            title="Full evidence trace"
            open={inspectState.fullEvidenceTraceOpen}
            onToggle={(open) => setInspectPanelOpen("fullEvidenceTraceOpen", open)}
          >
            <FindingProvenancePanel runId={runId} findingId={decodedFindingId} />
          </CollapsibleSection>
        </div>
      </CollapsibleSection>

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
          transparencyTrail={props.transparencyTrail ?? null}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Work with this finding"
        open={inspectState.workWithOpen}
        onToggle={(open) => setInspectPanelOpen("workWithOpen", open)}
        summaryLine="Ask, ITSM workflow, and feedback"
      >
        <div className="space-y-4">
          <FindingAskInlinePanel
            findingId={decodedFindingId}
            runId={runId}
            semanticSupportBand={findingSemanticSupportBandFromTypedPayload(
              inspectPayload.typedPayload !== null && typeof inspectPayload.typedPayload === "object"
                ? (inspectPayload.typedPayload as Record<string, unknown>)
                : null,
              inspectPayload.typedPayload !== null
              && typeof inspectPayload.typedPayload === "object"
              && ((inspectPayload.typedPayload as Record<string, unknown>).classification === "DecisionGradeFinding"
                || (inspectPayload.typedPayload as Record<string, unknown>).classification === "ChecklistCoverage")
                ? ((inspectPayload.typedPayload as Record<string, unknown>).classification as
                    "DecisionGradeFinding" | "ChecklistCoverage")
                : null,
            )}
          />
          <FindingInspectItsmWorkflowPanel findingId={decodedFindingId} />
          {isOperatorExperienceFullShellEnv() ? (
            <ProductLearningFeedbackControls
              runId={runId}
              manifestVersion={inspectPayload.manifestVersion}
              subjectType="Finding"
              artifactHint={`finding:${decodedFindingId}`}
              patternKey={inspectPayload.decisionRuleId ? `finding-rule:${inspectPayload.decisionRuleId}` : "finding"}
              detail={{
                findingId: decodedFindingId,
                decisionRuleId: inspectPayload.decisionRuleId,
              }}
              title="Was this finding useful?"
            />
          ) : null}
        </div>
      </CollapsibleSection>
    </>
  );
}
