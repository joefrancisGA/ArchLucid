export function formatFirstReviewGuidePrerequisitesCombinedHelper(input: {
  readonly sealLine: string;
  readonly walkthroughStepTitle: string | null;
}): string {
  const seal = input.sealLine.trim();

  if (input.walkthroughStepTitle === null || input.walkthroughStepTitle.trim().length === 0) {
    return seal;
  }

  return `${seal} Continue the walkthrough: ${input.walkthroughStepTitle.trim()}.`;
}