import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveInviteReviewerSteps(input: {
  readonly emailConfigured: boolean;
  readonly roleSelected: boolean;
  readonly inviteSent: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "email",
      label: "Enter reviewer email",
      complete: input.emailConfigured,
    },
    {
      id: "role",
      label: "Choose reviewer role",
      complete: input.roleSelected,
    },
    {
      id: "send",
      label: "Send invitation",
      complete: input.inviteSent,
    },
  ];
}

export function resolveInviteReviewerEmphasizedStepId(input: {
  readonly emailConfigured: boolean;
  readonly roleSelected: boolean;
  readonly inviteSent: boolean;
}): string {
  const steps = resolveInviteReviewerSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "send";
}
