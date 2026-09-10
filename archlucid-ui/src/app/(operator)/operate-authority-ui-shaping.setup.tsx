/**
 * Shared Vitest setup for operate-authority UI shaping shards.
 * Import this file first in each shard so hoisted mocks apply before page imports.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, vi } from "vitest";

import { extendBuyerPolishedShellVitestMock } from "@/testing/buyer-polished-shell-vitest-override";

import {
  apiHoisted,
  governanceWorkflowVitestNavigation,
  mutateCapability,
  resetOperateAuthorityVitestFixtures,
} from "./operate-authority-ui-shaping.fixtures";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: (): boolean => mutateCapability.current,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/hooks/use-advisory-schedule-review-availability", () => ({
  useAdvisoryScheduleReviewAvailability: () => ({
    loading: false,
    hasFinalizedReviews: true,
    finalizedCount: 1,
  }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();
  const { AUTHORITY_RANK } = await import("@/lib/nav-authority");

  return {
    ...mod,
    useNavCallerAuthorityRank: (): number =>
      mutateCapability.current ? AUTHORITY_RANK.ExecuteAuthority : AUTHORITY_RANK.ReadAuthority,
  };
});

vi.mock("@/lib/use-nav-surface", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/use-nav-surface")>();
  const { AUTHORITY_RANK } = await import("@/lib/nav-authority");

  return {
    ...mod,
    useNavSurface: (routeKey: import("@/lib/layer-guidance").LayerGuidancePageKey) => {
      const callerRank = mutateCapability.current ? AUTHORITY_RANK.ExecuteAuthority : AUTHORITY_RANK.ReadAuthority;
      const real = mod.composeNavSurface(routeKey, callerRank, true);

      return { ...real, mutationCapability: mutateCapability.current };
    },
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: (): string => "/alerts",
    useRouter: (): { push: () => void; replace: () => void } => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: (): URLSearchParams => governanceWorkflowVitestNavigation.searchParams,
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/operator/operator-static-demo", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator/operator-static-demo")>();

  return {
    ...mod,
    isStaticDemoPayloadFallbackEnabled: (): boolean => false,
  };
});

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...mod,
    listPolicyPacks: apiHoisted.listPolicyPacks,
    getEffectivePolicyPacks: apiHoisted.getEffectivePolicyPacks,
    getEffectivePolicyContent: apiHoisted.getEffectivePolicyContent,
    listPolicyPackVersions: apiHoisted.listPolicyPackVersions,
    listAlertsPaged: apiHoisted.listAlertsPaged,
    listAlertsCursor: apiHoisted.listAlertsCursor,
    listAlertRules: apiHoisted.listAlertRules,
    listAlertRoutingSubscriptions: apiHoisted.listAlertRoutingSubscriptions,
    listCompositeAlertRules: apiHoisted.listCompositeAlertRules,
    listApprovalRequests: apiHoisted.listApprovalRequests,
    listPromotions: apiHoisted.listPromotions,
    listActivations: apiHoisted.listActivations,
    getGovernanceResolution: apiHoisted.getGovernanceResolution,
    listDigestSubscriptions: apiHoisted.listDigestSubscriptions,
    listAdvisorySchedules: apiHoisted.listAdvisorySchedules,
    listRunsByProjectPaged: apiHoisted.listRunsByProjectPaged,
    simulateAlertRule: apiHoisted.simulateAlertRule,
    getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
    getGovernanceDecisionsNeededSummary: apiHoisted.getGovernanceDecisionsNeededSummary,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./governance/_sections/governance-workflow-deferred-chunks", async () => {
  const { buildGovernanceWorkflowDeferredChunksVitestMock } = await import(
    "@/testing/governance-workflow-deferred-chunks-vitest-mock"
  );

  return await buildGovernanceWorkflowDeferredChunksVitestMock();
});

vi.mock("./governance/policy-packs/_sections/load-policy-packs-page-data", () => ({
  loadPolicyPacksPageData: () =>
    Promise.resolve({
      packs: [],
      effective: { tenantId: "", workspaceId: "", projectId: "", packs: [] },
      effectiveContent: {
        complianceRuleIds: [],
        complianceRuleKeys: [],
        alertRuleIds: [],
        compositeAlertRuleIds: [],
        advisoryDefaults: {},
        metadata: {},
      },
      failure: null,
    }),
}));

beforeEach(() => {
  resetOperateAuthorityVitestFixtures();
});

export async function expandPolicyPacksAuthoringTools(): Promise<void> {
  const toggle = screen.getByRole("button", { name: /^Authoring and generation tools$/ });

  fireEvent.click(toggle);

  await waitFor(
    () => {
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    },
    { timeout: 8000 },
  );
}

export async function expandPolicyPacksAdvancedOptions(): Promise<void> {
  const toggle = screen.getByRole("button", { name: /^Inspect tools and JSON lifecycle$/ });

  fireEvent.click(toggle);

  await waitFor(
    () => {
      expect(toggle).toHaveAttribute("aria-expanded", "true");
    },
    { timeout: 8000 },
  );
}
