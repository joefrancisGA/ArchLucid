/**
 * Shared mutable fixtures for operate-authority UI shaping Vitest shards.
 */
import { vi } from "vitest";

import { buyerPolishedShellVitestOverride } from "@/testing/buyer-polished-shell-vitest-override";
import { resetGovernanceWorkflowVitestNavigation } from "@/testing/governance-workflow-vitest-navigation";

export const mutateCapability = { current: false };

export const governanceWorkflowVitestNavigation = {
  searchParams: new URLSearchParams(),
};

export const apiHoisted = {
  listPolicyPacks: vi.fn(),
  getEffectivePolicyPacks: vi.fn(),
  getEffectivePolicyContent: vi.fn(),
  listPolicyPackVersions: vi.fn(),
  listAlertsPaged: vi.fn(),
  listAlertsCursor: vi.fn(),
  listAlertRules: vi.fn(),
  listAlertRoutingSubscriptions: vi.fn(),
  listCompositeAlertRules: vi.fn(),
  listApprovalRequests: vi.fn(),
  listPromotions: vi.fn(),
  listActivations: vi.fn(),
  getGovernanceResolution: vi.fn(),
  listDigestSubscriptions: vi.fn(),
  listAdvisorySchedules: vi.fn(),
  listRunsByProjectPaged: vi.fn(),
  simulateAlertRule: vi.fn(),
  getGovernanceDashboard: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
};

export const emptyGovernanceResolutionPayload = {
  tenantId: "t-ui-shape",
  workspaceId: "w-ui-shape",
  projectId: "p-ui-shape",
  effectiveContent: {
    complianceRuleIds: [] as string[],
    complianceRuleKeys: [] as string[],
    alertRuleIds: [] as string[],
    compositeAlertRuleIds: [] as string[],
    advisoryDefaults: {} as Record<string, string>,
    metadata: {} as Record<string, string>,
  },
  decisions: [] as { itemType: string; itemKey: string }[],
  conflicts: [] as { itemType: string; itemKey: string }[],
  notes: [] as string[],
};

export const sampleAlert = {
  alertId: "alert-ui-shape-1",
  ruleId: "rule-1",
  title: "Sample signal",
  category: "Test",
  severity: "High",
  status: "Open",
  triggerValue: "n/a",
  description: "Synthetic row for mutation gate tests.",
  createdUtc: new Date().toISOString(),
};

export const sampleListedRule: import("@/types/alerts").AlertRule = {
  ruleId: "r-ui-simulate",
  tenantId: "t-ui-shape",
  workspaceId: "w-ui-shape",
  projectId: "p-ui-shape",
  name: "Simulate-able rule",
  ruleType: "CriticalRecommendationCount",
  severity: "Warning",
  thresholdValue: 2,
  isEnabled: true,
  targetChannelType: "DigestOnly",
  metadataJson: "{}",
  createdUtc: "2024-01-01T00:00:00Z",
};

export function resetOperateAuthorityVitestFixtures(): void {
  buyerPolishedShellVitestOverride.value = false;
  mutateCapability.current = false;
  resetGovernanceWorkflowVitestNavigation(governanceWorkflowVitestNavigation);
  apiHoisted.listPolicyPacks.mockResolvedValue([]);
  apiHoisted.getEffectivePolicyPacks.mockResolvedValue({
    tenantId: "",
    workspaceId: "",
    projectId: "",
    packs: [],
  });
  apiHoisted.getEffectivePolicyContent.mockResolvedValue({
    complianceRuleIds: [],
    complianceRuleKeys: [],
    alertRuleIds: [],
    compositeAlertRuleIds: [],
    advisoryDefaults: {},
    metadata: {},
  });
  apiHoisted.listPolicyPackVersions.mockResolvedValue([]);
  apiHoisted.listAlertsPaged.mockResolvedValue({ items: [sampleAlert], totalCount: 1 });
  apiHoisted.listAlertsCursor.mockResolvedValue({
    items: [sampleAlert],
    nextCursor: null,
    hasMore: false,
    requestedTake: 25,
  });
  apiHoisted.listAlertRules.mockResolvedValue([]);
  apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([]);
  apiHoisted.listCompositeAlertRules.mockResolvedValue([]);
  apiHoisted.listApprovalRequests.mockResolvedValue([]);
  apiHoisted.listPromotions.mockResolvedValue([]);
  apiHoisted.listActivations.mockResolvedValue([]);
  apiHoisted.getGovernanceResolution.mockResolvedValue(emptyGovernanceResolutionPayload);
  apiHoisted.listDigestSubscriptions.mockResolvedValue([]);
  apiHoisted.listAdvisorySchedules.mockResolvedValue([]);
  apiHoisted.listRunsByProjectPaged.mockResolvedValue({
    items: [{ runId: "gov-ui-shape-run", projectId: "default", description: "UI shape fixture", createdUtc: "" }],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  });
  apiHoisted.getGovernanceDashboard.mockResolvedValue({
    pendingApprovals: [],
    recentDecisions: [],
    recentChanges: [],
    pendingCount: 0,
  });
  apiHoisted.getGovernanceDecisionsNeededSummary.mockResolvedValue({
    pendingApprovals: 0,
    staleRisks: 0,
    unownedHighSeverityRisks: 0,
    findingsAwaitingEvidence: 0,
    waiversExpiringWithin14Days: 0,
    deferredFindingsDue: 0,
    totalDecisionItems: 0,
  });
  apiHoisted.simulateAlertRule.mockResolvedValue({
    ruleKind: "Simple",
    simulatedUtc: "2026-01-01T00:00:00Z",
    evaluatedRunCount: 2,
    matchedCount: 1,
    wouldCreateCount: 1,
    wouldSuppressCount: 0,
    summaryNotes: [] as string[],
    outcomes: [] as import("@/types/alert-simulation").SimulatedAlertOutcome[],
  });
}
