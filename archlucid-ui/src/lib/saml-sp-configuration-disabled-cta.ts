import {
  firstWhyDisabledCtaReason,
  whyDisabledBusy,
  whyDisabledNeedsPrerequisite,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

import {
  isSamlSpConfigurationFormValid,
  resolveSamlSpConfigurationValidationError,
  type SamlSpConfigurationFormValues,
} from "@/lib/saml-sp-configuration-form-state";

export type ResolveSamlSpSaveDisabledReasonInput = {
  readonly values: SamlSpConfigurationFormValues;
  readonly loading: boolean;
  readonly busy: boolean;
};

export function resolveSamlSpSaveDisabledReason(
  input: ResolveSamlSpSaveDisabledReasonInput,
): WhyDisabledCtaReason | null {
  if (input.loading) {
    return whyDisabledBusy("Configuration load");
  }

  if (input.busy) {
    return whyDisabledBusy("Save");
  }

  if (isSamlSpConfigurationFormValid(input.values)) {
    return null;
  }

  const validationError = resolveSamlSpConfigurationValidationError(input.values);

  if (validationError !== null) {
    return {
      kind: "prerequisite",
      message: validationError,
    };
  }

  return whyDisabledNeedsPrerequisite("a complete SAML configuration");
}

export function resolveSamlSpFetchMetadataDisabledReason(input: {
  readonly metadataUrl: string;
  readonly busy: boolean;
}): WhyDisabledCtaReason | null {
  return firstWhyDisabledCtaReason([
    input.busy ? whyDisabledBusy("Metadata fetch") : null,
    input.metadataUrl.trim().length === 0
      ? whyDisabledNeedsPrerequisite("an IdP metadata URL")
      : null,
  ]);
}
