import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveFindingDetailWorkflowSteps(input: {
  readonly reviewPicked: boolean;
  readonly summaryLoaded: boolean;
  readonly traceReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Open the scoped review package",
      complete: input.reviewPicked,
    },
    {
      id: "summary",
      label: "Review finding summary and recommended action",
      complete: input.summaryLoaded,
    },
    {
      id: "trace",
      label: "Open evidence trace or export finding",
      complete: input.traceReady,
    },
  ];
}

export function resolveFindingDetailWorkflowEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly summaryLoaded: boolean;
  readonly traceReady: boolean;
}): string {
  const steps = resolveFindingDetailWorkflowSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "trace";
}

export function resolveFindingDetailWorkflowTraceReadyFromPayload(input: {
  readonly evidenceCount: number;
  readonly decisionRuleId: string | null;
  readonly reasoningTrace: string | null | undefined;
}): boolean {
  if (input.evidenceCount > 0) {
    return true;
  }

  if (input.decisionRuleId !== null && input.decisionRuleId.trim().length > 0) {
    return true;
  }

  const reasoningTrace = input.reasoningTrace?.trim() ?? "";

  return reasoningTrace.length > 0;
}
