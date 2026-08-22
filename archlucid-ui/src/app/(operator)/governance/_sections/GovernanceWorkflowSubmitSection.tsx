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
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowSubmitCardDescriptionReader,
  governanceWorkflowSubmitCardTitleOperator,
  governanceWorkflowSubmitCardTitleReader,
  governanceWorkflowSubmitForApprovalButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import {
  GOVERNANCE_WORKFLOW_READER_LOAD_REVIEW_HINT,
  GOVERNANCE_WORKFLOW_SUBMIT_CARD_DESCRIPTION_OPERATOR,
} from "@/lib/governance/governance-workflow-release-copy";
import { GOVERNANCE_ENV_OPTIONS } from "./governance-workflow-helpers";

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
  submitSource: string;
  setSubmitSource: (v: string) => void;
  submitTarget: string;
  setSubmitTarget: (v: string) => void;
  submitComment: string;
  setSubmitComment: (v: string) => void;
  submitBusy: boolean;
  onSubmitApproval: () => void | Promise<void>;
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
    submitSource,
    setSubmitSource,
    submitTarget,
    setSubmitTarget,
    submitComment,
    setSubmitComment,
    submitBusy,
    onSubmitApproval,
  } = props;

  if (buyerSuppressGovernanceSubmitChrome) {
    return null;
  }

  const missingSubmitFields: string[] = [];

  if (submitRunId.trim().length === 0) {
    missingSubmitFields.push("review");
  }

  if (submitManifestVersion.trim().length === 0) {
    missingSubmitFields.push("review record version");
  }

  if (submitSource.trim().length === 0) {
    missingSubmitFields.push("source environment");
  }

  if (submitTarget.trim().length === 0) {
    missingSubmitFields.push("target environment");
  }

  const submitReadinessMessage: string =
    missingSubmitFields.length === 0 ? "Ready to submit." : `Missing: ${missingSubmitFields.join(", ")}.`;

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
            <div className="grid gap-2">
              <AskRunIdPicker
                fieldId="gov-submit-run"
                label="Review"
                value={submitRunId}
                onChange={setSubmitRunId}
                selectedThreadId=""
                preferAutoPick={preferAutoPick && canMutateWorkflow}
                disabled={!canMutateWorkflow}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gov-submit-version">
                Review record version (the{" "}
                <GlossaryTooltip termKey="golden_manifest" pulseOnFirstSession={false}>
                  finalized review record
                </GlossaryTooltip>{" "}
                label)
              </Label>
              <Input
                id="gov-submit-version"
                value={submitManifestVersion}
                onChange={(e) => setSubmitManifestVersion(e.target.value)}
                placeholder="e.g. v1.0.0"
                autoComplete="off"
                readOnly={!canMutateWorkflow}
                title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
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
                    {GOVERNANCE_ENV_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gov-submit-target-env">Target environment</Label>
                <Select value={submitTarget} onValueChange={setSubmitTarget} disabled={!canMutateWorkflow}>
                  <SelectTrigger
                    id="gov-submit-target-env"
                    className="w-full"
                    title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                  >
                    <SelectValue placeholder="Target" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOVERNANCE_ENV_OPTIONS.map((o) => (
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
            <div className="grid gap-2">
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
          <CardFooter className="flex flex-col items-stretch gap-3">
            <Button
              type="button"
              data-testid="governance-submit-approval-button"
              onClick={() => void onSubmitApproval()}
              disabled={
                submitBusy ||
                !canMutateWorkflow ||
                submitRunId.trim().length === 0 ||
                submitManifestVersion.trim().length === 0 ||
                submitSource.trim().length === 0 ||
                submitTarget.trim().length === 0
              }
              title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
            >
              {submitBusy
                ? "Submitting…"
                : canMutateWorkflow
                  ? "Submit for resolve outcomes"
                  : governanceWorkflowSubmitForApprovalButtonLabelReaderRank}
            </Button>
            {canMutateWorkflow ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="governance-submit-readiness"
              >
                {submitReadinessMessage}
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
                    Submitting for resolve outcomes requires additional permissions on your account. You can still review
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
