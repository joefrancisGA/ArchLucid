/** Bundled default pack rule-key prefixes (see docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md). */
export type PolicyPackRuleKeyPrefixEntry = {
  readonly prefix: string;
  readonly packDisplayName: string;
};

export const POLICY_PACK_RULE_KEY_PREFIX_CATALOG: readonly PolicyPackRuleKeyPrefixEntry[] = [
  { prefix: "ai-gov", packDisplayName: "AI Governance / Responsible AI" },
  { prefix: "sec-base", packDisplayName: "Security Architecture Baseline" },
  { prefix: "waf-az", packDisplayName: "Azure Well-Architected Framework" },
  { prefix: "lz-caf", packDisplayName: "Azure Landing Zone / Cloud Adoption Framework" },
  { prefix: "gdpr", packDisplayName: "GDPR Compliance Baseline" },
  { prefix: "soc2", packDisplayName: "SOC 2 Type II (Architecture Themes)" },
  { prefix: "cost-opt", packDisplayName: "FinOps & Cloud Cost Optimization" },
  { prefix: "owasp-api", packDisplayName: "OWASP API Security Top 10" },
  { prefix: "iso27001", packDisplayName: "ISO/IEC 27001 ISMS (Architecture Slice)" },
  { prefix: "cis-az", packDisplayName: "CIS Microsoft Azure Foundations Benchmark" },
  { prefix: "hipaa", packDisplayName: "HIPAA / HITECH Safeguards" },
  { prefix: "pci", packDisplayName: "PCI-DSS (Architecture / Segmentation)" },
  { prefix: "zta", packDisplayName: "Zero Trust Architecture" },
  { prefix: "az-dr", packDisplayName: "Azure Resiliency & Disaster Recovery" },
  { prefix: "aks", packDisplayName: "AKS Production Baseline" },
  { prefix: "data-class", packDisplayName: "Data Classification & Lineage" },
  { prefix: "entra-iam", packDisplayName: "Entra ID / IAM Architecture Baseline" },
  { prefix: "az-paas", packDisplayName: "Serverless & PaaS Security (Azure)" },
  { prefix: "nist-csf", packDisplayName: "NIST Cybersecurity Framework 2.0" },
  { prefix: "supply-chain", packDisplayName: "Software Supply Chain & SBOM" },
  { prefix: "dora", packDisplayName: "DORA / DevSecOps Delivery Posture" },
  { prefix: "otel", packDisplayName: "Observability & OpenTelemetry Baseline" },
  { prefix: "az-data", packDisplayName: "Azure SQL / Cosmos DB Data-Layer Security" },
  { prefix: "arc-ampe", packDisplayName: "ARC-AMPE Architecture Themes" },
  { prefix: "rel-base", packDisplayName: "Reliability and Resilience" },
  { prefix: "perf-base", packDisplayName: "Performance and Scalability" },
  { prefix: "ops-base", packDisplayName: "Operational Excellence" },
  { prefix: "sust-base", packDisplayName: "Sustainability and Resource Efficiency" },
  { prefix: "saas-ctrl", packDisplayName: "SaaS Security Controls" },
] as const;

const COMPLIANCE_RULE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)+$/i;

/** Returns a normalized compliance rule key when the input looks like a curated pack rule id. */
export function coerceComplianceRuleKey(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length === 0 || !COMPLIANCE_RULE_KEY_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed.toLowerCase();
}

/** Maps a compliance rule key to a bundled policy pack display name when the prefix is known. */
export function inferPolicyPackDisplayNameFromComplianceRuleKey(
  ruleKey: string | null | undefined,
): string | null {
  const key = coerceComplianceRuleKey(ruleKey);

  if (key === null) {
    return null;
  }

  for (const entry of POLICY_PACK_RULE_KEY_PREFIX_CATALOG) {
    if (key === entry.prefix || key.startsWith(`${entry.prefix}-`)) {
      return entry.packDisplayName;
    }
  }

  return null;
}
