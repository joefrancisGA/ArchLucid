export type SlackAddDestinationCtaPresentation = Readonly<{
  testVariant: "primary" | "outline";
  saveVariant: "primary" | "outline";
  saveDisabled: boolean;
  showSaveDisabledHelper: boolean;
}>;

/** TB-1190 — Test → Save hierarchy; Save stays secondary until a form dry-run succeeds. */
export function resolveSlackAddDestinationCtaPresentation(input: {
  readonly formTestSucceeded: boolean;
  readonly canMutate: boolean;
  readonly loading: boolean;
  readonly testingForm: boolean;
}): SlackAddDestinationCtaPresentation {
  const showSaveDisabledHelper =
    input.canMutate && !input.loading && !input.testingForm && !input.formTestSucceeded;

  if (input.formTestSucceeded) {
    return {
      testVariant: "outline",
      saveVariant: "primary",
      saveDisabled: !input.canMutate || input.loading,
      showSaveDisabledHelper: false,
    };
  }

  return {
    testVariant: "primary",
    saveVariant: "outline",
    saveDisabled: !input.canMutate || input.loading || !input.formTestSucceeded,
    showSaveDisabledHelper,
  };
}
