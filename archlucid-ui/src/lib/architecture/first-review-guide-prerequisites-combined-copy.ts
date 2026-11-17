import { FIRST_REVIEW_GUIDE_SAMPLE_SPINE_NOT_TENANT_SEAL_LINE } from "@/lib/architecture/first-review-guide-sample-spine-prerequisites-copy";

export function formatFirstReviewGuidePrerequisitesCombinedHelper(input: {
  readonly sealLine: string;
  readonly walkthroughStepTitle: string | null;
  readonly sampleSpineActive?: boolean;
}): string {
  const seal = input.sealLine.trim();
  const sampleSuffix = input.sampleSpineActive === true ? ` ${FIRST_REVIEW_GUIDE_SAMPLE_SPINE_NOT_TENANT_SEAL_LINE}` : "";

  if (input.walkthroughStepTitle === null || input.walkthroughStepTitle.trim().length === 0) {
    return `${seal}${sampleSuffix}`;
  }

  return `${seal}${sampleSuffix} Continue the walkthrough: ${input.walkthroughStepTitle.trim()}.`;
}