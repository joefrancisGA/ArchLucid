"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { PolicyPackComplianceRuleKeyDiffView } from "@/components/policy/PolicyPackComplianceRuleKeyDiffView";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { simulatePolicyPackAgainstRun } from "@/lib/api/policy-governance-api";
import { toApiLoadFailure, uiFailureFromMessage, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_PATH } from "@/lib/policy/policy-pack-delta-demo-help-route";
import type { components } from "@/lib/openapi-schemas";
import {
  buildAfterAssignmentComplianceRuleKeys,
  buildPolicyImpactPreviewSimulateRequest,
  parsePolicyPackContentDocument,
  resolveLatestPublishedVersion,
  summarizePolicyImpactGateResult,
  type PolicyImpactPreviewGateSummary,
} from "@/lib/policy/policy-pack-impact-preview";
import type { PolicyPackContentDocument, PolicyPackVersion } from "@/types/policy-packs";

export type PolicyPackImpactPreviewPanelProps = {
  readonly effectiveContent: PolicyPackContentDocument | null;
  readonly selectedPackId: string;
  readonly packVersions: readonly PolicyPackVersion[];
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

/**
 * Prominent policy impact preview — rule-key diff plus pre-commit simulate for the same committed review.
 */
export function PolicyPackImpactPreviewPanel(props: PolicyPackImpactPreviewPanelProps): React.JSX.Element {
  const [runId, setRunId] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [baselineResult, setBaselineResult] = useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(
    null,
  );
  const [stricterResult, setStricterResult] = useState<components["schemas"]["PolicyPackGovernanceDryRunResult"] | null>(
    null,
  );

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

  const baselineSummary = baselineResult !== null ? summarizePolicyImpactGateResult("allow", baselineResult) : null;
  const stricterSummary =
    stricterResult !== null ? summarizePolicyImpactGateResult("block-critical", stricterResult) : null;

  const onRunPreview = useCallback(async () => {
    const trimmedRunId = runId.trim();

    if (trimmedRunId.length === 0) {
      setFailure(uiFailureFromMessage("Enter a finalized review ID to preview policy impact."));
      setBaselineResult(null);
      setStricterResult(null);

      return;
    }

    setBusy(true);
    setFailure(null);
    setBaselineResult(null);
    setStricterResult(null);

    try {
      const proposedPolicyPackId = props.selectedPackId.trim();
      const baselineRequest = buildPolicyImpactPreviewSimulateRequest(trimmedRunId, "allow", {
        proposedContent,
        proposedPolicyPackId,
      });
      const stricterRequest = buildPolicyImpactPreviewSimulateRequest(trimmedRunId, "block-critical", {
        proposedContent,
        proposedPolicyPackId,
      });

      const [baseline, stricter] = await Promise.all([
        simulatePolicyPackAgainstRun(baselineRequest),
        simulatePolicyPackAgainstRun(stricterRequest),
      ]);

      setBaselineResult(baseline);
      setStricterResult(stricter);
    } catch (error: unknown) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setBusy(false);
    }
  }, [proposedContent, props.selectedPackId, runId]);

  return (
    <section
      className="mb-6 rounded-lg border border-teal-200/80 bg-teal-50/40 p-4 dark:border-teal-900/50 dark:bg-teal-950/20"
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
        <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Same finalized review, different enforcement posture — preview compliance rule key changes and whether the
          pre-finalize gate would allow or block finalize. Read-only; nothing is persisted.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-2">
          <Label htmlFor="policy-impact-preview-run-id">Finalized review ID</Label>
          <Input
            id="policy-impact-preview-run-id"
            data-testid="policy-impact-preview-run-id"
            value={runId}
            onChange={(event) => {
              setRunId(event.target.value);
            }}
            placeholder="Paste a finalized review ID"
            autoComplete="off"
          />
          {props.selectedPackId.trim().length > 0 && latestPublishedVersion !== null ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              After snapshot includes keys from selected pack{" "}
              <code className={OPERATOR_TYPOGRAPHY.badge}>{latestPublishedVersion.version}</code>.
            </p>
          ) : (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Select a pack with a published version to preview assignment key deltas; gate simulation still runs against
              current effective merge.
            </p>
          )}
        </div>
        <Button type="button" onClick={onRunPreview} disabled={busy} data-testid="policy-impact-preview-run">
          {busy ? "Running preview…" : "Run policy impact preview"}
        </Button>
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
