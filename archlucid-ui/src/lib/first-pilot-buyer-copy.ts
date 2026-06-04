/** Buyer-facing vocabulary for first-pilot surfaces — lead with architecture review. */
export const FIRST_PILOT_BUYER_COPY = {
  architectureReview: "architecture review",
  sampleArchitectureReview: "example architecture review",
  proofPipelineAction: "Generate the proof package for sign-off review",
  governanceDryRun: "preview governance checks against the policy pack",
  ingestEvidenceWithoutUpload:
    "Upload an Azure extractor ZIP or open the example package to preview outputs before your own upload.",
} as const;

/** Returns true when buyer-facing copy leads with architecture-review language. */
export function buyerFacingCopyLeadsWithArchitectureReview(text: string): boolean {
  return text.toLowerCase().includes("architecture review");
}
