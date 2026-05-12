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
import { cn } from "@/lib/utils";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { isBuyerSafeDemoMarketingChromeEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_ENV_OPTIONS } from "./governance-workflow-helpers";

type GovernanceWorkflowSubmitSectionProps = {
  buyerPolishedShell: boolean;
  buyerSuppressGovernanceSubmitChrome: boolean;
  canMutateWorkflow: boolean;
  hideGovernanceQueryLoadCard: boolean;
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

  return (
    <section className="mb-10">
      {buyerPolishedShell && !canMutateWorkflow ? (
        <Card className="border border-teal-200/80 bg-teal-50/50 dark:border-teal-900/55 dark:bg-teal-950/35">
          <CardHeader className="space-y-1">
            <CardTitle>Governance submissions</CardTitle>
            <CardDescription className="text-neutral-700 dark:text-neutral-300">
              {governanceWorkflowSubmitCardDescriptionReader}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="m-0 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
              {hideGovernanceQueryLoadCard
                ? "Approval activity for this review appears below."
                : "Load a review in the approval section below to inspect approvals, promotions, and environment activity."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className={cn(!canMutateWorkflow && !buyerPolishedShell && "opacity-95")}>
          <CardHeader>
            <CardTitle>
              {canMutateWorkflow ? governanceWorkflowSubmitCardTitleOperator : governanceWorkflowSubmitCardTitleReader}
            </CardTitle>
            <CardDescription>
              {canMutateWorkflow ? (
                <>
                  Starts an approval request so reviewers can promote your finalized manifest from a source environment
                  toward a target (for example staging to production).
                </>
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
                preferAutoPick={canMutateWorkflow}
                disabled={!canMutateWorkflow}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gov-submit-version">
                Manifest version (the{" "}
                <GlossaryTooltip termKey="golden_manifest" pulseOnFirstSession={false}>
                  reviewed manifest
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
              disabled={submitBusy || !canMutateWorkflow || submitRunId.trim().length === 0}
              title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
            >
              {submitBusy
                ? "Submitting…"
                : canMutateWorkflow
                  ? "Submit for governance approval"
                  : governanceWorkflowSubmitForApprovalButtonLabelReaderRank}
            </Button>
            {!canMutateWorkflow ? (
              <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400" role="note">
                {isBuyerSafeDemoMarketingChromeEnv() || isStaticDemoPayloadFallbackEnabled() ? (
                  <>
                    This evaluation sample is read-only. Production tenants can submit governance approvals when their role
                    allows.
                  </>
                ) : (
                  <>
                    Submitting for governance approval requires additional permissions on your account. You can still review
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
