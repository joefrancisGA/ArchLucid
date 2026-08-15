export const REVIEW_STANDARDS_CONFIRM_LABEL =
  "I confirm the review standards selected above match the bar I want for this package.";

export const REVIEW_STANDARDS_CONFIRM_GAP =
  "Confirm the review standards before starting analysis.";

export const POLICY_PACK_CLOUD_MISMATCH_MESSAGE =
  "Selected policy packs may not match the stated cloud target. Adjust packs or cloud target before starting.";

/** TB-2306: focused scope default is not a silent choice — operator must confirm. */
export function isReviewStandardsConfirmSatisfied(confirmed: boolean): boolean {
  return confirmed;
}

/** TB-2322: Azure packs on AWS target (and similar) produce the wrong governance bar. */
export function evaluatePolicyPackCloudMismatch(
  cloudProvider: string | null | undefined,
  policyReferences: readonly string[],
): string | null {
  const cloud = (cloudProvider ?? "None").trim().toLowerCase();
  const refs = policyReferences.map((ref) => ref.trim().toLowerCase()).filter((ref) => ref.length > 0);

  if (refs.length === 0) {
    return null;
  }

  const mentionsAzurePack = refs.some((ref) => ref.includes("azure") || ref.includes("cis-azure"));
  const mentionsAwsPack = refs.some((ref) => ref.includes("aws"));
  const mentionsGcpPack = refs.some((ref) => ref.includes("gcp") || ref.includes("google"));

  if (cloud === "aws" && mentionsAzurePack && !mentionsAwsPack) {
    return "Azure-focused policy packs are selected while the cloud target is AWS.";
  }

  if (cloud === "gcp" && mentionsAzurePack && !mentionsGcpPack) {
    return "Azure-focused policy packs are selected while the cloud target is Google Cloud.";
  }

  if (cloud === "none" && (mentionsAzurePack || mentionsAwsPack || mentionsGcpPack)) {
    return "Cloud-specific policy packs are selected while the architecture is cloud-neutral.";
  }

  return null;
}
