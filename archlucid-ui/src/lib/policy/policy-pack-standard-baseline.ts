/** Display names for platform default packs enabled at tenant provisioning (matches DefaultPolicyPackCatalog). */
export const STANDARD_BASELINE_POLICY_PACK_DISPLAY_NAMES = new Set<string>([
  "Security Architecture Baseline",
  "Reliability and Resilience",
  "FinOps & Cloud Cost Optimization",
  "Performance and Scalability",
  "Operational Excellence",
  "Sustainability and Resource Efficiency",
  "AI Governance / Responsible AI",
  "Zero Trust Architecture",
  "Azure Well-Architected Framework",
  "CIS Microsoft Azure Foundations Benchmark",
  "AWS Well-Architected Framework",
  "CIS AWS Foundations Benchmark",
  "AWS IAM / Identity Center Architecture Baseline",
  "AWS Landing Zone / Control Tower",
  "Google Cloud Architecture Framework",
  "CIS Google Cloud Platform Foundation Benchmark",
  "GCP Cloud IAM Architecture Baseline",
  "GCP Landing Zone / Resource Hierarchy",
]);

export function isStandardBaselinePolicyPackName(name: string): boolean {
  return STANDARD_BASELINE_POLICY_PACK_DISPLAY_NAMES.has(name.trim());
}
