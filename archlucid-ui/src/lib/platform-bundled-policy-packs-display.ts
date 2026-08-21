export type PlatformBundledPolicyPackCategory =
  | "all"
  | "aws"
  | "azure"
  | "gcp"
  | "regulatory"
  | "security"
  | "general";

export const PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS: ReadonlyArray<{
  value: PlatformBundledPolicyPackCategory;
  label: string;
}> = [
  { value: "all", label: "All categories" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "gcp", label: "GCP" },
  { value: "regulatory", label: "Regulatory" },
  { value: "security", label: "Security" },
  { value: "general", label: "General" },
];

export function formatPlatformBundledPolicyPackUtc(iso: string | null | undefined): string {
  if (iso == null || iso.trim().length === 0) {
    return " — ";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return " — ";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

/** Client-side category facet from bundled manifest filename (no OpenAPI metadata). */
export function derivePlatformBundledPolicyPackCategory(bundleContentFile: string): PlatformBundledPolicyPackCategory {
  const normalized = bundleContentFile.toLowerCase().replace(/\.json$/, "");

  if (normalized.startsWith("aws-") || normalized.startsWith("eks-")) {
    return "aws";
  }

  if (
    normalized.startsWith("azure-") ||
    normalized.startsWith("entra-") ||
    normalized.startsWith("aks-") ||
    normalized.includes("arc-ampe")
  ) {
    return "azure";
  }

  if (normalized.startsWith("gcp-") || normalized.startsWith("gke-")) {
    return "gcp";
  }

  if (
    normalized.includes("gdpr") ||
    normalized.includes("pci") ||
    normalized.includes("hipaa") ||
    normalized.includes("soc2") ||
    normalized.includes("iso27001") ||
    normalized.includes("nist") ||
    normalized.includes("dora")
  ) {
    return "regulatory";
  }

  if (
    normalized.includes("security") ||
    normalized.includes("owasp") ||
    normalized.includes("zero-trust") ||
    normalized.startsWith("cis-")
  ) {
    return "security";
  }

  return "general";
}

export function platformBundledPolicyPackCategoryLabel(category: PlatformBundledPolicyPackCategory): string {
  const match = PLATFORM_BUNDLED_POLICY_PACK_CATEGORY_OPTIONS.find((option) => option.value === category);

  return match?.label ?? category;
}
