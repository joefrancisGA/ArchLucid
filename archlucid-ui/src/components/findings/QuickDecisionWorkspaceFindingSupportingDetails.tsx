"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { ItsmOutboundQuickActions } from "@/components/itsm/ItsmOutboundQuickActions";
import { FindingPolicyCitationProminentStrip } from "@/components/findings/FindingPolicyCitationProminentStrip";
import { FindingPolicyEvidenceCitationLinks } from "@/components/findings/FindingPolicyEvidenceCitationLinks";
import { FindingEvidenceRefSnippets } from "@/components/usability/FindingEvidenceRefSnippets";
import { FindingInsightDensityDisclosure } from "@/components/usability/FindingInsightDensityDisclosure";
import { FindingCreateWorkItemActions } from "@/components/work-items/FindingCreateWorkItemActions";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildFindingPolicyEvidenceCitationsFromQuickDecision } from "@/lib/findings/finding-policy-evidence-citations";
import { quickDecisionWorkItemSeverityLabel } from "@/lib/quick-decision-finding-links";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

/** Architecture-creation context needed by the provider-neutral work-item affordance. */
export type QuickDecisionWorkItemContext = {
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly ownerLabel: string | null;
};

/** Review-wide context every workspace finding card needs, independent of the finding being rendered. */
export type QuickDecisionWorkspaceCardContext = {
  readonly runId: string;
  /** Sibling findings passed through to the work-item affordance for batch actions. */
  readonly allFindings: readonly QuickDecisionFinding[];
  /** When false, work-item / ITSM chrome stays hidden until a committed manifest exists (TB-1854). */
  readonly packageCommitted?: boolean;
  readonly providerNeutralWorkItems?: boolean;
  readonly architectureWorkItemContext?: QuickDecisionWorkItemContext | null;
};

export type QuickDecisionWorkspaceFindingSupportingDetailsProps = {
  readonly context: QuickDecisionWorkspaceCardContext;
  readonly finding: QuickDecisionFinding;
};

/** Collapsed evidence, citation, and work-item detail behind the workspace card's "Supporting detail" disclosure. */
export function QuickDecisionWorkspaceFindingSupportingDetails(
  props: QuickDecisionWorkspaceFindingSupportingDetailsProps,
): ReactElement {
  // ITSM correlations are only fetched once the operator opens the disclosure.
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const context = props.context;
  const finding = props.finding;
  const citationModel = buildFindingPolicyEvidenceCitationsFromQuickDecision(context.runId, finding);

  function renderIntegrations(): ReactElement | null {
    if (context.packageCommitted === false) {
      return null;
    }

    return (
      <details
        className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
        data-workspace-disclosure
        onToggle={(event) => {
          setIntegrationsOpen(event.currentTarget.open);
        }}
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          Create work item / Integrations
        </summary>
        <div className="mt-2" data-testid={`finding-itsm-sync-${finding.findingId}`}>
          {context.providerNeutralWorkItems === true && context.architectureWorkItemContext ? (
            <FindingCreateWorkItemActions
              runId={context.runId}
              finding={finding}
              architectureName={context.architectureWorkItemContext.architectureName}
              architectureOverview={context.architectureWorkItemContext.architectureOverview}
              ownerLabel={context.architectureWorkItemContext.ownerLabel}
              allFindings={context.allFindings}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <CopyGovernanceQueueWorkItemButton
                runId={context.runId}
                findingId={finding.findingId}
                findingTitle={finding.title}
                severityLabel={quickDecisionWorkItemSeverityLabel(finding.severityValue)}
                recommendedAction={finding.recommendation}
                statusLabel="Open"
                compact
              />
              <ItsmOutboundQuickActions
                findingId={finding.findingId}
                compact
                loadWhen={integrationsOpen}
              />
            </div>
          )}
        </div>
      </details>
    );
  }

  return (
    <details
      className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
      data-workspace-disclosure
      data-testid={`finding-workspace-supporting-${finding.findingId}`}
    >
      <summary className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        Supporting detail
      </summary>
      <div className="mt-3 space-y-3">
        {citationModel.pack !== null || citationModel.policy !== null ? (
          <FindingPolicyCitationProminentStrip
            pack={citationModel.pack}
            policy={citationModel.policy}
            compact
          />
        ) : null}
        <FindingPolicyEvidenceCitationLinks model={citationModel} />
        {finding.evidenceRefSnippets !== undefined && finding.evidenceRefSnippets.length > 0 ? (
          <FindingEvidenceRefSnippets snippets={finding.evidenceRefSnippets} />
        ) : null}
        {(finding.insightDensityScore !== null && finding.insightDensityScore !== undefined) ||
        (finding.whyThisIsNotGeneric !== null &&
          finding.whyThisIsNotGeneric !== undefined &&
          finding.whyThisIsNotGeneric.length > 0) ? (
          <FindingInsightDensityDisclosure
            insightDensityScore={finding.insightDensityScore ?? null}
            whyThisIsNotGeneric={finding.whyThisIsNotGeneric ?? null}
          />
        ) : null}
        {renderIntegrations()}
        {finding.traceConfidenceLabel !== null &&
        finding.traceConfidenceLabel !== undefined &&
        finding.traceConfidenceLabel.trim().length > 0 ? (
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Evaluation trace: {finding.traceConfidenceLabel}
          </p>
        ) : null}
      </div>
    </details>
  );
}
