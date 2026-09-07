import { vi } from "vitest";

vi.mock("@/lib/api/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/http")>();

  return {
    ...actual,
    apiGet: vi.fn(async () => ({ items: [], totalCount: 0 })),
    apiGetJsonWithTrace: vi.fn(async () => ({
      data: { items: [], totalCount: 0 },
      traceId: null,
    })),
    apiPostJson: vi.fn(async () => ({})),
    apiDelete: vi.fn(async () => undefined),
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

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/",
  useRouter: (): { push: () => void; replace: () => void; refresh: () => void } => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
  redirect: vi.fn(),
}));

vi.mock("./insights/improvement-planning/_sections/load-planning-page-data", () => {
  const summary = {
    generatedUtc: "2026-01-01T00:00:00.000Z",
    themeCount: 0,
    planCount: 0,
    totalThemeEvidenceSignals: 0,
    maxPlanPriorityScore: 0,
    totalLinkedSignalsAcrossPlans: 0,
  };

  return {
    loadPlanningPageData: () =>
      Promise.resolve({
        kind: "data" as const,
        summary,
        themes: [],
        plans: [],
        generatedUtc: summary.generatedUtc,
        usedPlanningDemoFallback: false,
        failure: null,
      }),
  };
});

vi.mock("./internal/recommendation-learning/_sections/load-recommendation-learning-ops-page-data", () => ({
  loadRecommendationLearningOpsPageData: () =>
    Promise.resolve({
      kind: "ready" as const,
      status: {
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        environmentName: "Development",
        scopeLabel: "Tenant / Workspace / Project",
        profileState: "NotBuilt",
        eligibleOutcomeCount: 0,
        proposedOutcomeCount: 0,
        minimumRequiredOutcomes: 1,
        rebuildBatchCap: 5000,
        eligibility: {
          accepted: 0,
          rejected: 0,
          deferred: 0,
          implemented: 0,
          proposedExcluded: 0,
          truncatedByBatchCap: 0,
        },
      },
      profile: null,
      history: [],
      failure: null,
    }),
}));

vi.mock("./governance/standards-and-rules/_sections/load-governance-resolution-page-data", () => ({
  loadGovernanceResolutionPageData: () =>
    Promise.resolve({
      data: {
        tenantId: "",
        workspaceId: "",
        projectId: "",
        effectiveContent: {
          complianceRuleIds: [],
          complianceRuleKeys: [],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: {},
        },
        decisions: [],
        conflicts: [],
        notes: [],
      },
      failure: null,
    }),
}));

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

vi.mock("./insights/impact-preview/_sections/load-evolution-review-page-data", () => ({
  loadEvolutionReviewPageData: () =>
    Promise.resolve({
      mode: "live" as const,
      candidates: [],
      selectedId: null,
      detail: null,
      listFailure: null,
      detailFailure: null,
    }),
}));

vi.mock("./internal/product-learning/_sections/load-product-learning-page-data", () => {
  const generatedUtc = "2026-01-01T00:00:00.000Z";
  const bundle = {
    summary: {
      generatedUtc,
      tenantId: "",
      workspaceId: "",
      projectId: "",
      totalSignalsInScope: 0,
      distinctRunsTouched: 0,
      topAggregateCount: 0,
      artifactTrendCount: 0,
      improvementOpportunityCount: 0,
      triageQueueItemCount: 0,
      summaryNotes: [],
    },
    opportunities: { generatedUtc, opportunities: [] },
    trends: { generatedUtc, trends: [] },
    triage: { generatedUtc, items: [] },
  };

  return {
    loadProductLearningPageData: () =>
      Promise.resolve({
        kind: "ready" as const,
        bundle,
        failure: null,
      }),
  };
});
