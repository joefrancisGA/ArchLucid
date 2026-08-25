import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import type { ConversationMessage } from "@/types/conversation";

export function resolveAskQuestionSteps(input: {
  readonly reviewPicked: boolean;
  readonly questionWritten: boolean;
  readonly questionSent: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Pick a review",
      complete: input.reviewPicked,
    },
    {
      id: "question",
      label: "Write a question",
      complete: input.questionWritten,
    },
    {
      id: "send",
      label: "Send the question",
      complete: input.questionSent,
    },
  ];
}

export function resolveAskQuestionEmphasizedStepId(input: {
  readonly reviewPicked: boolean;
  readonly questionWritten: boolean;
  readonly questionSent: boolean;
}): string {
  const steps = resolveAskQuestionSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "send";
}

export function isAskQuestionSent(input: {
  readonly loading: boolean;
  readonly messages: readonly ConversationMessage[];
}): boolean {
  if (input.loading) {
    return true;
  }

  return input.messages.some((message) => message.role.trim().toLowerCase() === "user");
}
