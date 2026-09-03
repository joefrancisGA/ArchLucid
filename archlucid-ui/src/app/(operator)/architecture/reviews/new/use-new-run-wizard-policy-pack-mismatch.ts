"use client";

import { useMemo } from "react";

import {
  deriveWizardPolicyPackCloudMismatch,
  type WizardCreateRunPayloadOptions,
} from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";

export function useNewRunWizardPolicyPackMismatch(
  templateWizardSessionState: WizardFormValues,
  payloadOptions: WizardCreateRunPayloadOptions,
): string | null {
  return useMemo(
    () => deriveWizardPolicyPackCloudMismatch(templateWizardSessionState, payloadOptions),
    [payloadOptions, templateWizardSessionState],
  );
}
