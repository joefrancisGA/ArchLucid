import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";
import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";

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

vi.mock("./planning/_sections/load-planning-page-data", () => {
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

vi.mock("./recommendation-learning/_sections/load-recommendation-learning-page-data", () => ({
  loadRecommendationLearningPageData: () =>
    Promise.resolve({
      kind: "ready" as const,
      profile: null,
      failure: null,
    }),
}));

import { AdvisoryScansContent } from "@/components/advisory/AdvisoryScansContent";
import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import { DigestsBrowseContent } from "@/components/digests/DigestsBrowseContent";
import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";

import AskPage from "./ask/page";
import EvolutionReviewPage from "./evolution-review/page";
import GovernanceResolutionPage from "./governance-resolution/page";
import OnboardingPage from "./onboarding/page";
import PolicyPacksPage from "./policy-packs/page";
import PlanningPage from "./planning/page";
import ProductLearningPage from "./product-learning/page";
import RecommendationLearningPage from "./recommendation-learning/page";
import SearchPage from "./search/page";

/**
 * Render-gate: first paint + import chain for client-only operator pages that had no tests.
 * Does not assert API outcomes (useEffect may run after; fetch errors are caught in-page).
 *
 * Alert surfaces: bodies live in `@/components/alerts/*Content`; the `/alerts` route is the tabbed hub.
 */
describe("operator client pages — render gate", () => {
  it("Alerts inbox content renders primary heading", () => {
    render(<AlertsInboxContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Alerts" })).toBeInTheDocument();
  });

  it("Alert rules content renders primary heading", () => {
    render(<AlertRulesContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Alert rules" })).toBeInTheDocument();
  });

  it("Alert routing content renders primary heading", () => {
    render(<AlertRoutingContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Alert routing" })).toBeInTheDocument();
  });

  it("Alert simulation content renders primary heading", () => {
    render(<AlertSimulationContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Alert rule simulation" })).toBeInTheDocument();
  });

  it("Alert tuning content renders primary heading", () => {
    render(<AlertTuningContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Alert tuning" })).toBeInTheDocument();
  });

  it("Composite alert rules content renders primary heading", () => {
    render(<CompositeAlertRulesContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Composite alert rules" })).toBeInTheDocument();
  });

  it("Advisory hub Scans tab content renders primary heading", () => {
    render(<AdvisoryScansContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Architecture advisory" })).toBeInTheDocument();
  });

  it("Advisory hub Schedules tab content renders primary heading", () => {
    render(<AdvisorySchedulesContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Advisory schedules" })).toBeInTheDocument();
  });

  it("RecommendationLearningPage renders primary heading", async () => {
    const page = await RecommendationLearningPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Recommendation tuning" })).toBeInTheDocument();
  });

  it("ProductLearningPage renders primary heading", () => {
    render(<ProductLearningPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Pilot feedback" })).toBeInTheDocument();
  });

  it("PlanningPage renders primary heading", async () => {
    const page = await PlanningPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Planning" })).toBeInTheDocument();
  });

  it("EvolutionReviewPage renders primary heading", () => {
    render(<EvolutionReviewPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Simulation review" })).toBeInTheDocument();
  });

  it("Digests hub Browse tab content renders primary heading", () => {
    render(<DigestsBrowseContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Architecture digests" })).toBeInTheDocument();
  });

  it("Digests hub Subscriptions tab content renders primary heading", () => {
    render(<DigestSubscriptionsContent />);
    expect(screen.getByRole("heading", { level: 2, name: "Digest subscriptions" })).toBeInTheDocument();
  });

  it("PolicyPacksPage renders primary heading", () => {
    render(<PolicyPacksPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Policy packs" })).toBeInTheDocument();
  });

  it("GovernanceResolutionPage renders primary heading", () => {
    render(<GovernanceResolutionPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Governance resolution" })).toBeInTheDocument();
  });

  it("SearchPage renders primary heading and contextual help", async () => {
    const page = await SearchPage();
    render(page);
    expect(screen.getByRole("heading", { level: 2, name: "Semantic Search" })).toBeInTheDocument();
    expect(screen.getByLabelText(/more information: semantic-search/i)).toBeInTheDocument();
  });

  it("AskPage renders primary heading and contextual help", () => {
    render(<AskPage />);
    expect(screen.getByRole("heading", { level: 2, name: "Ask about a review" })).toBeInTheDocument();
    expect(screen.getByLabelText(/more information: ask-archlucid/i)).toBeInTheDocument();
  });

  it("OnboardingPage renders primary heading", async () => {
    const page = await OnboardingPage({ searchParams: Promise.resolve({}) });
    render(page);
    expect(screen.getByRole("heading", { level: 1, name: "Onboarding" })).toBeInTheDocument();
  });
});
