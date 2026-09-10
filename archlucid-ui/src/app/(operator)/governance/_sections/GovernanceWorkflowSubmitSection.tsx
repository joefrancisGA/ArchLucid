import { cn } from "@/lib/utils";
import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { InlineGuidanceText } from "@/components/InlineGuidanceText";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowSubmitCardDescriptionReader,
  governanceWorkflowSubmitCardTitleOperator,
  governanceWorkflowSubmitCardTitleReader,
  governanceWorkflowSubmitForApprovalButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { CTA_WIDTH, OPERATOR_FORM_FIELD_STACK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import {
  GOVERNANCE_WORKFLOW_READER_LOAD_REVIEW_HINT,
  GOVERNANCE_WORKFLOW_SUBMIT_CARD_DESCRIPTION_OPERATOR,
} from "@/lib/governance/governance-workflow-release-copy";
import { GOVERNANCE_ENV_OPTIONS } from "./governance-workflow-helpers";
import {
  governanceAllowedTargetSlugs,
  governanceEnvironmentOptionsFromCatalog,
} from "@/lib/governance/governance-environment-catalog-helpers";
import { validateGovernanceSubmitManifestVersion } from "@/lib/governance/governance-submit-manifest-version";
import type { GovernanceEnvironmentCatalog } from "@/types/governance-environment-catalog";
import {
  resolveGovernanceWorkflowSubmitEmphasizedStepId,
  resolveGovernanceWorkflowSubmitSteps,
} from "@/lib/governance-workflow-submit-checklist";
import { GOVERNANCE_APPROVAL_SUBMIT_LABEL } from "@/lib/vocabulary/governance-approval-vocabulary";

export type GovernanceWorkflowSubmitSectionProps = {
  buyerPolishedShell: boolean;
  buyerSuppressGovernanceSubmitChrome: boolean;
  canMutateWorkflow: boolean;
  hideGovernanceQueryLoadCard: boolean;
  /** Passed through to the review picker's auto-pick behavior. Defaults to true for backward compat. */
  preferAutoPick?: boolean;
  submitRunId: string;
  setSubmitRunId: (v: string) => void;
  submitManifestVersion: string;
  setSubmitManifestVersion: (v: string) => void;
  maxPersistedManifestVersion: string | null;
  submitSource: string;
  setSubmitSource: (v: string) => void;
  submitTarget: string;
  setSubmitTarget: (v: string) => void;
  submitComment: string;
  setSubmitComment: (v: string) => void;
  submitBusy: boolean;
  submitApprovalComplete?: boolean;
  onSubmitApproval: () => void | Promise<void>;
  environmentCatalog?: GovernanceEnvironmentCatalog;
};

export function GovernanceWorkflowSubmitSection(props: GovernanceWorkflowSubmitSectionProps) {
  const {
    buyerPolishedShell,
    buyerSuppressGovernanceSubmitChrome,
    canMutateWorkflow,
    hideGovernanceQueryLoadCard,
    preferAutoPick = true,
    submitRunId,
    setSubmitRunId,
    submitManifestVersion,
    setSubmitManifestVersion,
    maxPersistedManifestVersion,
    submitSource,
    setSubmitSource,
    submitTarget,
    setSubmitTarget,
    submitComment,
    setSubmitComment,
    submitBusy,
    submitApprovalComplete = false,
    onSubmitApproval,
    environmentCatalog,
  } = props;

  if (buyerSuppressGovernanceSubmitChrome) {
    return null;
  }

  const missingSubmitFields: string[] = [];
  const manifestVersionValidation = validateGovernanceSubmitManifestVersion(
    submitManifestVersion,
    maxPersistedManifestVersion,
  );

  if (submitRunId.trim().length === 0) {
    missingSubmitFields.push("review");
  }

  if (!manifestVersionValidation.valid) {
    missingSubmitFields.push("review record version");
  }

  if (submitSource.trim().length === 0) {
    missingSubmitFields.push("source environment");
  }

  if (submitTarget.trim().length === 0) {
    missingSubmitFields.push("target environment");
  }

  const submitReadinessMessage: string =
    missingSubmitFields.length === 0
      ? "Ready to submit."
      : manifestVersionValidation.valid
        ? `Missing: ${missingSubmitFields.join(", ")}.`
        : manifestVersionValidation.message;
  const reviewPicked = submitRunId.trim().length > 0;
  const requiredFieldsComplete =
    manifestVersionValidation.valid &&
    submitSource.trim().length > 0 &&
    submitTarget.trim().length > 0;
  const submitChecklistInput = {
    reviewPicked,
    requiredFieldsComplete,
    submitComplete: submitApprovalComplete,
  };

  const environmentOptions = governanceEnvironmentOptionsFromCatalog(environmentCatalog);
  const sourceOptions = environmentOptions.length > 0 ? environmentOptions : GOVERNANCE_ENV_OPTIONS;
  const fallbackAllowedTargetSlugs =
    submitSource.trim().length === 0
      ? []
      : sourceOptions.filter((option) => option.value !== submitSource).map((option) => option.value);
  const allowedTargetSlugs =
    environmentCatalog === undefined
      ? fallbackAllowedTargetSlugs
      : governanceAllowedTargetSlugs(environmentCatalog, submitSource);
  const targetOptions = sourceOptions.filter((option) => allowedTargetSlugs.includes(option.value));
  const resolvedTargetOptions = submitSource.trim().length === 0 ? [] : targetOptions;
  const submitSteps = resolveGovernanceWorkflowSubmitSteps(submitChecklistInput);
  const submitEmphasizedStepId = resolveGovernanceWorkflowSubmitEmphasizedStepId(submitChecklistInput);

  return (
    <section className="mb-6">
      {buyerPolishedShell && !canMutateWorkflow ? (
        <Card className="border border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
          <CardHeader className="space-y-1">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Governance submissions</CardTitle>
            <CardDescription className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {governanceWorkflowSubmitCardDescriptionReader}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {hideGovernanceQueryLoadCard
                ? "Approval activity for this review appears below."
                : GOVERNANCE_WORKFLOW_READER_LOAD_REVIEW_HINT}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(!canMutateWorkflow && !buyerPolishedShell && "opacity-95")}>
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
              {canMutateWorkflow ? governanceWorkflowSubmitCardTitleOperator : governanceWorkflowSubmitCardTitleReader}
            </CardTitle>
            <CardDescription>
              {canMutateWorkflow ? (
                <>{GOVERNANCE_WORKFLOW_SUBMIT_CARD_DESCRIPTION_OPERATOR}</>
              ) : (
                governanceWorkflowSubmitCardDescriptionReader
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {canMutateWorkflow ? (
              <IntegrationConnectChecklist
                title="Submit checklist"
                steps={submitSteps}
                emphasizedStepId={submitEmphasizedStepId}
                testIdPrefix="governance-workflow-submit"
              />
            ) : null}
            <AskRunIdPicker
              fieldId="gov-submit-run"
              label="Review"
              value={submitRunId}
              onChange={setSubmitRunId}
              selectedThreadId=""
              preferAutoPick={preferAutoPick && canMutateWorkflow}
              disabled={!canMutateWorkflow}
            />
            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <Label htmlFor="gov-submit-version">
                Review record version (the{" "}
                <GlossaryTooltip termKey="golden_manifest" pulseOnFirstSession={false}>
                  finalized review record
                </GlossaryTooltip>{" "}
                label)
              </Label>
              <input
                type="hidden"
                name="governance-submit-max-manifest-version"
                value={maxPersistedManifestVersion ?? ""}
                data-testid="governance-submit-max-manifest-version"
                readOnly
              />
              <Input
                id="gov-submit-version"
                value={submitManifestVersion}
                onChange={(e) => setSubmitManifestVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                autoComplete="off"
                readOnly={!canMutateWorkflow}
                aria-invalid={canMutateWorkflow && !manifestVersionValidation.valid}
                aria-describedby={
                  canMutateWorkflow && !manifestVersionValidation.valid ? "gov-submit-version-validation" : undefined
                }
                title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
              />
              {canMutateWorkflow && !manifestVersionValidation.valid ? (
                <p
                  id="gov-submit-version-validation"
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  role="alert"
                  data-testid="governance-submit-version-validation"
                >
                  {manifestVersionValidation.message}
                </p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
                <Label htmlFor="gov-submit-source-env">Source environment</Label>
                <Select value={submitSource} onValueChange={setSubmitSource} disabled={!canMutateWorkflow}>
                  <SelectTrigger
                    id="gov-submit-source-env"
                    className="w-full"
                    title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                  >
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
                <Label htmlFor="gov-submit-target-env">Target environment</Label>
                <Select
                  value={submitTarget}
                  onValueChange={setSubmitTarget}
                  disabled={!canMutateWorkflow || submitSource.trim().length === 0}
                >
                  <SelectTrigger
                    id="gov-submit-target-env"
                    className="w-full"
                    title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                  >
                    <SelectValue placeholder="Target" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedTargetOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className={cn("m-0 sm:col-span-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Source and target describe the review state transitions in your governance process (for example
                review-pending → approved).
              </p>
            </div>
            <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
              <Label htmlFor="gov-submit-comment">Request comment (optional)</Label>
              <Textarea
                id="gov-submit-comment"
                value={submitComment}
                onChange={(e) => setSubmitComment(e.target.value)}
                rows={3}
                placeholder="Context for reviewers"
                readOnly={!canMutateWorkflow}
                title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <Button
              type="button"
              className={CTA_WIDTH.content}
              data-testid="governance-submit-approval-button"
              onClick={() => void onSubmitApproval()}
              disabled={
                submitBusy ||
                !canMutateWorkflow ||
                submitRunId.trim().length === 0 ||
                !manifestVersionValidation.valid ||
                submitSource.trim().length === 0 ||
                submitTarget.trim().length === 0
              }
              title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
            >
              {submitBusy
                ? "Submitting…"
                : canMutateWorkflow
                  ? GOVERNANCE_APPROVAL_SUBMIT_LABEL
                  : governanceWorkflowSubmitForApprovalButtonLabelReaderRank}
            </Button>
            {canMutateWorkflow ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="governance-submit-readiness"
              >
                <InlineGuidanceText text={submitReadinessMessage} />
              </p>
            ) : null}
            {!canMutateWorkflow ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="note">
                {isBuyerSafeDemoMarketingChromeEnv() || isStaticDemoPayloadFallbackEnabled() ? (
                  <>
                    Approvals require an authorized governance role; your access here is review-only.
                  </>
                ) : (
                  <>
                    Submitting for approval requires additional permissions on your account. You can still review
                    approvals below — contact your administrator to enable governance submissions for your workspace.
                  </>
                )}
              </p>
            ) : null}
          </CardFooter>
        </Card>
      )}
    </section>
  );
}
