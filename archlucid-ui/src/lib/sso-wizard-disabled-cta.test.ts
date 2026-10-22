import { describe, expect, it } from "vitest";

import { createDefaultSamlSpConfigurationFormValues } from "@/lib/saml-sp-configuration-form-state";
import {
  resolveSamlSpFetchMetadataDisabledReason,
  resolveSamlSpSaveDisabledReason,
} from "@/lib/saml-sp-configuration-disabled-cta";
import { resolveSsoWizardPrimaryDisabledReason } from "@/lib/sso-wizard-disabled-cta";

describe("sso-wizard-disabled-cta", () => {
  it("explains continue prerequisites per wizard step", () => {
    expect(
      resolveSsoWizardPrimaryDisabledReason({
        step: 0,
        isLastStep: false,
        busy: false,
        canContinue: false,
        canActivate: false,
      })?.message,
    ).toContain("identity provider");
    expect(
      resolveSsoWizardPrimaryDisabledReason({
        step: 0,
        isLastStep: false,
        busy: false,
        canContinue: false,
        canActivate: false,
      })?.message,
    ).not.toContain("preset");

    expect(
      resolveSsoWizardPrimaryDisabledReason({
        step: 4,
        isLastStep: false,
        busy: false,
        canContinue: false,
        canActivate: false,
      })?.message,
    ).toContain("sandbox claim-mapping test");
  });

  it("explains save prerequisites on the final step", () => {
    expect(
      resolveSsoWizardPrimaryDisabledReason({
        step: 5,
        isLastStep: true,
        busy: false,
        canContinue: true,
        canActivate: false,
      })?.message,
    ).toContain("sandbox claim-mapping test");
  });
});

describe("saml-sp-configuration-disabled-cta", () => {
  it("explains why fetch metadata is disabled without a URL", () => {
    expect(
      resolveSamlSpFetchMetadataDisabledReason({ metadataUrl: "  ", busy: false })?.message,
    ).toContain("IdP metadata URL");
  });

  it("surfaces SAML validation errors for the save action", () => {
    const values = createDefaultSamlSpConfigurationFormValues();

    expect(
      resolveSamlSpSaveDisabledReason({ values, loading: false, busy: false })?.message,
    ).toContain("Identity provider issuer");
  });
});
