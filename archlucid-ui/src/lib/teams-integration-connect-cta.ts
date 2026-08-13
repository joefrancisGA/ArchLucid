export type TeamsConnectCtaPresentation = Readonly<{
  validateVariant: "primary" | "outline";
  testVariant: "primary" | "outline";
  saveVariant: "primary" | "outline";
  saveDisabled: boolean;
  showTestDisabledHelper: boolean;
  showSaveDisabledHelper: boolean;
}>;

/** TB-1176 — Validate → Test → Save hierarchy; one primary action per connect state. */
export function resolveTeamsConnectCtaPresentation(input: {
  readonly isConfigured: boolean;
  readonly secretValidated: boolean;
  readonly testSucceeded: boolean;
  readonly canMutate: boolean;
  readonly saving: boolean;
  readonly secretNameEmpty: boolean;
  readonly canSendTest: boolean;
}): TeamsConnectCtaPresentation {
  const showTestDisabledHelper =
    input.canMutate && !input.saving && !input.secretNameEmpty && !input.canSendTest;
  const showSaveDisabledHelper =
    input.canMutate &&
    !input.saving &&
    !input.secretNameEmpty &&
    !input.isConfigured &&
    !input.secretValidated;

  if (input.isConfigured) {
    return {
      validateVariant: "outline",
      testVariant: "outline",
      saveVariant: "primary",
      saveDisabled: !input.canMutate || input.saving,
      showTestDisabledHelper,
      showSaveDisabledHelper: false,
    };
  }

  if (!input.secretValidated) {
    return {
      validateVariant: "primary",
      testVariant: "outline",
      saveVariant: "outline",
      saveDisabled: !input.canMutate || input.saving || !input.secretValidated,
      showTestDisabledHelper,
      showSaveDisabledHelper,
    };
  }

  if (!input.testSucceeded) {
    return {
      validateVariant: "outline",
      testVariant: "primary",
      saveVariant: "outline",
      saveDisabled: !input.canMutate || input.saving || !input.secretValidated,
      showTestDisabledHelper: false,
      showSaveDisabledHelper: false,
    };
  }

  return {
    validateVariant: "outline",
    testVariant: "outline",
    saveVariant: "primary",
    saveDisabled: !input.canMutate || input.saving,
    showTestDisabledHelper: false,
    showSaveDisabledHelper: false,
  };
}
