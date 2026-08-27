import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolvePackagePrintInspectSteps(input: {
  readonly reviewPicked: boolean;
  readonly summaryLoaded: boolean;
  readonly printReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Open the scoped review package",
      complete: input.reviewPicked,
    },
    {
      id: "summary",
      label: "Review print summary and status",
      complete: input.summaryLoaded,
    },
    {
      id: "print",
      label: "Print or return to the review workspace",
      complete: input.printReady,
    },
  ];
}

export function resolvePackagePrintInspectEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly summaryLoaded: boolean;
  readonly printReady: boolean;
}): string {
  const steps = resolvePackagePrintInspectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "print";
}
