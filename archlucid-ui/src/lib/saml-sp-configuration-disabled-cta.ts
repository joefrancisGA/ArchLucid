import {
  firstWhyDisabledCtaReason,
  whyDisabledBusy,
  whyDisabledIncompleteInput,
  whyDisabledNeedsPrerequisite,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

import {
  isSamlSpConfigurationFormValid,
  resolveSamlSpConfigurationValidationErrors,
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

  const validationErrors = resolveSamlSpConfigurationValidationErrors(input.values);

  if (validationErrors.length > 0) {
    return whyDisabledIncompleteInput(validationErrors.join(" "));
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
