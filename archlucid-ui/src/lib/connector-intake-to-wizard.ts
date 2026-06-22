import type { ConnectorIntakeArchitectureRequest } from "@/lib/api/architecture-connector-intake-api";
import { mergeChatIntakeIntoWizardValues } from "@/lib/chat-intake-to-wizard";
import type { WizardFormValues } from "@/lib/wizard-schema";

/** Applies parsed connector-intake fields onto existing wizard state. */
export function mergeConnectorIntakeIntoWizardValues(
  current: WizardFormValues,
  parsed: ConnectorIntakeArchitectureRequest,
): WizardFormValues {
  return mergeChatIntakeIntoWizardValues(current, parsed);
}
