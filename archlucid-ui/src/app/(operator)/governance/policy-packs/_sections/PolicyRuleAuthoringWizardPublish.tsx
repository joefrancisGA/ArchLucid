"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { PolicySimulator } from "@/components/governance/PolicySimulator";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { components } from "@/lib/openapi-schemas";
import { buildPolicyPacksHrefWithReviewId } from "@/lib/policy-packs-review-handoff";
import type { PolicyPackContentDocument } from "@/types/policy-packs";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { PACK_TYPES } from "./policy-packs-page-constants";

export const POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID = "policy-rule-wizard-mutate-disabled-hint";
export const POLICY_RULE_WIZARD_BUNDLED_PUBLISH_BLOCKED_HINT_ID = "policy-rule-wizard-bundled-publish-blocked-hint";

type RecentRunOption = {
  readonly runId: string;
  readonly displayName?: string | null;
};

export type PolicyRuleAuthoringWizardPublishProps = {
  readonly canMutatePacks: boolean;
  readonly loading: boolean;
  readonly bundledPublishBlocked: boolean;
  readonly name: string;
  readonly onNameChange: (value: string) => void;
  readonly description: string;
  readonly onDescriptionChange: (value: string) => void;
  readonly packType: string;
  readonly onPackTypeChange: (value: string) => void;
  readonly publishVersion: string;
  readonly onPublishVersionChange: (value: string) => void;
  readonly onCreate: () => void | Promise<void>;
  readonly onPublish: () => void | Promise<void>;
  readonly simulateRunId: string;
  readonly onSimulateRunIdChange: (value: string) => void;
  readonly recentRuns: readonly RecentRunOption[];
  readonly runsLoadError: string | null;
  readonly simulateBusy: boolean;
  readonly simulateFailure: ApiLoadFailureState | null;
  readonly simulateResult: components["schemas"]["PolicyPackGovernanceDryRunResult"] | null;
  readonly blockOnCritical: boolean;
  readonly onBlockOnCriticalChange: (value: boolean) => void;
  readonly allowPublishWithoutTest: boolean;
  readonly onAllowPublishWithoutTestChange: (value: boolean) => void;
  readonly loadRecentRuns: () => void | Promise<void>;
  readonly runSimulation: () => void | Promise<void>;
  readonly parsedDocumentForSimulate: PolicyPackContentDocument | null;
  readonly canPublishAfterTest: boolean;
  readonly publishDisabled: boolean;
};

