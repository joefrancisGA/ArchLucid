"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { PolicyPackComplianceRuleKeyDiffView } from "@/components/policy/PolicyPackComplianceRuleKeyDiffView";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { usePolicyPackVersionsQuery } from "@/hooks/use-policy-pack-versions-query";
import { simulatePolicyPackAgainstRun } from "@/lib/api/policy-governance-api";
import { toApiLoadFailure, uiFailureFromMessage, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { policyPackSimulateBlockedReason } from "@/lib/policy/policy-pack-simulate-blocked-reason";
import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";
import { DESIGN_TOKENS, OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import type { components } from "@/lib/openapi-schemas";
import {
  buildAfterAssignmentComplianceRuleKeys,
  buildPolicyImpactPreviewSimulateRequest,
  extractComplianceRuleKeys,
  parsePolicyPackContentDocument,
  resolveInitialPackComparisonIds,
  resolveLatestPublishedVersion,
  resolvePolicyPackDisplayName,
  summarizePolicyImpactGateResult,
  type PolicyImpactPreviewGateSummary,
} from "@/lib/policy/policy-pack-impact-preview";
import type { PolicyPack, PolicyPackContentDocument, PolicyPackVersion } from "@/types/policy-packs";

export type PolicyPackImpactPreviewPanelProps = {
  readonly effectiveContent: PolicyPackContentDocument | null;
  readonly selectedPackId: string;
  readonly packVersions: readonly PolicyPackVersion[];
  readonly packs: readonly PolicyPack[];
  readonly scopedReviewId?: string;
  readonly onPickReview?: (reviewId: string) => void;
};

function gateStatusTag(summary: PolicyImpactPreviewGateSummary): React.JSX.Element {
  if (summary.blocked) {
    return <StatusTag kind="blocked" label="Would block commit" />;
  }

  if (summary.warnOnly) {
    return <StatusTag kind="needs-attention" label="Would warn only" />;
  }

  return <StatusTag kind="ready" label="Would allow commit" />;
}

function packComparisonGateLabel(packLabel: string): string {
  return `${packLabel} (block on Critical)`;
}

/**
 * Prominent policy impact preview — rule-key diff plus pre-commit simulate for the same committed review.
 */
export function PolicyPackImpactPreviewPanel(props: PolicyPackImpactPreviewPanelProps): React.JSX.Element {
  const scopedReviewId = (props.scopedReviewId ?? "").trim();
  const scopedReviewFilterActive = scopedReviewId.length > 0;
  const requiresReviewPick = props.onPickReview !== undefined;
  const previewClearScopeHref = buildPolicyPacksHrefWithReviewId("");
  const initialPackComparison = useMemo(
    () => resolveInitialPackComparisonIds(props.packs, props.selectedPackId),
    [props.packs, props.selectedPackId],
  );
  const [packAId, setPackAId] = useState(initialPackComparison.packAId);
  const [packBId, setPackBId] = useState(initialPackComparison.packBId);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [baselineResult, setBaselineResult] = useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(
    null,
  );
  const [stricterResult, setStricterResult] = useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(
    null,
  );
  const [packAResult, setPackAResult] = useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(
    null,
  );
  const [packBResult, setPackBResult] = useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(
    null,
  );

  const packAVersionsQuery = usePolicyPackVersionsQuery(packAId);
  const packBVersionsQuery = usePolicyPackVersionsQuery(packBId);

  useEffect(() => {
    setPackAId(initialPackComparison.packAId);
    setPackBId(initialPackComparison.packBId);
  }, [initialPackComparison.packAId, initialPackComparison.packBId]);

  const beforeKeys = useMemo(
    () =>
      (props.effectiveContent?.complianceRuleKeys ?? [])
        .filter((key) => (key ?? "").trim().length > 0)
        .map((key) => key.trim()),
    [props.effectiveContent?.complianceRuleKeys],
  );

  const latestPublishedVersion = useMemo(
    () => resolveLatestPublishedVersion(props.packVersions),
    [props.packVersions],
  );

  const proposedContent = useMemo(
    () => parsePolicyPackContentDocument(latestPublishedVersion?.contentJson),
    [latestPublishedVersion?.contentJson],
  );

  const afterKeys = useMemo(
    () => buildAfterAssignmentComplianceRuleKeys(props.effectiveContent, proposedContent),
    [props.effectiveContent, proposedContent],
  );

  const packALatestVersion = useMemo(
    () => resolveLatestPublishedVersion(packAVersionsQuery.data ?? []),
    [packAVersionsQuery.data],
  );
  const packBLatestVersion = useMemo(
    () => resolveLatestPublishedVersion(packBVersionsQuery.data ?? []),
    [packBVersionsQuery.data],
  );
  const packAContent = useMemo(
    () => parsePolicyPackContentDocument(packALatestVersion?.contentJson),
    [packALatestVersion?.contentJson],
  );
  const packBContent = useMemo(
    () => parsePolicyPackContentDocument(packBLatestVersion?.contentJson),
    [packBLatestVersion?.contentJson],
  );
  const packAKeys = useMemo(() => extractComplianceRuleKeys(packAContent), [packAContent]);
  const packBKeys = useMemo(() => extractComplianceRuleKeys(packBContent), [packBContent]);
  const packALabel = resolvePolicyPackDisplayName(props.packs, packAId);
  const packBLabel = resolvePolicyPackDisplayName(props.packs, packBId);
  const packComparisonReady =
    packAId.trim().length > 0 &&
    packBId.trim().length > 0 &&
    packAId.trim() !== packBId.trim() &&
    packALatestVersion !== null &&
    packBLatestVersion !== null;

  const baselineSummary = baselineResult !== null ? summarizePolicyImpactGateResult("allow", baselineResult) : null;
  const stricterSummary =
    stricterResult !== null ? summarizePolicyImpactGateResult("block-critical", stricterResult) : null;
  const packASummary =
    packAResult !== null
      ? {
          ...summarizePolicyImpactGateResult("block-critical", packAResult),
          label: packComparisonGateLabel("Pack A"),
        }
      : null;
  const packBSummary =
    packBResult !== null
      ? {
          ...summarizePolicyImpactGateResult("block-critical", packBResult),
          label: packComparisonGateLabel("Pack B"),
        }
      : null;

  const onRunPreview = useCallback(async () => {
    if (scopedReviewId.length === 0) {
      setFailure(uiFailureFromMessage("Pick a finalized review to preview policy impact."));
      setBaselineResult(null);
      setStricterResult(null);
      setPackAResult(null);
      setPackBResult(null);

      return;
    }

    setBusy(true);
    setFailure(null);
    setBaselineResult(null);
    setStricterResult(null);
    setPackAResult(null);
    setPackBResult(null);

    try {
      const proposedPolicyPackId = props.selectedPackId.trim();
      const baselineRequest = buildPolicyImpactPreviewSimulateRequest(scopedReviewId, "allow", {
        proposedContent,
        proposedPolicyPackId,
      });
      const stricterRequest = buildPolicyImpactPreviewSimulateRequest(scopedReviewId, "block-critical", {
        proposedContent,
        proposedPolicyPackId,
      });

      const simulateTasks: Array<Promise<components["schemas"]["PolicyPackGovernanceDryRunResult"]>> = [
        simulatePolicyPackAgainstRun(baselineRequest),
        simulatePolicyPackAgainstRun(stricterRequest),
      ];

      if (packComparisonReady) {
        simulateTasks.push(
          simulatePolicyPackAgainstRun(
            buildPolicyImpactPreviewSimulateRequest(scopedReviewId, "block-critical", {
              proposedContent: packAContent,
              proposedPolicyPackId: packAId,
            }),
          ),
          simulatePolicyPackAgainstRun(
            buildPolicyImpactPreviewSimulateRequest(scopedReviewId, "block-critical", {
              proposedContent: packBContent,
              proposedPolicyPackId: packBId,
            }),
          ),
        );
      }

      const results = await Promise.all(simulateTasks);

      setBaselineResult(results[0] ?? null);
      setStricterResult(results[1] ?? null);

      if (packComparisonReady) {
        setPackAResult(results[2] ?? null);
        setPackBResult(results[3] ?? null);
      }
    } catch (error: unknown) {
      const loadFailure = toApiLoadFailure(error);
      setFailure(
        policyPackSimulateBlockedReason(loadFailure) !== null
          ? { ...loadFailure, message: policyPackSimulateBlockedReason(loadFailure) ?? loadFailure.message }
          : loadFailure,
      );
    } finally {
      setBusy(false);
    }
  }, [
    packAContent,
    packAId,
    packBContent,
    packBId,
    packComparisonReady,
    proposedContent,
    props.selectedPackId,
    scopedReviewId,
  ]);

  useEffect(() => {
    if (!scopedReviewFilterActive) {
      setBaselineResult(null);
      setStricterResult(null);
      setPackAResult(null);
      setPackBResult(null);
    }
  }, [scopedReviewFilterActive]);

  return (
    <section
      className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      aria-labelledby="policy-pack-impact-preview-heading"
      data-testid="policy-pack-impact-preview"
    >
      <div className="space-y-1">
        <h2
          id="policy-pack-impact-preview-heading"
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
        >
          Policy impact preview
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}>
          Same finalized review, different enforcement posture — preview compliance rule key changes and whether the
          approval check before finalize would allow or block finalize. Read-only; nothing is persisted.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-2">
          {!scopedReviewFilterActive && requiresReviewPick ? (
            <>
              <Label htmlFor="policy-impact-preview-run-picker">Finalized review</Label>
              <div className="min-w-[16rem] max-w-xl">
                <AskRunIdPicker
                  value=""
                  onChange={(value) => {
                    if (value.trim().length > 0) {
                      props.onPickReview?.(value.trim());
                    }
                  }}
                  selectedThreadId=""
                  committedOnly
                  preferAutoPick={false}
                  autoSelectSyntheticSample={false}
                  label="Architecture package"
                  fieldId="policy-impact-preview-run-picker"
                  hideFieldHelper
                />
              </div>
            </>
          ) : scopedReviewFilterActive ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="policy-impact-preview-run-scope-banner">
              {"Previewing policy impact for review "}
              <span className="font-mono text-al-text-primary">{scopedReviewId}</span>
              {" · "}
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={previewClearScopeHref}>
                Clear review scope
              </Link>
              {" · "}
              <Link
                className={OPERATOR_BODY_INLINE_LINK_CLASS}
                href={`/architecture/reviews/${encodeURIComponent(scopedReviewId)}`}
              >
                Open review
              </Link>
            </p>
          ) : (
            <>
              <Label htmlFor="policy-impact-preview-run-picker">Finalized review</Label>
              <div className="min-w-[16rem] max-w-xl">
                <AskRunIdPicker
                  value={scopedReviewId}
                  onChange={() => undefined}
                  selectedThreadId=""
                  committedOnly
                  preferAutoPick={false}
                  autoSelectSyntheticSample={false}
                  label="architecture package"
                  fieldId="policy-impact-preview-run-picker"
                  hideFieldHelper
                />
              </div>
            </>
          )}
          {props.selectedPackId.trim().length > 0 && latestPublishedVersion !== null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              After snapshot includes keys from selected pack{" "}
              <code className={OPERATOR_TYPOGRAPHY.badge}>{latestPublishedVersion.version}</code>.
            </p>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Select a pack with a published version to preview assignment key deltas; approval-check simulation still runs against
              current effective merge.
            </p>
          )}
        </div>
        <Button
          type="button"
          onClick={() => void onRunPreview()}
          disabled={busy || (requiresReviewPick && !scopedReviewFilterActive)}
          data-testid="policy-impact-preview-run"
        >
          {busy ? "Running preview…" : "Run policy impact preview"}
        </Button>
      </div>

      <div
        className="mt-4 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50"
        data-testid="policy-impact-preview-pack-comparison"
      >
        <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Same-evidence pack comparison
        </p>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Pick two published packs to compare gate outcomes and compliance rule keys on the same finalized review.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Pack A
            <select
              value={packAId}
              onChange={(event) => {
                setPackAId(event.target.value);
                setPackAResult(null);
                setPackBResult(null);
              }}
              className="mt-1 block min-w-[220px] rounded-md border border-neutral-300 bg-white p-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="policy-impact-preview-pack-a"
            >
              <option value="">—</option>
              {props.packs.map((pack) => (
                <option key={`pack-a-${pack.policyPackId}`} value={pack.policyPackId}>
                  {pack.name.trim().length > 0 ? pack.name : pack.policyPackId}
                </option>
              ))}
            </select>
          </label>
          <label className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Pack B
            <select
              value={packBId}
              onChange={(event) => {
                setPackBId(event.target.value);
                setPackAResult(null);
                setPackBResult(null);
              }}
              className="mt-1 block min-w-[220px] rounded-md border border-neutral-300 bg-white p-2 text-al-text-primary dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="policy-impact-preview-pack-b"
            >
              <option value="">—</option>
              {props.packs.map((pack) => (
                <option key={`pack-b-${pack.policyPackId}`} value={pack.policyPackId}>
                  {pack.name.trim().length > 0 ? pack.name : pack.policyPackId}
                </option>
              ))}
            </select>
          </label>
        </div>
        {!packComparisonReady ? (
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            Choose two different packs with published versions to include pack-to-pack comparison in the preview run.
          </p>
        ) : (
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            Comparing {packALabel} vs {packBLabel} under block-on-Critical enforcement.
          </p>
        )}
      </div>

      {failure !== null ? (
        <div className="mt-4" role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <PolicyPackComplianceRuleKeyDiffView beforeKeys={beforeKeys} afterKeys={afterKeys} />

        {baselineSummary !== null && stricterSummary !== null ? (
          <div
            className="grid gap-3 md:grid-cols-2"
            data-testid="policy-impact-preview-gate-delta"
            aria-label="Approval check simulation delta"
          >
            <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
              <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {baselineSummary.label}
              </p>
              <div className="mt-2">{gateStatusTag(baselineSummary)}</div>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Failed checks: {baselineSummary.failedCheckCount}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
              <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                {stricterSummary.label}
              </p>
              <div className="mt-2">{gateStatusTag(stricterSummary)}</div>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Failed checks: {stricterSummary.failedCheckCount}
              </p>
            </div>
          </div>
        ) : null}

        {baselineSummary !== null &&
        stricterSummary !== null &&
        baselineSummary.blocked !== stricterSummary.blocked ? (
          <p
            className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
            data-testid="policy-impact-preview-gate-changed"
          >
            Approval check outcome changes for this review under stricter enforcement — this is the policy-pack moat moment for
            demos.
          </p>
        ) : null}

        {packASummary !== null && packBSummary !== null ? (
          <>
            <PolicyPackComplianceRuleKeyDiffView
              beforeKeys={packAKeys}
              afterKeys={packBKeys}
              beforeLabel={`Pack A — ${packALabel}`}
              afterLabel={`Pack B — ${packBLabel}`}
            />
            <div
              className="grid gap-3 md:grid-cols-2"
              data-testid="policy-impact-preview-pack-gate-delta"
              aria-label="Pack comparison gate delta"
            >
              <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
                <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {packASummary.label}
                </p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{packALabel}</p>
                <div className="mt-2">{gateStatusTag(packASummary)}</div>
                <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Failed checks: {packASummary.failedCheckCount}
                </p>
              </div>
              <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950/50">
                <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  {packBSummary.label}
                </p>
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{packBLabel}</p>
                <div className="mt-2">{gateStatusTag(packBSummary)}</div>
                <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Failed checks: {packBSummary.failedCheckCount}
                </p>
              </div>
            </div>
            {packASummary.blocked !== packBSummary.blocked ? (
              <p
                className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
                data-testid="policy-impact-preview-pack-gate-changed"
              >
                Gate outcome differs between {packALabel} and {packBLabel} on the same review evidence.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <p className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Full scripted walkthrough:{" "}
        <Link href={POLICY_PACK_DELTA_DEMO_HELP_PATH} className={OPERATOR_LINK.inline}>
          Policy-pack delta demo
        </Link>
        .
      </p>
    </section>
  );
}
