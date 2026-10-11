import type { SecureNowEditionId } from "@/lib/product-line/securenow-edition-id";

const GENERIC_FEATURED_FRAMEWORK_IDS = [
  "nist-800-53-r5-architecture",
  "owasp-asvs-architecture",
  "microsoft-cloud-security-benchmark",
  "security-architecture-baseline",
  "cis-azure-foundations",
  "nist-csf-2-architecture",
] as const;

export function featuredSecureNowFrameworkIds(
  edition: SecureNowEditionId,
): readonly string[] {
  switch (edition) {
    case "generic":
      return GENERIC_FEATURED_FRAMEWORK_IDS;
    case "uhg":
      return ["arc-ampe-architecture-themes", ...GENERIC_FEATURED_FRAMEWORK_IDS];
    default: {
      const exhaustiveEdition: never = edition;

      return exhaustiveEdition;
    }
  }
}

export function sortFeaturedSecureNowFrameworks<T extends { readonly policyPackId?: string | null }>(
  items: readonly T[],
  edition: SecureNowEditionId,
): T[] {
  const order = featuredSecureNowFrameworkIds(edition);
  const rank = new Map(order.map((id, index) => [id, index]));

  return items
    .filter((item) => item.policyPackId !== null && item.policyPackId !== undefined && rank.has(item.policyPackId))
    .sort((left, right) => rank.get(left.policyPackId!)! - rank.get(right.policyPackId!)!);
}
