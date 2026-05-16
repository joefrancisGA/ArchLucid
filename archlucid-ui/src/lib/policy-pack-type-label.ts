/**
 * Display labels for {@link PolicyPack.packType} values returned by the API.
 * Keep aligned with server `ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackType`.
 */
export const POLICY_PACK_TYPE_PLATFORM_DEFAULT = "PlatformDefault";

/**
 * Buyer-facing label for the policy-pack list and metrics strip.
 */
export function policyPackTypeDisplayLabel(packTypeRaw: string): string {
  const t = packTypeRaw.trim();

  if (t.length === 0) {
    return "—";
  }

  switch (t) {
    case POLICY_PACK_TYPE_PLATFORM_DEFAULT:
      return "Bundled default (platform)";

    case "BuiltIn":
      return "Built-in template";

    case "TenantCustom":
      return "Tenant custom";

    case "WorkspaceCustom":
      return "Workspace custom";

    case "ProjectCustom":
      return "Project custom";

    default:
      return t;
  }
}

/**
 * Seeded first-party bundles use {@link POLICY_PACK_TYPE_PLATFORM_DEFAULT}; republish is blocked server-side (and masked in UI).
 */
export function isBundledPlatformDefaultPackType(packTypeRaw: string | undefined): boolean {
  return (packTypeRaw ?? "").trim() === POLICY_PACK_TYPE_PLATFORM_DEFAULT;
}
