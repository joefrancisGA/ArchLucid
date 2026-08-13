import {
  SLACK_SETUP_STEP_ADD_DESTINATION,
  SLACK_SETUP_STEP_CREATE_WEBHOOK,
  SLACK_SETUP_STEP_SAVE_DESTINATION,
  SLACK_SETUP_STEP_SEND_TEST,
} from "@/lib/slack-integration-page-copy";

export type SlackSetupStep = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
};

export function resolveSlackSetupSteps(input: {
  readonly totalDestinationCount: number;
  readonly activeDestinationCount: number;
  readonly formTestSucceeded: boolean;
}): readonly SlackSetupStep[] {
  const hasSavedDestination = input.totalDestinationCount > 0;
  const hasVerifiedForm = input.formTestSucceeded || hasSavedDestination;

  return [
    {
      id: "create-webhook",
      label: SLACK_SETUP_STEP_CREATE_WEBHOOK,
      complete: hasVerifiedForm,
    },
    {
      id: "add-destination",
      label: SLACK_SETUP_STEP_ADD_DESTINATION,
      complete: hasVerifiedForm,
    },
    {
      id: "send-test",
      label: SLACK_SETUP_STEP_SEND_TEST,
      complete: hasVerifiedForm,
    },
    {
      id: "save-destination",
      label: SLACK_SETUP_STEP_SAVE_DESTINATION,
      complete: input.activeDestinationCount > 0,
    },
  ];
}

export function resolveSlackEmphasizedSetupStepId(input: {
  readonly totalDestinationCount: number;
  readonly activeDestinationCount: number;
  readonly formTestSucceeded: boolean;
}): string {
  if (input.activeDestinationCount > 0) {
    return "save-destination";
  }

  if (input.formTestSucceeded) {
    return "save-destination";
  }

  if (input.totalDestinationCount > 0) {
    return "send-test";
  }

  return "create-webhook";
}
