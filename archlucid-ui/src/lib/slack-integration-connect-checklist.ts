import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

import {
  SLACK_SETUP_STEP_ADD_DESTINATION,
  SLACK_SETUP_STEP_CREATE_WEBHOOK,
  SLACK_SETUP_STEP_SEND_TEST,
} from "@/lib/slack-integration-page-copy";

export function resolveSlackIntegrationConnectSteps(input: {
  readonly totalDestinationCount: number;
  readonly activeDestinationCount: number;
  readonly formTestSucceeded: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  const connected = input.formTestSucceeded || input.totalDestinationCount > 0;
  const destinationChosen = input.totalDestinationCount > 0;
  const testSucceeded = input.formTestSucceeded || input.activeDestinationCount > 0;

  return [
    { id: "connect", label: SLACK_SETUP_STEP_CREATE_WEBHOOK, complete: connected },
    { id: "destination", label: SLACK_SETUP_STEP_ADD_DESTINATION, complete: destinationChosen },
    { id: "test", label: SLACK_SETUP_STEP_SEND_TEST, complete: testSucceeded },
  ];
}

export function resolveSlackIntegrationEmphasizedStepId(input: {
  readonly totalDestinationCount: number;
  readonly activeDestinationCount: number;
  readonly formTestSucceeded: boolean;
}): string {
  const steps = resolveSlackIntegrationConnectSteps(input);

  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "test";
}
