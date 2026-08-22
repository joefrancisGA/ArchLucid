/** Buyer-facing vocabulary for first-pilot surfaces — lead with architecture review. */
export const FIRST_PILOT_BUYER_COPY = {
  architectureReview: "architecture review",
  sampleArchitectureReview: "example architecture review",
  proofPipelineAction: "Generate the proof export for sign-off review",
  governanceDryRun: "preview policy checks against the policy pack",
  ingestEvidenceWithoutUpload:
    "Add a brief, documents, diagrams, or IaC — or upload a cloud inventory ZIP (AWS, Azure, or GCP) for production-faithful evidence. Open the example package to preview outputs before your own upload.",
} as const;

/** Returns true when buyer-facing copy leads with architecture-review language. */
export function buyerFacingCopyLeadsWithArchitectureReview(text: string): boolean {
  return text.toLowerCase().includes("architecture review");
}
