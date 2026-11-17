import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { policyPacksPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** Stable governance hub for pattern-library pack guidance (TB-1813). */
export const PATTERN_LIBRARY_POLICY_PACKS_HUB_PATH = GOVERNANCE_POLICY_PACKS_PATH;

export function resolvePatternLibraryPolicyPacksHubPath(
  productLine: ProductLineId = "architecture",
): string {
  return policyPacksPathForProductLine(productLine);
}

export const PATTERN_LIBRARY_POLICY_RULES_SECTION_TITLE = "Related policy rules (catalog guidance)";

export const PATTERN_LIBRARY_POLICY_RULES_GUIDANCE_LEAD =
  "Sample rule themes from the pattern catalog — not live policy rules assigned in your workspace.";

export const PATTERN_LIBRARY_POLICY_PACKS_GUIDANCE_LEAD =
  "Sample pack names from the pattern catalog — not live policy packs assigned in your workspace. Open the hub to review assigned packs.";

export const PATTERN_LIBRARY_POLICY_PACKS_HUB_LINK_LABEL = "Open policy packs hub";
