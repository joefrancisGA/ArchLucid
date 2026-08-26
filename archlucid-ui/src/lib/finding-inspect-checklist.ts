import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveFindingInspectSteps(input: {
  readonly reviewPicked: boolean;
  readonly evidenceLoaded: boolean;
  readonly inspectComplete: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Open the scoped review package",
      complete: input.reviewPicked,
    },
    {
      id: "load",
      label: "Load finding evidence trace",
      complete: input.evidenceLoaded,
    },
    {
      id: "inspect",
      label: "Inspect evidence, rule, and audit trail",
      complete: input.inspectComplete,
    },
  ];
}

export function resolveFindingInspectEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly evidenceLoaded: boolean;
  readonly inspectComplete: boolean;
}): string {
  const steps = resolveFindingInspectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "inspect";
}

export function resolveFindingInspectCompleteFromPayload(input: {
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
