/** Buyer-facing vocabulary for first-pilot surfaces — lead with architecture review. */
export const FIRST_PILOT_BUYER_COPY = {
  architectureReview: "architecture review",
  sampleArchitectureReview: "sample architecture review",
  proofPipelineAction: "Collect the first-pilot proof pipeline",
  governanceDryRun: "policy-pack governance dry-run",
  ingestEvidenceWithoutUpload:
    "Upload an Azure extractor ZIP or open the sample package for a sample architecture review without customer upload.",
} as const;

/** Returns true when buyer-facing copy leads with architecture-review language. */
export function buyerFacingCopyLeadsWithArchitectureReview(text: string): boolean {
  return text.toLowerCase().includes("architecture review");
}
