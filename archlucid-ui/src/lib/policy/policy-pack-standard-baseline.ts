/** Display names for platform default packs enabled at tenant provisioning (matches DefaultPolicyPackCatalog). */
export const STANDARD_BASELINE_POLICY_PACK_DISPLAY_NAMES = new Set<string>([
  "Azure Well-Architected Framework",
  "FinOps & Cloud Cost Optimization",
  "AI Governance / Responsible AI",
  "CIS Microsoft Azure Foundations Benchmark",
  "Zero Trust Architecture",
]);

export function isStandardBaselinePolicyPackName(name: string): boolean {
  return STANDARD_BASELINE_POLICY_PACK_DISPLAY_NAMES.has(name.trim());
}