export function PolicyRuleAuthoringWizardTestPanel(
  props: Pick<
    PolicyRuleAuthoringWizardPublishProps,
    | "simulateRunId"
    | "onSimulateRunIdChange"
    | "recentRuns"
    | "runsLoadError"
    | "simulateBusy"
    | "simulateFailure"
    | "simulateResult"
    | "blockOnCritical"
    | "onBlockOnCriticalChange"
    | "loadRecentRuns"
    | "runSimulation"
    | "parsedDocumentForSimulate"
  > & {
    readonly scopedReviewId?: string;
    readonly onPickReview?: (reviewId: string) => void;
  },
): React.JSX.Element {
  const {
    simulateRunId,
    onSimulateRunIdChange,
    recentRuns,
    runsLoadError,
    simulateBusy,
    simulateFailure,
    simulateResult,
    blockOnCritical,
    onBlockOnCriticalChange,
    loadRecentRuns,
    runSimulation,
    parsedDocumentForSimulate,
    scopedReviewId = "",
    onPickReview,
  } = props;

  const scopedReviewIdTrimmed = scopedReviewId.trim();
  const scopedReviewFilterActive = scopedReviewIdTrimmed.length > 0;
  const requiresReviewPick = onPickReview !== undefined;
  const testClearScopeHref = buildPolicyPacksHrefWithReviewId("");

  return (
    <div
      className="space-y-4 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="policy-rule-wizard-step-test"
    >
        <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Test on review</h4>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Dry-run this policy content against a committed architecture snapshot without leaving the authoring surface.
        </p>

        {parsedDocumentForSimulate === null ? (
          <p className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.body)} role="status">
            Fix invalid policy JSON or guided-field validation errors before running a test.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-2">
            {!scopedReviewFilterActive && requiresReviewPick ? (
              <>
                <Label htmlFor="policy-rule-wizard-run-picker">Finalized review</Label>
                <div className="min-w-[16rem] max-w-xl">
                  <AskRunIdPicker
                    value=""
                    onChange={(value) => {
                      if (value.trim().length > 0) {
                        onPickReview?.(value.trim());
                      }
                    }}
                    selectedThreadId=""
                    committedOnly
                    preferAutoPick={false}
                    autoSelectSyntheticSample={false}
                    label="Review package"
                    fieldId="policy-rule-wizard-run-picker"
                    hideFieldHelper
                  />
                </div>
              </>
            ) : scopedReviewFilterActive ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="policy-rule-wizard-run-scope-banner"
              >
                {"Testing policy content for review "}
                <span className="font-mono text-al-text-primary">{scopedReviewIdTrimmed}</span>
                {" · "}
                <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={testClearScopeHref}>
                  Clear review scope
                </Link>
                {" · "}
                <Link
                  className={OPERATOR_BODY_INLINE_LINK_CLASS}
                  href={`/architecture/reviews/${encodeURIComponent(scopedReviewIdTrimmed)}`}
                >
                  Open review
                </Link>
              </p>
            ) : (
              <>
                <Label htmlFor="policy-rule-wizard-run-picker">Finalized review</Label>
                <div className="min-w-[16rem] max-w-xl">
                  <AskRunIdPicker
                    value={simulateRunId}
                    onChange={onSimulateRunIdChange}
                    selectedThreadId=""
                    committedOnly
                    preferAutoPick={false}
                    autoSelectSyntheticSample={false}
                    label="Review package"
                    fieldId="policy-rule-wizard-run-picker"
                    hideFieldHelper
                  />
                </div>
              </>
            )}
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={() => void loadRecentRuns()}>
            Load recent reviews
          </Button>
        </div>

        {runsLoadError !== null ? (
          <p className={cn("text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>{runsLoadError}</p>
        ) : null}

        {recentRuns.length > 0 ? (
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            Pick a recent review
            <select
              className={cn("mt-1 block w-full max-w-xl p-2", OPERATOR_TYPOGRAPHY.body)}
              value=""
              onChange={(e) => onSimulateRunIdChange(e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {recentRuns.map((r) => (
                <option key={r.runId} value={r.runId}>
                  {r.displayName?.trim() ?? r.runId}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <input
            type="checkbox"
            checked={blockOnCritical}
            onChange={(e) => onBlockOnCriticalChange(e.target.checked)}
          />
          Treat critical findings as blocking before finalize
        </label>

        <Button
          type="button"
          size="sm"
          onClick={() => void runSimulation()}
          disabled={simulateBusy || parsedDocumentForSimulate === null}
        >
          {simulateBusy ? "Testing…" : "Run policy test"}
        </Button>

        {simulateFailure !== null ? (
          <div role="alert">
            <OperatorApiProblem
              problem={simulateFailure.problem}
              fallbackMessage={simulateFailure.message}
              correlationId={simulateFailure.correlationId}
            />
          </div>
        ) : null}

        {simulateResult !== null ? (
          <div data-testid="policy-rule-wizard-simulate-result">
            <PolicySimulator result={simulateResult} />
          </div>
        ) : null}
    </div>
  );
}

export function PolicyRuleAuthoringWizardPublishPanel(
  props: Pick<
    PolicyRuleAuthoringWizardPublishProps,
    | "canMutatePacks"
    | "loading"
    | "bundledPublishBlocked"
    | "name"
    | "onNameChange"
    | "description"
    | "onDescriptionChange"
    | "packType"
    | "onPackTypeChange"
    | "publishVersion"
    | "onPublishVersionChange"
    | "onCreate"
    | "onPublish"
    | "allowPublishWithoutTest"
    | "onAllowPublishWithoutTestChange"
    | "parsedDocumentForSimulate"
    | "canPublishAfterTest"
    | "publishDisabled"
  >,
): React.JSX.Element {
  const {
    canMutatePacks,
    loading,
    bundledPublishBlocked,
    name,
    onNameChange,
    description,
    onDescriptionChange,
    packType,
    onPackTypeChange,
    publishVersion,
    onPublishVersionChange,
    onCreate,
    onPublish,
    allowPublishWithoutTest,
    onAllowPublishWithoutTestChange,
    parsedDocumentForSimulate,
    canPublishAfterTest,
    publishDisabled,
  } = props;

  return (
      <div
        className="mt-6 space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
        data-testid="policy-rule-wizard-step-publish"
      >
        <h4 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Create or publish</h4>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Custom packs use the same versioned storage as bundled defaults (tenant-owned rows). Publish requires pack
          admin authority.
        </p>

        <label className={cn("flex max-w-prose items-start gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <input
            type="checkbox"
            checked={allowPublishWithoutTest}
            onChange={(e) => onAllowPublishWithoutTestChange(e.target.checked)}
            disabled={canPublishAfterTest}
          />
          <span>
            Allow publish without a successful in-wizard test (not recommended when the approval check would block).
          </span>
        </label>

        <div className="grid gap-2 max-w-xl sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="wizard-publish-name" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Pack name (create)
            </label>
            <Input
              id="wizard-publish-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              readOnly={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="wizard-publish-desc" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Description
            </label>
            <Input
              id="wizard-publish-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              readOnly={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
            />
          </div>
          <label className={cn("sm:col-span-2", OPERATOR_TYPOGRAPHY.body)}>
            Pack type
            <select
              value={packType}
              onChange={(e) => onPackTypeChange(e.target.value)}
              disabled={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
              className="block w-full p-2 mt-1"
            >
              {PACK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="wizard-publish-version" className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              Version label (publish)
            </label>
            <Input
              id="wizard-publish-version"
              value={publishVersion}
              onChange={(e) => onPublishVersionChange(e.target.value)}
              readOnly={!canMutatePacks}
              aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
            />
          </div>
        </div>

        {bundledPublishBlocked ? (
          <p
            id={POLICY_RULE_WIZARD_BUNDLED_PUBLISH_BLOCKED_HINT_ID}
            className={cn(
              "max-w-prose rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            role="note"
          >
            Bundled default packs cannot be republished from Policy packs. Copy JSON into a project custom pack to customize.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="policy-rule-wizard-create-pack"
            onClick={() => void onCreate()}
            disabled={loading || !canMutatePacks || parsedDocumentForSimulate === null}
            aria-describedby={!canMutatePacks ? POLICY_RULE_WIZARD_MUTATE_DISABLED_HINT_ID : undefined}
          >
            Create pack
          </Button>
          <Button
            type="button"
            data-testid="policy-rule-wizard-publish-version"
            onClick={() => void onPublish()}
            disabled={publishDisabled}
            aria-describedby={
              bundledPublishBlocked ? POLICY_RULE_WIZARD_BUNDLED_PUBLISH_BLOCKED_HINT_ID : undefined
            }
          >
            Publish version
          </Button>
        </div>
      </div>
  );
}
