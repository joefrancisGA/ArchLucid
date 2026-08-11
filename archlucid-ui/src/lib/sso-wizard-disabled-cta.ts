import {
  firstWhyDisabledCtaReason,
  whyDisabledBusy,
  whyDisabledNeedsPrerequisite,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

export type ResolveSsoWizardPrimaryDisabledReasonInput = {
  readonly step: number;
  readonly isLastStep: boolean;
  readonly busy: boolean;
  readonly canContinue: boolean;
  readonly canActivate: boolean;
};

export function resolveSsoWizardPrimaryDisabledReason(
  input: ResolveSsoWizardPrimaryDisabledReasonInput,
): WhyDisabledCtaReason | null {
  if (input.isLastStep) {
    return firstWhyDisabledCtaReason([
      input.busy ? whyDisabledBusy("Activation") : null,
      !input.canActivate ? whyDisabledNeedsPrerequisite("a successful test sign-in on the prior step") : null,
    ]);
  }

  return firstWhyDisabledCtaReason([
    input.busy ? whyDisabledBusy("Continue") : null,
    !input.canContinue ? resolveSsoWizardContinuePrerequisiteReason(input.step) : null,
  ]);
}

function resolveSsoWizardContinuePrerequisiteReason(step: number): WhyDisabledCtaReason | null {
  switch (step) {
    case 0:
      return whyDisabledNeedsPrerequisite("an identity provider preset");
    case 1:
      return whyDisabledNeedsPrerequisite("OpenID Connect or SAML 2.0");
    case 2:
      return whyDisabledNeedsPrerequisite("issuer URI from IdP metadata");
    case 3:
      return whyDisabledNeedsPrerequisite("role claim mapping with at least one IdP group");
    case 4:
      return whyDisabledNeedsPrerequisite("a successful test sign-in");
    default:
      return null;
  }
}
