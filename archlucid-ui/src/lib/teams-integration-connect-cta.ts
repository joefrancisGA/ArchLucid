export type TeamsConnectCtaPresentation = Readonly<{
  validateVariant: "primary" | "outline";
  testVariant: "primary" | "outline";
  saveVariant: "primary" | "outline";
  saveDisabled: boolean;
  showTestDisabledHelper: boolean;
}>;

/** TB-1176 — Validate → Test → Save hierarchy; Save stays secondary until the secret validates. */
export function resolveTeamsConnectCtaPresentation(input: {
  readonly isConfigured: boolean;
  readonly secretValidated: boolean;
  readonly canMutate: boolean;
  readonly saving: boolean;
  readonly secretNameEmpty: boolean;
  readonly canSendTest: boolean;
}): TeamsConnectCtaPresentation {
  const showTestDisabledHelper =
    input.canMutate && !input.saving && !input.secretNameEmpty && !input.canSendTest;

  if (input.isConfigured) {
    return {
      validateVariant: "outline",
      testVariant: "outline",
      saveVariant: "primary",
      saveDisabled: !input.canMutate || input.saving,
      showTestDisabledHelper,
    };
  }

  return {
    validateVariant: "primary",
    testVariant: "outline",
    saveVariant: "outline",
    saveDisabled: !input.canMutate || input.saving || !input.secretValidated,
    showTestDisabledHelper,
  };
}
