import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveManifestDetailInspectSteps(input: {
  readonly reviewPicked: boolean;
  readonly recordLoaded: boolean;
  readonly deliverablesReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Open the scoped review package",
      complete: input.reviewPicked,
    },
    {
      id: "record",
      label: "Review decision summary and overview",
      complete: input.recordLoaded,
    },
    {
      id: "deliverables",
      label: "Open deliverables or download the review bundle",
      complete: input.deliverablesReady,
    },
  ];
}

export function resolveManifestDetailInspectEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly recordLoaded: boolean;
  readonly deliverablesReady: boolean;
}): string {
  const steps = resolveManifestDetailInspectSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "deliverables";
}
