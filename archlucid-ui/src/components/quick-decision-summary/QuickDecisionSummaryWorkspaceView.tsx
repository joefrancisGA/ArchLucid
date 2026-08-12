import type { ReactElement } from "react";

import { QuickDecisionAdditionalFindingsList } from "@/components/QuickDecisionAdditionalFindingsList";
import { ReviewDetailPolicyPackFindingsBreakdown } from "@/components/findings/ReviewDetailPolicyPackFindingsBreakdown";
import { QuickDecisionWorkspacePrimaryFindingCard } from "@/components/findings/QuickDecisionWorkspacePrimaryFindingCard";
import { QuickDecisionWorkspaceSecondaryFindingCard } from "@/components/findings/QuickDecisionWorkspaceSecondaryFindingCard";
import type { QuickDecisionWorkspaceCardContext } from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import { Button } from "@/components/ui/button";
import {
  buildWorkspaceCardRenderedFindings,
  sortQuickDecisionFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { QuickDecisionSummaryEmptyState } from "./QuickDecisionSummaryEmptyState";
import type { QuickDecisionSummaryDerivedData, QuickDecisionSummaryInteractionState, QuickDecisionSummaryProps } from "./types";

type QuickDecisionSummaryWorkspaceViewProps = {
  readonly props: QuickDecisionSummaryProps;
  readonly derived: QuickDecisionSummaryDerivedData;
  readonly interaction: QuickDecisionSummaryInteractionState;
  readonly workspaceCardContext: QuickDecisionWorkspaceCardContext;
};

function buildWorkspaceVisibleFindings(
  props: QuickDecisionSummaryProps,
  derived: QuickDecisionSummaryDerivedData,
  interaction: QuickDecisionSummaryInteractionState,
): QuickDecisionFinding[] {
  const sourceFindings = derived.confidenceManagedExternally
    ? derived.afterMuteFilter
    : derived.trustedFindings;
  const rendered = buildWorkspaceCardRenderedFindings(sourceFindings, {
    showAdvisory: interaction.showAdvisory,
    showMuted: false,
  });

  if (!derived.confidenceManagedExternally && interaction.showLowConfidence) {
    return sortQuickDecisionFindings([...rendered, ...derived.lowConfidenceFindings]);
  }

  return rendered;
}

export function QuickDecisionSummaryWorkspaceView({
  props,
  derived,
  interaction,
  workspaceCardContext,
}: QuickDecisionSummaryWorkspaceViewProps): ReactElement {
  const visibleFindings = buildWorkspaceVisibleFindings(props, derived, interaction);
  const primaryFinding = visibleFindings[0] ?? null;
  const additionalFindings = visibleFindings.slice(1);

  return (
    <div
      data-testid="quick-decision-summary"
      className={cn("space-y-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
    >
      {derived.hasSourceFindings ? (
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-neutral-400",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
              checked={interaction.showLowConfidence}
              onChange={(event) => {
                interaction.setShowLowConfidence(event.target.checked);
              }}
              data-testid="quick-decision-show-low-confidence"
            />
            Show low-confidence findings
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-neutral-400",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
              checked={interaction.showMuted}
              onChange={(event) => {
                interaction.setShowMuted(event.target.checked);
              }}
            />
            Show muted findings
          </label>
          {derived.hiddenLowConfidenceHint !== null ? (
            <span className={OPERATOR_TYPOGRAPHY.helper} data-testid="quick-decision-low-confidence-hidden-hint">
              {derived.hiddenLowConfidenceHint}.
            </span>
          ) : null}
        </div>
      ) : null}
      {props.usingExplanationFallback === true ? (
        <p
          className={cn(
            "m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid="quick-decision-explanation-fallback-notice"
          role="status"
        >
          Confidence rows are derived from the aggregate explanation trace because per-finding agent results were not on
          this review payload. Re-run execute or refresh after commit if you need agent-result grounding.
        </p>
      ) : null}
      {!derived.hasSourceFindings ? (
        <QuickDecisionSummaryEmptyState
          props={props}
          buyerPolishedShell={derived.buyerPolishedShell}
          headlineFindingCount={derived.headlineFindingCount}
          headlineWarningCount={derived.headlineWarningCount}
        />
      ) : props.findings.length === 0 && derived.confidenceManagedExternally ? (
        <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings match the current filters.</p>
      ) : derived.afterMuteFilter.length === 0 ? (
        <p className="m-0 text-neutral-600 dark:text-neutral-400">
          All findings are currently muted. Enable <strong>Show muted findings</strong> to review them.
        </p>
      ) : derived.trustedFindings.length === 0 &&
        derived.lowConfidenceFindings.length > 0 &&
        !interaction.showLowConfidence &&
        !derived.confidenceManagedExternally ? (
        <p className="m-0 text-neutral-600 dark:text-neutral-400" data-testid="quick-decision-low-confidence-only">
          Low-confidence findings are hidden to reduce noise. Enable <strong>Show low-confidence findings</strong> to
          review unverified items.
        </p>
      ) : primaryFinding === null ? (
        <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings match the current filters.</p>
      ) : (
        <div className="space-y-4">
          <QuickDecisionWorkspacePrimaryFindingCard
            key={primaryFinding.findingId}
            context={workspaceCardContext}
            finding={primaryFinding}
            canMutate={interaction.canMutate}
            askPanelOpen={interaction.askFindingId === primaryFinding.findingId}
            onToggleAskPanel={interaction.toggleAskPanel}
            onViewReasoning={interaction.openReasoningDialog}
            onMute={interaction.openMuteDialog}
          />
          {derived.advisoryNotes.length > 0 && !interaction.showAdvisory ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {derived.advisoryNotes.length} advisory note{derived.advisoryNotes.length === 1 ? "" : "s"} hidden by
                default.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  interaction.setShowAdvisory(true);
                }}
              >
                Show advisory notes
              </Button>
            </div>
          ) : null}
          {additionalFindings.length > 0 ? (
            <section aria-labelledby="additional-findings-heading">
              <h3
                id="additional-findings-heading"
                className={cn("m-0 mb-2 font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
              >
                Additional findings ({additionalFindings.length})
              </h3>
              <QuickDecisionAdditionalFindingsList
                findings={additionalFindings}
                renderFinding={(finding) => (
                  <QuickDecisionWorkspaceSecondaryFindingCard
                    key={finding.findingId}
                    context={workspaceCardContext}
                    finding={finding}
                  />
                )}
              />
            </section>
          ) : null}
        </div>
      )}
      {derived.hasSourceFindings && derived.policyPackSummary.length > 0 ? (
        <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" data-workspace-disclosure>
          <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.body)}>Policy pack impact</summary>
          <div className="mt-3">
            <ReviewDetailPolicyPackFindingsBreakdown
              groups={derived.policyPackSummary}
              manifestRuleSetId={props.manifestRuleSetId}
              mappedFindingCount={derived.policyPackImpact.mappedFindingCount}
              unmappedFindingCount={derived.policyPackImpact.unmappedFindingCount}
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
