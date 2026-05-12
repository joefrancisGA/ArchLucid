import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  enterpriseMutationControlDisabledTitle,
  governanceWorkflowActivateButtonLabelReaderRank,
  governanceWorkflowActivationsEmptyOperatorHint,
  governanceWorkflowActivationsEmptyReaderHint,
  governanceWorkflowActivationsSubheadingOperator,
  governanceWorkflowActivationsSubheadingReader,
  governanceWorkflowPromotionsActivationsHeadingOperator,
  governanceWorkflowPromotionsActivationsHeadingReader,
  governanceWorkflowPromotionsActivationsSectionLeadOperator,
  governanceWorkflowPromotionsActivationsSectionLeadReader,
  governanceWorkflowPromotionsEmptyOperatorHint,
  governanceWorkflowPromotionsEmptyReaderHint,
} from "@/lib/enterprise-controls-context-copy";
import {
  governanceActivationsEmptyGettingStartedOperator,
  governanceActivationsEmptyGettingStartedReader,
  governancePromotionsEmptyGettingStartedOperator,
  governancePromotionsEmptyGettingStartedReader,
} from "@/lib/governance-workflow-empty-guidance";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { GovernanceEnvironmentActivation, GovernancePromotionRecord } from "@/types/governance-workflow";
import type { MutableRefObject } from "react";
import { formatGovernanceBusinessInstant } from "./governance-workflow-helpers";

type GovernanceWorkflowPromotionsActivationsSectionProps = {
  canMutateWorkflow: boolean;
  listsLoading: boolean;
  activeRunId: string | null;
  promotions: GovernancePromotionRecord[];
  activations: GovernanceEnvironmentActivation[];
  listFailure: ApiLoadFailureState | null;
  workflowActor: string;
  pendingActivate: { activationId: string; env: string } | null;
  setPendingActivate: (v: { activationId: string; env: string } | null) => void;
  pendingActivatePromotionRef: MutableRefObject<GovernancePromotionRecord | null>;
  activateBusyId: string | null;
};

export function GovernanceWorkflowPromotionsActivationsSection(
  props: GovernanceWorkflowPromotionsActivationsSectionProps,
) {
  const {
    canMutateWorkflow,
    listsLoading,
    activeRunId,
    promotions,
    activations,
    listFailure,
    workflowActor,
    pendingActivate,
    setPendingActivate,
    pendingActivatePromotionRef,
    activateBusyId,
  } = props;

  return (
    <section className="mb-0">
      <h3 className="mb-4 text-lg font-semibold">
        {canMutateWorkflow
          ? governanceWorkflowPromotionsActivationsHeadingOperator
          : governanceWorkflowPromotionsActivationsHeadingReader}
      </h3>
      <p className="mb-2 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
        {canMutateWorkflow
          ? governanceWorkflowPromotionsActivationsSectionLeadOperator
          : governanceWorkflowPromotionsActivationsSectionLeadReader}
      </p>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-500">
        Selected review timeline · promotions newest first; activations follow.
        {activeRunId ? <span className="sr-only"> Technical review id {activeRunId}</span> : null}
      </p>

      {!listsLoading && activeRunId !== null && promotions.length === 0 && listFailure === null ? (
        <OperatorEmptyState title="No promotions recorded yet">
          <div className="grid gap-3">
            <p className="text-sm">
              {canMutateWorkflow
                ? governanceWorkflowPromotionsEmptyOperatorHint
                : governanceWorkflowPromotionsEmptyReaderHint}
            </p>
            <GettingStartedSteps
              {...(canMutateWorkflow
                ? governancePromotionsEmptyGettingStartedOperator
                : governancePromotionsEmptyGettingStartedReader)}
            />
          </div>
        </OperatorEmptyState>
      ) : null}

      <div className="mb-8 grid gap-3">
        {promotions.map((p) => (
          <Card key={p.promotionRecordId} className="border-l-4 border-l-violet-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Promotion · {formatGovernanceBusinessInstant(p.promotedUtc)}</CardTitle>
              <p className="sr-only">Promotion record id {p.promotionRecordId}</p>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <div>
                {p.sourceEnvironment} → <strong>{p.targetEnvironment}</strong> · manifest{" "}
                <code className="text-xs">{p.manifestVersion}</code>
              </div>
              <div>By {p.promotedBy}</div>
              {p.notes ? <div>Notes: {p.notes}</div> : null}
            </CardContent>
            <CardFooter>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={
                        pendingActivate !== null ||
                        activateBusyId === p.promotionRecordId ||
                        !workflowActor.trim() ||
                        !canMutateWorkflow
                      }
                      title={canMutateWorkflow ? undefined : enterpriseMutationControlDisabledTitle}
                      onClick={() => {
                        pendingActivatePromotionRef.current = p;
                        setPendingActivate({
                          activationId: p.promotionRecordId,
                          env: p.targetEnvironment,
                        });
                      }}
                    >
                      {activateBusyId === p.promotionRecordId
                        ? "Activating…"
                        : canMutateWorkflow
                          ? "Activate"
                          : governanceWorkflowActivateButtonLabelReaderRank}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {!canMutateWorkflow
                    ? enterpriseMutationControlDisabledTitle
                    : !workflowActor.trim()
                      ? "Enter your name for the audit trail to enable activation."
                      : "POST activation for this manifest on the promotion’s target environment."}
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        ))}
      </div>

      <h4 className="mb-3 text-base font-semibold">
        {canMutateWorkflow
          ? governanceWorkflowActivationsSubheadingOperator
          : governanceWorkflowActivationsSubheadingReader}
      </h4>

      {!listsLoading && activeRunId !== null && activations.length === 0 && listFailure === null ? (
        <OperatorEmptyState title="No activations recorded yet">
          <div className="grid gap-3">
            <p className="text-sm">
              {canMutateWorkflow
                ? governanceWorkflowActivationsEmptyOperatorHint
                : governanceWorkflowActivationsEmptyReaderHint}
            </p>
            <GettingStartedSteps
              {...(canMutateWorkflow
                ? governanceActivationsEmptyGettingStartedOperator
                : governanceActivationsEmptyGettingStartedReader)}
            />
          </div>
        </OperatorEmptyState>
      ) : null}

      <div className="grid gap-3">
        {activations.map((a) => (
          <Card key={a.activationId} className="border-l-4 border-l-teal-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Activation · {formatGovernanceBusinessInstant(a.activatedUtc)}</CardTitle>
              <p className="sr-only">Activation id {a.activationId}</p>
            </CardHeader>
            <CardContent className="grid gap-1 text-sm">
              <div>
                Environment <strong>{a.environment}</strong> · manifest <code className="text-xs">{a.manifestVersion}</code>
              </div>
              <div>Active: {a.isActive ? "yes" : "no"}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
