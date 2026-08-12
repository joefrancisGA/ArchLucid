import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";
import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertSimulationTuningSection } from "@/components/alerts/AlertSimulationTuningSection";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";

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

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { ADVISORY_SCANS_FORM_SECTION_TITLE } from "@/lib/advisory-copy";
import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import { DigestsBrowseContent } from "@/components/digests/DigestsBrowseContent";
import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";

import AskPage from "./insights/ask-review-questions/page";
import EvolutionReviewPage from "./insights/impact-preview/page";
import GovernanceResolutionPage from "./governance/standards-and-rules/page";
import OnboardingPage from "./architecture/first-review-guide/page";
import PolicyPacksPage from "./governance/policy-packs/page";
import PlanningPage from "./insights/improvement-planning/page";
import ProductLearningPage from "./internal/product-learning/page";
import RecommendationLearningOpsPage from "./internal/recommendation-learning/page";
import SearchPage from "./insights/search-review-evidence/page";

/**
 * Render-gate: first paint + import chain for client-only operator pages that had no tests.
 * Does not assert API outcomes (useEffect may run after; fetch errors are caught in-page).
 *
 * Alert surfaces: bodies live in `@/components/alerts/*Content`; the `/alerts` route is the tabbed hub.
 */
describe("operator client pages — render gate", () => {
  it("Alerts inbox content renders when workspace context is still loading", () => {
    render(<AlertsInboxContent />);
    expect(screen.getByTestId("alerts-inbox-summary-row")).toBeInTheDocument();
  });

  it("Alert rules content renders without a duplicate hub page-title h2 (TB-1584)", () => {
    render(<AlertRulesContent />);
    expect(screen.queryByRole("heading", { level: 2, name: "Alert conditions" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Alert conditions" })).toBeInTheDocument();
  });

  it("Alert routing content renders primary heading", () => {
    render(<AlertRoutingContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Notification delivery" })).toBeInTheDocument();
  });

  it("Alert simulation content demotes duplicate hub page title to h3 (TB-1589)", () => {
    render(<AlertSimulationContent />);
    expect(screen.queryByRole("heading", { level: 2, name: "Simulate alerts" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Simulate alerts" })).toBeInTheDocument();
  });

  it("Alert simulation tuning section demotes dual h2 under hub tab (TB-1589)", () => {
    render(<AlertSimulationTuningSection />);
    expect(screen.queryByRole("heading", { level: 2, name: "Simulate alerts" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Tune alert thresholds" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Simulate alerts" })).toBeInTheDocument();
    expect(screen.getByTestId("alert-test-tune-disclosure")).toBeInTheDocument();
  });

  it("Composite alert rules content does not duplicate hub page title as h2 (TB-1579)", () => {
    render(<CompositeAlertRulesContent />);
    expect(screen.queryByRole("heading", { level: 2, name: "Advanced alert rules" })).not.toBeInTheDocument();
  });

  // Empty-first UX (TB-1567): the Scans tab opens on the next-story CTAs, so the generate form
  // heading (h3 under the hub page title) only mounts after Choose review.
  it("Advisory hub Scans tab content renders primary heading", () => {
    renderWithOperatorQuery(<AdvisoryScansContent />);

    fireEvent.click(screen.getByTestId("advisory-choose-review-cta"));

    expect(screen.getByRole("heading", { level: 3, name: ADVISORY_SCANS_FORM_SECTION_TITLE })).toBeInTheDocument();
  });

  it("Advisory hub Schedules tab content renders primary heading", () => {
    render(<AdvisorySchedulesContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Schedule advisory scans" })).toBeInTheDocument();
  });

  it("RecommendationLearningOpsPage renders primary heading", async () => {
    const page = await RecommendationLearningOpsPage();
    render(page);
    expect(screen.getByRole("heading", { level: 1, name: "Recommendation learning" })).toBeInTheDocument();
  });

  it("ProductLearningPage renders primary heading", async () => {
    const page = await ProductLearningPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Review feedback" })).toBeInTheDocument();
  });

  it("PlanningPage renders primary heading", async () => {
    const page = await PlanningPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Improvement planning" })).toBeInTheDocument();
  });

  it("PlanningPage does not render internal codename '59R' in user-visible output", async () => {
    const page = await PlanningPage();
    render(page);
    expect(document.body.textContent).not.toContain("59R");
  });

  it("EvolutionReviewPage renders primary heading", async () => {
    const page = await EvolutionReviewPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Impact preview" })).toBeInTheDocument();
  });

  it("EvolutionReviewPage does not render internal codename '60R' in user-visible output", async () => {
    const page = await EvolutionReviewPage();
    render(page);
    expect(document.body.textContent).not.toContain("60R");
  });

  it("Digests hub Browse tab content renders primary heading", () => {
    renderWithOperatorQuery(<DigestsBrowseContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Architecture digests" })).toBeInTheDocument();
  });

  it("Digests hub Subscriptions tab content renders primary heading", () => {
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);
    expect(screen.getByRole("heading", { level: 2, name: "Delivery destinations" })).toBeInTheDocument();
  });

  it("PolicyPacksPage renders primary heading", async () => {
    const page = await PolicyPacksPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Policy packs" })).toBeInTheDocument();
  });

  it("GovernanceResolutionPage renders primary heading", async () => {
    const page = await GovernanceResolutionPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Standards & rules" })).toBeInTheDocument();
  });

  it("SearchPage renders primary heading without heading-level contextual help", async () => {
    const page = await SearchPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Search review evidence" })).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
  });

  it("AskPage renders primary heading without heading-level contextual help", async () => {
    const page = await AskPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Evidence-backed review questions" })).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
  });

  it("OnboardingPage renders primary heading", async () => {
    const page = await OnboardingPage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByRole("heading", { level: 1, name: "First review guide" })).toBeInTheDocument();
  });
});
