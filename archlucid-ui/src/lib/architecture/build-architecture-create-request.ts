import type { CreateArchitectureRunRequestPayload } from "@/lib/api";
import {
  wizardValuesToCreateRunPayload,
  type WizardCreateRunPayloadOptions,
} from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type UnifiedArchitectureCreateInput = {
  readonly wizardValues: WizardFormValues;
  readonly wizardOptions?: WizardCreateRunPayloadOptions;
};

/**
 * Single canonical builder for POST `/v1/architecture/request` bodies (robustness #8).
 * All wizard/intake paths should route through this function.
 */
export function buildArchitectureCreateRequest(
  input: UnifiedArchitectureCreateInput,
): CreateArchitectureRunRequestPayload {
  return wizardValuesToCreateRunPayload(input.wizardValues, input.wizardOptions);
}
