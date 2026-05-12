import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RunIdPicker } from "@/components/RunIdPicker";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowApprovalRequestsCardTitleOperator,
  governanceWorkflowApprovalRequestsCardTitleReader,
  governanceWorkflowQueryCardDescriptionBuyerPolished,
  governanceWorkflowQueryCardDescriptionOperator,
  governanceWorkflowQueryCardDescriptionReader,
  governanceWorkflowRefreshRunDataButtonLabel,
  governanceWorkflowRefreshRunDataTitle,
} from "@/lib/enterprise-controls-context-copy";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer-facing-review-title";

type GovernanceWorkflowQueryCardProps = {
  hideGovernanceQueryLoadCard: boolean;
  activeRunId: string | null;
  buyerPolishedShell: boolean;
  canMutateWorkflow: boolean;
  queryRunId: string;
  setQueryRunId: (v: string) => void;
  setActiveRunId: (v: string | null) => void;
  loadLists: (runId: string) => void | Promise<void>;
  onLoadRun: () => void;
  listsLoading: boolean;
  listsLoadingShowsBusyChrome: boolean;
  refreshIfActive: () => void | Promise<void>;
  workflowActor: string;
  setWorkflowActor: (v: string) => void;
};

export function GovernanceWorkflowQueryCard(props: GovernanceWorkflowQueryCardProps) {
  const {
    hideGovernanceQueryLoadCard,
    activeRunId,
    buyerPolishedShell,
    canMutateWorkflow,
    queryRunId,
    setQueryRunId,
    setActiveRunId,
    loadLists,
    onLoadRun,
    listsLoading,
    listsLoadingShowsBusyChrome,
    refreshIfActive,
    workflowActor,
    setWorkflowActor,
  } = props;

  return (
    <>
      {hideGovernanceQueryLoadCard && activeRunId !== null ? (
        <p className="mb-4 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
          Showing governance workflow for <strong>{buyerFacingReviewLinkLabelFromRunId(activeRunId)}</strong>.
        </p>
      ) : null}

      {!hideGovernanceQueryLoadCard ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {canMutateWorkflow
                ? governanceWorkflowApprovalRequestsCardTitleOperator
                : governanceWorkflowApprovalRequestsCardTitleReader}
            </CardTitle>
            <CardDescription>
              {buyerPolishedShell
                ? governanceWorkflowQueryCardDescriptionBuyerPolished
                : canMutateWorkflow
                  ? governanceWorkflowQueryCardDescriptionOperator
                  : governanceWorkflowQueryCardDescriptionReader}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="grid min-w-0 flex-1 gap-2">
                <RunIdPicker
                  inputId="gov-query-run"
                  label="Review"
                  placeholder="Select a review from the list"
                  value={queryRunId}
                  useBuyerFacingRunLabels={buyerPolishedShell}
                  onChange={setQueryRunId}
                  onSelect={(id) => {
                    setQueryRunId(id);
                    setActiveRunId(id);
                    void loadLists(id);
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={onLoadRun} disabled={listsLoading}>
                  {listsLoadingShowsBusyChrome ? "Loading…" : buyerPolishedShell ? "Load review" : "Load"}
                </Button>
                {activeRunId !== null ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refreshIfActive()}
                    disabled={listsLoading}
                    title={governanceWorkflowRefreshRunDataTitle}
                  >
                    {listsLoadingShowsBusyChrome
                      ? "Refreshing…"
                      : buyerPolishedShell
                        ? "Refresh review data"
                        : governanceWorkflowRefreshRunDataButtonLabel}
                  </Button>
                ) : null}
              </div>
            </div>
            {canMutateWorkflow && !buyerPolishedShell ? (
              <div className="grid gap-2">
                <Label htmlFor="gov-workflow-actor">Your name for the audit trail (promote and activate)</Label>
                <Input
                  id="gov-workflow-actor"
                  value={workflowActor}
                  onChange={(e) => setWorkflowActor(e.target.value)}
                  placeholder="Display name recorded with promote and activate actions"
                  autoComplete="username"
                  title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  This is stored with promotion and activation records alongside your signed-in account.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}
