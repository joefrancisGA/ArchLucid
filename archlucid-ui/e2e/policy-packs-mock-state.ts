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
  tenantId: string;
  workspaceId: string;
  projectId: string;
  name: string;
  packType: string;
  distributionScope: string;
  status: string;
  description: string;
  createdUtc: string;
  currentVersion: string;
};

const defaultEffectiveContent = {
  complianceRuleIds: [] as string[],
  complianceRuleKeys: [] as string[],
  alertRuleIds: [] as string[],
  compositeAlertRuleIds: [] as string[],
  advisoryDefaults: {} as Record<string, string>,
  metadata: {} as Record<string, string>,
};

const E2E_POLICY_PACK_ID = "e2e-policy-pack-001";
const E2E_POLICY_PACK_VERSION = "1.0.0";

export function listMockPacks(): MockPolicyPack[] {
  return [
    {
      policyPackId: E2E_POLICY_PACK_ID,
      tenantId: "e2e-tenant",
      workspaceId: "e2e-workspace",
      projectId: "default",
      name: "E2E Policy Pack",
      packType: "Custom",
      distributionScope: "Workspace",
      status: "Active",
      description: "Fixture pack for mock E2E policy pack detail shell.",
      createdUtc: "2026-01-01T00:00:00.000Z",
      currentVersion: E2E_POLICY_PACK_VERSION,
    },
  ];
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
  if (policyPackId !== E2E_POLICY_PACK_ID) {
    return [];
  }

  return [
    {
      policyPackVersionId: `${policyPackId}-${E2E_POLICY_PACK_VERSION}`,
      policyPackId,
      version: E2E_POLICY_PACK_VERSION,
      contentJson: JSON.stringify(getMockEffectiveContent()),
      createdUtc: "2026-01-01T00:00:00.000Z",
      isPublished: true,
    },
  ];
}

export function getMockEffectivePacks(): { packs: { policyPackId: string; version: string }[] } {
  return {
    packs: [{ policyPackId: E2E_POLICY_PACK_ID, version: E2E_POLICY_PACK_VERSION }],
  };
}

export function getMockEffectiveContent(): typeof defaultEffectiveContent {
  return { ...defaultEffectiveContent };
}
