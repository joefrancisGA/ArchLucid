import type { PlatformBundledPolicyPackRegistryEntry } from "@/types/policy-packs";

/** Curated registry rows for IPL al-ui-rate screenshots when admin API is unavailable. */
export const WORKBOOK_PLATFORM_BUNDLED_POLICY_PACKS_DEMO_ROWS: readonly PlatformBundledPolicyPackRegistryEntry[] = [
  {
    bundleContentFile: "demo-enterprise-privacy-pack.json",
    displayName: "Enterprise privacy pack",
    isGloballyActive: true,
    updatedUtc: "2026-01-15T12:00:00Z",
  },
  {
    bundleContentFile: "ai-governance-responsible-ai-v1.json",
    displayName: "Responsible AI governance",
    isGloballyActive: true,
    updatedUtc: "2026-01-10T08:00:00Z",
  },
  {
    bundleContentFile: "aws-waf.json",
    displayName: "AWS Well-Architected Framework",
    isGloballyActive: false,
    updatedUtc: "2025-12-01T00:00:00Z",
  },
] as const;

export function tryWorkbookPlatformBundledPolicyPacksDemoFallback(): PlatformBundledPolicyPackRegistryEntry[] | null {
  return [...WORKBOOK_PLATFORM_BUNDLED_POLICY_PACKS_DEMO_ROWS];
}
