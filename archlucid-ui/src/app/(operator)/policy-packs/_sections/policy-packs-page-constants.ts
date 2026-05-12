export const PACK_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "BuiltIn", label: "Built-in template" },
  { value: "TenantCustom", label: "Tenant custom" },
  { value: "WorkspaceCustom", label: "Workspace custom" },
  { value: "ProjectCustom", label: "Project custom" },
];

export const DEFAULT_CONTENT = `{
  "complianceRuleIds": [],
  "complianceRuleKeys": [],
  "alertRuleIds": [],
  "compositeAlertRuleIds": [],
  "advisoryDefaults": {},
  "metadata": {}
}`;

export const VERTICAL_POLICY_PACK_IMPORTS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: "financial-services", label: "Financial services" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "retail", label: "Retail / PCI" },
  { slug: "saas", label: "SaaS / SOC 2" },
  { slug: "public-sector", label: "Public sector (EU)" },
  { slug: "ai-llm", label: "AI / LLM workload" },
];
