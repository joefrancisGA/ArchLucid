/**
 * Read-only fixtures for the mock E2E suite's `/policy-packs` page renders.
 *
 * Mock E2E builds force `NEXT_PUBLIC_DEMO_MODE=true` / `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true`, so the buyer-polished
 * page hides operator-only Create/Publish/Assign controls and overlays static demo packs via
 * `mergePolicyPacksStateWithStaticDemo` regardless of what these endpoints return. Live lifecycle mutations are
 * covered by `live-api-policy-pack-lifecycle.spec.ts` against a real ArchLucid.Api.
 */

export type MockPolicyPack = {
  policyPackId: string;
  name: string;
  packType: string;
  status: string;
  currentVersion: string;
  description: string;
};

const defaultEffectiveContent = {
  complianceRuleIds: [] as string[],
  complianceRuleKeys: [] as string[],
  alertRuleIds: [] as string[],
  compositeAlertRuleIds: [] as string[],
  advisoryDefaults: {} as Record<string, string>,
  metadata: {} as Record<string, string>,
};

export function listMockPacks(): MockPolicyPack[] {
  return [];
}

/** Matches `PolicyPackVersion` fields the policy-packs UI reads (ids, labels, compare dropdowns). */
export function listMockVersions(policyPackId: string): {
  policyPackVersionId: string;
  policyPackId: string;
  version: string;
  contentJson: string;
  createdUtc: string;
  isPublished: boolean;
}[] {
  // Buyer-polished page does not enumerate per-pack versions; signature retained for the route handler.
  void policyPackId;

  return [];
}

export function getMockEffectivePacks(): { packs: { policyPackId: string; version: string }[] } {
  return { packs: [] };
}

export function getMockEffectiveContent(): typeof defaultEffectiveContent {
  return { ...defaultEffectiveContent };
}
