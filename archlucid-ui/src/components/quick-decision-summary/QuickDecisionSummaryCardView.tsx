import type { ReactElement } from "react";

import { FindingsItsmExportToolbar } from "@/components/findings/FindingsItsmExportToolbar";
import { ReviewDetailPolicyPackFindingsBreakdown } from "@/components/findings/ReviewDetailPolicyPackFindingsBreakdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { QuickDecisionSummaryEmptyState } from "./QuickDecisionSummaryEmptyState";
import { QuickDecisionSummaryFindingRow } from "./QuickDecisionSummaryFindingRow";
import type { QuickDecisionSummaryDerivedData, QuickDecisionSummaryInteractionState, QuickDecisionSummaryProps } from "./types";

type QuickDecisionSummaryCardViewProps = {
  readonly props: QuickDecisionSummaryProps;
  readonly derived: QuickDecisionSummaryDerivedData;
  readonly interaction: QuickDecisionSummaryInteractionState;
};

export function QuickDecisionSummaryCardView({
  props,
  derived,
  interaction,
}: QuickDecisionSummaryCardViewProps): ReactElement {
  return (
    <Card
      data-testid="quick-decision-summary"
      className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>
              {derived.buyerPolishedShell ? "Decision summary" : "Quick decision summary"}
            </CardTitle>
            {derived.hasSourceFindings ? (
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Export CSV or JSON above, or use <strong>Copy for Jira</strong> on each finding for one-click ticket
                paste.
                {derived.provenanceAggregateLine !== null ? (
                  <span className="mt-1 block" data-testid="finding-provenance-aggregate">
                    {derived.provenanceAggregateLine}
                  </span>
                ) : null}
                {derived.hiddenLowConfidenceHint !== null ? (
                  <span className="mt-1 block" data-testid="quick-decision-low-confidence-hidden-hint">
                    {derived.hiddenLowConfidenceHint}.
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
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
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-700 focus:ring-neutral-400"
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
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-700 focus:ring-neutral-400"
                  checked={interaction.showMuted}
                  onChange={(event) => {
                    interaction.setShowMuted(event.target.checked);
                  }}
                />
                Show muted findings
              </label>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3 pt-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {derived.hasSourceFindings ? (
          <FindingsItsmExportToolbar runId={props.runId} findings={props.findings} />
        ) : null}
        {derived.hasSourceFindings && derived.policyPackSummary.length > 0 ? (
          <ReviewDetailPolicyPackFindingsBreakdown
            groups={derived.policyPackSummary}
            manifestRuleSetId={props.manifestRuleSetId}
            mappedFindingCount={derived.policyPackImpact.mappedFindingCount}
            unmappedFindingCount={derived.policyPackImpact.unmappedFindingCount}
          />
        ) : null}
        {props.usingExplanationFallback === true ? (
          <p
            className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
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
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className={cn("m-0 mb-2", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                Policy violations
              </h3>
              {derived.policyViolations.length === 0 ? (
                <p className="m-0 text-neutral-600 dark:text-neutral-400">
                  No policy-blocking findings on this review. Baseline guidance may still appear under advisory
                  notes.
                </p>
              ) : (
                <div className="space-y-4" data-testid="quick-decision-policy-violations">
                  {derived.topGroups.map((group) => (
                    <div key={group.groupKey}>
                      <h4
                        className={cn(
                          "m-0 mb-2 font-semibold text-neutral-700 dark:text-neutral-300",
                          OPERATOR_TYPOGRAPHY.helper,
                        )}
                      >
                        {group.packDisplayName}
                        <span className="ml-1 font-normal text-neutral-500 dark:text-neutral-400">
                          ({group.findingCount})
                        </span>
                      </h4>
                      <ol className="m-0 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                        {group.findings.slice(0, 3).map((finding) => (
                          <QuickDecisionSummaryFindingRow
                            key={finding.findingId}
                            props={props}
                            finding={finding}
                            showTierBadge={false}
                            canMutate={interaction.canMutate}
                            askFindingId={interaction.askFindingId}
                            onToggleAskPanel={interaction.toggleAskPanel}
                            onViewReasoning={interaction.openReasoningDialog}
                            onMute={interaction.openMuteDialog}
                          />
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {derived.advisoryNotes.length > 0 ? (
              <div
                className="rounded-md border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
                data-testid="quick-decision-advisory-notes"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                      Advisory notes
                    </h3>
                    <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      Opt-in baseline guidance from enabled policy packs. These do not block commit.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      interaction.setShowAdvisory(!interaction.showAdvisory);
                    }}
                    aria-expanded={interaction.showAdvisory}
                  >
                    {interaction.showAdvisory
                      ? "Hide advisory notes"
                      : `Show ${derived.advisoryNotes.length} advisory note${derived.advisoryNotes.length === 1 ? "" : "s"}`}
                  </Button>
                </div>
                {interaction.showAdvisory ? (
                  <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                    {derived.advisoryNotes.map((finding) => (
                      <QuickDecisionSummaryFindingRow
                        key={finding.findingId}
                        props={props}
                        finding={finding}
                        showTierBadge
                        canMutate={interaction.canMutate}
                        askFindingId={interaction.askFindingId}
                        onToggleAskPanel={interaction.toggleAskPanel}
                        onViewReasoning={interaction.openReasoningDialog}
                        onMute={interaction.openMuteDialog}
                      />
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}

            {interaction.showLowConfidence && derived.lowConfidenceFindings.length > 0 ? (
              <div
                className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/50 p-3 dark:border-neutral-600 dark:bg-neutral-900/20"
                data-testid="quick-decision-low-confidence-section"
              >
                <h3 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                  Unverified / low confidence
                </h3>
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  These findings had low evaluation confidence or ambiguous evidence. Verify before acting.
                </p>
                {derived.lowConfidencePolicyViolations.length > 0 ? (
                  <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                    {derived.lowConfidencePolicyViolations.map((finding) => (
                      <QuickDecisionSummaryFindingRow
                        key={finding.findingId}
                        props={props}
                        finding={finding}
                        showTierBadge={false}
                        subdued
                        canMutate={interaction.canMutate}
                        askFindingId={interaction.askFindingId}
                        onToggleAskPanel={interaction.toggleAskPanel}
                        onViewReasoning={interaction.openReasoningDialog}
                        onMute={interaction.openMuteDialog}
                      />
                    ))}
                  </ol>
                ) : null}
                {derived.lowConfidenceAdvisoryNotes.length > 0 ? (
                  <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                    {derived.lowConfidenceAdvisoryNotes.map((finding) => (
                      <QuickDecisionSummaryFindingRow
                        key={finding.findingId}
                        props={props}
                        finding={finding}
                        showTierBadge
                        subdued
                        canMutate={interaction.canMutate}
                        askFindingId={interaction.askFindingId}
                        onToggleAskPanel={interaction.toggleAskPanel}
                        onViewReasoning={interaction.openReasoningDialog}
                        onMute={interaction.openMuteDialog}
                      />
                    ))}
                  </ol>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
